'use client';

import type { ReactNode } from 'react';
import { EstadoHoja } from '@/components/ui/EstadoHoja';

type Props = {
  etiqueta: string;
  tituloCarga: string;
  detalleCarga: string;
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
  children: ReactNode;
};

export function EstadoCargaStaff({
  etiqueta,
  tituloCarga,
  detalleCarga,
  cargando,
  error,
  onReintentar,
  children,
}: Props) {
  if (error) {
    return (
      <EstadoHoja
        tono="tinta"
        etiqueta={etiqueta}
        titulo="No pudimos cargar"
        detalle={error}
        accion={
          <button
            type="button"
            onClick={onReintentar}
            className="min-h-11 cursor-pointer text-oro-claro underline underline-offset-4"
          >
            Reintentar
          </button>
        }
      />
    );
  }

  if (cargando) {
    return (
      <EstadoHoja tono="tinta" etiqueta={etiqueta} titulo={tituloCarga} detalle={detalleCarga} />
    );
  }

  return <>{children}</>;
}