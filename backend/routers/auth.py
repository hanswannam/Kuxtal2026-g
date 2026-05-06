"""Authentication routes: admin + member login, logout, session check."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from bson import ObjectId

from core import (
    db,
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    get_current_user,
    serialize_doc,
)

router = APIRouter(prefix="/api/auth")


# ── Models ────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class MemberLoginRequest(BaseModel):
    contract_number: str
    dpi: str


# ── Routes ────────────────────────────────────────────────────────────
@router.post("/login")
async def admin_login(req: LoginRequest, response: Response):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["role"])
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {
        "id": user_id,
        "name": user.get("name", ""),
        "email": user["email"],
        "role": user["role"],
        "permissions": user.get("permissions"),
        "token": access_token,
    }


async def _resolve_member_auth(req: MemberLoginRequest):
    """Return (member, is_family, family_doc_or_None) or raise 401 if credentials are wrong."""
    member = await db.members.find_one({"contract_number": req.contract_number.strip()})
    if not member:
        raise HTTPException(status_code=401, detail="Número de contrato no encontrado")

    if member.get("dpi", "") == req.dpi.strip():
        return member, False, None

    family_doc = await db.family_members.find_one({
        "contract_number": req.contract_number.strip(),
        "dpi": req.dpi.strip(),
    })
    if family_doc:
        return member, True, family_doc
    raise HTTPException(status_code=401, detail="DPI incorrecto")


async def _find_or_create_member_user(
    member: dict,
    req: MemberLoginRequest,
    is_family: bool,
    login_name: str,
) -> str:
    """Return the user id for a member login, creating the user row on first login."""
    member_id = str(member["_id"])
    if is_family:
        user = await db.users.find_one({"member_id": member_id, "family_dpi": req.dpi.strip()})
    else:
        user = await db.users.find_one({
            "member_id": member_id,
            "$or": [{"family_dpi": None}, {"family_dpi": {"$exists": False}}],
        })
    if user:
        return str(user["_id"])

    email_suffix = f"_{req.dpi.strip()[-4:]}" if is_family else ""
    user_doc = {
        "email": f"{req.contract_number}{email_suffix}@kuxtal.member",
        "password_hash": hash_password(req.dpi),
        "name": login_name,
        "role": "member",
        "member_id": member_id,
        "is_family_member": is_family,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if is_family:
        user_doc["family_dpi"] = req.dpi.strip()
    result = await db.users.insert_one(user_doc)
    return str(result.inserted_id)


@router.post("/member-login")
async def member_login(req: MemberLoginRequest, response: Response):
    member, is_family, family_doc = await _resolve_member_auth(req)
    if member.get("status") != "active":
        raise HTTPException(status_code=403, detail="Membresía inactiva")

    login_name = family_doc["name"] if is_family else member["name"]
    user_id = await _find_or_create_member_user(member, req, is_family, login_name)

    access_token = create_access_token(user_id, "member")
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {
        "id": user_id,
        "name": login_name,
        "role": "member",
        "contract_number": req.contract_number,
        "member": serialize_doc(member),
        "is_family_member": is_family,
        "token": access_token,
    }


@router.get("/me")
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


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Sesión cerrada"}


# ── Impersonation (admin only) ─────────────────────────────────────────
async def _require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Solo administradores")
    return user


@router.post("/impersonate/member/{member_id}")
async def impersonate_member(member_id: str, request: Request, response: Response):
    """Return an access token to enter a member's portal as that member (admin only)."""
    await _require_admin(request)
    try:
        member = await db.members.find_one({"_id": ObjectId(member_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    if not member:
        raise HTTPException(status_code=404, detail="Socio no encontrado")

    mid = str(member["_id"])
    # Find the primary member user (no family_dpi). Create if missing (first time).
    user = await db.users.find_one({
        "member_id": mid,
        "$or": [{"family_dpi": None}, {"family_dpi": {"$exists": False}}],
    })
    if not user:
        user_doc = {
            "email": f"{member['contract_number']}@kuxtal.member",
            "password_hash": hash_password(member.get("dpi", "00000000")),
            "name": member.get("name", ""),
            "role": "member",
            "member_id": mid,
            "is_family_member": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])

    access_token = create_access_token(user_id, "member")
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {
        "token": access_token,
        "refresh_token": refresh_token,
        "id": user_id,
        "name": member.get("name", ""),
        "role": "member",
        "contract_number": member.get("contract_number"),
        "member": serialize_doc(member),
        "redirect": "/member",
    }


@router.post("/impersonate/commerce/{commerce_id}")
async def impersonate_commerce(commerce_id: str, request: Request, response: Response):
    """Return an access token to enter a commerce portal as that commerce (admin only)."""
    await _require_admin(request)
    try:
        commerce = await db.commerce.find_one({"_id": ObjectId(commerce_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    if not commerce:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    cid = str(commerce["_id"])
    user = await db.users.find_one({"commerce_id": cid, "role": "commerce"})
    if not user:
        email = f"commerce_{cid}@kuxtal.commerce"
        user_doc = {
            "email": email,
            "password_hash": hash_password(commerce.get("validation_code") or "12345"),
            "name": commerce.get("name", ""),
            "role": "commerce",
            "commerce_id": cid,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])

    access_token = create_access_token(user_id, "commerce")
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {
        "token": access_token,
        "refresh_token": refresh_token,
        "id": user_id,
        "name": commerce.get("name", ""),
        "role": "commerce",
        "commerce_id": cid,
        "commerce": serialize_doc(commerce),
        "redirect": "/commerce-portal",
    }


class RestoreAdminRequest(BaseModel):
    admin_token: str


@router.post("/restore-admin")
async def restore_admin(req: RestoreAdminRequest, response: Response):
    """Restore the admin session cookies using a previously saved admin access token.
    Used to exit an impersonation session and return to the admin panel.
    """
    from core import get_jwt_secret, JWT_ALGORITHM, create_refresh_token as _crt
    import jwt as _jwt
    try:
        payload = _jwt.decode(req.admin_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Token admin inválido o expirado")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="El usuario no es administrador")
    new_refresh = _crt(user_id)
    set_auth_cookies(response, req.admin_token, new_refresh)
    return {"ok": True, "id": user_id, "role": user.get("role"), "name": user.get("name", "")}
