# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, seccion Kuxtal Club para beneficios, portal de socios, CRM admin, portal de comercios, referidos, chat, analytics, importacion AI de paquetes.

## Architecture
- Backend: FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- Frontend: React 18 + Tailwind + Shadcn UI + Recharts + React.lazy
- Auth: JWT (httpOnly cookies + localStorage Bearer token fallback)
- AI: Gemini 2.5 Flash (document/image analysis, package extraction)
- PWA: manifest.json + service worker v3

## All Implemented Features

### Core (Phase 1-4): Public website, Member portal, Admin CRM, Commerce, Auth, Push, PWA, Chat, Referrals, Analytics
### Security (Phase 5-6): XSS fix, component refactoring, lazy loading, ErrorBoundary, SEO
### AI Import (Phase 7-9): Individual + Batch import from Google Drive, PDF image extraction (PyMuPDF), multi-format
### Website Redesign (Phase 8): Expedia-style homepage, search with filters, trip detail with gallery/itinerary

### Kuxtal Club Section (Phase 10) - DONE
- [x] Premium dark-themed section with Kuxtal Club logo prominently displayed
- [x] Gold gradient title "Tu tarjeta de beneficios exclusivos"
- [x] Stats: 150+ Comercios, 12 Categorias, 50% Hasta descuento
- [x] CTA: "Explorar Beneficios" (gold button) + "Acceso Socios" (outline)
- [x] 3x2 category grid with colored borders: Restaurantes, Belleza, Deportes, Mascotas, Salud, Diversion
- [x] Each category links to /benefits?category={name}
- [x] Dark premium background with subtle dot pattern

## Logos
- Kuxtal Travel: https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif
- Kuxtal Club: https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA

## Pending / Backlog
- [ ] Pagina de Beneficios (/benefits) mejorada con logo Kuxtal Club
- [ ] Renombrar "Beneficios" a "Kuxtal Club" en navbar
- [ ] Configurar dominio kuxtaltravelgt.com
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Sistema de reviews/testimonios
