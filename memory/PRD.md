# Kuxtal Travel - Club Vacacional PRD

## Problem Statement
Sistema integral CRM para club vacacional con membresias, pagina web publica estilo Airbnb, portal de socios, CRM administrativo, portal de comercios, sistema de referidos, chat en tiempo real, analytics avanzado, importacion inteligente de paquetes con AI.

## Architecture
- **Backend:** FastAPI + MongoDB + pywebpush + emergentintegrations (Gemini)
- **Frontend:** React 18 + Tailwind + Shadcn UI + Recharts
- **Auth:** JWT (httpOnly cookies + localStorage Bearer token fallback)
- **AI:** Gemini 2.5 Flash via emergentintegrations (document analysis, package extraction)
- **Storage:** Emergent Object Storage
- **Push:** Web Push API with VAPID (batch sending with retry)
- **PWA:** manifest.json + service worker v3 (stale-while-revalidate)

## All Implemented Features

### Phase 1-4 - Core Platform (DONE)
- [x] Public website, Member portal, Admin CRM, Commerce portal
- [x] JWT auth (5 roles), WhatsApp, Commerce Wizard, Scratch Card
- [x] VAPID Push, PWA, Chat (polling), Referral system, Analytics

### Phase 5 - Security & Code Quality (DONE)
- [x] XSS fix, DELETE_SECRET, backend anti-patterns, React keys, api interceptor

### Phase 6 - Component Refactoring + Lazy Loading (DONE)
- [x] Admin: 12 lazy sub-components, Member: 7 lazy sub-components

### Phase 7 - Production Readiness P2 (DONE)
- [x] SEO (OG tags, Twitter Cards), ErrorBoundary, Page lazy loading (10 routes)
- [x] Service Worker v3, Push batch (50) with retry, 23 MongoDB indexes

### Phase 8 - AI Import Module (DONE)
- [x] Google Drive link import - paste URL, auto-download file
- [x] Multi-format support: PDF, Images, Word (.docx), Excel (.xlsx)
- [x] Gemini 2.5 Flash AI extraction - reads document and outputs structured package data
- [x] Pre-filled review form - admin reviews/edits extracted data before creating
- [x] New "Importar" tab in admin dashboard with Sparkles icon
- [x] Supported format badges (PDF, Imagenes, Word, Excel)
- [x] Loading state with AI processing indicator
- [x] Warning banner reminding admin to review AI output

## Test Credentials
- Admin: admin@kuxtaltravels.com / KuxtalAdmin2024!
- Member: KT-001 / 1234567890101
- Family: KT-001 / 9876543210101
- Commerce: 69dd90c4b0e08b1f0a2eb0a8 / GAUCHA01
- Delete Secret: BORRAR YA

## Key Files
- backend/server.py - Core API + import endpoint
- frontend/src/pages/admin/AdminImport.js - AI import UI
- frontend/src/lib/api.js - Centralized axios interceptor
- frontend/src/components/ErrorBoundary.js - Error boundary
- frontend/src/hooks/useDocumentTitle.js - Dynamic titles

## Pending / Backlog
- [ ] Configurar dominio kuxtaltravelgt.com (Deploy > Custom Domain)
- [ ] Notificaciones por email (SendGrid/Resend)
- [ ] Bulk import (multiple files at once)
- [ ] Image extraction from PDFs for package gallery
