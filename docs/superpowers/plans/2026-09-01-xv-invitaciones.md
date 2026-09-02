# XV Años — Sistema de Invitaciones y Control de Acceso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-event web system with three connected modules — admin panel, public per-family invitation with signed QR, and staff check-in scanner — on one Supabase database.

**Architecture:** Next.js App Router on Vercel. All public traffic (invitation load, RSVP, check-in) goes through Route Handlers that run server-side with the Supabase `service_role` key; the browser never holds that key. QR payload is a JWT signed with an HMAC secret and carrying a single-use `jti` nonce that is rotated on every re-confirmation, so a photographed QR cannot be replayed. Admin and staff dashboards subscribe to Supabase Realtime for live attendance and capacity counters. The staff scanner is a PWA with a Service Worker and IndexedDB queue so it keeps working when the venue has no signal.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Supabase (Postgres + Auth + Realtime), `jose` (JWT), `bcryptjs` (staff PIN), `nanoid` (invitation tokens), `qrcode` (QR raster), `html5-qrcode` (camera scanner), `@react-pdf/renderer` (PDF), `idb` (IndexedDB), Vitest (tests).

## Global Constraints

- Single-event scope. No multi-tenant abstractions, no `guests` table, no analytics, no i18n, no TOTP.
- `SUPABASE_SERVICE_ROLE_KEY` and `QR_SECRET` are server-only. Never prefixed with `NEXT_PUBLIC_`.
- Every table has RLS enabled. Tables read by the browser (`events`, `families`) also need an explicit `GRANT` to `authenticated` — since 2026-04-28 Supabase no longer exposes new tables to the Data API automatically.
- QR content is a JWT, never a raw `family_id`.
- Check-in writes use a conditional update (`where checked_in = false`) so two scanners cannot double-count.
- Ticket counters everywhere count `boletos`, never families.
- `families.token` is a 21-character URL-safe `nanoid`.
- Public endpoints `/api/confirm/[token]` and `/api/checkin` are rate limited.
- Offline scanner mode ships in Phase 1, not later.
- Node 22, npm 11.

---

## File Structure

| Path | Responsibility |
|---|---|
| `supabase/migrations/0001_initial_schema.sql` | Tables, indexes, RLS, grants, Realtime publication |
| `src/lib/supabase/admin.ts` | `service_role` client, server-only |
| `src/lib/supabase/server.ts` | Cookie-bound SSR client for admin auth |
| `src/lib/supabase/client.ts` | Browser client (publishable key) for Realtime |
| `src/lib/qr/sign.ts` | `signQrToken` — builds the JWT |
| `src/lib/qr/verify.ts` | `verifyQrToken` — validates signature, returns claims |
| `src/lib/qr/jti.ts` | `newJti` — nonce generator |
| `src/lib/rate-limit.ts` | `checkRateLimit` — Upstash when configured, in-memory otherwise |
| `src/lib/calendar/ics.ts` | `buildIcs`, `buildGoogleCalendarUrl` |
| `src/lib/tickets.ts` | `summarizeTickets` — ticket totals by RSVP state |
| `src/lib/pin.ts` | `hashPin`, `verifyPin` |
| `src/lib/offline/queue.ts` | IndexedDB queue for offline scans |
| `src/app/api/**` | Route Handlers |
| `src/app/admin/**` | Admin pages |
| `src/app/invitacion/[token]/**` | Public invitation |
| `src/app/staff/**` | Scanner and counter |
| `src/components/templates/**` | Invitation designs |
| `tests/**` | Vitest unit tests |

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`

- [ ] **Step 1:** `npx create-next-app@latest` with TypeScript, Tailwind, App Router, `src/` directory.
- [ ] **Step 2:** Install runtime deps: `@supabase/supabase-js @supabase/ssr jose bcryptjs nanoid qrcode html5-qrcode @react-pdf/renderer idb`.
- [ ] **Step 3:** Install dev deps: `vitest @vitejs/plugin-react vite-tsconfig-paths @types/qrcode @types/bcryptjs`.
- [ ] **Step 4:** Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- [ ] **Step 5:** Run `npm run test` — expect "No test files found", proving the runner is wired.
- [ ] **Step 6:** Commit `chore: scaffold Next.js project with Supabase and test tooling`.

---

### Task 2: Database schema

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

**Interfaces:**
- Produces: tables `events`, `templates`, `families`, `checkin_logs`, `staff_users` exactly as specified in the spec, plus `families.qr_jti`, `families.checked_in`.

- [ ] **Step 1:** Write the schema from spec section 3 verbatim, adding `create index families_token_idx on families (token);` and `create index families_event_idx on families (event_id);`.
- [ ] **Step 2:** Enable RLS on all five tables.
- [ ] **Step 3:** Add owner policies on `events` and `families` using `to authenticated` plus an ownership predicate; UPDATE policies get both `using` and `with check`.
- [ ] **Step 4:** `grant select, insert, update, delete on events, families to authenticated;` — required because tables are no longer auto-exposed.
- [ ] **Step 5:** `alter publication supabase_realtime add table families;`
- [ ] **Step 6:** Commit `feat: add initial database schema with RLS`.

---

### Task 3: QR signing and verification (TDD)

**Files:**
- Create: `src/lib/qr/sign.ts`, `src/lib/qr/verify.ts`, `src/lib/qr/jti.ts`
- Test: `tests/qr.test.ts`

**Interfaces:**
- Produces:
  - `newJti(): string`
  - `signQrToken(payload: { familyId: string; eventId: string; jti: string }): Promise<string>`
  - `verifyQrToken(token: string): Promise<{ ok: true; familyId: string; eventId: string; jti: string } | { ok: false; reason: 'invalid_signature' | 'malformed' }>`

- [ ] **Step 1: Write the failing tests**

```ts
test('a signed token round-trips back to its claims', async () => {
  const jti = newJti();
  const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });
  const result = await verifyQrToken(token);
  expect(result).toEqual({ ok: true, familyId: 'fam-1', eventId: 'ev-1', jti });
});

test('a token signed with a different secret is rejected', async () => {
  const forged = await new SignJWT({ family_id: 'fam-1' })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode('wrong-secret'));
  expect(await verifyQrToken(forged)).toEqual({ ok: false, reason: 'invalid_signature' });
});

test('two calls to newJti never collide', () => {
  expect(newJti()).not.toBe(newJti());
});
```

- [ ] **Step 2:** Run `npx vitest run tests/qr.test.ts` — expect failure, module not found.
- [ ] **Step 3:** Implement with `jose` `SignJWT` / `jwtVerify`, HS256, secret from `process.env.QR_SECRET`.
- [ ] **Step 4:** Run the tests again — expect PASS.
- [ ] **Step 5:** Commit `feat: add signed QR token with rotating jti`.

---

### Task 4: Ticket summary and rate limiting (TDD)

**Files:**
- Create: `src/lib/tickets.ts`, `src/lib/rate-limit.ts`
- Test: `tests/tickets.test.ts`, `tests/rate-limit.test.ts`

**Interfaces:**
- Produces:
  - `summarizeTickets(families: { boletos_total: number; estado_confirmacion: string; checked_in: boolean }[]): { total: number; confirmados: number; pendientes: number; rechazados: number; ingresados: number; porIngresar: number }`
  - `checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }>`

- [ ] **Step 1:** Write failing tests: totals count tickets not families; `pendientes` excludes families that never confirmed; the limiter allows exactly `limit` calls then blocks; a different key has its own budget.
- [ ] **Step 2:** Run tests — expect FAIL.
- [ ] **Step 3:** Implement. The limiter uses Upstash when `UPSTASH_REDIS_REST_URL` is set, otherwise an in-process `Map` with timestamp pruning.
- [ ] **Step 4:** Run tests — expect PASS.
- [ ] **Step 5:** Commit `feat: add ticket summary and rate limiting`.

---

### Task 5: Calendar and PIN helpers (TDD)

**Files:**
- Create: `src/lib/calendar/ics.ts`, `src/lib/pin.ts`
- Test: `tests/ics.test.ts`, `tests/pin.test.ts`

**Interfaces:**
- Produces:
  - `buildIcs(input: { title: string; description: string; location: string; start: Date; durationMinutes: number }): string`
  - `buildGoogleCalendarUrl(input: same): string`
  - `hashPin(pin: string): Promise<string>` / `verifyPin(pin: string, hash: string): Promise<boolean>`

- [ ] **Step 1:** Failing tests: the `.ics` output contains `BEGIN:VCALENDAR`, a `DTSTART` in UTC basic format, and escapes commas in the description; `verifyPin` accepts the right PIN and rejects a wrong one.
- [ ] **Step 2:** Run — FAIL. **Step 3:** Implement (`bcryptjs`, cost 10). **Step 4:** Run — PASS.
- [ ] **Step 5:** Commit `feat: add ics builder and staff pin hashing`.

---

### Task 6: Supabase clients and auth

**Files:**
- Create: `src/lib/supabase/admin.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/types.ts`

- [ ] **Step 1:** `admin.ts` starts with `import 'server-only'` and throws if `SUPABASE_SERVICE_ROLE_KEY` is missing.
- [ ] **Step 2:** `server.ts` uses `createServerClient` from `@supabase/ssr` bound to `cookies()`.
- [ ] **Step 3:** `client.ts` uses the publishable key for Realtime only.
- [ ] **Step 4:** Commit `feat: add supabase client wrappers`.

---

### Task 7: Admin auth and event CRUD

**Files:**
- Create: `src/app/admin/page.tsx`, `src/app/admin/evento/[eventId]/datos/page.tsx`, `src/app/api/events/route.ts`, `src/app/api/families/route.ts`

- [ ] **Step 1:** Magic-link login form posting to Supabase Auth.
- [ ] **Step 2:** Event form: quinceañera, padres, padrinos (dynamic list, unbounded), mensaje (4 presets + custom), misa and recepción blocks with Maps URL and datetime, `capacidad_total`.
- [ ] **Step 3:** `POST /api/families` generates a 21-char `nanoid` token per row and rejects `boletos_total < 1`.
- [ ] **Step 4:** Commit `feat: add admin event and family management`.

---

### Task 8: Admin monitoring view

**Files:**
- Create: `src/app/admin/evento/[eventId]/invitados/page.tsx`, `src/components/admin/FamiliesTable.tsx`

- [ ] **Step 1:** Table with Nombre / Boletos / Asistencia / Invitación.
- [ ] **Step 2:** Realtime subscription on `families` updates the Asistencia cell live.
- [ ] **Step 3:** Copy button and a `wa.me` share link per row.
- [ ] **Step 4:** Summary strip above the table using `summarizeTickets`.
- [ ] **Step 5:** Commit `feat: add live admin monitoring table`.

---

### Task 9: Public invitation endpoint and page

**Files:**
- Create: `src/app/api/invitacion/[token]/route.ts`, `src/app/invitacion/[token]/page.tsx`, `src/components/templates/ClasicaTemplate.tsx`

- [ ] **Step 1:** `GET /api/invitacion/[token]` looks the family up server-side and returns only render-safe fields — never `qr_jti`, never internal ids beyond what the page needs.
- [ ] **Step 2:** A family already marked `confirmado` renders straight to the QR view.
- [ ] **Step 3:** Template shows the family name prominently, mensaje, misa and recepción with a pin icon linking to Maps and an Agendar button.
- [ ] **Step 4:** Commit `feat: add public invitation page`.

---

### Task 10: RSVP confirmation and QR delivery

**Files:**
- Create: `src/app/api/confirm/[token]/route.ts`, `src/components/invitation/ConfirmDialog.tsx`

- [ ] **Step 1:** `POST` with `{ asistira: boolean }`. Rate limited per IP.
- [ ] **Step 2:** On `false`: set `rechazado`, clear `qr_jti`.
- [ ] **Step 3:** On `true`: set `confirmado`, stamp `confirmado_at`, write a fresh `qr_jti`, return the newly signed JWT. Any previously issued QR stops verifying at that moment.
- [ ] **Step 4:** Client renders the QR, triggers an automatic download, and shows the ticket count.
- [ ] **Step 5:** Commit `feat: add rsvp confirmation with rotating qr`.

---

### Task 11: PDF download

**Files:**
- Create: `src/lib/pdf/InvitationPdf.tsx`, `src/components/invitation/DownloadPdfButton.tsx`

- [ ] **Step 1:** `@react-pdf/renderer` document with event data and clickable Maps links.
- [ ] **Step 2:** Generate client-side on demand so there is no cold start.
- [ ] **Step 3:** Commit `feat: add invitation pdf download`.

---

### Task 12: Staff PIN login and counter

**Files:**
- Create: `src/app/staff/[eventId]/login/page.tsx`, `src/app/api/staff/login/route.ts`, `src/app/staff/[eventId]/conteo/page.tsx`

- [ ] **Step 1:** PIN posted to a Route Handler, compared with `verifyPin`, session stored in an httpOnly cookie.
- [ ] **Step 2:** Counter toggles Ingresados / Pendientes, headline number is tickets, and a capacity bar warns as `capacidad_total` approaches.
- [ ] **Step 3:** Realtime keeps both lists current across devices.
- [ ] **Step 4:** Commit `feat: add staff login and live ticket counter`.

---

### Task 13: Scanner and atomic check-in

**Files:**
- Create: `src/app/api/checkin/route.ts`, `src/app/staff/[eventId]/escaner/page.tsx`

**Interfaces:**
- Produces: `POST /api/checkin` accepting `{ qr: string }`, returning `{ resultado: 'exitoso' | 'duplicado' | 'invalido' | 'jti_expirado', familia?, boletos?, checkedInAt? }`.

- [ ] **Step 1:** Verify signature, then compare `jti` against the stored `families.qr_jti`, then run the conditional update.
- [ ] **Step 2:** Every attempt writes a `checkin_logs` row with its outcome.
- [ ] **Step 3:** Camera view via `html5-qrcode`; success shows family name and ticket count, a repeat shows the original entry time.
- [ ] **Step 4:** Commit `feat: add qr scanner with atomic check-in`.

---

### Task 14: Manual search and undo

**Files:**
- Create: `src/app/staff/[eventId]/historial/page.tsx`, `src/app/api/checkin/undo/route.ts`, `src/app/api/families/search/route.ts`

- [ ] **Step 1:** Search by family name, mark entry by hand.
- [ ] **Step 2:** Undo clears `checked_in` but leaves `qr_jti` consumed, so the original QR photo stays dead.
- [ ] **Step 3:** Commit `feat: add manual search and check-in undo`.

---

### Task 15: Offline scanner mode

**Files:**
- Create: `public/sw.js`, `src/lib/offline/queue.ts`, `src/components/staff/OfflineBanner.tsx`, `public/manifest.json`

- [ ] **Step 1:** Service Worker precaches the staff shell.
- [ ] **Step 2:** Scans made offline verify the JWT signature locally, record to IndexedDB, and show a provisional confirmation.
- [ ] **Step 3:** On reconnect the queue flushes to `/api/checkin`; the server stays the authority on duplicates.
- [ ] **Step 4:** Commit `feat: add offline scanning with indexeddb queue`.

---

### Task 16: Design pass and verification

- [ ] **Step 1:** Apply the invitation palette and type system.
- [ ] **Step 2:** Check contrast, focus rings, 44px touch targets, `prefers-reduced-motion`.
- [ ] **Step 3:** `npm run test`, `npx tsc --noEmit`, `npm run build` all clean.
- [ ] **Step 4:** Commit `feat: apply invitation design system`.
