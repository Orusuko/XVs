'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FormularioPin({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setEntrando(true);
    setError(null);

    const respuesta = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, pin }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      setEntrando(false);
      setError(datos.error ?? 'No pudimos validar tu PIN.');
      return;
    }

    router.push(`/staff/${eventId}/conteo`);
    router.refresh();
  }

  return (
    <form onSubmit={entrar}>
      <label htmlFor="pin" className="sr-only">
        PIN
      </label>
      <input
        id="pin"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        value={pin}
        onChange={(campo) => setPin(campo.target.value)}
        placeholder="••••"
        className="min-h-14 w-full rounded-[2px] border border-papel/25 bg-transparent px-4 text-center font-ticket text-3xl tracking-[0.5em] text-papel outline-none transition-colors duration-200 focus:border-oro-claro"
      />

      <button
        type="submit"
        disabled={entrando}
        className="mt-5 min-h-12 w-full cursor-pointer rounded-[2px] bg-oro-claro text-sm font-medium tracking-wide text-tinta transition-colors duration-200 hover:bg-oro disabled:cursor-not-allowed disabled:opacity-50"
      >
        {entrando ? 'Entrando…' : 'Entrar'}
      </button>

      {error && <p className="mt-3 text-center text-sm text-oro-claro">{error}</p>}
    </form>
  );
}
