import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const AYUDA = `Crea o restablece el organizador en Supabase Auth (sin enviar correo).

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
    'Agrégalas (Project Settings → API) y vuelve a correr el script. No uses «Crear cuenta» del formulario.'
  );
}

export function esErrorUsuarioExistente(error) {
  const code = (error?.code ?? '').toLowerCase();
  const message = (error?.message ?? '').toLowerCase();
  return (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const creado = await admin.auth.admin.createUser({
    email: cred.email,
    password: cred.password,
    email_confirm: true,
  });

  if (!creado.error && creado.data.user) {
    console.log(
      'Usuario creado y correo confirmado. Entra en /admin con ese correo y la contraseña que pasaste.',
    );
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
