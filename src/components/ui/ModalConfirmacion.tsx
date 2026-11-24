'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Boton } from '@/components/ui/Boton';

type Props = {
  abierto: boolean;
  titulo: string;
  detalle: ReactNode;
  confirmarEtiqueta?: string;
  cancelarEtiqueta?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function ModalConfirmacion({
  abierto,
  titulo,
  detalle,
  confirmarEtiqueta = 'Confirmar',
  cancelarEtiqueta = 'Cancelar',
  onConfirmar,
  onCancelar,
}: Props) {
  const tituloId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (abierto && !dialog.open) dialog.showModal();
    if (!abierto && dialog.open) dialog.close();
  }, [abierto]);

  if (!abierto) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tituloId}
      className="fixed inset-0 z-50 m-auto w-[min(100%,24rem)] rounded-[2px] border border-borde bg-papel p-0 shadow-lg backdrop:bg-tinta/50 open:flex open:flex-col"
      onClose={onCancelar}
    >
      <div className="px-6 pb-6 pt-8">
        <h2 id={tituloId} className="font-display text-xl text-tinta">
          {titulo}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-tinta-suave">{detalle}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Boton type="button" onClick={onConfirmar}>
            {confirmarEtiqueta}
          </Boton>
          <Boton type="button" variante="contorno" onClick={onCancelar}>
            {cancelarEtiqueta}
          </Boton>
        </div>
      </div>
    </dialog>
  );
}