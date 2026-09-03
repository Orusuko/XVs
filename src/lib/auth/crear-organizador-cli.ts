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
