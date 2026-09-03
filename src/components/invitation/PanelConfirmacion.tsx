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
  const [qr, setQr] = useState<string | null>(null);
  const [reciénConfirmado, setReciénConfirmado] = useState(false);
  const [preguntando, setPreguntando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A family that already said yes gets their existing pass back, without
  // rotating the nonce, so an earlier download keeps working.
  useEffect(() => {
    if (familia.estado !== 'confirmado') return;

    fetch(`/api/invitacion/${token}/qr`)
      .then((res) => (res.ok ? res.json() : null))
      .then((datos) => datos?.qr && setQr(datos.qr))
      .catch(() => setError('No pudimos cargar tu pase. Revisa tu conexión.'));
  }, [familia.estado, token]);

  async function responder(asistira: boolean) {
    setEnviando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistira }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error ?? 'No pudimos guardar tu respuesta.');
        return;
      }

      setEstado(datos.estado);
      setPreguntando(false);

      if (datos.estado === 'confirmado') {
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
            boletos={familia.boletos}
            descargarAlAparecer={reciénConfirmado}
          />
        ) : (
          <p className="mt-10 text-center text-tinta-suave">Preparando tu pase…</p>
        ))}

      {/* The PDF always reflects the same pass: no QR until estado is confirmado. */}
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

        {estado !== 'pendiente' && (
          <>
            <Boton variante="texto" className="mt-2" onClick={() => setPreguntando(true)}>
              Cambiar mi respuesta
            </Boton>
            {estado === 'confirmado' && (
              <p className="mt-2 text-xs text-tinta-suave">
                Si confirmas otra vez se genera un pase nuevo y el anterior deja de servir.
              </p>
            )}
          </>
        )}
      </div>

      {preguntando && (
        <Dialogo
          enviando={enviando}
          onCerrar={() => setPreguntando(false)}
          onResponder={responder}
        />
      )}
    </div>
  );
}

function Dialogo({
  enviando,
  onCerrar,
  onResponder,
}: {
  enviando: boolean;
  onCerrar: () => void;
  onResponder: (asistira: boolean) => void;
}) {
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacion"
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/45 p-4 sm:items-center"
    >
      <div className="talon w-full max-w-sm px-6 pb-6 pt-9 text-center">
        <h2 id="titulo-confirmacion" className="font-display text-2xl text-tinta">
          ¿Asistirás?
        </h2>
        <p className="mt-2 text-sm text-tinta-suave">
          Tu respuesta nos ayuda a reservar el lugar exacto en el salón.
        </p>

        <div className="mt-6 flex gap-3">
          <Boton className="flex-1" disabled={enviando} onClick={() => onResponder(true)}>
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

        <Boton variante="texto" className="mt-3 w-full" disabled={enviando} onClick={onCerrar}>
          Ahora no
        </Boton>
      </div>
    </div>
  );
}
