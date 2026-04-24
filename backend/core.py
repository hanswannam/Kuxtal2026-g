"""Shared core utilities used by server.py and all /app/backend/routers/* modules.

This module centralises:
    - MongoDB client and db handle
    - JWT/session helpers (create/decode tokens, cookie config)
    - Auth dependencies (get_current_user, require_role)
    - Delete-secret verification
    - Serialization helpers
    - Object-storage helpers
    - Shared constants (cookie flags, storage URL, app name, VAPID keys)

It must NOT import FastAPI routers or define HTTP routes.
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId


# ── MongoDB ───────────────────────────────────────────────────────────────
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


# ── Constants ────────────────────────────────────────────────────────────
JWT_ALGORITHM = "HS256"
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "kuxtal-travel"

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "").replace("\\n", "\n")
VAPID_EMAIL = os.environ.get("VAPID_EMAIL", "mailto:info@kuxtaltravels.com")

COOKIE_SECURE = os.environ.get("FRONTEND_URL", "").startswith("https")
COOKIE_SAMESITE = "none" if COOKIE_SECURE else "lax"

DELETE_SECRET = os.environ.get("DELETE_SECRET", "BORRAR YA")


# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("kuxtal")


# ── Passwords ────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT ──────────────────────────────────────────────────────────────────
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    """Set access + refresh tokens as HttpOnly cookies with the correct SameSite flag."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=86400,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=604800,
        path="/",
    )


# ── Auth dependencies ────────────────────────────────────────────────────
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


def require_role(*roles, permission: Optional[str] = None):
    async def checker(request: Request):
        user = await get_current_user(request)
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Acceso denegado")
        # Per-module permission enforcement for non-super_admin roles.
        if permission and user.get("role") != "super_admin":
            perms = user.get("permissions") or {}
            if not perms.get(permission):
                raise HTTPException(status_code=403, detail=f"No tienes permiso para '{permission}'")
        return user
    return checker


# ── Helpers ──────────────────────────────────────────────────────────────
def serialize_doc(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


async def verify_delete_code(request: Request):
    """Verify the delete confirmation code (query param or JSON body)."""
    code = request.query_params.get("delete_code", "")
    if not code:
        try:
            body = await request.json()
            code = body.get("delete_code", "")
        except Exception:
            pass
    if code != DELETE_SECRET:
        raise HTTPException(
            status_code=403,
            detail="Clave de eliminación incorrecta. Ingresa la clave secreta para eliminar.",
        )


# ── Object Storage ───────────────────────────────────────────────────────
_storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30,
        )
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
