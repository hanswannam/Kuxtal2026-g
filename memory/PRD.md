# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral CRM para club vacacional con membresias, pagina web publica estilo Airbnb, portal de socios, CRM administrativo, portal de comercios, sistema de referidos, chat en tiempo real, analytics avanzado, y mas.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush
- **Frontend:** React 18 + Tailwind + Shadcn UI + Recharts
- **Auth:** JWT (httpOnly cookies + localStorage Bearer token fallback)
- **Storage:** Emergent Object Storage
- **Push:** Web Push API with VAPID (pywebpush) - batch sending with retry
- **PWA:** manifest.json + service worker v3 (stale-while-revalidate)
- **Performance:** React.lazy + Suspense (route + tab level), 23 MongoDB indexes

## Code Structure
```
/app/frontend/src/
  App.js (ErrorBoundary + Suspense + lazy routes)
  components/ErrorBoundary.js
  hooks/useDocumentTitle.js
  pages/
    AdminDashboard.js (orchestrator, React.lazy tabs)
    MemberDashboard.js (orchestrator, React.lazy tabs)
    admin/ (12 sub-components)
    member/ (7 sub-components)
/app/frontend/public/
  index.html (OG meta tags, Twitter Cards)
  sw.js (v3: stale-while-revalidate API, cache-first static, network-first HTML)
  manifest.json
```

## All Implemented Features

### Phase 1-4 - Core Platform (DONE)
- [x] Public website (Home, Search, Trip Detail)
- [x] Member portal (Dashboard, Quotes, Announcements, Requests, Family, Referrals, Benefits)
- [x] Admin CRM (Members, Packages, Commerce, Quotes, Referrals, Announcements, Push, Chat, Analytics)
- [x] JWT auth (5 roles), WhatsApp widget, Commerce Wizard, Scratch Card
- [x] VAPID Push notifications, PWA, Chat (polling), Referral system

### Phase 5 - Security & Code Quality (DONE)
- [x] XSS fix (DOMPurify), DELETE_SECRET in .env, backend anti-patterns fixed
- [x] React index keys replaced, centralized api interceptor, unused imports removed

### Phase 6 - Component Refactoring + Lazy Loading (DONE)
- [x] AdminDashboard: 957 -> 235 lines (12 lazy sub-components)
- [x] MemberDashboard: 555 -> 155 lines (7 lazy sub-components)

### Phase 7 - Production Readiness P2 (DONE)
- [x] SEO: Open Graph tags, Twitter Cards, locale es_GT
- [x] React ErrorBoundary wrapping entire app
- [x] Page-level lazy loading (10 routes) + tab-level (19 components)
- [x] Dynamic document titles (useDocumentTitle hook)
- [x] Service Worker v3: stale-while-revalidate API, cache-first static, network-first HTML
- [x] Push notifications: batch (50), retry (2x), bulk stale cleanup
- [x] 23 MongoDB indexes across 12 collections
- [x] CORS regex for kuxtaltravelgt.com domain

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA
