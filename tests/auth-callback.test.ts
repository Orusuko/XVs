import { describe, expect, test } from 'vitest';
import {
  clasificarErrorAuth,
  errorAuthDesdeUbicacion,
  htmlRescateHashAuth,
  parseAuthCallbackUrl,
  puenteHaciaCallback,
  sanitizeNextPath,
  tiposOtpParaTokenHash,
  tokenAccesoListo,
  urlRedireccionAuth,
} from '@/lib/auth/callback';

describe('sanitizeNextPath', () => {
  test('keeps an internal path', () => {
    expect(sanitizeNextPath('/admin')).toBe('/admin');
    expect(sanitizeNextPath('/admin/evento/nuevo')).toBe('/admin/evento/nuevo');
  });

  test('rejects open redirects and missing values', () => {
    expect(sanitizeNextPath(null)).toBe('/admin');
    expect(sanitizeNextPath('https://evil.example/phish')).toBe('/admin');
    expect(sanitizeNextPath('//evil.example')).toBe('/admin');
    expect(sanitizeNextPath('admin')).toBe('/admin');
  });
});

describe('clasificarErrorAuth', () => {
  test('maps otp_expired from query or hash style fields', () => {
    expect(
      clasificarErrorAuth({
        error: 'access_denied',
        error_code: 'otp_expired',
        error_description: 'Email link is invalid or has expired',
      }),
    ).toBe('otp_expired');

    expect(clasificarErrorAuth({ error: 'otp_expired' })).toBe('otp_expired');
  });

  test('maps other auth failures to auth', () => {
    expect(clasificarErrorAuth({ error: 'access_denied', error_code: 'bad_oauth' })).toBe('auth');
    expect(clasificarErrorAuth({ error: 'auth' })).toBe('auth');
  });

  test('returns null when nothing looks like an auth error', () => {
    expect(clasificarErrorAuth({})).toBeNull();
  });
});

describe('errorAuthDesdeUbicacion', () => {
  test('reads error=otp_expired from the search string', () => {
    expect(errorAuthDesdeUbicacion('?error=otp_expired', '')).toBe('otp_expired');
  });

  test('reads hash fragments dumped on the Site URL', () => {
    expect(
      errorAuthDesdeUbicacion(
        '',
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      ),
    ).toBe('otp_expired');
  });
});

describe('parseAuthCallbackUrl', () => {
  test('detects a PKCE code', () => {
    expect(parseAuthCallbackUrl('https://xv.example/auth/callback?code=abc123&next=/admin')).toEqual({
      kind: 'pkce',
      code: 'abc123',
      next: '/admin',
    });
  });

  test('detects token_hash and type from the PKCE-safe email link', () => {
    expect(
      parseAuthCallbackUrl(
        'https://xv.example/auth/callback?token_hash=hash-value&type=email&next=/admin',
      ),
    ).toEqual({
      kind: 'otp',
      tokenHash: 'hash-value',
      type: 'email',
      next: '/admin',
    });
  });

  test('prefers explicit errors over credentials', () => {
    expect(
      parseAuthCallbackUrl(
        'https://xv.example/auth/callback?code=abc&error=access_denied&error_code=otp_expired',
      ),
    ).toEqual({
      kind: 'error',
      codigo: 'otp_expired',
      next: '/admin',
    });
  });

  test('reads errors from the URL hash (implicit dump)', () => {
    expect(
      parseAuthCallbackUrl(
        'https://xv.example/auth/callback#error=access_denied&error_code=otp_expired',
      ),
    ).toEqual({
      kind: 'error',
      codigo: 'otp_expired',
      next: '/admin',
    });
  });

  test('returns missing when there is nothing to exchange', () => {
    expect(parseAuthCallbackUrl('https://xv.example/auth/callback?next=/admin')).toEqual({
      kind: 'missing',
      next: '/admin',
    });
  });
});

describe('tiposOtpParaTokenHash', () => {
  test('tries the URL type first, then email and magiclink', () => {
    expect(tiposOtpParaTokenHash('magiclink')).toEqual(['magiclink', 'email']);
    expect(tiposOtpParaTokenHash('email')).toEqual(['email', 'magiclink']);
    expect(tiposOtpParaTokenHash(null)).toEqual(['email', 'magiclink']);
  });
});

describe('tokenAccesoListo', () => {
  test('accepts 6-digit OTPs and longer hashed tokens', () => {
    expect(tokenAccesoListo('123456')).toBe(true);
    expect(tokenAccesoListo(' 123456 ')).toBe(true);
    expect(tokenAccesoListo('pkce-style-token-hash-value')).toBe(true);
  });

  test('rejects empty or tiny values', () => {
    expect(tokenAccesoListo('')).toBe(false);
    expect(tokenAccesoListo('123')).toBe(false);
  });
});

describe('urlRedireccionAuth', () => {
  test('sends successful logins to the next path', () => {
    expect(urlRedireccionAuth('https://xv.example', '/admin')).toBe('https://xv.example/admin');
  });

  test('attaches a friendly error query for the login banner', () => {
    expect(urlRedireccionAuth('https://xv.example', '/admin', 'otp_expired')).toBe(
      'https://xv.example/admin?error=otp_expired',
    );
  });
});

describe('puenteHaciaCallback', () => {
  test('forwards token_hash dumped on the Site URL to /auth/callback', () => {
    expect(
      puenteHaciaCallback('https://xv.example/?token_hash=hash-value&type=email'),
    ).toBe('https://xv.example/auth/callback?token_hash=hash-value&type=email&next=%2Fadmin');
  });

  test('forwards a PKCE code dumped on the Site URL', () => {
    expect(puenteHaciaCallback('https://xv.example/?code=abc123')).toBe(
      'https://xv.example/auth/callback?code=abc123&next=%2Fadmin',
    );
  });

  test('sends Site URL error dumps to the admin login banner', () => {
    expect(
      puenteHaciaCallback(
        'https://xv.example/#error=access_denied&error_code=otp_expired',
      ),
    ).toBe('https://xv.example/admin?error=otp_expired');
  });

  test('does not loop when already on the callback or the admin banner', () => {
    expect(
      puenteHaciaCallback('https://xv.example/auth/callback?token_hash=hash-value&type=email'),
    ).toBeNull();
    expect(puenteHaciaCallback('https://xv.example/admin?error=otp_expired')).toBeNull();
  });
});

describe('htmlRescateHashAuth', () => {
  test('ships a client redirect that preserves hash errors as query params', () => {
    const html = htmlRescateHashAuth();

    expect(html).toContain('/admin');
    expect(html).toContain('location.hash');
    expect(html).toContain('location.replace');
  });
});
