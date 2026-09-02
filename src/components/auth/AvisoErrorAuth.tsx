'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { errorAuthDesdeUbicacion, puenteHaciaCallback } from '@/lib/auth/callback';

function ignorarCambios() {
  return () => {};
}

export function AvisoErrorAuth() {
  const visto = useRef<string | null | undefined>(undefined);

  const tipo = useSyncExternalStore(
    ignorarCambios,
    () => {
      if (visto.current !== undefined) return visto.current;
      if (puenteHaciaCallback(window.location.href)) {
        visto.current = null;
        return null;
      }
      visto.current = errorAuthDesdeUbicacion(window.location.search, window.location.hash);
      return visto.current;
    },
    () => null,
  );

  useEffect(() => {
    if (tipo && (window.location.search || window.location.hash)) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [tipo]);

  if (!tipo) return null;

  return (
    <div role="alert" className="talon mx-auto mb-8 max-w-md px-6 pb-6 pt-8 text-left">
      <p className="font-display text-xl text-tinta">Ese enlace ya no sirve</p>
      <p className="mt-2 text-sm text-tinta-suave">
        {tipo === 'otp_expired'
          ? 'Caducó o alguien lo abrió antes que tú (Gmail a veces lo hace al escanear el correo). Entra con correo y contraseña, o pide un código nuevo y escríbelo a mano: no pulses el enlace ni la página de Sign In.'
          : 'No pudimos completar el acceso. Entra con correo y contraseña, o pide un código nuevo e introdúcelo en el panel.'}
      </p>
      <Link
        href="/admin"
        className="mt-5 inline-flex min-h-11 cursor-pointer items-center text-sm text-vino underline underline-offset-4"
      >
        Ir al panel e entrar con contraseña
      </Link>
    </div>
  );
}
