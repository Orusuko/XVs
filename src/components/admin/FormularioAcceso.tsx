'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Boton } from '@/components/ui/Boton';

export function FormularioAcceso() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarEnlace(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const { error: fallo } = await supabaseBrowser().auth.signInWithOtp({
      email: correo,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });

    setEnviando(false);

    if (fallo) {
      setError(fallo.message);
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="talon px-6 pb-8 pt-9 text-center">
        <p className="font-display text-xl text-tinta">Revisa tu correo</p>
        <p className="mt-2 text-sm text-tinta-suave">
          Te enviamos un enlace de acceso a {correo}. Ábrelo en este mismo dispositivo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviarEnlace} className="talon px-6 pb-8 pt-9">
      <label htmlFor="correo" className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        Correo del organizador
      </label>

      <input
        id="correo"
        type="email"
        required
        autoComplete="email"
        value={correo}
        onChange={(evento) => setCorreo(evento.target.value)}
        placeholder="tucorreo@ejemplo.com"
        className="mt-3 min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino"
      />

      <Boton type="submit" className="mt-5 w-full" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviarme el enlace de acceso'}
      </Boton>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
    </form>
  );
}
