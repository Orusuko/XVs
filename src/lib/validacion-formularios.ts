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

export function validarLongitudNombre(
  nombre: string,
  vacio: string,
  contexto = 'El nombre',
): string | null {
  const valor = nombre.trim();
  if (valor === '') return vacio;
  if (valor.length > MAX_NOMBRE) {
    return `${contexto} no puede pasar de ${MAX_NOMBRE} caracteres.`;
  }
  return null;
}

/** Servidor: null/undefined permitido; entero ≥ 0. */
export function validarCapacidadApi(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    return 'El aforo debe ser un número entero mayor o igual a cero.';
  }
  return null;
}

/** Vacío permitido; si hay valor, debe ser URL absoluta http(s). */
export function validarUrlOpcionalAbsoluta(valor: unknown, etiqueta: string): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') return `${etiqueta} no es válida.`;
  const texto = valor.trim();
  if (texto === '' || /^no-?link$/i.test(texto)) return null;

  try {
    const url = new URL(texto);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return `${etiqueta} debe empezar con http:// o https://`;
    }
  } catch {
    return `${etiqueta} debe ser un enlace completo con http:// o https:// (no relativo).`;
  }

  return null;
}

function validarLugarMaps(lugar: unknown, etiqueta: string): string | null {
  if (lugar === null || lugar === undefined) return null;
  if (typeof lugar !== 'object') return `${etiqueta} no es válido.`;
  const maps = (lugar as { maps_url?: unknown }).maps_url;
  return validarUrlOpcionalAbsoluta(maps, `El enlace de Google Maps de ${etiqueta}`);
}

function validarTemplateConfig(config: unknown): string | null {
  if (config === null || config === undefined) return null;
  if (typeof config !== 'object') return 'La configuración de plantilla no es válida.';
  const foto = (config as Record<string, unknown>).foto_url;
  const falloFoto = validarUrlOpcionalAbsoluta(foto, 'La foto');
  if (falloFoto) return falloFoto;
  return null;
}

/** Valida campos editables de events antes de insert/update. */
export function validarCamposEvento(campos: Record<string, unknown>): string | null {
  if ('quinceanera_nombre' in campos) {
    const nombre = campos.quinceanera_nombre;
    if (typeof nombre !== 'string') return 'Escribe el nombre de la quinceañera.';
    const fallo = validarLongitudNombre(
      nombre,
      'Escribe el nombre de la quinceañera.',
      'El nombre de la quinceañera',
    );
    if (fallo) return fallo;
  }

  if ('capacidad_total' in campos) {
    const fallo = validarCapacidadApi(campos.capacidad_total);
    if (fallo) return fallo;
  }

  if ('misa' in campos) {
    const fallo = validarLugarMaps(campos.misa, 'la misa');
    if (fallo) return fallo;
  }

  if ('recepcion' in campos) {
    const fallo = validarLugarMaps(campos.recepcion, 'la recepción');
    if (fallo) return fallo;
  }

  if ('template_config' in campos) {
    const fallo = validarTemplateConfig(campos.template_config);
    if (fallo) return fallo;
  }

  return null;
}

export function validarNombreFamiliaApi(nombre: string): string | null {
  return validarLongitudNombre(
    nombre,
    'Escribe el nombre de la familia.',
    'El nombre de la familia',
  );
}