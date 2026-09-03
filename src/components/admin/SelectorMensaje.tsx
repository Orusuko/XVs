'use client';

import { MENSAJES_INVITACION } from '@/lib/mensajes-invitacion';

type Props = {
  valor: string;
  propio: boolean;
  onElegirCatalogo: (texto: string) => void;
  onEscribirPropio: () => void;
  onCambiarPropio: (texto: string) => void;
};

const TARJETA =
  'min-h-11 w-full cursor-pointer rounded-[2px] border px-5 py-5 text-left transition-colors duration-200';

/** Cards preview the message in the invitation's own type, not a bare radio list. */
export function SelectorMensaje({
  valor,
  propio,
  onElegirCatalogo,
  onEscribirPropio,
  onCambiarPropio,
}: Props) {
  return (
    <div role="radiogroup" aria-label="Mensaje de la invitación" className="grid gap-3">
      {MENSAJES_INVITACION.map((texto) => {
        const elegida = !propio && valor === texto;
        return (
          <button
            key={texto}
            type="button"
            role="radio"
            aria-checked={elegida}
            onClick={() => onElegirCatalogo(texto)}
            className={`${TARJETA} ${elegida ? 'border-vino bg-papel-alto' : 'border-borde hover:border-vino'}`}
          >
            <p className="font-ticket text-[10px] uppercase tracking-[0.2em] text-oro">
              {elegida ? 'Elegido' : 'Mensaje'}
            </p>
            <p className="mt-2 font-display text-lg leading-relaxed text-tinta">{texto}</p>
          </button>
        );
      })}

      <button
        type="button"
        role="radio"
        aria-checked={propio}
        onClick={onEscribirPropio}
        className={`${TARJETA} ${propio ? 'border-vino bg-papel-alto' : 'border-borde hover:border-vino'}`}
      >
        <p className="font-ticket text-[10px] uppercase tracking-[0.2em] text-oro">El mío</p>
        <p className="mt-2 text-sm text-tinta-suave">
          Escribe una frase que suene a ella, no a plantilla.
        </p>
      </button>

      {propio && (
        <textarea
          value={valor}
          onChange={(e) => onCambiarPropio(e.target.value)}
          rows={3}
          aria-label="Mensaje propio"
          className="min-h-24 w-full rounded-[2px] border border-borde bg-papel-alto p-4 font-display text-lg text-tinta outline-none focus:border-vino"
        />
      )}
    </div>
  );
}
