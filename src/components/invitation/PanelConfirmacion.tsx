'use client';

import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { TalonQr } from '@/components/invitation/TalonQr';
import type { EstadoConfirmacion } from '@/lib/types';

type Props = {
  token: string;
  familia: string;
  boletos: number;
  estadoInicial: EstadoConfirmacion;
};

export function PanelConfirmacion({ token, familia, boletos, estadoInicial }: Props) {
  const [estado, setEstado] = useState<EstadoConfirmacion>(estadoInicial);
  const [qr, setQr] = useState<string | null>(null);
  const [reciénConfirmado, setReciénConfirmado] = useState(false);
  const [preguntando, setPreguntando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A family that already said yes gets their existing pass back, without
  // rotating the nonce, so an earlier download keeps working.
  useEffect(() => {
    if (estadoInicial !== 'confirmado') return;

    fetch(`/api/invitacion/${token}/qr`)
      .then((res) => (res.ok ? res.json() : null))
      .then((datos) => datos?.qr && setQr(datos.qr))
      .catch(() => setError('No pudimos cargar tu pase. Revisa tu conexión.'));
  }, [estadoInicial, token]);

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

  if (estado === 'rechazado') {
    return (
      <div className="mt-10 border-t border-borde pt-8 text-center">
        <p className="font-display text-xl text-tinta">Gracias por avisarnos</p>
        <p className="mt-2 text-tinta-suave">Te vamos a extrañar esa noche.</p>
        <Boton variante="texto" className="mt-4" onClick={() => setPreguntando(true)}>
          Cambiar mi respuesta
        </Boton>
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

  if (estado === 'confirmado') {
    return (
      <div className="mt-2">
        {qr ? (
          <TalonQr
            qr={qr}
            familia={familia}
            boletos={boletos}
            descargarAlAparecer={reciénConfirmado}
          />
        ) : (
          <p className="mt-10 text-center text-tinta-suave">Preparando tu pase…</p>
        )}

        {error && <p className="mt-4 text-center text-sm text-alerta">{error}</p>}

        <div className="mt-6 text-center">
          <Boton variante="texto" onClick={() => setPreguntando(true)}>
            Cambiar mi respuesta
          </Boton>
          <p className="mt-2 text-xs text-tinta-suave">
            Si confirmas otra vez se genera un pase nuevo y el anterior deja de servir.
          </p>
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

  return (
    <div className="mt-10 border-t border-borde pt-8">
      <Boton className="w-full" onClick={() => setPreguntando(true)}>
        Confirmar asistencia
      </Boton>

      {error && <p className="mt-3 text-center text-sm text-alerta">{error}</p>}

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
