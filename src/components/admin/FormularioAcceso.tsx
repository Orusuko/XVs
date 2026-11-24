'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';
import { validarCorreo } from '@/lib/validacion-formularios';

const CAMPO =
  'mt-3 min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino';

const ETIQUETA = 'font-ticket text-[11px] uppercase tracking-[0.28em] text-oro';

export function FormularioAcceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function irAlPanel() {
    router.push('/admin');
    router.refresh();
  }

  async function enviar(accion: 'entrar' | 'crear') {
    const falloCorreo = validarCorreo(correo);
    if (falloCorreo) {
      setError(falloCorreo);
      return;
    }
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasena.length > 72) {
      setError('La contraseña no puede pasar de 72 caracteres.');
      return;
    }

    if (accion === 'entrar') setEnviando(true);
    else setCreando(true);
    setError(null);

    const respuesta = await fetch('/api/cuenta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, email: correo.trim(), password: contrasena }),
    });

    const datos = await respuesta.json().catch(() => null);
    setEnviando(false);
    setCreando(false);

    if (!respuesta.ok) {
      setError(datos?.error ?? 'No pudimos completar el acceso.');
      return;
    }

    irAlPanel();
  }

  function entrar(evento: FormEvent) {
    evento.preventDefault();
    void enviar('entrar');
  }

  return (
    <form onSubmit={entrar} noValidate className="talon px-6 pb-8 pt-9">
      <label htmlFor="correo" className={ETIQUETA}>
        Correo
      </label>
      <input
        id="correo"
        type="email"
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
        maxLength={72}
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
        onClick={() => void enviar('crear')}
      >
        {creando ? 'Creando cuenta…' : 'Crear cuenta'}
      </Boton>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
    </form>
  );
}
