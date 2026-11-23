'use client';

import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { formatearHora } from '@/lib/format';

export type TonoFicha =
  | 'listo'
  | 'exitoso'
  | 'pendiente_envio'
  | 'duplicado'
  | 'invalido'
  | 'pendiente';

export type Ficha = {
  tono: TonoFicha;
  familia?: string;
  boletos?: number;
  boletosUsados?: number;
  boletosRestantes?: number;
  mensaje: string;
  checkedInAt?: string | null;
};

const TITULO: Record<TonoFicha, string> = {
  listo: 'Boleto encontrado',
  exitoso: 'Pueden pasar',
  pendiente_envio: 'Pendiente de confirmar',
  duplicado: 'Ya fue registrado',
  invalido: 'Código no válido',
  pendiente: 'Sin conexión',
};

/**
 * Sits in the bottom half of the screen, above the nav (z-50 vs its z-40), so
 * staff never has to look below the fold to see who they just scanned.
 */
export function FichaEscaner({
  ficha,
  confirmando,
  onAdelante,
  onCerrar,
}: {
  ficha: Ficha;
  confirmando: boolean;
  onAdelante: ((cantidad: number) => void) | null;
  onCerrar: () => void;
}) {
  const faltan = Math.max(1, ficha.boletosRestantes ?? ficha.boletos ?? 1);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(faltan);
  const cantidad = Math.min(faltan, Math.max(1, cantidadSeleccionada));

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  const mostrarSelector =
    onAdelante !== null && (ficha.tono === 'listo' || ficha.tono === 'pendiente');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-ficha-escaner"
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[65vh] flex-col rounded-t-[2px] border-t border-papel/15 bg-papel-alto px-6 pb-6 pt-5 text-tinta shadow-[0_-8px_24px_rgba(0,0,0,0.28)]"
    >
      <p className={`font-ticket text-[11px] uppercase tracking-[0.28em] ${COLOR_TONO[ficha.tono]}`}>
        {TITULO[ficha.tono]}
      </p>

      <p id="titulo-ficha-escaner" className="mt-2 font-display text-2xl text-tinta">
        Familia: {ficha.familia ?? '—'}
      </p>

      {ficha.boletos !== undefined && ficha.boletos > 0 && (
        <p className="mt-1 font-ticket text-4xl font-bold text-vino">
          {ficha.tono === 'listo' && (ficha.boletosUsados ?? 0) > 0
            ? `Faltan ${faltan} de ${ficha.boletos}`
            : `Boletos: ${ficha.boletosRestantes ?? ficha.boletos}`}
        </p>
      )}

      {mostrarSelector && (
        <div className="mt-4 flex items-center justify-between gap-4 border-y border-borde py-3">
          <span className="text-sm font-medium text-tinta">¿Cuántos entran ahora?</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menos boletos"
              disabled={confirmando || cantidad <= 1}
              onClick={() => setCantidadSeleccionada(Math.max(1, cantidad - 1))}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[2px] border border-borde font-ticket text-xl text-tinta disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-8 text-center font-ticket text-2xl font-bold text-vino">
              {cantidad}
            </span>
            <button
              type="button"
              aria-label="Más boletos"
              disabled={confirmando || cantidad >= faltan}
              onClick={() => setCantidadSeleccionada(Math.min(faltan, cantidad + 1))}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[2px] border border-borde font-ticket text-xl text-tinta disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-sm text-tinta-suave">
        {ficha.checkedInAt && ficha.tono === 'duplicado'
          ? `Este boleto ya fue registrado a las ${formatearHora(ficha.checkedInAt)}.`
          : ficha.mensaje}
      </p>

      <div className="mt-5 flex gap-3">
        {onAdelante && (
          <Boton className="flex-1" disabled={confirmando} onClick={() => onAdelante(cantidad)}>
            {confirmando
              ? 'Registrando…'
              : mostrarSelector && faltan > 1
                ? `Adelante (${cantidad})`
                : 'Adelante'}
          </Boton>
        )}
        <Boton variante={onAdelante ? 'contorno' : 'principal'} className="flex-1" onClick={onCerrar}>
          {onAdelante ? 'Cancelar' : 'Cerrar'}
        </Boton>
      </div>
    </div>
  );
}

const COLOR_TONO: Record<TonoFicha, string> = {
  listo: 'text-oro',
  exitoso: 'text-[#5fae7b]',
  pendiente_envio: 'text-oro',
  duplicado: 'text-oro',
  invalido: 'text-alerta',
  pendiente: 'text-tinta-suave',
};
