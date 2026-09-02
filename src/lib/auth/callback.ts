export type AuthErrorCodigo = 'otp_expired' | 'auth';

export type AuthCallbackParse =
  | { kind: 'pkce'; code: string; next: string }
  | { kind: 'otp'; tokenHash: string; type: string | null; next: string }
  | { kind: 'error'; codigo: AuthErrorCodigo; next: string }
  | { kind: 'missing'; next: string };

/** OTP types the login form tries, in order. */
export const TIPOS_OTP_CORREO = ['email', 'magiclink'] as const;

export type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

function paramsCombinados(href: string): URLSearchParams {
  const parsed = new URL(href);
  const combined = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  for (const [key, value] of parsed.searchParams) {
    combined.set(key, value);
  }
  return combined;
}

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return '/admin';
  }
  return next;
}

export function clasificarErrorAuth(input: {
  error?: string | null;
  error_code?: string | null;
  error_description?: string | null;
}): AuthErrorCodigo | null {
  const error = (input.error ?? '').toLowerCase();
  const code = (input.error_code ?? '').toLowerCase();
  let description = (input.error_description ?? '').toLowerCase();
  try {
    description = decodeURIComponent(description.replace(/\+/g, ' ')).toLowerCase();
  } catch {
    description = description.replace(/\+/g, ' ');
  }

  if (!error && !code && !description) return null;

  if (
    code === 'otp_expired' ||
    error === 'otp_expired' ||
    description.includes('expired') ||
    description.includes('invalid')
  ) {
    return 'otp_expired';
  }

  return 'auth';
}

export function errorAuthDesdeUbicacion(search: string, hash: string): AuthErrorCodigo | null {
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

  return clasificarErrorAuth({
    error: searchParams.get('error') ?? hashParams.get('error'),
    error_code: searchParams.get('error_code') ?? hashParams.get('error_code'),
    error_description: searchParams.get('error_description') ?? hashParams.get('error_description'),
  });
}

export function parseAuthCallbackUrl(href: string): AuthCallbackParse {
  const params = paramsCombinados(href);
  const next = sanitizeNextPath(params.get('next'));

  const error = clasificarErrorAuth({
    error: params.get('error'),
    error_code: params.get('error_code'),
    error_description: params.get('error_description'),
  });
  if (error) {
    return { kind: 'error', codigo: error, next };
  }

  const code = params.get('code');
  if (code) {
    return { kind: 'pkce', code, next };
  }

  const tokenHash = params.get('token_hash');
  if (tokenHash) {
    return { kind: 'otp', tokenHash, type: params.get('type'), next };
  }

  return { kind: 'missing', next };
}

export function tiposOtpParaTokenHash(typeFromUrl: string | null | undefined): string[] {
  const ordered: string[] = [];
  if (typeFromUrl) ordered.push(typeFromUrl);
  for (const tipo of TIPOS_OTP_CORREO) {
    if (!ordered.includes(tipo)) ordered.push(tipo);
  }
  return ordered;
}

export function tokenAccesoListo(token: string): boolean {
  return token.trim().length >= 6;
}

export function urlRedireccionAuth(origin: string, next: string, error?: AuthErrorCodigo): string {
  const destino = new URL(sanitizeNextPath(next), origin);
  if (error) destino.searchParams.set('error', error);
  return destino.toString();
}

export function mapSupabaseAuthError(
  error: { message?: string; code?: string } | null | undefined,
): AuthErrorCodigo {
  return (
    clasificarErrorAuth({
      error: error?.code,
      error_code: error?.code,
      error_description: error?.message,
    }) ?? 'auth'
  );
}

/**
 * If Supabase dumps a code / token_hash / error on the Site URL (`/`),
 * send the browser to the callback or the admin banner instead.
 */
export function puenteHaciaCallback(href: string): string | null {
  const url = new URL(href);
  // Only the Site URL (`/`) receives stray dumps. Never loop on /admin or /auth/callback.
  if (url.pathname !== '/') return null;

  const parsed = parseAuthCallbackUrl(href);

  if (parsed.kind === 'pkce') {
    const dest = new URL('/auth/callback', url.origin);
    dest.searchParams.set('code', parsed.code);
    dest.searchParams.set('next', parsed.next);
    return dest.toString();
  }

  if (parsed.kind === 'otp') {
    const dest = new URL('/auth/callback', url.origin);
    dest.searchParams.set('token_hash', parsed.tokenHash);
    if (parsed.type) dest.searchParams.set('type', parsed.type);
    dest.searchParams.set('next', parsed.next);
    return dest.toString();
  }

  if (parsed.kind === 'error') {
    return urlRedireccionAuth(url.origin, parsed.next, parsed.codigo);
  }

  return null;
}

/** Hash fragments never reach the server; this page copies them onto /admin. */
export function htmlRescateHashAuth(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Acceso</title>
</head>
<body>
  <p>Redirigiendo…</p>
  <script>
    (function () {
      var hash = location.hash.replace(/^#/, '');
      var params = new URLSearchParams(hash);
      var dest = new URL('/admin', location.origin);
      if (params.get('error') || params.get('error_code')) {
        dest.search = hash;
      } else {
        dest.searchParams.set('error', 'auth');
      }
      location.replace(dest.pathname + dest.search);
    })();
  </script>
</body>
</html>`;
}
