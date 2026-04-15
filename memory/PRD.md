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
  AdminDashboard.js (227 lines - orchestrator)
  MemberDashboard.js (142 lines - orchestrator)
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
- [x] Autenticacion JWT con roles multiples (super_admin, admin, member, family, commerce)
- [x] Configuracion WhatsApp widget

### Phase 2 - Commerce & Benefits
- [x] Logo Kuxtal Travel integrado
- [x] Portal de comercios con 12 categorias
- [x] Sistema de validacion de visitas con codigo secreto
- [x] Raspable digital (scratch card) configurable (HTML5 Canvas)
- [x] Login y portal de comercio
- [x] Upload de imagenes (Object Storage)
- [x] PWA (manifest + service worker)
- [x] Commerce Wizard paso a paso para onboarding

### Phase 3 - Sharing, Push & Family
- [x] Cotizaciones compartibles por WhatsApp y Email
- [x] Push notifications reales con VAPID keys
- [x] Sistema de familia del socio (sub-usuarios)

### Phase 4 - Analytics, Referrals & Chat
- [x] Analytics dashboard avanzado (Recharts: AreaChart, BarChart, PieChart)
- [x] Sistema de referidos (codigo unico, pagina publica, compartir)
- [x] Chat en tiempo real (polling cada 5s)
- [x] Centro de mensajes en admin

### Phase 5 - Security & Code Quality
- [x] DELETE_SECRET movido de hardcoded a .env
- [x] XSS fix con DOMPurify en MemberDashboard
- [x] Backend anti-patterns (is vs ==) corregidos
- [x] React array index keys reemplazados con IDs unicos
- [x] MemberDashboard migrado a api interceptor centralizado
- [x] Imports no utilizados removidos

### Phase 6 - Component Refactoring (P1)
- [x] AdminDashboard.js: 957 -> 227 lineas (12 sub-componentes)
- [x] MemberDashboard.js: 555 -> 142 lineas (7 sub-componentes)
- [x] Todos los data-testid preservados (96 admin, 32 member)
- [x] State management centralizado en orchestrators

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

## Key Files
- backend/server.py - Core API logic
- frontend/src/lib/api.js - Centralized axios interceptor
- frontend/src/contexts/AuthContext.js - Auth state and push subscription
- frontend/src/components/DeleteWithCode.js - Deletion protection modal
- frontend/src/pages/AdminDashboard.js - Admin orchestrator
- frontend/src/pages/MemberDashboard.js - Member orchestrator
- frontend/src/pages/admin/* - 12 admin sub-components
- frontend/src/pages/member/* - 7 member sub-components
