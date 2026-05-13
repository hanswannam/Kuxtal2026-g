"""Quotation PDF builder. Uses WeasyPrint with a lazy import so the backend
boots even on hosts missing Pango/Cairo. Returns bytes ready to send via
StreamingResponse.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
import html as _html


_PDF_CSS = """
@page { size: A4; margin: 22mm 18mm 18mm 18mm; }
* { box-sizing: border-box; }
body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #0D2B45;
    font-size: 11pt;
    line-height: 1.5;
}
h1, h2, h3, h4 {
    font-family: 'Playfair Display', 'Georgia', serif;
    color: #0D2B45;
    margin: 0 0 6pt 0;
}
h1 { font-size: 24pt; }
h2 { font-size: 16pt; border-bottom: 1pt solid #D4AF37; padding-bottom: 4pt; margin-top: 12pt; }
h3 { font-size: 13pt; color: #B89327; }
.eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 8pt;
    color: #B89327;
    font-weight: 700;
}
.header {
    display: flex;
    justify-content: space-between;
    border-bottom: 2pt solid #D4AF37;
    padding-bottom: 8pt;
    margin-bottom: 14pt;
}
.brand { font-family: 'Playfair Display', serif; font-size: 16pt; color: #0D2B45; font-weight: 900; }
.muted { color: #6c7280; font-size: 9pt; }
.box {
    background: #FBF5E2;
    border: 1pt solid rgba(212,175,55,0.45);
    border-radius: 8pt;
    padding: 10pt;
    margin: 8pt 0;
}
.row { display: flex; gap: 8pt; }
.col { flex: 1; }
.label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.16em; color: #B89327; font-weight: 700; }
.value { font-size: 11pt; color: #0D2B45; font-weight: 600; }
.price-box {
    background: #0D2B45;
    color: #fff;
    border: 1pt solid #D4AF37;
    border-radius: 10pt;
    padding: 14pt;
    margin: 14pt 0;
    text-align: center;
}
.price-box .total { font-size: 26pt; font-weight: 900; color: #F5D27A; font-family: 'Playfair Display', serif; }
.price-box .total-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.22em; color: #F5D27A; opacity: 0.85; }
.day {
    border-left: 3pt solid #D4AF37;
    padding: 4pt 0 4pt 10pt;
    margin-bottom: 8pt;
    page-break-inside: avoid;
}
.day-tag {
    background: #0D2B45; color: #F5D27A; font-size: 7pt; text-transform: uppercase;
    letter-spacing: 0.18em; padding: 2pt 7pt; border-radius: 6pt; font-weight: 700;
}
.hotel { page-break-inside: avoid; margin-bottom: 10pt; padding: 8pt 10pt;
         background: rgba(212,175,55,0.07); border: 1pt solid rgba(212,175,55,0.30); border-radius: 6pt; }
.gallery { display: flex; flex-wrap: wrap; gap: 4pt; margin-top: 4pt; }
.gallery img { width: 100pt; height: 70pt; object-fit: cover; border-radius: 4pt; }
.footer { margin-top: 20pt; padding-top: 8pt; border-top: 1pt solid #ddd;
          font-size: 8pt; color: #777; text-align: center; }
.badge {
    display: inline-block; padding: 3pt 8pt; border-radius: 6pt;
    font-size: 8pt; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700;
}
.badge-gold { background: #D4AF37; color: #0D2B45; }
.badge-navy { background: #0D2B45; color: #F5D27A; }
"""


def _escape(s: Optional[str]) -> str:
    if not s:
        return ""
    return _html.escape(str(s))


def _fmt_date(s: Optional[str]) -> str:
    if not s:
        return "—"
    try:
        if "T" in s:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).strftime("%d/%m/%Y")
        return datetime.strptime(s[:10], "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        return s


def _fmt_money(v) -> str:
    try:
        n = float(v or 0)
        return f"Q.{n:,.2f}"
    except Exception:
        return "Q.0.00"


def _render_flights(q: dict) -> str:
    if not q.get("has_flights"):
        return ""
    fi = q.get("flight_info") or {}
    if not isinstance(fi, dict):
        return ""
    dep_date = _escape(fi.get("departure_date") or "")
    dep_time = _escape(fi.get("departure_time") or "")
    dep_place = _escape(fi.get("departure_place") or "")
    arr_date = _escape(fi.get("arrival_date") or "")
    arr_time = _escape(fi.get("arrival_time") or "")
    arr_place = _escape(fi.get("arrival_place") or "")
    airline = _escape(fi.get("airline") or "")
    notes = _escape(fi.get("notes") or "")
    layovers = fi.get("layovers") or []

    if not any([dep_date, dep_place, arr_date, arr_place, airline]) and not layovers:
        return ""

    layover_html = ""
    if layovers:
        rows = []
        for lv in layovers:
            if not isinstance(lv, dict):
                continue
            place = _escape(lv.get("place") or "")
            date = _escape(lv.get("date") or "")
            time = _escape(lv.get("time") or "")
            dur = _escape(lv.get("duration") or "")
            rows.append(
                f'<div class="layover"><strong>🛬 {place}</strong>'
                f'<div class="muted" style="margin-top:2pt;">{date} {time}'
                f'{(" · " + dur) if dur else ""}</div></div>'
            )
        if rows:
            layover_html = (
                '<div style="margin-top:8pt;"><div class="label">Escalas</div>'
                + "".join(rows) + "</div>"
            )

    return f"""
<h2>Información de vuelo</h2>
<div class="box">
  {f'<div style="margin-bottom:6pt;"><span class="badge badge-navy">Aerolínea</span> <strong>{airline}</strong></div>' if airline else ''}
  <div class="row">
    <div class="col">
      <div class="label">Salida</div>
      <div class="value">{dep_place or '—'}</div>
      <div class="muted">{dep_date} {dep_time}</div>
    </div>
    <div class="col">
      <div class="label">Llegada</div>
      <div class="value">{arr_place or '—'}</div>
      <div class="muted">{arr_date} {arr_time}</div>
    </div>
  </div>
  {layover_html}
  {f'<div style="margin-top:8pt;" class="muted">{notes}</div>' if notes else ''}
</div>
"""


def _render_package_overview(q: dict, pkg) -> str:
    """Render the package description and includes from snapshot first, falling back to pkg doc."""
    desc = q.get("package_description") or (pkg or {}).get("description") or ""
    short = q.get("package_short_description") or (pkg or {}).get("short_description") or ""
    includes = q.get("package_includes") or (pkg or {}).get("includes") or []
    img = q.get("package_image_url") or (pkg or {}).get("image_url") or ""

    sections = []
    if short:
        sections.append(f'<p class="muted" style="font-style:italic;margin:0 0 6pt 0;">{_escape(short)}</p>')
    if img:
        sections.append(f'<div style="margin:6pt 0;"><img src="{_escape(img)}" style="width:100%;max-height:180pt;object-fit:cover;border-radius:6pt;" /></div>')
    if desc:
        sections.append(f'<p style="white-space:pre-wrap;">{_escape(desc).replace(chr(10), "<br/>")}</p>')
    if includes:
        items = "".join(f'<li>{_escape(it)}</li>' for it in includes if it)
        sections.append(f'<div style="margin-top:8pt;"><div class="label">El precio incluye</div><ul style="margin:6pt 0;padding-left:18pt;">{items}</ul></div>')

    if not sections:
        return ""
    return f'<h2>Sobre el viaje</h2>{"".join(sections)}'


def _render_itinerary(pkg_or_q: dict) -> str:
    days = pkg_or_q.get("itinerary_days") or pkg_or_q.get("package_itinerary_days") or pkg_or_q.get("itinerary") or []
    if not days:
        return ""
    rows = []
    for i, d in enumerate(days):
        n = d.get("day") or (i + 1)
        title = _escape(d.get("title") or f"Día {n}")
        desc = _escape(d.get("description") or "").replace("\n", "<br/>")
        gallery_html = ""
        gal = d.get("gallery") or []
        if gal:
            imgs = "".join(f'<img src="{_escape(u)}" />' for u in gal[:6])
            gallery_html = f'<div class="gallery">{imgs}</div>'
        rows.append(
            f'<div class="day"><span class="day-tag">Día {n}</span> '
            f'<h3 style="margin-top:4pt;margin-bottom:2pt;">{title}</h3>'
            f'<p style="margin:0 0 4pt 0;">{desc}</p>{gallery_html}</div>'
        )
    return f'<h2>Itinerario día por día</h2>{"".join(rows)}'


def _render_hotels(source: dict) -> str:
    hotels = source.get("hotels") or source.get("package_hotels") or []
    if not hotels:
        return ""
    rows = []
    for i, h in enumerate(hotels):
        name = _escape(h.get("name") or f"Hotel {i + 1}")
        desc = _escape(h.get("description") or "").replace("\n", "<br/>")
        gal = h.get("gallery") or []
        gallery_html = ""
        if gal:
            imgs = "".join(f'<img src="{_escape(u)}" />' for u in gal[:6])
            gallery_html = f'<div class="gallery">{imgs}</div>'
        rows.append(
            f'<div class="hotel"><h3 style="margin:0 0 4pt 0;">🏨 {name}</h3>'
            f'<p style="margin:0 0 4pt 0;">{desc}</p>{gallery_html}</div>'
        )
    return f'<h2>Hoteles previstos</h2>{"".join(rows)}'


def _render_gallery(source: dict) -> str:
    gal = source.get("gallery") or source.get("package_gallery") or []
    if not gal:
        return ""
    imgs = "".join(f'<img src="{_escape(u)}" />' for u in gal[:12])
    return f'<h2>Galería del paquete</h2><div class="gallery">{imgs}</div>'


def build_quotation_pdf(q: dict, pkg: Optional[dict], options: dict) -> bytes:
    """Build a PDF for a quotation. Lazy-imports WeasyPrint."""
    from weasyprint import HTML, CSS  # lazy

    include_itinerary = bool(options.get("include_itinerary"))
    include_hotels = bool(options.get("include_hotels"))
    include_gallery = bool(options.get("include_gallery"))

    name = _escape(q.get("name"))
    email = _escape(q.get("email"))
    phone = _escape(q.get("phone"))
    contract = _escape(q.get("contract_number"))
    travel = _fmt_date(q.get("travel_date"))
    guests = q.get("guests") or 1
    msg = _escape(q.get("message") or "").replace("\n", "<br/>")
    title = _escape(q.get("package_title") or (pkg or {}).get("title") or "Paquete personalizado")
    country = _escape(q.get("package_country") or (pkg or {}).get("country") or "")
    days = q.get("package_duration_days") or (pkg or {}).get("duration_days") or 0
    is_member = bool(q.get("is_member"))
    member_price = q.get("member_unit_price") or 0
    unit_price = q.get("unit_price") or 0
    applied_price = member_price if (is_member and member_price > 0) else unit_price
    total = q.get("total") or (applied_price * guests)
    valid_until = _fmt_date(q.get("valid_until"))
    short_id = (q.get("id") or "")[-6:].upper()

    pkg_section = ""
    # Snapshot fields in `q` take precedence; the live pkg (if any) is fallback for visuals.
    overview_html = _render_package_overview(q, pkg)
    if overview_html:
        pkg_section += overview_html
    flight_html = _render_flights(q)
    if flight_html:
        pkg_section += flight_html
    if include_itinerary:
        # Prefer snapshot itinerary, fallback to live package itinerary
        snapshot = {"itinerary_days": q.get("package_itinerary_days") or []}
        pkg_section += _render_itinerary(snapshot) or _render_itinerary(pkg or {})
    if include_hotels:
        pkg_section += _render_hotels(q) or _render_hotels(pkg or {})
    if include_gallery:
        pkg_section += _render_gallery(q) or _render_gallery(pkg or {})

    # Layover micro-styling
    extra_css = """
      .layover { background:#fff; border:1pt solid rgba(212,175,55,0.30); border-radius:5pt;
                 padding:6pt 8pt; margin-top:4pt; font-size:9.5pt; }
    """

    html_body = f"""
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Cotización {short_id}</title></head>
<body>
  <div class="header">
    <div>
      <div class="brand">Kuxtal Travels</div>
      <div class="muted">Vacation Club · kuxtaltravelgt.com</div>
    </div>
    <div style="text-align:right;">
      <div class="eyebrow">Cotización</div>
      <div style="font-size:14pt;font-weight:900;">#{short_id}</div>
      <div class="muted">{datetime.now().strftime("%d/%m/%Y")}</div>
    </div>
  </div>

  <h1>{title}</h1>
  <p class="muted">{country} · {days} días</p>

  <div class="row">
    <div class="col box">
      <div class="label">Cliente</div>
      <div class="value">{name or '—'}</div>
      <div class="muted">{email} · {phone}</div>
      {f'<div class="muted">Contrato #{contract}</div>' if contract else ''}
      {'<span class="badge badge-gold" style="margin-top:6pt;">Socio</span>' if is_member else ''}
    </div>
    <div class="col box">
      <div class="label">Datos del viaje</div>
      <div class="value">{guests} viajero{'s' if guests != 1 else ''}</div>
      <div class="muted">Fecha tentativa: {travel}</div>
      <div class="muted">Válida hasta: {valid_until}</div>
    </div>
  </div>

  {f'<div class="box"><div class="label">Mensaje del cliente</div><p style="margin:4pt 0 0 0;">{msg}</p></div>' if msg else ''}

  <div class="price-box">
    <div class="total-label">Total estimado</div>
    <div class="total">{_fmt_money(total)}</div>
    <div style="font-size:9pt;opacity:0.85;margin-top:4pt;">
      {_fmt_money(applied_price)} por persona x {guests}
    </div>
  </div>

  {pkg_section}

  <div class="footer">
    Esta cotización es referencial. Precios sujetos a disponibilidad y temporada.<br/>
    Kuxtal Travels · Servicio personalizado para socios y clientes preferentes.
  </div>
</body></html>
"""
    pdf_bytes = HTML(string=html_body).write_pdf(stylesheets=[CSS(string=_PDF_CSS + extra_css)])
    return pdf_bytes
