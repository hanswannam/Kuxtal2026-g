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
