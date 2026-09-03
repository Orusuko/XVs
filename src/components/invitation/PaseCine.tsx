'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Boton } from '@/components/ui/Boton';

type Props = {
  qr: string;
  familia: string;
  boletos: number;
  descargarAlAparecer?: boolean;
};

/**
 * The signature element the whole design leans on: a cinema-style admission
 * ticket. One QR = one family's whole block of seats, so the stub shows the
 * ticket count large, like a screen number, not a person count.
 */
export function PaseCine({ qr, familia, boletos, descargarAlAparecer = false }: Props) {
  const [imagen, setImagen] = useState<string | null>(null);
  const yaDescargado = useRef(false);

  useEffect(() => {
    let vigente = true;

    QRCode.toDataURL(qr, {
      width: 720,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#2a1424', light: '#fbf6f9' },
    }).then((dataUrl) => {
      if (vigente) setImagen(dataUrl);
    });

    return () => {
      vigente = false;
    };
  }, [qr]);

  useEffect(() => {
    if (!imagen || !descargarAlAparecer || yaDescargado.current) return;

    yaDescargado.current = true;
    descargar(imagen, familia);
  }, [imagen, descargarAlAparecer, familia]);

  return (
    <div className="boleto-cine surgir mt-10">
      <div className="flex items-center justify-between px-6 pt-6">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Pase de entrada
        </p>
        <span className="codigo-decorativo h-4 w-16" aria-hidden="true" />
      </div>

      <p className="mt-2 px-6 font-display text-xl text-tinta">Familia {familia}</p>

      <div className="perforado-boleto mt-5 grid grid-cols-[1fr_auto] items-center gap-6 px-6 pb-6 pt-6">
        <div>
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-tinta-suave">
            Admite
          </p>
          <p className="mt-1 font-ticket text-5xl font-bold leading-none text-vino">
            {String(boletos).padStart(2, '0')}
          </p>
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-tinta-suave">
            {boletos === 1 ? 'boleto' : 'boletos'}
          </p>
          <p className="mt-4 text-sm text-tinta-suave">Muestra este código en la entrada.</p>
        </div>

        {imagen ? (
          // Data URL generated in the browser; there is nothing for the image optimizer to fetch.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            alt={`Código QR de acceso de la familia ${familia}`}
            className="h-32 w-32 rounded-[2px] border border-borde bg-papel-alto p-1 sm:h-40 sm:w-40"
          />
        ) : (
          <div
            className="h-32 w-32 animate-pulse rounded-[2px] bg-papel sm:h-40 sm:w-40"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="px-6 pb-6">
        <Boton
          variante="contorno"
          className="w-full"
          disabled={!imagen}
          onClick={() => imagen && descargar(imagen, familia)}
        >
          Descargar de nuevo
        </Boton>
      </div>
    </div>
  );
}

function descargar(dataUrl: string, familia: string) {
  const enlace = document.createElement('a');
  enlace.href = dataUrl;
  enlace.download = `pase-familia-${familia.toLowerCase().replace(/\s+/g, '-')}.png`;
  enlace.click();
}
