'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Boton } from '@/components/ui/Boton';
import { TIPOS_OTP_CORREO, tokenAccesoListo } from '@/lib/auth/callback';
import { MENSAJE_SCRIPT } from '@/lib/auth/crear-organizador-cli';
import { MENSAJES_ACCESO, mensajeErrorAcceso } from '@/lib/auth/mensajes';

const CAMPO =
  'mt-3 min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino';

const ETIQUETA = 'font-ticket text-[11px] uppercase tracking-[0.28em] text-oro';

export function FormularioAcceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [codigo, setCodigo] = useState('');
  const [modo, setModo] = useState<'password' | 'codigo'>('password');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function irAlPanel() {
    router.push('/admin');
    router.refresh();
  }

  async function entrarConContrasena(evento: React.FormEvent) {
    evento.preventDefault();
    if (contrasena.length < 8) {
      setError(MENSAJES_ACCESO.debil);
      return;
    }

    setEnviando(true);
    setError(null);
    setAviso(null);

    const { error: fallo } = await supabaseBrowser().auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    });

    setEnviando(false);

    if (fallo) {
      setError(mensajeErrorAcceso(fallo));
      return;
    }

    irAlPanel();
  }

  async function crearCuenta() {
    if (!correo.trim()) {
      setError('Escribe el correo.');
      return;
    }
    if (contrasena.length < 8) {
      setError(MENSAJES_ACCESO.debil);
      return;
    }

    setCreando(true);
    setError(null);
    setAviso(null);

    const { data, error: fallo } = await supabaseBrowser().auth.signUp({
      email: correo.trim(),
      password: contrasena,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    setCreando(false);

    if (fallo) {
      setError(mensajeErrorAcceso(fallo));
      return;
    }

    if (data.session) {
      irAlPanel();
      return;
    }

    setAviso(MENSAJES_ACCESO.signupSinSesion);
  }

  async function enviarEnlace(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setAviso(null);

    const { error: fallo } = await supabaseBrowser().auth.signInWithOtp({
      email: correo.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    setEnviando(false);

    if (fallo) {
      setError(mensajeErrorAcceso(fallo));
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
    let fallo: { message: string; code?: string } | null = null;

    for (const type of TIPOS_OTP_CORREO) {
      const resultado = await cliente.auth.verifyOtp({
        email: correo.trim(),
        token,
        type,
      });
      if (!resultado.error) {
        irAlPanel();
        return;
      }
      fallo = resultado.error;
    }

    setVerificando(false);
    setError(fallo ? mensajeErrorAcceso(fallo) : null);
  }

  if (modo === 'codigo' && enviado) {
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

        <label htmlFor="codigo" className={`mt-6 block ${ETIQUETA}`}>
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
          className={`${CAMPO} text-center font-ticket text-2xl tracking-[0.2em]`}
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
        <button
          type="button"
          onClick={() => {
            setModo('password');
            setEnviado(false);
            setCodigo('');
            setError(null);
          }}
          className="min-h-11 w-full cursor-pointer text-xs text-tinta-suave underline underline-offset-4"
        >
          Volver a correo y contraseña
        </button>
      </form>
    );
  }

  if (modo === 'codigo') {
    return (
      <form onSubmit={enviarEnlace} className="talon px-6 pb-8 pt-9">
        <label htmlFor="correo" className={ETIQUETA}>
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
          className={CAMPO}
        />

        <Boton type="submit" className="mt-5 w-full" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviarme el código de acceso'}
        </Boton>

        {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

        <button
          type="button"
          onClick={() => {
            setModo('password');
            setError(null);
            setAviso(null);
          }}
          className="mt-4 min-h-11 w-full cursor-pointer text-xs text-tinta-suave underline underline-offset-4"
        >
          Volver a correo y contraseña
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={entrarConContrasena} className="talon px-6 pb-8 pt-9">
      <label htmlFor="correo" className={ETIQUETA}>
        Correo
      </label>
      <input
        id="correo"
        type="email"
        required
        autoComplete="email"
        value={correo}
        onChange={(evento) => setCorreo(evento.target.value)}
        placeholder="tucorreo@ejemplo.com"
        className={CAMPO}
      />

      <label htmlFor="contrasena" className={`mt-5 block ${ETIQUETA}`}>
        Contraseña
      </label>
      <input
        id="contrasena"
        type="password"
        required
        minLength={8}
        autoComplete="current-password"
        value={contrasena}
        onChange={(evento) => setContrasena(evento.target.value)}
        placeholder="Mínimo 8 caracteres"
        className={CAMPO}
      />

      <Boton type="submit" className="mt-5 w-full" disabled={enviando || creando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </Boton>
      <Boton
        type="button"
        variante="contorno"
        className="mt-3 w-full"
        disabled={enviando || creando}
        onClick={crearCuenta}
      >
        {creando ? 'Creando cuenta…' : 'Crear cuenta'}
      </Boton>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
      {aviso && <p className="mt-3 text-sm text-tinta-suave">{aviso}</p>}

      <p className="mt-3 text-sm text-tinta-suave">
        Si no tienes usuario o el correo está bloqueado, no esperes el email: en la raíz del repo
        corre <span className="font-ticket text-[11px]">{MENSAJE_SCRIPT}</span> y vuelve a pulsar
        Entrar.
      </p>

      <button
        type="button"
        onClick={() => {
          setModo('codigo');
          setError(null);
          setAviso(null);
        }}
        className="mt-5 min-h-11 w-full cursor-pointer text-xs text-tinta-suave underline underline-offset-4"
      >
        Usar código por correo
      </button>
    </form>
  );
}
