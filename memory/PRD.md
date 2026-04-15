# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral CRM para club vacacional con membresias, pagina web publica estilo Airbnb, portal de socios, CRM administrativo, portal de comercios, sistema de referidos, chat en tiempo real, analytics avanzado, y mas.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush
- **Frontend:** React 18 + Tailwind + Shadcn UI + Recharts
- **Auth:** JWT (httpOnly cookies + localStorage Bearer token fallback for cross-origin)
- **Storage:** Emergent Object Storage
- **Push:** Web Push API with VAPID (pywebpush)
- **PWA:** manifest.json + service worker

## Code Structure
```
/app/frontend/src/pages/
  AdminDashboard.js (orchestrator, React.lazy + Suspense)
  MemberDashboard.js (orchestrator, React.lazy + Suspense)
  admin/
    AdminOverview.js, AdminAnalytics.js, AdminMembers.js,
    AdminPackages.js, AdminQuotations.js, AdminReferrals.js,
    AdminAnnouncements.js, AdminRequests.js, AdminCommerces.js,
    AdminPush.js, AdminUsers.js, AdminSettings.js
  member/
    MemberOverview.js, MemberQuotations.js, MemberAnnouncements.js,
    MemberRequests.js, MemberFamily.js, MemberReferrals.js,
    MemberBenefits.js
```

## All Implemented Features

### Phase 1 - Core Platform
- [x] Pagina web publica estilo Airbnb (Home, Search, Trip Detail)
- [x] Portal de socios (Dashboard, Cotizaciones, Anuncios, Solicitudes)
- [x] CRM Administrativo (Socios CRUD, Paquetes CRUD, Cotizaciones, Anuncios)
- [x] Autenticacion JWT con roles multiples
- [x] Configuracion WhatsApp widget

### Phase 2 - Commerce & Benefits
- [x] Portal de comercios con 12 categorias
- [x] Sistema de validacion de visitas con codigo secreto
- [x] Raspable digital (scratch card) configurable
- [x] Commerce Wizard paso a paso para onboarding
- [x] Upload de imagenes (Object Storage)
- [x] PWA (manifest + service worker)

### Phase 3 - Sharing, Push & Family
- [x] Cotizaciones compartibles por WhatsApp y Email
- [x] Push notifications reales con VAPID keys
- [x] Sistema de familia del socio (sub-usuarios)

### Phase 4 - Analytics, Referrals & Chat
- [x] Analytics dashboard avanzado (Recharts)
- [x] Sistema de referidos
- [x] Chat en tiempo real (polling cada 5s)

### Phase 5 - Security & Code Quality
- [x] DELETE_SECRET en .env, XSS fix con DOMPurify
- [x] Backend anti-patterns corregidos, React index keys corregidos
- [x] MemberDashboard migrado a api interceptor centralizado

### Phase 6 - Component Refactoring + Lazy Loading
- [x] AdminDashboard.js: 957 -> ~235 lineas (12 sub-componentes lazy)
- [x] MemberDashboard.js: 555 -> ~155 lineas (7 sub-componentes lazy)
- [x] React.lazy() + Suspense con spinner de carga
- [x] Todos los data-testid preservados

## Pending / Backlog

### P2 - Production Readiness
- [ ] Integracion dominio externo kuxtaltravelgt.com
- [ ] Escalabilidad de push notifications

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA
