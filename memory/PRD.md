# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral CRM para club vacacional con membresías, página web pública estilo Airbnb, portal de socios, CRM administrativo, portal de comercios, sistema de referidos, chat en tiempo real, analytics avanzado, y más.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush
- **Frontend:** React 19 + Tailwind + Shadcn UI + Recharts
- **Auth:** JWT (httpOnly cookies) - Admin/Member/Family/Commerce
- **Storage:** Emergent Object Storage
- **Push:** Web Push API with VAPID (pywebpush)
- **PWA:** manifest.json + service worker

## All Implemented Features

### Phase 1 - Core Platform
- [x] Página web pública estilo Airbnb (Home, Search, Trip Detail)
- [x] Portal de socios (Dashboard, Cotizaciones, Anuncios, Solicitudes)
- [x] CRM Administrativo (Socios CRUD, Paquetes CRUD, Cotizaciones, Anuncios)
- [x] Autenticación JWT con roles múltiples
- [x] Configuración WhatsApp widget

### Phase 2 - Commerce & Benefits
- [x] Logo Kuxtal Travel integrado
- [x] Portal de comercios con 12 categorías
- [x] Sistema de validación de visitas con código secreto
- [x] Raspable digital (scratch card) configurable
- [x] Login y portal de comercio
- [x] Upload de imágenes (Object Storage)
- [x] PWA (manifest + service worker)

### Phase 3 - Sharing, Push & Family
- [x] Cotizaciones compartibles por WhatsApp y Email
- [x] Push notifications reales con VAPID keys
- [x] Sistema de familia del socio (sub-usuarios)
- [x] Badge "Made with Emergent" removido

### Phase 4 - Analytics, Referrals & Chat
- [x] Analytics dashboard avanzado (Recharts: AreaChart, BarChart, PieChart)
- [x] Crecimiento de socios, tendencia de cotizaciones, top paquetes
- [x] Distribución por país, stats de referidos y comercios
- [x] Sistema de referidos (código único, página pública, compartir WhatsApp/Email)
- [x] Admin gestiona referidos (estados: pendiente, contactado, convertido)
- [x] Chat en tiempo real (polling cada 5s)
- [x] Conversaciones miembro↔admin con historial
- [x] Botón flotante de chat en portal de socios
- [x] Centro de mensajes en admin

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Referral: KT-001-9462
- Commerce: GAUCHA01, PETCAR01, SPAREX01, FITLIF01
