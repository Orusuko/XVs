import { describe, expect, test } from 'vitest';
import { MENSAJES_ACCESO, mensajeErrorAcceso } from '@/lib/auth/mensajes';

describe('mensajeErrorAcceso', () => {
  test('maps invalid credentials (and hides missing users)', () => {
    expect(mensajeErrorAcceso({ code: 'invalid_credentials' })).toBe(MENSAJES_ACCESO.credenciales);
    expect(mensajeErrorAcceso({ message: 'Invalid login credentials' })).toBe(
      MENSAJES_ACCESO.credenciales,
    );
    expect(mensajeErrorAcceso({ code: 'user_not_found' })).toBe(MENSAJES_ACCESO.credenciales);
  });

  test('maps unconfirmed email', () => {
    expect(mensajeErrorAcceso({ code: 'email_not_confirmed' })).toBe(MENSAJES_ACCESO.confirmarCorreo);
    expect(mensajeErrorAcceso({ message: 'Email not confirmed' })).toBe(
      MENSAJES_ACCESO.confirmarCorreo,
    );
  });

  test('maps rate limits from code, status, or message', () => {
    expect(mensajeErrorAcceso({ code: 'over_email_send_rate_limit' })).toBe(MENSAJES_ACCESO.limite);
    expect(mensajeErrorAcceso({ code: 'over_request_rate_limit' })).toBe(MENSAJES_ACCESO.limite);
    expect(mensajeErrorAcceso({ status: 429 })).toBe(MENSAJES_ACCESO.limite);
    expect(mensajeErrorAcceso({ message: 'email rate limit exceeded' })).toBe(MENSAJES_ACCESO.limite);
  });

  test('maps existing accounts and weak passwords', () => {
    expect(mensajeErrorAcceso({ code: 'user_already_exists' })).toBe(MENSAJES_ACCESO.yaExiste);
    expect(mensajeErrorAcceso({ code: 'email_exists' })).toBe(MENSAJES_ACCESO.yaExiste);
    expect(mensajeErrorAcceso({ code: 'weak_password' })).toBe(MENSAJES_ACCESO.debil);
  });

  test('maps signup disabled, invalid email, and expired OTP', () => {
    expect(mensajeErrorAcceso({ code: 'signup_disabled' })).toBe(MENSAJES_ACCESO.registroDesactivado);
    expect(mensajeErrorAcceso({ code: 'email_address_invalid' })).toBe(MENSAJES_ACCESO.correoInvalido);
    expect(mensajeErrorAcceso({ code: 'otp_expired' })).toBe(MENSAJES_ACCESO.otpCaducado);
  });

  test('falls back to a generic Spanish message', () => {
    expect(mensajeErrorAcceso({ code: 'unexpected_failure', message: 'boom' })).toBe(
      MENSAJES_ACCESO.generico,
    );
    expect(mensajeErrorAcceso(null)).toBe(MENSAJES_ACCESO.generico);
    expect(mensajeErrorAcceso(undefined)).toBe(MENSAJES_ACCESO.generico);
  });
});
