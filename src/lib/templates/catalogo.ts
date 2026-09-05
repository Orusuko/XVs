export type LayoutId = 'clasica' | 'jardin' | 'mariposas' | 'vals' | 'deco' | 'boho';

export type TemplateId =
  | 'clasica'
  | 'clasica-salvia'
  | 'clasica-medianoche'
  | 'jardin'
  | 'jardin-durazno'
  | 'jardin-menta'
  | 'mariposas'
  | 'mariposas-rosa-antiguo'
  | 'mariposas-esmeralda'
  | 'mariposas-oro-rosa'
  | 'vals-champan'
  | 'vals-borgona'
  | 'vals-perla'
  | 'vals-zafiro'
  | 'deco-negro-oro'
  | 'deco-jade'
  | 'deco-marfil-cobre'
  | 'boho-terracota'
  | 'boho-eucalipto'
  | 'boho-atardecer';

export type TemplateInfo = {
  id: TemplateId;
  layout: LayoutId;
  nombre: string;
  descripcion: string;
  paleta: [string, string, string];
};

export const PLANTILLAS: TemplateInfo[] = [
  {
    id: 'clasica',
    layout: 'clasica',
    nombre: 'Clásica',
    descripcion: 'Talón color vino y oro viejo, tipografía de invitación impresa.',
    paleta: ['#7b2d5e', '#a97722', '#f4ecf1'],
  },
  {
    id: 'clasica-salvia',
    layout: 'clasica',
    nombre: 'Clásica salvia',
    descripcion: 'Papel crema y verdes de jardín, oro apagado.',
    paleta: ['#3d5a42', '#9a8438', '#e8efe4'],
  },
  {
    id: 'clasica-medianoche',
    layout: 'clasica',
    nombre: 'Clásica medianoche',
    descripcion: 'Azul noche en el papel, plata e tinta.',
    paleta: ['#2c3e6b', '#8a94a6', '#e8edf4'],
  },
  {
    id: 'jardin',
    layout: 'jardin',
    nombre: 'Jardín',
    descripcion: 'Acuarela azul y rosa pálido, flores en las esquinas.',
    paleta: ['#5b7ca8', '#e7c6d0', '#eef3f8'],
  },
  {
    id: 'jardin-durazno',
    layout: 'jardin',
    nombre: 'Jardín durazno',
    descripcion: 'Durazno, arena tibia y rosa empolvado.',
    paleta: ['#8b4a40', '#d4a07a', '#f8ebe3'],
  },
  {
    id: 'jardin-menta',
    layout: 'jardin',
    nombre: 'Jardín menta',
    descripcion: 'Menta, verde agua y papel claro.',
    paleta: ['#2a6458', '#5a9084', '#e6f2ee'],
  },
  {
    id: 'mariposas',
    layout: 'mariposas',
    nombre: 'Mariposas',
    descripcion: 'Lavanda con marco dorado y mariposas en vuelo.',
    paleta: ['#8a6bb0', '#e7b8d6', '#f4eefa'],
  },
  {
    id: 'mariposas-rosa-antiguo',
    layout: 'mariposas',
    nombre: 'Mariposas rosa antiguo',
    descripcion: 'Rosa empolvado, topo y champán.',
    paleta: ['#8a5058', '#c4a878', '#f3e8e6'],
  },
  {
    id: 'mariposas-esmeralda',
    layout: 'mariposas',
    nombre: 'Mariposas esmeralda',
    descripcion: 'Esmeralda, oro suave y marfil.',
    paleta: ['#2d6b4f', '#c4a84a', '#e8f0ea'],
  },
  {
    id: 'mariposas-oro-rosa',
    layout: 'mariposas',
    nombre: 'Mariposas oro rosa',
    descripcion: 'Oro rosa, rubor y blanco cálido.',
    paleta: ['#8b4a44', '#c49070', '#f8eeea'],
  },
  {
    id: 'vals-champan',
    layout: 'vals',
    nombre: 'Vals champán',
    descripcion: 'Medallón centrado, champán e marfil.',
    paleta: ['#6b5428', '#b89858', '#f3ede4'],
  },
  {
    id: 'vals-borgona',
    layout: 'vals',
    nombre: 'Vals borgoña',
    descripcion: 'Salón de baile en borgoña y oro antiguo.',
    paleta: ['#7a1e32', '#b8943c', '#f3e8e6'],
  },
  {
    id: 'vals-perla',
    layout: 'vals',
    nombre: 'Vals perla',
    descripcion: 'Gris perla, blanco y oro pálido.',
    paleta: ['#4a5058', '#c4b888', '#eef0f2'],
  },
  {
    id: 'vals-zafiro',
    layout: 'vals',
    nombre: 'Vals zafiro',
    descripcion: 'Zafiro, plata y blanco frío.',
    paleta: ['#2a4a8a', '#8a9ab0', '#e8eef6'],
  },
  {
    id: 'deco-negro-oro',
    layout: 'deco',
    nombre: 'Deco negro y oro',
    descripcion: 'Marco geométrico, tinta e oro de gala.',
    paleta: ['#1a1612', '#c4a030', '#f2ede4'],
  },
  {
    id: 'deco-jade',
    layout: 'deco',
    nombre: 'Deco jade',
    descripcion: 'Jade, tinta verde y latón.',
    paleta: ['#2a5a48', '#b89440', '#e6eee8'],
  },
  {
    id: 'deco-marfil-cobre',
    layout: 'deco',
    nombre: 'Deco marfil y cobre',
    descripcion: 'Marfil, cobre y espresso.',
    paleta: ['#8a4a2e', '#c47848', '#f4ede4'],
  },
  {
    id: 'boho-terracota',
    layout: 'boho',
    nombre: 'Boho terracota',
    descripcion: 'Rama suelta, terracota, arena y olivo.',
    paleta: ['#8a4028', '#6a7048', '#ede4d4'],
  },
  {
    id: 'boho-eucalipto',
    layout: 'boho',
    nombre: 'Boho eucalipto',
    descripcion: 'Eucalipto, lino y barro.',
    paleta: ['#3e5a4c', '#b07858', '#e8ebe4'],
  },
  {
    id: 'boho-atardecer',
    layout: 'boho',
    nombre: 'Boho atardecer',
    descripcion: 'Coral de atardecer, ámbar y púrpura oscuro.',
    paleta: ['#a04038', '#d49840', '#f6e8e0'],
  },
];

const IDS = new Set<string>(PLANTILLAS.map((p) => p.id));
const LAYOUT_POR_ID = Object.fromEntries(PLANTILLAS.map((p) => [p.id, p.layout])) as Record<
  TemplateId,
  LayoutId
>;

export function esTemplateId(valor: string | null | undefined): valor is TemplateId {
  return typeof valor === 'string' && IDS.has(valor);
}

export function layoutDe(id: TemplateId): LayoutId {
  return LAYOUT_POR_ID[id];
}

export function claseTema(id: TemplateId): string {
  return id === 'clasica' ? '' : `tema-${id}`;
}

export const TEMPLATE_POR_DEFECTO: TemplateId = 'clasica';

/** Where the chosen template lives: `events.template_config.plantilla`. No schema change needed. */
export const CLAVE_TEMPLATE_CONFIG = 'plantilla';
