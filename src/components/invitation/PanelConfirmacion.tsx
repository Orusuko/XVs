'use client';

import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { PaseCine } from '@/components/invitation/PaseCine';
import { DescargarPdf } from '@/components/invitation/DescargarPdf';
import type { EstadoConfirmacion, InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

/**
 * Owns the whole confirm-and-collect-your-pass flow, so the QR and the PDF
 * button always agree on the same state: neither exists until the family says
 * yes, and both stay in sync the moment they do.
 */
export function PanelConfirmacion({ token, invitacion }: Props) {
  const { familia } = invitacion;
  const [estado, setEstado] = useState<EstadoConfirmacion>(familia.estado);
  const [boletosPase, setBoletosPase] = useState(familia.boletos);
  const [qr, setQr] = useState<string | null>(null);
  const [reciénConfirmado, setReciénConfirmado] = useState(false);
  const [preguntando, setPreguntando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (familia.estado !== 'confirmado') return;

    fetch(`/api/invitacion/${token}/qr`)
      .then((res) => (res.ok ? res.json() : null))
      .then((datos) => {
        if (datos?.qr) setQr(datos.qr);
        if (typeof datos?.boletos === 'number') setBoletosPase(datos.boletos);
      })
      .catch(() => setError('No pudimos cargar tu pase. Revisa tu conexión.'));
  }, [familia.estado, token]);

  async function responder(asistira: boolean, boletosConfirmados?: number) {
    setEnviando(true);
    setError(null);

    try {
      const cuerpo: { asistira: boolean; boletos_confirmados?: number } = { asistira };
      if (asistira && boletosConfirmados !== undefined) {
        cuerpo.boletos_confirmados = boletosConfirmados;
      }

      const respuesta = await fetch(`/api/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setPreguntando(false);
        setError(datos.error ?? 'No pudimos guardar tu respuesta.');
        return;
      }

      setEstado(datos.estado);
      setPreguntando(false);

      if (datos.estado === 'confirmado') {
        if (typeof datos.boletos === 'number') setBoletosPase(datos.boletos);
        setQr(datos.qr);
        setReciénConfirmado(true);
      } else {
        setQr(null);
      }
    } catch {
      setError('No pudimos guardar tu respuesta. Revisa tu conexión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-2">
      {estado === 'confirmado' &&
        (qr ? (
          <PaseCine
            qr={qr}
            familia={familia.nombre}
            boletos={boletosPase}
            descargarAlAparecer={reciénConfirmado}
          />
        ) : (
          <p className="mt-10 text-center text-tinta-suave">Preparando tu pase…</p>
        ))}

      <div className="mt-6 border-t border-borde pt-6">
        <DescargarPdf invitacion={invitacion} qr={estado === 'confirmado' ? qr ?? undefined : undefined} />
      </div>

      {error && <p className="mt-4 text-center text-sm text-alerta">{error}</p>}

      <div className="mt-6 border-t border-borde pt-6 text-center">
        {estado === 'rechazado' && (
          <>
            <p className="font-display text-xl text-tinta">Gracias por avisarnos</p>
            <p className="mt-2 text-tinta-suave">Te vamos a extrañar esa noche.</p>
          </>
        )}

        {estado === 'pendiente' && (
          <Boton className="w-full" onClick={() => setPreguntando(true)}>
            Confirmar asistencia
          </Boton>
        )}

        {estado !== 'pendiente' && familia.entradaCompleta && (
          <p className="mt-2 text-sm text-tinta-suave">
            Ya registraron la entrada de todos los boletos en la puerta; la respuesta ya no se puede
            cambiar aquí.
          </p>
        )}

        {estado !== 'pendiente' && !familia.entradaCompleta && !familia.yaEntro && (
          <>
            <Boton variante="texto" className="mt-2" onClick={() => setPreguntando(true)}>
              Cambiar mi respuesta
            </Boton>
            {estado === 'confirmado' && (
              <p className="mt-2 text-xs text-tinta-suave">
                Si cambias a «No podré ir», este pase deja de servir.
              </p>
            )}
          </>
        )}
      </div>

      {preguntando && (
        <Dialogo
          totalBoletos={familia.boletosTotal}
          enviando={enviando}
          onCerrar={() => setPreguntando(false)}
          onResponder={responder}
        />
      )}
    </div>
  );
}

function Dialogo({
  totalBoletos,
  enviando,
  onCerrar,
  onResponder,
}: {
  totalBoletos: number;
  enviando: boolean;
  onCerrar: () => void;
  onResponder: (asistira: boolean, boletosConfirmados?: number) => void;
}) {
  const [paso, setPaso] = useState<'pregunta' | 'cantidad'>('pregunta');
  const [cantidad, setCantidad] = useState(totalBoletos);

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  function confirmarSi() {
    if (totalBoletos === 1) {
      void onResponder(true, 1);
      return;
    }
    setPaso('cantidad');
  }

  function enviarCantidad() {
    void onResponder(true, cantidad);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacion"
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/45 p-4 sm:items-center"
    >
      <div className="talon w-full max-w-sm px-6 pb-6 pt-9 text-center">
        {paso === 'pregunta' ? (
          <>
            <h2 id="titulo-confirmacion" className="font-display text-2xl text-tinta">
              ¿Asistirás?
            </h2>
            <p className="mt-2 text-sm text-tinta-suave">
              Tu respuesta nos ayuda a reservar el lugar exacto en el salón.
            </p>

            <div className="mt-6 flex gap-3">
              <Boton className="flex-1" disabled={enviando} onClick={confirmarSi}>
                Sí, ahí estaré
              </Boton>
              <Boton
                variante="contorno"
                className="flex-1"
                disabled={enviando}
                onClick={() => onResponder(false)}
              >
                No podré ir
              </Boton>
            </div>
          </>
        ) : (
          <>
            <h2 id="titulo-confirmacion" className="font-display text-2xl text-tinta">
              ¿Cuántos asisten?
            </h2>
            <p className="mt-2 text-sm text-tinta-suave">
              Tienen hasta {totalBoletos} boletos en esta invitación.
            </p>

            <label className="mt-6 block text-left text-sm text-tinta-suave" htmlFor="cantidad-boletos">
              Personas que confirman
            </label>
            <select
              id="cantidad-boletos"
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-tinta"
              value={cantidad}
              disabled={enviando}
              onChange={(e) => setCantidad(Number(e.target.value))}
            >
              {Array.from({ length: totalBoletos }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>

            <Boton className="mt-6 w-full" disabled={enviando} onClick={enviarCantidad}>
              Confirmar
            </Boton>
            <Boton
              variante="texto"
              className="mt-3 w-full"
              disabled={enviando}
              onClick={() => setPaso('pregunta')}
            >
              Volver
            </Boton>
          </>
        )}

        {paso === 'pregunta' && (
          <Boton variante="texto" className="mt-3 w-full" disabled={enviando} onClick={onCerrar}>
            Ahora no
          </Boton>
        )}
      </div>
    </div>
  );
}