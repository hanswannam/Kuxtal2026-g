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
- [x] Badge "Made with Emergent" removido

### Phase 4 - Analytics, Referrals & Chat
- [x] Analytics dashboard avanzado (Recharts: AreaChart, BarChart, PieChart)
- [x] Crecimiento de socios, tendencia de cotizaciones, top paquetes
- [x] Distribucion por pais, stats de referidos y comercios
- [x] Sistema de referidos (codigo unico, pagina publica, compartir WhatsApp/Email)
- [x] Admin gestiona referidos (estados: pendiente, contactado, convertido)
- [x] Chat en tiempo real (polling cada 5s)
- [x] Conversaciones miembro-admin con historial
- [x] Boton flotante de chat en portal de socios
- [x] Centro de mensajes en admin

### Phase 5 - Security & Code Quality (Code Review)
- [x] DELETE_SECRET movido de hardcoded a .env
- [x] XSS fix con DOMPurify en MemberDashboard
- [x] Empty catch blocks corregidos
- [x] Backend anti-patterns (is vs ==) corregidos en server.py
- [x] React array index keys reemplazados con IDs unicos en todas las paginas
- [x] MemberDashboard migrado de axios crudo a api interceptor centralizado
- [x] Imports de axios no utilizados removidos
- [x] Codigo duplicado en AdminDashboard.js removido

## Pending / Backlog

### P1 - Component Refactoring
- [ ] AdminDashboard.js (>900 lineas) - extraer tabs/modales en componentes separados
- [ ] MemberDashboard.js (>500 lineas) - extraer tabs en componentes separados

### P2 - Production Readiness
- [ ] Integracion dominio externo kuxtaltravelgt.com
- [ ] Escalabilidad de push notifications

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Referral: KT-001-9462
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA

## Key Files
- backend/server.py - Core API logic
- frontend/src/lib/api.js - Centralized axios interceptor (MUST be used for all authenticated calls)
- frontend/src/contexts/AuthContext.js - Auth state and push subscription
- frontend/src/components/DeleteWithCode.js - Deletion protection modal
- frontend/src/pages/AdminDashboard.js - Admin CRM
- frontend/src/pages/MemberDashboard.js - Member portal
- frontend/src/pages/CommercePortal.js - Commerce management
- frontend/src/pages/CommerceWizard.js - Commerce onboarding
