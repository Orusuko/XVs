'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function leerError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  const codigo = params.get('error_code') ?? hash.get('error_code');
  const descripcion = params.get('error_description') ?? hash.get('error_description');

  if (codigo === 'otp_expired' || descripcion?.includes('expired') || descripcion?.includes('invalid')) {
    return 'otp_expired';
  }

  if (codigo || params.get('error') || hash.get('error')) {
    return 'auth';
  }

  return null;
}

export function AvisoErrorAuth() {
  const [tipo, setTipo] = useState<string | null>(null);

  useEffect(() => {
    const encontrado = leerError();
    setTipo(encontrado);

    if (encontrado && (window.location.search || window.location.hash)) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!tipo) return null;

  return (
    <div role="alert" className="talon mx-auto mb-8 max-w-md px-6 pb-6 pt-8 text-left">
      <p className="font-display text-xl text-tinta">Ese enlace ya no sirve</p>
      <p className="mt-2 text-sm text-tinta-suave">
        {tipo === 'otp_expired'
          ? 'Caducó o alguien lo abrió antes que tú (Gmail a veces lo hace al escanear el correo). Pide un código nuevo y escríbelo a mano: no pulses el enlace.'
          : 'No pudimos completar el acceso. Pide un código nuevo e introdúcelo en el panel.'}
      </p>
      <Link
        href="/admin"
        className="mt-5 inline-flex min-h-11 cursor-pointer items-center text-sm text-vino underline underline-offset-4"
      >
        Ir al panel e introducir el código
      </Link>
    </div>
  );
}
