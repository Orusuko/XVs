import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="textura-papel flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        Página no encontrada
      </p>
      <h1 className="mt-4 font-display text-3xl text-tinta">Este enlace ya no existe</h1>
      <p className="mt-3 max-w-sm text-tinta-suave">
        Puede que la invitación se haya reemplazado. Pide el enlace nuevo a quien te invitó.
      </p>
      <Link
        href="/"
        className="mt-6 min-h-11 cursor-pointer text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
