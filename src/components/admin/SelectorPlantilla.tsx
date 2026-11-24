'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CLAVE_TEMPLATE_CONFIG,
  FILTROS_FAMILIA,
  claseTema,
  layoutDe,
  layoutsUnicos,
  plantillasDeLayout,
  type FamiliaCatalogo,
  type TemplateId,
} from '@/lib/templates/catalogo';
import { BannerPicado } from '@/components/invitation/BannerPicado';

type Props = {
  eventId: string;
  nombreQuinceanera: string;
  templateConfig: Record<string, string>;
  actual: TemplateId;
};

export function SelectorPlantilla({ eventId, nombreQuinceanera, templateConfig, actual }: Props) {
  const router = useRouter();
  const [elegida, setElegida] = useState<TemplateId>(actual);
  const [filtro, setFiltro] = useState<FamiliaCatalogo | 'todas'>('todas');
  const [guardando, setGuardando] = useState<TemplateId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibles = useMemo(() => layoutsUnicos(filtro), [filtro]);

  async function elegir(id: TemplateId) {
    if (id === elegida) return;

    setGuardando(id);
    setError(null);

    try {
      const respuesta = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          template_config: { ...templateConfig, [CLAVE_TEMPLATE_CONFIG]: id },
        }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setError(datos.error ?? 'No pudimos guardar la plantilla.');
        return;
      }

      setElegida(id);
      router.refresh();
    } catch {
      setError('No pudimos conectar. Revisa tu red e inténtalo de nuevo.');
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar diseños">
        {FILTROS_FAMILIA.map((familia) => {
          const activo = filtro === familia.id;
          return (
            <button
              key={familia.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(familia.id)}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-[2px] border px-4 text-sm transition-colors duration-200 ${
                activo
                  ? 'border-vino bg-vino text-papel-alto'
                  : 'border-borde text-tinta hover:border-vino'
              }`}
            >
              {familia.etiqueta}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibles.map((layout) => {
          const grupo = plantillasDeLayout(layout);
          const enGrupo = grupo.some((p) => p.id === elegida);
          const miniatura = enGrupo ? elegida : grupo[0].id;

          return (
            <div
              key={layout}
              className={`rounded-[2px] border p-3 transition-colors duration-200 ${
                enGrupo ? 'border-vino' : 'border-borde hover:border-vino'
              }`}
            >
              <button
                type="button"
                disabled={guardando !== null}
                onClick={() => elegir(miniatura)}
                className="block w-full cursor-pointer text-left disabled:cursor-not-allowed"
              >
                <VistaPrevia id={miniatura} nombre={nombreQuinceanera} />
                <p className="mt-3 font-display text-lg text-tinta">{grupo[0].nombre}</p>
                <p className="mt-1 text-sm text-tinta-suave">{grupo[0].descripcion}</p>
              </button>

              <div className="mt-1 flex flex-wrap items-center gap-1">
                {grupo.map((plantilla) => (
                  <button
                    key={plantilla.id}
                    type="button"
                    disabled={guardando !== null}
                    aria-pressed={elegida === plantilla.id}
                    aria-label={plantilla.nombre}
                    title={plantilla.nombre}
                    onClick={() => elegir(plantilla.id)}
                    className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center disabled:cursor-not-allowed"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-6 w-6 rounded-full border-2 ${
                        elegida === plantilla.id ? 'border-vino' : 'border-borde'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${plantilla.paleta[0]} 50%, ${plantilla.paleta[1]} 50%)`,
                      }}
                    />
                  </button>
                ))}

                {guardando !== null && grupo.some((p) => p.id === guardando) ? (
                  <span className="font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave">
                    Guardando…
                  </span>
                ) : (
                  enGrupo && (
                    <span className="font-ticket text-[10px] uppercase tracking-[0.2em] text-vino">
                      Elegida
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibles.length === 0 && (
        <p className="mt-8 text-sm text-tinta-suave">No hay diseños en esta familia.</p>
      )}

      {error && <p className="mt-4 text-sm text-alerta">{error}</p>}
    </div>
  );
}

/**
 * A hand-built miniature of each template's hero — never the real, network-aware
 * template component, so choosing a card can never trigger a fetch or confirm.
 */
function VistaPrevia({ id, nombre }: { id: TemplateId; nombre: string }) {
  const layout = layoutDe(id);
  const clase = claseTema(id);
  const nombreVisible = nombre.trim() || 'Quinceañera';

  return (
    <div
      className={`aspect-[3/4] w-full overflow-hidden rounded-[2px] border border-borde bg-papel ${clase}`}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
        {layout === 'jardin' && (
          <>
            <p className="font-script text-4xl leading-none text-vino">XV</p>
            <p className="font-script text-lg leading-none text-vino">años</p>
            <p className="mt-2 font-display text-sm text-tinta">{nombreVisible}</p>
          </>
        )}

        {layout === 'mariposas' && (
          <div className="marco-mariposas bg-papel-alto px-3 py-4">
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-2xl text-vino">{nombreVisible}</p>
          </div>
        )}

        {layout === 'clasica' && (
          <>
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-3xl text-vino">{nombreVisible}</p>
          </>
        )}

        {layout === 'vals' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-oro">
              <span className="font-script text-3xl leading-none text-vino">XV</span>
            </span>
            <p className="mt-2 font-script text-2xl text-vino">{nombreVisible}</p>
          </>
        )}

        {layout === 'deco' && (
          <div className="marco-deco bg-papel-alto px-3 py-4">
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-display text-lg text-tinta">{nombreVisible}</p>
          </div>
        )}

        {layout === 'boho' && (
          <div className="flex w-full items-center gap-2">
            <svg viewBox="0 0 32 48" fill="none" aria-hidden="true" className="h-12 w-8 shrink-0">
              <path d="M16 46C16 30 18 14 24 2" stroke="var(--color-oro)" strokeWidth="1.5" />
              <ellipse cx="11" cy="30" rx="6" ry="3" transform="rotate(-35 11 30)" fill="var(--color-oro)" />
              <ellipse cx="22" cy="20" rx="6" ry="3" transform="rotate(35 22 20)" fill="var(--color-oro)" />
              <ellipse cx="12" cy="12" rx="5" ry="2.5" transform="rotate(-35 12 12)" fill="var(--color-oro)" />
            </svg>
            <p className="text-left font-script text-2xl leading-tight text-vino">
              {nombreVisible}
            </p>
          </div>
        )}

        {layout === 'picado' && (
          <div className="w-full">
            <BannerPicado className="h-auto w-full" />
            <p className="my-3 font-script text-2xl text-vino">{nombreVisible}</p>
            <BannerPicado invertido className="h-auto w-full" />
          </div>
        )}

        {layout === 'corona' && (
          <div className="arco-corona w-full px-2 pb-4 pt-6">
            <p className="font-ticket text-[7px] uppercase tracking-[0.3em] text-oro">XV</p>
            <p className="mt-1 font-script text-2xl text-vino">{nombreVisible}</p>
          </div>
        )}

        {layout === 'charra' && (
          <div className="w-full">
            <div className="franja-zarape h-2 w-full" />
            <p className="mt-3 font-display text-lg text-tinta">{nombreVisible}</p>
            <p className="mt-1 font-ticket text-[8px] uppercase tracking-[0.2em] text-oro">XV</p>
            <div className="franja-zarape mt-3 h-2 w-full" />
          </div>
        )}

        {layout === 'retrato' && (
          <div className="marco-retrato flex aspect-[3/4] w-full items-end bg-papel-alto px-3 pb-3">
            <p className="text-left font-display text-sm text-tinta">{nombreVisible}</p>
          </div>
        )}

        {layout === 'celeste' && (
          <>
            <span
              aria-hidden="true"
              className="mb-2 inline-block h-8 w-8 rounded-full bg-oro opacity-80"
              style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 35% 100%, 60% 50%)' }}
            />
            <p className="font-script text-2xl text-vino">{nombreVisible}</p>
          </>
        )}

        {layout === 'editorial' && (
          <div className="w-full text-left">
            <p className="font-ticket text-5xl leading-none text-vino">15</p>
            <p className="mt-1 border-b border-tinta pb-1 font-ticket text-[8px] uppercase tracking-[0.2em] text-oro">
              Sep
            </p>
            <p className="mt-2 font-display text-sm text-tinta">{nombreVisible}</p>
          </div>
        )}

        {layout === 'vitela' && (
          <div className="capa-vitela relative w-full px-3 py-5">
            <p className="font-script text-2xl text-vino">{nombreVisible}</p>
            <span
              aria-hidden="true"
              className="mx-auto mt-2 block h-6 w-6 rounded-full bg-vino"
            />
          </div>
        )}

        {layout === 'itinerario' && (
          <div className="w-full border-l-2 border-oro pl-3 text-left">
            <p className="font-ticket text-[8px] uppercase tracking-[0.2em] text-oro">Misa</p>
            <p className="mt-2 font-ticket text-[8px] uppercase tracking-[0.2em] text-oro">
              Recepción
            </p>
            <p className="mt-3 font-display text-sm text-tinta">{nombreVisible}</p>
          </div>
        )}
      </div>
    </div>
  );
}
