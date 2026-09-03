'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLAVE_TEMPLATE_CONFIG, PLANTILLAS, type TemplateId } from '@/lib/templates/catalogo';

type Props = {
  eventId: string;
  nombreQuinceanera: string;
  templateConfig: Record<string, string>;
  actual: TemplateId;
};

export function SelectorPlantilla({ eventId, nombreQuinceanera, templateConfig, actual }: Props) {
  const router = useRouter();
  const [elegida, setElegida] = useState<TemplateId>(actual);
  const [guardando, setGuardando] = useState<TemplateId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function elegir(id: TemplateId) {
    if (id === elegida) return;

    setGuardando(id);
    setError(null);

    const respuesta = await fetch('/api/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: eventId,
        template_config: { ...templateConfig, [CLAVE_TEMPLATE_CONFIG]: id },
      }),
    });

    setGuardando(null);

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      setError(datos.error ?? 'No pudimos guardar la plantilla.');
      return;
    }

    setElegida(id);
    router.refresh();
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-3">
        {PLANTILLAS.map((plantilla) => {
          const seleccionada = elegida === plantilla.id;

          return (
            <button
              key={plantilla.id}
              type="button"
              disabled={guardando !== null}
              onClick={() => elegir(plantilla.id)}
              aria-pressed={seleccionada}
              className={`min-h-11 cursor-pointer rounded-[2px] border p-3 text-left transition-colors duration-200 disabled:cursor-not-allowed ${
                seleccionada ? 'border-vino' : 'border-borde hover:border-vino'
              }`}
            >
              <VistaPrevia id={plantilla.id} nombre={nombreQuinceanera} />

              <p className="mt-3 font-display text-lg text-tinta">{plantilla.nombre}</p>
              <p className="mt-1 text-sm text-tinta-suave">{plantilla.descripcion}</p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex gap-1" aria-hidden="true">
                  {plantilla.paleta.map((color) => (
                    <span
                      key={color}
                      className="h-4 w-4 rounded-full border border-borde"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {guardando === plantilla.id && (
                  <span className="font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave">
                    Guardando…
                  </span>
                )}
                {seleccionada && guardando !== plantilla.id && (
                  <span className="font-ticket text-[10px] uppercase tracking-[0.2em] text-vino">
                    Elegida
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-alerta">{error}</p>}
    </div>
  );
}

/**
 * A hand-built miniature of each template's hero — never the real, network-aware
 * template component, so choosing a card can never trigger a fetch or confirm.
 */
function VistaPrevia({ id, nombre }: { id: TemplateId; nombre: string }) {
  const clase = id === 'jardin' ? 'tema-jardin' : id === 'mariposas' ? 'tema-mariposas' : '';
  const nombreVisible = nombre.trim() || 'Quinceañera';

  return (
    <div
      className={`aspect-[3/4] w-full overflow-hidden rounded-[2px] border border-borde bg-papel ${clase}`}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
        {id === 'jardin' && (
          <>
            <p className="font-script text-4xl leading-none text-vino">XV</p>
            <p className="font-script text-lg leading-none text-vino">años</p>
            <p className="mt-2 font-display text-sm text-tinta">{nombreVisible}</p>
          </>
        )}

        {id === 'mariposas' && (
          <div className="marco-mariposas bg-papel-alto px-3 py-4">
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-2xl text-vino">{nombreVisible}</p>
          </div>
        )}

        {id === 'clasica' && (
          <>
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-3xl text-vino">{nombreVisible}</p>
          </>
        )}
      </div>
    </div>
  );
}
