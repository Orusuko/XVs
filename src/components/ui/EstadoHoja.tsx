import type { ReactNode } from 'react';

type Props = {
  tono?: 'papel' | 'tinta';
  etiqueta?: string;
  titulo: string;
  detalle: string;
  accion?: ReactNode;
  compacto?: boolean;
};

/**
 * Shared frame for loading/empty/error states, so a wait or a dead end still
 * reads like part of the invitation — eyebrow, display heading, an action —
 * instead of a bare centered `<p>`.
 */
export function EstadoHoja({
  tono = 'papel',
  etiqueta,
  titulo,
  detalle,
  accion,
  compacto = false,
}: Props) {
  const tinta = tono === 'tinta';

  return (
    <div
      role="status"
      className={`mx-auto flex w-full max-w-md flex-col items-center justify-center px-6 text-center ${
        compacto ? 'py-10' : 'min-h-[40vh]'
      } ${tinta ? 'text-papel' : 'text-tinta'}`}
    >
      {etiqueta && (
        <p
          className={`font-ticket text-[11px] uppercase tracking-[0.28em] ${
            tinta ? 'text-oro-claro' : 'text-oro'
          }`}
        >
          {etiqueta}
        </p>
      )}
      <h2 className={`mt-3 font-display text-2xl ${tinta ? 'text-papel' : 'text-tinta'}`}>
        {titulo}
      </h2>
      <p className={`mt-2 text-sm ${tinta ? 'text-papel/70' : 'text-tinta-suave'}`}>{detalle}</p>
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
