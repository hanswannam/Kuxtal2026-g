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
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")

def require_role(*roles):
    async def checker(request: Request):
        user = await get_current_user(request)
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Acceso denegado")
        return user
    return checker

def serialize_doc(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

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
    status: str = "active"

class PackageCreate(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = ""
    country: str
    price: float
    member_price: Optional[float] = 0
    duration_days: int
    category: str = "paquete"
    includes: List[str] = []
    rating: float = 4.8
    image_url: Optional[str] = ""
    gallery: List[str] = []
    featured: bool = False
    status: str = "active"

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
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "name": user.get("name", ""), "email": user["email"], "role": user["role"], "token": access_token}

@api_router.post("/auth/member-login")
async def member_login(req: MemberLoginRequest, response: Response):
    member = await db.members.find_one({"contract_number": req.contract_number.strip()})
    if not member:
        raise HTTPException(status_code=401, detail="Número de contrato no encontrado")
    if member.get("dpi", "") != req.dpi.strip():
        raise HTTPException(status_code=401, detail="DPI incorrecto")
    if member.get("status") != "active":
        raise HTTPException(status_code=403, detail="Membresía inactiva")
    user = await db.users.find_one({"member_id": str(member["_id"])})
    if not user:
        user_doc = {
            "email": member.get("email", f"{req.contract_number}@kuxtal.member"),
            "password_hash": hash_password(req.dpi),
            "name": member["name"],
            "role": "member",
            "member_id": str(member["_id"]),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
    access_token = create_access_token(user_id, "member")
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    member_data = serialize_doc(member)
    return {"id": user_id, "name": member["name"], "role": "member", "contract_number": req.contract_number, "member": member_data, "token": access_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if user.get("role") == "member" and user.get("member_id"):
        member = await db.members.find_one({"_id": ObjectId(user["member_id"])})
        if member:
            user["member"] = serialize_doc(member)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Sesión cerrada"}

# ── Members CRUD (Admin) ──

@api_router.get("/members")
async def list_members(request: Request):
    user = await require_role("super_admin", "admin")(request)
    members = await db.members.find({}, {"_id": 0, "id": {"$toString": "$_id"}}).to_list(1000)
    # Manual serialization
    members_list = []
    async for m in db.members.find():
        members_list.append(serialize_doc(m))
    return members_list

@api_router.post("/members")
async def create_member(req: MemberCreate, request: Request):
    user = await require_role("super_admin", "admin")(request)
    existing = await db.members.find_one({"contract_number": req.contract_number})
    if existing:
        raise HTTPException(status_code=400, detail="Número de contrato ya existe")
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.members.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.put("/members/{member_id}")
async def update_member(member_id: str, req: MemberCreate, request: Request):
    user = await require_role("super_admin", "admin")(request)
    update_data = req.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.members.update_one({"_id": ObjectId(member_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    updated = await db.members.find_one({"_id": ObjectId(member_id)})
    return serialize_doc(updated)

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, request: Request):
    user = await require_role("super_admin", "admin")(request)
    result = await db.members.delete_one({"_id": ObjectId(member_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return {"message": "Socio eliminado"}

# ── Packages CRUD ──

@api_router.get("/packages")
async def list_packages(category: Optional[str] = None, country: Optional[str] = None, search: Optional[str] = None, featured: Optional[bool] = None):
    query = {"status": "active"}
    if category:
        query["category"] = category
    if country:
        query["country"] = {"$regex": country, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"country": {"$regex": search, "$options": "i"}}
        ]
    if featured is not None:
        query["featured"] = featured
    packages = []
    async for p in db.packages.find(query).sort("created_at", -1):
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
    user = await require_role("super_admin", "admin")(request)
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.packages.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.put("/packages/{package_id}")
async def update_package(package_id: str, req: PackageCreate, request: Request):
    user = await require_role("super_admin", "admin")(request)
    update_data = req.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.packages.update_one({"_id": ObjectId(package_id)}, {"$set": update_data})
    updated = await db.packages.find_one({"_id": ObjectId(package_id)})
    return serialize_doc(updated)

@api_router.delete("/packages/{package_id}")
async def delete_package(package_id: str, request: Request):
    user = await require_role("super_admin", "admin")(request)
    await db.packages.update_one({"_id": ObjectId(package_id)}, {"$set": {"status": "inactive"}})
    return {"message": "Paquete eliminado"}

# ── Quotations ──

@api_router.post("/quotations")
async def create_quotation(req: QuotationRequest):
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "pending"
    doc["id"] = str(uuid.uuid4())
    result = await db.quotations.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/quotations")
async def list_quotations(request: Request):
    user = await get_current_user(request)
    if user["role"] in ["super_admin", "admin"]:
        quotations = []
        async for q in db.quotations.find().sort("created_at", -1):
            quotations.append(serialize_doc(q))
        return quotations
    elif user["role"] == "member":
        member = await db.members.find_one({"_id": ObjectId(user.get("member_id", ""))})
        if not member:
            return []
        quotations = []
        async for q in db.quotations.find({"contract_number": member["contract_number"]}).sort("created_at", -1):
            quotations.append(serialize_doc(q))
        return quotations
    return []

@api_router.put("/quotations/{quotation_id}/respond")
async def respond_quotation(quotation_id: str, request: Request):
    user = await require_role("super_admin", "admin")(request)
    body = await request.json()
    await db.quotations.update_one(
        {"_id": ObjectId(quotation_id)},
        {"$set": {"response": body.get("response", ""), "response_html": body.get("response_html", ""), "status": "responded", "responded_at": datetime.now(timezone.utc).isoformat(), "responded_by": user["_id"]}}
    )
    return {"message": "Cotización respondida"}

# ── Announcements ──

@api_router.get("/announcements")
async def list_announcements(target: Optional[str] = None):
    query = {"status": "active"}
    if target:
        query["$or"] = [{"target": target}, {"target": "all"}]
    announcements = []
    async for a in db.announcements.find(query).sort("created_at", -1):
        announcements.append(serialize_doc(a))
    return announcements

@api_router.post("/announcements")
async def create_announcement(req: AnnouncementCreate, request: Request):
    user = await require_role("super_admin", "admin")(request)
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.announcements.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.delete("/announcements/{ann_id}")
async def delete_announcement(ann_id: str, request: Request):
    user = await require_role("super_admin", "admin")(request)
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
        async for r in db.vacation_requests.find().sort("created_at", -1):
            reqs.append(serialize_doc(r))
        return reqs
    else:
        reqs = []
        async for r in db.vacation_requests.find({"user_id": user["_id"]}).sort("created_at", -1):
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
    user = await require_role("super_admin", "admin")(request)
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
    user = await require_role("super_admin", "admin")(request)
    await db.config.update_one({"key": "whatsapp"}, {"$set": {"key": "whatsapp", "phone": req.phone}}, upsert=True)
    return {"message": "Configuración actualizada", "phone": req.phone}

# ── File Upload ──

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ── Stats ──

@api_router.get("/stats")
async def get_stats(request: Request):
    user = await require_role("super_admin", "admin")(request)
    total_members = await db.members.count_documents({})
    active_members = await db.members.count_documents({"status": "active"})
    total_packages = await db.packages.count_documents({"status": "active"})
    pending_quotations = await db.quotations.count_documents({"status": "pending"})
    pending_requests = await db.vacation_requests.count_documents({"status": "pending"})
    total_announcements = await db.announcements.count_documents({"status": "active"})
    return {
        "total_members": total_members,
        "active_members": active_members,
        "total_packages": total_packages,
        "pending_quotations": pending_quotations,
        "pending_requests": pending_requests,
        "total_announcements": total_announcements
    }

# ── Countries list ──

@api_router.get("/countries")
async def list_countries():
    countries = await db.packages.distinct("country", {"status": "active"})
    return countries

# ── Admin Users CRUD ──

@api_router.post("/admin/users")
async def create_admin_user(request: Request):
    user = await require_role("super_admin")(request)
    body = await request.json()
    existing = await db.users.find_one({"email": body["email"].lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    doc = {
        "email": body["email"].lower().strip(),
        "password_hash": hash_password(body["password"]),
        "name": body.get("name", ""),
        "role": body.get("role", "admin"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(doc)
    return {"id": str(result.inserted_id), "email": doc["email"], "name": doc["name"], "role": doc["role"]}

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
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await db.users.create_index("email", unique=True)
    await db.members.create_index("contract_number", unique=True)
    logger.info("Kuxtal Travel API started")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
