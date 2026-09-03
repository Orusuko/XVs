export type TemplateId = 'clasica' | 'jardin' | 'mariposas';

export type TemplateInfo = {
  id: TemplateId;
  nombre: string;
  descripcion: string;
  paleta: [string, string, string];
};

export const PLANTILLAS: TemplateInfo[] = [
  {
    id: 'clasica',
    nombre: 'Clásica',
    descripcion: 'Talón color vino y oro viejo, tipografía de invitación impresa.',
    paleta: ['#7b2d5e', '#a97722', '#f4ecf1'],
  },
  {
    id: 'jardin',
    nombre: 'Jardín',
    descripcion: 'Acuarela azul y rosa pálido, flores en las esquinas.',
    paleta: ['#5b7ca8', '#e7c6d0', '#eef3f8'],
  },
  {
    id: 'mariposas',
    nombre: 'Mariposas',
    descripcion: 'Lavanda con marco dorado y mariposas en vuelo.',
    paleta: ['#8a6bb0', '#e7b8d6', '#f4eefa'],
  },
];

const IDS = new Set<string>(PLANTILLAS.map((p) => p.id));

export function esTemplateId(valor: string | null | undefined): valor is TemplateId {
  return typeof valor === 'string' && IDS.has(valor);
}

export const TEMPLATE_POR_DEFECTO: TemplateId = 'clasica';

/** Where the chosen template lives: `events.template_config.plantilla`. No schema change needed. */
export const CLAVE_TEMPLATE_CONFIG = 'plantilla';
