'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Boton } from '@/components/ui/Boton';
import { TIPOS_OTP_CORREO, tokenAccesoListo } from '@/lib/auth/callback';

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
        // Must be listed under Authentication > URL Configuration > Redirect URLs.
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
    const token = codigo.trim();
    if (!tokenAccesoListo(token)) {
      setError('El código es demasiado corto. Copia el del correo (6 caracteres o más).');
      return;
    }

    setVerificando(true);
    setError(null);

    const cliente = supabaseBrowser();
    let fallo: { message: string } | null = null;

    for (const type of TIPOS_OTP_CORREO) {
      const resultado = await cliente.auth.verifyOtp({
        email: correo,
        token,
        type,
      });
      if (!resultado.error) {
        router.push('/admin');
        router.refresh();
        return;
      }
      fallo = resultado.error;
    }

    setVerificando(false);
    setError(
      fallo ? 'Ese código no es válido o ya caducó. Pide otro y escríbelo aquí; no pulses Sign In.' : null,
    );
  }

  if (enviado) {
    return (
      <form onSubmit={verificarCodigo} className="talon px-6 pb-8 pt-9">
        <p className="font-display text-xl text-tinta">Revisa tu correo</p>
        <p className="mt-2 text-sm text-tinta-suave">
          Te enviamos un código a {correo}. Cópialo y pégalo aquí — es la forma más segura de
          entrar.
        </p>
        <p className="mt-3 text-sm text-tinta-suave">
          Si el correo trae un enlace, ábrelo en <strong className="font-medium text-tinta">este
          mismo equipo</strong> y debe llevarte a <span className="font-ticket text-[11px]">/auth/callback</span>.
          Si te manda a una página de Supabase que dice «Sign In», no la pulses: copia el código
          del correo o pide uno nuevo. Gmail a veces abre el enlace antes que tú y lo caduca.
        </p>

        <label htmlFor="codigo" className="mt-6 block font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Código del correo
        </label>
        <input
          id="codigo"
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          minLength={6}
          value={codigo}
          onChange={(campo) => setCodigo(campo.target.value)}
          placeholder="000000"
          className="mt-3 min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 text-center font-ticket text-2xl tracking-[0.2em] text-tinta outline-none transition-colors duration-200 focus:border-vino"
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
