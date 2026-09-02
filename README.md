# Invitaciones y control de acceso — XV Años

Sistema de un solo evento con tres módulos sobre una misma base de datos:

1. **Panel del organizador** (`/admin`) — datos del evento, lista de familias, enlaces de invitación y accesos del personal de puerta.
2. **Invitación pública** (`/invitacion/[token]`) — una URL por familia, confirmación de asistencia y pase con QR.
3. **Control de acceso** (`/staff/[eventId]/...`) — conteo de boletos en vivo, escáner de QR, búsqueda manual e historial.

La especificación completa está en [`xv-anos-sistema-invitaciones.md`](./xv-anos-sistema-invitaciones.md) y el plan de implementación en [`docs/superpowers/plans/`](./docs/superpowers/plans/).

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos, auth y realtime | Supabase (Postgres) |
| Firma de QR | `jose` (JWT HS256 con `jti` de un solo uso) |
| PIN del personal | `bcryptjs` |
| Escáner | `html5-qrcode` |
| PDF | `@react-pdf/renderer` |
| Modo sin conexión | Service Worker + IndexedDB (`idb`) |
| Pruebas | Vitest |

## Puesta en marcha

1. Instala dependencias:

```bash
npm install
```

2. Crea un proyecto en Supabase y ejecuta la migración `supabase/migrations/0001_initial_schema.sql` en el editor SQL.

3. Copia `.env.example` a `.env.local` y llena los valores:

```bash
cp .env.example .env.local
```

Genera el secreto de los QR con algo impredecible:

```bash
openssl rand -base64 48
```

4. Arranca el proyecto:

```bash
npm run dev
```

## Auth del organizador (Supabase)

El panel (`/admin`) entra con un código enviado por correo (`signInWithOtp`). Hay tres ajustes que **solo se hacen en el dashboard**; el repo no puede cambiarlos:

1. **Authentication → URL Configuration → Site URL**  
   En local: `http://localhost:3000`. En producción: la URL de Vercel (`https://….vercel.app` o el dominio propio). Si Site URL queda en localhost, los correos de producción redirigen a localhost.

2. **Authentication → URL Configuration → Redirect URLs**  
   `emailRedirectTo` se ignora si la URL no está en esta lista. Agrega **todas** estas (sin barra final de más):
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=/admin`
   - `https://TU-PROYECTO.vercel.app/auth/callback`
   - `https://TU-PROYECTO.vercel.app/auth/callback?next=/admin`  
   Si usas un dominio custom, también `https://tudominio.com/auth/callback` y la variante con `?next=/admin`.

3. **Authentication → Email Templates → Magic Link**  
   Pega la plantilla de [`docs/supabase-email-magic-link.md`](./docs/supabase-email-magic-link.md) para que el correo muestre `{{ .Token }}` (el código de 6 dígitos) y un enlace a `/auth/callback` con `token_hash` — no a la página «Sign In» de Supabase.

**Cómo entrar:** pide el código en `/admin` y **escríbelo en el formulario**. No pulses «Sign In» en supabase.co. Gmail y otros clientes a menudo abren el enlace mágico al escanear el correo y lo dejan en `otp_expired`.

Si pruebas en `localhost`, el correo **debe** abrir `http://localhost:3000/auth/callback`. Eso es correcto. El fallo es la página alojada de Sign In, no localhost durante el desarrollo.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Pruebas unitarias |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |

## Cómo se usa

**Organizador.** Entra en `/admin` con un código enviado a su correo. Captura los datos del evento, agrega familia por familia con su número de boletos y guarda. En la vista de invitados aparece el enlace único de cada familia, con botón para copiar o compartir por WhatsApp, y la columna de asistencia se actualiza sola conforme llegan las confirmaciones. Más abajo crea los PIN del personal de puerta.

**Familia.** Abre su enlace, ve la invitación con su nombre, puede guardar el PDF y agendar misa y recepción. Al confirmar, se descarga su pase con QR. Puede cambiar de opinión: cada nuevo "sí" genera un pase nuevo y anula el anterior.

**Personal de puerta.** Entra en `/staff/[eventId]/login` con su PIN. Ve el conteo de boletos con barra de aforo, escanea los códigos y puede buscar por nombre o deshacer una entrada equivocada.

## Decisiones de seguridad

- El navegador nunca ve la llave `service_role`. Toda operación pública pasa por Route Handlers en el servidor.
- El QR es un JWT firmado, no un id de familia. Lleva un `jti` que se rota en cada confirmación, así que una foto de un pase anterior deja de servir.
- El check-in usa una actualización condicionada (`checked_in = false`), de modo que dos puertas escaneando a la vez no pueden contar dos veces la misma familia.
- Deshacer una entrada no revive el QR consumido: la familia debe abrir su invitación otra vez.
- Los endpoints públicos tienen límite de peticiones por IP.
- RLS está activo en todas las tablas y `checkin_logs` / `staff_users` no están expuestas al Data API.

## Diferencias respecto a la especificación

Tres puntos se resolvieron distinto a lo escrito en el documento original, con la razón:

- **El escáner no verifica la firma del QR cuando está sin conexión.** Hacerlo exigiría poner el secreto HMAC en el teléfono, lo que permitiría fabricar pases falsos. Sin señal, el escaneo se guarda en IndexedDB y muestra el nombre de la familia desde una copia local de la lista; el servidor da el veredicto real al sincronizar.
- **Las pantallas del personal consultan el servidor cada 5 segundos en vez de usar Realtime.** El personal entra con PIN, no con Supabase Auth, así que suscribirse a Realtime obligaría a exponer las tablas al rol anónimo.
- **El límite de peticiones funciona en memoria si no configuras Upstash.** En ese caso el límite es por instancia, no global. Para el día del evento conviene configurar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

## Pendiente (Fase 3 de la especificación)

Google Wallet y Apple Wallet, que requieren cuenta Issuer y certificados de Apple Developer.
