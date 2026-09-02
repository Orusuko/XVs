'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Boton } from '@/components/ui/Boton';

export function FormularioAcceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarEnlace(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const { error: fallo } = await supabaseBrowser().auth.signInWithOtp({
      email: correo,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    setEnviando(false);

    if (fallo) {
      setError(fallo.message);
      return;
    }

    setEnviado(true);
  }

  async function verificarCodigo(evento: React.FormEvent) {
    evento.preventDefault();
    setVerificando(true);
    setError(null);

    const { error: fallo } = await supabaseBrowser().auth.verifyOtp({
      email: correo,
      token: codigo.trim(),
      type: 'email',
    });

    setVerificando(false);

    if (fallo) {
      setError('Ese código no es válido o ya caducó. Pide otro enlace.');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  if (enviado) {
    return (
      <form onSubmit={verificarCodigo} className="talon px-6 pb-8 pt-9">
        <p className="font-display text-xl text-tinta">Revisa tu correo</p>
        <p className="mt-2 text-sm text-tinta-suave">
          Te enviamos un código a {correo}. Léelo en el celular si quieres, pero
          escríbelo aquí — el enlace del correo no funciona en otro dispositivo.
        </p>

        <label htmlFor="codigo" className="mt-6 block font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Código de 6 dígitos
        </label>
        <input
          id="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={codigo}
          onChange={(campo) => setCodigo(campo.target.value)}
          placeholder="000000"
          className="mt-3 min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 text-center font-ticket text-2xl tracking-[0.4em] text-tinta outline-none transition-colors duration-200 focus:border-vino"
        />

        <Boton type="submit" className="mt-5 w-full" disabled={verificando}>
          {verificando ? 'Entrando…' : 'Entrar con el código'}
        </Boton>

        {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

        <button
          type="button"
          onClick={() => {
            setEnviado(false);
            setCodigo('');
            setError(null);
          }}
          className="mt-4 min-h-11 w-full cursor-pointer text-sm text-tinta-suave underline underline-offset-4"
        >
          Usar otro correo
        </button>
      </form>
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
        {enviando ? 'Enviando…' : 'Enviarme el código de acceso'}
      </Boton>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
    </form>
  );
}
