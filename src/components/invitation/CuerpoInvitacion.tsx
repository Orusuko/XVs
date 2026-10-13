import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  /** `columna` is the day-as-timeline used by Itinerario. */
  lugares?: 'bloques' | 'columna';
  alineacion?: 'centro' | 'izquierda';
  /** `grabada` is the bordered plaque; `programa` and `ninguna` drop the border. */
  placa?: 'grabada' | 'programa' | 'ninguna';
  /** Vista previa del organizador: no se monta el panel de confirmación. */
  sinConfirmacion?: boolean;
};

export function CuerpoInvitacion({
  token,
  invitacion,
  lugares = 'bloques',
  alineacion = 'centro',
  placa = 'grabada',
  sinConfirmacion = false,
}: Props) {
  const { evento, familia } = invitacion;
  const centro = alineacion === 'centro' ? 'text-center' : '';
  const boletos = `${familia.boletos} ${familia.boletos === 1 ? 'boleto' : 'boletos'}`;

  return (
    <>
      {placa === 'grabada' && (
        <section className={`surgir surgir-2 mt-10 border-y border-borde py-6 ${centro}`.trim()}>
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-tinta-suave">
            Esta invitación es para
          </p>
          <p className="mt-3 font-display text-3xl text-tinta">Familia {familia.nombre}</p>
          <p className="mt-2 font-ticket text-sm text-oro">{boletos}</p>
        </section>
      )}

      {placa === 'programa' && (
        <section className="surgir surgir-2 mt-10 text-left">
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">Invitados</p>
          <p className="mt-2 font-display text-2xl text-tinta">
            Familia {familia.nombre} · {boletos}
          </p>
        </section>
      )}

      {placa === 'ninguna' && (
        <p className="surgir surgir-2 mt-10 font-ticket text-sm text-tinta-suave">
          Familia {familia.nombre} · {boletos}
        </p>
      )}

      {evento.mensaje && (
        <p
          className={`surgir surgir-3 mt-10 font-display text-lg leading-relaxed text-tinta-suave ${centro}`.trim()}
        >
          {evento.mensaje}
        </p>
      )}

      {lugares === 'columna' ? (
        <div className="surgir surgir-4 mt-12 border-l-2 border-oro pl-6">
          {evento.misa && (
            <BloqueLugar
              className="border-t-0 pt-0"
              etiqueta="Misa"
              lugar={evento.misa}
              quinceanera={evento.quinceanera}
            />
          )}
          {evento.recepcion && (
            <BloqueLugar
              className={evento.misa ? 'mt-10' : 'border-t-0 pt-0'}
              etiqueta="Recepción"
              lugar={evento.recepcion}
              quinceanera={evento.quinceanera}
            />
          )}
        </div>
      ) : (
        <div className="surgir surgir-4 mt-12 space-y-10">
          {evento.misa && (
            <BloqueLugar etiqueta="Misa" lugar={evento.misa} quinceanera={evento.quinceanera} />
          )}
          {evento.recepcion && (
            <BloqueLugar
              etiqueta="Recepción"
              lugar={evento.recepcion}
              quinceanera={evento.quinceanera}
            />
          )}
        </div>
      )}

      {evento.vestimenta && (
        <p className={`surgir surgir-4 mt-8 font-ticket text-sm text-tinta-suave ${centro}`.trim()}>
          Vestimenta: {evento.vestimenta}
        </p>
      )}

      {!sinConfirmacion && (
        <div className="surgir surgir-5 mt-12 border-t border-borde pt-8">
          <PanelConfirmacion token={token} invitacion={invitacion} />
        </div>
      )}
    </>
  );
}
