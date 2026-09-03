# Desbloquear login del organizador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El organizador entra a `/admin` con correo y contraseña sin esperar ningún email (magic link, OTP, rate limit o Confirm email).

**Architecture:** El formulario de `/admin` ya usa `signInWithPassword` como modo por defecto. El desbloqueo real es crear o actualizar el usuario en Auth con la Admin API (`service_role`) y `email_confirm: true`, que no envía correo y funciona aunque «Confirm email» siga activo. Un script local de un solo uso lee `.env` / `.env.local` sin imprimir secretos. Los errores del formulario dejan de mandar al dashboard y dicen que corran el script.

**Tech Stack:** Next.js 16 (App Router), `@supabase/supabase-js` Admin API, Node 22 `--env-file`, Vitest.

**Spec:** Este plan (sesión de desbloqueo de login). No hay spec aparte; el alcance es solo desbloquear `/admin`.

## Global Constraints

- UI y mensajes de error en español.
- No `git commit` ni `git push` (pedido explícito del usuario). Saltar cualquier paso «Commit» de este plan.
- Nunca volcar valores de `.env` / `.env.local` al chat, a logs, ni a archivos del repo. Comprobar presencia (`set` / `missing`), no imprimir claves.
- No escribir contraseñas reales en el repo. El ejemplo del README usa placeholders.
- No tocar Wallet, plantillas ni features nuevas.
- No inventar aplicar SQL filtrando `SUPABASE_SERVICE_ROLE_KEY` en la transcripción.
- Si el MCP de Supabase está en `needsAuth`, no ciclar autenticación. Anotar y seguir.
- Node 22: `node --env-file=.env` carga variables sin un paquete `dotenv`.
- Contraseña mínima: 8 caracteres (igual que el formulario).
- `createUser` / `updateUserById` siempre con `email_confirm: true` (no manda correo; ignora el toggle Confirm email).
- El script no registra `password` ni `ORGANIZER_PASSWORD` ni el valor de `SUPABASE_SERVICE_ROLE_KEY`.

## Alternativas consideradas

| # | Alternativa | ¿Desbloquea sin email? | Decisión |
|---|---|---|---|
| 1 | Correo + contraseña en `/admin` | Solo si el usuario **ya existe y está confirmado**. El formulario ya está; hay que verificarlo y que sea el camino primario. | **Se queda** como UI de entrada. |
| 2 | Script local `auth.admin.createUser` + `email_confirm: true` | Sí. No pasa por `signUp`, OTP, Gmail ni el rate limit de correo. Si el correo ya existe (intentos OTP), `updateUserById` pone contraseña y confirma. | **Elegida** para crear/arreglar el usuario. |
| 3 | Dashboard → Users → Add user | Sí, pero el usuario ya se atascó ahí y pidió no más lecturas del dashboard. | Fuera. El script lo sustituye. |
| 4 | Desactivar Confirm email en el dashboard | Ayuda a `signUp`, no crea el usuario si hay rate limit. | Innecesario si el script confirma el email. No lo podemos toggleár sin dashboard/MCP. |
| 5 | Magic link / código OTP | Ya falló (`otp_expired`, Gmail, Sign In alojado, rate limit). | Queda como enlace secundario. No es el desbloqueo. |
| 6 | `signUp` desde el formulario | Choca con Confirm email y con el rate limit. | Se deja el botón, pero el copy manda al script. |
| 7 | Migración SQL por MCP / CLI | El schema no crea usuarios de Auth. Solo aplicar si hay sesión; no desbloquea el login. | Intentar; si `needsAuth` o no hay link, saltar. |

**Pila elegida:** (1) formulario correo+contraseña como único camino de entrada + (2) script Admin API para crear o restablecer el usuario sin correo + (3) README con el comando exacto + mensajes del formulario que dicen «corre el script».

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/auth/crear-organizador-cli.ts` | Parseo de flags CLI, resolución email/contraseña, parseo silencioso de `.env`, detección de env de servicio y de «usuario ya existe». Sin red. |
| `scripts/crear-organizador.mjs` | Carga env, llama `createUser` / `updateUserById`. Importa los helpers TypeScript (Node 22 type stripping) o, si falla, los helpers se duplican en el mismo `.mjs` exportándolos. Comando canónico: `node --env-file=.env scripts/crear-organizador.mjs`. |
| `tests/crear-organizador-cli.test.ts` | Pruebas del parseo y de la resolución. Cero llamadas de red. |
| `src/lib/auth/mensajes.ts` | Copy en español que apunta al script, no al dashboard. |
| `tests/auth-mensajes.test.ts` | Sigue pasando con los strings nuevos. |
| `src/components/admin/FormularioAcceso.tsx` | Contraseña primaria (ya lo es). Aviso fijo: corre el script. |
| `README.md` | Sección: crear organizador y entrar a `/admin`. |

---

### Task 1: Helpers CLI (TDD, sin red)

**Files:**
- Create: `src/lib/auth/crear-organizador-cli.ts`
- Test: `tests/crear-organizador-cli.test.ts`

**Interfaces:**
- Consumes: `argv: string[]` (sin `node` ni la ruta del script; el runner pasa `process.argv.slice(2)`), `env: Record<string, string | undefined>`.
- Produces:
  - `export type FlagsOrganizador = { email?: string; password?: string; help: boolean }`
  - `export type ResultadoCredenciales = { ok: true; email: string; password: string } \| { ok: false; error: string }`
  - `export function parseFlagsOrganizador(argv: string[]): FlagsOrganizador`
  - `export function resolveCredencialesOrganizador(flags: FlagsOrganizador, env: Record<string, string | undefined>): ResultadoCredenciales`
  - `export function parseLineasEnv(texto: string): Record<string, string>`
  - `export function fusionarEnvArchivos(base: Record<string, string | undefined>, archivos: Record<string, string>[]): Record<string, string | undefined>` — no pisa claves ya definidas en `base` (gana `--env-file` / el shell).
  - `export function faltaEnvServicio(env: Record<string, string | undefined>): string | null`
  - `export function esErrorUsuarioExistente(error: { code?: string; message?: string } | null | undefined): boolean`
  - `export const MENSAJE_SCRIPT = 'node --env-file=.env scripts/crear-organizador.mjs --email tu@correo.com --password "…"'` (placeholder, no un secreto)

- [ ] **Step 1: Write the failing test**

Create `tests/crear-organizador-cli.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  esErrorUsuarioExistente,
  faltaEnvServicio,
  fusionarEnvArchivos,
  parseFlagsOrganizador,
  parseLineasEnv,
  resolveCredencialesOrganizador,
} from '@/lib/auth/crear-organizador-cli';

describe('parseFlagsOrganizador', () => {
  test('lee --email y --password', () => {
    expect(
      parseFlagsOrganizador(['--email', 'ana@x.com', '--password', 'clave-secreta']),
    ).toEqual({ email: 'ana@x.com', password: 'clave-secreta', help: false });
  });

  test('acepta --email= y --password=', () => {
    expect(parseFlagsOrganizador(['--email=ana@x.com', '--password=clave-secreta'])).toEqual({
      email: 'ana@x.com',
      password: 'clave-secreta',
      help: false,
    });
  });

  test('marca help con --help o -h', () => {
    expect(parseFlagsOrganizador(['--help']).help).toBe(true);
    expect(parseFlagsOrganizador(['-h']).help).toBe(true);
  });

  test('sin flags no inventa credenciales', () => {
    expect(parseFlagsOrganizador([])).toEqual({ help: false });
  });
});

describe('resolveCredencialesOrganizador', () => {
  test('los flags ganan sobre ORGANIZER_EMAIL / ORGANIZER_PASSWORD', () => {
    const r = resolveCredencialesOrganizador(
      { email: 'flag@x.com', password: 'flag-pass-1', help: false },
      { ORGANIZER_EMAIL: 'env@x.com', ORGANIZER_PASSWORD: 'env-pass-1' },
    );
    expect(r).toEqual({ ok: true, email: 'flag@x.com', password: 'flag-pass-1' });
  });

  test('cae a env si faltan flags', () => {
    const r = resolveCredencialesOrganizador(
      { help: false },
      { ORGANIZER_EMAIL: 'env@x.com', ORGANIZER_PASSWORD: 'env-pass-1' },
    );
    expect(r).toEqual({ ok: true, email: 'env@x.com', password: 'env-pass-1' });
  });

  test('recorta espacios del correo y no mete la contraseña en el error', () => {
    const r = resolveCredencialesOrganizador({ email: '  ana@x.com  ', help: false }, {});
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/--password|ORGANIZER_PASSWORD/);
    expect(r.error).not.toContain('ana@x.com');
  });

  test('exige 8 caracteres de contraseña', () => {
    const r = resolveCredencialesOrganizador(
      { email: 'ana@x.com', password: 'corta', help: false },
      {},
    );
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/8/);
    expect(r.error).not.toContain('corta');
  });
});

describe('parseLineasEnv y fusionarEnvArchivos', () => {
  test('ignora comentarios y líneas vacías; quita comillas', () => {
    expect(
      parseLineasEnv('# c\n\nNEXT_PUBLIC_SUPABASE_URL="https://x.supabase.co"\nFOO=bar\n'),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
      FOO: 'bar',
    });
  });

  test('el entorno previo gana; .env.local gana a .env', () => {
    const out = fusionarEnvArchivos({ YA: 'shell' }, [
      { YA: 'dotenv', A: '1', B: 'env' },
      { A: '2', C: 'local' },
    ]);
    expect(out).toMatchObject({ YA: 'shell', A: '2', B: 'env', C: 'local' });
  });
});

describe('faltaEnvServicio', () => {
  test('null cuando URL y service role están', () => {
    expect(
      faltaEnvServicio({
        NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
      }),
    ).toBeNull();
  });

  test('mensaje en español sin repetir el valor de la clave', () => {
    const msg = faltaEnvServicio({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' });
    expect(msg).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(msg).toMatch(/script|crear-organizador|\.env/);
    expect(msg).not.toContain('service-role');
  });
});

describe('esErrorUsuarioExistente', () => {
  test('detecta códigos y mensajes de Auth', () => {
    expect(esErrorUsuarioExistente({ code: 'email_exists' })).toBe(true);
    expect(esErrorUsuarioExistente({ code: 'user_already_exists' })).toBe(true);
    expect(esErrorUsuarioExistente({ message: 'User already registered' })).toBe(true);
    expect(esErrorUsuarioExistente({ code: 'invalid_credentials' })).toBe(false);
    expect(esErrorUsuarioExistente(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/crear-organizador-cli.test.ts`

Expected: FAIL — no puede resolver `@/lib/auth/crear-organizador-cli`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/auth/crear-organizador-cli.ts`:

```ts
export const MENSAJE_SCRIPT =
  'node --env-file=.env scripts/crear-organizador.mjs --email tu@correo.com --password "…"';

export type FlagsOrganizador = {
  email?: string;
  password?: string;
  help: boolean;
};

export type ResultadoCredenciales =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

export function parseFlagsOrganizador(argv: string[]): FlagsOrganizador {
  const out: FlagsOrganizador = { help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      out.help = true;
      continue;
    }
    if (arg.startsWith('--email=')) {
      out.email = arg.slice('--email='.length);
      continue;
    }
    if (arg.startsWith('--password=')) {
      out.password = arg.slice('--password='.length);
      continue;
    }
    if (arg === '--email') {
      out.email = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--password') {
      out.password = argv[i + 1];
      i += 1;
    }
  }

  return out;
}

export function resolveCredencialesOrganizador(
  flags: FlagsOrganizador,
  env: Record<string, string | undefined>,
): ResultadoCredenciales {
  const email = (flags.email ?? env.ORGANIZER_EMAIL ?? '').trim();
  const password = flags.password ?? env.ORGANIZER_PASSWORD ?? '';

  if (!email || !password) {
    return {
      ok: false,
      error:
        'Pasa --email y --password, o define ORGANIZER_EMAIL y ORGANIZER_PASSWORD en el entorno (no en el repo).',
    };
  }

  if (password.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  return { ok: true, email, password };
}

export function parseLineasEnv(texto: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = cruda.trim();
    if (!linea || linea.startsWith('#')) continue;
    const eq = linea.indexOf('=');
    if (eq <= 0) continue;
    const key = linea.slice(0, eq).trim();
    let val = linea.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function fusionarEnvArchivos(
  base: Record<string, string | undefined>,
  archivos: Record<string, string>[],
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = { ...base };
  const desdeArchivos: Record<string, string> = {};
  for (const archivo of archivos) {
    Object.assign(desdeArchivos, archivo);
  }
  for (const [key, val] of Object.entries(desdeArchivos)) {
    if (out[key] === undefined) out[key] = val;
  }
  return out;
}

export function faltaEnvServicio(env: Record<string, string | undefined>): string | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return null;
  return (
    'Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env o .env.local. ' +
    'Agrégalas (Project Settings → API) y vuelve a correr el script. No uses «Crear cuenta» del formulario.'
  );
}

export function esErrorUsuarioExistente(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  const code = (error?.code ?? '').toLowerCase();
  const message = (error?.message ?? '').toLowerCase();
  return (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered')
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/crear-organizador-cli.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Saltar (constraint global).

---

### Task 2: Script `crear-organizador`

**Files:**
- Create: `scripts/crear-organizador.mjs`

**Interfaces:**
- Consumes: `parseFlagsOrganizador`, `resolveCredencialesOrganizador`, `parseLineasEnv`, `fusionarEnvArchivos`, `faltaEnvServicio`, `esErrorUsuarioExistente` de Task 1.
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (env). Email/password por flags o `ORGANIZER_EMAIL` / `ORGANIZER_PASSWORD`.
- Produces: proceso CLI con códigos de salida `0` (ok / help) y `1` (error). Crea o actualiza Auth user con `email_confirm: true`.

El script debe importar los helpers. En Node 22.18+ se puede importar `.ts` nativo. Comprobar `node -v`. Si el import de `.ts` falla, **copiar las funciones exportadas al `.mjs`** (mismo comportamiento; las pruebas siguen importando el `.ts`) y dejar el comando del usuario intacto:

`node --env-file=.env scripts/crear-organizador.mjs --email you@x.com --password "..."`

También debe cargar `.env` y `.env.local` en silencio si `--env-file` no se usó (no pisar `process.env` ya definido). Nunca `console.log` de password ni de claves.

- [ ] **Step 1: Write the script**

Create `scripts/crear-organizador.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  esErrorUsuarioExistente,
  faltaEnvServicio,
  fusionarEnvArchivos,
  parseFlagsOrganizador,
  parseLineasEnv,
  resolveCredencialesOrganizador,
} from '../src/lib/auth/crear-organizador-cli.ts';

const AYUDA = `Crea o restablece el organizador en Supabase Auth (sin enviar correo).

  node --env-file=.env scripts/crear-organizador.mjs --email tu@correo.com --password "tu-clave"
  node --env-file=.env.local scripts/crear-organizador.mjs --email tu@correo.com --password "tu-clave"

También acepta ORGANIZER_EMAIL y ORGANIZER_PASSWORD en el entorno.
No pongas la contraseña en archivos del repo. Este script no la imprime.

Luego entra en /admin con ese correo y contraseña.
`;

function leerArchivoEnv(nombre) {
  const ruta = resolve(process.cwd(), nombre);
  if (!existsSync(ruta)) return {};
  return parseLineasEnv(readFileSync(ruta, 'utf8'));
}

function cargarEnvLocal() {
  const fusion = fusionarEnvArchivos(process.env, [
    leerArchivoEnv('.env'),
    leerArchivoEnv('.env.local'),
  ]);
  for (const [key, val] of Object.entries(fusion)) {
    if (process.env[key] === undefined && val !== undefined) {
      process.env[key] = val;
    }
  }
}

async function buscarUsuarioPorCorreo(admin, email) {
  const needle = email.toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { user: null, error };
    const user = data.users.find((u) => (u.email ?? '').toLowerCase() === needle);
    if (user) return { user, error: null };
    if (data.users.length < 200) return { user: null, error: null };
    page += 1;
  }
}

async function main() {
  const flags = parseFlagsOrganizador(process.argv.slice(2));
  if (flags.help) {
    console.log(AYUDA);
    process.exit(0);
  }

  cargarEnvLocal();

  const cred = resolveCredencialesOrganizador(flags, process.env);
  if (!cred.ok) {
    console.error(cred.error);
    console.error(AYUDA);
    process.exit(1);
  }

  const falta = faltaEnvServicio(process.env);
  if (falta) {
    console.error(falta);
    process.exit(1);
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const creado = await admin.auth.admin.createUser({
    email: cred.email,
    password: cred.password,
    email_confirm: true,
  });

  if (!creado.error && creado.data.user) {
    console.log('Usuario creado y correo confirmado. Entra en /admin con ese correo y la contraseña que pasaste.');
    process.exit(0);
  }

  if (!esErrorUsuarioExistente(creado.error)) {
    console.error('No se pudo crear el usuario.');
    console.error(creado.error?.message ?? 'error desconocido');
    process.exit(1);
  }

  const hallado = await buscarUsuarioPorCorreo(admin, cred.email);
  if (hallado.error) {
    console.error('El correo ya existe, pero no se pudo listar usuarios.');
    console.error(hallado.error.message);
    process.exit(1);
  }
  if (!hallado.user) {
    console.error('El correo ya está registrado y no se encontró el id para actualizarlo.');
    process.exit(1);
  }

  const actualizado = await admin.auth.admin.updateUserById(hallado.user.id, {
    password: cred.password,
    email_confirm: true,
  });

  if (actualizado.error) {
    console.error('No se pudo actualizar el usuario existente.');
    console.error(actualizado.error.message);
    process.exit(1);
  }

  console.log('Usuario ya existía: contraseña actualizada y correo confirmado. Entra en /admin.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Falló el script.');
  console.error(err instanceof Error ? err.message : 'error desconocido');
  process.exit(1);
});
```

Si `node --env-file=.env scripts/crear-organizador.mjs --help` falla por el import `.ts`, cambiar el import a una copia local de las funciones (mismo contrato) **o** añadir al arranque:

```js
// Node < 22.18: node --experimental-strip-types --env-file=.env scripts/crear-organizador.mjs
```

Preferir que `node --env-file=.env scripts/crear-organizador.mjs --help` funcione sin flags extra: en ese caso el `.mjs` debe ser autónomo (funciones copiadas + `export` de los helpers no es necesario si las pruebas usan el `.ts`).

- [ ] **Step 2: Verify help runs without leaking env**

Run: `node --env-file=.env scripts/crear-organizador.mjs --help`

Expected: texto de ayuda en español. La salida **no** contiene valores de URL JWT, `eyJ`, ni `ORGANIZER_PASSWORD`.

Run without email (should fail cleanly): `node scripts/crear-organizador.mjs`

Expected: exit 1, mensaje de `--email` / `ORGANIZER_PASSWORD`, sin imprimir secretos.

- [ ] **Step 3: Commit**

Saltar (constraint global).

---

### Task 3: Mensajes del formulario → «corre el script»

**Files:**
- Modify: `src/lib/auth/mensajes.ts`
- Modify: `src/components/admin/FormularioAcceso.tsx`
- Modify: `tests/auth-mensajes.test.ts` (solo si algún test compara el string completo y deja de coincidir; los tests actuales usan `MENSAJES_ACCESO.*` así que deben seguir verdes)

**Interfaces:**
- Consumes: `MENSAJE_SCRIPT` de Task 1.
- Produces: `MENSAJES_ACCESO` actualizado. `FormularioAcceso` sigue con `modo` inicial `'password'` y `signInWithPassword` en el submit.

Copy exacto (reemplazar los strings actuales):

```ts
import { MENSAJE_SCRIPT } from '@/lib/auth/crear-organizador-cli';

export const MENSAJES_ACCESO = {
  credenciales:
    'Correo o contraseña incorrectos. Si no tienes usuario confirmado, corre el script: ' +
    MENSAJE_SCRIPT,
  confirmarCorreo:
    'Ese correo aún no está confirmado. No esperes el email: corre el script ' +
    '(email_confirm queda en true aunque Confirm email siga activo): ' +
    MENSAJE_SCRIPT,
  signupSinSesion:
    'La cuenta se creó, pero Supabase pide confirmar el correo. Corre el script y entra con esa contraseña: ' +
    MENSAJE_SCRIPT,
  limite:
    'Supabase está limitando los envíos de correo. No uses «Crear cuenta» ni el código. Corre el script y entra aquí: ' +
    MENSAJE_SCRIPT,
  yaExiste:
    'Ese correo ya tiene cuenta. Entra con la contraseña, o restablécela corriendo el script: ' +
    MENSAJE_SCRIPT,
  debil: 'La contraseña debe tener al menos 8 caracteres.',
  registroDesactivado:
    'El registro está desactivado. Corre el script para crear el usuario: ' + MENSAJE_SCRIPT,
  correoInvalido: 'Ese correo no es válido. Usa una dirección real.',
  otpCaducado:
    'Ese código no es válido o ya caducó. Entra con correo y contraseña, o corre el script: ' +
    MENSAJE_SCRIPT,
  generico:
    'No pudimos completar el acceso. Si no puedes entrar, corre el script y usa esa contraseña: ' +
    MENSAJE_SCRIPT,
} as const;
```

En `FormularioAcceso.tsx`, debajo de los botones Entrar / Crear cuenta (antes del enlace de código), añadir un párrafo siempre visible:

```tsx
<p className="mt-3 text-sm text-tinta-suave">
  Si no tienes usuario o el correo está bloqueado, no esperes el email: en la raíz del repo corre{' '}
  <span className="font-ticket text-[11px]">{MENSAJE_SCRIPT}</span>
  {' '}y vuelve a pulsar Entrar.
</p>
```

Importar `MENSAJE_SCRIPT` desde `@/lib/auth/crear-organizador-cli`.

Verificar a mano (lectura, no rediseño):

- `useState<'password' | 'codigo'>('password')` — primario.
- Submit = `entrarConContrasena` → `signInWithPassword`.
- Errores pasan por `mensajeErrorAcceso` (español).
- El modo código es secundario (enlace abajo).

- [ ] **Step 1: Update `MENSAJES_ACCESO` and the form hint**

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/auth-mensajes.test.ts tests/crear-organizador-cli.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit**

Saltar (constraint global).

---

### Task 4: README

**Files:**
- Modify: `README.md` section «Auth del organizador (Supabase)»

- [ ] **Step 1: Replace the dashboard-first recipe with the script**

Sustituir el bloque que empieza en «Para probar ya (tres clics en el dashboard)» por:

```markdown
## Auth del organizador (Supabase)

El panel (`/admin`) entra con **correo y contraseña**. No hace falta el correo mágico.

### Crear el usuario (sin esperar email)

En la raíz del repo, con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env` o `.env.local`:

```bash
node --env-file=.env scripts/crear-organizador.mjs --email tu@correo.com --password "elige-una-clave-de-8+"
```

Si tus variables están en `.env.local`:

```bash
node --env-file=.env.local scripts/crear-organizador.mjs --email tu@correo.com --password "elige-una-clave-de-8+"
```

También vale exportar `ORGANIZER_EMAIL` y `ORGANIZER_PASSWORD` en la shell (no las subas al repo).

El script llama `auth.admin.createUser` con `email_confirm: true`. No envía correo. Si el usuario ya existía (intentos de código u OTP), actualiza la contraseña y confirma el email. «Confirm email» puede seguir activo en el dashboard: igual podrás entrar.

Luego abre `http://localhost:3000/admin` y entra con ese correo y contraseña.

Si el script dice que falta `SUPABASE_SERVICE_ROLE_KEY`, cópiala de Project Settings → API a `.env` (nunca la commitees) y vuelve a correrlo. El formulario no puede crear el usuario cuando el correo está limitado.
```

Dejar la subsección «Código por correo (opcional)» debajo, marcada como opcional.

- [ ] **Step 2: Commit**

Saltar (constraint global).

---

### Task 5: Verificar tipos, tests, MCP SQL

**Files:**
- None required unless algo falla.

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 2: Full unit tests**

Run: `npx vitest run`

Expected: all PASS, including los nuevos.

- [ ] **Step 3: Supabase MCP — aplicar SQL solo si hay sesión**

1. `GetDynamicTools` namespace `plugin-supabase-supabase`.
2. Si `namespaceStatus` es `needsAuth` / `error` / `loading`: **no autenticar en bucle**. Anotar «MCP no autenticado; migración no aplicada por MCP».
3. Si hay herramientas y el proyecto está vinculado: aplicar `supabase/migrations/0001_initial_schema.sql` **solo si aún no está aplicada**. No es necesaria para Auth; no desbloquea el login por sí sola.
4. Si MCP no sirve: `npx supabase` **solo si el proyecto está linked** (`supabase/config.toml` + link). Si no hay link, no ejecutar SQL con la service role en la transcripción.

- [ ] **Step 4: Confirm email toggle**

No hay API local para apagar Confirm email. El script no lo necesita. Anotar como no hecho.

- [ ] **Step 5: Commit**

Saltar (constraint global).

---

## Self-review

1. **Spec coverage:** formulario password primario (Task 3), script Admin API (Task 2), README (Task 4), `email_confirm: true` (Task 2), MCP/SQL condicional (Task 5), copy «corre el script» (Task 3), tests de parseo (Task 1), sin secretos (constraints + script).
2. **Placeholders:** ninguno; copy, firmas y comandos están escritos.
3. **Tipos:** `FlagsOrganizador`, `ResultadoCredenciales`, `parseFlagsOrganizador`, `resolveCredencialesOrganizador` coinciden en Tasks 1–2.

## Execution handoff

El usuario pidió **writing-plans y después executing-plans en la misma sesión**, sin commit. No preguntar enfoque: ejecutar este plan en línea, saltando commits.
