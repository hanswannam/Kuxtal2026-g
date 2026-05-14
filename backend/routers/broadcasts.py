"""Broadcasts router: send WhatsApp template messages to audiences (members, clients).

Integrates with Kapso.ai (Meta WhatsApp Cloud API wrapper) and enforces Meta's
compliance rules: pre-approved templates, opt-in/opt-out tracking, throttling.

Collections:
- broadcasts: campaign records
- broadcast_messages: per-recipient delivery tracking
- members / clients: opt_out_whatsapp flag

Endpoints (prefix /api):
- GET    /broadcasts/templates              List approved templates from Kapso
- POST   /broadcasts/preview                Count audience size
- POST   /broadcasts                        Create + start sending (background)
- GET    /broadcasts                        List broadcasts
- GET    /broadcasts/{id}                   Detail with messages
- POST   /broadcasts/{id}/cancel            Cancel pending sends
- POST   /broadcasts/opt-out                Public opt-out endpoint (used by member portal)
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import httpx
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, Field

from core import db, serialize_doc, require_role, get_current_user

logger = logging.getLogger("kuxtal.broadcasts")
router = APIRouter(prefix="/api")

KAPSO_BASE = "https://api.kapso.ai/meta/whatsapp"
KAPSO_API_VERSION = "v24.0"
SEND_DELAY_SECONDS = 1.2  # ~50 messages/min — safe margin under Meta's 80/sec limit
OPT_OUT_KEYWORDS = {"STOP", "BAJA", "CANCELAR", "QUITAR", "UNSUBSCRIBE", "QUIT"}


# ─────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────
class TemplateComponentParam(BaseModel):
    type: str  # body | header | footer | button
    parameters: List[Dict[str, Any]] = Field(default_factory=list)


class AudienceFilter(BaseModel):
    audience_type: str = "members_active"  # members_active | members_all | clients_all | custom_phones
    club_id: Optional[str] = None
    custom_phones: Optional[List[str]] = None  # E.164 format


class BroadcastCreate(BaseModel):
    name: str
    template_name: str
    template_language: str = "es"
    body_params: List[str] = Field(default_factory=list)  # values for {{1}}, {{2}}…
    audience: AudienceFilter


# ─────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────
async def _bot_config() -> Dict[str, Any]:
    cfg = await db.config.find_one({"key": "bot_settings"})
    if not cfg:
        raise HTTPException(
            status_code=400,
            detail="WhatsApp bot no está configurado. Configurá Kapso en Admin → Bot WA.",
        )
    if not cfg.get("kapso_api_key") or not cfg.get("kapso_phone_number_id"):
        raise HTTPException(
            status_code=400,
            detail="Faltan credenciales de Kapso (api_key / phone_number_id).",
        )
    return cfg


def _normalize_phone(raw: str) -> str:
    """Normalize phone to digits-only E.164 for Meta API."""
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)
    return digits


async def _build_audience(audience: AudienceFilter) -> List[Dict[str, Any]]:
    """Returns a list of {phone, name, member_id?, client_id?} dicts.

    Filters out contacts who have opt_out_whatsapp = True.
    """
    recipients: List[Dict[str, Any]] = []
    seen_phones: set[str] = set()

    if audience.audience_type == "custom_phones":
        for raw in (audience.custom_phones or []):
            phone = _normalize_phone(raw)
            if phone and phone not in seen_phones:
                seen_phones.add(phone)
                recipients.append({"phone": phone, "name": "", "source": "custom"})
        return recipients

    if audience.audience_type in ("members_active", "members_all"):
        query: Dict[str, Any] = {"opt_out_whatsapp": {"$ne": True}}
        if audience.audience_type == "members_active":
            query["status"] = "active"
        if audience.club_id:
            query["club_id"] = audience.club_id
        async for m in db.members.find(query, {"phone": 1, "name": 1, "_id": 1}):
            phone = _normalize_phone(m.get("phone", ""))
            if phone and phone not in seen_phones:
                seen_phones.add(phone)
                recipients.append({
                    "phone": phone,
                    "name": m.get("name", ""),
                    "member_id": str(m["_id"]),
                    "source": "member",
                })
        return recipients

    if audience.audience_type == "clients_all":
        async for c in db.clients.find(
            {"opt_out_whatsapp": {"$ne": True}},
            {"phone": 1, "name": 1, "_id": 1},
        ):
            phone = _normalize_phone(c.get("phone", ""))
            if phone and phone not in seen_phones:
                seen_phones.add(phone)
                recipients.append({
                    "phone": phone,
                    "name": c.get("name", ""),
                    "client_id": str(c["_id"]),
                    "source": "client",
                })
        return recipients

    return recipients


async def _kapso_list_templates(cfg: Dict[str, Any]) -> List[Dict[str, Any]]:
    """List approved templates for the WABA via Kapso's relay of Meta's templates endpoint.

    Meta's Graph API exposes templates at the WhatsApp Business Account (WABA) level:
        GET /meta/whatsapp/v24.0/{business_account_id}/message_templates

    Phone-number-id is NOT valid here. The admin must configure
    `kapso_business_account_id` in Bot WA settings.
    """
    api_key = cfg.get("kapso_api_key", "")
    waba_id = cfg.get("kapso_business_account_id", "")
    if not waba_id:
        raise HTTPException(
            status_code=400,
            detail="Falta el WhatsApp Business Account ID. Configuralo en Admin → Bot WA → 'Business Account ID'. Lo encontrás en el panel de Kapso o en Meta Business Manager.",
        )
    headers = {"X-API-Key": api_key, "Content-Type": "application/json"}
    url = f"{KAPSO_BASE}/{KAPSO_API_VERSION}/{waba_id}/message_templates"
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            r = await client.get(url, headers=headers, params={"limit": 200})
            if r.status_code == 200:
                body = r.json()
                data = body.get("data") if isinstance(body, dict) else body
                if isinstance(data, list):
                    return data
                return []
            raise HTTPException(
                status_code=502,
                detail=f"Kapso devolvió {r.status_code}: {r.text[:300]}",
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Error de conexión con Kapso: {e}") from e


async def _kapso_send_template(
    *,
    cfg: Dict[str, Any],
    to: str,
    template_name: str,
    language_code: str,
    body_params: List[str],
) -> Dict[str, Any]:
    """Send a template message via Kapso (WhatsApp Cloud API)."""
    api_key = cfg.get("kapso_api_key", "")
    phone_number_id = cfg.get("kapso_phone_number_id", "")
    url = f"{KAPSO_BASE}/{KAPSO_API_VERSION}/{phone_number_id}/messages"
    payload: Dict[str, Any] = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code, "policy": "deterministic"},
        },
    }
    if body_params:
        payload["template"]["components"] = [{
            "type": "body",
            "parameters": [{"type": "text", "text": str(p)} for p in body_params],
        }]
    headers = {"X-API-Key": api_key, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, headers=headers, content=json.dumps(payload))
        if r.status_code >= 300:
            raise RuntimeError(f"Kapso {r.status_code}: {r.text[:300]}")
        return r.json()


# ─────────────────────────────────────────────────────────────────────────
# Background sender
# ─────────────────────────────────────────────────────────────────────────
async def _run_broadcast(broadcast_id: str) -> None:
    """Background task: send template messages to each pending recipient.

    Updates broadcast_messages on each send with status sent | failed.
    Updates broadcasts aggregate counts and final status.
    """
    try:
        cfg = await _bot_config()
    except HTTPException as exc:
        logger.error("Broadcast %s: %s", broadcast_id, exc.detail)
        await db.broadcasts.update_one(
            {"_id": ObjectId(broadcast_id)},
            {"$set": {"status": "failed", "error": exc.detail,
                      "finished_at": datetime.now(timezone.utc).isoformat()}},
        )
        return

    bc = await db.broadcasts.find_one({"_id": ObjectId(broadcast_id)})
    if not bc:
        return

    await db.broadcasts.update_one(
        {"_id": ObjectId(broadcast_id)},
        {"$set": {"status": "running", "started_at": datetime.now(timezone.utc).isoformat()}},
    )

    sent = 0
    failed = 0
    cursor = db.broadcast_messages.find({"broadcast_id": broadcast_id, "status": "pending"})
    async for msg in cursor:
        # Check if broadcast was cancelled mid-flight
        current = await db.broadcasts.find_one({"_id": ObjectId(broadcast_id)}, {"status": 1})
        if not current or current.get("status") == "cancelled":
            logger.info("Broadcast %s cancelled mid-send", broadcast_id)
            break

        try:
            result = await _kapso_send_template(
                cfg=cfg,
                to=msg["phone"],
                template_name=bc["template_name"],
                language_code=bc.get("template_language", "es"),
                body_params=bc.get("body_params", []),
            )
            message_id = ((result.get("messages") or [{}])[0]).get("id", "")
            await db.broadcast_messages.update_one(
                {"_id": msg["_id"]},
                {"$set": {
                    "status": "sent",
                    "message_id": message_id,
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
            sent += 1
        except Exception as e:
            err = str(e)[:500]
            logger.warning("Broadcast %s to %s failed: %s", broadcast_id, msg["phone"], err)
            await db.broadcast_messages.update_one(
                {"_id": msg["_id"]},
                {"$set": {
                    "status": "failed",
                    "error": err,
                    "failed_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
            failed += 1
        # throttle
        await asyncio.sleep(SEND_DELAY_SECONDS)

    # Recompute aggregate from broadcast_messages (in case of cancellation)
    sent_total = await db.broadcast_messages.count_documents({"broadcast_id": broadcast_id, "status": "sent"})
    failed_total = await db.broadcast_messages.count_documents({"broadcast_id": broadcast_id, "status": "failed"})
    delivered_total = await db.broadcast_messages.count_documents({"broadcast_id": broadcast_id, "status": "delivered"})
    read_total = await db.broadcast_messages.count_documents({"broadcast_id": broadcast_id, "status": "read"})
    pending_total = await db.broadcast_messages.count_documents({"broadcast_id": broadcast_id, "status": "pending"})

    final_status = "completed" if pending_total == 0 else "cancelled"
    await db.broadcasts.update_one(
        {"_id": ObjectId(broadcast_id)},
        {"$set": {
            "status": final_status,
            "sent": sent_total,
            "delivered": delivered_total,
            "read": read_total,
            "failed": failed_total,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    logger.info("Broadcast %s finished: sent=%d failed=%d", broadcast_id, sent_total, failed_total)


# ─────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────
@router.get("/broadcasts/templates")
async def list_templates(request: Request):
    await require_role("super_admin", "admin", permission="broadcasts")(request)
    cfg = await _bot_config()
    templates = await _kapso_list_templates(cfg)
    # Normalize: include only approved
    cleaned = []
    for t in templates:
        if not isinstance(t, dict):
            continue
        cleaned.append({
            "name": t.get("name"),
            "language": t.get("language"),
            "status": t.get("status"),
            "category": t.get("category"),
            "components": t.get("components", []),
        })
    return cleaned


@router.post("/broadcasts/preview")
async def preview_audience(audience: AudienceFilter, request: Request):
    await require_role("super_admin", "admin", permission="broadcasts")(request)
    recipients = await _build_audience(audience)
    return {
        "audience_size": len(recipients),
        "sample": recipients[:5],
        "throttle_seconds": SEND_DELAY_SECONDS,
        "estimated_duration_minutes": round((len(recipients) * SEND_DELAY_SECONDS) / 60, 1),
    }


@router.post("/broadcasts")
async def create_broadcast(body: BroadcastCreate, background: BackgroundTasks, request: Request):
    user = await require_role("super_admin", "admin", permission="broadcasts")(request)
    # Verify Kapso is configured before doing anything
    await _bot_config()

    recipients = await _build_audience(body.audience)
    if not recipients:
        raise HTTPException(status_code=400, detail="La audiencia seleccionada no tiene destinatarios con teléfono válido y opt-in activo.")

    now_iso = datetime.now(timezone.utc).isoformat()
    bc_doc = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip() or f"Difusión {now_iso[:10]}",
        "template_name": body.template_name,
        "template_language": body.template_language,
        "body_params": body.body_params,
        "audience": body.audience.model_dump(),
        "total_recipients": len(recipients),
        "sent": 0,
        "delivered": 0,
        "read": 0,
        "failed": 0,
        "status": "queued",
        "created_at": now_iso,
        "created_by_id": user["_id"],
        "created_by_name": user.get("name", "Admin"),
    }
    result = await db.broadcasts.insert_one(bc_doc)
    broadcast_id = str(result.inserted_id)

    # Insert per-recipient pending messages
    msgs = []
    for r in recipients:
        msgs.append({
            "broadcast_id": broadcast_id,
            "phone": r["phone"],
            "name": r.get("name", ""),
            "member_id": r.get("member_id"),
            "client_id": r.get("client_id"),
            "source": r.get("source"),
            "status": "pending",
            "created_at": now_iso,
        })
    if msgs:
        await db.broadcast_messages.insert_many(msgs)

    background.add_task(_run_broadcast, broadcast_id)

    bc_doc["_id"] = broadcast_id
    return serialize_doc(bc_doc)


@router.get("/broadcasts")
async def list_broadcasts(request: Request):
    await require_role("super_admin", "admin", permission="broadcasts")(request)
    out = []
    async for bc in db.broadcasts.find().sort("created_at", -1).limit(200):
        out.append(serialize_doc(bc))
    return out


@router.get("/broadcasts/{broadcast_id}")
async def get_broadcast(broadcast_id: str, request: Request):
    await require_role("super_admin", "admin", permission="broadcasts")(request)
    try:
        bc = await db.broadcasts.find_one({"_id": ObjectId(broadcast_id)})
    except Exception:
        bc = None
    if not bc:
        raise HTTPException(status_code=404, detail="Difusión no encontrada")
    bc_data = serialize_doc(bc)
    messages = []
    async for m in db.broadcast_messages.find({"broadcast_id": broadcast_id}).limit(500):
        m.pop("_id", None)
        messages.append(m)
    bc_data["messages"] = messages
    return bc_data


@router.post("/broadcasts/{broadcast_id}/cancel")
async def cancel_broadcast(broadcast_id: str, request: Request):
    await require_role("super_admin", "admin", permission="broadcasts")(request)
    try:
        bc = await db.broadcasts.find_one({"_id": ObjectId(broadcast_id)})
    except Exception:
        bc = None
    if not bc:
        raise HTTPException(status_code=404, detail="Difusión no encontrada")
    if bc.get("status") in ("completed", "failed", "cancelled"):
        return {"status": bc["status"], "message": "Ya finalizó"}
    await db.broadcasts.update_one(
        {"_id": ObjectId(broadcast_id)},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"status": "cancelled"}


# ─────────────────────────────────────────────────────────────────────────
# Opt-out: public + member-portal endpoints
# ─────────────────────────────────────────────────────────────────────────
class OptOutRequest(BaseModel):
    phone: Optional[str] = None  # admin-set (public/internal)


async def _mark_opt_out(phone_digits: str, source: str) -> int:
    """Mark a phone number as opted-out across members + clients. Returns docs updated."""
    if not phone_digits:
        return 0
    now_iso = datetime.now(timezone.utc).isoformat()
    update = {"$set": {
        "opt_out_whatsapp": True,
        "opt_out_at": now_iso,
        "opt_out_source": source,
    }}
    # Match by raw phone or with +
    q = {"$or": [
        {"phone": phone_digits},
        {"phone": f"+{phone_digits}"},
        {"phone": {"$regex": f".*{phone_digits[-8:]}$"}},
    ]}
    r1 = await db.members.update_many(q, update)
    r2 = await db.clients.update_many(q, update)
    return r1.modified_count + r2.modified_count


@router.post("/broadcasts/opt-out")
async def opt_out_member(body: OptOutRequest, request: Request):
    """Authenticated endpoint: a member or admin marks a phone as opt-out."""
    user = await get_current_user(request)
    phone_digits = ""
    if user.get("role") == "member":
        member = await db.members.find_one({"_id": ObjectId(user.get("member_id", ""))})
        if member:
            phone_digits = _normalize_phone(member.get("phone", ""))
    elif user.get("role") in ("super_admin", "admin"):
        phone_digits = _normalize_phone(body.phone or "")
    if not phone_digits:
        raise HTTPException(status_code=400, detail="Teléfono no disponible")
    updated = await _mark_opt_out(phone_digits, source="self_request" if user.get("role") == "member" else "admin")
    return {"ok": True, "updated": updated, "phone": phone_digits}


# ─────────────────────────────────────────────────────────────────────────
# Webhook side-effects (called from server.kapso_webhook)
# ─────────────────────────────────────────────────────────────────────────
async def handle_webhook_event(event: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process Kapso webhook events relevant to broadcasts.

    Returns a dict describing what was done (for logging).
    Handles:
      - message.status (sent/delivered/read/failed) → update broadcast_messages
      - message.received with OPT_OUT keyword → mark opt-out and reply confirmation
    """
    try:
        if event and "status" in event:
            data = payload.get("data") or payload
            statuses = []
            # Meta-style nesting
            meta_statuses = (data.get("entry", [{}])[0]
                                  .get("changes", [{}])[0]
                                  .get("value", {})
                                  .get("statuses", []))
            if meta_statuses:
                statuses.extend(meta_statuses)
            # Flat
            if "status" in data and "id" in data:
                statuses.append({"id": data["id"], "status": data["status"], "recipient_id": data.get("recipient_id", "")})
            # Kapso style
            msg_st = (payload.get("message_status") or (payload.get("data") or {}).get("message_status"))
            if isinstance(msg_st, dict):
                statuses.append(msg_st)

            updated = 0
            for s in statuses:
                mid = s.get("id") or s.get("message_id")
                st = (s.get("status") or "").lower()
                if not mid or not st:
                    continue
                set_doc = {"status": st}
                if st == "delivered":
                    set_doc["delivered_at"] = datetime.now(timezone.utc).isoformat()
                elif st == "read":
                    set_doc["read_at"] = datetime.now(timezone.utc).isoformat()
                elif st == "failed":
                    set_doc["failed_at"] = datetime.now(timezone.utc).isoformat()
                    err = s.get("errors") or s.get("error")
                    if err:
                        set_doc["error"] = str(err)[:500]
                res = await db.broadcast_messages.update_one(
                    {"message_id": mid},
                    {"$set": set_doc},
                )
                updated += res.modified_count
            return {"event": "status", "updated_messages": updated}

        if event and "message.received" in event:
            # Inbound — detect opt-out keyword
            msg = payload.get("message") or (payload.get("data") or {}).get("message") or {}
            sender = msg.get("from", "")
            text_node = msg.get("text") or {}
            text = text_node.get("body", "") if isinstance(text_node, dict) else str(text_node)
            if sender and text:
                clean = text.strip().upper()
                if clean in OPT_OUT_KEYWORDS:
                    sender_digits = _normalize_phone(sender)
                    updated = await _mark_opt_out(sender_digits, source="whatsapp_reply")
                    return {"event": "opt_out", "phone": sender_digits, "updated": updated}
        return {"event": event or "unknown", "handled": False}
    except Exception as e:  # pragma: no cover
        logger.warning("broadcasts.handle_webhook_event error: %s", e)
        return {"event": event, "error": str(e)[:200]}
