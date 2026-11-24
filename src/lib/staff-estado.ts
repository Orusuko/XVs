'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { guardarCatalogo } from '@/lib/offline/queue';
import type { TicketSummary } from '@/lib/tickets';

export type FamiliaStaff = {
  id: string;
  nombre_familia: string;
  boletos_total: number;
  boletos_usados: number;
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

const TIMEOUT_MS = 15_000;

/**
 * Staff devices are not Supabase-authenticated, so they poll rather than
 * subscribe. Five seconds keeps every door close enough to the same number.
 */
export function useEstadoStaff(eventId: string) {
  const [estado, setEstado] = useState<EstadoStaff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const tieneDatos = useRef(false);

  const refrescar = useCallback(async () => {
    if (!tieneDatos.current) setCargando(true);

    const controlador = new AbortController();
    const reloj = setTimeout(() => controlador.abort(), TIMEOUT_MS);

    try {
      const respuesta = await fetch(`/api/staff/estado?eventId=${eventId}`, {
        cache: 'no-store',
        signal: controlador.signal,
      });

      if (respuesta.status === 401) {
        setError('Tu sesión terminó. Vuelve a entrar con tu PIN.');
        setCargando(false);
        return;
      }

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(
          datos?.error ??
            'No pudimos leer el conteo. Si el problema sigue, avisa al organizador.',
        );
        setCargando(false);
        return;
      }

      const datos: EstadoStaff = await respuesta.json();
      setEstado(datos);
      tieneDatos.current = true;
      setError(null);
      setCargando(false);

      await guardarCatalogo(
        [...datos.ingresados, ...datos.pendientes].map((familia) => ({
          id: familia.id,
          nombre_familia: familia.nombre_familia,
          boletos_total: familia.boletos_total,
          boletos_usados: familia.boletos_usados ?? 0,
        })),
      );
    } catch (causa) {
      const abortado = causa instanceof DOMException && causa.name === 'AbortError';
      setError(
        abortado
          ? 'La consulta tardó demasiado. Comprueba la conexión e inténtalo de nuevo.'
          : 'Sin conexión o error al leer el servidor. Inténtalo de nuevo.',
      );
      setCargando(false);
    } finally {
      clearTimeout(reloj);
    }
  }, [eventId]);

  useEffect(() => {
    const inmediato = setTimeout(() => {
      void refrescar();
    }, 0);
    const intervalo = setInterval(() => {
      void refrescar();
    }, 5000);

    return () => {
      clearTimeout(inmediato);
      clearInterval(intervalo);
    };
  }, [refrescar]);

  return { estado, error, cargando, refrescar };
}