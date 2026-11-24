import type { SupabaseClient } from '@supabase/supabase-js';
import { esColumnaFaltante } from '@/lib/boletos-familia';

/**
 * Lee familias del evento; si `boletos_confirmados` aún no existe en prod, reintenta sin esa columna.
 */
export async function consultarFamiliasEvento(
  db: SupabaseClient,
  eventId: string,
  camposConConfirmados: string,
  camposSinConfirmados: string,
  opciones?: { orden?: { columna: string; ascendente?: boolean; nullsFirst?: boolean } },
) {
  const ejecutar = async (campos: string) => {
    let q = db.from('families').select(campos).eq('event_id', eventId);
    if (opciones?.orden) {
      q = q.order(opciones.orden.columna, {
        ascending: opciones.orden.ascendente ?? true,
        nullsFirst: opciones.orden.nullsFirst,
      });
    }
    return q;
  };

  let resultado = await ejecutar(camposConConfirmados);
  if (esColumnaFaltante(resultado.error, 'boletos_confirmados')) {
    resultado = await ejecutar(camposSinConfirmados);
  }

  return resultado;
}