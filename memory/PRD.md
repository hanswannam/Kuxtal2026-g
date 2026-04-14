# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral tipo CRM para club vacacional que vende membresías vacacionales. Incluye página web pública estilo Airbnb, portal de socios, sistema administrativo/CRM, sistema de comercios con beneficios, y más.

## Architecture
- **Backend:** FastAPI (Python) + MongoDB
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI
- **Auth:** JWT (httpOnly cookies) - Admin (email/password) + Member (contract/DPI)
- **Storage:** Emergent Object Storage for images
- **Design:** Playfair Display headings, Outfit body, Crimson #C1121F primary

## User Personas
1. **Visitante Público** - Busca viajes, cotiza paquetes
2. **Socio/Miembro** - Login con contrato+DPI, ve membresía, promociones, solicita vacaciones
3. **Administrador** - Gestiona socios, paquetes, cotizaciones, anuncios
4. **Super Admin** - Control total del sistema

## Core Requirements
- [x] Página web pública con búsqueda tipo Airbnb
- [x] Detalle de viaje con cotización
- [x] Portal de socios con dashboard
- [x] Sistema CRM administrativo
- [x] Gestión de socios (CRUD)
- [x] Gestión de paquetes (CRUD)
- [x] Sistema de cotizaciones
- [x] Anuncios y promociones
- [x] Solicitudes de vacaciones con mensajería
- [x] Configuración de WhatsApp
- [x] Object Storage para imágenes
- [x] Autenticación JWT con roles

## What's Been Implemented (Phase 1 - Feb 2026)
- Public website: Home, Search, Trip Detail pages
- Member portal: Dashboard, Quotations, Announcements, Vacation Requests
- Admin CRM: Dashboard stats, Members CRUD, Packages CRUD, Quotations management, Announcements, Vacation Requests, WhatsApp config
- Auth: Admin login + Member login (contract/DPI)
- Sample data: 6 travel packages, 1 sample member
- Object Storage integration

## Prioritized Backlog

### P0 (Next)
- Portal de comercios con beneficios para socios
- Tarjeta virtual de cliente frecuente
- Sistema de raspable digital (scratch card)
- Push notifications (Web Push API)

### P1
- Upload de imágenes desde admin (usando Object Storage)
- Envío de cotizaciones por WhatsApp y email
- PWA support (manifest, service worker)
- Búsqueda avanzada con filtros de precio

### P2
- Sistema de categorías de comercios
- Dashboard analytics avanzado
- Multi-idioma
- Sistema de roles más granular
- Exportación de reportes

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
