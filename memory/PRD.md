# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, programa Kuxtal Club con cupones QR, portal socios, CRM admin, portal comercios, referidos, chat, analytics, importacion AI.

## Architecture
- Backend: FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- Frontend: React 18 + Tailwind + Shadcn UI + Recharts + React.lazy + qrcode.react + html5-qrcode
- Auth: JWT, AI: Gemini 2.5 Flash, PWA: SW v3
- Theme: Navy #1B325F (--primary), Verde Lima #99D63B (--accent)

## All Implemented Features
- Core: Website, Member (9 tabs), Admin (17 tabs: Dashboard, Cotizaciones, Importar, Analytics, Socios, Clientes, Paquetes, Comercios, Categorías, Clubs, Regalías, Referidos, Anuncios, Push, Solicitudes, Usuarios, Config), Commerce (5 tabs), Auth (5 roles), Push, PWA, Chat, Referrals, Analytics
- Security: XSS (DOMPurify strict whitelist), DELETE_SECRET env, secrets module for crypto-random, error logging in catch blocks
- AI Import: Individual + Batch Google Drive, PDF image extraction, Gemini 2.5 Flash
- Website: Expedia-style homepage, search with filters/sort, trip detail with gallery/itinerary
- Kuxtal Club: Premium branding, benefits page, digital coupon QR system (generation + scanner)
- Member extended profile (2026-02): 18 new fields (propietario, copropietario, contrato/facturación, observaciones) mapped from DATOS HANSEN.xlsx. DPI EN LETRAS intentionally omitted per user request.
- Regalías admin module (2026-02): CRUD for certificates/gifts assigned to members; member portal shows "Mis Regalías" (filtered by member_id). Multi-picker checkbox added to socio EDIT form to activate regalias for a socio; PUT /api/members/{id}/regalias with hijack protection.
- Clubs Vacacionales admin module (2026-02): CRUD with logo, description, address, benefits list; public GET. Member portal "Clubs" tab lists all clubs.
- Member Dashboard cleanup (2026-02): "Familia" tab removed; "Regalías" + "Clubs" tabs added (9 tabs total).
- TripDetailPage hardening (2026-02): switched to api wrapper; Array.isArray guards on itinerary/includes/gallery; numeric coercion for memberPrice; fmtPrice helper.
- FASE 1 Cotizaciones CRM (2026-02): auto-detect socio (match contract/email), package snapshot on creation, full editor (status, pricing, extras, discount, total, customer/internal notes), timeline/seguimiento with manual notes, public `/cotizacion/:token` page with approve/reject buttons, WhatsApp & email share with pre-built message, public view auto-tracks "viewed" event.
- Roles & Permisos Admin (2026-02, iter 21): matriz de 17 feature keys (dashboard, quotations, clients, members, packages, commerce, categories, clubs, regalias, analytics, announcements, push, import, referrals, requests, users, settings). Endpoints: GET /api/admin/feature-keys, PUT /api/admin/users/{id}/permissions. Super_admin bypass. AdminDashboard tabs se ocultan según permisos. CTA Cotizaciones destacado (cta-quotations).
- Package Visibility (2026-02, iter 21): campo `visibility` = public|internal. Endpoints públicos filtran visibility=internal. Admin management usa ?include_internal=true. AdminPackages con filtro Todos/Público/Interno + radio en form.
- Quotations tracking & filters (2026-02, iter 21): created_at, created_by_id, created_by_name ('Sistema (web pública)' para web pública, nombre del admin para POST /quotations/admin). GET /api/quotations soporta created_by, date_from, date_to. UI con quot-date-from/to, quot-filter-creator, quot-clear-filters, meta muestra '· por <creador>'.
- Code Quality: Component refactoring, lazy loading, ErrorBoundary, SEO OG tags, 30+ MongoDB indexes

## Code Review Status (Applied)
- [x] XSS: DOMPurify.sanitize with strict ALLOWED_TAGS/ALLOWED_ATTR whitelist
- [x] Test secrets: Moved to os.environ.get() with fallback defaults
- [x] Weak random: secrets.choice for coupons, secrets.randbelow for scratch card
- [x] Empty catches: 10+ catch blocks now log console.error/console.warn
- [x] Boolean comparisons: == True/False → is True/is False in tests
- [x] Note: is None/is not None patterns in server.py are CORRECT Python idioms (not changed)

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0ab / FITLIF01
- Delete Secret: BORRAR YA

## Pending / Backlog
- [ ] FASE 2 Cotizaciones: envío por email con Resend (requiere RESEND_API_KEY del usuario)
- [ ] FASE 3 Cotizaciones: PDF de recibo de pago interno
- [ ] Backend refactoring: server.py ~2729 líneas — dividir en routers (auth/admin_users/packages/quotations/members/regalias/clubs/commerce)
- [ ] Exponer FEATURE_KEYS en frontend desde GET /api/admin/feature-keys en lugar de duplicar lista en AdminUsers.js
- [ ] DELETE endpoint para quotations (actualmente no existe, 2 quotations TEST quedaron en DB)
- [ ] Backend refactoring: import_package_from_drive() complexity (break into smaller functions)
- [ ] Frontend refactoring: CommercePortal.js (491 lines), CommerceDetailPage.js, ChatPage.js, HomePage.js
- [ ] Fix pre-existing test files test_kuxtal_api.py / test_coupons.py (missing BASE_URL)
- [ ] Configurar dominio kuxtaltravelgt.com
- [ ] Sistema de reviews/testimonios (P1)
- [ ] Mapa interactivo de destinos (P2)
- [ ] Reportes exportables de cupones canjeados (P2)
