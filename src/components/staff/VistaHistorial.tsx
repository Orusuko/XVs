'use client';

import { useMemo, useState } from 'react';
import { useEstadoStaff } from '@/lib/staff-estado';
import { formatearHora } from '@/lib/format';
import { EstadoHoja } from '@/components/ui/EstadoHoja';

export function VistaHistorial({ eventId }: { eventId: string }) {
  const { estado, error, cargando, refrescar } = useEstadoStaff(eventId);
  const [busqueda, setBusqueda] = useState('');
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const coincidencias = useMemo(() => {
    if (!estado || busqueda.trim() === '') return [];
    const termino = busqueda.trim().toLowerCase();
    const unicas = new Map<string, (typeof estado.pendientes)[number]>();

    for (const familia of [...estado.pendientes, ...estado.ingresados]) {
      if (!unicas.has(familia.id) && familia.nombre_familia.toLowerCase().includes(termino)) {
        unicas.set(familia.id, familia);
      }
    }

    return [...unicas.values()];
  }, [estado, busqueda]);

  async function marcarEntrada(familyId: string, cantidad: number) {
    setTrabajando(familyId);
    const respuesta = await fetch('/api/checkin/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, familyId, cantidad }),
    });
    const datos = await respuesta.json().catch(() => null);
    setAviso(
      respuesta.ok
        ? (datos?.mensaje ?? null)
        : (datos?.error ?? 'No pudimos completar eso. Inténtalo de nuevo.'),
    );
    setTrabajando(null);
    await refrescar();
  }

  async function revertir(familyId: string) {
    setTrabajando(familyId);
    const respuesta = await fetch('/api/checkin/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, familyId }),
    });
    const datos = await respuesta.json().catch(() => null);
    setAviso(
      respuesta.ok
        ? 'Entrada revertida. Ese código QR ya no sirve: la familia debe abrir su invitación otra vez.'
        : (datos?.error ?? 'No pudimos completar eso. Inténtalo de nuevo.'),
    );
    setTrabajando(null);
    await refrescar();
  }

  if (error) {
    const sesion = error.includes('sesión');
    return (
      <EstadoHoja
        tono="tinta"
        etiqueta="Historial"
        titulo={sesion ? 'Se cortó la sesión' : 'No pudimos cargar'}
        detalle={error}
        accion={
          sesion ? undefined : (
            <button
              type="button"
              onClick={() => void refrescar()}
              className="min-h-11 cursor-pointer text-oro-claro underline underline-offset-4"
            >
              Reintentar
            </button>
          )
        }
      />
    );
  }

  if (cargando || !estado) {
    return (
      <EstadoHoja
        tono="tinta"
        etiqueta="Historial"
        titulo="Buscando familias"
        detalle="Un momento, estamos pidiendo la lista confirmada."
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro-claro">
        Búsqueda y correcciones
      </p>
      <h1 className="mt-3 font-display text-2xl text-papel">Buscar por nombre</h1>

      <label htmlFor="busqueda" className="sr-only">
        Nombre de la familia
      </label>
      <input
        id="busqueda"
        value={busqueda}
        onChange={(campo) => setBusqueda(campo.target.value)}
        placeholder="Escribe el apellido"
        className="mt-4 min-h-12 w-full rounded-[2px] border border-papel/25 bg-transparent px-4 text-papel outline-none transition-colors duration-200 focus:border-oro-claro"
      />

      {aviso && (
        <p role="status" className="mt-4 text-sm text-oro-claro">
          {aviso}
        </p>
      )}

      {busqueda.trim() !== '' && coincidencias.length === 0 && (
        <EstadoHoja
          tono="tinta"
          compacto
          titulo="Nadie coincide"
          detalle="Ninguna familia confirmada tiene ese apellido. Revisa la ortografía."
        />
      )}

      <ul className="mt-4 divide-y divide-papel/10">
        {coincidencias.map((familia) => {
          const usados = familia.boletos_usados ?? (familia.checked_in ? familia.boletos_total : 0);
          const faltan = Math.max(0, familia.boletos_total - usados);
          const seleccion = Math.min(faltan, Math.max(1, cantidades[familia.id] ?? faltan));

          return (
            <li key={familia.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-papel">{familia.nombre_familia}</span>
                <span className="mt-1 block font-ticket text-xs text-papel/50">
                  {usados > 0
                    ? `${usados} de ${familia.boletos_total} boletos`
                    : `${familia.boletos_total} ${familia.boletos_total === 1 ? 'boleto' : 'boletos'}`}
                  {familia.checked_in_at && ` · entró ${formatearHora(familia.checked_in_at)}`}
                </span>
              </span>

              <div className="flex items-center gap-2">
                {faltan > 0 && (
                  <>
                    {faltan > 1 && (
                      <select
                        aria-label={`Cuántos boletos entran de ${familia.nombre_familia}`}
                        value={seleccion}
                        onChange={(e) =>
                          setCantidades((prev) => ({
                            ...prev,
                            [familia.id]: Number(e.target.value),
                          }))
                        }
                        className="min-h-11 rounded-[2px] border border-papel/25 bg-tinta px-2 font-ticket text-sm text-papel"
                      >
                        {Array.from({ length: faltan }, (_, idx) => idx + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      disabled={trabajando === familia.id}
                      onClick={() => marcarEntrada(familia.id, seleccion)}
                      className="min-h-11 cursor-pointer rounded-[2px] bg-oro-claro px-4 text-sm font-medium text-tinta transition-colors duration-200 hover:bg-oro disabled:opacity-50"
                    >
                      Marcar entrada
                    </button>
                  </>
                )}

                {usados > 0 && (
                  <button
                    type="button"
                    disabled={trabajando === familia.id}
                    onClick={() => revertir(familia.id)}
                    className="min-h-11 cursor-pointer px-3 text-sm text-oro-claro underline underline-offset-4 disabled:opacity-50"
                  >
                    Deshacer entrada
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-12 font-display text-xl text-papel">Últimas entradas</h2>

      {estado.ingresados.length === 0 ? (
        <EstadoHoja
          tono="tinta"
          compacto
          titulo="Sin entradas todavía"
          detalle="Cuando escaneen el primer boleto, aparece en esta lista."
        />
      ) : (
        <ul className="mt-3 divide-y divide-papel/10">
          {estado.ingresados.slice(0, 15).map((familia) => (
            <li key={familia.id} className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-papel">{familia.nombre_familia}</span>
                <span className="mt-1 block font-ticket text-xs text-papel/50">
                  {formatearHora(familia.checked_in_at)}
                  {familia.checked_in_by && ` · ${familia.checked_in_by}`}
                </span>
              </span>
              <button
                type="button"
                disabled={trabajando === familia.id}
                onClick={() => revertir(familia.id)}
                className="min-h-11 cursor-pointer px-3 text-sm text-oro-claro underline underline-offset-4 disabled:opacity-50"
              >
                Deshacer
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
