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
 * The signature element: the QR sits on a torn-off stub, because the spec
 * treats one QR as one family's whole book of tickets.
 */
export function TalonQr({ qr, familia, boletos, descargarAlAparecer = false }: Props) {
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
    <div className="talon mt-10 px-6 pb-8 pt-9 text-center">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        Pase de entrada
      </p>

      <p className="mt-3 font-display text-xl text-tinta">Familia {familia}</p>

      <div className="perforado mt-6 pt-6">
        {imagen ? (
          // Data URL generated in the browser; there is nothing for the image optimizer to fetch.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            alt={`Código QR de acceso de la familia ${familia}`}
            className="mx-auto h-56 w-56"
          />
        ) : (
          <div className="mx-auto h-56 w-56 animate-pulse bg-papel" aria-hidden="true" />
        )}

        <p className="mt-5 font-ticket text-3xl font-bold text-vino">
          {String(boletos).padStart(2, '0')}
        </p>
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-tinta-suave">
          {boletos === 1 ? 'boleto' : 'boletos'}
        </p>
      </div>

      <p className="mt-6 text-sm text-tinta-suave">
        Muestra este código en la entrada. Se descargó a tu teléfono automáticamente.
      </p>

      <Boton
        variante="contorno"
        className="mt-4 w-full"
        disabled={!imagen}
        onClick={() => imagen && descargar(imagen, familia)}
      >
        Descargar de nuevo
      </Boton>
    </div>
  );
}

function descargar(dataUrl: string, familia: string) {
  const enlace = document.createElement('a');
  enlace.href = dataUrl;
  enlace.download = `pase-familia-${familia.toLowerCase().replace(/\s+/g, '-')}.png`;
  enlace.click();
}
