/** Longitud máxima para nombres visibles en la invitación y el panel. */
export const MAX_NOMBRE = 120;
export const MAX_MENSAJE = 600;

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

export function validarEnlaceMaps(raw: string): string | null {
  const valor = raw.trim();
  if (valor === '') return null;
  if (/^no-?link$/i.test(valor)) {
    return 'Ese enlace de Google Maps no es válido. Pega un enlace https de Maps.';
  }
  const normalizado = normalizarMapsUrl(valor);
  if (!normalizado) {
    return 'El enlace de Google Maps debe ser completo con http:// o https://';
  }
  return validarUrlOpcionalAbsoluta(normalizado, 'El enlace de Google Maps');
}

export function esFotoUrlValida(raw: string): boolean {
  return validarFotoUrl(raw) === null;
}

export function validarFotoUrl(raw: string): string | null {
  const valor = raw.trim();
  if (valor === '') return null;
  if (/^no-?link$/i.test(valor)) {
    return 'Ese enlace de foto no es válido. Usa un enlace https directo a la imagen.';
  }
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:') {
      return 'La foto debe ser un enlace https válido.';
    }
  } catch {
    return 'La foto debe ser un enlace https válido.';
  }
  return null;
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
  if (!/^\d+$/.test(pin)) {
    return 'El PIN solo puede incluir números.';
  }
  if (pin.length < 6 || pin.length > 8) {
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

function validarTextoOpcional(valor: unknown, etiqueta: string, max: number): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') return `${etiqueta} no es válido.`;
  if (valor.trim().length > max) {
    return `${etiqueta} no puede pasar de ${max} caracteres.`;
  }
  return null;
}

/** Servidor: null/undefined permitido; entero ≥ 1 o null (0 rechazado, alineado con el formulario). */
export function validarCapacidadApi(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    return 'El aforo debe ser un número entero mayor o igual a cero.';
  }
  if (valor === 0) {
    return 'El aforo debe ser mayor que cero o déjalo vacío.';
  }
  return null;
}

/** Vacío permitido; si hay valor, debe ser URL absoluta http(s). */
export function validarUrlOpcionalAbsoluta(valor: unknown, etiqueta: string): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') return `${etiqueta} no es válida.`;
  const texto = valor.trim();
  if (texto === '') return null;

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
  if (typeof maps === 'string' && maps.trim() !== '') {
    const falloTexto = validarEnlaceMaps(maps);
    if (falloTexto) {
      return `El enlace de Google Maps de ${etiqueta} no es válido. Pega un enlace https de Maps.`;
    }
  }
  return null;
}

function validarTemplateConfig(config: unknown): string | null {
  if (config === null || config === undefined) return null;
  if (typeof config !== 'object') return 'La configuración de plantilla no es válida.';
  const foto = (config as Record<string, unknown>).foto_url;
  if (typeof foto === 'string' && foto.trim() !== '') {
    const falloFoto = validarFotoUrl(foto);
    if (falloFoto) return falloFoto;
  }
  return null;
}

function validarPadrinos(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (!Array.isArray(valor)) return 'Los padrinos no son válidos.';
  for (const fila of valor) {
    if (typeof fila !== 'object' || fila === null) return 'Cada padrino necesita nombre y rol.';
    const nombre = (fila as { nombre?: unknown }).nombre;
    const rol = (fila as { rol?: unknown }).rol;
    const falloNombre = validarTextoOpcional(nombre, 'El nombre del padrino', MAX_NOMBRE);
    if (falloNombre) return falloNombre;
    const falloRol = validarTextoOpcional(rol, 'El rol del padrino', MAX_NOMBRE);
    if (falloRol) return falloRol;
  }
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

  if ('padre' in campos) {
    const fallo = validarTextoOpcional(campos.padre, 'El nombre del padre', MAX_NOMBRE);
    if (fallo) return fallo;
  }

  if ('madre' in campos) {
    const fallo = validarTextoOpcional(campos.madre, 'El nombre de la madre', MAX_NOMBRE);
    if (fallo) return fallo;
  }

  if ('mensaje' in campos) {
    const fallo = validarTextoOpcional(campos.mensaje, 'El mensaje', MAX_MENSAJE);
    if (fallo) return fallo;
  }

  if ('padrinos' in campos) {
    const fallo = validarPadrinos(campos.padrinos);
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

  if ('estado' in campos) {
    const estado = campos.estado;
    if (estado !== 'borrador' && estado !== 'publicado' && estado !== 'cancelado') {
      return 'El estado del evento no es válido.';
    }
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