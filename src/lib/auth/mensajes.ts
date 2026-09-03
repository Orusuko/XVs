import { MENSAJE_SCRIPT } from '@/lib/auth/crear-organizador-cli';

export type ErrorAcceso = {
  message?: string;
  code?: string;
  status?: number;
} | null | undefined;

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

function textoError(error: ErrorAcceso): { code: string; message: string; status: number } {
  return {
    code: (error?.code ?? '').toLowerCase(),
    message: (error?.message ?? '').toLowerCase(),
    status: error?.status ?? 0,
  };
}

/** Maps Supabase Auth errors to Spanish copy. Prefer `error.code`; fall back to message/status. */
export function mensajeErrorAcceso(error: ErrorAcceso): string {
  const { code, message, status } = textoError(error);

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return MENSAJES_ACCESO.credenciales;
  }

  if (code === 'user_not_found') {
    return MENSAJES_ACCESO.credenciales;
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return MENSAJES_ACCESO.confirmarCorreo;
  }

  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    code === 'over_sms_send_rate_limit' ||
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return MENSAJES_ACCESO.limite;
  }

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered')
  ) {
    return MENSAJES_ACCESO.yaExiste;
  }

  if (code === 'weak_password' || message.includes('password should be at least')) {
    return MENSAJES_ACCESO.debil;
  }

  if (code === 'signup_disabled' || code === 'email_provider_disabled') {
    return MENSAJES_ACCESO.registroDesactivado;
  }

  if (
    code === 'email_address_invalid' ||
    (message.includes('email address') && message.includes('invalid'))
  ) {
    return MENSAJES_ACCESO.correoInvalido;
  }

  if (
    code === 'otp_expired' ||
    (message.includes('otp') && (message.includes('expired') || message.includes('invalid')))
  ) {
    return MENSAJES_ACCESO.otpCaducado;
  }

  return MENSAJES_ACCESO.generico;
}
