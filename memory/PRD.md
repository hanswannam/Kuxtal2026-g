# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema CRM para club vacacional con web publica estilo Expedia, portal de socios, CRM admin, portal de comercios, referidos, chat, analytics, importacion AI de paquetes con extraccion de imagenes.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini 2.5 Flash) + PyMuPDF
- **Frontend:** React 18 + Tailwind + Shadcn UI + Recharts + React.lazy
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
- [x] Component refactoring + lazy loading + ErrorBoundary + SEO

### AI Import Complete (Phase 7-9)
- [x] Individual: Google Drive link -> Gemini AI -> Pre-filled review form
- [x] Lote (Batch): Multiple links (max 20) -> Sequential AI -> Progress bar -> Bulk create
- [x] PDF Image Extraction: PyMuPDF extracts images >15KB from PDFs, uploads to storage, auto-populates gallery
- [x] Image files: Source uploaded directly as main image
- [x] Multi-format: PDF, Images, Word, Excel
- [x] Enriched fields: itinerary, accommodation_type, difficulty, min/max group
- [x] Gallery preview with thumbnails, Principal badge, remove buttons

### Public Website Redesign (Phase 8)
- [x] Homepage: Expedia-style hero + search tabs + popular destinations
- [x] Search: Category tabs, country/price/duration filters, 6 sort options
- [x] Trip Detail: Gallery, itinerary timeline, includes grid, sticky price sidebar, quote modal
- [x] Accent-insensitive search (normalize_search)

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA

## Pending / Backlog
- [ ] Configurar dominio kuxtaltravelgt.com (Deploy > Custom Domain)
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Sistema de reviews/testimonios
- [ ] Modo oscuro para admin
