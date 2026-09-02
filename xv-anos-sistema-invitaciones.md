# Sistema de Invitaciones y Control de Acceso — XV Años

Documento de especificación técnica para desarrollo en Cursor.

> **Alcance confirmado:** proyecto de uso único, para un solo evento. No se construye pensando en multi-tenant/multi-cliente — eso simplifica varias decisiones (ver sección 11).

## 1. Resumen general

Sistema web de 3 módulos conectados por una misma base de datos:

1. **Panel de administración** (privado) — el organizador crea el evento, personaliza la plantilla, captura datos y gestiona la lista de familias/boletos.
2. **Invitación pública** (una URL única por familia) — el invitado ve la invitación personalizada, confirma asistencia y recibe su QR.
3. **App de control de acceso** (staff del salón) — escanea QR, valida boletos y lleva el conteo de aforo en tiempo real.

Los tres módulos comparten la misma base de datos (Supabase), por lo que una confirmación en el módulo 2 se refleja al instante en el 1 y en el 3 (vía Supabase Realtime).

---

## 2. Stack tecnológico sugerido

| Capa | Tecnología |
|---|---|
| Frontend/Backend | Next.js (App Router) en Vercel |
| Base de datos / Auth / Realtime | Supabase (Postgres + Auth + Realtime + Storage) |
| Autenticación admin | Supabase Auth (magic link o email/password) |
| Autenticación staff | PIN simple por evento (hasheado con bcrypt) |
| QR generación | `qrcode` / `qrcode.react` |
| QR firma/verificación | JWT firmado (HMAC) con secreto en variables de entorno |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) en endpoints públicos |
| Escáner de cámara | `html5-qrcode` o `react-qr-reader` |
| Generación de PDF | `@react-pdf/renderer` (MVP; instantáneo, sin cold start) |
| Calendario ("Agendar") | archivo `.ics` descargable + deep link a Google Calendar |
| Offline (Página 3) | Service Worker + IndexedDB (`idb` o `localForage`) |
| Wallet (Fase 3) | Google Wallet API (Issuer account) + Apple PassKit (`passkit-generator`, requiere Apple Developer Program) |

---

## 3. Modelo de datos (Supabase / Postgres)

```sql
-- Cuenta del organizador (usa auth.users de Supabase)

create table events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  quinceañera_nombre text not null,
  padre text,
  madre text,
  padrinos jsonb default '[]',        -- [{ "nombre": "", "rol": "Padrino de..." }]
  mensaje text,
  template_id uuid references templates(id),
  template_config jsonb default '{}', -- colores, fuente, imagen de fondo, etc.
  misa jsonb,                         -- { templo, direccion, maps_url, fecha_hora }
  recepcion jsonb,                    -- { nombre, direccion, maps_url, fecha_hora }  (tu "Casino")
  capacidad_total int,                -- aforo del salón, para alertas en Página 3
  estado text default 'borrador',     -- borrador | publicado | cancelado
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  preview_url text,
  config_schema jsonb not null        -- define qué campos son personalizables
);

create table families (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) not null,
  nombre_familia text not null,
  boletos_total int not null check (boletos_total > 0),
  token text unique not null,         -- slug para la URL de invitación
                                       -- nanoid, 21 chars, alfabeto URL-safe (A-Za-z0-9_-)
  estado_confirmacion text default 'pendiente', -- pendiente | confirmado | rechazado
  confirmado_at timestamptz,
  qr_jti text,                        -- nonce vigente del QR actual (se rota en cada regeneración)
  checked_in boolean default false,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table checkin_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) not null,
  scanned_by text,
  scanned_at timestamptz default now(),
  resultado text  -- exitoso | duplicado | invalido | jti_expirado
);

create table staff_users (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) not null,
  nombre text not null,
  pin_hash text not null              -- bcrypt, cost factor >= 10. Nunca texto plano.
);
```

**Row Level Security (RLS):** activar en todas las tablas, como defensa en profundidad. `events`/`families` solo editables por `admin_id = auth.uid()`. La `service_role` key **nunca se usa ni se expone en el navegador**: toda lectura/escritura pública (invitación, confirmación, check-in) pasa por Route Handlers de Next.js que corren en servidor y usan `service_role` internamente, filtrando siempre por `token` o `family_id` verificado. El cliente público solo habla con esos endpoints, nunca directo con Supabase.

---

## 4. Página 1 — Panel de administración

### 4.1 Flujo
1. **Login** del organizador (Supabase Auth).
2. **Elegir plantilla**: galería de plantillas prediseñadas (componentes React), cada una con 3–5 parámetros personalizables (color principal, color secundario, fuente, imagen/foto). Vista previa en vivo mientras se ajusta.
3. **Formulario de datos del evento**:
   - Quinceañera: nombre
   - Padres, padrinos (agregar dinámicamente, no limitar a 2 aunque el estándar sea 2)
   - Mensaje: selector de 3–4 mensajes predeterminados + opción "Escribir el mío"
   - Misa: nombre del templo, fecha/hora, dirección (guardar el link completo de Maps, pero **renderizar solo un ícono de pin** con `<a href={maps_url} target="_blank">`), botón **Agendar** (genera `.ics` + link directo a Google Calendar)
   - Recepción/Casino: mismos campos que misa
4. **Guardar** → pasa a la sección de invitados.
5. **Gestión de familias**:

   | Nombre | Boletos | Confirmación |
   |---|---|---|
   | Alma | 5 | (ícono estático, sin función aún) |

   - Formulario para agregar fila a fila (nombre + boletos)
   - Contador acumulado de boletos totales, visible siempre
   - Botón **Guardar** al terminar

6. Tras guardar aparecen dos botones: **Editar** | **Continuar**
   - Editar → vuelve a la tabla editable (nombre, boletos)
   - Continuar → vista de monitoreo (ver 4.2)

### 4.2 Vista de monitoreo (tras "Continuar")

Misma tabla, con dos cambios:

| Nombre | Boletos | Asistencia | Invitación |
|---|---|---|---|
| Alma | 5 | ⏳ pendiente / ✅ / ❌ | `tuboda.com/invitacion/abc123` (copiar / compartir por WhatsApp) |

- Columna "Asistencia" ahora es dinámica: se actualiza sola (Supabase Realtime) cuando la familia confirma desde la Página 2.
- Columna "Invitación" con link único (`token` generado al crear la familia) + botón para copiar o compartir directo por WhatsApp:
  ```
  https://wa.me/?text=Hola%20Familia%20Alma%2C%20aqu%C3%AD%20est%C3%A1%20tu%20invitaci%C3%B3n%3A%20https%3A%2F%2Ftuboda.com%2Finvitacion%2Fabc123
  ```
- Panel resumen arriba de la tabla: total invitados (boletos), confirmados, pendientes, rechazados — con contador de **boletos**, no de familias.

---

## 5. Página 2 — Invitación pública (`/invitacion/[token]`)

### 5.1 Carga inicial
- El cliente **nunca** consulta Supabase directamente. Llama a `GET /api/invitacion/[token]`, que en el servidor busca la familia por `token` usando `service_role` y regresa solo lo necesario para renderizar (nombre de familia, datos del evento, estado de confirmación).
- Si `estado_confirmacion = 'confirmado'`, se salta directo a la vista con QR (para que reabrir el link no obligue a reconfirmar).
- Se renderiza la plantilla del evento con el nombre de la familia insertado en un lugar visible (ej. "Esta invitación es especialmente para: **Familia Alma**").
- Se muestran todos los datos: mensaje, misa (con ícono de ubicación → abre Maps, botón Agendar), recepción (igual).

### 5.2 Botones inferiores
1. **Guardar invitación (PDF)** — genera PDF con toda la info y los links de ubicación funcionando.
2. **Confirmar asistencia** — abre modal "¿Asistirás?" Sí / No
   - **No** → actualiza `estado_confirmacion = 'rechazado'`, muestra mensaje de agradecimiento, cierra flujo.
   - **Sí** → actualiza `estado_confirmacion = 'confirmado'` + `confirmado_at`, genera un nuevo `qr_jti`, arma el QR firmado, lo **descarga automáticamente**, muestra debajo el número de boletos, y aparece botón **Agregar a billetera** (Fase 3).

### 5.3 Cambio de respuesta (política definida)
Sí se permite cambiar de opinión después de confirmar, con esta regla: **cada vez que la respuesta pasa a "Sí" (incluyendo un cambio de "No" a "Sí", o reconfirmar después de ya haber confirmado), se genera un `qr_jti` nuevo y el QR anterior queda inválido automáticamente** (el backend solo acepta el `jti` que coincide con el guardado en `families.qr_jti`). Si pasa de "Sí" a "No", el QR existente se invalida (se limpia `qr_jti`) y no se genera uno nuevo hasta que vuelva a confirmar.

### 5.4 Seguridad del QR
El contenido del QR **no debe ser el `id` plano** de la familia (se podría fabricar cambiando el número). Es un JWT firmado con secreto de servidor, e incluye un `jti` (nonce) para que una foto del QR nunca sea reutilizable después de su primer uso válido o de una regeneración:
```
payload = { family_id, event_id, jti, iat }
qr_content = JWT_SIGN(payload, SECRET)
```
Al escanear (Página 3), el backend verifica: (1) la firma, (2) que `jti` coincida exactamente con `families.qr_jti` vigente, (3) que `checked_in = false`. Si cualquiera falla, se rechaza y se registra en `checkin_logs`.

`POST /api/confirm/[token]` tiene rate limiting por IP (Upstash) para evitar intentos masivos de adivinar tokens.

---

## 6. Página 3 — App de control de acceso (staff del salón)

### 6.1 Acceso
Login simple por PIN de evento (tabla `staff_users`, PIN hasheado con bcrypt) — pensado para que varias personas escaneen simultáneamente en distintas entradas. No se implementa TOTP ni 2FA: para un solo evento con staff de confianza, PIN + bcrypt es proporcional al riesgo.

### 6.2 Menú

**a) Conteo**
- Toggle Ingresados / Pendientes
- Contador grande arriba: **suma de boletos**, no de familias (ej. "142 / 320 boletos ingresados")
- Ingresados: lista de familias con `checked_in = true`, ordenadas por hora de entrada
- Pendientes: familias con `estado_confirmacion = 'confirmado'` y `checked_in = false` (las que nunca confirmaron no cuentan aquí)
- Si `capacidad_total` está definido, mostrar barra de aforo con alerta visual al acercarse al límite

**b) Escáner**
- Cámara activa un lector QR
- Al leer: verificar firma + `jti` vigente → si es válido y `checked_in = false`, hacer update atómico:
  ```sql
  update families set checked_in = true, checked_in_at = now(), checked_in_by = :staff
  where id = :family_id and checked_in = false
  returning *;
  ```
  Esto evita duplicados aunque dos dispositivos escaneen el mismo QR casi al mismo tiempo.
- Mostrar en pantalla: nombre de familia + número de boletos + confirmación visual (✅)
- Si ya estaba escaneado: mostrar aviso claro "Este boleto ya fue registrado a las HH:MM" (no lo vuelve a contar)
- Registrar cada intento en `checkin_logs` (exitoso/duplicado/inválido) para auditoría
- `POST /api/checkin` también lleva rate limiting por IP/dispositivo.

**c) Secciones adicionales**
- **Búsqueda manual**: buscar por nombre de familia y marcar entrada a mano si la cámara falla o no hay señal
- **Historial / deshacer**: ver últimos escaneos y poder revertir uno por error humano (el revert pone `checked_in = false`, pero como el `jti` ya se consumió, ese QR específico no vuelve a servir — evita que alguien reutilice una foto del QR original tras el revert)
- **Modo sin conexión**: ver sección 7, se eleva a MVP (Fase 1), no queda como mejora futura

---

## 7. Notas de seguridad (resumen ejecutivo)

| Riesgo | Mitigación |
|---|---|
| QR fotografiado y reescaneado tras un revert | `jti` único invalidado en cada uso/regeneración |
| Adivinar tokens de invitación por fuerza bruta | `nanoid` de 21 chars URL-safe + rate limiting en `/api/confirm` |
| Escaneo/registro masivo de QRs falsos | Rate limiting en `/api/checkin` |
| Exposición de `service_role` en el cliente | Toda operación pública pasa por Route Handlers server-side; el navegador nunca tiene esa clave |
| Doble check-in por escaneo simultáneo en dos entradas | Update atómico condicionado (`where checked_in = false`) |
| PIN de staff comprometido | Hash con bcrypt, nunca texto plano |
| Sin señal en el salón el día del evento | Service Worker + IndexedDB en Página 3, prioridad de MVP, no de Fase 2/3 |

---

## 8. Flujo end-to-end (resumen)

```
Organizador (Pág.1)
   ↓ crea evento + plantilla + familias
   ↓ genera link único por familia
Invitado (Pág.2, vía link)
   ↓ confirma asistencia (Sí/No)
   ↓ si Sí → genera QR firmado (con jti), descarga, opción wallet
   ↓ (Realtime) ─────────────► Pág.1 ve confirmación en vivo
Día del evento
Staff (Pág.3)
   ↓ escanea QR → valida firma + jti → valida no-duplicado
   ↓ marca checked_in = true
   ↓ (Realtime) ─────────────► Pág.1 y Pág.3 (otros dispositivos) ven el conteo actualizado
```

---

## 9. Estructura de carpetas sugerida (Next.js App Router)

```
/app
  /admin
    /page.tsx                          # login
    /evento/nuevo/page.tsx
    /evento/[eventId]/plantilla/page.tsx
    /evento/[eventId]/datos/page.tsx
    /evento/[eventId]/invitados/page.tsx
  /invitacion/[token]/page.tsx          # Página 2, pública
  /staff/[eventId]/login/page.tsx
  /staff/[eventId]/conteo/page.tsx
  /staff/[eventId]/escaner/page.tsx
  /api
    /families/route.ts                 # CRUD familias (protegido, admin)
    /invitacion/[token]/route.ts       # GET datos de invitación (público, server-side)
    /confirm/[token]/route.ts          # POST confirmar/rechazar asistencia (rate-limited)
    /checkin/route.ts                  # POST validar y registrar escaneo (rate-limited)
    /wallet/google/route.ts            # Fase 3
    /wallet/apple/route.ts             # Fase 3
/components
  /templates/...                       # plantillas de invitación (una por diseño)
  /ui/...
/lib
  /supabase/ (client.ts, server.ts)
  /qr/ (sign.ts, verify.ts, generate.ts)
  /pdf/ (buildInvitationPdf.ts)
  /calendar/ (buildIcs.ts)
  /rate-limit.ts                        # wrapper de Upstash
```

---

## 10. Roadmap por fases

**Fase 0 — Infraestructura**
Proyecto Next.js + Supabase, esquema de base de datos, Auth admin, deploy inicial en Vercel.

**Fase 1 — MVP funcional**
- Página 1: formulario de evento + gestión de familias + vista Editar/Continuar
- Página 2: invitación pública (vía Route Handler server-side) + confirmación + generación de QR firmado con `jti` + descarga + política de cambio de respuesta
- Página 3: conteo en tiempo real + escáner con validación anti-duplicado + **modo offline (Service Worker + IndexedDB)**
- Rate limiting en `/api/confirm` y `/api/checkin`
- PDF descargable de la invitación (`@react-pdf/renderer`)

**Fase 2 — Mejora de experiencia**
- Varias plantillas visuales con personalización de color/fuente/imagen
- Compartir invitación directo por WhatsApp
- Botón "Agendar" con `.ics` + Google Calendar
- Historial de escaneos y búsqueda manual en Página 3
- Notificación (email) al organizador cuando una familia confirma

**Fase 3 — Extras (opcional, solo si de verdad se necesitan)**
- Agregar a Google Wallet (requiere cuenta Issuer de Google)
- Agregar a Apple Wallet (requiere Apple Developer Program + certificados)

---

## 11. Decisiones confirmadas

- **Alcance del proyecto: uso único**, solo para este evento. Por eso, deliberadamente **no** se incluyen en este documento: analytics/tracking, versionado de plantillas, TOTP/2FA para staff, soporte multi-idioma, ni una tabla `guests` (boletos individuales dentro de una familia) — todo eso resuelve problemas de un producto con múltiples clientes/eventos, no de este caso. Si en el futuro se reutiliza la plataforma para otro evento, estos son los puntos a revisar primero.
- **"Pendientes" en el conteo (Pág. 3)**: son únicamente familias con `estado_confirmacion = 'confirmado'` que aún no tienen `checked_in = true`. Quienes nunca confirmaron **no** entran en este contador.
- **El QR funciona como un boleto de cine**: un solo QR = una familia = `boletos_total`. Al escanearlo se valida y se marca como usado el lote completo de boletos de esa familia en un solo movimiento (no hay boletos individuales por persona dentro de la familia).
- **Cambio de respuesta**: sí está permitido cambiar de "Sí" a "No" o viceversa después de confirmar; cada reconfirmación a "Sí" invalida el QR anterior y genera uno nuevo (ver sección 5.3).
- **Seguridad**: toda operación pública pasa por Route Handlers server-side (nunca `service_role` en el navegador), el QR lleva un `jti` de un solo uso, y los endpoints públicos tienen rate limiting.
- **Modo offline del escáner** se mueve a Fase 1 (MVP), no a Fase 2/3, porque es el punto de falla más probable justo el día del evento.
- Wallet (Google/Apple) se deja en Fase 3 por la complejidad de certificados/cuentas — el MVP cubre la necesidad real (QR descargable + PDF).
