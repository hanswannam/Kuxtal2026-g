# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral CRM para club vacacional con membresias, pagina web publica estilo Expedia, portal de socios, CRM administrativo, portal de comercios, sistema de referidos, chat en tiempo real, analytics avanzado, importacion inteligente de paquetes con AI.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini)
- **Frontend:** React 18 + Tailwind + Shadcn UI + Recharts
- **Auth:** JWT (httpOnly cookies + localStorage Bearer token fallback)
- **AI:** Gemini 2.5 Flash (document analysis, package extraction)
- **Storage:** Emergent Object Storage
- **Push:** Web Push API with VAPID (batch, retry)
- **PWA:** manifest.json + service worker v3

## All Implemented Features

### Phase 1-4 - Core Platform (DONE)
- [x] Public website, Member portal, Admin CRM, Commerce portal
- [x] JWT auth (5 roles), WhatsApp, Commerce Wizard, Scratch Card
- [x] VAPID Push, PWA, Chat (polling), Referral system, Analytics

### Phase 5-6 - Security, Refactoring, Lazy Loading (DONE)
- [x] XSS fix, DELETE_SECRET, backend anti-patterns, React keys
- [x] Admin: 12 lazy sub-components, Member: 7 lazy sub-components
- [x] Page-level lazy loading, ErrorBoundary, SEO OG tags

### Phase 7 - AI Import Module (DONE)
- [x] Google Drive link import + Gemini 2.5 Flash extraction
- [x] Multi-format: PDF, Images, Word, Excel
- [x] Pre-filled review form before creating package

### Phase 8 - Homepage Redesign (IN PROGRESS)
- [x] Expedia-style hero with search tabs (Paquetes, Alojamientos, Experiencias)
- [x] Destination input with country suggestions datalist
- [x] Date picker + travelers selector (1-8)
- [x] Popular destinations bar with country pills
- [x] Improved package cards with price overlay on image
- [x] Backend accent-insensitive search (normalize_search)
- [ ] Search page redesign with filters (country, price range, duration)
- [ ] Trip detail page redesign with gallery, itinerary

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA
