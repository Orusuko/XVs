'use client';

import { useState } from 'react';
import { useEstadoStaff } from '@/lib/staff-estado';
import { formatearHora } from '@/lib/format';
import { EstadoHoja } from '@/components/ui/EstadoHoja';

export function VistaConteo({ eventId }: { eventId: string }) {
  const { estado, error } = useEstadoStaff(eventId);
  const [pestana, setPestana] = useState<'ingresados' | 'pendientes'>('ingresados');

  if (error) {
    return (
      <EstadoHoja tono="tinta" etiqueta="Conteo" titulo="Se cortó la sesión" detalle={error} />
    );
  }

  if (!estado) {
    return (
      <EstadoHoja
        tono="tinta"
        etiqueta="Conteo"
        titulo="Preparando el conteo"
        detalle="Un momento, estamos pidiendo los boletos de esta noche."
      />
    );
  }

  const { resumen, evento } = estado;
  const aforo = evento.capacidadTotal;
  const porcentaje = aforo ? Math.min(100, Math.round((resumen.ingresados / aforo) * 100)) : null;
  const casiLleno = porcentaje !== null && porcentaje >= 85;

  const lista = pestana === 'ingresados' ? estado.ingresados : estado.pendientes;

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro-claro">
        Boletos ingresados
      </p>

      <p className="mt-3 font-ticket text-6xl leading-none text-papel">
        {resumen.ingresados}
        {aforo !== null && <span className="text-2xl text-papel/50"> / {aforo}</span>}
      </p>

      {porcentaje !== null && (
        <div className="mt-5">
          <div
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Aforo del salón"
            className="h-2 w-full overflow-hidden rounded-full bg-papel/15"
          >
            <div
              className={`h-full transition-[width] duration-300 ${
                casiLleno ? 'bg-oro-claro' : 'bg-papel/70'
              }`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          {casiLleno && (
            <p role="status" className="mt-2 text-sm text-oro-claro">
              El salón está por llenarse: {porcentaje}% del aforo.
            </p>
          )}
        </div>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
        <Dato etiqueta="Confirmados" valor={resumen.confirmados} />
        <Dato etiqueta="Por entrar" valor={resumen.porIngresar} />
        <Dato etiqueta="Sin responder" valor={resumen.pendientes} />
      </dl>

      <div className="mt-10 flex border-b border-papel/15">
        <Pestana
          activa={pestana === 'ingresados'}
          onClick={() => setPestana('ingresados')}
          etiqueta={`Ingresados (${estado.ingresados.length})`}
        />
        <Pestana
          activa={pestana === 'pendientes'}
          onClick={() => setPestana('pendientes')}
          etiqueta={`Pendientes (${estado.pendientes.length})`}
        />
      </div>

      {lista.length === 0 ? (
        <EstadoHoja
          tono="tinta"
          compacto
          titulo={pestana === 'ingresados' ? 'Todavía no entra nadie' : 'No queda nadie por entrar'}
          detalle={
            pestana === 'ingresados'
              ? 'En cuanto escaneen el primer boleto, aparece aquí.'
              : 'Todas las familias confirmadas ya están dentro.'
          }
        />
      ) : (
        <ul className="mt-4 divide-y divide-papel/10">
          {lista.map((familia) => (
            <li key={familia.id} className="flex items-center justify-between py-4">
              <span>
                <span className="block text-papel">{familia.nombre_familia}</span>
                {familia.checked_in_at && (
                  <span className="mt-1 block font-ticket text-xs text-papel/50">
                    {formatearHora(familia.checked_in_at)}
                    {familia.checked_in_by && ` · ${familia.checked_in_by}`}
                  </span>
                )}
              </span>
              <span className="font-ticket text-xl text-oro-claro">{familia.boletos_total}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="border border-papel/15 px-3 py-4">
      <dt className="font-ticket text-[10px] uppercase tracking-[0.2em] text-papel/50">
        {etiqueta}
      </dt>
      <dd className="mt-1 font-ticket text-2xl text-papel">{valor}</dd>
    </div>
  );
}

function Pestana({
  activa,
  onClick,
  etiqueta,
}: {
  activa: boolean;
  onClick: () => void;
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`min-h-12 flex-1 cursor-pointer border-b-2 text-sm transition-colors duration-200 ${
        activa
          ? 'border-oro-claro text-papel'
          : 'border-transparent text-papel/55 hover:text-papel'
      }`}
    >
      {etiqueta}
    </button>
  );
}
