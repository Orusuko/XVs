# Pulido de estados y mensajes de invitación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada pantalla de espera, vacío, error y cada mensaje de invitación se lea como parte del boleto — no como una página HTML de formulario.

**Architecture:** No se cambia el modelo de datos ni las APIs de QR/check-in. Se extrae un marco visual compartido (`EstadoHoja`) para loading/vacío/error, se sustituyen los radios de mensaje por tarjetas con tipografía de invitación, se cubren las rutas de error de Next.js (`error.tsx` / `global-error.tsx`) y se limpia el copy de login para que no muestre comandos de terminal al organizador.

**Tech Stack:** Next.js App Router, Tailwind v4 (tokens existentes `--color-papel`, `--font-display`, `--font-script`, `--font-ticket`), componentes ya en `src/components/ui/`, Vitest.

**Spec:** [xv-anos-sistema-invitaciones.md](../../../xv-anos-sistema-invitaciones.md) §5 (invitación pública), §6 (staff), §10 Fase 2 (experiencia). Auditoría de 2026-09-03 en este mismo documento.

## Global Constraints

- Un solo evento. No multi-tenant, no i18n, no analytics, no Wallet (Fase 3).
- No sustituir la paleta vino/oro/papel por otra (ui-ux-pro-max sugirió Soft UI + rosa `#DB2777`; se ignora — el producto ya tiene identidad de talón).
- Tipografía existente: Fraunces (display), Great Vibes (script), Karla (cuerpo), Space Mono (ticket).
- Targets táctiles ≥ 44px (`min-h-11`). `cursor-pointer` en todo clicable. `role="alert"` / `aria-live` en errores. `prefers-reduced-motion` ya está en `globals.css`.
- Copy en español, para la persona en la puerta o en el sofá — nunca un comando `node --env-file=…`.
- Errores de Postgres/Supabase no se muestran crudos al usuario (`error.message` de `.from()`).
- Contadores siguen midiendo boletos, no familias.

---

## Hallazgos de la auditoría (2026-09-03)

### Lo que ya funciona

- Tres módulos vivos: admin, invitación pública (3 plantillas + PDF con fuentes), staff (preview → Adelante, offline).
- QR JWT + `jti`, check-in atómico, rate limit, RLS.
- Invitación y PDF ya tienen voz de boleto. El hueco está en **los alrededores**.

### Lo que se ve como HTML suelto

| Superficie | Archivo | Problema |
|---|---|---|
| Mensajes de invitación | [`FormularioEvento.tsx`](../../../src/components/admin/FormularioEvento.tsx) L140–180 | Cuatro frases en `<input type="radio">` + texto gris. No se ve cómo quedarán en la invitación. |
| Loading / error staff | [`VistaConteo.tsx`](../../../src/components/staff/VistaConteo.tsx) L11–16, [`VistaHistorial.tsx`](../../../src/components/staff/VistaHistorial.tsx) L49–50 | Un `<p>` centrado. Sin estructura, sin acción. |
| 404 | [`not-found.tsx`](../../../src/app/not-found.tsx) | Tiene voz, pero no hay `error.tsx` ni `global-error.tsx` → un crash muestra la página por defecto de Next.js. |
| Login admin | [`FormularioAcceso.tsx`](../../../src/components/admin/FormularioAcceso.tsx) L303–307, [`mensajes.ts`](../../../src/lib/auth/mensajes.ts) | El organizador ve `node --env-file=.env scripts/crear-organizador.mjs…`. Eso es copy de desarrollo. |
| Inicio | [`page.tsx`](../../../src/app/page.tsx) | Bloque centrado correcto, pero si el auth falla cae en `/` con el mismo aviso técnico. |
| Admin sin chrome | `admin/page.tsx`, `datos`, `invitados`, `plantilla` | No hay “Cerrar sesión”. “Paso 1 de 2” en [`nuevo/page.tsx`](../../../src/app/admin/evento/nuevo/page.tsx) es mentira: hay datos + plantilla + invitados. |
| Familias | [`TablaFamilias.tsx`](../../../src/components/admin/TablaFamilias.tsx) | Existe `DELETE /api/families` y no hay botón. No se edita boletos/nombre. |
| APIs | `events`, `families`, `staff/pin` | Devuelven `error.message` de Supabase al cliente. |
| Muerto | [`TalonQr.tsx`](../../../src/components/invitation/TalonQr.tsx) | Sustituido por `PaseCine`; el archivo viejo sigue. |

### Fuera de este plan (Fase 2/3 del spec)

- Email al organizador cuando confirman.
- Wallet Apple/Google.
- Cambiar `events.template_id` (uuid) — hoy la plantilla vive en `template_config.plantilla`.
- Staff Realtime (hoy poll 5s; es suficiente para un evento).

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/mensajes-invitacion.ts` | Catálogo de frases + `esMensajeCatalogo` |
| `tests/mensajes-invitacion.test.ts` | El catálogo no se rompe y el propio se distingue |
| `src/components/admin/SelectorMensaje.tsx` | Tarjetas de mensaje con tipografía de invitación |
| `src/components/ui/EstadoHoja.tsx` | Marco compartido: loading / vacío / error (papel o tinta) |
| `src/app/error.tsx` | Error de segmento con reset |
| `src/app/global-error.tsx` | Error de raíz (incluye `<html>`/`<body>`) |
| `src/lib/auth/mensajes.ts` | Copy de login sin CLI |
| `src/components/admin/FormularioAcceso.tsx` | Quitar el párrafo del script |
| `src/components/admin/NavegacionAdmin.tsx` | Salir + pasos del evento |
| `src/components/staff/VistaConteo.tsx` | Usar `EstadoHoja` |
| `src/components/staff/VistaHistorial.tsx` | Usar `EstadoHoja` |
| `src/app/admin/page.tsx` | Logout + `EstadoHoja` en vacío |
| `src/components/admin/TablaFamilias.tsx` | Quitar familia (DELETE ya existe) |
| `src/app/api/events/route.ts`, `families/route.ts`, `staff/pin/route.ts` | No filtrar `error.message` crudo |
| Borrar `src/components/invitation/TalonQr.tsx` | Código muerto |

---

### Task 1: Catálogo de mensajes de invitación

**Files:**
- Create: `src/lib/mensajes-invitacion.ts`
- Create: `tests/mensajes-invitacion.test.ts`
- Modify: `src/components/admin/FormularioEvento.tsx` (importar el catálogo; el UI nuevo es Task 2)

**Interfaces:**
- Consumes: nada
- Produces: `MENSAJES_INVITACION: readonly string[]`, `esMensajeCatalogo(texto: string): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'vitest';
import { MENSAJES_INVITACION, esMensajeCatalogo } from '@/lib/mensajes-invitacion';

describe('mensajes de invitación', () => {
  test('hay exactamente cuatro frases y ninguna está vacía', () => {
    expect(MENSAJES_INVITACION).toHaveLength(4);
    expect(MENSAJES_INVITACION.every((m) => m.trim().length > 20)).toBe(true);
  });

  test('una frase del catálogo se reconoce; un texto propio no', () => {
    expect(esMensajeCatalogo(MENSAJES_INVITACION[0]!)).toBe(true);
    expect(esMensajeCatalogo('Nos vemos en el vals.')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mensajes-invitacion.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Write minimal implementation**

Mover las cuatro frases actuales de `FormularioEvento` (no inventar copy nuevo en este task; el pulido visual es Task 2). Añadir una quinta solo si se quiere más variedad — **no** en este task.

```ts
export const MENSAJES_INVITACION = [
  'Hay momentos que se guardan para siempre, y quiero que tú seas parte de este.',
  'Con la ilusión de cumplir quince años, me encantaría celebrarlo contigo.',
  'Hoy dejo atrás la niñez y me acompañas a empezar una etapa nueva.',
  'Gracias por caminar conmigo hasta aquí. Acompáñame también esa noche.',
] as const;

export function esMensajeCatalogo(texto: string): boolean {
  return (MENSAJES_INVITACION as readonly string[]).includes(texto);
}
```

En `FormularioEvento`, reemplazar `MENSAJES` por `MENSAJES_INVITACION` y `MENSAJES.includes` por `esMensajeCatalogo`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mensajes-invitacion.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mensajes-invitacion.ts tests/mensajes-invitacion.test.ts src/components/admin/FormularioEvento.tsx
git commit -m "feat: extrae el catálogo de mensajes de invitación"
```

---

### Task 2: Selector de mensaje como tarjeta de invitación

**Files:**
- Create: `src/components/admin/SelectorMensaje.tsx`
- Modify: `src/components/admin/FormularioEvento.tsx` (sección Mensaje)

**Interfaces:**
- Consumes: `MENSAJES_INVITACION`, `esMensajeCatalogo`
- Produces: `SelectorMensaje({ valor, propio, onElegirCatalogo, onEscribirPropio, onCambiarPropio })`

Reglas ui-ux-pro-max aplicadas aquí: un CTA visual claro (tarjeta elegida = `border-vino`), tap ≥ 44px, no radios nativos desnudos, preview con `font-display` para que se vea como en la invitación.

- [ ] **Step 1: Create the card picker**

```tsx
'use client';

import { MENSAJES_INVITACION } from '@/lib/mensajes-invitacion';

type Props = {
  valor: string;
  propio: boolean;
  onElegirCatalogo: (texto: string) => void;
  onEscribirPropio: () => void;
  onCambiarPropio: (texto: string) => void;
};

const TARJETA =
  'min-h-11 w-full cursor-pointer rounded-[2px] border px-5 py-5 text-left transition-colors duration-200';

export function SelectorMensaje({
  valor,
  propio,
  onElegirCatalogo,
  onEscribirPropio,
  onCambiarPropio,
}: Props) {
  return (
    <div role="radiogroup" aria-label="Mensaje de la invitación" className="grid gap-3">
      {MENSAJES_INVITACION.map((texto) => {
        const elegida = !propio && valor === texto;
        return (
          <button
            key={texto}
            type="button"
            role="radio"
            aria-checked={elegida}
            onClick={() => onElegirCatalogo(texto)}
            className={`${TARJETA} ${elegida ? 'border-vino bg-papel-alto' : 'border-borde hover:border-vino'}`}
          >
            <p className="font-ticket text-[10px] uppercase tracking-[0.2em] text-oro">
              {elegida ? 'Elegido' : 'Mensaje'}
            </p>
            <p className="mt-2 font-display text-lg leading-relaxed text-tinta">{texto}</p>
          </button>
        );
      })}

      <button
        type="button"
        role="radio"
        aria-checked={propio}
        onClick={onEscribirPropio}
        className={`${TARJETA} ${propio ? 'border-vino bg-papel-alto' : 'border-borde hover:border-vino'}`}
      >
        <p className="font-ticket text-[10px] uppercase tracking-[0.2em] text-oro">El mío</p>
        <p className="mt-2 text-sm text-tinta-suave">Escribe una frase que suene a ella, no a plantilla.</p>
      </button>

      {propio && (
        <textarea
          value={valor}
          onChange={(e) => onCambiarPropio(e.target.value)}
          rows={3}
          aria-label="Mensaje propio"
          className="min-h-24 w-full rounded-[2px] border border-borde bg-papel-alto p-4 font-display text-lg text-tinta outline-none focus:border-vino"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire FormularioEvento**

Sustituir el bloque `<Seccion titulo="Mensaje">…</Seccion>` por:

```tsx
<Seccion titulo="Mensaje">
  <SelectorMensaje
    valor={mensaje}
    propio={mensajePropio}
    onElegirCatalogo={(texto) => {
      setMensajePropio(false);
      setMensaje(texto);
    }}
    onEscribirPropio={() => {
      setMensajePropio(true);
      setMensaje('');
    }}
    onCambiarPropio={setMensaje}
  />
</Seccion>
```

- [ ] **Step 3: Verify in browser**

`/admin/evento/nuevo` y `/admin/evento/[id]/datos`: las cuatro frases se leen en Fraunces; la elegida tiene borde vino; “El mío” abre textarea con la misma tipografía.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/SelectorMensaje.tsx src/components/admin/FormularioEvento.tsx
git commit -m "feat: selector de mensaje con preview de invitación"
```

---

### Task 3: Marco compartido EstadoHoja

**Files:**
- Create: `src/components/ui/EstadoHoja.tsx`
- Modify: `src/components/staff/VistaConteo.tsx`, `src/components/staff/VistaHistorial.tsx`, `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: tokens CSS existentes
- Produces: `EstadoHoja({ tono, titulo, detalle, accion? })` donde `tono` es `'papel' | 'tinta'`

- [ ] **Step 1: Create EstadoHoja**

```tsx
import type { ReactNode } from 'react';

type Props = {
  tono?: 'papel' | 'tinta';
  etiqueta?: string;
  titulo: string;
  detalle: string;
  accion?: ReactNode;
};

export function EstadoHoja({ tono = 'papel', etiqueta, titulo, detalle, accion }: Props) {
  const tinta = tono === 'tinta';
  return (
    <div className={`mx-auto flex min-h-[40vh] w-full max-w-md flex-col items-center justify-center px-6 text-center ${tinta ? 'text-papel' : 'text-tinta'}`}>
      {etiqueta && (
        <p className={`font-ticket text-[11px] uppercase tracking-[0.28em] ${tinta ? 'text-oro-claro' : 'text-oro'}`}>
          {etiqueta}
        </p>
      )}
      <h2 className={`mt-3 font-display text-2xl ${tinta ? 'text-papel' : 'text-tinta'}`}>{titulo}</h2>
      <p className={`mt-2 text-sm ${tinta ? 'text-papel/70' : 'text-tinta-suave'}`}>{detalle}</p>
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Replace staff bare `<p>`**

`VistaConteo` error:

```tsx
if (error) {
  return (
    <EstadoHoja
      tono="tinta"
      etiqueta="Conteo"
      titulo="Se cortó la sesión"
      detalle={error}
    />
  );
}
```

Loading:

```tsx
if (!estado) {
  return (
    <EstadoHoja
      tono="tinta"
      etiqueta="Conteo"
      titulo="Preparando el conteo"
      detalle="Un momento, estamos pidiendo los boletos de esta noche."
    />
  );
}
```

Mismo patrón en `VistaHistorial` (error / Cargando). El empty de listas (`Todavía no entra nadie`) también pasa por `EstadoHoja` **sin** ocupar `min-h-[40vh]` si está bajo pestañas — añadir prop opcional `compacto?: boolean` que quite el `min-h-[40vh]`.

- [ ] **Step 3: Admin empty event list**

El bloque “Todavía no hay ningún evento” en `admin/page.tsx` usa `EstadoHoja` tono papel + el mismo `Link` “Crear el evento” como `accion`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/EstadoHoja.tsx src/components/staff/VistaConteo.tsx src/components/staff/VistaHistorial.tsx src/app/admin/page.tsx
git commit -m "feat: estados de espera y vacío con voz de boleto"
```

---

### Task 4: error.tsx y global-error.tsx

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`

Next.js App Router: `error.tsx` es Client Component con `reset`. `global-error.tsx` debe renderizar `<html>` y `<body>`.

- [ ] **Step 1: error.tsx**

```tsx
'use client';

import { EstadoHoja } from '@/components/ui/EstadoHoja';
import { Boton } from '@/components/ui/Boton';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="textura-papel min-h-screen">
      <EstadoHoja
        etiqueta="Algo falló"
        titulo="Esta hoja se atascó"
        detalle="Prueba de nuevo. Si sigue igual, pide el enlace otra vez a quien te invitó."
        accion={
          <Boton type="button" onClick={reset}>
            Reintentar
          </Boton>
        }
      />
    </main>
  );
}
```

- [ ] **Step 2: global-error.tsx**

Igual, pero envuelto en `<html lang="es"><body className="min-h-full">`. Importar `globals.css` o clases inline con los hex del tema (`#f4ecf1`, `#2a1424`, `#7b2d5e`) porque el layout raíz puede haber petado.

- [ ] **Step 3: Alinear not-found.tsx**

`not-found.tsx` ya tiene copy bueno. Envolverlo en `EstadoHoja` para que 404 y error compartan ritmo (eyebrow + display + detalle + acción).

- [ ] **Step 4: Commit**

```bash
git add src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx
git commit -m "feat: páginas de error con la misma voz que la invitación"
```

---

### Task 5: Login sin comandos de terminal

**Files:**
- Modify: `src/lib/auth/mensajes.ts`
- Modify: `src/components/admin/FormularioAcceso.tsx`
- Modify: `tests/auth-mensajes.test.ts` (actualizar aserciones que busquen el script)

**Interfaces:**
- Consumes: `mensajeErrorAcceso`
- Produces: mismos códigos, copy humano

- [ ] **Step 1: Update tests first**

Si un test espera `MENSAJE_SCRIPT` dentro de `MENSAJES_ACCESO.credenciales`, cambiarlo a esperar “Correo o contraseña incorrectos” **sin** `node --`.

- [ ] **Step 2: Rewrite MENSAJES_ACCESO**

Cada valor deja de concatenar `MENSAJE_SCRIPT`. Ejemplos:

```ts
credenciales: 'Correo o contraseña incorrectos. Si acabas de crear la cuenta, pide que te confirmen el acceso.',
confirmarCorreo: 'Ese correo aún no está listo. Escribe a quien armó el panel para que lo active.',
limite: 'Demasiados intentos seguidos. Espera un minuto e inténtalo de nuevo.',
generico: 'No pudimos completar el acceso. Revisa correo y contraseña, o pide un código nuevo.',
```

Dejar `debil` y `correoInvalido` como están (ya son humanos).

- [ ] **Step 3: FormularioAcceso**

Quitar el `<p>` de L303–307 que pinta el comando. Quitar el import de `MENSAJE_SCRIPT` si queda huérfano. El script sigue existiendo en `scripts/crear-organizador.mjs` para quien desarrolla — no en la UI.

- [ ] **Step 4: Run tests**

`npx vitest run tests/auth-mensajes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/mensajes.ts src/components/admin/FormularioAcceso.tsx tests/auth-mensajes.test.ts
git commit -m "fix: copy de login sin comandos de desarrollo"
```

---

### Task 6: Chrome de admin — salir y pasos reales

**Files:**
- Create: `src/components/admin/NavegacionAdmin.tsx`
- Create: `src/app/admin/layout.tsx` (solo chrome; el login sin user sigue a pantalla completa)
- Modify: `src/app/admin/evento/nuevo/page.tsx` (“Paso 1 de 2” → “Datos del evento”)
- Modify: páginas `datos`, `invitados`, `plantilla` para usar la misma fila de pasos

**Interfaces:**
- Consumes: `supabaseBrowser().auth.signOut()`, `eventId?`
- Produces: barra con Invitados / Plantilla / Datos + “Cerrar sesión”

- [ ] **Step 1: NavegacionAdmin**

Cliente. Si no hay `eventId`, solo “Cerrar sesión”. Si hay, tres links `min-h-11` con `aria-current` según `usePathname()`.

```tsx
async function salir() {
  await supabaseBrowser().auth.signOut();
  window.location.assign('/admin');
}
```

- [ ] **Step 2: Colocar la barra**

No meter el login (user ausente) dentro de un layout que pida sesión. Opciones válidas: (a) layout que solo renderiza children + barra si `getUser()`, o (b) insertar `<NavegacionAdmin eventId={…} />` en cada página autenticada. Preferir (a) en `src/app/admin/layout.tsx` leyendo `supabaseServer()`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/NavegacionAdmin.tsx src/app/admin/layout.tsx src/app/admin/evento/nuevo/page.tsx src/app/admin/evento/[eventId]/datos/page.tsx src/app/admin/evento/[eventId]/invitados/page.tsx src/app/admin/evento/[eventId]/plantilla/page.tsx
git commit -m "feat: navegación de admin con cierre de sesión"
```

---

### Task 7: Quitar familia + no filtrar errores SQL

**Files:**
- Modify: `src/components/admin/TablaFamilias.tsx`
- Modify: `src/app/api/families/route.ts`, `src/app/api/events/route.ts`, `src/app/api/staff/pin/route.ts`

- [ ] **Step 1: Botón Quitar**

Por fila, `button` `inline-flex h-11 items-center` “Quitar”. Confirmar con `window.confirm('¿Quitar a la familia X de la lista?')`. `DELETE /api/families` con `{ id }`. Quitar la fila del state si `ok`.

- [ ] **Step 2: Mapear errores de API**

Donde hoy `return NextResponse.json({ error: error.message }, { status: 400 })`, devolver un mensaje fijo: `'No pudimos guardar. Revisa los datos e inténtalo de nuevo.'` Loguear `error.message` solo en `console.error` del servidor.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/TablaFamilias.tsx src/app/api/families/route.ts src/app/api/events/route.ts src/app/api/staff/pin/route.ts
git commit -m "feat: quitar familia y ocultar errores internos de la API"
```

---

### Task 8: Borrar TalonQr y verificar

**Files:**
- Delete: `src/components/invitation/TalonQr.tsx` (si nadie lo importa; `PaseCine` lo reemplazó)

- [ ] **Step 1:** Confirmar con grep que no hay imports de `TalonQr`. Borrar el archivo.

- [ ] **Step 2:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run`.

- [ ] **Step 3:** Recorrido manual:
  1. `/admin` login — ningún `node --` en pantalla.
  2. Nuevo evento — selector de mensaje en tarjetas Fraunces.
  3. Forzar 404 (`/invitacion/token-falso`) — `EstadoHoja`, no HTML de Next.
  4. Staff conteo al cargar — “Preparando el conteo”, no “Cargando…”.
  5. Cerrar sesión vuelve a `/admin`.

- [ ] **Step 4: Commit**

```bash
git add -A src/components/invitation/TalonQr.tsx
git commit -m "chore: elimina TalonQr sustituido por PaseCine"
```

---

## Self-review

1. **Spec coverage:** §5 mensaje de invitación → Tasks 1–2. §6 staff feedback → Task 3. Seguridad copy/API → Tasks 5 y 7. Fase 2 email/WhatsApp extra y Fase 3 wallet quedan fuera (anotado).
2. **Placeholders:** ninguno. Copy y firmas están escritos.
3. **Types:** `EstadoHoja` / `SelectorMensaje` / `esMensajeCatalogo` se usan con los mismos nombres en tasks posteriores.
