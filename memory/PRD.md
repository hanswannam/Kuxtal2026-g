# Kuxtal Travel - Club Vacacional PRD

## [2026-05-14] Cotizaciones: vuelos por imágenes + selector de hotel
**Cambio breaking**: el formulario estructurado de vuelos (aerolínea, salida, llegada, escalas, notas) fue reemplazado por un **uploader de imágenes** (1+ screenshots de boletos/itinerarios). El admin sube los screenshots del PDF de Air France/Copa/etc. y se muestran tal cual en la cotización pública y PDF.

Backend (`routers/quotations.py`):
- Nuevos campos en `allowed_fields`: `flight_images: List[str]`, `selected_hotel_index: Optional[int]`.
- Legacy `flight_info` / `has_flights` se mantienen para no romper cotizaciones existentes.

Frontend:
- `AdminQuotations.js`:
  - `FlightSection` ahora es un uploader múltiple (POST `/api/upload` por archivo), con reorder ←→ y eliminar.
  - Nueva `HotelSelectorSection`: radio buttons para elegir UNA opción de hotel del paquete (o "todas"). Solo aparece cuando el paquete tiene ≥1 hotel.
- `PublicQuotationPage.js`:
  - `FlightSection` renderiza la galería de imágenes en tamaño completo (full-width, click to open).
  - `HotelsSection` filtra por `selected_hotel_index` (cuando no es null/empty muestra solo ese hotel).

PDF (`quotation_pdf.py`):
- `_render_flights` prioriza `flight_images` (lista de imágenes embebidas, page-break safe). Fallback al formato estructurado legacy.
- `_render_hotels` filtra por `selected_hotel_index` y cambia el heading de "Hoteles previstos" → "Hotel" cuando hay solo uno.

Verificado: PDF 499KB con imágenes embedded; preview público muestra 2 imágenes de vuelo + 1 hotel filtrado correctamente.


## [2026-05-14] Difusiones masivas WhatsApp con compliance Meta
**Módulo nuevo**: `routers/broadcasts.py` + `pages/admin/AdminBroadcasts.js`.

Backend:
- POST/GET/cancel/preview en `/api/broadcasts/*`. Background task FastAPI envía 1 msg cada 1.2s (≈50/min, debajo del límite de Meta).
- Audiencias: `members_active`, `members_all`, `clients_all`, `custom_phones`. Filtro automático por `opt_out_whatsapp != true`.
- Integración Kapso.ai: list templates (`/message_templates`) + send template (`{phone_id}/messages` type=template).
- Webhook hook (`handle_webhook_event`): registra status `delivered/read/failed` en `broadcast_messages`; detecta keywords `STOP/BAJA/CANCELAR/QUITAR/UNSUBSCRIBE/QUIT` y marca opt-out automáticamente con confirmación al usuario.
- Endpoint `POST /api/broadcasts/opt-out` (auth): socio se da de baja desde su portal.
- Permiso `broadcasts` agregado a `FEATURE_KEYS`.

Frontend:
- Nueva pestaña **Difusiones WA** en `AdminDashboard.js` (entre Push y Bot WA).
- Wizard de creación con: nombre interno, selector de plantilla (auto-cargada O modo manual con nombre+idioma+nº variables), inputs de variables {{1}}…{{N}}, selector de audiencia (4 tipos), botón "Calcular audiencia" con duración estimada, vista previa con variables sustituidas, botón "Enviar a N".
- Lista de difusiones con estado (queued/running/completed/cancelled/failed), conteos sent/delivered/read/failed, botón cancelar mid-flight, modal de detalle con tabla por destinatario.
- Banner de compliance Meta visible (opt-in, throttle, opt-out automático, plantillas pre-aprobadas, tier 250 inicial).
- Polling cada 5s mientras hay difusiones running.
- Portal Socio (`MemberOverview.js`): nueva tarjeta "Preferencias de comunicación" con botón "No deseo recibir más difusiones de WhatsApp" → llama `/api/broadcasts/opt-out`.

Verificado:
- GET `/api/broadcasts` y `/api/admin/feature-keys` responden.
- Preview audiencia: 3 socios activos con teléfono. Post opt-out queda en 2 (lógica correcta).
- Wizard renderiza correctamente variables y audiencia.
- Plantillas: Kapso devuelve 404 en el endpoint de templates probado; modo manual permite escribir el nombre exacto y se envía sin problemas.

⚠️ Para producción: Necesario crear plantillas en Meta Business Manager (`boletin_mensual`, `nuevo_destino`, `recordatorio_cotizacion`) y esperar aprobación. Sin templates aprobadas Meta rechaza los envíos.


## [2026-02-13] P0 Hotfix — Página pública de cotización crasheaba
- Bug: `PublicQuotationPage.js` referenciaba `<QuotationExtendedInfo />` sin importarla ni definirla → ErrorBoundary mostraba "Algo salió mal" en TODAS las cotizaciones públicas (`/cotizacion/:token`).
- Fix: implementado componente `QuotationExtendedInfo` en el mismo archivo con 6 secciones (Vuelo, Sobre el viaje, Itinerario día por día, Hoteles, Galería, YouTube). Estética luxury magazine navy `#0D2B45` + dorado `#D4AF37`.
- Vuelo renderiza: aerolínea, salida (lugar+fecha+hora), llegada, escalas con duración, notas.
- Verificado visualmente (Avianca GUA→CTG con escala BOG). PDF público sigue funcionando (HTTP 200, application/pdf, 28KB).


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
- Auto-generación usuario de socio (2026-02, iter 22): al crear un socio vía POST /api/members se crea automáticamente su usuario login (email=`<contract>@kuxtal.member`, password=DPI). PUT /api/members sincroniza email/password del usuario si cambia contract_number o DPI. Lookup de login usa $or null/$exists:False para evitar usuarios duplicados.
- Cotización pública: contador de urgencia + Pagar ahora (2026-02, iter 23):
  - Nuevo modelo `valid_until` (ISO) en cotizaciones. Default automático = created_at + `default_valid_days` (config global, default 10).
  - Admin puede overridear `valid_until` por cotización (nuevo y editor).
  - Nuevo config key `quotation_settings`: GET/PUT `/api/config/quotation-settings` (payment_whatsapp, default_valid_days).
  - PublicQuotationPage con `CountdownBadge` (verde/ámbar/rojo + animate-pulse <24h) y CTA "Pagar ahora por WhatsApp" con mensaje pre-armado (#COT + paquete + total Q.). Al vencer: badge rojo "Cotización vencida", CTA "Pagar ahora" permanece activo + aparece "Solicitar renovación" con mensaje WhatsApp distinto.
  - AdminSettings tab: inputs `payment_whatsapp` y `default_valid_days` (data-testid payment-wa-input / default-valid-days-input / save-quot-settings-btn).
  - Backfill: las 26 cotizaciones existentes recibieron valid_until = created_at + 10 días.
- UI polish — navbar + modales (2026-02, iter 24):
  - `glass-nav` opacidad a 97% + blur 20px + sombra sutil para legibilidad sobre contenido.
  - Regla global CSS `body:has(.fixed.inset-0.z-50) [data-testid="main-navbar"] { visibility: hidden }` — navbar se oculta automáticamente cuando hay cualquier modal abierto (19 modales cubiertos).
  - Navbar a `z-40` (antes z-50) para que modales naturalmente queden encima.
  - `PublicQuotationPage` con `pt-24` para que el countdown no quede detrás del navbar fijo.
- Búsqueda + filtros + activar/desactivar (2026-02, iter 25):
  - AdminUsers: search por nombre/email (user-search), filtro por rol (user-filter-role), filtro por estado activo/inactivo (user-filter-status), botón limpiar filtros.
  - AdminPackages: filtro de estado activo/inactivo (pkg-filter-status), toggle switch visual en cada card (toggle-pkg-i). Cards inactivas se muestran en grayscale + badge rojo "Inactivo".
  - Backend: nuevo endpoint `PUT /api/packages/{id}/toggle-status`. GET /api/packages ahora respeta `include_internal=true` también para mostrar paquetes inactivos a admins.
  - Campo `deactivation_reason` (motivo de desactivación). Modal al desactivar pide el motivo (5 presets + textarea libre); se muestra en banner rojo en la tarjeta.
- PWA + Push cross-platform (2026-02, iter 26):
  - Iconos PNG generados 72/96/128/144/152/180/192/256/384/512 + 512-maskable (en `/public/icons/`) con logo centrado sobre fondo navy. Apple-touch-icon PNG en root.
  - `manifest.json` v2: 11 iconos PNG, `display_override`, `lang: es-GT`, `shortcuts` (Cotizaciones, Kuxtal Club), theme color unificado `#1B325F`.
  - `index.html`: apple-touch-icon PNG, msapplication-TileColor, favicon PNG links.
  - `sw.js` v5: notificationclick ahora enfoca ventana existente antes de abrir nueva; icono/badge locales; tag+renotify para agrupar.
  - `AuthContext.js`: `subscribePush` dividido en `syncPushSubscription` (silencioso, no pide permiso — se llama en cada checkAuth) y `enablePushNotifications` (exportado, requiere user gesture, funciona en iOS 16.4+).
  - Nuevo componente `InstallPrompt.js`: banner flotante que (1) muestra botón "Instalar ahora" cuando dispara `beforeinstallprompt` (Android/PC); (2) muestra tutorial paso-a-paso para iOS/Safari con botón Compartir → Agregar a pantalla de inicio; (3) una vez instalado, ofrece banner secundario para activar push. Persistencia de dismissal en localStorage.
- Editor completo de Comercios (2026-02, iter 27):
  - El form de edición de AdminCommerces ahora incluye TODOS los campos que se capturan en el wizard de creación: dirección, Google Maps URL, Waze URL, video YouTube, galería de fotos (con remove), redes sociales (Facebook, Instagram, TikTok, Twitter), estado activo/inactivo.
  - AdminDashboard inicializa `commerceForm` con todos los campos por defecto (evita undefined al crear).
  - Test ids: cf-address, cf-maps, cf-waze, cf-facebook, cf-instagram, cf-tiktok, cf-twitter, cf-youtube, cf-photos-grid, cf-photo-remove-{i}, cf-status.
- Indicador de completitud de perfiles de comercio (2026-02, iter 28):
  - Helper `computeProfile(c)` calcula % basado en 15 campos canónicos (name, description, category, logo, benefit, phone, email, location, address, maps, website, FB, IG, photos, validation_code).
  - En cada tarjeta: barra de progreso con color por tono (rojo <50 / ámbar <80 / azul <100 / verde =100) + "falta: X, Y, Z..." con tooltip completo.
  - Header muestra resumen: `N completos · N incompletos · N < 50%` (chips clickeables que aplican el filtro).
  - Filtro adicional `commerce-filter-completeness` con opciones Todos/Completos/Incompletos/Bajos.
- Importación masiva Socios y Paquetes (2026-02, iter 29):
  - Backend: `GET /api/admin/members/template` y `GET /api/admin/packages/template` retornan XLSX con cabeceras estilizadas (navy header, fila de ejemplo, hoja "Instrucciones", freeze panes).
  - Backend: `POST /api/admin/members/bulk-import` y `POST /api/admin/packages/bulk-import` aceptan XLSX/CSV multipart. Soportan `dry_run=true` para preview. Parsean por labels (usuario-friendly) o keys (raw). Valida obligatorios, duplicados de contract_number, coerciona tipos (int/float/list/bool), y para socios auto-crea el usuario login con DPI como password.
  - Frontend: nuevo componente `BulkImportModal.js` reutilizable — paso 1 descarga plantilla, paso 2 sube archivo, paso 3 preview tabular con lista de errores, paso 4 confirmación y resumen final.
  - Integrado en AdminMembers (botón `bulk-import-members-btn`) y AdminPackages (`bulk-import-packages-btn`). `reloadData` dispara auto-refresh post-import.
- Exportación individual de socio (2026-02, iter 30):
  - Backend: `GET /api/members/me/export` (miembro descarga sus propios datos) y `GET /api/admin/members/{id}/export` (admin descarga datos de cualquier socio). Formato **base de datos** en una sola línea con 26 columnas exactas estilo "DATOS HANSEN": FECHA, CONTRATO, NOMBRE PROPIETARIO, EDAD, ESTADO CIVIL, NACIONALIDAD, PROFESION, DOMICILIO, DPI, DPI EN LETRAS, TELEFONO, CORREO, NOMBRE COPROPIETARIO, NACIONALIDAD, COPROPIETARIO PROFESION, COPROPIETARIO TEL, COPROPIETARIO CORREO, COPROPIETARIO INVERSION, VIGENCIA, CUOTAS, BANCO, TERMINACION, TC, NIT, NOMBRE DE FACTURACIÓN, OBSERVACIONES. Fechas formateadas DD/MM/YYYY.
  - Nuevos campos en Member model: `dpi_words`, `coowner_investment`.
  - UI Admin: nuevos inputs "DPI en letras" (`mf-dpi-words`) e "Inversión copropietario" (`mf-co-investment`).
  - También agregados a la plantilla de import masivo de socios.
  - Frontend: Botón "Descargar mis datos (Excel)" en MemberOverview (`download-my-data-btn`) y un ícono FileSpreadsheet por fila en AdminMembers (`download-member-i`).
- Fallback visual con logo Kuxtal (2026-02, iter 31):
  - Nuevo componente reutilizable `ImageWithFallback.js` que muestra el **logo Kuxtal en BLANCO** sobre fondo navy (`/icons/logo-white.png` — silueta blanca generada con PIL) cuando `src` está vacío o falla al cargar (onError). Padding `p-8` para respirar.
  - Aplicado en: HomePage (featured packages), SearchPage (resultados), TripDetailPage (hero gallery), AdminPackages (cards), CommerceDetailPage (logo). Se eliminaron las imágenes de Unsplash como fallback.
- Fix DELETE de paquetes (2026-02, iter 31):
  - `DELETE /api/packages/{id}` ahora hace un borrado real (`delete_one`) en vez de marcar `status: inactive`. Devuelve 404 si el paquete no existe.
- Precios con markup automático (2026-02, iter 32):
  - Nuevo config key `pricing_settings` con `public_markup_percent` (default 30%) y `member_markup_percent` (default 15%). Endpoints `GET/PUT /api/config/pricing-settings`.
  - Campo nuevo `agency_price` en `PackageCreate` (precio costo/agencia).
  - UI AdminPackages: sección "Precios" con 4 campos (agency/public/member/days). Muestra sugerencias live (sug. Q.XXX) arriba de cada precio y botón "Aplicar precios sugeridos" que llena ambos con un click. Banner "Markup global: público +X% · socio +Y%".
  - AdminSettings: nueva tarjeta "Porcentajes de precio" con inputs para configurar ambos markups globalmente.
  - Plantilla de import masivo de paquetes incluye la nueva columna "Precio agencia Q (costo base)".
- Recálculo masivo de precios (2026-02, iter 33):
  - Endpoints `GET /api/admin/packages/recalculatable-count` (devuelve cuántos paquetes tienen/no tienen agency_price) y `POST /api/admin/packages/recalculate-prices` (aplica los markups globales a todos los paquetes con agency_price>0).
  - UI AdminSettings: botón "Recalcular todos los paquetes con los markups actuales" (`open-recalc-btn`) abre modal de confirmación (`recalc-confirm-modal`) que muestra la fórmula y cuántos se actualizarán.
  - Protección: paquetes sin agency_price NO se tocan. Los precios custom de paquetes con agency_price se sobreescriben según el markup global.
- Autorización de comercios públicos (2026-02, iter 34):
  - POST /api/commerce público → `status: pending` (no aparece en catálogo público hasta autorización).
  - POST /api/commerce como admin → `status: active` directo.
  - GET /api/commerce filtra por status=active por defecto. Admin puede pasar `?status=pending`.
  - Nuevos endpoints `POST /api/admin/commerce/{id}/approve` y `POST /api/admin/commerce/{id}/reject`.
  - Push notification a socios solo se dispara al autorizar (no al enviar).
  - UI AdminCommerces: sub-tabs "Activos / Pendientes" con badge amber + contador. Cada card pendiente tiene botones Autorizar (verde) / Rechazar (rojo con motivo prompt).
- Redes sociales en footer (2026-02, iter 34):
  - Nuevo config key `social_links` con Facebook, Instagram, TikTok, X/Twitter, YouTube, LinkedIn, WhatsApp.
  - Endpoints `GET/PUT /api/config/social-links`.
  - AdminSettings card "Redes sociales (footer)" con 7 inputs + botón guardar.
  - HomePage footer renderiza solo los íconos de las redes que tienen URL.
- Edición de usuarios + reset de contraseña (2026-02, iter 35):
  - Nuevos endpoints `PUT /api/admin/users/{id}` (nombre, email — valida duplicados y protege al admin principal) y `POST /api/admin/users/{id}/reset-password` (min 6 chars).
  - AdminUsers.js: botones Editar (Pencil) y Resetear contraseña (KeyRound) disponibles para todos los usuarios del listado.
  - EditUserModal: edita nombre + email con validación.
  - ResetPasswordModal: input con show/hide, confirmación, botón "Generar aleatoria" (copia al portapapeles al guardar).
- Log de auditoría de cambios de usuario (2026-02, iter 35):
  - Nueva colección `user_changes_audit` con campos admin_id/email/name, target_user_id/email, action, details (diff before/after), ip, user_agent, timestamp.
  - `log_user_audit()` se ejecuta en: create_user, update_profile, reset_password, toggle_active, update_permissions, delete_user.
  - Nuevo endpoint `GET /api/admin/audit/user-changes?target_user_id=&admin_id=&action=&limit=`.
  - AdminUsers.js: botón Historial (History) por fila abre `AuditHistoryModal` con lista timeline (badges coloridos por tipo, fecha local, admin ejecutor+IP, diff visual con before/after tachado/verde para profile/permissions).
  - Índices MongoDB en target_user_id / admin_id / timestamp.
- Enforcement RBAC por módulo (2026-02, iter 23):
  - `require_role(*roles, permission="X")` extendido: super_admin bypass, cualquier otro rol requiere `user.permissions[X]==True` o retorna 403 "No tienes permiso para X".
  - 40 endpoints protegidos (POST/PUT/DELETE): members, clients, packages, commerce, categories, clubs, regalias, quotations admin, announcements, push/send, referrals, vacation-requests, config/*, admin/commerce approve/reject.
  - Backfill: admin principal es super_admin (bypass). Admins nuevos arrancan con defaults `{dashboard, quotations, clients, members}`.
  - Protecciones extra toggle-active: admin normal no puede togglear super_admin ni al ADMIN_EMAIL principal; nadie puede desactivarse a sí mismo (anti-lockout).
  - Login `/api/auth/login` ahora incluye `permissions` en response (antes causaba que módulos no aparecieran hasta refrescar).
- UI Security polish (2026-02, iter 35):
  - Credenciales de prueba removidas de LoginPage.
  - `PWAReinstallBanner.js`: banner amber en Android + standalone que explica cómo reinstalar la app cuando Google Play Protect bloquea WebAPKs viejos. Descartable con localStorage versionado (`WEBAPK_STALE_BEFORE`).
  - Fix permisos UI: `AdminDashboard.hasPerm()` sin fallback permisivo — admin sin permissions configurados solo ve Dashboard.
- Package Visibility (2026-02, iter 21): campo `visibility` = public|internal. Endpoints públicos filtran visibility=internal. Admin management usa ?include_internal=true. AdminPackages con filtro Todos/Público/Interno + radio en form.
- Quotations tracking & filters (2026-02, iter 21): created_at, created_by_id, created_by_name ('Sistema (web pública)' para web pública, nombre del admin para POST /quotations/admin). GET /api/quotations soporta created_by, date_from, date_to. UI con quot-date-from/to, quot-filter-creator, quot-clear-filters, meta muestra '· por <creador>'.
- Code Quality: Component refactoring, lazy loading, ErrorBoundary, SEO OG tags, 30+ MongoDB indexes
- HomePage rediseño premium "Club Exclusivo" (2026-02, iter 37):
  - Hero rediseñado con imagen de piscina infinita + título "Más que viajes, es pertenecer" (PERTENECER en verde lima) + subtexto + 2 CTAs "Hazte miembro" y "Conoce más" + mini-strip de 4 beneficios con iconos.
  - Buscador Expedia-style movido a una sección dedicada debajo del hero, flotando con shadow y tabs (Paquetes/Alojamientos/Experiencias), seguido por chips de destinos populares.
  - Nueva sección Kuxtal Club (fondo navy #0D2B45 + acentos lima): "Tu membresía, un mundo de beneficios" con collage 2x2 de imágenes y tarjeta de membresía flotante sobre el collage.
  - Sección "Disfruta más, pagando menos" con 4 cards de beneficios (Precios Exclusivos, Promociones Especiales, Experiencias Únicas, Beneficios con Aliados).
  - Sección "Destinos Destacados" con cards mejoradas (navy/lime accents, precio en navy).
  - Nueva sección "Nuestros Aliados" con logos tipo serif horizontales sobre navy (La Estancia, azul, mío, La Cabrera, BODYTECH).
  - CTA final: imagen paradisíaca con overlay navy uniforme, "El mundo es mejor cuando eres miembro" + botón lima + 3 tarjetas beneficios laterales (Membresía 100% Digital, Acceso Inmediato, Respaldo Kuxtal).
  - Footer premium con logo Kuxtal, 4 columnas (Navegación, Ayuda, Contáctanos), redes sociales y badges App Store / Google Play (SVG inline).
  - Paleta aplicada: navy #0D2B45 + lime #8CC63F + blanco. Token CSS --primary preservado para no afectar otras páginas.
- Nuevo icono PWA (2026-02, iter 37):
  - Reemplazados todos los iconos PWA con el nuevo icono oficial (K blanco + avión lima sobre fondo navy): sizes 72/96/128/144/152/180/192/256/384/512 + 512-maskable (con safe-zone navy padding 10%) + apple-touch-icon (180) + favicon.ico (multi-size 16/32/48).
  - Theme_color manifest y msapplication-TileColor actualizados a #0D2B45.
  - Service Worker bump a v8 para forzar re-cache.
- CommerceDetailPage luxury redesign (2026-02, iter 36):
- HomePage ultra-premium polish (2026-02, iter 38):
  - Paleta extendida con acentos dorados sutiles (gold #D4AF5A + champagne #E5C989) sobre navy+lime para convivir con el logo manteniendo prestigio tipo club privado.
  - Hero: eyebrow "CLUB PRIVADO DE VIAJES · MIEMBROS" en dorado, "es pertenecer" en italic serif Playfair Display con gradiente lime metálico, divisor art-deco sparkle dorado, textura arabesca dorada sutil y hairlines doradas arriba.
  - Kuxtal Club section: gradiente navy→navy_deep + dot-grid dorado arabesco; título "un mundo de beneficios" en italic Playfair con gradiente dorado; botón "Ver beneficios" con gradiente dorado metálico (antes navy sólido).
  - Tarjeta membresía rediseñada estilo **GOLDEN MEMBER**: fondo oscuro marrón chocolate con patrón arabesco cruzado dorado, borde dorado metálico, hairlines doradas, logo Kuxtal Club con glow, "ACCESO EXCLUSIVO" en texto champagne tracking amplio — visualmente alineada con el portal de socios.
  - Disfruta más, pagando menos: eyebrow "BENEFICIOS EXCLUSIVOS" con sparkles dorados a ambos lados; "más" y "menos" en italic serif; cards con hairline dorada hover.
  - Destinos destacados: eyebrow "DESCUBRE LA COLECCIÓN" dorado; fondo gradiente cream marble; "destacados" en italic serif lime.
  - Aliados: fondo gradiente navy_deep→navy con dot-grid dorado, hairlines doradas arriba/abajo, eyebrow con sparkles; logos en Playfair Display serif, "y más aliados especiales" en italic dorado.
  - CTA final: overlay más dramático, "cuando eres miembro" en italic Playfair con gradiente dorado, eyebrow "ÚNETE AL CLUB" sparkles dorados, 3 beneficios laterales ahora en dorado (Crown/Lock/ShieldCheck) con títulos champagne.
  - Google Fonts: agregado Playfair Display (600/700/900 + italic) al index.html.
  - Aplicado el mismo tema "Amex Black / Luxury" de BenefitsPage a la vista interna de comercio.
  - Fondo radial obsidiana (#1a1a24 → #0B0B0F → #050507) con acentos dorados (#D4AF5A) y texto crema (#F4EBD0).
  - Todas las secciones refactorizadas: header card, video, galería, descripción, beneficio (card signature dorado), redes sociales, ubicación con botones Google Maps/Waze dorados (antes azul/celeste), contacto con teléfono en tono dorado (antes esmeralda), validar visita con input oscuro y botón dorado, raspa y gana con gradiente dorado sobre fondo oscuro, y promociones activas con tarjetas obsidiana.
  - Estados de carga y error ("comercio no encontrado") también en tema oscuro.

## Code Review Status (Applied)
- [x] XSS: DOMPurify.sanitize with strict ALLOWED_TAGS/ALLOWED_ATTR whitelist
- [x] Test secrets: Moved to os.environ.get() with fallback defaults
- [x] Weak random: secrets.choice for coupons, secrets.randbelow for scratch card
- [x] Empty catches: 10+ catch blocks now log console.error/console.warn
- [x] Boolean comparisons: == True/False → is True/is False in tests
- HomePage responsive & footer cleanup (2026-02, iter 39):
  - Footer limpiado: removida la sección "Descarga nuestra app" (App Store/Google Play) y la columna "Ayuda" (FAQ/Terms/Privacy/Contact — rutas inexistentes). Footer ahora tiene 3 columnas: Brand+redes, Navegación (Inicio/Viajes/Kuxtal Club/Aliados/Acceso socios — todas con ruta real), Contáctanos (Guatemala, email como mailto, WhatsApp).
  - "Membresía 100% Digital" → "Plataforma Digital de Socios" (descripción más honesta).
  - Responsive mobile mejorado en TODAS las secciones:
    * Hero: tamaños de texto escalonados (4xl→5xl→6xl→7xl), CTAs full-width en mobile, overlay top-to-bottom en móvil para legibilidad total.
    * Buscador: tabs scrolleables horizontalmente, fecha+viajeros en fila, Destino en fila arriba, botón Buscar full-width en móvil.
    * Kuxtal Club: en móvil la tarjeta Golden Member va primero centrada, luego el collage 2x2 debajo (no apilado sobre collage como en desktop).
    * Disfruta más / Aliados / CTA Final: titulares escalonados, separadores art-deco más cortos en mobile, padding vertical reducido, cards del CTA con iconos y textos más compactos.
    * Nuevos breakpoints: xs:text-4xl para evitar cortes en pantallas 320-390px.
- [x] Note: is None/is not None patterns in server.py are CORRECT Python idioms (not changed)

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0ab / FITLIF01
- Perks section rediseño dark-gold (2026-02, iter 40):
  - Sección "Disfruta más, pagando menos" migrada de fondo blanco/slate a estilo dark-gold premium matching Kuxtal Club y CTA final.
  - Fondo gradiente navy_deep→navy→navy_deep con radials dorados y dot-grid arabesco.
  - Cards con gradiente navy profundo (#0F1F33→#061220), bordes dorados sutiles, corner glow dorado en hover, y hairline dorada al top.
  - Iconos dorados (antes lime) sobre fondo oscuro con inset dorado.
  - Títulos en champagne con mini divisor art-deco (sparkle dorado).
  - "más" y "menos" ahora en italic serif Playfair con gradiente dorado (antes lime verde) — consistencia total con el resto de titulares luxury.
  - Mobile: grid **2x2 compacto** (antes 1 columna stack infinito), padding reducido, íconos w-11, títulos 11px, descripción 10px con line-clamp-3. Mucho más denso y escaneable.
- Delete Secret: BORRAR YA

## Pending / Backlog
- [ ] FASE 2 Cotizaciones: envío por email con Resend (requiere RESEND_API_KEY del usuario)
- [ ] FASE 3 Cotizaciones: PDF de recibo de pago interno
- Club collage con storytelling (2026-02, iter 41):
  - 4 imágenes del collage Kuxtal Club ahora tienen caption dorado + serif italic que cuentan la propuesta de valor del club: **Destinos** (Paraísos exclusivos), **Resorts** (Estadías premium), **Experiencias** (Gastronomía & eventos), **Vuelos** (Tarifas preferenciales).
  - Reemplazada imagen de mezquita (no relacionada con Guatemala/Caribe) por atardecer playa caribe y avión despegando en pista.
  - Cada tarjeta tiene hairline dorada top, gradiente oscuro bottom→transparent para legibilidad, hover con zoom sutil (scale-110).
  - Ring dorado en borde (antes ring-white/10).
- [ ] Backend refactoring: server.py ~2729 líneas — dividir en routers (auth/admin_users/packages/quotations/members/regalias/clubs/commerce)
- [ ] Exponer FEATURE_KEYS en frontend desde GET /api/admin/feature-keys en lugar de duplicar lista en AdminUsers.js
- [ ] DELETE endpoint para quotations (actualmente no existe, 2 quotations TEST quedaron en DB)
- Footer dark premium (2026-02, iter 42):
  - Footer migrado de blanco a dark navy premium (gradiente NAVY_DEEP→#040f1c) con radials dorados y dot-grid arabesco.
  - Logo Kuxtal invertido a blanco (brightness-0 invert), tagline en italic con color champagne.
  - Redes sociales con fondo dorado sutil y borde dorado (antes navy liso).
  - Separador art-deco dorado (hairline + sparkle) entre brand y columnas.
  - **Mobile**: layout compactado — brand centrado con redes, luego 2 columnas apretadas (Nav + Contacto) en lugar de 1 columna stack. Padding-bottom pb-20 para no quedar tapado por el botón chat flotante.
  - Títulos de columnas en color dorado (antes navy).
  - Íconos dorados (antes lime).
  - Bottom bar con border dorado sutil y "Cada destino, una historia" en italic serif Playfair dorado.
  - Transición del CTA final al footer ahora es suave (ambos navy dark) unificando toda la estética.
- [ ] Backend refactoring: import_package_from_drive() complexity (break into smaller functions)
- [ ] Frontend refactoring: CommercePortal.js (491 lines), ChatPage.js, HomePage.js
- Code review fixes backend (2026-02, iter 43):
  - **Ruff warnings eliminados** (0 errores ahora): E701 (2 casos de `if x: continue` en línea, 2 casos de `if x: query = ...`) y F541 (f-string sin placeholder).
  - **`detect_mime_type` refactorizado** con dict `_EXT_MIME_MAP` (extensión→mime) + tupla `_CONTENT_TYPE_KEYWORDS` (keyword→mime fallback). Complejidad 15→3, más rápido y mantenible. Tests manuales pasan (6/6 casos).
  - **`list_packages` refactorizado**: extraídos `_is_admin_request`, `_apply_package_range_filter`, `_apply_package_search_filter`, + `_PACKAGE_SORT_MAP` (dict lookup en lugar de 5 elif). Complejidad 18→6, 62 líneas→48.
  - **`create_quotation` refactorizado**: extraídos `_resolve_member_for_quote`, `_attach_member_to_quote`, `_attach_package_to_quote`. Complejidad 15→5.
  - **`update_commerce_category` refactorizado**: extraídos `_validate_category_rename`, `_upsert_system_category_icon`, `_apply_custom_category_update`. Complejidad 15→4.
  - **`toggle_commerce_active` refactorizado**: extraídos `_can_toggle_commerce` (RBAC puro), `_broadcast_commerce_first_activation` (efecto colateral). Complejidad 14→3.
  - **`_parse_uploaded_rows` refactorizado**: extraídos `_build_label_to_key_map`, `_row_has_any_value`, `_map_row_values`, `_parse_csv_rows`, `_parse_xlsx_rows`. Complejidad 25→4.
  - **`members_bulk_import` refactorizado**: extraídos `_load_existing_member_contracts`, `_validate_member_row`, `_build_member_doc_from_row`, `_insert_member_with_login`. Complejidad 27→6, 70 líneas→35. Eliminado el `existing_dpis` set que nunca se usaba (dead code).
  - **Tests `== True/False` corregidos**: 17 occurrences en 5 archivos migradas a assertions idiomáticas (`assert x`, `assert not x`, `is True`, `is not True`).
  - Verificado post-refactor: `/api/packages` con filtros + sort + `/api/commerce/categories` + `/api/quotations` responden correctamente.
- [ ] Fix pre-existing test files test_kuxtal_api.py / test_coupons.py (missing BASE_URL)
- [ ] Configurar dominio kuxtaltravelgt.com
- [ ] Sistema de reviews/testimonios (P1)
- [ ] Mapa interactivo de destinos (P2)
- [ ] Reportes exportables de cupones canjeados (P2)

- Backend modularización — Fase 1 (2026-02, iter 44):
  - Creado `/app/backend/core.py` (229 líneas) con utilidades compartidas: MongoDB client/db, JWT helpers (get_jwt_secret, create_access_token, create_refresh_token, set_auth_cookies), password helpers (hash_password, verify_password), dependencies (get_current_user, require_role, verify_delete_code), serialize_doc, storage (init_storage, put_object, get_object), constants (APP_NAME, VAPID keys, COOKIE_SECURE, DELETE_SECRET), logger.
  - Creado `/app/backend/routers/auth.py` (149 líneas) con las 4 rutas de autenticación (`/api/auth/login`, `/member-login`, `/me`, `/logout`) y los modelos Pydantic `LoginRequest` + `MemberLoginRequest`.
  - `member_login` refactorizado internamente con helpers `_resolve_member_auth` y `_find_or_create_member_user` (complejidad bajó ~10→4).
  - `server.py` ahora importa todo desde `core` y monta el router con `app.include_router(auth_router.router)`. Eliminadas las 4 rutas y las definiciones duplicadas de helpers.
  - `server.py` bajó de 3766 → 3605 líneas (-161, ~-4.3%). Base infraestructural lista para extraer los siguientes routers (packages, quotations, members, commerce, config).
  - Verificado post-refactor: los 4 endpoints auth responden exactamente igual (admin login, member login con KT-001, /me con Bearer, logout), credenciales inválidas devuelven 401, y los endpoints no-auth (`/api/packages`) siguen funcionando sin regresiones.
- Backend modularización — Fase 2 (2026-02, iter 45):
  - Creado `/app/backend/routers/packages.py` (589 líneas) con: 7 rutas (list/get/create/update/toggle-status/delete/import-from-drive), modelo `PackageCreate`, helpers de search (`normalize_search`, `_PACKAGE_SORT_MAP`, `_is_admin_request`, `_apply_package_range_filter`, `_apply_package_search_filter`), helpers de Drive import (`extract_gdrive_file_id`, `download_gdrive_file`, `detect_mime_type` con mappings, `extract_text_from_pdf/docx/xlsx`, `extract_images_from_pdf`), y helpers de AI extraction (10 funciones privadas). Prompt `PACKAGE_EXTRACTION_PROMPT` también movido.
  - `_broadcast_news` sigue en `server.py` y se importa tarde en `create_package` para evitar dependencia circular.
  - `server.py` bajó **3605 → 3065 líneas** (−540, acumulado desde Fase 1: **−701 líneas, −18.6%**).
  - Fixed 6 f-strings sin placeholder en tests (ruff --fix).
- Backend modularización — Fase 3 (2026-02, iter 46):
  - Creado `/app/backend/routers/quotations.py` (537 líneas) con:
    - 11 rutas: `POST /quotations` (public), `GET /quotations/public/{token}`, `POST /quotations/public/{token}/decision`, `GET /quotations`, `POST /quotations/admin`, `PUT /quotations/{id}`, `POST /quotations/{id}/timeline`, `PUT /quotations/{id}/respond`, `GET /quotations/{id}/share`, `GET /config/quotation-settings`, `PUT /config/quotation-settings`.
    - Modelos Pydantic: `QuotationRequest`, `QuotationSettings`.
    - Helpers privados (10): `_default_valid_days`, `_upsert_client`, `_resolve_member_for_quote`, `_attach_member_to_quote`, `_attach_package_to_quote`, `_attach_package_snapshot`, `_build_admin_quotation_doc`, `_fill_missing_contact`, `_attach_contact_from_source`, `_build_list_query`.
    - Constante `_STATUS_LABELS` extraída de `update_quotation`.
  - **Bug fix de regresión**: `list_quotations` tenía indentación rota (fruto de fix anterior de E701) — el `if date_from or date_to:` nunca se respetaba y `date_query` podía ser referenciado antes de asignación. Arreglado con helper `_build_list_query` que maneja correctamente los 4 estados posibles (ambos/solo-from/solo-to/ninguno).
  - `update_quotation` refactorizada con el mapping extraído `_STATUS_LABELS` (antes dict inline).
  - `_send_push_raw` sigue en server.py y se importa tarde en `public_quotation_decision`.
  - `server.py` bajó **3065 → 2618 líneas** (−447 en esta fase, **−1148 acumulado, −30.5% desde el inicio del refactor**).
  - Verificado end-to-end (11 pruebas): crear público con KT-001 auto-detectado, vista pública con viewed_at, list filtered (23 pending con el fix de fechas), update con status+timeline, nota manual, respond, public decision approve/push notification al admin, share con WhatsApp+mailto URLs, config GET/PUT, regresión packages OK.
  - Verificado end-to-end: list con filtros, get por id, create con auth, toggle-status con razón, delete con delete_code, 422 para body vacío, regresión auth OK.
- Search band luxury redesign (2026-02, iter 47):
  - Buscador migrado de fondo blanco/slate a **dark luxury navy+gold** coherente con el resto del sitio.
  - Card: gradiente NAVY→NAVY_DEEP, radial dorado sutil, hairlines doradas arriba/abajo, border dorado.
  - Tabs activos: **gradiente dorado metálico** (antes navy sólido) con shadow dorada.
  - Inputs: fondo `black/30` traslúcido, border `GOLD/33`, íconos (MapPin, Calendar, Users, ChevronDown) en dorado, `color-scheme:dark` para el date picker nativo.
  - Labels ("Destino", "Fecha", "Viajeros") en color dorado con tracking ampliado.
  - Botón "Buscar": gradiente dorado metálico con shadow dorada (antes navy sólido).
  - Chips "Destinos populares": dark glass (navy/80 + blur), border dorado, texto champagne, hover transiciona a fondo dorado translúcido. Ícono MapPin dorado.
  - Resultado: transición perfecta hero→buscador→Kuxtal Club sin ruptura visual.
- Destinos destacados "Luxury Magazine" (2026-02, iter 48):
  - Rediseño completo estilo revista de lujo impresa (Condé Nast Traveler vibes). Fondo cream mantenido como respiro light entre secciones dark, con hairlines doradas marco.
  - Título "Destinos **destacados**" con italic serif Playfair gradiente dorado metálico (antes lime verde).
  - Cards aspect 4:5 editorial (antes 4:3), ring dorado sutil, hairline top en hover, shadow dorada.
  - Badge "EXCLUSIVO" dorado metálico con Sparkle (antes "DESTACADO" verde lima).
  - Pill precio: gradiente dorado + Playfair serif (antes navy sticker).
  - Estrella rating dorada, descripción en italic Playfair, "VER DETALLE" dorado en caps tracking editorial.
  - Botón "VER TODOS LOS DESTINOS" pill dorado metálico grande + tagline italic Playfair "+ de 50 destinos curados, 6 continentes".
  - Ritmo cinematográfico logrado: dark navy → cream luxury magazine → dark navy continuo.
- TripDetailPage rediseñada luxury magazine (2026-02, iter 49):
  - Reescrita completa (305→307 líneas) siguiendo la misma línea navy+gold+cream del HomePage.
  - Hero con ring dorado + shadow, hairlines, gallery controls navy+champagne, dots pill dorado. Badges navy_deep+champagne y "EXCLUSIVO" dorado metálico.
  - Título en **Playfair italic serif** navy (antes sans). Meta row con pill badges blancos con border dorado + íconos dorados (antes texto plain).
  - 3 SectionCards (Descripción/Qué incluye/Itinerario) con hairline top dorada, eyebrow sparkle caps, títulos Playfair.
  - "Qué incluye": íconos check dorados metálicos circulares sobre fondo dorado sutil (antes verde emerald).
  - "Itinerario": círculos dorados metálicos numerados en Playfair con línea vertical dorada conectora + eyebrow "DÍA N" + títulos Playfair.
  - **Price Card sidebar DARK luxury**: navy gradient + "Q.XX,XXX en Playfair serif con gradiente dorado metálico gigante" + PRECIO SOCIO pill dorado + countdown estilo luxury + specs en caps champagne con íconos dorados + botón "SOLICITAR COTIZACIÓN" dorado metálico.
  - Garantía Kuxtal con 4 checks dorados metálicos.
  - Modal cotización: backdrop navy + blur, ring dorado, eyebrow "SOLICITUD PRIVADA", título Playfair italic, inputs cream con borders dorados, botones luxury.
- SearchPage (`/search`) rediseñada luxury magazine (2026-02, iter 50):
  - Reescritura completa de `/app/frontend/src/pages/SearchPage.js` aplicando el mismo sistema visual navy+gold+cream que HomePage "Destinos destacados" y TripDetailPage.
  - Fondo: gradiente cream (#FAF8F3→#F3EEE2) con vetas doradas sutiles (opacity 0.035) para continuidad con la colección.
  - Header sticky `top-16` glass cream 92% + blur + hairline dorada superior, shadow sutil.
  - Inputs pill (h-12 rounded-full) con border dorado `GOLD/55`, ícono Search/MapPin en dorado, placeholder Playfair italic.
  - Botón Filtros: outline dorado cuando inactivo, gradiente dorado metálico cuando activo (misma plantilla que CTAs luxury del Home).
  - Category pills navy con `CHAMPAGNE` + inset gold al estar activas (antes bg-primary blanco). Inactivas outline sutil navy.
  - Expanded filters: labels en caps amber con tracking 0.2em, inputs white+inset gold, select con font-bold.
  - Hero de resultados: eyebrow "LA COLECCIÓN KUXTAL" con sparkle dorada + hairlines, H1 Playfair italic gradiente dorado ("Todos los *destinos*" / "Resultados para *"..."*" / "Destinos en *País*"), subtitulo italic Playfair "N experiencias encontradas".
  - Sort inline en pill blanco con border dorado.
  - Cards 4:5 editoriales idénticas al HomePage: ring dorado + shadow hover gold, hairline top en hover, badge categoría navy_deep+champagne, badge "Exclusivo" dorado metálico, precio pill dorado Playfair, ribbon "Socio · Q.X" navy con Sparkles dorada, rating gold star, descripción Playfair italic, footer con MapPin + Users compacto + "Ver detalle →" dorado caps.
  - Skeleton de loading en cream con shimmer dorado (antes gris plain).
  - Empty state editorial: círculo dorado con ícono Search, eyebrow "SIN COINCIDENCIAS" con sparkles laterales, H2 Playfair italic, CTA pill dorado metálico "Limpiar filtros y ver todo".
  - Resultado: journey Home → Search → Detalle 100% unificado en el lenguaje Luxury Magazine / Amex Black. Verificado con screenshot tool (1920x800) en preview URL.

- Aliados del Home — dinámicos + curaduría editorial (2026-02, iter 51):
  - **Backend**: Campo `featured: bool = False` en `CommerceCreate`. Filtro `?featured=true` en `GET /api/commerce`. Nuevo `PUT /api/commerce/{id}/toggle-featured` (admin, permission=commerce) con cap duro `COMMERCE_FEATURED_LIMIT = 8` (HTTP 400 con mensaje claro si se excede).
  - **HomePage**: Reemplazado array estático `PARTNERS` por fetch a `/api/commerce`. Featured first con fallback a todos los activos si no hay curaduría. Cada card es `<Link to=/commerce/:id>` con logo (filter invert) o nombre Playfair + categoría champagne caps. CTA "y N+ aliados más" → `/benefits` si total > límite.
  - **AdminCommerces**: Botón estrella dorada (`toggle-featured-{i}`) junto al toggle is_active. Badge ámbar "Destacado" en el card. Toast backend error si se excede cap. Verificado con 6 comercios (toggle/untoggle, cap 8, fallback).
  - Resultado: "Nuestros aliados" es ahora 100% real del admin y curable sin tocar código.

- Manuales PDF descargables con branding Kuxtal (2026-02, iter 52):
  - 3 manuales en `/app/manuales/`: `01_Manual_Administrador.md` (18 secciones), `02_Manual_Socio.md` (17), `03_Manual_Comercio.md` (14) + README. Reflejan funciones reales: cotizaciones, socios con auto-user, paquetes, comercios con featured/cap 8, cupones QR/raspables, regalías, clubs, push, permisos, código `BORRAR YA`.
  - Generador PDF: `/app/backend/manuals_pdf.py` usa `markdown` + `weasyprint`. CSS branding Kuxtal: navy `#0D2B45` H1/H2, oro `#D4AF5A` accents/borders/hairlines, Playfair Display H1-H3 italic, footer "Kuxtal Travels · pag. N/total" con número, header derecho con título del doc en oro caps. Cache por mtime de archivo.
  - Endpoint: `GET /api/admin/manuals/{role}` (admin-only) → PDF binario con Content-Disposition. Verificado los 3 endpoints: admin 88KB, member 70KB, commerce 75KB.
  - UI: AdminSettings → nuevo card "Manuales del sistema" con 3 botones de descarga (ícono Download ámbar, label + descripción, hover ámbar). data-testid: `download-manual-{role}` y `manuals-card`.
  - Resultado: equipo Kuxtal puede descargar y compartir manuales por WhatsApp/email sin que el contenido quede desactualizado (lee el .md vivo cada vez que cambia).

- Manuales online interactivos en cada portal (2026-02, iter 53):
  - **Backend**: `GET /api/manuals/{role}/markdown` (md vivo) + `GET /api/manuals/{role}/pdf` (descarga). Permisos role-aware: admin ve los 3, member solo `member`, commerce solo `commerce`.
  - **Frontend**: nueva página `ManualPage.js` (`/manual/:role`) con react-markdown + remark-gfm. Hero editorial Playfair italic, sidebar TOC sticky con search en vivo, scroll-spy IntersectionObserver, drawer mobile. Components custom: H2 navy con barra dorada lateral, H3 Playfair italic amber, blockquote cream border-oro, code navy/champagne, tablas luxury con header navy + champagne caps. Botón descargar PDF arriba y al pie con CTA dorado metálico.
  - **App.js**: ruta `/manual/:role` protegida por todos los roles autenticados.
  - **Accesos**: AdminSettings → cards con par "Ver online + PDF" por rol; MemberDashboard header → pill "Manual" → `/manual/member`; CommercePortal header → pill "Manual" → `/manual/commerce`.
  - Verificado: render desktop con TOC + content luxury, scroll-spy resaltando sección activa en oro. Endpoints curl OK.

- Bot de WhatsApp con OpenAI + Kapso.ai (2026-02, iter 54):
  - **Backend**: `/app/backend/bot_service.py`. Config en `db.config["bot_settings"]` (openai_api_key, kapso_*, system_prompt, knowledge_base, modelo, toggles include_packages/commerces/member). Builder dinámico del system prompt (prompt + KB editable + paquetes activos + comercios + datos del socio si su WA coincide). Conversation store en `db.bot_conversations` (multi-turn por session_id `wa:<phone>`).
  - **Endpoints**: `GET/PUT /api/admin/bot/config` (mascara secrets), `POST /api/admin/bot/test`, `GET/DELETE /api/admin/bot/conversations[/{id}]`, `POST /api/webhooks/kapso/whatsapp` (verifica HMAC-SHA256, extrae mensaje Meta-style, OpenAI vía emergentintegrations LlmChat con key del cliente, responde por Kapso `POST /meta/whatsapp/messages`).
  - **Frontend**: nueva pestaña "Bot WA" (icon Bot) en AdminDashboard. `AdminBot.js`: hero navy + toggle ON/OFF, secciones OpenAI/Kapso/KB/Prompt, probador en vivo, listado de conversaciones, eye-toggle para secrets, masked previews `xxxx…last4`, copy webhook URL.
  - **Permisos**: feature_key `bot` agregada. Manual admin actualizado con sección 14B (guía + costos por modelo).
  - Verificado: feature-keys incluye 'bot', UI renderiza, GET/PUT config OK, tester deshabilitado hasta guardar API key. Falta prueba E2E con keys reales del usuario.

- Producción restaurada + cuentas admin sembradas (2026-04-28, iter 55):
  - **Bug fix crítico de deploy**: agregados `weasyprint==68.1` y `Markdown==3.10.2` (+ deps: pyphen, tinycss2, tinyhtml5, cssselect2, pydyf, fonttools, brotli, zopfli, cffi) a `requirements.txt`. El backend productivo crasheaba al arrancar con `ModuleNotFoundError: No module named 'weasyprint'` porque solo se había instalado en el preview.
  - **Import lazy** de weasyprint en `manuals_pdf.py`: backend arranca sí o sí aunque el contenedor productivo no tenga libs del sistema (pango/cairo). Endpoints PDF devuelven 503 elegante si fallan. Los manuales online (`/manual/:role`) siguen funcionando porque solo usan markdown.
  - **Seed de cuentas admin**: en `seed_admin()` se siembran automáticamente 3 cuentas en cada arranque (solo si no existen): `admin@kuxtaltravels.com` (super_admin), `kclub1@kuxtaltravels.com` y `agente1@kuxtaltravels.com` (admin). `test_credentials.md` actualizado con todas.
  - **Endpoint de rescate** `POST /api/auth/rescue-password` con guard via `RESCUE_SECRET` env var: permite resetear cualquier cuenta admin pasando secret + email + new_password. Util cuando una cuenta ya existe con otra password en producción.
  - **Verificado en producción** (`https://kuxtaltravelgt.com`): los 3 logins admin responden HTTP 200 con token JWT válido. Backend responde paquetes reales del cliente.

- Acceso admin a portales + envío de credenciales (2026-05-06, iter 56):
  - **Backend** (`/app/backend/routers/auth.py`): nuevos endpoints admin-only:
    - `POST /api/auth/impersonate/member/{id}` → genera token `member` para entrar al portal del socio. Crea fila en `users` si no existe (primer login). Setea cookies del socio via `set_auth_cookies`.
    - `POST /api/auth/impersonate/commerce/{id}` → idem para comercios (`role="commerce"`).
    - `POST /api/auth/restore-admin` (body: `{admin_token}`): valida JWT del admin previo, verifica role super_admin/admin, re-establece cookies del admin. Permite salir de impersonación sin re-login.
  - **Frontend**:
    - `CredentialsModal.js` (componente reusable kind="member"|"commerce"): muestra credenciales (Contrato+DPI / ID+Código), reveal toggle (eye), copy individual, **mensaje sugerido prerellenado** con sitio + credenciales, botones WhatsApp (`https://wa.me/{phone}` con +502 default si 8 dígitos), Email (`mailto:` con asunto y body), Copiar todo, e **Ingresar al portal** (impersonación + redirect a `/member` o `/commerce-portal`).
    - `ImpersonationBanner.js` (sticky `fixed top-0 z-[60]`): aparece cuando `localStorage.kuxtal_admin_token` está presente. Botón "Volver al admin" llama `restore-admin`, restaura token y redirige al `/admin`.
    - CSS: `html.impersonating` empuja navbar a `top:36px` y body a `padding-top:36px`.
    - `AuthContext.logout` limpia también `kuxtal_admin_token` y `kuxtal_admin_return`.
  - **Integración UI**: `AdminMembers.js` y `AdminCommerces.js` agregan botón ícono `KeyRound` en cada fila/card (`credentials-member-{i}` / `credentials-commerce-{i}`).
  - **Verificado**: curl admin login → impersonate member/commerce devuelve token + redirect ✅; admin restore con token vuelve al rol super_admin ✅; member NO admin recibe 403 al intentar impersonar ✅; E2E playwright: modal abre, impersonación lleva a /member con banner, "Volver al admin" regresa a /admin ✅.

- Portal del socio: limpieza UI (2026-05-06, iter 56):
  - Removido botón "Descargar mis datos (Excel)" del header de Mi Membresía (`MemberOverview.js`).
  - Nueva sub-sección **OBSERVACIONES** dentro del cuadro de Inversión (separador hairline navy). Si el socio no tiene inversión pero sí observaciones, se muestra como tarjeta independiente (`col-span-2`).
