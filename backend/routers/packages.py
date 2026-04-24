"""Packages router: CRUD + filters, toggle-status, AI import from Google Drive.

Depends on:
    core.db, core.serialize_doc, core.require_role, core.verify_delete_code,
    core.get_current_user, core.put_object, core.APP_NAME, core.logger.

Uses a late import of `server._broadcast_news` inside create_package to avoid
the circular dependency (server.py imports this module; this module needs the
push/broadcast helper which is still defined in server.py).
"""
from __future__ import annotations

import os
import re as re_module
import json as json_module
import tempfile
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import requests
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core import (
    db,
    serialize_doc,
    require_role,
    verify_delete_code,
    get_current_user,
    put_object,
    APP_NAME,
    logger,
)

router = APIRouter(prefix="/api")


# ── Pydantic model ──────────────────────────────────────────────────────
class PackageCreate(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = ""
    country: str
    price: float
    member_price: Optional[float] = 0
    agency_price: Optional[float] = 0  # precio base/costo
    duration_days: int
    category: str = "paquete"
    includes: List[str] = []
    itinerary: List[dict] = []
    accommodation_type: Optional[str] = ""
    difficulty: Optional[str] = ""
    min_group: Optional[int] = 1
    max_group: Optional[int] = 20
    rating: float = 4.8
    image_url: Optional[str] = ""
    gallery: List[str] = []
    featured: bool = False
    status: str = "active"
    visibility: str = "public"
    promo_start: Optional[str] = ""
    promo_end: Optional[str] = ""
    deactivation_reason: Optional[str] = ""


# ── Search helpers ──────────────────────────────────────────────────────
def normalize_search(text: str) -> str:
    """Convert search text to an accent-insensitive regex pattern."""
    replacements = {
        "a": "[aáàâä]", "e": "[eéèêë]", "i": "[iíìîï]",
        "o": "[oóòôö]", "u": "[uúùûü]", "n": "[nñ]",
    }
    out = []
    for ch in text:
        lower = ch.lower()
        out.append(replacements[lower] if lower in replacements else re_module.escape(ch))
    return "".join(out)


_PACKAGE_SORT_MAP = {
    "price_asc": ("price", 1),
    "price_desc": ("price", -1),
    "duration_asc": ("duration_days", 1),
    "duration_desc": ("duration_days", -1),
    "rating": ("rating", -1),
}


async def _is_admin_request(request: Request) -> bool:
    try:
        u = await get_current_user(request)
        return u.get("role") in ("super_admin", "admin")
    except Exception:
        return False


def _apply_package_range_filter(query: dict, field: str, min_val, max_val) -> None:
    if min_val is None and max_val is None:
        return
    bounds = query.setdefault(field, {})
    if min_val is not None:
        bounds["$gte"] = min_val
    if max_val is not None:
        bounds["$lte"] = max_val


def _apply_package_search_filter(query: dict, search: Optional[str]) -> None:
    if not search:
        return
    search_pattern = normalize_search(search)
    search_or = [
        {"title": {"$regex": search_pattern, "$options": "i"}},
        {"description": {"$regex": search_pattern, "$options": "i"}},
        {"country": {"$regex": search_pattern, "$options": "i"}},
    ]
    if "$and" in query:
        query["$and"].append({"$or": search_or})
    else:
        query["$or"] = search_or


# ── CRUD routes ─────────────────────────────────────────────────────────
@router.get("/packages")
async def list_packages(
    request: Request,
    category: Optional[str] = None,
    country: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_days: Optional[int] = None,
    max_days: Optional[int] = None,
    sort: Optional[str] = None,
    include_internal: Optional[bool] = False,
):
    is_admin = await _is_admin_request(request)
    query: dict = {}

    if not (is_admin and include_internal):
        query["status"] = "active"
        query["$and"] = [{"$or": [{"visibility": "public"}, {"visibility": {"$exists": False}}]}]

    if category:
        query["category"] = category
    if country:
        query["country"] = {"$regex": normalize_search(country), "$options": "i"}
    _apply_package_search_filter(query, search)
    _apply_package_range_filter(query, "price", min_price, max_price)
    _apply_package_range_filter(query, "duration_days", min_days, max_days)
    if featured is not None:
        query["featured"] = featured

    sort_field, sort_dir = _PACKAGE_SORT_MAP.get(sort or "", ("created_at", -1))

    packages = []
    async for p in db.packages.find(query).sort(sort_field, sort_dir).limit(200):
        packages.append(serialize_doc(p))
    return packages


@router.get("/packages/{package_id}")
async def get_package(package_id: str):
    pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return serialize_doc(pkg)


@router.post("/packages")
async def create_package(req: PackageCreate, request: Request):
    user = await require_role("super_admin", "admin", permission="packages")(request)
    doc = req.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["created_by"] = user["_id"]
    result = await db.packages.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    # Broadcast to members & all: new package available.
    # Late import to avoid circular dependency (server.py imports this router).
    from server import _broadcast_news

    await _broadcast_news(
        title="Nuevo paquete disponible",
        message=f"{doc.get('title','')} - {doc.get('country','')}. ¡Descubrelo ahora!",
        link=f"/trip/{doc['_id']}",
        image_url=doc.get("image_url", ""),
        target="all",
    )
    return doc


@router.put("/packages/{package_id}")
async def update_package(package_id: str, req: PackageCreate, request: Request):
    await require_role("super_admin", "admin", permission="packages")(request)
    update_data = req.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.packages.update_one({"_id": ObjectId(package_id)}, {"$set": update_data})
    updated = await db.packages.find_one({"_id": ObjectId(package_id)})
    return serialize_doc(updated)


@router.put("/packages/{package_id}/toggle-status")
async def toggle_package_status(package_id: str, request: Request):
    await require_role("super_admin", "admin", permission="packages")(request)
    pkg = await db.packages.find_one({"_id": ObjectId(package_id)})
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    new_status = "inactive" if pkg.get("status") == "active" else "active"
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
        update["deactivation_reason"] = ""
    await db.packages.update_one({"_id": ObjectId(package_id)}, {"$set": update})
    return {
        "message": f"Paquete {'activado' if new_status == 'active' else 'desactivado'}",
        "status": new_status,
        "deactivation_reason": update["deactivation_reason"],
    }


@router.delete("/packages/{package_id}")
async def delete_package(package_id: str, request: Request):
    await require_role("super_admin", "admin", permission="packages")(request)
    await verify_delete_code(request)
    result = await db.packages.delete_one({"_id": ObjectId(package_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return {"message": "Paquete eliminado"}


# ══════════════════════════════════════════════════════════════════════
# ── Google Drive import + AI extraction ──────────────────────────────
# ══════════════════════════════════════════════════════════════════════

def extract_gdrive_file_id(url: str) -> Optional[str]:
    """Extract file ID from various Google Drive URL formats."""
    patterns = [
        r"/file/d/([a-zA-Z0-9_-]+)",
        r"id=([a-zA-Z0-9_-]+)",
        r"/d/([a-zA-Z0-9_-]+)",
        r"open\?id=([a-zA-Z0-9_-]+)",
    ]
    for pattern in patterns:
        match = re_module.search(pattern, url)
        if match:
            return match.group(1)
    return None


def download_gdrive_file(file_id: str, dest_path: str) -> str:
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
    resp = requests.get(download_url, stream=True, timeout=60, allow_redirects=True)
    resp.raise_for_status()
    content_type = resp.headers.get("Content-Type", "").lower()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    return content_type


_EXT_MIME_MAP = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "avif": "image/avif",
    "gif": "image/gif",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xls": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

_CONTENT_TYPE_KEYWORDS = (
    ("pdf", "application/pdf"),
    ("word", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ("document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ("sheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    ("excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    ("image", "image/jpeg"),
)


def detect_mime_type(file_path: str, content_type: str) -> str:
    """Detect MIME type from file extension first, then content-type header."""
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    if ext in _EXT_MIME_MAP:
        return _EXT_MIME_MAP[ext]
    lowered = (content_type or "").lower()
    for keyword, mime in _CONTENT_TYPE_KEYWORDS:
        if keyword in lowered:
            return mime
    return content_type or "application/octet-stream"


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
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())[:8000]


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
    import fitz  # PyMuPDF

    extracted_urls = []
    try:
        pdf = fitz.open(file_path)
        img_count = 0
        for page_num in range(min(len(pdf), 30)):
            page = pdf[page_num]
            for img_info in page.get_images(full=True):
                if img_count >= max_images:
                    break
                xref = img_info[0]
                try:
                    base_image = pdf.extract_image(xref)
                    if not base_image:
                        continue
                    image_bytes = base_image["image"]
                    if len(image_bytes) < min_size:
                        continue
                    ext = base_image.get("ext", "png")
                    if ext not in ("png", "jpg", "jpeg", "webp"):
                        ext = "png"
                    content_type = "image/jpeg" if ext == "jpg" else f"image/{ext}"
                    storage_path = f"{APP_NAME}/gallery/{uuid.uuid4().hex}.{ext}"
                    put_object(storage_path, image_bytes, content_type)
                    extracted_urls.append(f"/api/files/{storage_path}")
                    img_count += 1
                except Exception as img_err:
                    logger.warning(f"Failed to extract image xref={xref}: {img_err}")
                    continue
            if img_count >= max_images:
                break
        pdf.close()
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


# ── Drive import helpers ────────────────────────────────────────────────
def _validate_and_extract_drive_id(drive_url: str) -> str:
    if not drive_url:
        raise HTTPException(status_code=400, detail="URL de Google Drive requerida")
    file_id = extract_gdrive_file_id(drive_url)
    if not file_id:
        raise HTTPException(status_code=400, detail="No se pudo extraer el ID del archivo de Google Drive. Verifica que el enlace sea correcto.")
    return file_id


def _download_drive_file_to_tmp(file_id: str):
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, f"gdrive_{file_id}")
    return tmp_dir, tmp_path


def _safe_download(file_id: str, tmp_path: str) -> str:
    try:
        return download_gdrive_file(file_id, tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al descargar archivo: asegurate de que el enlace sea publico/compartido. {str(e)}")


def _get_llm_key() -> str:
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key no configurada")
    return llm_key


def _extract_text_for_mime(tmp_path: str, mime: str) -> str:
    if "word" in mime or "document" in mime:
        return extract_text_from_docx(tmp_path)
    if "sheet" in mime or "excel" in mime:
        return extract_text_from_xlsx(tmp_path)
    try:
        return extract_text_from_pdf(tmp_path)
    except Exception:
        return ""


async def _ai_extract_package_from_file(llm_key: str, tmp_path: str, mime: str, file_id: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

    chat = LlmChat(
        api_key=llm_key,
        session_id=f"import-{file_id}-{uuid.uuid4().hex[:8]}",
        system_message=PACKAGE_EXTRACTION_PROMPT,
    ).with_model("gemini", "gemini-2.5-flash")

    if mime.startswith("image/") or mime == "application/pdf":
        msg = UserMessage(
            text="Analiza este documento y extrae la informacion del paquete turistico. Responde solo con JSON.",
            file_contents=[FileContentWithMimeType(file_path=tmp_path, mime_type=mime)],
        )
        return await chat.send_message(msg)

    extracted_text = _extract_text_for_mime(tmp_path, mime)
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No se pudo extraer texto del documento")
    msg = UserMessage(text=(
        "Analiza el siguiente contenido de un documento de tour/viaje y extrae la informacion "
        f"del paquete turistico. Responde solo con JSON.\n\n---\n{extracted_text}"
    ))
    return await chat.send_message(msg)


def _parse_ai_package_json(response_text: str) -> dict:
    json_text = response_text.strip()
    if json_text.startswith("```"):
        json_text = json_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    return json_module.loads(json_text)


_PACKAGE_DEFAULTS = {
    "title": "Paquete Importado",
    "description": "",
    "short_description": "",
    "country": "",
    "price": 0,
    "member_price": 0,
    "duration_days": 1,
    "category": "paquete",
    "includes": [],
    "itinerary": [],
    "accommodation_type": "",
    "difficulty": "",
    "min_group": 1,
    "max_group": 20,
    "rating": 4.8,
    "featured": False,
}


def _apply_package_defaults(package_data: dict) -> None:
    for key, default in _PACKAGE_DEFAULTS.items():
        package_data.setdefault(key, default)
    package_data["price"] = float(package_data.get("price", 0) or 0)
    package_data["member_price"] = float(package_data.get("member_price", 0) or 0)
    package_data["duration_days"] = int(package_data.get("duration_days", 1) or 1)


def _upload_image_as_gallery(tmp_path: str, mime: str) -> list:
    try:
        with open(tmp_path, "rb") as f:
            img_bytes = f.read()
        ext = mime.split("/")[-1]
        if ext == "jpeg":
            ext = "jpg"
        storage_path = f"{APP_NAME}/gallery/{uuid.uuid4().hex}.{ext}"
        put_object(storage_path, img_bytes, mime)
        return [f"/api/files/{storage_path}"]
    except Exception as img_err:
        logger.warning(f"Image upload failed: {img_err}")
        return []


def _collect_gallery_from_source(tmp_path: str, mime: str) -> list:
    if mime == "application/pdf":
        try:
            gallery = extract_images_from_pdf(tmp_path)
            if gallery:
                logger.info(f"Extracted {len(gallery)} images from PDF")
                return gallery
        except Exception as img_err:
            logger.warning(f"Image extraction from PDF failed: {img_err}")
        return []
    if mime.startswith("image/"):
        return _upload_image_as_gallery(tmp_path, mime)
    return []


def _cleanup_tmp(tmp_dir: str, tmp_path: str) -> None:
    try:
        os.remove(tmp_path)
        os.rmdir(tmp_dir)
    except Exception:
        pass


@router.post("/packages/import-from-drive")
async def import_package_from_drive(request: Request):
    """Import a package from a Google Drive shared link using AI extraction."""
    await require_role("super_admin", "admin", permission="packages")(request)
    body = await request.json()
    drive_url = body.get("drive_url", "").strip()

    file_id = _validate_and_extract_drive_id(drive_url)
    tmp_dir, tmp_path = _download_drive_file_to_tmp(file_id)
    try:
        content_type = _safe_download(file_id, tmp_path)
        mime = detect_mime_type(tmp_path, content_type)
        llm_key = _get_llm_key()

        response_text = await _ai_extract_package_from_file(llm_key, tmp_path, mime, file_id)
        package_data = _parse_ai_package_json(response_text)
        _apply_package_defaults(package_data)
        extracted_gallery = _collect_gallery_from_source(tmp_path, mime)

        return {
            "extracted": package_data,
            "source_file_id": file_id,
            "mime_type": mime,
            "extracted_gallery": extracted_gallery,
        }
    except HTTPException:
        raise
    except json_module.JSONDecodeError:
        raise HTTPException(status_code=422, detail="El AI no pudo extraer datos estructurados del documento. Intenta con otro archivo.")
    except Exception as e:
        logger.error(f"Import error: {e}")
        raise HTTPException(status_code=500, detail=f"Error al procesar documento: {str(e)}")
    finally:
        _cleanup_tmp(tmp_dir, tmp_path)
