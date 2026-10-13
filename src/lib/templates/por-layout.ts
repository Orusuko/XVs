import { BohoTemplate } from '@/components/templates/BohoTemplate';
import { CelesteTemplate } from '@/components/templates/CelesteTemplate';
import { CharraTemplate } from '@/components/templates/CharraTemplate';
import { ClasicaTemplate } from '@/components/templates/ClasicaTemplate';
import { CoronaTemplate } from '@/components/templates/CoronaTemplate';
import { DecoTemplate } from '@/components/templates/DecoTemplate';
import { EditorialTemplate } from '@/components/templates/EditorialTemplate';
import { ItinerarioTemplate } from '@/components/templates/ItinerarioTemplate';
import { JardinTemplate } from '@/components/templates/JardinTemplate';
import { MariposasTemplate } from '@/components/templates/MariposasTemplate';
import { PicadoTemplate } from '@/components/templates/PicadoTemplate';
import { RetratoTemplate } from '@/components/templates/RetratoTemplate';
import { ValsTemplate } from '@/components/templates/ValsTemplate';
import { VitelaTemplate } from '@/components/templates/VitelaTemplate';
import type { LayoutId } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

export type PlantillaProps = { token: string; invitacion: InvitationView; sinConfirmacion?: boolean };

export const POR_LAYOUT: Record<LayoutId, (props: PlantillaProps) => React.JSX.Element> = {
  clasica: ClasicaTemplate,
  jardin: JardinTemplate,
  mariposas: MariposasTemplate,
  vals: ValsTemplate,
  deco: DecoTemplate,
  boho: BohoTemplate,
  picado: PicadoTemplate,
  corona: CoronaTemplate,
  charra: CharraTemplate,
  retrato: RetratoTemplate,
  celeste: CelesteTemplate,
  editorial: EditorialTemplate,
  vitela: VitelaTemplate,
  itinerario: ItinerarioTemplate,
};
