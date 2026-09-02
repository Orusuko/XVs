'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { escaneosPendientes, sincronizarPendientes } from '@/lib/offline/queue';

function suscribirConexion(alCambiar: () => void) {
  window.addEventListener('online', alCambiar);
  window.addEventListener('offline', alCambiar);

  return () => {
    window.removeEventListener('online', alCambiar);
    window.removeEventListener('offline', alCambiar);
  };
}

function useConexion(): boolean {
  return useSyncExternalStore(
    suscribirConexion,
    () => navigator.onLine,
    () => true,
  );
}

/** Tells staff, in plain words, whether the door is currently working offline. */
export function BannerConexion() {
  const enLinea = useConexion();
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    let activo = true;

    async function revisar() {
      if (enLinea) await sincronizarPendientes();
      const cola = await escaneosPendientes();
      if (activo) setPendientes(cola.length);
    }

    const inmediato = setTimeout(revisar, 0);
    const intervalo = setInterval(revisar, 5000);

    return () => {
      activo = false;
      clearTimeout(inmediato);
      clearInterval(intervalo);
    };
  }, [enLinea]);

  if (enLinea && pendientes === 0) return null;

  return (
    <p role="status" className="bg-oro-claro px-4 py-2 text-center text-sm text-tinta">
      {enLinea
        ? `Enviando ${pendientes} ${pendientes === 1 ? 'escaneo guardado' : 'escaneos guardados'}…`
        : `Sin conexión. Los escaneos se guardan aquí y se envían solos al volver la señal${
            pendientes > 0 ? ` (${pendientes} en espera)` : ''
          }.`}
    </p>
  );
}
