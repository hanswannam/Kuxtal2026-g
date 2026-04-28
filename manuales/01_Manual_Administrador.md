# Manual de Uso — Portal de Administración
## Kuxtal Travels CRM

---

## 1. Acceso

- **URL**: `https://[tu-dominio]/login`
- **Roles que entran al admin**: `super_admin`, `admin`
- **Tras iniciar sesión** se redirige automáticamente al panel admin (`/admin`).

> Si no tenés cuenta, pedile a un Super Admin que la cree desde el módulo **Usuarios** o que te invite.

---

## 2. Estructura del Panel

El panel tiene **15 módulos** en la barra lateral. Los módulos visibles dependen de los **permisos** asignados a tu usuario.

| Módulo | Para qué sirve |
|---|---|
| **Cotizaciones** | CRM de cotizaciones (eje principal del negocio) |
| **Dashboard** | Resumen de KPIs |
| **Analytics** | Gráficas e informes |
| **Socios** | Alta y gestión de miembros del club |
| **Clientes** | Personas que cotizaron pero aún no son socios |
| **Paquetes** | Catálogo de viajes/experiencias |
| **Comercios** | Aliados del Kuxtal Club |
| **Categorías** | Categorías de comercios (Restaurantes, Spa, etc.) |
| **Clubs** | Clubs vacacionales aliados |
| **Regalías** | Certificados/obsequios para socios |
| **Referidos** | Programa de invitaciones |
| **Anuncios** | Avisos para socios |
| **Push** | Notificaciones push a móviles/PWA |
| **Usuarios** | Cuentas y permisos |
| **Config** | Ajustes globales (redes sociales, WhatsApp, validez de cotizaciones, etc.) |

---

## 3. Cotizaciones (módulo principal)

### 3.1 Crear una cotización
1. Ir a **Cotizaciones → Nueva**.
2. Elegir el paquete (autocompleta título, precio base, duración).
3. Ingresar email/contrato del cliente.
   - Si coincide con un socio existente → se auto-detecta y aplica el precio socio.
4. Ajustar:
   - Cantidad de personas
   - Precio personalizado (override)
   - Extras (campo libre, ej. transporte, seguro)
   - Descuento
5. Definir fecha de vencimiento (`valid_until`). Si no se llena, se usa el default global.
6. Guardar.

### 3.2 Compartir con el cliente
- **WhatsApp**: botón que abre WhatsApp con mensaje pre-armado + link público a la cotización.
- **Email**: copia el link público (envío directo está pendiente de integración con Resend).
- El link público (`/cotizacion/:token`) muestra un **contador regresivo** y un CTA "Pagar ahora por WhatsApp".

### 3.3 Estados y seguimiento
| Estado | Significado |
|---|---|
| Pendiente | Recién creada, esperando que el cliente la vea |
| Vista | El cliente abrió el link |
| Aprobada | El cliente apretó "Aceptar" en el link público |
| Rechazada | El cliente apretó "Rechazar" |
| Pagada | Cobrada manualmente por admin |
| Vencida | Pasó la fecha `valid_until` |

- En el detalle de la cotización podés:
  - Cambiar de estado manualmente.
  - Agregar **notas internas** y **notas para el cliente**.
  - Ver el **timeline** automático (creación, vista, decisión).
  - Si el cliente la rechazó, podés reabrir/duplicar.

### 3.4 Filtros
- Por estado, fecha (rango), socio/cliente, paquete.
- Búsqueda por número de cotización (`#COT-001`) o nombre del cliente.

---

## 4. Socios

### 4.1 Crear socio
- **Importante**: al crear un socio, el sistema **crea automáticamente su usuario de login**:
  - **Email**: `<numero_contrato>@kuxtal.member`
  - **Contraseña**: el DPI (número de documento)
- 18 campos extendidos (propietario, copropietario, contrato, facturación, observaciones).

### 4.2 Editar socio
- Si cambiás el `contract_number` o el `DPI`, el usuario asociado se sincroniza automáticamente.
- Sub-tab **Regalías**: marcar checkboxes de regalías a activar para este socio.

### 4.3 Importar masivo
- **Admin → Importar** o el botón "Importar" dentro de Socios.
- Soporta `.xlsx` y `.csv` con el template provisto (DATOS HANSEN).

### 4.4 Filtros
- Búsqueda por nombre/contrato/DPI.
- Filtro por estado activo/inactivo.
- Toggle visual para activar/desactivar.

---

## 5. Paquetes

### 5.1 Crear paquete
- Datos básicos: título, descripción corta, descripción completa, país, categoría (paquete/alojamiento/experiencia).
- Precios: precio público (`price`), precio socio (`member_price`).
- Duración (`duration_days`), grupos min/max.
- Galería de imágenes, itinerario día a día, qué incluye.
- Flags: `featured` (aparece en home), `promo_end` (countdown promocional).

### 5.2 Importar con AI
- **Admin → Importar → Paquetes**
- Pegá un PDF o link de Google Drive y Gemini extrae los datos automáticamente.
- Soporta importación individual o por lote.

### 5.3 Activar/Desactivar
- Toggle visual en cada card. Las inactivas se ven en grayscale con badge rojo "Inactivo" y no aparecen en la web pública.

---

## 6. Comercios (Aliados Kuxtal Club)

### 6.1 Crear comercio
- Datos: nombre, descripción, categoría, ubicación, dirección, Google Maps, Waze.
- Contacto: teléfono, email, web, redes sociales (FB, IG, TikTok, X), YouTube.
- **Beneficio para socios**: descripción + código de validación (`validation_code`).
- Logo, fotos.

### 6.2 Aprobación
- Si un comercio se registra desde la web pública (`/partners/afiliar`) entra como **pending**.
- Admin debe aprobarlo desde **Comercios → filtro pending**.

### 6.3 Toggles por comercio
| Acción | Resultado |
|---|---|
| ⭐ Estrella dorada | Lo marca como **Destacado** (aparece en "Nuestros aliados" del home). Máximo 8. |
| Toggle verde | Activa/desactiva la visibilidad pública. |
| Lápiz | Editar |
| Trash + código | Eliminar (requiere `BORRAR YA`) |

### 6.4 Indicador de perfil
- Cada card muestra el **% de completitud** del perfil.
- Si es <50% sale alerta roja "Perfil muy incompleto — reduce conversión".

---

## 7. Categorías de comercios

- CRUD simple: nombre, ícono (Lucide picker), color.
- Las categorías nuevas aparecen automáticamente en la página pública `/benefits` y en el wizard de afiliación.

---

## 8. Clubs Vacacionales

- CRUD: logo, descripción, dirección, lista de beneficios.
- Aparecen en el portal de socios (tab **Clubs**).

---

## 9. Regalías (Certificados/Obsequios)

- CRUD de regalías globales (ej. "Cena para 2 — Restaurante Azul").
- Asignación a socios desde **Socios → Editar → Regalías** (multi-checkbox).
- El socio las ve en su portal en la tab **Regalías**.

---

## 10. Referidos

- Cada socio tiene un código único (`KT-XXX-REF`).
- Admin puede ver todas las invitaciones, su estado y aprobar/rechazar conversiones.

---

## 11. Anuncios

- Crear avisos con título, cuerpo, link opcional, audiencia (todos / por rol).
- Aparecen en el dashboard del socio en la tab **Anuncios**.

---

## 12. Push Notifications

- Crear notificación: título, mensaje, ícono, link opcional.
- Audiencias: todos los socios / segmentos / un solo usuario.
- Solo llega a quienes hayan suscrito el dispositivo (PWA instalada o navegador).
- Historial de envíos con tasa de apertura.

---

## 13. Usuarios y Permisos

### 13.1 Crear usuario
- Email, contraseña, nombre, rol (`super_admin`, `admin`, `member`, `commerce`).

### 13.2 Matriz de permisos (solo para admins)
- 17 feature keys: dashboard, quotations, clients, members, packages, commerce, categories, clubs, regalias, analytics, announcements, push, import, referrals, requests, users, settings.
- `super_admin` ignora la matriz (todo activado).
- `admin` solo ve los módulos cuyos permisos están encendidos.

---

## 14. Configuración global

- **Redes sociales** del footer (FB, IG, TikTok, X, YT, LinkedIn, WhatsApp).
- **Cotizaciones**:
  - `payment_whatsapp`: número de WhatsApp donde llegan los pagos.
  - `default_valid_days`: días de validez por defecto (default 10).
- **VAPID Keys** para push notifications.

---

## 15. Eliminación protegida (CRÍTICO)

Cualquier acción de **borrado** (socio, paquete, comercio, cotización, club, regalía, etc.) pide el **código secreto**:

> ```
> BORRAR YA
> ```

Si tipeás algo distinto el sistema rechaza la operación. Esto previene borrados accidentales.

> **Nunca compartas este código fuera del equipo administrativo.**

---

## 16. Atajos útiles

- **Ctrl/Cmd + K**: enfoque rápido a la búsqueda (donde aplica).
- **Tab Cotizaciones** → CTA destacado en la barra superior (`cta-quotations`).
- Sección admin se oculta automáticamente cuando hay un modal abierto, para no estorbar.

---

## 17. Buenas prácticas

1. **Mantené el catálogo limpio**: desactivá paquetes obsoletos en vez de borrarlos (preserva historial de cotizaciones).
2. **Curá los aliados destacados**: máximo 8 logos en el home — elegí los más representativos.
3. **Revisá cotizaciones por vencer**: ordená por fecha de vencimiento ascendente para ver primero las que están por expirar.
4. **Notas internas vs. notas al cliente**: las internas NO se muestran en el link público.
5. **Backup**: la base de datos se respalda automáticamente. Si necesitás un export manual, contactá soporte técnico.

---

## 18. Soporte

- Reportá bugs o sugerencias al equipo técnico de Kuxtal.
- Para issues de pagos contactá al WhatsApp configurado en **Config → Cotizaciones**.

---

*Versión: Feb 2026 · Kuxtal Travels CRM*
