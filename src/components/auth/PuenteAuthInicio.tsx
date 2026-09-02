'use client';

import { useEffect } from 'react';
import { puenteHaciaCallback } from '@/lib/auth/callback';

/** Forwards codes / token hashes / errors that landed on the Site URL (`/`). */
export function PuenteAuthInicio() {
  useEffect(() => {
    const destino = puenteHaciaCallback(window.location.href);
    if (destino) {
      window.location.replace(destino);
    }
  }, []);

  return null;
}
