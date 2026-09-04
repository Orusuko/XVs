'use client';

import { openDB, type IDBPDatabase } from 'idb';
import { decisionCola } from '@/lib/offline/decision-cola';

const BASE = 'xv-escaner';
const ALMACEN = 'pendientes';
const CATALOGO = 'familias';

export type EscaneoPendiente = {
  id?: number;
  eventId: string;
  qr: string;
  familia: string;
  boletos: number;
  registradoEn: string;
};

export type FamiliaCache = {
  id: string;
  nombre_familia: string;
  boletos_total: number;
};

let conexion: Promise<IDBPDatabase> | null = null;

function db() {
  conexion ??= openDB(BASE, 1, {
    upgrade(base) {
      if (!base.objectStoreNames.contains(ALMACEN)) {
        base.createObjectStore(ALMACEN, { keyPath: 'id', autoIncrement: true });
      }
      if (!base.objectStoreNames.contains(CATALOGO)) {
        base.createObjectStore(CATALOGO, { keyPath: 'id' });
      }
    },
  });

  return conexion;
}

/**
 * Keeps a local copy of the guest list so that an offline scan can still show
 * the family's name on screen. It is display only — the server decides whether
 * the ticket is actually valid.
 */
export async function guardarCatalogo(familias: FamiliaCache[]): Promise<void> {
  const base = await db();
  const transaccion = base.transaction(CATALOGO, 'readwrite');
  await Promise.all(familias.map((familia) => transaccion.store.put(familia)));
  await transaccion.done;
}

export async function buscarFamiliaLocal(id: string): Promise<FamiliaCache | undefined> {
  return (await db()).get(CATALOGO, id) as Promise<FamiliaCache | undefined>;
}

export async function encolarEscaneo(escaneo: EscaneoPendiente): Promise<void> {
  await (await db()).add(ALMACEN, escaneo);
}

export async function escaneosPendientes(): Promise<EscaneoPendiente[]> {
  return (await db()).getAll(ALMACEN) as Promise<EscaneoPendiente[]>;
}

export async function borrarEscaneo(id: number): Promise<void> {
  await (await db()).delete(ALMACEN, id);
}

/**
 * Sends everything captured while the venue had no signal. The server is still
 * the authority: a scan that turns out to be a duplicate is reported as such.
 */
export async function sincronizarPendientes(): Promise<{
  enviados: number;
  duplicados: number;
  rechazados: number;
  sesionCaducada: boolean;
}> {
  const pendientes = await escaneosPendientes();
  let enviados = 0;
  let duplicados = 0;
  let rechazados = 0;
  let sesionCaducada = false;

  for (const escaneo of pendientes) {
    try {
      const respuesta = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr: escaneo.qr, eventId: escaneo.eventId }),
      });

      const datos = (await respuesta.json().catch(() => ({}))) as { resultado?: string };
      const decision = decisionCola(respuesta.status, datos.resultado);

      if (decision === 'sesion') {
        sesionCaducada = true;
        break;
      }

      if (decision === 'reintentar') {
        break;
      }

      if (datos.resultado === 'duplicado') duplicados += 1;
      else if (datos.resultado === 'invalido' || datos.resultado === 'jti_expirado') {
        rechazados += 1;
      } else {
        enviados += 1;
      }

      if (escaneo.id !== undefined) await borrarEscaneo(escaneo.id);
    } catch {
      // Still offline. The entry stays queued for the next attempt.
      break;
    }
  }

  return { enviados, duplicados, rechazados, sesionCaducada };
}
