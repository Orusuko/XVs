const FECHA = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const HORA = new Intl.DateTimeFormat('es-MX', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
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

const MES_CORTO = new Intl.DateTimeFormat('es-MX', { month: 'short' });

/** Day / short month / year for type-led layouts (Editorial). */
export function partesFecha(iso: string | null | undefined): {
  dia: string;
  mes: string;
  anio: string;
} | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return {
    dia: String(fecha.getDate()).padStart(2, '0'),
    mes: MES_CORTO.format(fecha).replace('.', ''),
    anio: String(fecha.getFullYear()),
  };
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
