from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Response, Query, Header, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import requests
from pywebpush import webpush, WebPushException
import json as json_module
import random
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "kuxtal-travel"
storage_key = None

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "").replace("\\n", "\n")
VAPID_EMAIL = os.environ.get("VAPID_EMAIL", "mailto:info@kuxtaltravels.com")

COOKIE_SECURE = os.environ.get("FRONTEND_URL", "").startswith("https")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Helpers ──

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, role: str) -> str:
    payload = {"sub": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        if user.get("is_active") is False:
            raise HTTPException(status_code=403, detail="Cuenta desactivada")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")

def require_role(*roles, permission: str = None):
    async def checker(request: Request):
        user = await get_current_user(request)
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Acceso denegado")
        # Per-module permission enforcement for non-super_admin roles (super_admin bypass)
        if permission and user.get("role") != "super_admin":
            perms = user.get("permissions") or {}
            if not perms.get(permission):
                raise HTTPException(status_code=403, detail=f"No tienes permiso para '{permission}'")
        return user
    return checker

def serialize_doc(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

DELETE_SECRET = os.environ.get("DELETE_SECRET", "BORRAR YA")

async def verify_delete_code(request: Request):
    """Verify delete confirmation code from query param or body"""
    code = request.query_params.get("delete_code", "")
    if not code:
        try:
            body = await request.json()
            code = body.get("delete_code", "")
        except Exception:
            pass
    if code != DELETE_SECRET:
        raise HTTPException(status_code=403, detail="Clave de eliminación incorrecta. Ingresa la clave secreta para eliminar.")

# ── Storage ──

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── Pydantic Models ──

class LoginRequest(BaseModel):
    email: str
    password: str

class MemberLoginRequest(BaseModel):
    contract_number: str
    dpi: str

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

class PackageCreate(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = ""
    country: str
    price: float
    member_price: Optional[float] = 0
    agency_price: Optional[float] = 0  # precio base/costo. De aquí se derivan price y member_price con los markups globales.
    duration_days: int
    category: str = "paquete"
    includes: List[str] = []
    itinerary: List[dict] = []  # [{day: 1, title: "...", description: "..."}]
    accommodation_type: Optional[str] = ""  # hotel, resort, villa, hostel, camping
    difficulty: Optional[str] = ""  # facil, moderado, dificil
    min_group: Optional[int] = 1
    max_group: Optional[int] = 20
    rating: float = 4.8
    image_url: Optional[str] = ""
    gallery: List[str] = []
    featured: bool = False
    status: str = "active"
    # Visibility: 'public' = shown on web, 'internal' = only for internal quotations
    visibility: str = "public"
    # Promoción (opcional): fechas de inicio/fin para mostrar contador regresivo
    promo_start: Optional[str] = ""
    promo_end: Optional[str] = ""
    # Razón de desactivación (visible al admin cuando status=inactive)
    deactivation_reason: Optional[str] = ""

class QuotationRequest(BaseModel):
    package_id: Optional[str] = ""
    name: str
    email: str
    phone: str
    contract_number: Optional[str] = ""
    message: Optional[str] = ""
    guests: int = 1

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

class ChatMessageCreate(BaseModel):
    text: str

class ReferralSubmit(BaseModel):
    name: str
    email: str
    phone: str
    message: Optional[str] = ""

# ── Auth Routes ──

@api_router.post("/auth/login")
async def admin_login(req: LoginRequest, response: Response):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["role"])
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=COOKIE_SECURE, samesite="none" if COOKIE_SECURE else "lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=COOKIE_SECURE, samesite="none" if COOKIE_SECURE else "lax", max_age=604800, path="/")
    return {"id": user_id, "name": user.get("name", ""), "email": user["email"], "role": user["role"], "permissions": user.get("permissions"), "token": access_token}

@api_router.post("/auth/member-login")
async def member_login(req: MemberLoginRequest, response: Response):
    member = await db.members.find_one({"contract_number": req.contract_number.strip()})
    if not member:
        raise HTTPException(status_code=401, detail="Número de contrato no encontrado")
    # Check main member DPI or family member DPI
    is_family = False
    family_member_doc = None
    if member.get("dpi", "") == req.dpi.strip():
        is_family = False
    else:
        family_member_doc = await db.family_members.find_one({"contract_number": req.contract_number.strip(), "dpi": req.dpi.strip()})
        if family_member_doc:
            is_family = True
        else:
            raise HTTPException(status_code=401, detail="DPI incorrecto")
    if member.get("status") != "active":
        raise HTTPException(status_code=403, detail="Membresía inactiva")
    login_name = family_member_doc["name"] if is_family else member["name"]
    if is_family:
        user = await db.users.find_one({"member_id": str(member["_id"]), "family_dpi": req.dpi.strip()})
    else:
        user = await db.users.find_one({
            "member_id": str(member["_id"]),
            "$or": [{"family_dpi": None}, {"family_dpi": {"$exists": False}}],
        })
    if not user:
        user_doc = {
            "email": f"{req.contract_number}{'_' + req.dpi.strip()[-4:] if is_family else ''}@kuxtal.member",
            "password_hash": hash_password(req.dpi),
            "name": login_name,
            "role": "member",
            "member_id": str(member["_id"]),
            "is_family_member": is_family,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        if is_family:
            user_doc["family_dpi"] = req.dpi.strip()
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
    access_token = create_access_token(user_id, "member")
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=COOKIE_SECURE, samesite="none" if COOKIE_SECURE else "lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=COOKIE_SECURE, samesite="none" if COOKIE_SECURE else "lax", max_age=604800, path="/")
    member_data = serialize_doc(member)
    return {"id": user_id, "name": login_name, "role": "member", "contract_number": req.contract_number, "member": member_data, "is_family_member": is_family, "token": access_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if user.get("role") == "member" and user.get("member_id"):
        member = await db.members.find_one({"_id": ObjectId(user["member_id"])})
        if member:
            user["member"] = serialize_doc(member)
    if user.get("role") == "commerce" and user.get("commerce_id"):
        commerce = await db.commerce.find_one({"_id": ObjectId(user["commerce_id"])})
        if commerce:
            user["commerce"] = serialize_doc(commerce)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Sesión cerrada"}

# ── Members CRUD (Admin) ──

@api_router.get("/members")
async def list_members(request: Request, search: Optional[str] = None, status: Optional[str] = None):
    user = await require_role("super_admin", "admin")(request)
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
    user = await require_role("super_admin", "admin", permission="members")(request)
    prev = await db.members.find_one({"_id": ObjectId(member_id)})
    if not prev:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    update_data = req.model_dump()
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
    return serialize_doc(updated)

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="members")(request)
    await verify_delete_code(request)
    result = await db.members.delete_one({"_id": ObjectId(member_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return {"message": "Socio eliminado"}

# ── Packages CRUD ──

def normalize_search(text: str) -> str:
    """Convert search text to accent-insensitive regex pattern."""
    replacements = {
        'a': '[aáàâä]', 'e': '[eéèêë]', 'i': '[iíìîï]',
        'o': '[oóòôö]', 'u': '[uúùûü]', 'n': '[nñ]',
    }
    result = []
    for ch in text:
        lower = ch.lower()
        if lower in replacements:
            result.append(replacements[lower])
        else:
            result.append(re_module.escape(ch))
    return ''.join(result)

@api_router.get("/packages")
async def list_packages(request: Request, category: Optional[str] = None, country: Optional[str] = None, search: Optional[str] = None, featured: Optional[bool] = None, min_price: Optional[float] = None, max_price: Optional[float] = None, min_days: Optional[int] = None, max_days: Optional[int] = None, sort: Optional[str] = None, include_internal: Optional[bool] = False):
    # If admin, allow fetching internal packages too. Public users only see visibility=public
    is_admin = False
    try:
        u = await get_current_user(request)
        is_admin = u.get("role") in ("super_admin", "admin")
    except Exception:
        is_admin = False
    query = {}
    if not (is_admin and include_internal):
        # Public/member consumers: only active, public-visible packages
        query["status"] = "active"
        query["$and"] = [{"$or": [{"visibility": "public"}, {"visibility": {"$exists": False}}]}]
    if category:
        query["category"] = category
    if country:
        country_pattern = normalize_search(country)
        query["country"] = {"$regex": country_pattern, "$options": "i"}
    if search:
        search_pattern = normalize_search(search)
        search_or = [
            {"title": {"$regex": search_pattern, "$options": "i"}},
            {"description": {"$regex": search_pattern, "$options": "i"}},
            {"country": {"$regex": search_pattern, "$options": "i"}}
        ]
        # Nest search into $and to not conflict with visibility filter
        if "$and" in query:
            query["$and"].append({"$or": search_or})
        else:
            query["$or"] = search_or
    if min_price is not None:
        query.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if min_days is not None:
        query.setdefault("duration_days", {})["$gte"] = min_days
    if max_days is not None:
        query.setdefault("duration_days", {})["$lte"] = max_days
    if featured is not None:
        query["featured"] = featured

    sort_field = "created_at"
    sort_dir = -1
    if sort == "price_asc":
        sort_field = "price"
        sort_dir = 1
    elif sort == "price_desc":
        sort_field = "price"
        sort_dir = -1
    elif sort == "duration_asc":
        sort_field = "duration_days"
        sort_dir = 1
    elif sort == "duration_desc":
        sort_field = "duration_days"
        sort_dir = -1
    elif sort == "rating":
        sort_field = "rating"
        sort_dir = -1

    packages = []
    async for p in db.packages.find(query).sort(sort_field, sort_dir).limit(200):
        packages.append(serialize_doc(p))
    return packages

@api_router.get("/packages/{package_id}")
async def get_package(package_id: str):
    pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return serialize_doc(pkg)

@api_router.post("/packages")
async def create_package(req: PackageCreate, request: Request):
    user = await require_role("super_admin", "admin", permission="packages")(request)
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.packages.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    # Broadcast to members & all: new package available
    await _broadcast_news(
        title="Nuevo paquete disponible",
        message=f"{doc.get('title','')} - {doc.get('country','')}. ¡Descubrelo ahora!",
        link=f"/trip/{doc['_id']}",
        image_url=doc.get("image_url", ""),
        target="all",
    )
    return doc

@api_router.put("/packages/{package_id}")
async def update_package(package_id: str, req: PackageCreate, request: Request):
    user = await require_role("super_admin", "admin", permission="packages")(request)
    update_data = req.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.packages.update_one({"_id": ObjectId(package_id)}, {"$set": update_data})
    updated = await db.packages.find_one({"_id": ObjectId(package_id)})
    return serialize_doc(updated)

@api_router.put("/packages/{package_id}/toggle-status")
async def toggle_package_status(package_id: str, request: Request):
    await require_role("super_admin", "admin", permission="packages")(request)
    pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    new_status = "inactive" if pkg.get("status") == "active" else "active"
    # Optional reason from body
    reason = ""
    try:
        body = await request.json()
        reason = (body or {}).get("reason", "") or ""
    except Exception:
        reason = ""
    update = {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if new_status == "inactive":
        update["deactivation_reason"] = (reason or "").strip()
    else:
        # Reactivated: clear the reason
        update["deactivation_reason"] = ""
    await db.packages.update_one({"_id": ObjectId(package_id)}, {"$set": update})
    return {
        "message": f"Paquete {'activado' if new_status == 'active' else 'desactivado'}",
        "status": new_status,
        "deactivation_reason": update["deactivation_reason"],
    }

@api_router.delete("/packages/{package_id}")
async def delete_package(package_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="packages")(request)
    await verify_delete_code(request)
    result = await db.packages.delete_one({"_id": ObjectId(package_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return {"message": "Paquete eliminado"}

# ── Package Import from Google Drive ──

import re as re_module
import tempfile

def extract_gdrive_file_id(url: str) -> str:
    """Extract file ID from various Google Drive URL formats."""
    patterns = [
        r'/file/d/([a-zA-Z0-9_-]+)',
        r'id=([a-zA-Z0-9_-]+)',
        r'/d/([a-zA-Z0-9_-]+)',
        r'open\?id=([a-zA-Z0-9_-]+)',
    ]
    for pattern in patterns:
        match = re_module.search(pattern, url)
        if match:
            return match.group(1)
    return None

def download_gdrive_file(file_id: str, dest_path: str) -> str:
    """Download file from Google Drive using direct download URL."""
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
    resp = requests.get(download_url, stream=True, timeout=60, allow_redirects=True)
    resp.raise_for_status()
    content_type = resp.headers.get('Content-Type', '').lower()
    with open(dest_path, 'wb') as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    return content_type

def detect_mime_type(file_path: str, content_type: str) -> str:
    """Detect MIME type from file extension and content-type header."""
    ext = file_path.rsplit('.', 1)[-1].lower() if '.' in file_path else ''
    if 'pdf' in content_type or ext == 'pdf':
        return 'application/pdf'
    if 'image' in content_type or ext in ('png', 'jpg', 'jpeg', 'webp', 'avif'):
        return f'image/{ext}' if ext else 'image/jpeg'
    if 'word' in content_type or 'document' in content_type or ext in ('docx', 'doc'):
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if 'sheet' in content_type or 'excel' in content_type or ext in ('xlsx', 'xls'):
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if ext in ('png', 'jpg', 'jpeg', 'webp', 'gif'):
        return f'image/{ext}'
    return content_type or 'application/octet-stream'

def extract_text_from_pdf(file_path: str) -> str:
    import pdfplumber
    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages[:20]:
            t = page.extract_text()
            if t:
                text_parts.append(t)
    return "\n".join(text_parts)[:8000]

def extract_text_from_docx(file_path: str) -> str:
    from docx import Document
    doc = Document(file_path)
    text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(text_parts)[:8000]

def extract_text_from_xlsx(file_path: str) -> str:
    from openpyxl import load_workbook
    wb = load_workbook(file_path, data_only=True)
    text_parts = []
    for sheet in wb.worksheets[:5]:
        for row in sheet.iter_rows(max_row=100, values_only=True):
            cells = [str(c) for c in row if c is not None]
            if cells:
                text_parts.append(" | ".join(cells))
    return "\n".join(text_parts)[:8000]

def extract_images_from_pdf(file_path: str, max_images: int = 10, min_size: int = 15000) -> list:
    """Extract images from PDF using PyMuPDF. Returns list of uploaded image URLs."""
    import fitz
    extracted_urls = []
    try:
        doc = fitz.open(file_path)
        img_count = 0
        for page_num in range(min(len(doc), 30)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            for img_info in image_list:
                if img_count >= max_images:
                    break
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image:
                        continue
                    image_bytes = base_image["image"]
                    # Skip tiny images (icons, logos under 15KB)
                    if len(image_bytes) < min_size:
                        continue
                    ext = base_image.get("ext", "png")
                    if ext not in ("png", "jpg", "jpeg", "webp"):
                        ext = "png"
                    content_type = f"image/{ext}" if ext != "jpg" else "image/jpeg"
                    storage_path = f"{APP_NAME}/gallery/{uuid.uuid4().hex}.{ext}"
                    put_object(storage_path, image_bytes, content_type)
                    extracted_urls.append(f"/api/files/{storage_path}")
                    img_count += 1
                except Exception as img_err:
                    logger.warning(f"Failed to extract image xref={xref}: {img_err}")
                    continue
            if img_count >= max_images:
                break
        doc.close()
    except Exception as e:
        logger.error(f"PDF image extraction failed: {e}")
    return extracted_urls

PACKAGE_EXTRACTION_PROMPT = """Eres un asistente experto en turismo que extrae informacion de documentos para crear paquetes de viaje.

Analiza el documento proporcionado y extrae la siguiente informacion en formato JSON. Si no encuentras algun campo, usa un valor por defecto razonable.

Responde UNICAMENTE con un JSON valido (sin markdown, sin ```json), con esta estructura exacta:
{
  "title": "Nombre del paquete/tour",
  "short_description": "Descripcion corta en 1-2 lineas",
  "description": "Descripcion completa del paquete con detalles",
  "country": "Pais o destino principal",
  "price": 0,
  "member_price": 0,
  "duration_days": 1,
  "category": "paquete",
  "includes": ["item1", "item2"],
  "itinerary": [{"day": 1, "title": "Titulo del dia", "description": "Actividades del dia"}],
  "accommodation_type": "hotel",
  "difficulty": "facil",
  "min_group": 1,
  "max_group": 20,
  "rating": 4.8,
  "featured": false
}

Notas:
- "category" debe ser: "paquete", "alojamiento" o "experiencia"
- Los precios deben ser numeros sin simbolo de moneda
- "includes" es una lista de lo que incluye (transporte, hospedaje, comidas, etc)
- "itinerary" es el programa dia por dia. Cada item tiene day (numero), title y description
- "accommodation_type" puede ser: "hotel", "resort", "villa", "hostel", "camping", "airbnb" o vacio
- "difficulty" puede ser: "facil", "moderado", "dificil" o vacio
- "min_group" y "max_group" son el minimo y maximo de personas del grupo
- Si hay multiples paquetes, extrae solo el principal
- Si el precio no es claro, usa 0
- "member_price" es el precio especial para socios. Si no existe, dejalo en 0"""

@api_router.post("/packages/import-from-drive")
async def import_package_from_drive(request: Request):
    """Import a package from a Google Drive shared link using AI extraction."""
    user = await require_role("super_admin", "admin", permission="packages")(request)
    body = await request.json()
    drive_url = body.get("drive_url", "").strip()

    if not drive_url:
        raise HTTPException(status_code=400, detail="URL de Google Drive requerida")

    file_id = extract_gdrive_file_id(drive_url)
    if not file_id:
        raise HTTPException(status_code=400, detail="No se pudo extraer el ID del archivo de Google Drive. Verifica que el enlace sea correcto.")

    # Download file
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, f"gdrive_{file_id}")
    try:
        content_type = download_gdrive_file(file_id, tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al descargar archivo: asegurate de que el enlace sea publico/compartido. {str(e)}")

    mime = detect_mime_type(tmp_path, content_type)
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key no configurada")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"import-{file_id}-{uuid.uuid4().hex[:8]}",
            system_message=PACKAGE_EXTRACTION_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")

        # For images and PDFs, use Gemini file attachment
        if mime.startswith('image/') or mime == 'application/pdf':
            file_content = FileContentWithMimeType(file_path=tmp_path, mime_type=mime)
            msg = UserMessage(
                text="Analiza este documento y extrae la informacion del paquete turistico. Responde solo con JSON.",
                file_contents=[file_content]
            )
            response_text = await chat.send_message(msg)
        else:
            # For Word/Excel, extract text first then send to LLM
            if 'word' in mime or 'document' in mime:
                extracted_text = extract_text_from_docx(tmp_path)
            elif 'sheet' in mime or 'excel' in mime:
                extracted_text = extract_text_from_xlsx(tmp_path)
            else:
                # Try PDF as fallback
                try:
                    extracted_text = extract_text_from_pdf(tmp_path)
                except Exception:
                    extracted_text = ""

            if not extracted_text.strip():
                raise HTTPException(status_code=400, detail="No se pudo extraer texto del documento")

            msg = UserMessage(text=f"Analiza el siguiente contenido de un documento de tour/viaje y extrae la informacion del paquete turistico. Responde solo con JSON.\n\n---\n{extracted_text}")
            response_text = await chat.send_message(msg)

        # Parse JSON from response
        json_text = response_text.strip()
        if json_text.startswith("```"):
            json_text = json_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        package_data = json_module.loads(json_text)

        # Ensure required fields
        package_data.setdefault("title", "Paquete Importado")
        package_data.setdefault("description", "")
        package_data.setdefault("short_description", "")
        package_data.setdefault("country", "")
        package_data.setdefault("price", 0)
        package_data.setdefault("member_price", 0)
        package_data.setdefault("duration_days", 1)
        package_data.setdefault("category", "paquete")
        package_data.setdefault("includes", [])
        package_data.setdefault("itinerary", [])
        package_data.setdefault("accommodation_type", "")
        package_data.setdefault("difficulty", "")
        package_data.setdefault("min_group", 1)
        package_data.setdefault("max_group", 20)
        package_data.setdefault("rating", 4.8)
        package_data.setdefault("featured", False)
        package_data["price"] = float(package_data.get("price", 0) or 0)
        package_data["member_price"] = float(package_data.get("member_price", 0) or 0)
        package_data["duration_days"] = int(package_data.get("duration_days", 1) or 1)

        # Extract images from PDF and upload to gallery
        extracted_gallery = []
        if mime == 'application/pdf':
            try:
                extracted_gallery = extract_images_from_pdf(tmp_path)
                if extracted_gallery:
                    logger.info(f"Extracted {len(extracted_gallery)} images from PDF")
            except Exception as img_err:
                logger.warning(f"Image extraction from PDF failed: {img_err}")

        # For image files, the source itself becomes the gallery
        if mime.startswith('image/'):
            try:
                with open(tmp_path, 'rb') as f:
                    img_bytes = f.read()
                ext = mime.split('/')[-1]
                if ext == 'jpeg':
                    ext = 'jpg'
                storage_path = f"{APP_NAME}/gallery/{uuid.uuid4().hex}.{ext}"
                put_object(storage_path, img_bytes, mime)
                extracted_gallery = [f"/api/files/{storage_path}"]
            except Exception as img_err:
                logger.warning(f"Image upload failed: {img_err}")

        return {"extracted": package_data, "source_file_id": file_id, "mime_type": mime, "extracted_gallery": extracted_gallery}

    except json_module.JSONDecodeError:
        raise HTTPException(status_code=422, detail="El AI no pudo extraer datos estructurados del documento. Intenta con otro archivo.")
    except Exception as e:
        logger.error(f"Import error: {e}")
        raise HTTPException(status_code=500, detail=f"Error al procesar documento: {str(e)}")
    finally:
        # Cleanup temp files
        try:
            os.remove(tmp_path)
            os.rmdir(tmp_dir)
        except Exception:
            pass

# ── Quotations ──

@api_router.post("/quotations")
async def create_quotation(req: QuotationRequest):
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "pending"
    doc["id"] = str(uuid.uuid4())
    doc["public_token"] = secrets.token_urlsafe(16)
    doc["created_by_name"] = "Sistema (web pública)"
    doc["created_by_id"] = None
    # Fecha de vencimiento automática (config global o 10 días default)
    vdays = await _default_valid_days()
    doc["valid_until"] = (datetime.now(timezone.utc) + timedelta(days=vdays)).isoformat()
    doc["timeline"] = [{
        "event": "created",
        "label": "Cotización creada",
        "at": doc["created_at"],
        "note": "Solicitud recibida desde el sitio web" if not req.contract_number else "Solicitud recibida de socio"
    }]
    # Auto-detect member: match by contract_number, then email
    member = None
    if req.contract_number:
        member = await db.members.find_one({"contract_number": req.contract_number.strip()})
    if not member and req.email:
        member = await db.members.find_one({"email": req.email.strip().lower()})
    if member:
        doc["is_member"] = True
        doc["member_id"] = str(member["_id"])
        doc["member_name"] = member.get("name", "")
        doc["contract_number"] = member.get("contract_number", "")
    else:
        doc["is_member"] = False
        # Auto-register as client for the agency's CRM
        client_id = await _upsert_client(req.name, req.email, req.phone)
        if client_id:
            doc["client_id"] = client_id
    # Snapshot package info if a package was requested
    if req.package_id:
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(req.package_id)})
            if pkg:
                doc["package_title"] = pkg.get("title", "")
                doc["package_country"] = pkg.get("country", "")
                doc["package_duration_days"] = pkg.get("duration_days", 0)
                doc["unit_price"] = float(pkg.get("price", 0) or 0)
                doc["member_unit_price"] = float(pkg.get("member_price", 0) or 0)
                applied_price = doc["member_unit_price"] if (doc["is_member"] and doc["member_unit_price"] > 0) else doc["unit_price"]
                doc["total"] = round(applied_price * (req.guests or 1), 2)
        except Exception:
            pass
    result = await db.quotations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize_doc(doc)

@api_router.get("/quotations")
async def list_quotations(
    request: Request,
    sort: Optional[str] = "desc",
    created_by: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    user = await get_current_user(request)
    if user["role"] in ["super_admin", "admin"]:
        query = {}
        if created_by:
            if created_by == "system":
                query["created_by_id"] = None
            else:
                query["created_by_id"] = created_by
        if status:
            query["status"] = status
        if date_from or date_to:
            date_query = {}
            if date_from: date_query["$gte"] = date_from
            if date_to: date_query["$lte"] = date_to + "T23:59:59"
            query["created_at"] = date_query
        sort_dir = 1 if sort == "asc" else -1
        quotations = []
        async for q in db.quotations.find(query).sort("created_at", sort_dir).limit(500):
            quotations.append(serialize_doc(q))
        return quotations
    elif user["role"] == "member":
        member = await db.members.find_one({"_id": ObjectId(user.get("member_id", ""))})
        if not member:
            return []
        quotations = []
        async for q in db.quotations.find({"contract_number": member["contract_number"]}).sort("created_at", -1).limit(50):
            quotations.append(serialize_doc(q))
        return quotations
    return []

@api_router.post("/quotations/admin")
async def create_quotation_as_admin(request: Request):
    """Admin creates a quotation for an existing socio, existing client, or a new client."""
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    phone = (body.get("phone") or "").strip()
    member_id = body.get("member_id") or ""
    client_id = body.get("client_id") or ""
    package_id = body.get("package_id") or ""
    guests = int(body.get("guests") or 1)
    travel_date = body.get("travel_date") or ""
    message = body.get("message") or ""
    valid_until_override = (body.get("valid_until") or "").strip()

    vdays = await _default_valid_days()
    computed_valid_until = (datetime.now(timezone.utc) + timedelta(days=vdays)).isoformat()

    doc = {
        "name": name, "email": email, "phone": phone,
        "guests": guests, "travel_date": travel_date, "message": message,
        "package_id": package_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by_name": user.get("name", "Admin"),
        "created_by_id": user.get("_id"),
        "status": "in_review",
        "id": str(uuid.uuid4()),
        "public_token": secrets.token_urlsafe(16),
        "is_member": False,
        "valid_until": valid_until_override or computed_valid_until,
        "timeline": [{
            "event": "created",
            "label": f"Cotización creada por {user.get('name','Admin')}",
            "at": datetime.now(timezone.utc).isoformat(),
            "by": user.get("name", "Admin"),
        }],
    }

    # Resolve member or client
    if member_id:
        member = await db.members.find_one({"_id": ObjectId(member_id)})
        if member:
            doc["is_member"] = True
            doc["member_id"] = str(member["_id"])
            doc["member_name"] = member.get("name", "")
            doc["contract_number"] = member.get("contract_number", "")
            if not doc["name"]: doc["name"] = member.get("name", "")
            if not doc["email"]: doc["email"] = member.get("email", "")
            if not doc["phone"]: doc["phone"] = member.get("phone", "")
    elif client_id:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
        if client:
            doc["client_id"] = str(client["_id"])
            if not doc["name"]: doc["name"] = client.get("name", "")
            if not doc["email"]: doc["email"] = client.get("email", "")
            if not doc["phone"]: doc["phone"] = client.get("phone", "")
    else:
        # No member or client selected: auto-register a new client with the provided data
        new_id = await _upsert_client(doc["name"], doc["email"], doc["phone"])
        if new_id:
            doc["client_id"] = new_id

    # Package snapshot
    if package_id:
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
            if pkg:
                doc["package_title"] = pkg.get("title", "")
                doc["package_country"] = pkg.get("country", "")
                doc["package_duration_days"] = pkg.get("duration_days", 0)
                doc["unit_price"] = float(pkg.get("price", 0) or 0)
                doc["member_unit_price"] = float(pkg.get("member_price", 0) or 0)
                applied_price = doc["member_unit_price"] if (doc["is_member"] and doc["member_unit_price"] > 0) else doc["unit_price"]
                doc["total"] = round(applied_price * guests, 2)
        except Exception:
            pass

    result = await db.quotations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return serialize_doc(doc)

@api_router.put("/quotations/{quotation_id}")
async def update_quotation(quotation_id: str, request: Request):
    """Admin-only: edit a quotation (pricing, travel date, extras, status, notes)."""
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    q = await db.quotations.find_one({"_id": ObjectId(quotation_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    ALLOWED = {
        "status", "travel_date", "guests", "unit_price", "member_unit_price", "total",
        "discount", "extras", "internal_notes", "customer_notes", "package_id",
        "package_title", "package_country", "package_duration_days", "response", "response_html",
        "valid_until",
    }
    updates = {k: v for k, v in body.items() if k in ALLOWED}
    if "package_id" in updates and updates["package_id"]:
        try:
            pkg = await db.packages.find_one({"_id": ObjectId(updates["package_id"])})
            if pkg:
                updates["package_title"] = pkg.get("title", "")
                updates["package_country"] = pkg.get("country", "")
                updates["package_duration_days"] = pkg.get("duration_days", 0)
        except Exception:
            pass
    # Timeline
    timeline = q.get("timeline", []) or []
    status_changed = "status" in updates and updates["status"] != q.get("status")
    if status_changed:
        status_labels = {
            "pending": "Pendiente", "in_review": "En revisión", "sent": "Enviada al cliente",
            "approved": "Aprobada", "rejected": "Rechazada", "closed": "Cerrada",
        }
        timeline.append({
            "event": "status_change",
            "label": f"Estado cambiado a {status_labels.get(updates['status'], updates['status'])}",
            "at": datetime.now(timezone.utc).isoformat(),
            "by": user.get("name", "Admin"),
        })
    else:
        timeline.append({
            "event": "updated",
            "label": "Cotización editada",
            "at": datetime.now(timezone.utc).isoformat(),
            "by": user.get("name", "Admin"),
        })
    updates["timeline"] = timeline
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.quotations.update_one({"_id": ObjectId(quotation_id)}, {"$set": updates})
    q2 = await db.quotations.find_one({"_id": ObjectId(quotation_id)})
    return serialize_doc(q2)

@api_router.post("/quotations/{quotation_id}/timeline")
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
        {"$push": {"timeline": entry}}
    )
    return entry

@api_router.put("/quotations/{quotation_id}/respond")
async def respond_quotation(quotation_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="quotations")(request)
    body = await request.json()
    await db.quotations.update_one(
        {"_id": ObjectId(quotation_id)},
        {"$set": {"response": body.get("response", ""), "response_html": body.get("response_html", ""), "status": "sent", "responded_at": datetime.now(timezone.utc).isoformat(), "responded_by": user["_id"]}}
    )
    return {"message": "Cotización respondida"}

@api_router.get("/quotations/public/{token}")
async def get_public_quotation(token: str):
    """Public view of a quotation via the share link. No auth required."""
    q = await db.quotations.find_one({"public_token": token})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    # Mark as viewed the first time
    if not q.get("viewed_at"):
        await db.quotations.update_one(
            {"_id": q["_id"]},
            {"$set": {"viewed_at": datetime.now(timezone.utc).isoformat()},
             "$push": {"timeline": {
                "event": "viewed",
                "label": "Vista por el cliente",
                "at": datetime.now(timezone.utc).isoformat(),
             }}}
        )
    return serialize_doc(q)

@api_router.post("/quotations/public/{token}/decision")
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
        {"$set": {"status": decision, f"{decision}_at": datetime.now(timezone.utc).isoformat()},
         "$push": {"timeline": {
            "event": f"customer_{decision}",
            "label": status_label,
            "at": datetime.now(timezone.utc).isoformat(),
         }}}
    )
    # Notify admins via push (non-blocking)
    try:
        emoji = "✅" if decision == "approved" else "❌"
        await _send_push_raw(
            title=f"{emoji} Cotización {status_label.lower()}",
            message=f"{q.get('name','Cliente')} {('aceptó' if decision == 'approved' else 'rechazó')} la cotización {q.get('package_title') or ''}".strip(),
            link="/admin",
        )
    except Exception:
        pass
    return {"status": decision}

async def _upsert_client(name: str, email: str = "", phone: str = "") -> Optional[str]:
    """Create a client record if not already present (matched by email, then phone). Returns client_id string."""
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
    user = await require_role("super_admin", "admin", permission="announcements")(request)
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
    user = await require_role("super_admin", "admin", permission="requests")(request)
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
    user = await require_role("super_admin", "admin", permission="settings")(request)
    await db.config.update_one({"key": "whatsapp"}, {"$set": {"key": "whatsapp", "phone": req.phone}}, upsert=True)
    return {"message": "Configuración actualizada", "phone": req.phone}

# ── Quotation Settings (payment WhatsApp + default validity days) ──

class QuotationSettings(BaseModel):
    payment_whatsapp: str = ""
    default_valid_days: int = 10

@api_router.get("/config/quotation-settings")
async def get_quotation_settings():
    cfg = await db.config.find_one({"key": "quotation_settings"})
    if cfg:
        return {
            "payment_whatsapp": cfg.get("payment_whatsapp", ""),
            "default_valid_days": int(cfg.get("default_valid_days", 10) or 10),
        }
    return {"payment_whatsapp": "", "default_valid_days": 10}

@api_router.put("/config/quotation-settings")
async def set_quotation_settings(req: QuotationSettings, request: Request):
    await require_role("super_admin", "admin", permission="settings")(request)
    days = max(1, int(req.default_valid_days or 10))
    await db.config.update_one(
        {"key": "quotation_settings"},
        {"$set": {"key": "quotation_settings", "payment_whatsapp": (req.payment_whatsapp or "").strip(), "default_valid_days": days}},
        upsert=True,
    )
    return {"message": "Configuración de cotizaciones actualizada", "payment_whatsapp": req.payment_whatsapp, "default_valid_days": days}

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
    user = await require_role("super_admin", "admin", permission="packages")(request)
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

async def _default_valid_days() -> int:
    cfg = await db.config.find_one({"key": "quotation_settings"})
    try:
        return max(1, int((cfg or {}).get("default_valid_days", 10) or 10))
    except Exception:
        return 10

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
        if name in seen: continue
        seen.add(name)
        merged.append({
            "name": name,
            "icon": user_cats.get(name, DEFAULT_CATEGORY_ICONS.get(name, "🏷️")),
            "system": True,
        })
    for name, icon in user_cats.items():
        if name in seen: continue
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

@api_router.put("/commerce/categories/{name}")
async def update_commerce_category(name: str, request: Request):
    await require_role("super_admin", "admin", permission="categories")(request)
    body = await request.json()
    new_name = (body.get("name") or name).strip()
    icon = (body.get("icon") or "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Nombre requerido")
    # If renaming, ensure no collision
    if new_name != name:
        if new_name in COMMERCE_CATEGORIES:
            raise HTTPException(status_code=400, detail="Nombre ya existe como categoría del sistema")
        existing = await db.commerce_categories.find_one({"name": new_name})
        if existing:
            raise HTTPException(status_code=400, detail="Nombre ya existe")
    if name in COMMERCE_CATEGORIES:
        if new_name != name:
            raise HTTPException(status_code=400, detail="No se puede renombrar una categoría del sistema, solo cambiar el icono")
        # For system categories, upsert an override record (keeps legacy name list intact)
        await db.commerce_categories.update_one(
            {"name": name},
            {"$set": {"name": name, "icon": icon or DEFAULT_CATEGORY_ICONS.get(name, "🏷️")}},
            upsert=True,
        )
        return {"name": name, "icon": icon or DEFAULT_CATEGORY_ICONS.get(name, "🏷️")}
    # Custom category
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
async def list_commerce(category: Optional[str] = None, search: Optional[str] = None, status: Optional[str] = None, request: Request = None):
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
    else:
        query = {"status": "active"}
    if category:
        query["category"] = category
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
    # Only broadcast "new commerce" to members once the commerce is active (direct admin creation).
    if doc["status"] == "active":
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
    user = await require_role("super_admin", "admin", permission="commerce")(request)
    await verify_delete_code(request)
    await db.commerce.update_one({"_id": ObjectId(commerce_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Comercio eliminado"}

# ── Commerce Promotions ──

@api_router.get("/commerce/{commerce_id}/promotions")
async def list_commerce_promotions(commerce_id: str):
    promos = []
    now = datetime.now(timezone.utc).isoformat()
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
    user = await require_role("super_admin", "admin")(request)
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
    async for r in db.regalias.find(query).sort("created_at", -1):
        regalias.append(serialize_doc(r))
    return regalias

@api_router.put("/members/{member_id}/regalias")
async def assign_regalias_to_member(member_id: str, request: Request):
    """Bulk update which regalias belong to this socio. Body: { regalia_ids: [...] }."""
    user = await require_role("super_admin", "admin", permission="members")(request)
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
    user = await require_role("super_admin", "admin", permission="regalias")(request)
    reg = await db.regalias.find_one({"_id": ObjectId(regalia_id)})
    if not reg:
        raise HTTPException(status_code=404, detail="Regalia no encontrada")
    new_used = not reg.get("used", False)
    await db.regalias.update_one({"_id": ObjectId(regalia_id)}, {"$set": {"used": new_used}})
    return {"used": new_used}

@api_router.delete("/regalias/{regalia_id}")
async def delete_regalia(regalia_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="regalias")(request)
    await verify_delete_code(request)
    await db.regalias.update_one({"_id": ObjectId(regalia_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Regalia eliminada"}

# ── Clubs Vacacionales ──

@api_router.post("/clubs")
async def create_club(request: Request):
    user = await require_role("super_admin", "admin", permission="clubs")(request)
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
    user = await require_role("super_admin", "admin", permission="clubs")(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k != "_id"}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.vacation_clubs.update_one({"_id": ObjectId(club_id)}, {"$set": update_data})
    updated = await db.vacation_clubs.find_one({"_id": ObjectId(club_id)})
    return serialize_doc(updated)

@api_router.delete("/clubs/{club_id}")
async def delete_club(club_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="clubs")(request)
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
    family = []
    async for f in db.family_members.find({"member_id": member_id}).limit(20):
        family.append(serialize_doc(f))
    return family

@api_router.post("/members/{member_id}/family")
async def add_family_member(member_id: str, req: FamilyMemberCreate, request: Request):
    user = await get_current_user(request)
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    if user["role"] not in ["super_admin", "admin"] and user.get("member_id") != member_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    current_count = await db.family_members.count_documents({"member_id": member_id})
    allowed = member.get("family_members_allowed", 1)
    if current_count >= allowed:
        raise HTTPException(status_code=400, detail=f"Límite de {allowed} familiares alcanzado")
    existing = await db.family_members.find_one({"member_id": member_id, "dpi": req.dpi})
    if existing:
        raise HTTPException(status_code=400, detail="Este DPI ya está registrado")
    doc = req.model_dump()
    doc["member_id"] = member_id
    doc["contract_number"] = member["contract_number"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.family_members.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.delete("/members/{member_id}/family/{family_id}")
async def remove_family_member(member_id: str, family_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["super_admin", "admin"] and user.get("member_id") != member_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    await verify_delete_code(request)
    result = await db.family_members.delete_one({"_id": ObjectId(family_id), "member_id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    return {"message": "Familiar eliminado"}

# ── Quotation Sharing ──

@api_router.get("/quotations/{quotation_id}/share")
async def get_quotation_share(quotation_id: str, request: Request):
    q = await db.quotations.find_one({"_id": ObjectId(quotation_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    q_data = serialize_doc(q)
    whatsapp_config = await db.config.find_one({"key": "whatsapp"})
    wa_phone = whatsapp_config.get("phone", "") if whatsapp_config else ""
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
    from urllib.parse import quote as url_quote
    wa_url = f"https://wa.me/{clean_phone}?text={url_quote(share_text)}" if clean_phone else ""
    mailto_url = f"mailto:{q_data.get('email', '')}?subject={url_quote(email_subject)}&body={url_quote(response_text)}"
    return {
        "quotation": q_data,
        "whatsapp_url": wa_url,
        "mailto_url": mailto_url,
        "email_subject": email_subject,
        "email_body": q_data.get("response_html", f"<p>{response_text}</p>"),
        "share_text": share_text
    }

# ── Stats & Analytics ──

@api_router.get("/stats")
async def get_stats(request: Request):
    user = await require_role("super_admin", "admin")(request)
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
    user = await require_role("super_admin", "admin")(request)
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
    user = await require_role("super_admin", "admin")(request)
    referrals = []
    async for r in db.referrals.find().sort("created_at", -1).limit(200):
        referrals.append(serialize_doc(r))
    return referrals

@api_router.put("/referrals/{ref_id}/status")
async def update_referral_status(ref_id: str, request: Request):
    user = await require_role("super_admin", "admin", permission="referrals")(request)
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
    user = await require_role("super_admin", "admin")(request)
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
    user = await require_role("super_admin")(request)
    users = []
    async for u in db.users.find({"role": {"$in": ["super_admin", "admin"]}}).sort("created_at", -1).limit(100):
        u_doc = serialize_doc(u)
        u_doc.pop("password_hash", None)
        users.append(u_doc)
    return users

@api_router.get("/admin/all-users")
async def list_all_users(request: Request):
    user = await require_role("super_admin", "admin")(request)
    users = []
    async for u in db.users.find().sort("created_at", -1).limit(500):
        u_doc = serialize_doc(u)
        u_doc.pop("password_hash", None)
        users.append(u_doc)
    return users

FEATURE_KEYS = [
    "dashboard", "members", "clients", "packages", "commerce", "categories",
    "clubs", "regalias", "quotations", "analytics", "announcements",
    "push", "import", "referrals", "requests", "users", "settings",
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
    if str(user.get("_id")) == user_id and target.get("is_active", True) is True:
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
    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: super_admin\n\n## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/member-login\n- GET /api/auth/me\n- POST /api/auth/logout\n")

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
            f.write(f"\n## Member (Socio)\n- Contract: KT-001\n- DPI: 1234567890101\n- Name: Juan Pérez García\n")

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

def _parse_uploaded_rows(file_bytes: bytes, filename: str, columns):
    """Parse CSV/XLSX and map the header labels to field keys. Returns list[dict]."""
    # Build a label->key map (accept both the label and the raw key)
    label_to_key = {}
    for key, label, _r, _ex in columns:
        label_to_key[label.strip().lower()] = key
        label_to_key[label.replace("*", "").strip().lower()] = key
        label_to_key[key.lower()] = key
    rows = []
    fn = (filename or "").lower()
    if fn.endswith(".csv"):
        text = file_bytes.decode("utf-8-sig", errors="ignore")
        reader = _csv.reader(_io.StringIO(text))
        data = list(reader)
        if not data:
            return []
        header = [h.strip().lower() for h in data[0]]
        for raw in data[1:]:
            if not any((v or "").strip() for v in raw):
                continue
            row = {}
            for i, value in enumerate(raw):
                if i >= len(header):
                    break
                key = label_to_key.get(header[i])
                if key is not None:
                    row[key] = (value or "").strip()
            rows.append(row)
    else:
        wb = _load_workbook(_io.BytesIO(file_bytes), read_only=True, data_only=True)
        ws = wb.active
        header_row = None
        for row in ws.iter_rows(values_only=True):
            header_row = [(str(h).strip().lower() if h is not None else "") for h in row]
            break
        if header_row is None:
            return []
        for raw in ws.iter_rows(min_row=2, values_only=True):
            if not any((v is not None and str(v).strip() != "") for v in raw):
                continue
            row = {}
            for i, value in enumerate(raw):
                if i >= len(header_row):
                    break
                key = label_to_key.get(header_row[i])
                if key is not None:
                    row[key] = value
            rows.append(row)
    return rows

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

@app.post("/api/admin/members/bulk-import")
async def members_bulk_import(request: Request, file: UploadFile = File(...), dry_run: bool = Query(False)):
    user = await require_role("super_admin", "admin")(request)
    content = await file.read()
    try:
        rows = _parse_uploaded_rows(content, file.filename or "", MEMBER_TEMPLATE_COLS)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {e}")

    created, errors, preview = [], [], []
    num_fields = {"service_years": int, "age": int, "family_members_allowed": int, "investment_amount": float}
    existing_contracts = set()
    existing_dpis = set()
    if not dry_run:
        # Pull only to avoid heavy concurrent duplicates inside the batch
        async for m in db.members.find({}, {"contract_number": 1, "dpi": 1}):
            if m.get("contract_number"):
                existing_contracts.add(m["contract_number"])
            if m.get("dpi"):
                existing_dpis.add(m["dpi"])
    else:
        async for m in db.members.find({}, {"contract_number": 1, "dpi": 1}):
            if m.get("contract_number"):
                existing_contracts.add(m["contract_number"])

    for idx, row in enumerate(rows, start=2):  # row 1 is header
        contract = str(row.get("contract_number") or "").strip()
        name = str(row.get("name") or "").strip()
        dpi = str(row.get("dpi") or "").strip()
        if not contract or not name or not dpi:
            errors.append({"row": idx, "error": "Faltan campos obligatorios (contract_number, name, dpi)"})
            continue
        if contract in existing_contracts:
            errors.append({"row": idx, "contract_number": contract, "error": "El número de contrato ya existe"})
            continue
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
            else:
                doc[key] = str(val).strip() if not isinstance(val, (int, float)) else val
        preview.append({"row": idx, **doc})
        existing_contracts.add(contract)
        if not dry_run:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            doc["created_by"] = user["_id"]
            try:
                result = await db.members.insert_one(doc)
                new_id = str(result.inserted_id)
                # Auto-create user login (same logic as single-member create)
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
                created.append({"row": idx, "id": new_id, "contract_number": contract})
            except Exception as e:
                errors.append({"row": idx, "contract_number": contract, "error": str(e)})
    return {"total_rows": len(rows), "valid": len(preview), "errors": errors, "created": created if not dry_run else [], "preview": preview if dry_run else []}

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
