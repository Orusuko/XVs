const ZONA_HORARIA = 'America/Mexico_City';

const FECHA = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const HORA = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_HORARIA,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const PARTES_FECHA = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_HORARIA,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '' : FECHA.format(fecha);
}

export function formatearHora(iso: string | null | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '' : HORA.format(fecha);
}

/** Day / short month / year in America/Mexico_City for type-led layouts (Editorial). */
export function partesFecha(iso: string | null | undefined): {
  dia: string;
  mes: string;
  anio: string;
} | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;

  const partes = PARTES_FECHA.formatToParts(fecha);
  const dia = partes.find((p) => p.type === 'day')?.value;
  const mes = partes.find((p) => p.type === 'month')?.value.replace('.', '');
  const anio = partes.find((p) => p.type === 'year')?.value;

  if (!dia || !mes || !anio) return null;

  return { dia, mes, anio };
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
