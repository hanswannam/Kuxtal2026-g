# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, programa Kuxtal Club de beneficios con cupones digitales QR, portal de socios, CRM admin, portal de comercios, referidos, chat, analytics, importacion AI de paquetes.

## Architecture
- Backend: FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- Frontend: React 18 + Tailwind + Shadcn UI + Recharts + React.lazy + qrcode.react
- Auth: JWT, AI: Gemini 2.5 Flash, PWA: SW v3

## All Implemented Features

### Core: Website, Member portal (8 tabs), Admin CRM (13 tabs), Commerce, Auth (5 roles), Push, PWA, Chat, Referrals, Analytics
### Security: XSS fix, refactoring, lazy loading (route+tab), ErrorBoundary, SEO OG tags
### AI Import: Individual + Batch Google Drive, PDF image extraction (PyMuPDF), Gemini 2.5 Flash
### Website: Expedia-style homepage, search with filters/sort, trip detail with gallery/itinerary
### Kuxtal Club: Premium branding (homepage + benefits page), navbar renamed to "Kuxtal Club"

### Digital Coupon QR System (NEW) - DONE
- [x] Member generates QR coupon from "Cupones" tab → selects commerce → "Generar"
- [x] QR modal with scannable QR code (qrcode.react) + text code (KX-XXXXXX format)
- [x] Active/Used coupon cards with "Ver QR" button
- [x] Public validation page /validate/:code - shows CUPON VALIDO/UTILIZADO, discount, member info, visit history
- [x] Manual code input on /validate for commerces without camera
- [x] "Canjear Cupon" button marks coupon as used (one-time use)
- [x] Visit recorded in commerce_visits collection on redemption
- [x] Admin creates special coupons via POST /api/admin/coupons
- [x] Commerce sees coupon history via GET /api/commerce/{id}/coupons
- [x] Prevents duplicate active coupons per member+commerce

## Coupon API
- POST /api/coupons/generate (member auth) - generates coupon for commerce
- GET /api/coupons/my (member auth) - member's coupons
- GET /api/coupons/validate/{code} (public) - coupon details + visit history
- POST /api/coupons/redeem/{code} (public) - marks as used
- POST /api/admin/coupons (admin auth) - creates special coupon
- GET /api/commerce/{id}/coupons (commerce/admin auth) - coupon history

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
- [ ] Commerce Portal: QR scanner integration for coupon validation
