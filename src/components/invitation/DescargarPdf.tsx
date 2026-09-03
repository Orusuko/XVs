'use client';

import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import type { InvitationView } from '@/lib/types';

type Props = {
  invitacion: InvitationView;
  /** Only set once the family has confirmed. Its presence is what puts the pass in the PDF. */
  qr?: string;
};

/**
 * The renderer is a heavy dependency, so it is only pulled in when the guest
 * actually asks for a PDF. Generating in the browser also avoids a cold start.
 */
export function DescargarPdf({ invitacion, qr }: Props) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setGenerando(true);
    setError(null);

    try {
      const [{ pdf }, { InvitationPdf }, { registrarFuentes }, qrDataUrl] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf/InvitationPdf'),
        import('@/lib/pdf/fuentes'),
        qr ? renderQrDataUrl(qr) : Promise.resolve(undefined),
      ]);

      registrarFuentes();

      const blob = await pdf(<InvitationPdf invitacion={invitacion} qrDataUrl={qrDataUrl} />).toBlob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `invitacion-${invitacion.familia.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No pudimos generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <Boton variante="contorno" className="w-full" disabled={generando} onClick={generar}>
        {generando
          ? 'Preparando el PDF…'
          : qr
            ? 'Guardar invitación con mi pase (PDF)'
            : 'Guardar invitación en PDF'}
      </Boton>
      {error && <p className="mt-2 text-center text-sm text-alerta">{error}</p>}
    </div>
  );
}

async function renderQrDataUrl(qr: string): Promise<string> {
  const { default: QRCode } = await import('qrcode');
  return QRCode.toDataURL(qr, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#2a1424', light: '#fbf6f9' },
  });
}
