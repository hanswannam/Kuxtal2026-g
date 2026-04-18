# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, programa Kuxtal Club con cupones QR, portal socios, CRM admin, portal comercios, referidos, chat, analytics, importacion AI.

## Architecture
- Backend: FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- Frontend: React 18 + Tailwind + Shadcn UI + Recharts + React.lazy + qrcode.react + html5-qrcode
- Auth: JWT, AI: Gemini 2.5 Flash, PWA: SW v3
- Theme: Navy #1B325F (--primary), Verde Lima #99D63B (--accent)

## All Implemented Features
- Core: Website, Member (8 tabs), Admin (13 tabs), Commerce (5 tabs), Auth (5 roles), Push, PWA, Chat, Referrals, Analytics
- Security: XSS (DOMPurify strict whitelist), DELETE_SECRET env, secrets module for crypto-random, error logging in catch blocks
- AI Import: Individual + Batch Google Drive, PDF image extraction, Gemini 2.5 Flash
- Website: Expedia-style homepage, search with filters/sort, trip detail with gallery/itinerary
- Kuxtal Club: Premium branding, benefits page, digital coupon QR system (generation + scanner)
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
- [ ] Backend refactoring: import_package_from_drive() complexity (break into smaller functions)
- [ ] Frontend refactoring: CommercePortal.js (491 lines), CommerceDetailPage.js, ChatPage.js, HomePage.js
- [ ] Configurar dominio kuxtaltravelgt.com
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Sistema de reviews/testimonios
