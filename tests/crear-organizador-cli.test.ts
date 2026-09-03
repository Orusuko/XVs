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
