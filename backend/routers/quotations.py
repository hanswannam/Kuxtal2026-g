"""Quotations router: public + admin CRUD, timeline, public decision, share helpers,
plus quotation settings (default validity days + payment WhatsApp).

Depends on: core.db, core.serialize_doc, core.require_role, core.get_current_user.
Uses a late import of server._send_push_raw inside public_quotation_decision to
avoid a circular dependency with server.py.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import quote as url_quote

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core import (
    db,
    serialize_doc,
    require_role,
    get_current_user,
)

router = APIRouter(prefix="/api")


# ── Pydantic models ─────────────────────────────────────────────────────
class QuotationRequest(BaseModel):
    package_id: Optional[str] = ""
    name: str
    email: str
    phone: str
    contract_number: Optional[str] = ""
    message: Optional[str] = ""
    guests: int = 1
    travel_date: Optional[str] = ""


class QuotationSettings(BaseModel):
    payment_whatsapp: str = ""
    default_valid_days: int = 10


# ══════════════════════════════════════════════════════════════════════
# ── Helpers (private) ────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════

async def _default_valid_days() -> int:
    cfg = await db.config.find_one({"key": "quotation_settings"})
    try:
        return max(1, int((cfg or {}).get("default_valid_days", 10) or 10))
    except Exception:
        return 10


async def _upsert_client(name: str, email: str = "", phone: str = "") -> Optional[str]:
    """Create a client record if not already present (matched by email, then phone)."""
    name = (name or "").strip()
    email = (email or "").strip().lower()
    phone = (phone or "").strip()
    if not name:
        return None
    existing = None
    if email:
        existing = await db.clients.find_one({"email": email})
    if not existing and phone:
        existing = await db.clients.find_one({"phone": phone})
    if existing:
        return str(existing["_id"])
    doc = {
        "name": name, "email": email, "phone": phone, "dpi": "", "notes": "",
        "source": "quotation",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.clients.insert_one(doc)
    return str(result.inserted_id)


async def _resolve_member_for_quote(contract_number: str, email: str):
    """Find matching member by contract_number, falling back to email."""
    if contract_number:
        m = await db.members.find_one({"contract_number": contract_number.strip()})
        if m:
            return m
    if email:
        return await db.members.find_one({"email": email.strip().lower()})
    return None


def _attach_member_to_quote(doc: dict, member: dict) -> None:
    doc["is_member"] = True
    doc["member_id"] = str(member["_id"])
    doc["member_name"] = member.get("name", "")
    doc["contract_number"] = member.get("contract_number", "")


async def _attach_package_to_quote(doc: dict, package_id: str, is_member: bool, guests: int) -> None:
    if not package_id:
        return
    try:
        pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
    except Exception:
        return
    if not pkg:
        return
    unit_price = float(pkg.get("price", 0) or 0)
    member_unit_price = float(pkg.get("member_price", 0) or 0)
    applied_price = member_unit_price if (is_member and member_unit_price > 0) else unit_price
    doc.update({
        "package_title": pkg.get("title", ""),
        "package_country": pkg.get("country", ""),
        "package_duration_days": pkg.get("duration_days", 0),
        "unit_price": unit_price,
        "member_unit_price": member_unit_price,
        "total": round(applied_price * (guests or 1), 2),
        # Snapshot completo del paquete dentro de la cotización
        "package_description": pkg.get("description", ""),
        "package_short_description": pkg.get("short_description", ""),
        "package_image_url": pkg.get("image_url", ""),
        "package_includes": pkg.get("includes") or [],
        "package_gallery": pkg.get("gallery") or [],
        "package_youtube_url": pkg.get("youtube_url", ""),
        "package_itinerary_days": pkg.get("itinerary_days") or [],
        "package_hotels": pkg.get("hotels") or [],
    })


async def _attach_package_snapshot(doc: dict, package_id: str, guests: int) -> None:
    if not package_id:
        return
    try:
        pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
    except Exception:
        return
    if not pkg:
        return
    doc["package_title"] = pkg.get("title", "")
    doc["package_country"] = pkg.get("country", "")
    doc["package_duration_days"] = pkg.get("duration_days", 0)
    doc["unit_price"] = float(pkg.get("price", 0) or 0)
    doc["member_unit_price"] = float(pkg.get("member_price", 0) or 0)
    applied_price = doc["member_unit_price"] if (doc["is_member"] and doc["member_unit_price"] > 0) else doc["unit_price"]
    doc["total"] = round(applied_price * guests, 2)


async def _build_admin_quotation_doc(body: dict, user: dict) -> dict:
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    phone = (body.get("phone") or "").strip()
    guests = int(body.get("guests") or 1)
    travel_date = body.get("travel_date") or ""
    message = body.get("message") or ""
    valid_until_override = (body.get("valid_until") or "").strip()

    vdays = await _default_valid_days()
    computed_valid_until = (datetime.now(timezone.utc) + timedelta(days=vdays)).isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()
    admin_name = user.get("name", "Admin")

    return {
        "name": name, "email": email, "phone": phone,
        "guests": guests, "travel_date": travel_date, "message": message,
        "package_id": body.get("package_id") or "",
        "created_at": now_iso,
        "created_by_name": admin_name,
        "created_by_id": user.get("_id"),
        "status": "in_review",
        "id": str(uuid.uuid4()),
        "public_token": secrets.token_urlsafe(16),
        "is_member": False,
        "valid_until": valid_until_override or computed_valid_until,
        "timeline": [{
            "event": "created",
            "label": f"Cotización creada por {admin_name}",
            "at": now_iso,
            "by": admin_name,
        }],
    }


def _fill_missing_contact(doc: dict, source: dict) -> None:
    if not doc["name"]:
        doc["name"] = source.get("name", "")
    if not doc["email"]:
        doc["email"] = source.get("email", "")
    if not doc["phone"]:
        doc["phone"] = source.get("phone", "")


async def _attach_contact_from_source(doc: dict, body: dict) -> None:
    member_id = body.get("member_id") or ""
    client_id = body.get("client_id") or ""
    if member_id:
        member = await db.members.find_one({"_id": ObjectId(member_id)})
        if member:
            doc["is_member"] = True
            doc["member_id"] = str(member["_id"])
            doc["member_name"] = member.get("name", "")
            doc["contract_number"] = member.get("contract_number", "")
            _fill_missing_contact(doc, member)
        return
    if client_id:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
        if client:
            doc["client_id"] = str(client["_id"])
            _fill_missing_contact(doc, client)
        return
    # No member or client selected: auto-register a new client with the provided data
    new_id = await _upsert_client(doc["name"], doc["email"], doc["phone"])
    if new_id:
        doc["client_id"] = new_id


def _build_list_query(created_by: Optional[str], status: Optional[str],
                      date_from: Optional[str], date_to: Optional[str]) -> dict:
    query: dict = {}
    if created_by:
        query["created_by_id"] = None if created_by == "system" else created_by
    if status:
        query["status"] = status
    if date_from or date_to:
        date_query: dict = {}
        if date_from:
            date_query["$gte"] = date_from
        if date_to:
            date_query["$lte"] = date_to + "T23:59:59"
        query["created_at"] = date_query
    return query


_STATUS_LABELS = {
    "pending": "Pendiente",
    "in_review": "En revisión",
    "sent": "Enviada al cliente",
    "approved": "Aprobada",
    "rejected": "Rechazada",
    "closed": "Cerrada",
}


# ══════════════════════════════════════════════════════════════════════
# ── Public routes ────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════

@router.get("/quotations/check-email")
async def check_quote_email(email: str = ""):
    """Public endpoint: returns whether the email belongs to an existing member.
    Used by the public quote form to suggest the visitor logs in. No PII leaked.
    """
    e = (email or "").strip().lower()
    if not e or "@" not in e or len(e) < 5:
        return {"member": False, "client": False}
    member = await db.members.find_one({"email": e}, {"_id": 1, "name": 1})
    if member:
        first = (member.get("name") or "").split(" ")[0]
        return {"member": True, "client": False, "first_name": first}
    client = await db.clients.find_one({"email": e}, {"_id": 1})
    return {"member": False, "client": bool(client)}


@router.post("/quotations")
async def create_quotation(req: QuotationRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    vdays = await _default_valid_days()

    doc = req.model_dump()
    doc.update({
        "created_at": now_iso,
        "status": "pending",
        "id": str(uuid.uuid4()),
        "public_token": secrets.token_urlsafe(16),
        "created_by_name": "Sistema (web pública)",
        "created_by_id": None,
        "valid_until": (datetime.now(timezone.utc) + timedelta(days=vdays)).isoformat(),
        "timeline": [{
            "event": "created",
            "label": "Cotización creada",
            "at": now_iso,
            "note": "Solicitud recibida desde el sitio web" if not req.contract_number else "Solicitud recibida de socio",
        }],
    })

    member = await _resolve_member_for_quote(req.contract_number, req.email)
    if member:
        _attach_member_to_quote(doc, member)
    else:
        doc["is_member"] = False
        client_id = await _upsert_client(req.name, req.email, req.phone)
        if client_id:
            doc["client_id"] = client_id

    await _attach_package_to_quote(doc, req.package_id, doc["is_member"], req.guests)

    result = await db.quotations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize_doc(doc)


@router.get("/quotations/public/{token}")
async def get_public_quotation(token: str):
    """Public view of a quotation via the share link. No auth required."""
    q = await db.quotations.find_one({"public_token": token})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if not q.get("viewed_at"):
        await db.quotations.update_one(
            {"_id": q["_id"]},
            {
                "$set": {"viewed_at": datetime.now(timezone.utc).isoformat()},
                "$push": {"timeline": {
                    "event": "viewed",
                    "label": "Vista por el cliente",
                    "at": datetime.now(timezone.utc).isoformat(),
                }},
            },
        )
    return serialize_doc(q)


@router.post("/quotations/public/{token}/decision")
async def public_quotation_decision(token: str, request: Request):
    """Allow the customer to approve or reject their quotation through the public link."""
    body = await request.json()
    decision = body.get("decision")
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Decisión inválida")
    q = await db.quotations.find_one({"public_token": token})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    status_label = "Aprobada por el cliente" if decision == "approved" else "Rechazada por el cliente"
    await db.quotations.update_one(
        {"_id": q["_id"]},
        {
            "$set": {"status": decision, f"{decision}_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"timeline": {
                "event": f"customer_{decision}",
                "label": status_label,
                "at": datetime.now(timezone.utc).isoformat(),
            }},
        },
    )
    # Notify admins via push (non-blocking, late import to avoid circular dep).
    try:
        from server import _send_push_raw
        emoji = "✅" if decision == "approved" else "❌"
        await _send_push_raw(
            title=f"{emoji} Cotización {status_label.lower()}",
            message=f"{q.get('name','Cliente')} {('aceptó' if decision == 'approved' else 'rechazó')} la cotización {q.get('package_title') or ''}".strip(),
            link="/admin",
        )
    except Exception:
        pass
    return {"status": decision}


# ══════════════════════════════════════════════════════════════════════
# ── Admin / authenticated routes ─────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════

@router.get("/quotations")
async def list_quotations(
    request: Request,
    sort: Optional[str] = "desc",
    created_by: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    user = await get_current_user(request)
    sort_dir = 1 if sort == "asc" else -1

    if user["role"] in ("super_admin", "admin"):
        query = _build_list_query(created_by, status, date_from, date_to)
        return [serialize_doc(q) async for q in db.quotations.find(query).sort("created_at", sort_dir).limit(500)]

    if user["role"] == "member":
        member = await db.members.find_one({"_id": ObjectId(user.get("member_id", ""))})
        if not member:
            return []
        return [
            serialize_doc(q) async for q in db.quotations
            .find({"contract_number": member["contract_number"]})
            .sort("created_at", -1)
            .limit(50)
        ]
    return []


@router.post("/quotations/admin")
async def create_quotation_as_admin(request: Request):
    """Admin creates a quotation for an existing socio, existing client, or a new client."""
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    doc = await _build_admin_quotation_doc(body, user)
    await _attach_contact_from_source(doc, body)
    await _attach_package_snapshot(doc, body.get("package_id") or "", int(body.get("guests") or 1))
    result = await db.quotations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize_doc(doc)


@router.put("/quotations/{quotation_id}")
async def update_quotation(quotation_id: str, request: Request):
    """Admin-only: edit a quotation (pricing, travel date, extras, status, notes)."""
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    q = await db.quotations.find_one({"_id": ObjectId(quotation_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    allowed_fields = {
        "status", "travel_date", "guests", "unit_price", "member_unit_price", "total",
        "discount", "extras", "internal_notes", "customer_notes", "package_id",
        "package_title", "package_country", "package_duration_days", "response", "response_html",
        "valid_until",
        # Vuelos (legacy estructurado) + nuevo: imágenes de itinerarios de vuelo
        "has_flights", "flight_info", "flight_images",
        # Snapshot extendido del paquete (admin puede editar para personalizar)
        "package_description", "package_short_description",
        "package_includes", "package_gallery", "package_youtube_url",
        "package_itinerary_days", "package_hotels", "package_image_url",
        # Hotel seleccionado dentro del paquete (índice 0-based; None = mostrar todos)
        "selected_hotel_index",
    }
    updates = {k: v for k, v in body.items() if k in allowed_fields}

    # Refresh package snapshot fields when package is reassigned.
    if updates.get("package_id"):
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(updates["package_id"])})
            if pkg:
                updates["package_title"] = pkg.get("title", "")
                updates["package_country"] = pkg.get("country", "")
                updates["package_duration_days"] = pkg.get("duration_days", 0)
                # Auto-snapshot full package content so cotización es independiente del paquete
                updates.setdefault("package_description", pkg.get("description", ""))
                updates.setdefault("package_short_description", pkg.get("short_description", ""))
                updates.setdefault("package_includes", pkg.get("includes") or [])
                updates.setdefault("package_gallery", pkg.get("gallery") or [])
                updates.setdefault("package_youtube_url", pkg.get("youtube_url", ""))
                updates.setdefault("package_itinerary_days", pkg.get("itinerary_days") or [])
                updates.setdefault("package_hotels", pkg.get("hotels") or [])
                updates.setdefault("package_image_url", pkg.get("image_url", ""))
        except Exception:
            pass

    timeline = list(q.get("timeline") or [])
    now_iso = datetime.now(timezone.utc).isoformat()
    admin_name = user.get("name", "Admin")

    if "status" in updates and updates["status"] != q.get("status"):
        timeline.append({
            "event": "status_change",
            "label": f"Estado cambiado a {_STATUS_LABELS.get(updates['status'], updates['status'])}",
            "at": now_iso,
            "by": admin_name,
        })
    else:
        timeline.append({
            "event": "updated",
            "label": "Cotización editada",
            "at": now_iso,
            "by": admin_name,
        })

    updates["timeline"] = timeline
    updates["updated_at"] = now_iso
    await db.quotations.update_one({"_id": ObjectId(quotation_id)}, {"$set": updates})
    return serialize_doc(await db.quotations.find_one({"_id": ObjectId(quotation_id)}))


@router.post("/quotations/{quotation_id}/timeline")
async def add_timeline_entry(quotation_id: str, request: Request):
    """Add a manual note to the quotation timeline (seguimiento)."""
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    note = (body.get("note") or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="Nota requerida")
    entry = {
        "event": "note",
        "label": note,
        "at": datetime.now(timezone.utc).isoformat(),
        "by": user.get("name", "Admin"),
    }
    await db.quotations.update_one(
        {"_id": ObjectId(quotation_id)},
        {"$push": {"timeline": entry}},
    )
    return entry


@router.put("/quotations/{quotation_id}/respond")
async def respond_quotation(quotation_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    await db.quotations.update_one(
        {"_id": ObjectId(quotation_id)},
        {"$set": {
            "response": body.get("response", ""),
            "response_html": body.get("response_html", ""),
            "status": "sent",
            "responded_at": datetime.now(timezone.utc).isoformat(),
            "responded_by": user["_id"],
        }},
    )
    return {"message": "Cotización respondida"}


@router.get("/quotations/{quotation_id}/share")
async def get_quotation_share(quotation_id: str, request: Request):
    q = await db.quotations.find_one({"_id": ObjectId(quotation_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    q_data = serialize_doc(q)

    wa_cfg = await db.config.find_one({"key": "whatsapp"})
    wa_phone = (wa_cfg or {}).get("phone", "")
    response_text = q_data.get("response", "Cotización pendiente")

    pkg_name = ""
    if q_data.get("package_id"):
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(q_data["package_id"])})
            if pkg:
                pkg_name = pkg.get("title", "")
        except Exception:
            pass

    share_text = f"Cotización Kuxtal Travel{(' - ' + pkg_name) if pkg_name else ''}: {response_text}"
    email_subject = f"Cotización Kuxtal Travel #{quotation_id[-6:]}"
    clean_phone = wa_phone.replace(" ", "").replace("-", "").replace("+", "")
    wa_url = f"https://wa.me/{clean_phone}?text={url_quote(share_text)}" if clean_phone else ""
    mailto_url = f"mailto:{q_data.get('email', '')}?subject={url_quote(email_subject)}&body={url_quote(response_text)}"
    return {
        "quotation": q_data,
        "whatsapp_url": wa_url,
        "mailto_url": mailto_url,
        "email_subject": email_subject,
        "email_body": q_data.get("response_html", f"<p>{response_text}</p>"),
        "share_text": share_text,
    }


# ══════════════════════════════════════════════════════════════════════
# ── Quotation settings (payment WhatsApp + default validity days) ────
# ══════════════════════════════════════════════════════════════════════

@router.get("/config/quotation-settings")
async def get_quotation_settings():
    cfg = await db.config.find_one({"key": "quotation_settings"})
    if cfg:
        return {
            "payment_whatsapp": cfg.get("payment_whatsapp", ""),
            "default_valid_days": int(cfg.get("default_valid_days", 10) or 10),
        }
    return {"payment_whatsapp": "", "default_valid_days": 10}


@router.put("/config/quotation-settings")
async def set_quotation_settings(req: QuotationSettings, request: Request):
    await require_role("super_admin", "admin", permission="settings")(request)
    days = max(1, int(req.default_valid_days or 10))
    await db.config.update_one(
        {"key": "quotation_settings"},
        {"$set": {
            "key": "quotation_settings",
            "payment_whatsapp": (req.payment_whatsapp or "").strip(),
            "default_valid_days": days,
        }},
        upsert=True,
    )
    return {
        "message": "Configuración de cotizaciones actualizada",
        "payment_whatsapp": req.payment_whatsapp,
        "default_valid_days": days,
    }


# ── PDF export ─────────────────────────────────────────────────────────
from fastapi.responses import StreamingResponse  # noqa: E402
import io  # noqa: E402


async def _build_quotation_pdf_bytes(quotation_id_or_token: str, options: dict, by_token: bool = False) -> tuple[bytes, str]:
    from quotation_pdf import build_quotation_pdf  # lazy (weasyprint)
    if by_token:
        q = await db.quotations.find_one({"public_token": quotation_id_or_token})
    else:
        try:
            q = await db.quotations.find_one({"_id": ObjectId(quotation_id_or_token)})
        except Exception:
            q = None
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    pkg = None
    if q.get("package_id"):
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(q["package_id"])})
        except Exception:
            pkg = None
    pdf_bytes = build_quotation_pdf(q, pkg, options)
    short_id = (q.get("id") or "")[-6:].upper() or "kuxtal"
    return pdf_bytes, f"cotizacion_{short_id}.pdf"


@router.get("/quotations/{quotation_id}/pdf")
async def admin_quotation_pdf(
    quotation_id: str,
    request: Request,
    include_itinerary: bool = True,
    include_hotels: bool = True,
    include_gallery: bool = True,
):
    """Admin downloads the quotation as a PDF. Options control which package sections are included."""
    user = await get_current_user(request)
    if user.get("role") not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Solo administradores")
    options = {
        "include_itinerary": include_itinerary,
        "include_hotels": include_hotels,
        "include_gallery": include_gallery,
    }
    try:
        pdf_bytes, filename = await _build_quotation_pdf_bytes(quotation_id, options, by_token=False)
    except HTTPException:
        raise
    except Exception as exc:  # weasyprint missing libs, etc.
        raise HTTPException(status_code=500, detail=f"No se pudo generar el PDF: {exc}")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/quotations/public/{token}/pdf")
async def public_quotation_pdf(
    token: str,
    include_itinerary: bool = True,
    include_hotels: bool = True,
    include_gallery: bool = True,
):
    """Public PDF download via the share link — no auth needed."""
    options = {
        "include_itinerary": include_itinerary,
        "include_hotels": include_hotels,
        "include_gallery": include_gallery,
    }
    try:
        pdf_bytes, filename = await _build_quotation_pdf_bytes(token, options, by_token=True)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"No se pudo generar el PDF: {exc}")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
