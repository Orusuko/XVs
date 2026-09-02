'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatearHora } from '@/lib/format';
import { peekQrClaims } from '@/lib/qr/peek';
import { buscarFamiliaLocal, encolarEscaneo } from '@/lib/offline/queue';

type Veredicto = {
  tono: 'exitoso' | 'duplicado' | 'invalido' | 'pendiente';
  titulo: string;
  detalle: string;
  boletos?: number;
};

const LECTOR_ID = 'lector-qr';

export function VistaEscaner({ eventId }: { eventId: string }) {
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const [falloCamara, setFalloCamara] = useState<string | null>(null);
  const procesando = useRef(false);
  const ultimoCodigo = useRef<string | null>(null);

  const registrar = useCallback(
    async (qr: string) => {
      if (procesando.current || qr === ultimoCodigo.current) return;

      procesando.current = true;
      ultimoCodigo.current = qr;

      try {
        const respuesta = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr, eventId }),
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          setVeredicto({
            tono: 'invalido',
            titulo: 'No se pudo registrar',
            detalle: datos.error ?? 'Intenta de nuevo.',
          });
          return;
        }

        setVeredicto(traducir(datos));
      } catch {
        // No signal. Queue it and tell staff exactly what that means.
        const claims = peekQrClaims(qr);
        const familia = claims ? await buscarFamiliaLocal(claims.familyId) : undefined;

        await encolarEscaneo({
          eventId,
          qr,
          familia: familia?.nombre_familia ?? 'Familia',
          boletos: familia?.boletos_total ?? 0,
          registradoEn: new Date().toISOString(),
        });

        setVeredicto({
          tono: 'pendiente',
          titulo: familia?.nombre_familia ?? 'Escaneo guardado',
          detalle: 'Sin conexión. Se registrará solo cuando vuelva la señal.',
          boletos: familia?.boletos_total,
        });
      } finally {
        setTimeout(() => {
          procesando.current = false;
          ultimoCodigo.current = null;
        }, 2500);
      }
    },
    [eventId],
  );

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
          (texto) => void registrar(texto),
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
  }, [registrar]);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro-claro">Escáner</p>
      <h1 className="mt-3 font-display text-2xl text-papel">Apunta al código del invitado</h1>

      <div
        id={LECTOR_ID}
        className="mt-6 overflow-hidden rounded-[2px] border border-papel/20 [&_video]:w-full"
      />

      {falloCamara && <p className="mt-4 text-sm text-oro-claro">{falloCamara}</p>}

      {veredicto && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-6 border-l-4 px-5 py-5 ${ESTILO_TONO[veredicto.tono]}`}
        >
          <p className="font-display text-2xl">{veredicto.titulo}</p>
          {veredicto.boletos !== undefined && veredicto.boletos > 0 && (
            <p className="mt-1 font-ticket text-3xl">
              {veredicto.boletos} {veredicto.boletos === 1 ? 'boleto' : 'boletos'}
            </p>
          )}
          <p className="mt-2 text-sm opacity-85">{veredicto.detalle}</p>
        </div>
      )}
    </main>
  );
}

const ESTILO_TONO: Record<Veredicto['tono'], string> = {
  exitoso: 'border-l-[#8fd6a8] bg-[#8fd6a8]/12 text-papel',
  duplicado: 'border-l-oro-claro bg-oro-claro/12 text-papel',
  invalido: 'border-l-[#e88b84] bg-[#e88b84]/12 text-papel',
  pendiente: 'border-l-papel/50 bg-papel/8 text-papel',
};

function traducir(datos: {
  resultado: string;
  familia?: string;
  boletos?: number;
  checkedInAt?: string | null;
  mensaje: string;
}): Veredicto {
  if (datos.resultado === 'exitoso') {
    return {
      tono: 'exitoso',
      titulo: datos.familia ?? 'Acceso registrado',
      detalle: 'Pueden pasar.',
      boletos: datos.boletos,
    };
  }

  if (datos.resultado === 'duplicado') {
    return {
      tono: 'duplicado',
      titulo: datos.familia ?? 'Boleto repetido',
      detalle: datos.checkedInAt
        ? `Este boleto ya fue registrado a las ${formatearHora(datos.checkedInAt)}.`
        : datos.mensaje,
      boletos: datos.boletos,
    };
  }

  return {
    tono: 'invalido',
    titulo: datos.resultado === 'jti_expirado' ? 'Código vencido' : 'Código no válido',
    detalle: datos.mensaje,
  };
}
