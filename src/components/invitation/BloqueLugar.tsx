'use client';

import { buildGoogleCalendarUrl, buildIcs } from '@/lib/calendar/ics';
import { formatearFecha, formatearHora } from '@/lib/format';
import { IconoPin } from '@/components/ui/IconoPin';
import type { Lugar } from '@/lib/types';

type Props = {
  etiqueta: string;
  lugar: Lugar;
  quinceanera: string;
};

export function BloqueLugar({ etiqueta, lugar, quinceanera }: Props) {
  const inicio = new Date(lugar.fecha_hora);
  const valida = !Number.isNaN(inicio.getTime());

  const evento = {
    title: `${etiqueta} — XV años de ${quinceanera}`,
    description: lugar.nombre,
    location: lugar.direccion,
    start: valida ? inicio : new Date(),
    durationMinutes: 120,
  };

  function descargarIcs() {
    const blob = new Blob([buildIcs(evento)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${etiqueta.toLowerCase()}-xv-${quinceanera.toLowerCase().replace(/\s+/g, '-')}.ics`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="border-t border-borde pt-6">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">{etiqueta}</p>

      <h3 className="mt-2 font-display text-2xl leading-tight text-tinta">{lugar.nombre}</h3>

      {valida && (
        <p className="mt-1 text-tinta-suave">
          {formatearFecha(lugar.fecha_hora)}
          <span className="mx-2 text-borde">·</span>
          <span className="font-ticket text-sm">{formatearHora(lugar.fecha_hora)}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {lugar.maps_url && (
          <a
            href={lugar.maps_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver ${lugar.nombre} en el mapa`}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-2 text-vino transition-colors duration-200 hover:text-vino-hondo"
          >
            <IconoPin className="h-6 w-6" />
            <span className="text-sm">Cómo llegar</span>
          </a>
        )}

        {valida && (
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={descargarIcs}
              className="min-h-11 cursor-pointer text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
            >
              Agendar
            </button>
            <a
              href={buildGoogleCalendarUrl(evento)}
              target="_blank"
              rel="noreferrer"
              className="min-h-11 cursor-pointer text-tinta-suave underline underline-offset-4 transition-colors duration-200 hover:text-vino"
            >
              Google Calendar
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
