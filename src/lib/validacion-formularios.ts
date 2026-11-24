/** Longitud máxima para nombres visibles en la invitación y el panel. */
export const MAX_NOMBRE = 120;

const PIN_DEBILES = new Set(['123456', '1234567', '12345678', '111111', '000000', '654321']);

export function normalizarMapsUrl(raw: string): string | null {
  const valor = raw.trim();
  if (valor === '' || /^no-?link$/i.test(valor)) return null;
  if (/^https?:\/\//i.test(valor)) return valor;
  if (valor.startsWith('maps.') || valor.startsWith('goo.gl') || valor.startsWith('www.')) {
    return `https://${valor}`;
  }
  return null;
}

export function esFotoUrlValida(raw: string): boolean {
  const valor = raw.trim();
  if (valor === '') return true;
  if (/^no-?link$/i.test(valor)) return false;
  return /^https:\/\//i.test(valor);
}

export function validarCapacidad(valor: string): string | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0) return 'El aforo no puede ser negativo.';
  if (n === 0) return 'Escribe un aforo mayor que cero o déjalo vacío.';
  return null;
}

export function validarCorreo(valor: string): string | null {
  const email = valor.trim().toLowerCase();
  if (email === '') return 'Escribe el correo.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Ese correo no es válido.';
  }
  return null;
}

export function validarPinStaff(pin: string): string | null {
  if (pin.length < 6 || pin.length > 8 || !/^\d+$/.test(pin)) {
    return 'El PIN debe tener entre 6 y 8 dígitos.';
  }
  if (PIN_DEBILES.has(pin) || /^(.)\1+$/.test(pin)) {
    return 'Elige un PIN más difícil de adivinar.';
  }
  return null;
}

export function validarNombreStaff(nombre: string): string | null {
  if (nombre.trim() === '') return 'Escribe el nombre de quien usará este acceso.';
  return null;
}