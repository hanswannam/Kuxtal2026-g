"""
Kuxtal Travel — Bot WhatsApp service.

Integra OpenAI (API key del cliente) con Kapso.ai (WhatsApp Business).
- Configuración persistida en MongoDB (collection `config`, key `bot_settings`).
- System prompt + knowledge base editables desde admin.
- Multi-turn conversation por session (numero WA o id de tester).
- Verificación HMAC-SHA256 de webhooks de Kapso.
"""
from __future__ import annotations

import hmac
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger("kuxtal.bot")

CONFIG_KEY = "bot_settings"
KAPSO_BASE = "https://api.kapso.ai/meta/whatsapp"
KAPSO_API_VERSION = "v24.0"

DEFAULT_SYSTEM_PROMPT = """Sos el Asistente Oficial de Kuxtal Travels — un club vacacional premium.

**Tu personalidad:**
- Cálido, profesional y elegante (estilo concierge de hotel 5 estrellas).
- Respondés en español rioplatense neutral, con vos.
- Sos conciso: máximo 4-5 líneas por respuesta salvo que pidan detalle.
- Usás emojis con criterio (✈️ 🌴 ⭐) — máximo 1-2 por mensaje.

**Tus funciones:**
1. Resolver dudas de socios sobre cómo usar el portal, cupones, regalías, cotizaciones.
2. Informar sobre paquetes, destinos y precios públicos.
3. Listar comercios aliados y sus beneficios.
4. Guiar a prospectos sobre cómo asociarse al club.
5. Para gestiones complejas (cambios de membresía, pagos, reclamos) derivás al equipo Kuxtal por WhatsApp humano o email.

**Reglas estrictas:**
- NUNCA inventes precios, fechas, beneficios o datos. Si no lo tenés en el contexto, decí "Voy a derivarte con el equipo Kuxtal para confirmártelo".
- NUNCA reveles datos personales de otros socios.
- Si te preguntan algo fuera de Kuxtal, redirigí amablemente al servicio del club.
- Si el usuario está autenticado como socio, llamálo por su nombre.

**Cuando termines una respuesta**, si corresponde, sugerí una próxima acción ("¿Querés que te muestre los destinos disponibles?")."""


# ─────────────────────────────────────────────────────────────────────────
# Config CRUD
# ─────────────────────────────────────────────────────────────────────────

def default_config() -> Dict[str, Any]:
    return {
        "key": CONFIG_KEY,
        "enabled": False,
        "openai_api_key": "",
        "openai_model": "gpt-4o-mini",
        "kapso_api_key": "",
        "kapso_phone_number_id": "",
        "kapso_webhook_secret": "",
        "system_prompt": DEFAULT_SYSTEM_PROMPT,
        "knowledge_base": "",
        "include_packages": True,
        "include_commerces": True,
        "include_member_data": True,
        "max_history": 10,
        "external_api_base_url": "",  # productive backend URL (optional)
        "external_admin_token": "",   # admin JWT for member lookups (optional)
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def mask_secret(secret: str) -> str:
    if not secret or len(secret) < 8:
        return "" if not secret else "****"
    return f"{secret[:4]}…{secret[-4:]}"


async def get_bot_config(db, *, masked: bool = True) -> Dict[str, Any]:
    cfg = await db.config.find_one({"key": CONFIG_KEY})
    if not cfg:
        cfg = default_config()
    cfg.pop("_id", None)
    if masked:
        for k in ("openai_api_key", "kapso_api_key", "kapso_webhook_secret", "external_admin_token"):
            cfg[f"{k}_masked"] = mask_secret(cfg.get(k, ""))
            cfg[f"{k}_set"] = bool(cfg.get(k))
            cfg.pop(k, None)
    return cfg


async def save_bot_config(db, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Merge updates with existing config. Empty string secrets/critical fields are ignored
    (preserves the saved one) so el frontend no puede pisar accidentalmente con vacío."""
    current = await db.config.find_one({"key": CONFIG_KEY}) or default_config()
    # Estos campos NUNCA se sobrescriben con string vacío — solo si vienen con valor real.
    # Esto previene que el frontend (al guardar otro cambio) pise estos valores cargados.
    preserve_if_empty = (
        "openai_api_key", "kapso_api_key", "kapso_webhook_secret", "external_admin_token",
        "openai_model", "kapso_phone_number_id", "external_api_base_url", "system_prompt",
    )
    for k, v in updates.items():
        if k in preserve_if_empty and (v is None or (isinstance(v, str) and v.strip() == "")):
            continue  # keep current
        current[k] = v
    current["key"] = CONFIG_KEY
    current["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.config.update_one({"key": CONFIG_KEY}, {"$set": current}, upsert=True)
    return await get_bot_config(db, masked=True)


# ─────────────────────────────────────────────────────────────────────────
# Knowledge base builder
# ─────────────────────────────────────────────────────────────────────────

async def _fetch_packages_summary(db, limit: int = 30, external_base: str = "") -> str:
    """Lista compacta de paquetes activos para inyectar en el system prompt.
    Si external_base está configurado, consume el endpoint público de ese deploy
    (BD productiva) en vez de la BD local del preview.
    """
    items: List[Dict[str, Any]] = []
    if external_base:
        url = f"{external_base.rstrip('/')}/api/packages"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(url, params={"limit": limit})
                if r.status_code == 200:
                    items = r.json() if isinstance(r.json(), list) else []
        except Exception as e:
            logger.warning("packages external fetch failed: %s — fallback to local", e)
            items = []
    if not items:
        cursor = db.packages.find({"is_active": {"$ne": False}}).sort("featured", -1).limit(limit)
        async for p in cursor:
            items.append(p)

    lines = ["## Paquetes activos"]
    for p in items[:limit]:
        title = p.get("title") or "(sin título)"
        country = p.get("country") or "—"
        days = p.get("duration_days") or "?"
        price = p.get("price") or 0
        member_price = p.get("member_price") or 0
        cat = p.get("category") or "paquete"
        try:
            line = f"- **{title}** · {country} · {days} días · Q.{float(price):,.0f}"
            if member_price:
                line += f" (socio Q.{float(member_price):,.0f})"
        except Exception:
            line = f"- **{title}** · {country}"
        line += f" · {cat}"
        lines.append(line)
    return "\n".join(lines) if len(lines) > 1 else "(sin paquetes activos)"


async def _fetch_commerces_summary(db, limit: int = 30, external_base: str = "") -> str:
    items: List[Dict[str, Any]] = []
    if external_base:
        url = f"{external_base.rstrip('/')}/api/commerce"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(url)
                if r.status_code == 200:
                    items = r.json() if isinstance(r.json(), list) else []
        except Exception as e:
            logger.warning("commerce external fetch failed: %s — fallback to local", e)
            items = []
    if not items:
        cursor = db.commerce.find({"status": "active", "is_active": {"$ne": False}}).limit(limit)
        async for c in cursor:
            items.append(c)

    lines = ["## Comercios aliados (Kuxtal Club)"]
    for c in items[:limit]:
        name = c.get("name") or ""
        cat = c.get("category") or ""
        loc = c.get("location") or ""
        ben = c.get("benefit_description") or ""
        line = f"- **{name}** ({cat}) · {loc}"
        if ben:
            line += f" → {ben}"
        lines.append(line)
    return "\n".join(lines) if len(lines) > 1 else "(sin comercios)"


def _format_member_context(member: Dict[str, Any]) -> str:
    if not member:
        return ""
    lines = [
        "## Socio autenticado",
        f"- Nombre: {member.get('name', '—')}",
        f"- Contrato: {member.get('contract_number', '—')}",
        f"- Estado: {'Activo' if member.get('is_active', True) else 'Inactivo'}",
    ]
    years = member.get("years_of_service")
    if years is not None:
        lines.append(f"- Años de membresía: {years}")
    return "\n".join(lines)


async def build_full_system_prompt(
    db,
    cfg: Dict[str, Any],
    member: Optional[Dict[str, Any]] = None,
) -> str:
    parts: List[str] = [cfg.get("system_prompt") or DEFAULT_SYSTEM_PROMPT]

    kb = (cfg.get("knowledge_base") or "").strip()
    if kb:
        parts.append("\n## Base de conocimiento (editable por admin)\n" + kb)

    external_base = (cfg.get("external_api_base_url") or "").strip()

    if cfg.get("include_packages"):
        parts.append("\n" + await _fetch_packages_summary(db, external_base=external_base))

    if cfg.get("include_commerces"):
        parts.append("\n" + await _fetch_commerces_summary(db, external_base=external_base))

    if cfg.get("include_member_data") and member:
        parts.append("\n" + _format_member_context(member))

    return "\n".join(parts)


async def lookup_member_by_phone(db, phone: str, cfg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Busca un socio por su número de WhatsApp.
    1) Primero intenta en el backend externo (productivo) si está configurado y hay token admin.
    2) Si no, fallback a la BD local del preview.
    """
    external_base = (cfg.get("external_api_base_url") or "").strip()
    admin_token = cfg.get("external_admin_token") or ""

    if external_base and admin_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    f"{external_base.rstrip('/')}/api/members",
                    params={"search": phone, "limit": 5},
                    headers={"Authorization": f"Bearer {admin_token}"},
                )
                if r.status_code == 200:
                    data = r.json()
                    items = data if isinstance(data, list) else data.get("items", [])
                    for m in items:
                        for field in ("phone", "whatsapp", "phone_secondary"):
                            v = (m.get(field) or "").replace("+", "").replace(" ", "").replace("-", "")
                            if v and v.endswith(phone[-8:]):
                                return {
                                    "name": m.get("name", ""),
                                    "contract_number": m.get("contract_number", ""),
                                    "is_active": m.get("is_active", True),
                                    "years_of_service": m.get("years_of_service"),
                                }
        except Exception as e:
            logger.warning("external member lookup failed: %s", e)

    # Local fallback
    return await db.members.find_one(
        {"$or": [{"phone": phone}, {"phone": f"+{phone}"}, {"whatsapp": phone}]},
        {"name": 1, "contract_number": 1, "is_active": 1, "years_of_service": 1, "_id": 0},
    )


# ─────────────────────────────────────────────────────────────────────────
# Conversation store
# ─────────────────────────────────────────────────────────────────────────

async def get_or_create_session(db, session_id: str, channel: str = "whatsapp") -> Dict[str, Any]:
    conv = await db.bot_conversations.find_one({"session_id": session_id})
    if conv:
        return conv
    conv = {
        "session_id": session_id,
        "channel": channel,
        "messages": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bot_conversations.insert_one(conv)
    conv.pop("_id", None)
    return conv


async def append_message(db, session_id: str, role: str, content: str) -> None:
    await db.bot_conversations.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": {"role": role, "content": content, "ts": datetime.now(timezone.utc).isoformat()}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )


async def list_conversations(db, limit: int = 50) -> List[Dict[str, Any]]:
    out = []
    cursor = db.bot_conversations.find({}, {"_id": 0}).sort("updated_at", -1).limit(limit)
    async for c in cursor:
        msgs = c.get("messages", [])
        c["message_count"] = len(msgs)
        c["last_message"] = msgs[-1]["content"][:120] if msgs else ""
        out.append(c)
    return out


# ─────────────────────────────────────────────────────────────────────────
# OpenAI chat call
# ─────────────────────────────────────────────────────────────────────────

async def chat_once(
    *,
    api_key: str,
    model: str,
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
    session_id: str,
) -> str:
    """Una sola tanda: arma el LlmChat con system_prompt + history y manda user_message.
    LlmChat es stateful por instancia; reproducimos el historial mandándolo como mensajes
    iniciales antes de la pregunta actual.
    """
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model("openai", model)

    # Replay history sin esperar respuesta (truco: usamos send_message solo para el último).
    # Como LlmChat solo expone send_message, vamos a inlinar el contexto histórico
    # en el user_message final si no hay forma de pre-cargar. Para multi-turn correcto,
    # nuestro history se intercala como pares user/assistant en el system_prompt extendido.
    if history:
        history_block = "\n\n## Historial reciente de la conversación\n"
        for m in history[-10:]:
            role = "Usuario" if m["role"] == "user" else "Asistente"
            history_block += f"{role}: {m['content']}\n"
        chat.system_message = system_prompt + history_block

    response = await chat.send_message(UserMessage(text=user_message))
    return str(response).strip()


# ─────────────────────────────────────────────────────────────────────────
# Kapso WhatsApp
# ─────────────────────────────────────────────────────────────────────────

def verify_kapso_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def send_whatsapp_message(
    *, kapso_api_key: str, phone_number_id: str, to: str, text: str
) -> Dict[str, Any]:
    if not kapso_api_key or not phone_number_id:
        raise RuntimeError("Kapso no configurado (api_key/phone_number_id faltan)")

    url = f"{KAPSO_BASE}/{KAPSO_API_VERSION}/{phone_number_id}/messages"
    body = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"body": text[:4096]},
    }
    headers = {
        "X-API-Key": kapso_api_key,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, headers=headers, content=json.dumps(body))
        if r.status_code >= 300:
            logger.error("Kapso send failed %s: %s", r.status_code, r.text[:500])
            raise RuntimeError(f"Kapso error {r.status_code}: {r.text[:300]}")
        return r.json()


def extract_inbound_message(event_payload: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """Normaliza el payload de Kapso a { from, text, message_id }.
    Soporta:
    - Kapso v2 (payload.message.from + payload.message.text.body)
    - Formato simple (payload.from + payload.text)
    - Meta-style anidado (payload.entry[].changes[].value.messages[])
    - Mensajes no-texto (audio, imagen, video, etc.) → texto sintético para que el bot guíe al usuario.
    """
    try:
        # Caso 1: Kapso v2 — message en root o en data
        msg = event_payload.get("message") or (event_payload.get("data") or {}).get("message")
        if msg and isinstance(msg, dict):
            sender = msg.get("from", "")
            msg_type = msg.get("type", "text")
            text = ""

            text_node = msg.get("text") or {}
            if isinstance(text_node, dict):
                text = text_node.get("body", "")
            elif isinstance(text_node, str):
                text = text_node

            # Fallback 1: kapso.content (texto pre-procesado por Kapso)
            if not text:
                text = (msg.get("kapso") or {}).get("content", "")

            # Fallback 2: button/interactive replies
            if not text and msg.get("button"):
                text = msg["button"].get("text", "") or msg["button"].get("payload", "")
            if not text and msg.get("interactive"):
                inter = msg["interactive"]
                br = inter.get("button_reply") or inter.get("list_reply") or {}
                text = br.get("title", "") or br.get("id", "")

            # Fallback 3: tipo no-texto → mensaje sintético claro
            if not text and msg_type != "text":
                synthetic_map = {
                    "audio": "[el cliente envió un audio]",
                    "voice": "[el cliente envió una nota de voz]",
                    "image": "[el cliente envió una imagen]",
                    "video": "[el cliente envió un video]",
                    "document": "[el cliente envió un documento]",
                    "sticker": "[el cliente envió un sticker]",
                    "location": "[el cliente compartió una ubicación]",
                    "contacts": "[el cliente compartió un contacto]",
                }
                text = synthetic_map.get(msg_type, f"[mensaje de tipo {msg_type}]")

            if sender and text:
                return {
                    "from": str(sender),
                    "text": str(text),
                    "message_id": str(msg.get("id", "")),
                    "type": str(msg_type),
                }

        # Caso 2: simple flat
        data = event_payload.get("data") or event_payload
        if "from" in data and "text" in data:
            text_val = data["text"] if isinstance(data["text"], str) else data["text"].get("body", "")
            if text_val:
                return {
                    "from": str(data["from"]),
                    "text": str(text_val),
                    "message_id": str(data.get("id") or data.get("message_id") or ""),
                    "type": "text",
                }

        # Caso 3: Meta-style anidado
        meta_msg = (
            data.get("entry", [{}])[0]
            .get("changes", [{}])[0]
            .get("value", {})
            .get("messages", [{}])[0]
        )
        if meta_msg:
            return {
                "from": str(meta_msg.get("from", "")),
                "text": str((meta_msg.get("text") or {}).get("body", "")),
                "message_id": str(meta_msg.get("id", "")),
                "type": str(meta_msg.get("type", "text")),
            }
    except Exception as e:
        logger.warning("extract_inbound_message failed: %s", e)
    return None
