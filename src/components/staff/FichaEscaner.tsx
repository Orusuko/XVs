'use client';

import { useEffect } from 'react';
import { Boton } from '@/components/ui/Boton';
import { formatearHora } from '@/lib/format';

export type TonoFicha = 'listo' | 'exitoso' | 'duplicado' | 'invalido' | 'pendiente';

export type Ficha = {
  tono: TonoFicha;
  familia?: string;
  boletos?: number;
  mensaje: string;
  checkedInAt?: string | null;
};

const TITULO: Record<TonoFicha, string> = {
  listo: 'Boleto encontrado',
  exitoso: 'Pueden pasar',
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
  onAdelante: (() => void) | null;
  onCerrar: () => void;
}) {
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-ficha-escaner"
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[55vh] flex-col rounded-t-[2px] border-t border-papel/15 bg-papel-alto px-6 pb-6 pt-5 text-tinta shadow-[0_-8px_24px_rgba(0,0,0,0.28)]"
    >
      <p className={`font-ticket text-[11px] uppercase tracking-[0.28em] ${COLOR_TONO[ficha.tono]}`}>
        {TITULO[ficha.tono]}
      </p>

      <p id="titulo-ficha-escaner" className="mt-2 font-display text-2xl text-tinta">
        Familia: {ficha.familia ?? '—'}
      </p>

      {ficha.boletos !== undefined && ficha.boletos > 0 && (
        <p className="mt-1 font-ticket text-4xl font-bold text-vino">
          Boletos: {ficha.boletos}
        </p>
      )}

      <p className="mt-3 text-sm text-tinta-suave">
        {ficha.checkedInAt
          ? `Este boleto ya fue registrado a las ${formatearHora(ficha.checkedInAt)}.`
          : ficha.mensaje}
      </p>

      <div className="mt-5 flex gap-3">
        {onAdelante && (
          <Boton className="flex-1" disabled={confirmando} onClick={onAdelante}>
            {confirmando ? 'Registrando…' : 'Adelante'}
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
  duplicado: 'text-oro',
  invalido: 'text-alerta',
  pendiente: 'text-tinta-suave',
};
