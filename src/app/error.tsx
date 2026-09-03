'use client';

import { EstadoHoja } from '@/components/ui/EstadoHoja';
import { Boton } from '@/components/ui/Boton';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="textura-papel flex min-h-screen items-center justify-center">
      <EstadoHoja
        etiqueta="Algo falló"
        titulo="Esta hoja se atascó"
        detalle="Prueba de nuevo. Si sigue igual, pide el enlace otra vez a quien te invitó."
        accion={
          <Boton type="button" onClick={reset}>
            Reintentar
          </Boton>
        }
      />
    </main>
  );
}
