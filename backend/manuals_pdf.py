"""
Manuales PDF generator — Kuxtal Travels.

Convierte los .md de /app/manuales/ en PDFs con branding Kuxtal
(navy + gold + Playfair Display). Cacheado en memoria por mtime del archivo.

NOTA: weasyprint requiere libs del sistema (pango/cairo). Lo importamos lazy
para que el backend arranque incluso si esas libs no están en el contenedor
productivo. La descarga de PDF responderá con un error claro si falta la lib.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Tuple

import markdown

logger = logging.getLogger("kuxtal.manuals")

MANUALS_DIR = Path("/app/manuales")

MANUAL_FILES: Dict[str, Tuple[str, str]] = {
    "admin": ("01_Manual_Administrador.md", "Manual Administrador - Kuxtal Travels"),
    "member": ("02_Manual_Socio.md", "Manual Socio - Kuxtal Travels"),
    "commerce": ("03_Manual_Comercio.md", "Manual Comercio - Kuxtal Travels"),
}

# Cache: role -> (mtime, pdf_bytes)
_cache: Dict[str, Tuple[float, bytes]] = {}

# CSS branding Kuxtal: navy + gold + Playfair
_CSS = """
@page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
    @bottom-center {
        content: "Kuxtal Travels  ·  pag. " counter(page) " / " counter(pages);
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 9pt;
        color: #8B6F2E;
        font-style: italic;
    }
    @top-right {
        content: string(doctitle);
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 8pt;
        color: #D4AF5A;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }
}

body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1A2A3D;
    background: #FAF8F3;
}

h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 26pt;
    font-weight: 900;
    color: #0D2B45;
    margin: 0 0 6pt 0;
    padding-bottom: 8pt;
    border-bottom: 2pt solid #D4AF5A;
    string-set: doctitle content();
    page-break-after: avoid;
}

h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 16pt;
    font-weight: 700;
    color: #0D2B45;
    margin: 18pt 0 6pt 0;
    padding: 4pt 0 4pt 10pt;
    border-left: 3pt solid #D4AF5A;
    page-break-after: avoid;
}

h3 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 13pt;
    font-weight: 700;
    color: #8B6F2E;
    margin: 14pt 0 4pt 0;
    page-break-after: avoid;
}

h4 {
    font-size: 11pt;
    font-weight: 700;
    color: #0D2B45;
    margin: 10pt 0 4pt 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

p { margin: 0 0 8pt 0; }

strong { color: #0D2B45; font-weight: 700; }

em { color: #8B6F2E; }

a {
    color: #D4AF5A;
    text-decoration: none;
    border-bottom: 0.5pt dotted #D4AF5A;
}

ul, ol {
    margin: 4pt 0 8pt 0;
    padding-left: 18pt;
}
li { margin-bottom: 3pt; }
li::marker { color: #D4AF5A; }

table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt 0;
    page-break-inside: avoid;
    font-size: 9.5pt;
}
th {
    background: #0D2B45;
    color: #E5C989;
    padding: 6pt 8pt;
    text-align: left;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 8.5pt;
    border: 0.5pt solid #D4AF5A;
}
td {
    padding: 6pt 8pt;
    border: 0.5pt solid #D4AF5A55;
    background: #FFFFFF;
    vertical-align: top;
}
tr:nth-child(even) td { background: #FAF6EB; }

code {
    background: #0D2B45;
    color: #E5C989;
    padding: 1pt 5pt;
    border-radius: 3pt;
    font-family: 'Courier New', monospace;
    font-size: 9.5pt;
}
pre {
    background: #0D2B45;
    color: #E5C989;
    padding: 10pt 14pt;
    border-radius: 6pt;
    border-left: 3pt solid #D4AF5A;
    margin: 8pt 0 12pt 0;
    font-size: 9pt;
    overflow: hidden;
    page-break-inside: avoid;
}
pre code {
    background: transparent;
    color: #E5C989;
    padding: 0;
}

blockquote {
    border-left: 3pt solid #D4AF5A;
    background: #FAF6EB;
    margin: 8pt 0;
    padding: 8pt 12pt;
    color: #4A3F2A;
    font-style: italic;
    page-break-inside: avoid;
}

hr {
    border: 0;
    height: 0.5pt;
    background: linear-gradient(90deg, transparent, #D4AF5A, transparent);
    margin: 14pt 0;
}

/* Cover-like first heading */
h1:first-child {
    margin-top: 0;
    padding-top: 18pt;
}

/* Branding header strip */
.brand-header {
    text-align: center;
    margin-bottom: 12pt;
    padding-bottom: 14pt;
    border-bottom: 0.5pt solid #D4AF5A;
}
.brand-header .eyebrow {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 8pt;
    letter-spacing: 0.4em;
    color: #D4AF5A;
    text-transform: uppercase;
    margin-bottom: 4pt;
}
.brand-header .brand {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 22pt;
    font-weight: 900;
    color: #0D2B45;
    font-style: italic;
}
"""

_BRAND_HEADER = """
<div class="brand-header">
    <div class="eyebrow">Kuxtal Travels</div>
    <div class="brand">Manual oficial</div>
</div>
"""


def generate_manual_pdf(role: str) -> bytes:
    """Genera (o devuelve cacheado) el PDF del manual del role indicado.
    Importa weasyprint de forma lazy. Si la lib del sistema no está disponible,
    levanta RuntimeError con mensaje claro.
    """
    if role not in MANUAL_FILES:
        raise ValueError(f"Manual desconocido: {role}")

    filename, _title = MANUAL_FILES[role]
    md_path = MANUALS_DIR / filename
    if not md_path.exists():
        raise FileNotFoundError(f"Manual no encontrado: {md_path}")

    mtime = md_path.stat().st_mtime
    cached = _cache.get(role)
    if cached and cached[0] == mtime:
        return cached[1]

    try:
        from weasyprint import HTML, CSS
    except (ImportError, OSError) as e:
        logger.error("weasyprint no disponible: %s", e)
        raise RuntimeError(
            "La generación de PDF no está disponible en este servidor "
            "(falta weasyprint o sus dependencias del sistema: pango, cairo). "
            "Por ahora podés ver el manual online en /manual/{role} o pedirle "
            "al administrador que lo descargue desde el preview."
        ) from e

    md_text = md_path.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists"],
    )
    full_html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/></head>
<body>{_BRAND_HEADER}{html_body}</body></html>"""

    pdf_bytes = HTML(string=full_html).write_pdf(stylesheets=[CSS(string=_CSS)])
    _cache[role] = (mtime, pdf_bytes)
    return pdf_bytes


def get_manual_filename(role: str) -> str:
    if role not in MANUAL_FILES:
        raise ValueError(f"Manual desconocido: {role}")
    base = MANUAL_FILES[role][0].rsplit(".", 1)[0]
    return f"{base}.pdf"
