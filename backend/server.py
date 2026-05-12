from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Response, Query, Header, Depends
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
from bson import ObjectId
import os
import uuid
import requests
from pywebpush import webpush, WebPushException
import json as json_module
import random
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional

# Shared core: DB client, JWT/session helpers, storage, constants, logger.
from core import (
    db,
    client,
    logger,
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    get_current_user,
    require_role,
    serialize_doc,
    verify_delete_code,
    init_storage,
    put_object,
    get_object,
    JWT_ALGORITHM,
    STORAGE_URL,
    EMERGENT_KEY,
    APP_NAME,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_EMAIL,
    COOKIE_SECURE,
    DELETE_SECRET,
    get_jwt_secret,
    ROOT_DIR,
)
# JWT + bcrypt still needed for inline password handling in a few endpoints.
import bcrypt
import jwt

from routers import auth as auth_router
from routers import packages as packages_router
from routers import quotations as quotations_router

app = FastAPI()
api_router = APIRouter(prefix="/api")
app.include_router(auth_router.router)
app.include_router(packages_router.router)
app.include_router(quotations_router.router)

# ── Pydantic Models ──
# LoginRequest / MemberLoginRequest now live in /app/backend/routers/auth.py

class MemberCreate(BaseModel):
    contract_number: str
    dpi: str
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    service_years: int = 1
    membership_start: Optional[str] = ""
    membership_end: Optional[str] = ""
    family_members_allowed: int = 1
    investment_amount: Optional[float] = 0
    investment_plan: Optional[str] = ""
    status: str = "active"
    # Datos del propietario
    contract_date: Optional[str] = ""
    age: Optional[int] = 0
    marital_status: Optional[str] = ""
    nationality: Optional[str] = ""
    profession: Optional[str] = ""
    address: Optional[str] = ""
    # Datos del copropietario
    coowner_name: Optional[str] = ""
    coowner_nationality: Optional[str] = ""
    coowner_profession: Optional[str] = ""
    coowner_phone: Optional[str] = ""
    coowner_email: Optional[str] = ""
    coowner_dpi: Optional[str] = ""
    coowner_birth_date: Optional[str] = ""
    # Datos de contrato / facturación
    vigencia: Optional[str] = ""
    cuotas: Optional[str] = ""
    bank: Optional[str] = ""
    termination_date: Optional[str] = ""
    tc: Optional[str] = ""
    nit: Optional[str] = ""
    billing_name: Optional[str] = ""
    observations: Optional[str] = ""
    # Campos adicionales exclusivos del export formal
    dpi_words: Optional[str] = ""  # DPI escrito en letras
    coowner_investment: Optional[str] = ""  # Inversión del copropietario (p.ej. "50%")

# PackageCreate moved to /app/backend/routers/packages.py
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = ""
    link: Optional[str] = ""
    target: str = "all"
    status: str = "active"

class VacationRequestCreate(BaseModel):
    package_id: Optional[str] = ""
    destination: str
    travel_date: str
    guests: int = 1
    message: Optional[str] = ""

class WhatsAppConfig(BaseModel):
    phone: str

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    dpi: Optional[str] = ""
    notes: Optional[str] = ""

# ── Commerce Models ──

COMMERCE_CATEGORIES = [
    "Restaurantes", "Mascotas", "Hospitales", "Servicios",
    "Belleza", "Deportes", "Tecnología", "Educación",
    "Moda Mujer", "Moda Hombre", "Hogar", "Entretenimiento"
]

DEFAULT_CATEGORY_ICONS = {
    "Restaurantes": "🍽️", "Mascotas": "🐾", "Hospitales": "🏥", "Servicios": "🔧",
    "Belleza": "💆", "Deportes": "🏋️", "Tecnología": "💻", "Educación": "📚",
    "Moda Mujer": "👗", "Moda Hombre": "👔", "Hogar": "🏠", "Entretenimiento": "🎭"
}

class CommerceCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    category: str = "Servicios"
    location: Optional[str] = ""
    address: Optional[str] = ""
    google_maps_url: Optional[str] = ""
    waze_url: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    logo_url: Optional[str] = ""
    youtube_video: Optional[str] = ""
    photos: List[str] = []
    social_facebook: Optional[str] = ""
    social_instagram: Optional[str] = ""
    social_tiktok: Optional[str] = ""
    social_twitter: Optional[str] = ""
    benefit_description: Optional[str] = ""
    validation_code: Optional[str] = ""
    status: str = "active"
    featured: bool = False

class CommercePromotionCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    start_date: str
    end_date: str
    status: str = "active"

class ScratchCardCreate(BaseModel):
    front_image_url: Optional[str] = ""
    prize_image_url: Optional[str] = ""
    lose_image_url: Optional[str] = ""
    prize_text: str = "Ganaste un premio"
    lose_text: str = "Sigue intentando"
    frequency_type: str = "percentage"
    frequency_value: int = 20
    active: bool = True

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict

class FamilyMemberCreate(BaseModel):
    name: str
    dpi: str
    relationship: str = "familiar"
    phone: Optional[str] = ""
    email: Optional[str] = ""
    birth_date: Optional[str] = ""


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    dpi: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None

class ChatMessageCreate(BaseModel):
    text: str

class ReferralSubmit(BaseModel):
    name: str
    email: str
    phone: str
    message: Optional[str] = ""

# ── Auth Routes ──
# Moved to /app/backend/routers/auth.py (mounted at FastAPI app level).
# Models LoginRequest / MemberLoginRequest live alongside the routes there.

# ── Members CRUD (Admin) ──

@api_router.get("/members")
async def list_members(request: Request, search: Optional[str] = None, status: Optional[str] = None):
    await require_role("super_admin", "admin")(request)
    query = {}
    if status:
        query["status"] = status
    if search:
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"contract_number": {"$regex": s, "$options": "i"}},
            {"dpi": {"$regex": s, "$options": "i"}},
            {"phone": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
        ]
    members_list = []
    async for m in db.members.find(query).limit(1000):
        members_list.append(serialize_doc(m))
    return members_list

@api_router.post("/members")
async def create_member(req: MemberCreate, request: Request):
    user = await require_role("super_admin", "admin", permission="members")(request)
    existing = await db.members.find_one({"contract_number": req.contract_number})
    if existing:
        raise HTTPException(status_code=400, detail="Número de contrato ya existe")
    doc = req.model_dump()
    # Normalizar teléfonos guatemaltecos para WhatsApp
    if doc.get("phone"):
        doc["phone"] = _normalize_gt_phone(doc["phone"])
    if doc.get("coowner_phone"):
        doc["coowner_phone"] = _normalize_gt_phone(doc["coowner_phone"])
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.members.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    # Auto-crear usuario del socio: login = contract_number, password = dpi
    contract = (req.contract_number or "").strip()
    dpi = (req.dpi or "").strip()
    if contract and dpi:
        member_email = f"{contract}@kuxtal.member"
        already_user = await db.users.find_one({"email": member_email})
        if not already_user:
            await db.users.insert_one({
                "email": member_email,
                "password_hash": hash_password(dpi),
                "name": req.name,
                "role": "member",
                "member_id": str(result.inserted_id),
                "is_family_member": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    return doc

@api_router.put("/members/{member_id}")
async def update_member(member_id: str, req: MemberCreate, request: Request):
    await require_role("super_admin", "admin", permission="members")(request)
    prev = await db.members.find_one({"_id": ObjectId(member_id)})
    if not prev:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    update_data = req.model_dump()
    # Normalizar teléfonos guatemaltecos para WhatsApp
    if update_data.get("phone"):
        update_data["phone"] = _normalize_gt_phone(update_data["phone"])
    if update_data.get("coowner_phone"):
        update_data["coowner_phone"] = _normalize_gt_phone(update_data["coowner_phone"])
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.members.update_one({"_id": ObjectId(member_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    # Sincronizar usuario principal del socio si cambió contract_number o dpi
    new_contract = (req.contract_number or "").strip()
    new_dpi = (req.dpi or "").strip()
    if new_contract and new_dpi:
        new_email = f"{new_contract}@kuxtal.member"
        existing_user = await db.users.find_one({
            "member_id": str(prev["_id"]),
            "$or": [{"family_dpi": None}, {"family_dpi": {"$exists": False}}],
        })
        if existing_user:
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {
                    "email": new_email,
                    "password_hash": hash_password(new_dpi),
                    "name": req.name,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
        else:
            if not await db.users.find_one({"email": new_email}):
                await db.users.insert_one({
                    "email": new_email,
                    "password_hash": hash_password(new_dpi),
                    "name": req.name,
                    "role": "member",
                    "member_id": str(prev["_id"]),
                    "is_family_member": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
    updated = await db.members.find_one({"_id": ObjectId(member_id)})

    # ── Sync coowner_* changes back to the family_members collection ─────────────
    co_name = (update_data.get("coowner_name") or "").strip()
    existing_fam = await db.family_members.find_one({"member_id": member_id})
    if co_name:
        fam_updates = {
            "name": co_name,
            "phone": update_data.get("coowner_phone", ""),
            "email": (update_data.get("coowner_email") or "").strip(),
            "birth_date": (update_data.get("coowner_birth_date") or "").strip(),
            "nationality": (update_data.get("coowner_nationality") or "").strip(),
            "profession": (update_data.get("coowner_profession") or "").strip(),
            "investment": (update_data.get("coowner_investment") or "").strip(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        co_dpi = (update_data.get("coowner_dpi") or "").strip()
        if co_dpi:
            fam_updates["dpi"] = co_dpi
        if existing_fam:
            await db.family_members.update_one({"_id": existing_fam["_id"]}, {"$set": fam_updates})
            # Sync the linked user's password if DPI changed
            if co_dpi and co_dpi != existing_fam.get("dpi", ""):
                await db.users.update_many(
                    {"member_id": member_id, "family_dpi": existing_fam.get("dpi", "")},
                    {"$set": {"family_dpi": co_dpi, "password_hash": hash_password(co_dpi)}}
                )
        else:
            await db.family_members.insert_one({
                "member_id": member_id,
                "contract_number": updated.get("contract_number", ""),
                "name": co_name,
                "dpi": co_dpi or (updated.get("dpi", "") + "-CP"),
                "relationship": "copropietario",
                "phone": fam_updates["phone"],
                "email": fam_updates["email"],
                "birth_date": fam_updates["birth_date"],
                "nationality": fam_updates["nationality"],
                "profession": fam_updates["profession"],
                "investment": fam_updates["investment"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "auto_synced": True,
            })
    elif existing_fam and update_data.get("coowner_name") == "":
        # Coowner name was explicitly cleared → drop the linked record + user
        await db.family_members.delete_one({"_id": existing_fam["_id"]})
        await db.users.delete_many({"member_id": member_id, "family_dpi": existing_fam.get("dpi", "")})

    return serialize_doc(updated)

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, request: Request):
    await require_role("super_admin", "admin", permission="members")(request)
    await verify_delete_code(request)
    result = await db.members.delete_one({"_id": ObjectId(member_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return {"message": "Socio eliminado"}


class _MembersBulkActionReq(BaseModel):
    member_ids: List[str]
    action: str  # "activate" | "deactivate" | "delete"
    delete_code: Optional[str] = None


@api_router.post("/members/bulk-action")
async def members_bulk_action(req: _MembersBulkActionReq, request: Request):
    """Acción en lote sobre socios. Para 'delete' requiere el código de seguridad."""
    user = await require_role("super_admin", "admin", permission="members")(request)
    if not req.member_ids:
        raise HTTPException(status_code=400, detail="No hay socios seleccionados")
    if req.action not in ("activate", "deactivate", "delete"):
        raise HTTPException(status_code=400, detail="Acción no válida")

    # Convert ids
    try:
        oids = [ObjectId(mid) for mid in req.member_ids]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"IDs inválidos: {e}") from e

    if req.action == "delete":
        await verify_delete_code(request)
        result = await db.members.delete_many({"_id": {"$in": oids}})
        # Eliminar también los users vinculados
        member_ids_str = [str(o) for o in oids]
        await db.users.delete_many({"member_id": {"$in": member_ids_str}})
        return {"action": "delete", "matched": len(oids), "affected": result.deleted_count}

    new_status = "active" if req.action == "activate" else "inactive"
    result = await db.members.update_many(
        {"_id": {"$in": oids}},
        {"$set": {"status": new_status, "is_active": new_status == "active", "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user["_id"]}},
    )
    return {"action": req.action, "matched": len(oids), "affected": result.modified_count}



# ── Packages CRUD + Drive import ──
# Moved to /app/backend/routers/packages.py (mounted at FastAPI app level).
# PackageCreate model lives alongside the routes there.

@api_router.get("/clients")
async def list_clients(request: Request, search: Optional[str] = None):
    await require_role("super_admin", "admin")(request)
    query = {}
    if search:
        s = search.strip()
        query = {"$or": [
            {"name": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}},
            {"phone": {"$regex": s, "$options": "i"}},
            {"dpi": {"$regex": s, "$options": "i"}},
        ]}
    results = []
    async for c in db.clients.find(query).sort("created_at", -1).limit(500):
        results.append(serialize_doc(c))
    return results

@api_router.post("/clients")
async def create_client(req: ClientCreate, request: Request):
    await require_role("super_admin", "admin", permission="clients")(request)
    email = (req.email or "").strip().lower()
    phone = (req.phone or "").strip()
    # De-dup check
    if email:
        existing = await db.clients.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail=f"Ya existe un cliente con ese email ({existing.get('name')})")
    doc = req.model_dump()
    doc["email"] = email
    doc["phone"] = phone
    doc["source"] = "manual"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.clients.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize_doc(doc)

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, req: ClientCreate, request: Request):
    await require_role("super_admin", "admin", permission="clients")(request)
    updates = req.model_dump()
    updates["email"] = (updates.get("email") or "").strip().lower()
    updates["phone"] = (updates.get("phone") or "").strip()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.clients.update_one({"_id": ObjectId(client_id)}, {"$set": updates})
    c = await db.clients.find_one({"_id": ObjectId(client_id)})
    return serialize_doc(c)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, request: Request):
    await require_role("super_admin", "admin", permission="clients")(request)
    await verify_delete_code(request)
    await db.clients.delete_one({"_id": ObjectId(client_id)})
    return {"message": "Cliente eliminado"}

# ── Announcements ──

@api_router.get("/announcements")
async def list_announcements(target: Optional[str] = None):
    query = {"status": "active"}
    if target:
        query["$or"] = [{"target": target}, {"target": "all"}]
    announcements = []
    async for a in db.announcements.find(query).sort("created_at", -1).limit(100):
        announcements.append(serialize_doc(a))
    return announcements

@api_router.post("/announcements")
async def create_announcement(req: AnnouncementCreate, request: Request):
    user = await require_role("super_admin", "admin", permission="announcements")(request)
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.announcements.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.delete("/announcements/{ann_id}")
async def delete_announcement(ann_id: str, request: Request):
    await require_role("super_admin", "admin", permission="announcements")(request)
    await verify_delete_code(request)
    await db.announcements.update_one({"_id": ObjectId(ann_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Anuncio eliminado"}

# ── Vacation Requests ──

@api_router.post("/vacation-requests")
async def create_vacation_request(req: VacationRequestCreate, request: Request):
    user = await get_current_user(request)
    doc = req.model_dump()
    doc["user_id"] = user["_id"]
    doc["user_name"] = user.get("name", "")
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["messages"] = [{"from": user.get("name", ""), "text": req.message or "", "at": datetime.now(timezone.utc).isoformat()}]
    result = await db.vacation_requests.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/vacation-requests")
async def list_vacation_requests(request: Request):
    user = await get_current_user(request)
    if user["role"] in ["super_admin", "admin"]:
        reqs = []
        async for r in db.vacation_requests.find().sort("created_at", -1).limit(200):
            reqs.append(serialize_doc(r))
        return reqs
    else:
        reqs = []
        async for r in db.vacation_requests.find({"user_id": user["_id"]}).sort("created_at", -1).limit(50):
            reqs.append(serialize_doc(r))
        return reqs

@api_router.put("/vacation-requests/{req_id}/message")
async def add_message(req_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    msg = {"from": user.get("name", ""), "role": user.get("role", ""), "text": body.get("text", ""), "at": datetime.now(timezone.utc).isoformat()}
    await db.vacation_requests.update_one({"_id": ObjectId(req_id)}, {"$push": {"messages": msg}})
    return {"message": "Mensaje agregado"}

@api_router.put("/vacation-requests/{req_id}/status")
async def update_request_status(req_id: str, request: Request):
    await require_role("super_admin", "admin", permission="requests")(request)
    body = await request.json()
    await db.vacation_requests.update_one({"_id": ObjectId(req_id)}, {"$set": {"status": body.get("status", "pending")}})
    return {"message": "Estado actualizado"}

# ── WhatsApp Config ──

@api_router.get("/config/whatsapp")
async def get_whatsapp_config():
    config = await db.config.find_one({"key": "whatsapp"})
    if config:
        return {"phone": config.get("phone", "")}
    return {"phone": ""}

@api_router.put("/config/whatsapp")
async def set_whatsapp_config(req: WhatsAppConfig, request: Request):
    await require_role("super_admin", "admin", permission="settings")(request)
    await db.config.update_one({"key": "whatsapp"}, {"$set": {"key": "whatsapp", "phone": req.phone}}, upsert=True)
    return {"message": "Configuración actualizada", "phone": req.phone}

# ── Pricing markups (public vs agency / member vs agency) ──

class PricingSettings(BaseModel):
    public_markup_percent: float = 30.0
    member_markup_percent: float = 15.0

@api_router.get("/config/pricing-settings")
async def get_pricing_settings():
    cfg = await db.config.find_one({"key": "pricing_settings"})
    if cfg:
        return {
            "public_markup_percent": float(cfg.get("public_markup_percent", 30) or 0),
            "member_markup_percent": float(cfg.get("member_markup_percent", 15) or 0),
        }
    return {"public_markup_percent": 30.0, "member_markup_percent": 15.0}

@api_router.put("/config/pricing-settings")
async def set_pricing_settings(req: PricingSettings, request: Request):
    await require_role("super_admin", "admin", permission="settings")(request)
    await db.config.update_one(
        {"key": "pricing_settings"},
        {"$set": {
            "key": "pricing_settings",
            "public_markup_percent": max(0.0, float(req.public_markup_percent or 0)),
            "member_markup_percent": max(0.0, float(req.member_markup_percent or 0)),
        }},
        upsert=True,
    )
    return {"message": "Porcentajes de markup actualizados", "public_markup_percent": req.public_markup_percent, "member_markup_percent": req.member_markup_percent}

@api_router.get("/admin/packages/recalculatable-count")
async def packages_recalculatable_count(request: Request):
    await require_role("super_admin", "admin", permission="packages")(request)
    count = await db.packages.count_documents({"agency_price": {"$gt": 0}})
    total = await db.packages.count_documents({})
    return {"total": total, "with_agency_price": count, "without_agency_price": total - count}

@api_router.post("/admin/packages/recalculate-prices")
async def recalculate_package_prices(request: Request):
    await require_role("super_admin", "admin", permission="packages")(request)
    cfg = await db.config.find_one({"key": "pricing_settings"}) or {}
    public_pct = float(cfg.get("public_markup_percent", 30) or 0)
    member_pct = float(cfg.get("member_markup_percent", 15) or 0)
    updated = 0
    skipped = 0
    async for pkg in db.packages.find({"agency_price": {"$gt": 0}}):
        agency = float(pkg.get("agency_price") or 0)
        if agency <= 0:
            skipped += 1
            continue
        new_price = round(agency * (1 + public_pct / 100))
        new_member = round(agency * (1 + member_pct / 100))
        await db.packages.update_one({"_id": pkg["_id"]}, {"$set": {"price": new_price, "member_price": new_member, "updated_at": datetime.now(timezone.utc).isoformat()}})
        updated += 1
    return {
        "message": f"Se recalcularon {updated} paquetes",
        "updated": updated,
        "skipped_without_agency_price": skipped,
        "public_markup_percent": public_pct,
        "member_markup_percent": member_pct,
    }

# ── File Upload ──

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    file_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ── Commerce CRUD ──

@api_router.get("/commerce/categories")
async def get_commerce_categories(full: Optional[bool] = False):
    # Return merged list of system defaults + user-created categories.
    user_cats = {}
    async for c in db.commerce_categories.find({}):
        user_cats[c.get("name", "")] = c.get("icon", "🏷️")
    merged = []
    seen = set()
    for name in COMMERCE_CATEGORIES:
        if name in seen:
            continue
        seen.add(name)
        merged.append({
            "name": name,
            "icon": user_cats.get(name, DEFAULT_CATEGORY_ICONS.get(name, "🏷️")),
            "system": True,
        })
    for name, icon in user_cats.items():
        if name in seen:
            continue
        seen.add(name)
        merged.append({"name": name, "icon": icon, "system": False})
    if full:
        return merged
    # Legacy: return plain list of names
    return [c["name"] for c in merged]

@api_router.post("/commerce/categories")
async def create_commerce_category(request: Request):
    await require_role("super_admin", "admin", permission="categories")(request)
    body = await request.json()
    name = (body.get("name") or "").strip()
    icon = (body.get("icon") or "🏷️").strip() or "🏷️"
    if not name:
        raise HTTPException(status_code=400, detail="Nombre requerido")
    existing = await db.commerce_categories.find_one({"name": name})
    if existing or name in COMMERCE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Categoría ya existe")
    await db.commerce_categories.insert_one({
        "name": name, "icon": icon,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"name": name, "icon": icon}

async def _validate_category_rename(old_name: str, new_name: str) -> None:
    if new_name == old_name:
        return
    if new_name in COMMERCE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Nombre ya existe como categoría del sistema")
    if await db.commerce_categories.find_one({"name": new_name}):
        raise HTTPException(status_code=400, detail="Nombre ya existe")


async def _upsert_system_category_icon(name: str, icon: str) -> dict:
    """System categories: only icon can be overridden (rename is forbidden)."""
    resolved_icon = icon or DEFAULT_CATEGORY_ICONS.get(name, "🏷️")
    await db.commerce_categories.update_one(
        {"name": name},
        {"$set": {"name": name, "icon": resolved_icon}},
        upsert=True,
    )
    return {"name": name, "icon": resolved_icon}


async def _apply_custom_category_update(name: str, new_name: str, icon: str) -> dict:
    update_fields = {}
    if icon:
        update_fields["icon"] = icon
    if new_name != name:
        update_fields["name"] = new_name
        # Propagate rename to all commerces using this category
        await db.commerce.update_many({"category": name}, {"$set": {"category": new_name}})
    if not update_fields:
        return {"name": name, "icon": icon}
    result = await db.commerce_categories.update_one({"name": name}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"name": new_name, "icon": icon}


@api_router.put("/commerce/categories/{name}")
async def update_commerce_category(name: str, request: Request):
    await require_role("super_admin", "admin", permission="categories")(request)
    body = await request.json()
    new_name = (body.get("name") or name).strip()
    icon = (body.get("icon") or "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Nombre requerido")

    await _validate_category_rename(name, new_name)

    if name in COMMERCE_CATEGORIES:
        if new_name != name:
            raise HTTPException(status_code=400, detail="No se puede renombrar una categoría del sistema, solo cambiar el icono")
        return await _upsert_system_category_icon(name, icon)

    return await _apply_custom_category_update(name, new_name, icon)

@api_router.delete("/commerce/categories/{name}")
async def delete_commerce_category(name: str, request: Request):
    await require_role("super_admin", "admin", permission="categories")(request)
    await verify_delete_code(request)
    if name in COMMERCE_CATEGORIES:
        raise HTTPException(status_code=400, detail="No se pueden eliminar categorías del sistema")
    result = await db.commerce_categories.delete_one({"name": name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada"}

@api_router.get("/commerce")
async def list_commerce(category: Optional[str] = None, search: Optional[str] = None, status: Optional[str] = None, featured: Optional[bool] = None, request: Request = None):
    # Public consumers get only active/approved commerces. Admins may pass ?status=pending to see pending submissions.
    is_admin = False
    if request is not None:
        try:
            u = await get_current_user(request)
            is_admin = u.get("role") in ("super_admin", "admin")
        except Exception:
            is_admin = False
    if is_admin and status:
        query = {"status": status}
    elif is_admin:
        # Admin default view: active approved (any is_active state — toggle visible en UI)
        query = {"status": "active"}
    else:
        query = {"status": "active", "is_active": {"$ne": False}}
    if category:
        query["category"] = category
    if featured is True:
        query["featured"] = True
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    results = []
    async for c in db.commerce.find(query).sort("name", 1).limit(200):
        results.append(serialize_doc(c))
    return results

@api_router.get("/commerce/{commerce_id}")
async def get_commerce(commerce_id: str):
    c = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
    return serialize_doc(c)

@api_router.post("/commerce")
async def create_commerce(req: CommerceCreate, request: Request):
    # Allow public registration, but public submissions need admin approval before appearing in the public catalog.
    is_admin = False
    created_by = ""
    try:
        user = await get_current_user(request)
        created_by = user.get("_id", "")
        is_admin = user.get("role") in ("super_admin", "admin")
    except Exception:
        pass
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = created_by
    # Only super_admin/admin can create an already-active commerce. Everyone else goes to pending.
    doc["status"] = doc.get("status") if is_admin and doc.get("status") else ("active" if is_admin else "pending")
    # New commerces ALWAYS start in "off" state (switch apagado); admin or the commerce owner must turn it on
    doc["is_active"] = False
    if not doc["validation_code"]:
        doc["validation_code"] = str(uuid.uuid4())[:8].upper()
    result = await db.commerce.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    # Create commerce user account (so they can log in to manage their profile regardless of approval state)
    commerce_email = f"commerce_{result.inserted_id}@kuxtal.commerce"
    existing_user = await db.users.find_one({"email": commerce_email})
    if not existing_user:
        try:
            await db.users.insert_one({
                "email": commerce_email,
                "password_hash": hash_password(doc["validation_code"]),
                "name": doc["name"],
                "role": "commerce",
                "commerce_id": str(result.inserted_id),
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        except Exception:
            pass
    # Only broadcast "new commerce" to members once the commerce is active AND on (not for initial create since is_active=False).
    if doc["status"] == "active" and doc.get("is_active"):
        await _broadcast_news(
            title="Nuevo comercio afiliado",
            message=f"{doc.get('name','')} - {doc.get('benefit_description') or doc.get('category','')}. ¡Disfruta tus beneficios!",
            link=f"/commerce/{doc['_id']}",
            image_url=doc.get("logo_url", ""),
            target="all",
        )
    return doc

@api_router.post("/admin/commerce/{commerce_id}/approve")
async def approve_commerce(commerce_id: str, request: Request):
    await require_role("super_admin", "admin", permission="commerce")(request)
    pkg = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not pkg:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
    if pkg.get("status") == "active":
        return {"message": "El comercio ya estaba activo", "status": "active"}
    await db.commerce.update_one(
        {"_id": ObjectId(commerce_id)},
        {"$set": {"status": "active", "approved_at": datetime.now(timezone.utc).isoformat()}},
    )
    await _broadcast_news(
        title="Nuevo comercio afiliado",
        message=f"{pkg.get('name','')} - {pkg.get('benefit_description') or pkg.get('category','')}. ¡Disfruta tus beneficios!",
        link=f"/commerce/{commerce_id}",
        image_url=pkg.get("logo_url", ""),
        target="all",
    )
    return {"message": "Comercio autorizado", "status": "active"}

@api_router.post("/admin/commerce/{commerce_id}/reject")
async def reject_commerce(commerce_id: str, request: Request):
    await require_role("super_admin", "admin", permission="commerce")(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}
    reason = (body.get("reason") or "").strip()
    result = await db.commerce.update_one(
        {"_id": ObjectId(commerce_id)},
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat(), "rejection_reason": reason}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
    return {"message": "Comercio rechazado", "status": "rejected"}

def _can_toggle_commerce(user: dict, commerce_id: str) -> bool:
    role = user.get("role")
    if role == "super_admin":
        return True
    if role == "admin":
        return bool((user.get("permissions") or {}).get("commerce"))
    if role == "commerce":
        return user.get("commerce_id") == commerce_id
    return False


async def _broadcast_commerce_first_activation(commerce_id: str, target: dict) -> None:
    """Broadcast when a commerce is turned ON for the first time (only if approved)."""
    if target.get("status") != "active" or target.get("first_activated_at"):
        return
    await db.commerce.update_one(
        {"_id": ObjectId(commerce_id)},
        {"$set": {"first_activated_at": datetime.now(timezone.utc).isoformat()}},
    )
    try:
        await _broadcast_news(
            title="Nuevo comercio afiliado",
            message=f"{target.get('name','')} - {target.get('benefit_description') or target.get('category','')}. ¡Disfruta tus beneficios!",
            link=f"/commerce/{commerce_id}",
            image_url=target.get("logo_url", ""),
            target="all",
        )
    except Exception as e:
        logger.warning(f"broadcast failed: {e}")


@api_router.put("/commerce/{commerce_id}/toggle-active")
async def toggle_commerce_active(commerce_id: str, request: Request):
    """Turn commerce listing ON/OFF. Allowed for super_admin, admin with commerce permission, or the commerce owner."""
    current = await get_current_user(request)
    target = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    if not _can_toggle_commerce(current, commerce_id):
        raise HTTPException(status_code=403, detail="No tienes permiso para cambiar el estado de este comercio")

    new_active = not target.get("is_active", False)
    await db.commerce.update_one(
        {"_id": ObjectId(commerce_id)},
        {"$set": {"is_active": new_active, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    if new_active:
        await _broadcast_commerce_first_activation(commerce_id, target)

    return {"message": f"Comercio {'activado' if new_active else 'desactivado'}", "is_active": new_active}


# Hard cap for home-page editorial curation. Matches PARTNERS_LIMIT on the frontend.
COMMERCE_FEATURED_LIMIT = 8


@api_router.put("/commerce/{commerce_id}/toggle-featured")
async def toggle_commerce_featured(commerce_id: str, request: Request):
    """Mark/unmark a commerce as featured (shown in home 'Nuestros aliados'). Admin-only. Hard cap enforced."""
    await require_role("super_admin", "admin", permission="commerce")(request)
    target = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    new_featured = not target.get("featured", False)
    if new_featured:
        current_count = await db.commerce.count_documents({"featured": True})
        if current_count >= COMMERCE_FEATURED_LIMIT:
            raise HTTPException(
                status_code=400,
                detail=f"Límite alcanzado: máximo {COMMERCE_FEATURED_LIMIT} aliados destacados. Quita uno antes de agregar otro.",
            )

    await db.commerce.update_one(
        {"_id": ObjectId(commerce_id)},
        {"$set": {"featured": new_featured, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {
        "message": f"Comercio {'destacado en home' if new_featured else 'removido de destacados'}",
        "featured": new_featured,
    }

# ── Social links (footer) ──

class SocialLinks(BaseModel):
    facebook: str = ""
    instagram: str = ""
    tiktok: str = ""
    twitter: str = ""
    youtube: str = ""
    linkedin: str = ""
    whatsapp: str = ""

@api_router.get("/config/social-links")
async def get_social_links():
    cfg = await db.config.find_one({"key": "social_links"})
    if not cfg:
        return SocialLinks().model_dump()
    return {
        "facebook": cfg.get("facebook", ""),
        "instagram": cfg.get("instagram", ""),
        "tiktok": cfg.get("tiktok", ""),
        "twitter": cfg.get("twitter", ""),
        "youtube": cfg.get("youtube", ""),
        "linkedin": cfg.get("linkedin", ""),
        "whatsapp": cfg.get("whatsapp", ""),
    }

@api_router.put("/config/social-links")
async def set_social_links(req: SocialLinks, request: Request):
    await require_role("super_admin", "admin", permission="settings")(request)
    doc = {"key": "social_links", **req.model_dump()}
    await db.config.update_one({"key": "social_links"}, {"$set": doc}, upsert=True)
    return {"message": "Redes sociales actualizadas", **req.model_dump()}

@api_router.put("/commerce/{commerce_id}")
async def update_commerce(commerce_id: str, req: CommerceCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("commerce_id") != commerce_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    update_data = req.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.commerce.update_one({"_id": ObjectId(commerce_id)}, {"$set": update_data})
    updated = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    return serialize_doc(updated)

@api_router.delete("/commerce/{commerce_id}")
async def delete_commerce(commerce_id: str, request: Request):
    await require_role("super_admin", "admin", permission="commerce")(request)
    await verify_delete_code(request)
    await db.commerce.update_one({"_id": ObjectId(commerce_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Comercio eliminado"}

# ── Commerce Promotions ──

@api_router.get("/commerce/{commerce_id}/promotions")
async def list_commerce_promotions(commerce_id: str):
    promos = []
    datetime.now(timezone.utc).isoformat()
    async for p in db.commerce_promotions.find({"commerce_id": commerce_id, "status": "active"}).sort("created_at", -1).limit(50):
        promos.append(serialize_doc(p))
    return promos

@api_router.post("/commerce/{commerce_id}/promotions")
async def create_commerce_promotion(commerce_id: str, req: CommercePromotionCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("commerce_id") != commerce_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    doc = req.model_dump()
    doc["commerce_id"] = commerce_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.commerce_promotions.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.delete("/commerce/{commerce_id}/promotions/{promo_id}")
async def delete_commerce_promotion(commerce_id: str, promo_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("commerce_id") != commerce_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    await verify_delete_code(request)
    await db.commerce_promotions.update_one({"_id": ObjectId(promo_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Promoción eliminada"}

# ── Digital Coupons (QR) System ──

def generate_coupon_code():
    """Generate a unique 8-char alphanumeric coupon code."""
    import string
    chars = string.ascii_uppercase + string.digits
    return 'KX-' + ''.join(secrets.choice(chars) for _ in range(6))

@api_router.post("/coupons/generate")
async def member_generate_coupon(request: Request):
    """Member generates a coupon for a specific commerce."""
    user = await get_current_user(request)
    body = await request.json()
    commerce_id = body.get("commerce_id")
    if not commerce_id:
        raise HTTPException(status_code=400, detail="commerce_id requerido")

    commerce = await db.commerce.find_one({"_id": ObjectId(commerce_id), "status": "active"})
    if not commerce:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    # Check if member already has an active coupon for this commerce
    existing = await db.coupons.find_one({
        "member_id": str(user["_id"]),
        "commerce_id": commerce_id,
        "status": "active"
    })
    if existing:
        existing_doc = serialize_doc(existing)
        return existing_doc

    code = generate_coupon_code()
    # Ensure unique code
    while await db.coupons.find_one({"code": code}):
        code = generate_coupon_code()

    member_name = user.get("name", "")
    if not member_name and user.get("member_id"):
        member_doc = await db.members.find_one({"_id": ObjectId(user["member_id"])})
        if member_doc:
            member_name = member_doc.get("name", "")

    coupon = {
        "code": code,
        "member_id": str(user["_id"]),
        "member_name": member_name,
        "member_contract": user.get("contract_number", ""),
        "commerce_id": commerce_id,
        "commerce_name": commerce.get("name", ""),
        "discount_description": commerce.get("benefit_description", "Descuento para socios Kuxtal"),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "member",
        "used_at": None,
        "used_by_commerce": None,
    }
    result = await db.coupons.insert_one(coupon)
    coupon["_id"] = str(result.inserted_id)
    return coupon

@api_router.post("/admin/coupons")
async def admin_create_coupon(request: Request):
    """Admin creates a special coupon for a member+commerce combo."""
    user = await require_role("super_admin", "admin", permission="commerce")(request)
    body = await request.json()
    member_id = body.get("member_id")
    commerce_id = body.get("commerce_id")
    discount_description = body.get("discount_description", "")

    if not commerce_id:
        raise HTTPException(status_code=400, detail="commerce_id requerido")

    commerce = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not commerce:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    member_name = ""
    member_contract = ""
    if member_id:
        member_doc = await db.members.find_one({"_id": ObjectId(member_id)})
        if member_doc:
            member_name = member_doc.get("name", "")
            member_contract = member_doc.get("contract_number", "")

    code = generate_coupon_code()
    while await db.coupons.find_one({"code": code}):
        code = generate_coupon_code()

    coupon = {
        "code": code,
        "member_id": member_id or "",
        "member_name": member_name,
        "member_contract": member_contract,
        "commerce_id": commerce_id,
        "commerce_name": commerce.get("name", ""),
        "discount_description": discount_description or commerce.get("benefit_description", "Descuento especial"),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "admin",
        "created_by_name": user.get("name", "Admin"),
        "used_at": None,
        "used_by_commerce": None,
    }
    result = await db.coupons.insert_one(coupon)
    coupon["_id"] = str(result.inserted_id)
    return coupon

@api_router.get("/coupons/my")
async def my_coupons(request: Request):
    """Member sees their coupons."""
    user = await get_current_user(request)
    coupons = []
    async for c in db.coupons.find({"member_id": str(user["_id"])}).sort("created_at", -1).limit(50):
        coupons.append(serialize_doc(c))
    return coupons

@api_router.get("/coupons/validate/{code}")
async def validate_coupon(code: str):
    """Public endpoint - Commerce scans QR, sees coupon details."""
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupon no encontrado")
    doc = serialize_doc(coupon)

    # Get visit history for this member at this commerce
    visits = []
    if coupon.get("member_id") and coupon.get("commerce_id"):
        async for v in db.commerce_visits.find({
            "member_id": coupon["member_id"],
            "commerce_id": coupon["commerce_id"]
        }).sort("visited_at", -1).limit(10):
            visits.append(serialize_doc(v))

    doc["visit_history"] = visits
    doc["visit_count"] = len(visits)
    return doc

@api_router.post("/coupons/redeem/{code}")
async def redeem_coupon(code: str, request: Request):
    """Commerce redeems a coupon (marks as used)."""
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupon no encontrado")
    if coupon["status"] == "used":
        raise HTTPException(status_code=400, detail="Este cupon ya fue utilizado")

    # Determine who is redeeming
    commerce_name = "Manual"
    try:
        user = await get_current_user(request)
        commerce_name = user.get("name", "Comercio")
    except Exception:
        body = await request.json()
        commerce_name = body.get("commerce_name", "Manual")

    await db.coupons.update_one(
        {"_id": coupon["_id"]},
        {"$set": {
            "status": "used",
            "used_at": datetime.now(timezone.utc).isoformat(),
            "used_by_commerce": commerce_name,
        }}
    )

    # Record visit
    visit = {
        "member_id": coupon.get("member_id", ""),
        "commerce_id": coupon.get("commerce_id", ""),
        "coupon_code": code.upper(),
        "visited_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.commerce_visits.insert_one(visit)

    return {"message": "Cupon canjeado exitosamente", "code": code.upper()}

@api_router.get("/commerce/{commerce_id}/coupons")
async def commerce_coupon_history(commerce_id: str, request: Request):
    """Commerce sees redeemed coupons history."""
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("commerce_id") != commerce_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    coupons = []
    async for c in db.coupons.find({"commerce_id": commerce_id}).sort("created_at", -1).limit(100):
        coupons.append(serialize_doc(c))
    return coupons

# ── Scratch Card System ──

@api_router.get("/commerce/{commerce_id}/scratch-card")
async def get_scratch_card(commerce_id: str):
    card = await db.scratch_cards.find_one({"commerce_id": commerce_id, "active": True})
    if card:
        return serialize_doc(card)
    return None

@api_router.post("/commerce/{commerce_id}/scratch-card")
async def create_scratch_card(commerce_id: str, req: ScratchCardCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("commerce_id") != commerce_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    await db.scratch_cards.update_many({"commerce_id": commerce_id}, {"$set": {"active": False}})
    doc = req.model_dump()
    doc["commerce_id"] = commerce_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.scratch_cards.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.post("/commerce/{commerce_id}/scratch-card/play")
async def play_scratch_card(commerce_id: str, request: Request):
    user = await get_current_user(request)
    card = await db.scratch_cards.find_one({"commerce_id": commerce_id, "active": True})
    if not card:
        raise HTTPException(status_code=404, detail="No hay raspable activo")
    attempts = await db.scratch_attempts.count_documents({"commerce_id": commerce_id, "user_id": user["_id"]})
    won = False
    if card["frequency_type"] == "percentage":
        won = secrets.randbelow(100) + 1 <= card["frequency_value"]
    elif card["frequency_type"] == "after_attempts":
        won = (attempts + 1) % card["frequency_value"] == 0
    await db.scratch_attempts.insert_one({
        "commerce_id": commerce_id,
        "user_id": user["_id"],
        "user_name": user.get("name", ""),
        "won": won,
        "scratch_card_id": str(card["_id"]),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"won": won, "message": card["prize_text"] if won else card["lose_text"], "attempts": attempts + 1}

# ── Loyalty / Visit Validation ──

@api_router.post("/commerce/{commerce_id}/validate")
async def validate_visit(commerce_id: str, request: Request):
    body = await request.json()
    code = body.get("code", "")
    commerce = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not commerce:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
    if commerce.get("validation_code", "") != code:
        raise HTTPException(status_code=400, detail="Código inválido")
    user = await get_current_user(request)
    visit = {
        "commerce_id": commerce_id,
        "commerce_name": commerce["name"],
        "user_id": user["_id"],
        "user_name": user.get("name", ""),
        "validated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.loyalty_visits.insert_one(visit)
    total_visits = await db.loyalty_visits.count_documents({"commerce_id": commerce_id, "user_id": user["_id"]})
    return {"message": "Visita validada", "total_visits": total_visits}

@api_router.get("/commerce/{commerce_id}/visits")
async def get_commerce_visits(commerce_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] in ["super_admin", "admin"] or user.get("commerce_id") == commerce_id:
        visits = []
        async for v in db.loyalty_visits.find({"commerce_id": commerce_id}).sort("validated_at", -1).limit(200):
            visits.append(serialize_doc(v))
        return visits
    visits = []
    async for v in db.loyalty_visits.find({"commerce_id": commerce_id, "user_id": user["_id"]}).sort("validated_at", -1).limit(100):
        visits.append(serialize_doc(v))
    return visits

@api_router.get("/member/visits")
async def get_member_visits(request: Request):
    user = await get_current_user(request)
    visits = []
    async for v in db.loyalty_visits.find({"user_id": user["_id"]}).sort("validated_at", -1).limit(100):
        visits.append(serialize_doc(v))
    return visits

# ── Push Notifications ──

@api_router.get("/push/vapid-key")
async def get_vapid_key():
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def push_subscribe(req: PushSubscription, request: Request):
    user = await get_current_user(request)
    existing = await db.push_subscriptions.find_one({"endpoint": req.endpoint})
    if existing:
        await db.push_subscriptions.update_one({"endpoint": req.endpoint}, {"$set": {"user_id": user["_id"], "keys": req.keys, "updated_at": datetime.now(timezone.utc).isoformat()}})
    else:
        await db.push_subscriptions.insert_one({"endpoint": req.endpoint, "keys": req.keys, "user_id": user["_id"], "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Suscripción guardada"}

@api_router.post("/push/send")
async def send_push(request: Request):
    user = await require_role("super_admin", "admin", permission="push")(request)
    body = await request.json()
    title = body.get("title", "Kuxtal Travel")
    message = body.get("message", "")
    link = body.get("link", "/")
    image_url = body.get("image_url", "")
    sent_count, failed_count = await _send_push_raw(title, message, link, image_url)
    notification = {
        "title": title, "message": message, "link": link, "image_url": image_url,
        "sent_by": user["_id"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "recipients_count": sent_count, "failed_count": failed_count,
    }
    await db.push_notifications.insert_one(notification)
    return {"message": f"Notificacion enviada a {sent_count} suscriptores ({failed_count} fallaron)", "count": sent_count}

async def _send_push_raw(title: str, message: str, link: str = "/", image_url: str = "") -> tuple[int, int]:
    """Core push sender. Returns (sent_count, failed_count). Used by both the admin endpoint and automatic triggers."""
    subs = await db.push_subscriptions.find().to_list(10000)
    sent_count = 0
    failed_count = 0
    stale_ids = []
    payload = json_module.dumps({"title": title, "body": message, "message": message, "url": link, "link": link, "image": image_url})
    batch_size = 50
    for i in range(0, len(subs), batch_size):
        batch = subs[i:i + batch_size]
        for sub in batch:
            retries = 2
            for attempt in range(retries):
                try:
                    webpush(
                        subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                        data=payload,
                        vapid_private_key=VAPID_PRIVATE_KEY,
                        vapid_claims={"sub": VAPID_EMAIL},
                        timeout=10
                    )
                    sent_count += 1
                    break
                except WebPushException as e:
                    if e.response and e.response.status_code in [404, 410]:
                        stale_ids.append(sub["_id"])
                        failed_count += 1
                        break
                    if attempt == retries - 1:
                        failed_count += 1
                except Exception:
                    if attempt == retries - 1:
                        failed_count += 1
    if stale_ids:
        await db.push_subscriptions.delete_many({"_id": {"$in": stale_ids}})
    return sent_count, failed_count

async def _broadcast_news(title: str, message: str, link: str = "/", image_url: str = "", target: str = "all"):
    """Send push + create announcement in one call. Non-blocking (errors are logged)."""
    try:
        # Register as announcement so it shows in member/admin Anuncios tab
        ann = {
            "title": title, "content": message, "image_url": image_url, "link": link,
            "target": target, "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system",
        }
        await db.announcements.insert_one(ann)
        # Then fire push (best-effort)
        await _send_push_raw(title, message, link, image_url)
    except Exception as e:
        logger.warning(f"Broadcast news failed for '{title}': {e}")

@api_router.get("/push/history")
async def push_history(request: Request):
    await require_role("super_admin", "admin")(request)
    notifs = []
    async for n in db.push_notifications.find().sort("sent_at", -1).limit(50):
        notifs.append(serialize_doc(n))
    return notifs

# ── Commerce Auth (login with commerce email) ──

# ── Regalías (Gifts/Certificates for Members) ──

@api_router.post("/regalias")
async def create_regalia(request: Request):
    user = await require_role("super_admin", "admin", permission="regalias")(request)
    body = await request.json()
    regalia = {
        "name": body.get("name", ""),
        "image_url": body.get("image_url", ""),
        "member_id": body.get("member_id", ""),
        "member_name": body.get("member_name", ""),
        "start_date": body.get("start_date", ""),
        "end_date": body.get("end_date", ""),
        "used": False,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": str(user["_id"]),
    }
    result = await db.regalias.insert_one(regalia)
    regalia["_id"] = str(result.inserted_id)
    return regalia

@api_router.get("/regalias")
async def list_regalias(request: Request, member_id: Optional[str] = None, all: Optional[bool] = False):
    user = await get_current_user(request)
    query = {"status": "active"}
    if user["role"] in ["member", "family"]:
        uid = user.get("member_id", "")
        if not uid:
            return []
        query["member_id"] = uid
    elif member_id:
        query["member_id"] = member_id
    # When `all=true` is passed by admin, return every active regalia (for socio-form picker)
    if all and user["role"] in ["super_admin", "admin"]:
        query.pop("member_id", None)
    regalias = []
    async for r in db.regalias.find(query).sort("created_at", -1).limit(500):
        regalias.append(serialize_doc(r))
    return regalias

@api_router.put("/members/{member_id}/regalias")
async def assign_regalias_to_member(member_id: str, request: Request):
    """Bulk update which regalias belong to this socio. Body: { regalia_ids: [...] }."""
    await require_role("super_admin", "admin", permission="members")(request)
    body = await request.json()
    ids = body.get("regalia_ids", []) or []
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    member_name = member.get("name", "")
    # Detach regalias currently assigned to this member but not in the new list
    await db.regalias.update_many(
        {"member_id": member_id, "_id": {"$nin": [ObjectId(x) for x in ids if ObjectId.is_valid(x)]}},
        {"$set": {"member_id": "", "member_name": ""}}
    )
    # Attach selected regalias to this member — but only those currently free or already owned by this member
    valid_oids = [ObjectId(x) for x in ids if ObjectId.is_valid(x)]
    if valid_oids:
        await db.regalias.update_many(
            {"_id": {"$in": valid_oids}, "$or": [{"member_id": ""}, {"member_id": {"$exists": False}}, {"member_id": member_id}]},
            {"$set": {"member_id": member_id, "member_name": member_name}}
        )
    return {"message": "Regalías actualizadas", "count": len(valid_oids)}

@api_router.put("/regalias/{regalia_id}/toggle-used")
async def toggle_regalia_used(regalia_id: str, request: Request):
    await require_role("super_admin", "admin", permission="regalias")(request)
    reg = await db.regalias.find_one({"_id": ObjectId(regalia_id)})
    if not reg:
        raise HTTPException(status_code=404, detail="Regalia no encontrada")
    new_used = not reg.get("used", False)
    await db.regalias.update_one({"_id": ObjectId(regalia_id)}, {"$set": {"used": new_used}})
    return {"used": new_used}

@api_router.delete("/regalias/{regalia_id}")
async def delete_regalia(regalia_id: str, request: Request):
    await require_role("super_admin", "admin", permission="regalias")(request)
    await verify_delete_code(request)
    await db.regalias.update_one({"_id": ObjectId(regalia_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Regalia eliminada"}

# ── Clubs Vacacionales ──

@api_router.post("/clubs")
async def create_club(request: Request):
    await require_role("super_admin", "admin", permission="clubs")(request)
    body = await request.json()
    club = {
        "name": body.get("name", ""),
        "logo_url": body.get("logo_url", ""),
        "description": body.get("description", ""),
        "address": body.get("address", ""),
        "benefits": body.get("benefits", []),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.vacation_clubs.insert_one(club)
    club["_id"] = str(result.inserted_id)
    # Broadcast to members: new club available
    await _broadcast_news(
        title="Nuevo club vacacional",
        message=f"{club['name']}. Descubre sus beneficios.",
        link="/member",
        image_url=club.get("logo_url", ""),
        target="members",
    )
    return club

@api_router.get("/clubs")
async def list_clubs():
    clubs = []
    async for c in db.vacation_clubs.find({"status": "active"}).sort("created_at", -1):
        clubs.append(serialize_doc(c))
    return clubs

@api_router.put("/clubs/{club_id}")
async def update_club(club_id: str, request: Request):
    await require_role("super_admin", "admin", permission="clubs")(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k != "_id"}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.vacation_clubs.update_one({"_id": ObjectId(club_id)}, {"$set": update_data})
    updated = await db.vacation_clubs.find_one({"_id": ObjectId(club_id)})
    return serialize_doc(updated)

@api_router.delete("/clubs/{club_id}")
async def delete_club(club_id: str, request: Request):
    await require_role("super_admin", "admin", permission="clubs")(request)
    await verify_delete_code(request)
    await db.vacation_clubs.update_one({"_id": ObjectId(club_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Club eliminado"}

# ── Member Observations ──

@api_router.post("/auth/commerce-login")
async def commerce_login(request: Request, response: Response):
    body = await request.json()
    commerce_id = body.get("commerce_id", "")
    code = body.get("code", "")
    commerce = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    if not commerce:
        raise HTTPException(status_code=401, detail="Comercio no encontrado")
    if commerce.get("validation_code", "") != code:
        raise HTTPException(status_code=401, detail="Código inválido")
    user = await db.users.find_one({"commerce_id": str(commerce["_id"]), "role": "commerce"})
    if not user:
        raise HTTPException(status_code=401, detail="Cuenta de comercio no encontrada")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, "commerce")
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=COOKIE_SECURE, samesite="none" if COOKIE_SECURE else "lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=COOKIE_SECURE, samesite="none" if COOKIE_SECURE else "lax", max_age=604800, path="/")
    commerce_data = serialize_doc(commerce)
    return {"id": user_id, "name": commerce["name"], "role": "commerce", "commerce_id": str(commerce["_id"]), "commerce": commerce_data, "token": access_token}

# ── Family Members ──

@api_router.get("/members/{member_id}/family")
async def get_family_members(member_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("member_id") != member_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    # If no family record exists yet but the member has coowner_* data, materialize one
    # automatically so the copropietario tab reflects whatever the admin loaded by CSV.
    existing = await db.family_members.find_one({"member_id": member_id})
    if not existing:
        member = await db.members.find_one({"_id": ObjectId(member_id)})
        if member and (member.get("coowner_name") or "").strip():
            doc = {
                "member_id": member_id,
                "contract_number": member.get("contract_number", ""),
                "name": (member.get("coowner_name") or "").strip(),
                "dpi": (member.get("coowner_dpi") or "").strip() or (member.get("dpi", "") + "-CP"),
                "relationship": "copropietario",
                "phone": _normalize_gt_phone(member.get("coowner_phone") or ""),
                "email": (member.get("coowner_email") or "").strip(),
                "birth_date": (member.get("coowner_birth_date") or "").strip(),
                "nationality": (member.get("coowner_nationality") or "").strip(),
                "profession": (member.get("coowner_profession") or "").strip(),
                "investment": (member.get("coowner_investment") or "").strip(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "auto_synced": True,
            }
            await db.family_members.insert_one(doc)
    family = []
    async for f in db.family_members.find({"member_id": member_id}).limit(20):
        family.append(serialize_doc(f))
    return family


async def _sync_member_coowner_fields(member_id: str, family_doc: dict | None):
    """Mirror the family_member into the parent Member.coowner_* fields (single source of truth)."""
    if family_doc is None:
        clear = {
            "coowner_name": "", "coowner_phone": "", "coowner_email": "",
            "coowner_dpi": "", "coowner_birth_date": "",
            "coowner_nationality": "", "coowner_profession": "", "coowner_investment": "",
        }
        await db.members.update_one({"_id": ObjectId(member_id)}, {"$set": clear})
        return
    update = {
        "coowner_name": family_doc.get("name", ""),
        "coowner_phone": family_doc.get("phone", ""),
        "coowner_email": family_doc.get("email", ""),
        "coowner_dpi": family_doc.get("dpi", ""),
        "coowner_birth_date": family_doc.get("birth_date", ""),
    }
    # Optional fields if provided
    for k in ("nationality", "profession", "investment"):
        if family_doc.get(k):
            update[f"coowner_{k}"] = family_doc.get(k, "")
    await db.members.update_one({"_id": ObjectId(member_id)}, {"$set": update})

@api_router.post("/members/{member_id}/family")
async def add_family_member(member_id: str, req: FamilyMemberCreate, request: Request):
    user = await get_current_user(request)
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    if user["role"] not in ["super_admin", "admin"] and user.get("member_id") != member_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    if not req.dpi.strip() or not req.name.strip():
        raise HTTPException(status_code=400, detail="Nombre y DPI son requeridos")
    # Prevent collision with the principal member's DPI
    if member.get("dpi", "").strip() == req.dpi.strip():
        raise HTTPException(status_code=400, detail="Este DPI corresponde al socio principal")
    # Only one copropietario allowed per member.
    existing_count = await db.family_members.count_documents({"member_id": member_id})
    if existing_count >= 1:
        raise HTTPException(status_code=400, detail="Solo se permite un copropietario por socio. Edita o elimina el actual.")
    existing = await db.family_members.find_one({"member_id": member_id, "dpi": req.dpi.strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Este DPI ya está registrado")
    doc = req.model_dump()
    doc["dpi"] = doc["dpi"].strip()
    doc["name"] = doc["name"].strip()
    doc["member_id"] = member_id
    doc["contract_number"] = member["contract_number"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.family_members.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    await _sync_member_coowner_fields(member_id, doc)
    return doc


@api_router.put("/members/{member_id}/family/{family_id}")
async def update_family_member(member_id: str, family_id: str, req: FamilyMemberUpdate, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("member_id") != member_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    existing = await db.family_members.find_one({"_id": ObjectId(family_id), "member_id": member_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if "dpi" in updates and updates["dpi"].strip() != existing.get("dpi", ""):
        new_dpi = updates["dpi"].strip()
        member = await db.members.find_one({"_id": ObjectId(member_id)})
        if member and member.get("dpi", "").strip() == new_dpi:
            raise HTTPException(status_code=400, detail="Este DPI corresponde al socio principal")
        clash = await db.family_members.find_one({
            "member_id": member_id, "dpi": new_dpi, "_id": {"$ne": ObjectId(family_id)}
        })
        if clash:
            raise HTTPException(status_code=400, detail="Este DPI ya está registrado")
        updates["dpi"] = new_dpi
        # Sync existing user account password (DPI is the password)
        old_user = await db.users.find_one({
            "member_id": member_id, "family_dpi": existing.get("dpi", "")
        })
        if old_user:
            await db.users.update_one(
                {"_id": old_user["_id"]},
                {"$set": {"family_dpi": new_dpi, "password_hash": hash_password(new_dpi)}}
            )
    if "name" in updates:
        updates["name"] = updates["name"].strip()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.family_members.update_one({"_id": ObjectId(family_id)}, {"$set": updates})
    fresh = await db.family_members.find_one({"_id": ObjectId(family_id)})
    await _sync_member_coowner_fields(member_id, fresh)
    return serialize_doc(fresh)


@api_router.delete("/members/{member_id}/family/{family_id}")
async def remove_family_member(member_id: str, family_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("member_id") != member_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    family = await db.family_members.find_one({"_id": ObjectId(family_id), "member_id": member_id})
    if not family:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    # Members deleting their own family don't need the global delete code; admins still must provide it
    if user["role"] in ("super_admin", "admin"):
        await verify_delete_code(request)
    await db.family_members.delete_one({"_id": ObjectId(family_id), "member_id": member_id})
    # Also clean up the linked user account so they can't log in anymore
    await db.users.delete_many({"member_id": member_id, "family_dpi": family.get("dpi")})
    # Clear the mirrored coowner_* fields on the parent Member
    await _sync_member_coowner_fields(member_id, None)
    return {"message": "Copropietario eliminado"}

# ── Stats & Analytics ──

@api_router.get("/stats")
async def get_stats(request: Request):
    await require_role("super_admin", "admin")(request)
    total_members = await db.members.count_documents({})
    active_members = await db.members.count_documents({"status": "active"})
    total_packages = await db.packages.count_documents({"status": "active"})
    pending_quotations = await db.quotations.count_documents({"status": "pending"})
    pending_requests = await db.vacation_requests.count_documents({"status": "pending"})
    total_announcements = await db.announcements.count_documents({"status": "active"})
    total_referrals = await db.referrals.count_documents({})
    unread_chats = await db.chat_messages.count_documents({"read_by_admin": False})
    return {
        "total_members": total_members,
        "active_members": active_members,
        "total_packages": total_packages,
        "pending_quotations": pending_quotations,
        "pending_requests": pending_requests,
        "total_announcements": total_announcements,
        "total_commerce": await db.commerce.count_documents({"status": "active"}),
        "total_referrals": total_referrals,
        "unread_chats": unread_chats
    }

@api_router.get("/analytics")
async def get_analytics(request: Request):
    await require_role("super_admin", "admin")(request)
    now = datetime.now(timezone.utc)
    # Monthly member growth (last 6 months)
    member_growth = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        count = await db.members.count_documents({"created_at": {"$lte": month_end.isoformat()}})
        member_growth.append({"month": month_start.strftime("%b %Y"), "members": count})
    # Quotation trends (last 6 months)
    quotation_trends = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        total = await db.quotations.count_documents({"created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()}})
        responded = await db.quotations.count_documents({"created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()}, "status": "responded"})
        quotation_trends.append({"month": month_start.strftime("%b %Y"), "total": total, "responded": responded})
    # Top packages by quotations
    top_packages = []
    pipeline = [
        {"$match": {"package_id": {"$ne": ""}}},
        {"$group": {"_id": "$package_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    async for item in db.quotations.aggregate(pipeline):
        pkg = None
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(item["_id"])})
        except Exception:
            pass
        top_packages.append({"name": pkg["title"] if pkg else "Desconocido", "quotations": item["count"]})
    # Country distribution
    country_dist = []
    async for item in db.packages.aggregate([{"$match": {"status": "active"}}, {"$group": {"_id": "$country", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]):
        country_dist.append({"country": item["_id"], "count": item["count"]})
    # Referral stats
    referral_count = await db.referrals.count_documents({})
    referral_converted = await db.referrals.count_documents({"status": "converted"})
    # Commerce visits
    total_visits = await db.loyalty_visits.count_documents({})
    return {
        "member_growth": member_growth,
        "quotation_trends": quotation_trends,
        "top_packages": top_packages,
        "country_distribution": country_dist,
        "referrals": {"total": referral_count, "converted": referral_converted},
        "commerce_visits": total_visits
    }

# ── Referral System ──

@api_router.get("/referral/my-code")
async def get_my_referral_code(request: Request):
    user = await get_current_user(request)
    member_id = user.get("member_id")
    if not member_id:
        raise HTTPException(status_code=403, detail="Solo socios pueden tener código de referido")
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    code = member.get("referral_code")
    if not code:
        code = f"KT-{member['contract_number'].replace('KT-','')}-{str(uuid.uuid4())[:4].upper()}"
        await db.members.update_one({"_id": ObjectId(member_id)}, {"$set": {"referral_code": code}})
    referrals = []
    async for r in db.referrals.find({"referrer_member_id": member_id}).sort("created_at", -1).limit(100):
        referrals.append(serialize_doc(r))
    return {"code": code, "referrals": referrals, "total": len(referrals)}

@api_router.get("/referral/{code}")
async def get_referral_info(code: str):
    member = await db.members.find_one({"referral_code": code})
    if not member:
        raise HTTPException(status_code=404, detail="Código de referido inválido")
    return {"referrer_name": member["name"], "code": code, "valid": True}

@api_router.post("/referral/{code}/submit")
async def submit_referral(code: str, req: ReferralSubmit):
    member = await db.members.find_one({"referral_code": code})
    if not member:
        raise HTTPException(status_code=404, detail="Código de referido inválido")
    doc = req.model_dump()
    doc["referrer_member_id"] = str(member["_id"])
    doc["referrer_name"] = member["name"]
    doc["referral_code"] = code
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.referrals.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/referrals")
async def list_referrals(request: Request):
    await require_role("super_admin", "admin")(request)
    referrals = []
    async for r in db.referrals.find().sort("created_at", -1).limit(200):
        referrals.append(serialize_doc(r))
    return referrals

@api_router.put("/referrals/{ref_id}/status")
async def update_referral_status(ref_id: str, request: Request):
    await require_role("super_admin", "admin", permission="referrals")(request)
    body = await request.json()
    await db.referrals.update_one({"_id": ObjectId(ref_id)}, {"$set": {"status": body.get("status", "pending"), "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Estado actualizado"}

# ── Chat System ──

@api_router.get("/chat/conversations")
async def list_conversations(request: Request):
    user = await get_current_user(request)
    if user["role"] in ["super_admin", "admin"]:
        convs = []
        async for c in db.chat_conversations.find().sort("updated_at", -1).limit(100):
            last_msg = await db.chat_messages.find_one({"conversation_id": str(c["_id"])}, sort=[("created_at", -1)])
            unread = await db.chat_messages.count_documents({"conversation_id": str(c["_id"]), "read_by_admin": False, "sender_role": "member"})
            conv = serialize_doc(c)
            conv["last_message"] = last_msg.get("text", "") if last_msg else ""
            conv["last_message_at"] = last_msg.get("created_at", "") if last_msg else ""
            conv["unread_count"] = unread
            convs.append(conv)
        return convs
    else:
        convs = []
        async for c in db.chat_conversations.find({"user_id": user["_id"]}).sort("updated_at", -1).limit(50):
            last_msg = await db.chat_messages.find_one({"conversation_id": str(c["_id"])}, sort=[("created_at", -1)])
            unread = await db.chat_messages.count_documents({"conversation_id": str(c["_id"]), "read_by_member": False, "sender_role": {"$in": ["admin", "super_admin"]}})
            conv = serialize_doc(c)
            conv["last_message"] = last_msg.get("text", "") if last_msg else ""
            conv["unread_count"] = unread
            convs.append(conv)
        return convs

@api_router.post("/chat/conversations")
async def create_conversation(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    existing = await db.chat_conversations.find_one({"user_id": user["_id"], "status": "open"})
    if existing:
        return serialize_doc(existing)
    doc = {
        "user_id": user["_id"],
        "user_name": user.get("name", ""),
        "user_role": user.get("role", ""),
        "subject": body.get("subject", "Conversación"),
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.chat_conversations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/chat/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, request: Request):
    user = await get_current_user(request)
    messages = []
    async for m in db.chat_messages.find({"conversation_id": conv_id}).sort("created_at", 1).limit(500):
        messages.append(serialize_doc(m))
    # Mark messages as read
    if user["role"] in ["super_admin", "admin"]:
        await db.chat_messages.update_many({"conversation_id": conv_id, "sender_role": "member"}, {"$set": {"read_by_admin": True}})
    else:
        await db.chat_messages.update_many({"conversation_id": conv_id, "sender_role": {"$in": ["admin", "super_admin"]}}, {"$set": {"read_by_member": True}})
    return messages

@api_router.post("/chat/conversations/{conv_id}/messages")
async def send_message(conv_id: str, req: ChatMessageCreate, request: Request):
    user = await get_current_user(request)
    doc = {
        "conversation_id": conv_id,
        "sender_id": user["_id"],
        "sender_name": user.get("name", ""),
        "sender_role": user.get("role", ""),
        "text": req.text,
        "read_by_admin": user["role"] in ["super_admin", "admin"],
        "read_by_member": user["role"] == "member",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.chat_messages.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    await db.chat_conversations.update_one({"_id": ObjectId(conv_id)}, {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return doc

@api_router.put("/chat/conversations/{conv_id}/close")
async def close_conversation(conv_id: str, request: Request):
    await require_role("super_admin", "admin")(request)
    await db.chat_conversations.update_one({"_id": ObjectId(conv_id)}, {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Conversación cerrada"}

# ── Countries list ──

@api_router.get("/countries")
async def list_countries():
    countries = await db.packages.distinct("country", {"status": "active"})
    return countries

# ── Admin Users CRUD ──

@api_router.get("/admin/users")
async def list_admin_users(request: Request):
    await require_role("super_admin")(request)
    users = []
    async for u in db.users.find({"role": {"$in": ["super_admin", "admin"]}}).sort("created_at", -1).limit(100):
        u_doc = serialize_doc(u)
        u_doc.pop("password_hash", None)
        users.append(u_doc)
    return users

@api_router.get("/admin/all-users")
async def list_all_users(request: Request):
    await require_role("super_admin", "admin")(request)
    users = []
    async for u in db.users.find().sort("created_at", -1).limit(500):
        u_doc = serialize_doc(u)
        u_doc.pop("password_hash", None)
        users.append(u_doc)
    return users

FEATURE_KEYS = [
    "dashboard", "members", "clients", "packages", "commerce", "categories",
    "clubs", "regalias", "quotations", "analytics", "announcements",
    "push", "bot", "import", "referrals", "requests", "users", "settings",
]

@api_router.post("/admin/users")
async def create_admin_user(request: Request):
    user = await require_role("super_admin")(request)
    body = await request.json()
    existing = await db.users.find_one({"email": body["email"].lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    perms = body.get("permissions") or {}
    # Default: if no perms provided for a regular admin, grant only quotations+dashboard
    role = body.get("role", "admin")
    if not perms and role == "admin":
        perms = {"dashboard": True, "quotations": True, "clients": True, "members": True}
    doc = {
        "email": body["email"].lower().strip(),
        "password_hash": hash_password(body["password"]),
        "name": body.get("name", ""),
        "role": role,
        "permissions": perms,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(doc)
    created = {**doc, "_id": result.inserted_id}
    await log_user_audit(user, created, "create_user", {"role": role, "permissions": perms}, request)
    return {"id": str(result.inserted_id), "email": doc["email"], "name": doc["name"], "role": doc["role"], "permissions": perms}

@api_router.put("/admin/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, request: Request):
    admin_user = await require_role("super_admin")(request)
    body = await request.json()
    perms = body.get("permissions") or {}
    # Normalize: ensure only booleans and valid keys
    clean = {k: bool(perms.get(k)) for k in FEATURE_KEYS if k in perms}
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"permissions": clean}})
    if target:
        await log_user_audit(admin_user, target, "update_permissions", {"before": target.get("permissions", {}), "after": clean}, request)
    return {"permissions": clean}

@api_router.get("/admin/feature-keys")
async def list_feature_keys(request: Request):
    await require_role("super_admin", "admin")(request)
    return FEATURE_KEYS

@api_router.put("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, request: Request):
    user = await require_role("super_admin", "admin")(request)
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # Protección: solo super_admin puede togglear a otro super_admin o al admin principal
    main_admin_email = os.environ.get("ADMIN_EMAIL", "admin@kuxtaltravels.com").lower()
    if user.get("role") != "super_admin":
        if target.get("role") == "super_admin" or target.get("email") == main_admin_email:
            raise HTTPException(status_code=403, detail="No tienes permiso para cambiar el estado de este usuario")
    # Prohibir que un super_admin se desactive a sí mismo (lockout)
    if str(user.get("_id")) == user_id and target.get("is_active", True):
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    new_status = not target.get("is_active", True)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_active": new_status}})
    await log_user_audit(user, target, "toggle_active", {"before": target.get("is_active", True), "after": new_status}, request)
    return {"message": f"Usuario {'activado' if new_status else 'desactivado'}", "is_active": new_status}

async def log_user_audit(admin_user: dict, target: dict, action: str, details: dict, request: Request):
    try:
        await db.user_changes_audit.insert_one({
            "admin_id": str(admin_user.get("_id")),
            "admin_email": admin_user.get("email"),
            "admin_name": admin_user.get("name"),
            "target_user_id": str(target.get("_id")),
            "target_email": target.get("email"),
            "target_name": target.get("name"),
            "target_role": target.get("role"),
            "action": action,
            "details": details,
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent", "")[:200],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        print(f"[audit] failed to log: {e}")

@api_router.put("/admin/users/{user_id}")
async def update_admin_user(user_id: str, request: Request):
    admin_user = await require_role("super_admin")(request)
    body = await request.json()
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    updates = {}
    changes = {}
    if "name" in body:
        new_name = (body.get("name") or "").strip()
        if new_name != target.get("name", ""):
            updates["name"] = new_name
            changes["name"] = {"before": target.get("name", ""), "after": new_name}
    if "email" in body:
        new_email = (body.get("email") or "").lower().strip()
        if not new_email:
            raise HTTPException(status_code=400, detail="Email requerido")
        if new_email != target.get("email"):
            clash = await db.users.find_one({"email": new_email, "_id": {"$ne": ObjectId(user_id)}})
            if clash:
                raise HTTPException(status_code=400, detail="Ese email ya está en uso")
            main_admin_email = os.environ.get("ADMIN_EMAIL", "admin@kuxtaltravels.com").lower()
            if target.get("email") == main_admin_email:
                raise HTTPException(status_code=400, detail="No se puede cambiar el email del admin principal")
            updates["email"] = new_email
            changes["email"] = {"before": target.get("email"), "after": new_email}
    if not updates:
        return {"message": "Sin cambios"}
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    await log_user_audit(admin_user, target, "update_profile", changes, request)
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    u_doc = serialize_doc(updated)
    u_doc.pop("password_hash", None)
    return u_doc

@api_router.post("/admin/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, request: Request):
    admin_user = await require_role("super_admin")(request)
    body = await request.json()
    new_password = (body.get("password") or "").strip()
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"password_hash": hash_password(new_password)}})
    await log_user_audit(admin_user, target, "reset_password", {"password_length": len(new_password)}, request)
    return {"message": "Contraseña actualizada"}

@api_router.get("/admin/audit/user-changes")
async def list_user_audit(request: Request, target_user_id: str = None, admin_id: str = None, action: str = None, limit: int = 200):
    await require_role("super_admin")(request)
    query = {}
    if target_user_id:
        query["target_user_id"] = target_user_id
    if admin_id:
        query["admin_id"] = admin_id
    if action:
        query["action"] = action
    limit = max(1, min(int(limit or 200), 500))
    out = []
    async for doc in db.user_changes_audit.find(query).sort("timestamp", -1).limit(limit):
        out.append(serialize_doc(doc))
    return out

@api_router.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: str, request: Request):
    user = await require_role("super_admin")(request)
    await verify_delete_code(request)
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target.get("email") == os.environ.get("ADMIN_EMAIL", "admin@kuxtaltravels.com").lower():
        raise HTTPException(status_code=400, detail="No se puede eliminar el admin principal")
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await log_user_audit(user, target, "delete_user", {"role": target.get("role"), "email": target.get("email")}, request)
    return {"message": "Usuario eliminado"}

# ── Seed & Startup ──

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@kuxtaltravels.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "KuxtalAdmin2024!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Super Admin",
            "role": "super_admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

    # Additional admin accounts (only created if missing — never overwrite existing passwords)
    extra_admins = [
        {"email": "kclub1@kuxtaltravels.com", "password": "Kclub123$$", "name": "Kuxtal Club Admin", "role": "admin"},
        {"email": "agente1@kuxtaltravels.com", "password": "Agente123$$$", "name": "Agente Kuxtal", "role": "admin"},
    ]
    for acc in extra_admins:
        if not await db.users.find_one({"email": acc["email"]}):
            await db.users.insert_one({
                "email": acc["email"],
                "password_hash": hash_password(acc["password"]),
                "name": acc["name"],
                "role": acc["role"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info("Seeded admin: %s", acc["email"])

    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write(
            f"# Test Credentials\n\n## Super Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: super_admin\n\n"
            "## Admin (Kuxtal Club)\n- Email: kclub1@kuxtaltravels.com\n- Password: Kclub123$$\n- Role: admin\n\n"
            "## Admin (Agente)\n- Email: agente1@kuxtaltravels.com\n- Password: Agente123$$$\n- Role: admin\n\n"
            "## Member (preview)\n- Login: KT-001\n- Password: 1234567890101\n\n"
            "## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/member-login\n- GET /api/auth/me\n- POST /api/auth/logout\n"
        )


class _RescuePasswordReq(BaseModel):
    secret: str
    email: str
    new_password: str


@app.post("/api/auth/rescue-password")
async def rescue_password(req: _RescuePasswordReq):
    """Vía de rescate: si un admin/super_admin perdió su password, puede resetearla
    poniendo RESCUE_SECRET en el .env del backend y llamando este endpoint con esa
    secret + el email + nueva password. Después borrá la variable del .env por seguridad.
    """
    rescue = os.environ.get("RESCUE_SECRET", "")
    if not rescue or len(rescue) < 12:
        raise HTTPException(status_code=503, detail="Rescate deshabilitado (RESCUE_SECRET no configurado)")
    if req.secret != rescue:
        raise HTTPException(status_code=401, detail="Secret incorrecto")
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail=f"Usuario {email} no existe")
    if user.get("role") not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Solo se pueden resetear cuentas admin")
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(req.new_password)}},
    )
    logger.warning("RESCUE: password reseteada para %s", email)
    return {"ok": True, "email": email, "role": user["role"]}


async def seed_sample_data():
    count = await db.packages.count_documents({})
    if count == 0:
        sample_packages = [
            {
                "title": "Travesía Completa - Argentina",
                "description": "Explora la impresionante Patagonia Argentina con una experiencia única sobre hielo. Vive una aventura inolvidable caminando sobre el glaciar Perito Moreno y disfrutando de los paisajes más majestuosos del sur del continente.",
                "short_description": "Aventura en la Patagonia con glaciar Perito Moreno",
                "country": "Argentina",
                "price": 27380,
                "member_price": 22000,
                "duration_days": 10,
                "category": "paquete",
                "includes": ["Boletos Aéreos", "Traslados", "Alojamiento", "Desayunos", "Tours Exclusivos"],
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800",
                "gallery": [],
                "featured": True,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "title": "Travesía a Brasil",
                "description": "Descubre la magia de Brasil con un recorrido completo por Río de Janeiro. Visita el Pan de Azúcar, el Corcovado y disfruta de las playas más hermosas del mundo.",
                "short_description": "Río de Janeiro con Pan de Azúcar y Corcovado",
                "country": "Brasil",
                "price": 12890,
                "member_price": 9500,
                "duration_days": 6,
                "category": "paquete",
                "includes": ["Transporte", "Hotel", "Tours"],
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
                "gallery": [],
                "featured": True,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "title": "Cartagena Mágica - Colombia",
                "description": "Vive la magia de Cartagena de Indias con sus calles coloniales, playas paradisíacas y una gastronomía incomparable. Una experiencia cultural única.",
                "short_description": "Ciudad colonial con playas paradisíacas",
                "country": "Colombia",
                "price": 5460,
                "member_price": 4200,
                "duration_days": 4,
                "category": "paquete",
                "includes": ["Transporte", "Alojamiento"],
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1583997052301-0042b33fc598?w=800",
                "gallery": [],
                "featured": True,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "title": "Cartagena y Panamá",
                "description": "Dos países, dos destinos increíbles. Disfruta de Cartagena y Panamá en un solo viaje. City tour, canal de Panamá y tour nocturno en Cinta Costera.",
                "short_description": "Dos países en un solo viaje espectacular",
                "country": "Panamá",
                "price": 8600,
                "member_price": 7000,
                "duration_days": 5,
                "category": "paquete",
                "includes": ["Transporte", "Alojamiento", "City Tours"],
                "rating": 4.8,
                "image_url": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800",
                "gallery": [],
                "featured": True,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "title": "Cancún Todo Incluido",
                "description": "Relájate en las playas de arena blanca de Cancún con un paquete todo incluido. Resort 5 estrellas, excursiones a Chichén Itzá y cenotes.",
                "short_description": "Resort 5 estrellas con excursiones incluidas",
                "country": "México",
                "price": 15200,
                "member_price": 11500,
                "duration_days": 7,
                "category": "alojamiento",
                "includes": ["Vuelos", "Resort Todo Incluido", "Excursiones", "Traslados"],
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800",
                "gallery": [],
                "featured": True,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "title": "Experiencia Gastronómica - Perú",
                "description": "Descubre la riqueza culinaria de Perú con tours gastronómicos en Lima, visita a Machu Picchu y el Valle Sagrado.",
                "short_description": "Gastronomía y cultura en el corazón de los Andes",
                "country": "Perú",
                "price": 18500,
                "member_price": 14800,
                "duration_days": 8,
                "category": "experiencia",
                "includes": ["Vuelos", "Hoteles", "Tours Gastronómicos", "Entrada Machu Picchu"],
                "rating": 4.9,
                "image_url": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800",
                "gallery": [],
                "featured": False,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.packages.insert_many(sample_packages)
        logger.info("Sample packages seeded")

    # Seed sample member if empty
    member_count = await db.members.count_documents({})
    if member_count == 0:
        sample_member = {
            "contract_number": "KT-001",
            "dpi": "1234567890101",
            "name": "Juan Pérez García",
            "email": "juan@ejemplo.com",
            "phone": "+502 5555-1234",
            "service_years": 3,
            "membership_start": "2023-01-15",
            "membership_end": "2026-01-15",
            "family_members_allowed": 4,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.members.insert_one(sample_member)
        logger.info("Sample member seeded: KT-001 / 1234567890101")
        # Update test credentials
        creds_path = Path("/app/memory/test_credentials.md")
        with open(creds_path, "a") as f:
            f.write("\n## Member (Socio)\n- Contract: KT-001\n- DPI: 1234567890101\n- Name: Juan Pérez García\n")

@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_sample_data()
    await seed_commerce_data()
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await db.users.create_index("email", unique=True)
    await db.members.create_index("contract_number", unique=True)
    await db.members.create_index("dpi")
    await db.commerce.create_index("name")
    await db.commerce.create_index("category")
    await db.commerce.create_index("validation_code")
    await db.push_subscriptions.create_index("endpoint", unique=True)
    await db.push_subscriptions.create_index("user_id")
    await db.quotations.create_index("user_id")
    await db.quotations.create_index("status")
    await db.quotations.create_index("created_at")
    await db.chat_conversations.create_index("user_id")
    await db.chat_conversations.create_index("status")
    await db.chat_messages.create_index("conversation_id")
    await db.announcements.create_index("target")
    await db.announcements.create_index("created_at")
    await db.user_changes_audit.create_index("target_user_id")
    await db.user_changes_audit.create_index("admin_id")
    await db.user_changes_audit.create_index("timestamp")
    await db.vacation_requests.create_index("user_id")
    await db.vacation_requests.create_index("status")
    await db.referrals.create_index("referral_code")
    await db.referrals.create_index("status")
    await db.packages.create_index("featured")
    await db.packages.create_index("country")
    await db.push_notifications.create_index([("sent_at", -1)])
    await db.coupons.create_index("code", unique=True)
    await db.coupons.create_index("member_id")
    await db.coupons.create_index("commerce_id")
    await db.coupons.create_index("status")
    await db.commerce_visits.create_index("member_id")
    await db.commerce_visits.create_index("commerce_id")
    logger.info("Kuxtal Travel API started")

async def seed_commerce_data():
    count = await db.commerce.count_documents({})
    if count == 0:
        sample_commerce = [
            {"name": "La Parrilla Gaucha", "description": "Restaurante de carnes premium con cortes argentinos y ambiente familiar", "category": "Restaurantes", "location": "Zona 10, Guatemala City", "phone": "+502 2334-5678", "email": "info@parrillagucha.gt", "benefit_description": "15% de descuento en consumo para socios Kuxtal", "validation_code": "GAUCHA01", "logo_url": "", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Pet Care Center", "description": "Centro veterinario y spa para mascotas con servicio 24/7", "category": "Mascotas", "location": "Zona 14, Guatemala City", "phone": "+502 2445-6789", "email": "info@petcare.gt", "benefit_description": "20% en consultas y 10% en productos", "validation_code": "PETCAR01", "logo_url": "", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Spa Relax & Beauty", "description": "Spa de lujo con tratamientos faciales, masajes y aromaterapia", "category": "Belleza", "location": "Zona 15, Guatemala City", "phone": "+502 2556-7890", "email": "info@sparelax.gt", "benefit_description": "25% en todos los tratamientos para socios", "validation_code": "SPAREX01", "logo_url": "", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "FitLife Gym", "description": "Gimnasio completo con clases grupales, piscina y entrenadores personales", "category": "Deportes", "location": "Zona 11, Guatemala City", "phone": "+502 2667-8901", "email": "info@fitlife.gt", "benefit_description": "Membresía con 30% de descuento para socios Kuxtal", "validation_code": "FITLIF01", "logo_url": "", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.commerce.insert_many(sample_commerce)
        logger.info("Sample commerce seeded")
        # Create commerce user accounts
        for c in await db.commerce.find().to_list(100):
            commerce_email = f"commerce_{c['_id']}@kuxtal.commerce"
            existing_user = await db.users.find_one({"email": commerce_email})
            if not existing_user:
                try:
                    await db.users.insert_one({"email": commerce_email, "password_hash": hash_password(c.get("validation_code", "12345")), "name": c["name"], "role": "commerce", "commerce_id": str(c["_id"]), "created_at": datetime.now(timezone.utc).isoformat()})
                except Exception:
                    pass

app.include_router(api_router)

# ─────────────────────── Bulk Import helpers moved above include_router ───────────────────────

import io as _io
import csv as _csv
from openpyxl import Workbook as _Workbook, load_workbook as _load_workbook
from openpyxl.styles import Font as _Font, PatternFill as _PatternFill, Alignment as _Alignment

# Columns for the Members template (key, label, required, example)
MEMBER_TEMPLATE_COLS = [
    ("contract_number", "Número de contrato*", True, "KT-0100"),
    ("name", "Nombre completo*", True, "Juan Pérez López"),
    ("dpi", "DPI*", True, "1234567890101"),
    ("email", "Email", False, "juan@ejemplo.com"),
    ("phone", "Teléfono", False, "+50255551234"),
    ("service_years", "Años de servicio", False, 5),
    ("membership_start", "Inicio membresía (AAAA-MM-DD)", False, "2024-01-15"),
    ("membership_end", "Fin membresía (AAAA-MM-DD)", False, "2029-01-15"),
    ("family_members_allowed", "Familiares permitidos", False, 3),
    ("investment_amount", "Monto inversión Q", False, 45000),
    ("investment_plan", "Plan de inversión", False, "5 años"),
    ("status", "Estado (active/inactive)", False, "active"),
    ("contract_date", "Fecha contrato", False, "2024-01-15"),
    ("age", "Edad", False, 38),
    ("marital_status", "Estado civil", False, "Casado"),
    ("nationality", "Nacionalidad", False, "Guatemalteca"),
    ("profession", "Profesión", False, "Ingeniero"),
    ("address", "Dirección", False, "5a av 10-25 zona 10"),
    ("coowner_name", "Copropietario - Nombre", False, "Ana López"),
    ("coowner_nationality", "Copropietario - Nacionalidad", False, "Guatemalteca"),
    ("coowner_profession", "Copropietario - Profesión", False, "Médico"),
    ("coowner_phone", "Copropietario - Teléfono", False, "+50255551235"),
    ("coowner_email", "Copropietario - Email", False, "ana@ejemplo.com"),
    ("coowner_investment", "Copropietario - Inversión", False, "50%"),
    ("vigencia", "Vigencia", False, ""),
    ("cuotas", "Cuotas", False, ""),
    ("bank", "Banco", False, ""),
    ("termination_date", "Fecha terminación", False, ""),
    ("tc", "TC", False, ""),
    ("nit", "NIT", False, ""),
    ("billing_name", "Nombre facturación", False, ""),
    ("dpi_words", "DPI en letras", False, "CIENTO VEINTITRES MILLONES..."),
    ("observations", "Observaciones", False, ""),
]

PACKAGE_TEMPLATE_COLS = [
    ("title", "Título*", True, "Aventura en Tikal 3 días"),
    ("short_description", "Descripción corta", False, "Explora las ruinas mayas"),
    ("description", "Descripción completa*", True, "Una aventura única en el corazón de la selva..."),
    ("country", "País*", True, "Guatemala"),
    ("price", "Precio público Q*", True, 2500),
    ("agency_price", "Precio agencia Q (costo base)", False, 1500),
    ("member_price", "Precio socio Q", False, 1800),
    ("duration_days", "Duración (días)*", True, 3),
    ("category", "Categoría (paquete/alojamiento/experiencia)", False, "paquete"),
    ("includes", "Incluye (separado por |)", False, "Hospedaje|Desayunos|Transporte|Guía"),
    ("accommodation_type", "Tipo hospedaje", False, "hotel"),
    ("difficulty", "Dificultad (facil/moderado/dificil)", False, "moderado"),
    ("min_group", "Grupo mínimo", False, 2),
    ("max_group", "Grupo máximo", False, 15),
    ("rating", "Rating", False, 4.8),
    ("image_url", "URL imagen principal", False, "https://example.com/tikal.jpg"),
    ("gallery", "Galería URLs (separado por |)", False, "https://ex.com/1.jpg|https://ex.com/2.jpg"),
    ("featured", "Destacado (true/false)", False, "false"),
    ("status", "Estado (active/inactive)", False, "active"),
    ("visibility", "Visibilidad (public/internal)", False, "public"),
    ("promo_start", "Promo inicio (AAAA-MM-DD)", False, ""),
    ("promo_end", "Promo fin (AAAA-MM-DD)", False, ""),
]

def _build_template_xlsx(title: str, columns) -> bytes:
    wb = _Workbook()
    ws = wb.active
    ws.title = title[:31]
    header_fill = _PatternFill(start_color="1B325F", end_color="1B325F", fill_type="solid")
    header_font = _Font(color="FFFFFF", bold=True, size=11)
    required_font = _Font(color="FFFFFF", bold=True, size=11, italic=True)
    for idx, (_, label, required, _ex) in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=idx, value=label)
        cell.fill = header_fill
        cell.font = required_font if required else header_font
        cell.alignment = _Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[cell.column_letter].width = max(16, min(40, len(str(label)) + 2))
    # Example row
    for idx, (_, _lb, _r, ex) in enumerate(columns, start=1):
        ws.cell(row=2, column=idx, value=ex)
    ws.row_dimensions[1].height = 32
    # Freeze header
    ws.freeze_panes = "A2"
    # Instructions sheet
    info = wb.create_sheet("Instrucciones")
    info.append(["Cómo llenar la plantilla"])
    info.append([""])
    info.append(["1. Las columnas con asterisco (*) son obligatorias."])
    info.append(["2. No cambies el orden ni el nombre de las columnas de la cabecera."])
    info.append(["3. Borra la fila de ejemplo (fila 2) antes de llenar tus datos reales."])
    info.append(["4. Para campos que aceptan listas (ej. Incluye, Galería), separa los valores con el carácter |"])
    info.append(["5. Las fechas deben escribirse en formato AAAA-MM-DD (ej. 2024-01-15)."])
    info.append(["6. Al subir el archivo, el sistema te mostrará una vista previa antes de importar."])
    for cell in info["1:1"]:
        cell.font = _Font(bold=True, size=13, color="1B325F")
    info.column_dimensions["A"].width = 90
    buf = _io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.getvalue()

def _build_label_to_key_map(columns) -> dict:
    """Map any known header (label / label-without-asterisk / raw key) → field key."""
    label_to_key = {}
    for key, label, _r, _ex in columns:
        label_to_key[label.strip().lower()] = key
        label_to_key[label.replace("*", "").strip().lower()] = key
        label_to_key[key.lower()] = key
    return label_to_key


def _row_has_any_value(values) -> bool:
    return any((v is not None and str(v).strip() != "") for v in values)


def _map_row_values(header: list, raw_values, label_to_key: dict, strip_strings: bool) -> dict:
    row: dict = {}
    for i, value in enumerate(raw_values):
        if i >= len(header):
            break
        key = label_to_key.get(header[i])
        if key is None:
            continue
        row[key] = (value or "").strip() if strip_strings else value
    return row


def _parse_csv_rows(file_bytes: bytes, label_to_key: dict) -> list:
    text = file_bytes.decode("utf-8-sig", errors="ignore")
    data = list(_csv.reader(_io.StringIO(text)))
    if not data:
        return []
    header = [h.strip().lower() for h in data[0]]
    rows = []
    for raw in data[1:]:
        if not _row_has_any_value(raw):
            continue
        rows.append(_map_row_values(header, raw, label_to_key, strip_strings=True))
    return rows


def _parse_xlsx_rows(file_bytes: bytes, label_to_key: dict) -> list:
    wb = _load_workbook(_io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    header_row = None
    for first_row in ws.iter_rows(values_only=True):
        header_row = [(str(h).strip().lower() if h is not None else "") for h in first_row]
        break
    if header_row is None:
        return []
    rows = []
    for raw in ws.iter_rows(min_row=2, values_only=True):
        if not _row_has_any_value(raw):
            continue
        rows.append(_map_row_values(header_row, raw, label_to_key, strip_strings=False))
    return rows


def _parse_uploaded_rows(file_bytes: bytes, filename: str, columns):
    """Parse CSV/XLSX and map header labels to field keys. Returns list[dict]."""
    label_to_key = _build_label_to_key_map(columns)
    if (filename or "").lower().endswith(".csv"):
        return _parse_csv_rows(file_bytes, label_to_key)
    return _parse_xlsx_rows(file_bytes, label_to_key)

def _coerce(val, typ):
    if val is None or val == "":
        return None
    try:
        if typ is int:
            return int(float(str(val).replace(",", "")))
        if typ is float:
            return float(str(val).replace(",", ""))
        if typ is bool:
            return str(val).strip().lower() in ("1", "true", "yes", "si", "sí", "y")
        if typ is list:
            return [s.strip() for s in str(val).split("|") if s.strip()]
        return str(val).strip()
    except Exception:
        return None

@app.get("/api/admin/members/template")
async def members_template(request: Request):
    await require_role("super_admin", "admin")(request)
    data = _build_template_xlsx("Socios", MEMBER_TEMPLATE_COLS)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="plantilla_socios.xlsx"'},
    )

@app.get("/api/admin/packages/template")
async def packages_template(request: Request):
    await require_role("super_admin", "admin")(request)
    data = _build_template_xlsx("Paquetes", PACKAGE_TEMPLATE_COLS)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="plantilla_paquetes.xlsx"'},
    )

# ── User manuals (PDF, branded Kuxtal) ──
from manuals_pdf import generate_manual_pdf, get_manual_filename, MANUAL_FILES, MANUALS_DIR  # noqa: E402

@app.get("/api/admin/manuals/{role}")
async def download_manual(role: str, request: Request):
    """Descarga el manual PDF (admin / member / commerce). Solo super_admin/admin."""
    await require_role("super_admin", "admin")(request)
    if role not in MANUAL_FILES:
        raise HTTPException(status_code=404, detail="Manual no encontrado")
    try:
        pdf = generate_manual_pdf(role)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{get_manual_filename(role)}"'},
    )


@app.get("/api/manuals/{role}/markdown")
async def get_manual_markdown(role: str, request: Request):
    """Devuelve el contenido markdown del manual. Cualquier usuario autenticado puede ver SU manual.
    - admin/super_admin: cualquiera de los 3
    - member: solo 'member'
    - commerce: solo 'commerce'
    """
    user = await get_current_user(request)
    if role not in MANUAL_FILES:
        raise HTTPException(status_code=404, detail="Manual no encontrado")
    user_role = user.get("role", "")
    if user_role not in ("super_admin", "admin"):
        # member can only access 'member', commerce only 'commerce'
        if user_role == "member" and role != "member":
            raise HTTPException(status_code=403, detail="Acceso denegado a este manual")
        if user_role == "commerce" and role != "commerce":
            raise HTTPException(status_code=403, detail="Acceso denegado a este manual")
    filename = MANUAL_FILES[role][0]
    md_path = MANUALS_DIR / filename
    if not md_path.exists():
        raise HTTPException(status_code=500, detail="Archivo de manual no encontrado")
    return {"role": role, "title": MANUAL_FILES[role][1], "markdown": md_path.read_text(encoding="utf-8")}


@app.get("/api/manuals/{role}/pdf")
async def download_manual_self(role: str, request: Request):
    """Descarga el PDF del manual para el usuario logeado (con misma lógica de permisos que markdown)."""
    user = await get_current_user(request)
    if role not in MANUAL_FILES:
        raise HTTPException(status_code=404, detail="Manual no encontrado")
    user_role = user.get("role", "")
    if user_role not in ("super_admin", "admin"):
        if user_role == "member" and role != "member":
            raise HTTPException(status_code=403, detail="Acceso denegado")
        if user_role == "commerce" and role != "commerce":
            raise HTTPException(status_code=403, detail="Acceso denegado")
    try:
        pdf = generate_manual_pdf(role)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{get_manual_filename(role)}"'},
    )


# ── WhatsApp Bot (OpenAI + Kapso.ai) ──
import bot_service  # noqa: E402


class BotConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    openai_api_key: Optional[str] = None  # empty string = keep current
    openai_model: Optional[str] = None
    kapso_api_key: Optional[str] = None
    kapso_phone_number_id: Optional[str] = None
    kapso_webhook_secret: Optional[str] = None
    system_prompt: Optional[str] = None
    knowledge_base: Optional[str] = None
    include_packages: Optional[bool] = None
    include_commerces: Optional[bool] = None
    include_member_data: Optional[bool] = None
    max_history: Optional[int] = None
    external_api_base_url: Optional[str] = None
    external_admin_token: Optional[str] = None
    public_site_url: Optional[str] = None


class BotTestRequest(BaseModel):
    message: str
    session_id: Optional[str] = "admin-test"


@app.get("/api/admin/bot/config")
async def admin_bot_get_config(request: Request):
    await require_role("super_admin", "admin", permission="bot")(request)
    return await bot_service.get_bot_config(db, masked=True)


@app.put("/api/admin/bot/config")
async def admin_bot_update_config(req: BotConfigUpdate, request: Request):
    await require_role("super_admin", "admin", permission="bot")(request)
    payload = {k: v for k, v in req.model_dump().items() if v is not None}
    return await bot_service.save_bot_config(db, payload)


@app.post("/api/admin/bot/test")
async def admin_bot_test(req: BotTestRequest, request: Request):
    """Probar el bot directamente desde el admin (sin pasar por WhatsApp)."""
    await require_role("super_admin", "admin", permission="bot")(request)
    raw_cfg = await db.config.find_one({"key": bot_service.CONFIG_KEY})
    if not raw_cfg or not raw_cfg.get("openai_api_key"):
        raise HTTPException(status_code=400, detail="Configurá primero la API key de OpenAI")
    system_prompt = await bot_service.build_full_system_prompt(db, raw_cfg, member=None)
    session_id = req.session_id or "admin-test"
    conv = await bot_service.get_or_create_session(db, session_id, channel="admin-test")
    history = conv.get("messages", [])[-(raw_cfg.get("max_history") or 10):]
    try:
        reply = await bot_service.chat_once(
            api_key=raw_cfg["openai_api_key"],
            model=raw_cfg.get("openai_model") or "gpt-4o-mini",
            system_prompt=system_prompt,
            history=history,
            user_message=req.message,
            session_id=session_id,
        )
    except Exception as e:
        logger.error("Bot test error: %s", e)
        raise HTTPException(status_code=500, detail=f"Error al consultar OpenAI: {e}") from e
    await bot_service.append_message(db, session_id, "user", req.message)
    await bot_service.append_message(db, session_id, "assistant", reply)
    return {"reply": reply}


@app.get("/api/admin/bot/conversations")
async def admin_bot_conversations(request: Request, limit: int = 50):
    await require_role("super_admin", "admin", permission="bot")(request)
    return await bot_service.list_conversations(db, limit=limit)


@app.delete("/api/admin/bot/conversations/{session_id}")
async def admin_bot_delete_conv(session_id: str, request: Request):
    await require_role("super_admin", "admin", permission="bot")(request)
    await db.bot_conversations.delete_one({"session_id": session_id})
    return {"ok": True}


@app.post("/api/webhooks/kapso/whatsapp")
async def kapso_webhook(request: Request):
    """Webhook público para Kapso.ai. Verifica HMAC + procesa mensajes entrantes."""
    raw = await request.body()
    signature = request.headers.get("X-Webhook-Signature", "")
    event = request.headers.get("X-Webhook-Event", "")
    logger.info("Kapso webhook recibido. event=%s sig_len=%d body_len=%d", event, len(signature), len(raw))

    raw_cfg = await db.config.find_one({"key": bot_service.CONFIG_KEY})
    if not raw_cfg or not raw_cfg.get("enabled"):
        logger.info("Bot disabled, skipping")
        return {"ok": True, "skipped": "bot_disabled"}

    secret = raw_cfg.get("kapso_webhook_secret") or ""
    if secret and not bot_service.verify_kapso_signature(raw, signature, secret):
        logger.warning("Kapso webhook signature mismatch (sig=%s)", signature[:20])
        raise HTTPException(status_code=401, detail="Firma inválida")

    try:
        payload = json_module.loads(raw.decode("utf-8")) if raw else {}
    except Exception:
        logger.error("Kapso webhook JSON parse failed")
        raise HTTPException(status_code=400, detail="JSON inválido") from None

    # Log payload structure (truncated)
    payload_keys = list(payload.keys()) if isinstance(payload, dict) else "non-dict"
    logger.info("Kapso payload keys=%s preview=%s", payload_keys, str(payload)[:600])

    # Solo nos importan mensajes entrantes
    if event and "message.received" not in event:
        logger.info("Ignoring event %s", event)
        return {"ok": True, "ignored_event": event}

    inbound = bot_service.extract_inbound_message(payload)
    if not inbound or not inbound.get("text"):
        logger.warning("No inbound message extracted from payload: %s", str(payload)[:800])
        return {"ok": True, "skipped": "no_text", "payload_preview": str(payload)[:300]}

    sender = inbound["from"]
    text = inbound["text"]
    session_id = f"wa:{sender}"
    logger.info("Inbound: from=%s text=%r", sender, text[:120])

    # Identificar socio si su número WA coincide con member.phone (productivo o local)
    member = None
    if raw_cfg.get("include_member_data"):
        member = await bot_service.lookup_member_by_phone(db, sender, raw_cfg)

    system_prompt = await bot_service.build_full_system_prompt(db, raw_cfg, member=member)
    conv = await bot_service.get_or_create_session(db, session_id, channel="whatsapp")
    history = conv.get("messages", [])[-(raw_cfg.get("max_history") or 10):]

    try:
        reply = await bot_service.chat_once(
            api_key=raw_cfg["openai_api_key"],
            model=raw_cfg.get("openai_model") or "gpt-4o-mini",
            system_prompt=system_prompt,
            history=history,
            user_message=text,
            session_id=session_id,
        )
        logger.info("OpenAI reply (%d chars): %s", len(reply), reply[:150])
    except Exception as e:
        logger.error("Bot chat_once error: %s", e)
        reply = "Disculpá, tuve un problema técnico. Voy a derivar tu mensaje al equipo Kuxtal."

    await bot_service.append_message(db, session_id, "user", text)
    await bot_service.append_message(db, session_id, "assistant", reply)

    try:
        send_result = await bot_service.send_whatsapp_message(
            kapso_api_key=raw_cfg.get("kapso_api_key", ""),
            phone_number_id=raw_cfg.get("kapso_phone_number_id", ""),
            to=sender,
            text=reply,
        )
        logger.info("Kapso send OK: %s", str(send_result)[:200])
    except Exception as e:
        logger.error("Kapso send error: %s", e)
        return {"ok": False, "error": str(e)}

    return {"ok": True}

async def _load_existing_member_contracts() -> set:
    """Return all existing contract_numbers to check for in-DB duplicates."""
    existing = set()
    async for m in db.members.find({}, {"contract_number": 1}):
        if m.get("contract_number"):
            existing.add(m["contract_number"])
    return existing


def _normalize_gt_phone(value) -> str:
    """Normaliza un teléfono guatemalteco al formato +502XXXXXXXX para WhatsApp.
    - Si llega vacío, devuelve "".
    - Limpia espacios, guiones, paréntesis y puntos.
    - Si ya empieza con + (cualquier país) lo respeta.
    - Si no empieza con 502, agrega 502 al inicio.
    - Resultado siempre con prefijo `+`.
    """
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    # Limpiar todo lo que no sea dígito o +
    cleaned = "".join(ch for ch in s if ch.isdigit() or ch == "+")
    if not cleaned:
        return ""
    # Si ya tiene +, respetarlo (probablemente otro país)
    if cleaned.startswith("+"):
        return cleaned
    # Sin prefijo: si no empieza con 502, agregarlo
    if not cleaned.startswith("502"):
        cleaned = "502" + cleaned
    return f"+{cleaned}"


def _validate_member_row(row: dict) -> tuple:
    """Return (contract, name, dpi, error_msg_or_None)."""
    contract = str(row.get("contract_number") or "").strip()
    name = str(row.get("name") or "").strip()
    dpi = str(row.get("dpi") or "").strip()
    if not contract or not name or not dpi:
        return contract, name, dpi, "Faltan campos obligatorios (contract_number, name, dpi)"
    return contract, name, dpi, None


def _build_member_doc_from_row(row: dict, contract: str, name: str, dpi: str) -> dict:
    """Coerce typed fields for a single member row."""
    num_fields = {"service_years": int, "age": int, "family_members_allowed": int, "investment_amount": float}
    phone_fields = {"phone", "coowner_phone"}
    doc = {"contract_number": contract, "name": name, "dpi": dpi, "status": "active"}
    for key, _lb, _r, _ex in MEMBER_TEMPLATE_COLS:
        if key in ("contract_number", "name", "dpi"):
            continue
        val = row.get(key)
        if val is None or val == "":
            continue
        if key in num_fields:
            coerced = _coerce(val, num_fields[key])
            if coerced is not None:
                doc[key] = coerced
        elif key in phone_fields:
            doc[key] = _normalize_gt_phone(val)
        else:
            doc[key] = str(val).strip() if not isinstance(val, (int, float)) else val
    return doc


async def _insert_member_with_login(doc: dict, contract: str, dpi: str, name: str, user_id) -> str:
    """Persist member + ensure an auth user exists with contract_number as the email prefix."""
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user_id
    result = await db.members.insert_one(doc)
    new_id = str(result.inserted_id)
    member_email = f"{contract}@kuxtal.member"
    if not await db.users.find_one({"email": member_email}):
        await db.users.insert_one({
            "email": member_email,
            "password_hash": hash_password(dpi),
            "name": name,
            "role": "member",
            "member_id": new_id,
            "is_family_member": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return new_id


@app.post("/api/admin/members/bulk-import")
async def members_bulk_import(
    request: Request,
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    update_existing: bool = Query(False, description="Si True, los socios cuyo contract_number ya existe se ACTUALIZAN; si False, se reportan como error duplicado."),
):
    user = await require_role("super_admin", "admin")(request)
    content = await file.read()
    try:
        rows = _parse_uploaded_rows(content, file.filename or "", MEMBER_TEMPLATE_COLS)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {e}")

    created, updated, errors, preview = [], [], [], []
    existing_contracts = await _load_existing_member_contracts()

    for idx, row in enumerate(rows, start=2):  # row 1 is header
        contract, name, dpi, err = _validate_member_row(row)
        if err:
            errors.append({"row": idx, "error": err})
            continue

        is_existing = contract in existing_contracts

        if is_existing and not update_existing:
            errors.append({"row": idx, "contract_number": contract, "error": "El número de contrato ya existe (activá 'Actualizar existentes' para sobrescribir)"})
            continue

        doc = _build_member_doc_from_row(row, contract, name, dpi)
        preview.append({"row": idx, "action": "update" if is_existing else "create", **doc})
        existing_contracts.add(contract)

        if not dry_run:
            try:
                if is_existing:
                    # UPDATE: solo campos provistos (no toca created_at/created_by ni borra otros)
                    update_fields = {k: v for k, v in doc.items() if k not in ("contract_number",)}
                    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
                    update_fields["updated_by"] = user["_id"]
                    await db.members.update_one(
                        {"contract_number": contract},
                        {"$set": update_fields},
                    )
                    # Sincronizar password del usuario asociado si cambió el DPI
                    member_email = f"{contract}@kuxtal.member"
                    await db.users.update_one(
                        {"email": member_email},
                        {"$set": {"password_hash": hash_password(dpi), "name": name}},
                    )
                    updated.append({"row": idx, "contract_number": contract})
                else:
                    new_id = await _insert_member_with_login(doc, contract, dpi, name, user["_id"])
                    created.append({"row": idx, "id": new_id, "contract_number": contract})
            except Exception as e:
                errors.append({"row": idx, "contract_number": contract, "error": str(e)})

    return {
        "total_rows": len(rows),
        "valid": len(preview),
        "errors": errors,
        "created": created if not dry_run else [],
        "updated": updated if not dry_run else [],
        "preview": preview if dry_run else [],
    }

@app.post("/api/admin/packages/bulk-import")
async def packages_bulk_import(request: Request, file: UploadFile = File(...), dry_run: bool = Query(False)):
    user = await require_role("super_admin", "admin")(request)
    content = await file.read()
    try:
        rows = _parse_uploaded_rows(content, file.filename or "", PACKAGE_TEMPLATE_COLS)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {e}")

    created, errors, preview = [], [], []
    num_fields = {"price": float, "agency_price": float, "member_price": float, "duration_days": int, "min_group": int, "max_group": int, "rating": float}
    list_fields = {"includes", "gallery"}
    bool_fields = {"featured"}

    for idx, row in enumerate(rows, start=2):
        title = str(row.get("title") or "").strip()
        desc = str(row.get("description") or "").strip()
        country = str(row.get("country") or "").strip()
        price_v = row.get("price")
        dur_v = row.get("duration_days")
        if not title or not desc or not country or price_v in (None, "") or dur_v in (None, ""):
            errors.append({"row": idx, "error": "Faltan obligatorios (title, description, country, price, duration_days)"})
            continue
        doc = {"title": title, "description": desc, "country": country, "category": "paquete", "status": "active", "visibility": "public", "rating": 4.8}
        for key, _lb, _r, _ex in PACKAGE_TEMPLATE_COLS:
            val = row.get(key)
            if val is None or val == "":
                continue
            if key in num_fields:
                coerced = _coerce(val, num_fields[key])
                if coerced is not None:
                    doc[key] = coerced
            elif key in list_fields:
                coerced = _coerce(val, list)
                if coerced is not None:
                    doc[key] = coerced
            elif key in bool_fields:
                doc[key] = _coerce(val, bool) or False
            else:
                doc[key] = str(val).strip() if not isinstance(val, (int, float)) else val
        preview.append({"row": idx, **doc})
        if not dry_run:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            doc["created_by"] = user["_id"]
            try:
                result = await db.packages.insert_one(doc)
                created.append({"row": idx, "id": str(result.inserted_id), "title": title})
            except Exception as e:
                errors.append({"row": idx, "title": title, "error": str(e)})
    return {"total_rows": len(rows), "valid": len(preview), "errors": errors, "created": created if not dry_run else [], "preview": preview if dry_run else []}

# ─────────────────────── Export individual member to Excel ───────────────────────

# 26-column horizontal layout (matches the client's "DATOS HANSEN" spreadsheet).
_MEMBER_EXPORT_COLUMNS = [
    ("FECHA", "contract_date"),
    ("CONTRATO", "contract_number"),
    ("NOMBRE PROPIETARIO", "name"),
    ("EDAD", "age"),
    ("ESTADO CIVIL", "marital_status"),
    ("NACIONALIDAD", "nationality"),
    ("PROFESION", "profession"),
    ("DOMICILIO", "address"),
    ("DPI", "dpi"),
    ("DPI EN LETRAS", "dpi_words"),
    ("TELEFONO", "phone"),
    ("CORREO", "email"),
    ("NOMBRE COPROPIETARIO", "coowner_name"),
    ("NACIONALIDAD", "coowner_nationality"),
    ("COPROPIETARIO PROFESION", "coowner_profession"),
    ("COPROPIETARIO TEL", "coowner_phone"),
    ("COPROPIETARIO CORREO", "coowner_email"),
    ("COPROPIETARIO INVERSION", "coowner_investment"),
    ("VIGENCIA", "vigencia"),
    ("CUOTAS", "cuotas"),
    ("BANCO", "bank"),
    ("TERMINACION", "termination_date"),
    ("TC", "tc"),
    ("NIT", "nit"),
    ("NOMBRE DE FACTURACIÓN", "billing_name"),
    ("OBSERVACIONES", "observations"),
]

def _format_date_value(v):
    """Convert ISO / plain strings to DD/MM/YYYY. Leaves arbitrary strings untouched if unparseable."""
    if not v:
        return ""
    s = str(v).strip()
    if not s:
        return ""
    # Try ISO YYYY-MM-DD (optionally with time)
    try:
        from datetime import datetime as _dt
        if "T" in s:
            s = s.split("T", 1)[0]
        parts = s.split("-")
        if len(parts) == 3 and len(parts[0]) == 4:
            dt = _dt.strptime(s[:10], "%Y-%m-%d")
            return dt.strftime("%d/%m/%Y")
    except Exception:
        pass
    return s

async def _build_member_export_xlsx(member: dict) -> bytes:
    wb = _Workbook()
    ws = wb.active
    ws.title = "Socios"
    header_fill = _PatternFill(start_color="1B325F", end_color="1B325F", fill_type="solid")
    header_font = _Font(color="FFFFFF", bold=True, size=11)
    # Write header row
    for idx, (label, _key) in enumerate(_MEMBER_EXPORT_COLUMNS, start=1):
        c = ws.cell(row=1, column=idx, value=label)
        c.fill = header_fill
        c.font = header_font
        c.alignment = _Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[c.column_letter].width = max(14, min(36, len(label) + 2))
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"
    # Write the single data row
    date_keys = {"contract_date", "termination_date"}
    for idx, (_lb, key) in enumerate(_MEMBER_EXPORT_COLUMNS, start=1):
        val = member.get(key, "")
        if val in (None, ""):
            out = ""
        elif key in date_keys:
            out = _format_date_value(val)
        else:
            out = val if isinstance(val, (int, float)) else str(val)
        ws.cell(row=2, column=idx, value=out)
    buf = _io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.getvalue()

@app.get("/api/members/me/export")
async def export_my_member_data(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "member" or not user.get("member_id"):
        raise HTTPException(status_code=403, detail="Solo los socios pueden descargar sus datos")
    member = await db.members.find_one({"_id": ObjectId(user["member_id"])})
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    data = await _build_member_export_xlsx(member)
    safe_name = (member.get("contract_number") or str(member["_id"]))
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="kuxtal_{safe_name}.xlsx"'},
    )

@app.get("/api/admin/members/{member_id}/export")
async def admin_export_member_data(member_id: str, request: Request):
    await require_role("super_admin", "admin")(request)
    try:
        member = await db.members.find_one({"_id": ObjectId(member_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    data = await _build_member_export_xlsx(member)
    safe_name = (member.get("contract_number") or str(member["_id"]))
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="kuxtal_{safe_name}.xlsx"'},
    )

# Build allowed origins from env
_cors_origins = []
_frontend_url = os.environ.get("FRONTEND_URL", "")
if _frontend_url:
    _cors_origins.append(_frontend_url)
_extra_origins = os.environ.get("CORS_ORIGINS", "")
if _extra_origins and _extra_origins != "*":
    _cors_origins.extend([o.strip() for o in _extra_origins.split(",") if o.strip()])
# Always allow common patterns
if not _cors_origins:
    _cors_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https?://.*\.emergentagent\.com|https?://.*kuxtaltravelgt\.com|https?://localhost.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
