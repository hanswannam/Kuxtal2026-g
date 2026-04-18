# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral CRM para club vacacional con web publica estilo Expedia, portal de socios, CRM admin, portal de comercios, referidos, chat, analytics, importacion AI de paquetes.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash)
- **Frontend:** React 18 + Tailwind + Shadcn UI + Recharts
- **Auth:** JWT (httpOnly cookies + localStorage Bearer token fallback)
- **AI:** Gemini 2.5 Flash (document/image analysis, package extraction)
- **PWA:** manifest.json + service worker v3

## All Implemented Features

### Core Platform (Phase 1-4)
- [x] Public website estilo Expedia (Home, Search, Trip Detail)
- [x] Member portal (7 lazy tabs), Admin CRM (13 lazy tabs), Commerce portal
- [x] JWT auth (5 roles), WhatsApp, Commerce Wizard, Scratch Card
- [x] VAPID Push (batch/retry), PWA, Chat (polling), Referral system, Analytics

### Security & Quality (Phase 5-6)
- [x] XSS fix, DELETE_SECRET, backend anti-patterns, React keys
- [x] Component refactoring: Admin 12 components, Member 7 components
- [x] Lazy loading (route + tab level), ErrorBoundary, SEO OG tags

### AI Import (Phase 7)
- [x] Google Drive link → Gemini 2.5 Flash → Pre-filled review form
- [x] Multi-format: PDF, Images, Word, Excel
- [x] Enriched extraction: itinerary, accommodation, difficulty, group size

### Public Website Redesign (Phase 8) - DONE
- [x] **Homepage**: Expedia-style hero + search tabs (Paquetes/Alojamientos/Experiencias) + destination/date/guests + popular destinations bar + improved cards
- [x] **Search Page**: Category tabs, country filter, price range, duration filter, 6 sort options (price asc/desc, duration, rating), professional card grid with price overlay
- [x] **Trip Detail**: Gallery with nav arrows, itinerary day-by-day timeline, includes grid, sticky price sidebar, quote modal, share button, trust signals
- [x] **Enriched Package Model**: itinerary[], accommodation_type, difficulty, min_group, max_group
- [x] **Backend**: Accent-insensitive search (normalize_search), price/duration/sort filters, enriched PackageCreate model

## Package Schema
```
{
  title, description, short_description, country, price, member_price,
  duration_days, category (paquete|alojamiento|experiencia),
  includes[], itinerary[{day, title, description}],
  accommodation_type (hotel|resort|villa|hostel|camping|airbnb),
  difficulty (facil|moderado|dificil), min_group, max_group,
  rating, image_url, gallery[], featured, status
}
```

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA

## Pending / Backlog
- [ ] Configurar dominio kuxtaltravelgt.com (Deploy > Custom Domain)
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Importacion en lote (multiples archivos Google Drive)
- [ ] Image extraction from PDFs for package gallery
