# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, programa Kuxtal Club de beneficios con cupones digitales QR (generacion + scanner), portal de socios, CRM admin, portal de comercios, referidos, chat, analytics, importacion AI de paquetes.

## Architecture
- Backend: FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- Frontend: React 18 + Tailwind + Shadcn UI + Recharts + React.lazy + qrcode.react + html5-qrcode
- Auth: JWT, AI: Gemini 2.5 Flash, PWA: SW v3

## All Implemented Features

### Core: Website, Member portal (8 tabs), Admin CRM (13 tabs), Commerce portal (5 tabs), Auth (5 roles), Push, PWA, Chat, Referrals, Analytics
### Security: XSS fix, refactoring, lazy loading, ErrorBoundary, SEO
### AI Import: Individual + Batch Google Drive, PDF image extraction, Gemini 2.5 Flash
### Website: Expedia-style homepage, search with filters/sort, trip detail with gallery/itinerary
### Kuxtal Club: Premium branding, benefits page, navbar "Kuxtal Club"

### Digital Coupon QR System (COMPLETE)
- [x] Member: "Cupones" tab → selects commerce → generates QR code (qrcode.react)
- [x] Member: Active/Used coupon cards with "Ver QR" button
- [x] Commerce: "Cupones" tab → QR camera scanner (html5-qrcode) or manual code input
- [x] Commerce: Validates coupon → shows status/discount/member info/visit history
- [x] Commerce: "Canjear Cupon" → marks as used, records visit
- [x] Commerce: Coupon history list with active/used badges
- [x] Public: /validate/:code page for direct QR scan results
- [x] Admin: Creates special coupons via POST /api/admin/coupons
- [x] One-time use, prevents duplicates per member+commerce

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0ab / FITLIF01
- Delete Secret: BORRAR YA

## Pending / Backlog
- [ ] Configurar dominio kuxtaltravelgt.com
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Sistema de reviews/testimonios
- [ ] Dashboard de estadisticas de cupones en admin
