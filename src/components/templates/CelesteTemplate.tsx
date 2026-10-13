import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/** Signature: a crescent and a field of stars — night sky, not a floral frame. */
export function CelesteTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} relative min-h-screen overflow-hidden px-5 py-12`}>
      <Estrellas />
      <article className="relative mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <Luna className="mx-auto h-28 w-28" />
          <p className="mt-5 font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
            Mis XV años
          </p>
          <h1 className="mt-4 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
            {evento.quinceanera}
          </h1>
          <PadresPadrinos padres={padres} padrinos={evento.padrinos} />
        </header>
        <CuerpoInvitacion token={token} invitacion={invitacion} sinConfirmacion={sinConfirmacion} />
      </article>
    </main>
  );
}

function Luna({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className={className}>
      <circle cx="40" cy="40" r="28" fill="var(--color-oro)" opacity="0.2" />
      <path
        d="M48 16a28 28 0 1 0 0 48 22 22 0 0 1 0-48Z"
        fill="var(--color-oro)"
        opacity="0.85"
      />
    </svg>
  );
}

function Estrellas() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="var(--color-oro)"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
    >
      <circle cx="20" cy="30" r="1.2" />
      <circle cx="80" cy="18" r="1" />
      <circle cx="160" cy="40" r="1.4" />
      <circle cx="40" cy="90" r="0.8" />
      <circle cx="180" cy="110" r="1.1" />
      <circle cx="24" cy="160" r="1" />
      <circle cx="140" cy="170" r="1.3" />
      <circle cx="100" cy="50" r="0.7" />
      <circle cx="56" cy="52" r="1.3" />
      <circle cx="130" cy="14" r="0.9" />
      <circle cx="188" cy="12" r="1.1" />
      <circle cx="12" cy="120" r="1.2" />
      <circle cx="70" cy="130" r="0.8" />
      <circle cx="120" cy="100" r="1" />
      <circle cx="170" cy="75" r="0.8" />
      <circle cx="90" cy="185" r="1.2" />
      <circle cx="190" cy="165" r="0.9" />
      <circle cx="50" cy="190" r="0.7" />
    </svg>
  );
}
