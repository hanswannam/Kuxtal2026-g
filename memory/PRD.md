# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral tipo CRM para club vacacional que vende membresías vacacionales. Incluye página web pública estilo Airbnb, portal de socios, sistema administrativo/CRM, portal de comercios con beneficios, sistema de raspable digital, y más.

## Architecture
- **Backend:** FastAPI (Python) + MongoDB
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI
- **Auth:** JWT (httpOnly cookies) - Admin (email/password) + Member (contract/DPI) + Commerce (id/code)
- **Storage:** Emergent Object Storage for images
- **Design:** Playfair Display headings, Outfit body, Crimson #C1121F primary
- **PWA:** manifest.json + service worker + push notifications

## User Personas
1. **Visitante Público** - Busca viajes, cotiza paquetes
2. **Socio/Miembro** - Login con contrato+DPI, ve membresía, beneficios, comercios
3. **Comercio** - Login con ID+código, gestiona promociones, raspable, visitas
4. **Administrador** - Gestiona todo: socios, paquetes, comercios, notificaciones
5. **Super Admin** - Control total del sistema

## What's Been Implemented

### Phase 1 (Feb 2026)
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

### Phase 2 (Feb 2026)
- [x] Logo Kuxtal Travel integrado (navbar, footer, login)
- [x] Portal de comercios con beneficios
- [x] Directorio de comercios con categorías (12 categorías)
- [x] Detalle de comercio con beneficios exclusivos
- [x] Sistema de validación de visitas (código secreto)
- [x] Tarjeta virtual de cliente frecuente
- [x] Sistema de raspable digital (porcentaje o cada X intentos)
- [x] Login de comercio (ID + código)
- [x] Portal de comercio (promociones, raspable, visitas)
- [x] Push notifications management (enviar, historial)
- [x] Upload de imágenes desde admin
- [x] PWA (manifest.json + service worker)
- [x] Tab de beneficios en portal de socios
- [x] Sección de comercios en homepage

## Prioritized Backlog

### P0 (Next)
- Envío de cotizaciones por WhatsApp y email (compartir)
- Notificaciones push reales con VAPID keys
- Familia del socio (sistema de sub-usuarios)

### P1
- Analytics dashboard avanzado
- Multi-idioma
- Sistema de referidos
- Exportación de reportes
- Búsqueda avanzada con filtros de precio

### P2
- Chat en tiempo real
- Sistema de reseñas
- Integración con calendario
- App móvil nativa

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Commerce codes: GAUCHA01, PETCAR01, SPAREX01, FITLIF01
