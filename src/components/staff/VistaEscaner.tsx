'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FichaEscaner, type Ficha } from '@/components/staff/FichaEscaner';
import { peekQrClaims } from '@/lib/qr/peek';
import { buscarFamiliaLocal, encolarEscaneo } from '@/lib/offline/queue';

const LECTOR_ID = 'lector-qr';

type RespuestaCheckin = {
  resultado: string;
  familia?: string;
  boletos?: number;
  checkedInAt?: string | null;
  mensaje: string;
};

export function VistaEscaner({ eventId }: { eventId: string }) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [falloCamara, setFalloCamara] = useState<string | null>(null);
  const procesando = useRef(false);
  const qrActual = useRef<string | null>(null);

  const cerrar = useCallback(() => {
    setFicha(null);
    setConfirmando(false);
    procesando.current = false;
    qrActual.current = null;
  }, []);

  const previsualizar = useCallback(
    async (qr: string) => {
      if (procesando.current) return;

      procesando.current = true;
      qrActual.current = qr;

      try {
        const respuesta = await fetch('/api/checkin/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr, eventId }),
        });

        const datos: RespuestaCheckin = await respuesta.json();

        if (!respuesta.ok) {
          setFicha({ tono: 'invalido', mensaje: (datos as { error?: string }).error ?? 'Intenta de nuevo.' });
          return;
        }

        if (datos.resultado === 'listo') {
          setFicha({ tono: 'listo', familia: datos.familia, boletos: datos.boletos, mensaje: 'Confirma para dejarla pasar.' });
        } else if (datos.resultado === 'duplicado') {
          setFicha({
            tono: 'duplicado',
            familia: datos.familia,
            boletos: datos.boletos,
            checkedInAt: datos.checkedInAt,
            mensaje: datos.mensaje,
          });
        } else {
          setFicha({
            tono: 'invalido',
            familia: datos.familia,
            mensaje: datos.resultado === 'jti_expirado' ? datos.mensaje : datos.mensaje,
          });
        }
      } catch {
        // No signal. Show the cached family so staff can still decide, and
        // queue the actual check-in for when the connection returns.
        const claims = peekQrClaims(qr);
        const familia = claims ? await buscarFamiliaLocal(claims.familyId) : undefined;

        setFicha({
          tono: 'pendiente',
          familia: familia?.nombre_familia ?? 'Familia',
          boletos: familia?.boletos_total,
          mensaje: 'Sin conexión. Se registrará cuando vuelva la señal.',
        });
      }
    },
    [eventId],
  );

  async function adelante() {
    const qr = qrActual.current;
    if (!qr || !ficha) return;

    if (ficha.tono === 'pendiente') {
      const claims = peekQrClaims(qr);
      const familia = claims ? await buscarFamiliaLocal(claims.familyId) : undefined;

      await encolarEscaneo({
        eventId,
        qr,
        familia: familia?.nombre_familia ?? ficha.familia ?? 'Familia',
        boletos: familia?.boletos_total ?? ficha.boletos ?? 0,
        registradoEn: new Date().toISOString(),
      });

      setFicha({ ...ficha, tono: 'exitoso', mensaje: 'Guardado. Se registrará al volver la señal.' });
      setTimeout(cerrar, 1800);
      return;
    }

    setConfirmando(true);

    try {
      const respuesta = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr, eventId }),
      });

      const datos: RespuestaCheckin = await respuesta.json();

      if (!respuesta.ok || datos.resultado !== 'exitoso') {
        setFicha({
          tono: datos.resultado === 'duplicado' ? 'duplicado' : 'invalido',
          familia: datos.familia ?? ficha.familia,
          boletos: datos.boletos ?? ficha.boletos,
          checkedInAt: datos.checkedInAt,
          mensaje: datos.mensaje ?? 'No se pudo registrar.',
        });
        setConfirmando(false);
        return;
      }

      setFicha({
        tono: 'exitoso',
        familia: datos.familia,
        boletos: datos.boletos,
        mensaje: 'Pueden pasar.',
      });
      setConfirmando(false);
      setTimeout(cerrar, 1800);
    } catch {
      setFicha({ ...ficha, tono: 'invalido', mensaje: 'Se perdió la conexión al confirmar. Intenta de nuevo.' });
      setConfirmando(false);
    }
  }

  useEffect(() => {
    let lector: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelado = false;

    async function iniciar() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const instancia = new Html5Qrcode(LECTOR_ID);

        if (cancelado) return;
        lector = instancia;

        await instancia.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (texto) => void previsualizar(texto),
          () => {},
        );
      } catch {
        setFalloCamara(
          'No pudimos abrir la cámara. Revisa los permisos o usa la búsqueda por nombre.',
        );
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
      lector?.stop().then(() => lector?.clear()).catch(() => {});
    };
  }, [previsualizar]);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro-claro">Escáner</p>
      <h1 className="mt-3 font-display text-2xl text-papel">Apunta al código del invitado</h1>

      <div
        id={LECTOR_ID}
        className="mt-6 overflow-hidden rounded-[2px] border border-papel/20 [&_video]:w-full"
      />

      {falloCamara && <p className="mt-4 text-sm text-oro-claro">{falloCamara}</p>}

      {ficha && (
        <FichaEscaner
          ficha={ficha}
          confirmando={confirmando}
          onAdelante={ficha.tono === 'listo' || ficha.tono === 'pendiente' ? adelante : null}
          onCerrar={cerrar}
        />
      )}
    </main>
  );
}
