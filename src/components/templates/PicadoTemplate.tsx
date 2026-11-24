import { BannerPicado } from '@/components/invitation/BannerPicado';
import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/**
 * Signature: a cut-paper banner (papel picado) above and below the name —
 * folk geometry, not garden sprigs.
 */
export function PicadoTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl break-words">
        <BannerPicado />
        <header className="surgir surgir-1 py-8 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
            Mis XV años
          </p>
          <h1 className="mt-4 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
            {evento.quinceanera}
          </h1>
          <PadresPadrinos padres={padres} padrinos={evento.padrinos} />
        </header>
        <BannerPicado invertido />
        <CuerpoInvitacion token={token} invitacion={invitacion} sinConfirmacion={sinConfirmacion} />
      </article>
    </main>
  );
}
