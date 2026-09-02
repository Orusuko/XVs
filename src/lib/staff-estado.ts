'use client';

import { useCallback, useEffect, useState } from 'react';
import { guardarCatalogo } from '@/lib/offline/queue';
import type { TicketSummary } from '@/lib/tickets';

export type FamiliaStaff = {
  id: string;
  nombre_familia: string;
  boletos_total: number;
  estado_confirmacion: string;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
};

export type EstadoStaff = {
  staff: string;
  evento: { quinceanera: string; capacidadTotal: number | null };
  resumen: TicketSummary;
  ingresados: FamiliaStaff[];
  pendientes: FamiliaStaff[];
};

/**
 * Staff devices are not Supabase-authenticated, so they poll rather than
 * subscribe. Five seconds keeps every door close enough to the same number.
 */
export function useEstadoStaff(eventId: string) {
  const [estado, setEstado] = useState<EstadoStaff | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const respuesta = await fetch(`/api/staff/estado?eventId=${eventId}`, { cache: 'no-store' });

      if (respuesta.status === 401) {
        setError('Tu sesión terminó. Vuelve a entrar con tu PIN.');
        return;
      }

      if (!respuesta.ok) return;

      const datos: EstadoStaff = await respuesta.json();
      setEstado(datos);
      setError(null);

      // Cached so an offline scan can still name the family on screen.
      await guardarCatalogo(
        [...datos.ingresados, ...datos.pendientes].map((familia) => ({
          id: familia.id,
          nombre_familia: familia.nombre_familia,
          boletos_total: familia.boletos_total,
        })),
      );
    } catch {
      // Offline. The last known numbers stay on screen.
    }
  }, [eventId]);

  useEffect(() => {
    const inmediato = setTimeout(refrescar, 0);
    const intervalo = setInterval(refrescar, 5000);

    return () => {
      clearTimeout(inmediato);
      clearInterval(intervalo);
    };
  }, [refrescar]);

  return { estado, error, refrescar };
}
