# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, seccion Kuxtal Club para beneficios, portal de socios, CRM admin, portal de comercios, referidos, chat, analytics, importacion AI de paquetes.

## Architecture
- Backend: FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- Frontend: React 18 + Tailwind + Shadcn UI + Recharts + React.lazy
- Auth: JWT, AI: Gemini 2.5 Flash, PWA: SW v3

## All Implemented Features

### Core (Phase 1-4): Website, Member portal, Admin CRM, Commerce, Auth, Push, PWA, Chat, Referrals, Analytics
### Security (Phase 5-6): XSS fix, refactoring, lazy loading, ErrorBoundary, SEO
### AI Import (Phase 7-9): Individual + Batch Google Drive, PDF image extraction (PyMuPDF)
### Website Redesign (Phase 8): Expedia-style homepage, search with filters, trip detail with gallery/itinerary
### Kuxtal Club Branding (Phase 10-11) - DONE
- [x] Homepage: Premium dark section with Kuxtal Club logo, gold gradient title, stats, 3x2 category grid
- [x] Benefits Page: Dark header with logo, "Comercios Aliados" gold title, category pills with icons, colored banner per category, cards with accent bar + gold benefit box, bottom CTA for commerce registration
- [x] Navbar: "Beneficios" renamed to "Kuxtal Club"
- [x] 12 category colors (orange/pink/emerald/amber/blue/violet/slate/cyan/indigo/rose/sky/teal)

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
- [ ] Configurar dominio kuxtaltravelgt.com
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Sistema de reviews/testimonios
- [ ] Modo oscuro para admin
