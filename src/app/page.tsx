import Link from 'next/link';

export default function Home() {
  return (
    <main className="textura-papel flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
        Invitaciones XV años
      </p>

      <h1 className="mt-5 max-w-lg font-display text-4xl leading-tight text-tinta">
        Una invitación para cada familia, un boleto para cada puerta
      </h1>

      <p className="mt-4 max-w-md text-tinta-suave">
        El organizador arma la lista, cada familia recibe su enlace, confirma y recibe su pase. En la
        entrada se escanea y el conteo se actualiza solo.
      </p>

      <Link
        href="/admin"
        className="mt-8 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[2px] border border-vino-hondo bg-vino px-6 text-sm font-medium text-papel-alto transition-colors duration-200 hover:bg-vino-hondo"
      >
        Entrar como organizador
      </Link>
    </main>
  );
}
