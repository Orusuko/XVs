export type ErrorAcceso = {
  message?: string;
  code?: string;
  status?: number;
} | null | undefined;

export const MENSAJES_ACCESO = {
  credenciales: 'Correo o contraseña incorrectos.',
  confirmarCorreo:
    'Ese correo aún no está confirmado. En Authentication → Providers → Email desactiva «Confirm email» (esta app es de un solo evento) y vuelve a entrar.',
  signupSinSesion:
    'La cuenta se creó, pero Supabase pide confirmar el correo. En Authentication → Providers → Email desactiva «Confirm email» y entra de nuevo con la misma contraseña.',
  limite:
    'Supabase está limitando los envíos de correo. Si ya tienes cuenta (incluso de intentos con código), entra con contraseña. Si no, en Authentication → Users crea el usuario con Add user (auto-confirmado) o restablece la contraseña de ese correo.',
  yaExiste:
    'Ese correo ya tiene cuenta. Entra con la contraseña, o restablécela en Authentication → Users.',
  debil: 'La contraseña debe tener al menos 8 caracteres.',
  registroDesactivado:
    'El registro está desactivado. Crea el usuario en Authentication → Users → Add user.',
  correoInvalido: 'Ese correo no es válido. Usa una dirección real.',
  otpCaducado:
    'Ese código no es válido o ya caducó. Pide otro y escríbelo aquí; no pulses Sign In.',
  generico: 'No pudimos completar el acceso. Inténtalo de nuevo.',
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
