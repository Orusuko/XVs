'use client';

import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import type { InvitationView } from '@/lib/types';

type Props = {
  invitacion: InvitationView;
};

/**
 * The renderer is a heavy dependency, so it is only pulled in when the guest
 * actually asks for a PDF. Generating in the browser also avoids a cold start.
 */
export function DescargarPdf({ invitacion }: Props) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setGenerando(true);
    setError(null);

    try {
      const [{ pdf }, { InvitationPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf/InvitationPdf'),
      ]);

      const blob = await pdf(<InvitationPdf invitacion={invitacion} />).toBlob();
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
        {generando ? 'Preparando el PDF…' : 'Guardar invitación en PDF'}
      </Boton>
      {error && <p className="mt-2 text-center text-sm text-alerta">{error}</p>}
    </div>
  );
}
