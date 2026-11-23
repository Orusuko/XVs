import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const AYUDA = `Crea o restablece la cuenta del organizador en la tabla cuentas (bcrypt, sin correo).

  node --env-file=.env scripts/crear-organizador.mjs --email tu@correo.com --password "tu-clave"
  node --env-file=.env.local scripts/crear-organizador.mjs --email tu@correo.com --password "tu-clave"

También acepta ORGANIZER_EMAIL y ORGANIZER_PASSWORD en el entorno.
No pongas la contraseña en archivos del repo. Este script no la imprime.

Luego entra en /admin con ese correo y contraseña.
`;

export function parseFlagsOrganizador(argv) {
  const out = { help: false };

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

export function resolveCredencialesOrganizador(flags, env) {
  const email = (flags.email ?? env.ORGANIZER_EMAIL ?? '').trim().toLowerCase();
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

  if (Buffer.byteLength(password) > 72) {
    return { ok: false, error: 'La contraseña no puede pasar de 72 caracteres.' };
  }

  return { ok: true, email, password };
}

export function parseLineasEnv(texto) {
  const out = {};
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

export function fusionarEnvArchivos(base, archivos) {
  const out = { ...base };
  const desdeArchivos = {};
  for (const archivo of archivos) {
    Object.assign(desdeArchivos, archivo);
  }
  for (const [key, val] of Object.entries(desdeArchivos)) {
    if (out[key] === undefined) out[key] = val;
  }
  return out;
}

export function faltaEnvServicio(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return null;
  return (
    'Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env o .env.local. ' +
    'Agrégalas (Project Settings → API) y vuelve a correr el script.'
  );
}

export function esErrorUsuarioExistente(error) {
  const code = (error?.code ?? '').toLowerCase();
  const message = (error?.message ?? '').toLowerCase();
  return (
    code === '23505' ||
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    message.includes('duplicate key') ||
    message.includes('already registered') ||
    message.includes('already been registered')
  );
}

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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const passwordHash = await bcrypt.hash(cred.password, 10);
  const creado = await admin.from('cuentas').insert({
    email: cred.email,
    password_hash: passwordHash,
  });

  if (!creado.error) {
    console.log('Cuenta creada. Entra en /admin con ese correo y la contraseña que pasaste.');
    process.exit(0);
  }

  if (!esErrorUsuarioExistente(creado.error)) {
    console.error('No se pudo crear la cuenta.');
    console.error(creado.error?.message ?? 'error desconocido');
    process.exit(1);
  }

  const actualizado = await admin
    .from('cuentas')
    .update({ password_hash: passwordHash })
    .eq('email', cred.email)
    .select('id');

  if (actualizado.error || !actualizado.data?.length) {
    console.error('No se pudo actualizar la cuenta existente.');
    console.error(actualizado.error?.message ?? 'error desconocido');
    process.exit(1);
  }

  console.log('La cuenta ya existía: contraseña actualizada. Entra en /admin.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Falló el script.');
  console.error(err instanceof Error ? err.message : 'error desconocido');
  process.exit(1);
});
