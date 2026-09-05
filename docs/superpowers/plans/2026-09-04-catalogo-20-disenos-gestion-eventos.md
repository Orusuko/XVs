# Catálogo 20 diseños + gestión de eventos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El organizador puede crear y eliminar eventos, y elige entre 20 diseños de invitación distintos.

**Architecture:** DELETE de eventos vía API + UI. Catálogo de 20 TemplateId: 6 layouts (3 existentes + Vals/Deco/Boho) × paletas curadas. Skins CSS por id. PDF espeja paleta y ornamento por layout.

**Tech Stack:** Next.js App Router, Tailwind v4, React, Supabase (RLS), Vitest, @react-pdf/renderer

**Spec:** Plan de producto en `.cursor/plans` / conversación: catálogo 20 + CRUD eventos.

## Global Constraints
- Copy en español, voz existente (EstadoHoja, Boton, sin jerga de sistema).
- No cambiar schema de `events`; `template_config.plantilla` sigue guardando el TemplateId.
- Ids `clasica`, `jardin`, `mariposas` no cambian (evento en producción).
- No exponer errores crudos de DB al cliente.
- TDD para lógica pura (helpers). UI sin tests E2E nuevos salvo que ya existan patrones.
- No emojis. Accesibilidad: botones ≥44px, focus visible, aria-pressed en selector.
- Esta sesión **no crea commits ni push**. Los checkboxes de commit de este plan se marcan omitidos.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/templates/catalogo.ts` | 20 `TemplateId`, `layout`, helpers `layoutDe` / `claseTema` / `esTemplateId` |
| `tests/catalogo.test.ts` | Helpers del catálogo (TDD) |
| `src/app/globals.css` | 17 skins `.tema-<id>` + marcos Vals/Deco (tokens de color) |
| `src/components/templates/ValsTemplate.tsx` | Layout vals: medallón + cinta |
| `src/components/templates/DecoTemplate.tsx` | Layout deco: marco geométrico + abanico |
| `src/components/templates/BohoTemplate.tsx` | Layout boho: rama orgánica asimétrica |
| `src/components/templates/ClasicaTemplate.tsx` | Aplica `claseTema(templateId)`; `clasica` sin clase |
| `src/components/templates/JardinTemplate.tsx` | Aplica `claseTema` (no solo `tema-jardin`) |
| `src/components/templates/MariposasTemplate.tsx` | Aplica `claseTema` (no solo `tema-mariposas`) |
| `src/components/admin/SelectorPlantilla.tsx` | Vista previa por layout; grid 20 tarjetas |
| `src/app/invitacion/[token]/page.tsx` | Mapa id → componente vía `layoutDe` |
| `src/lib/pdf/InvitationPdf.tsx` | 20 paletas + ornamentos/encabezados por layout |
| `src/app/api/events/route.ts` | `DELETE ?id=` |
| `src/components/admin/ListaEventos.tsx` | Lista + eliminar con confirm |
| `src/app/admin/page.tsx` | Enlace crear siempre visible + `ListaEventos` |
| `src/app/admin/evento/[eventId]/plantilla/page.tsx` | `max-w-6xl` para la grilla de 20 |

Sin cambios de código: `src/app/admin/evento/nuevo/page.tsx` (el alta ya funciona; solo se expone el enlace), `src/lib/types.ts` (ya importa `TemplateId` del catálogo), `src/lib/invitation.ts` (`esTemplateId` aceptará los 20).

Paletas (hex canónico; CSS, catálogo y PDF deben coincidir). `vino` es el acento de botón (`bg-vino` + `text-papel-alto`): debe ser lo bastante oscuro para contraste ≥ 4.5:1.

| id | papel | papel-alto | tinta | tinta-suave | vino | vino-hondo | oro | oro-claro | borde | swatches |
|---|---|---|---|---|---|---|---|---|---|---|
| clasica (tokens globales, sin clase) | #f4ecf1 | #fbf6f9 | #2a1424 | #6b4a60 | #7b2d5e | #55193f | #a97722 | #d9b25f | #dcc5d5 | #7b2d5e, #a97722, #f4ecf1 |
| clasica-salvia | #e8efe4 | #f4f8f1 | #243028 | #5a6b58 | #3d5a42 | #2a3f30 | #9a8438 | #c4b06a | #c5d0be | #3d5a42, #9a8438, #e8efe4 |
| clasica-medianoche | #e8edf4 | #f4f7fb | #1a2744 | #4a5a78 | #2c3e6b | #1e2a4a | #8a94a6 | #b8c0cc | #c4cad8 | #2c3e6b, #8a94a6, #e8edf4 |
| jardin | (existente) | | | | | | | | | #5b7ca8, #e7c6d0, #eef3f8 |
| jardin-durazno | #f8ebe3 | #fff6f1 | #4a2e28 | #8a5a52 | #8b4a40 | #6a342e | #d4a07a | #e8c4a8 | #e8d0c4 | #8b4a40, #d4a07a, #f8ebe3 |
| jardin-menta | #e6f2ee | #f4faf7 | #1e3d38 | #4a7a70 | #2a6458 | #1e4a42 | #5a9084 | #a8c9be | #c5ddd6 | #2a6458, #5a9084, #e6f2ee |
| mariposas | (existente) | | | | | | | | | #8a6bb0, #e7b8d6, #f4eefa |
| mariposas-rosa-antiguo | #f3e8e6 | #faf3f1 | #4a3336 | #8a6b6e | #8a5058 | #6a383e | #c4a878 | #d8c49a | #e0d0ce | #8a5058, #c4a878, #f3e8e6 |
| mariposas-esmeralda | #e8f0ea | #f4f8f5 | #1a3d2e | #4a7a62 | #2d6b4f | #1e4a38 | #c4a84a | #d8c46a | #c5d8cc | #2d6b4f, #c4a84a, #e8f0ea |
| mariposas-oro-rosa | #f8eeea | #fff6f3 | #4a2e2a | #8a5a54 | #8b4a44 | #6a3430 | #c49070 | #d8b0a0 | #e8d4cc | #8b4a44, #c49070, #f8eeea |
| vals-champan | #f3ede4 | #fbf7f0 | #3a2e22 | #7a6a54 | #6b5428 | #4a3a1a | #b89858 | #d4bc80 | #ddd4c4 | #6b5428, #b89858, #f3ede4 |
| vals-borgona | #f3e8e6 | #fbf4f2 | #3a181c | #7a4a50 | #7a1e32 | #541418 | #b8943c | #d0b060 | #e0c8c4 | #7a1e32, #b8943c, #f3e8e6 |
| vals-perla | #eef0f2 | #f8f9fa | #3a3e44 | #6a7078 | #4a5058 | #32363c | #c4b888 | #d8d0a8 | #d4d6d8 | #4a5058, #c4b888, #eef0f2 |
| vals-zafiro | #e8eef6 | #f4f7fc | #1a2a4a | #4a5a80 | #2a4a8a | #1a3268 | #8a9ab0 | #b0bcc8 | #c8d4e4 | #2a4a8a, #8a9ab0, #e8eef6 |
| deco-negro-oro | #f2ede4 | #faf7f0 | #1a1612 | #5a5048 | #1a1612 | #0d0b09 | #c4a030 | #d8bc50 | #d4c8b0 | #1a1612, #c4a030, #f2ede4 |
| deco-jade | #e6eee8 | #f2f7f4 | #14241c | #4a6a58 | #2a5a48 | #1a3a30 | #b89440 | #d0b060 | #c0d4c8 | #2a5a48, #b89440, #e6eee8 |
| deco-marfil-cobre | #f4ede4 | #fbf6f0 | #2a1a12 | #6a4a38 | #8a4a2e | #6a3420 | #c47848 | #d89868 | #e0d0c0 | #8a4a2e, #c47848, #f4ede4 |
| boho-terracota | #ede4d4 | #f6f0e4 | #3a2a1a | #6a5840 | #8a4028 | #6a2e1c | #6a7048 | #8a9060 | #d8c8b0 | #8a4028, #6a7048, #ede4d4 |
| boho-eucalipto | #e8ebe4 | #f4f5f0 | #2a3228 | #5a6858 | #3e5a4c | #2a4036 | #b07858 | #c89878 | #c8d0c4 | #3e5a4c, #b07858, #e8ebe4 |
| boho-atardecer | #f6e8e0 | #fbf2ec | #3a2038 | #7a4a58 | #a04038 | #7a2e2a | #d49840 | #e8b860 | #e8d0c4 | #a04038, #d49840, #f6e8e0 |

`jardin` y `mariposas` conservan los tokens actuales de `globals.css` / PDF. Swatches de catálogo de esos dos ids no cambian.

---

### Task 1: Helpers del catálogo (TDD)

**Files:**
- Create: `tests/catalogo.test.ts`
- Modify: `src/lib/templates/catalogo.ts`

**Interfaces:**
- Consumes: nada
- Produces: `TemplateId` (unión de 20 strings), `LayoutId`, `TemplateInfo.layout`, `PLANTILLAS` (20), `TEMPLATE_POR_DEFECTO = 'clasica'`, `esTemplateId`, `layoutDe(id: TemplateId): LayoutId`, `claseTema(id: TemplateId): string`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import {
  PLANTILLAS,
  claseTema,
  esTemplateId,
  layoutDe,
  type TemplateId,
} from '@/lib/templates/catalogo';

const IDS_ESPERADOS: TemplateId[] = [
  'clasica',
  'clasica-salvia',
  'clasica-medianoche',
  'jardin',
  'jardin-durazno',
  'jardin-menta',
  'mariposas',
  'mariposas-rosa-antiguo',
  'mariposas-esmeralda',
  'mariposas-oro-rosa',
  'vals-champan',
  'vals-borgona',
  'vals-perla',
  'vals-zafiro',
  'deco-negro-oro',
  'deco-jade',
  'deco-marfil-cobre',
  'boho-terracota',
  'boho-eucalipto',
  'boho-atardecer',
];

describe('catálogo de plantillas', () => {
  test('tiene exactamente 20 diseños con ids únicos', () => {
    expect(PLANTILLAS).toHaveLength(20);
    const ids = PLANTILLAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids.sort()).toEqual([...IDS_ESPERADOS].sort());
  });

  test('esTemplateId acepta los 20 y rechaza basura', () => {
    for (const id of IDS_ESPERADOS) {
      expect(esTemplateId(id)).toBe(true);
    }
    expect(esTemplateId('no-existe')).toBe(false);
    expect(esTemplateId('')).toBe(false);
    expect(esTemplateId(null)).toBe(false);
    expect(esTemplateId(undefined)).toBe(false);
    expect(esTemplateId('CLASICA')).toBe(false);
  });

  test('layoutDe mapea variantes al layout de familia', () => {
    expect(layoutDe('clasica')).toBe('clasica');
    expect(layoutDe('clasica-salvia')).toBe('clasica');
    expect(layoutDe('clasica-medianoche')).toBe('clasica');
    expect(layoutDe('jardin')).toBe('jardin');
    expect(layoutDe('jardin-durazno')).toBe('jardin');
    expect(layoutDe('jardin-menta')).toBe('jardin');
    expect(layoutDe('mariposas')).toBe('mariposas');
    expect(layoutDe('mariposas-rosa-antiguo')).toBe('mariposas');
    expect(layoutDe('mariposas-esmeralda')).toBe('mariposas');
    expect(layoutDe('mariposas-oro-rosa')).toBe('mariposas');
    expect(layoutDe('vals-champan')).toBe('vals');
    expect(layoutDe('vals-borgona')).toBe('vals');
    expect(layoutDe('vals-perla')).toBe('vals');
    expect(layoutDe('vals-zafiro')).toBe('vals');
    expect(layoutDe('deco-negro-oro')).toBe('deco');
    expect(layoutDe('deco-jade')).toBe('deco');
    expect(layoutDe('deco-marfil-cobre')).toBe('deco');
    expect(layoutDe('boho-terracota')).toBe('boho');
    expect(layoutDe('boho-eucalipto')).toBe('boho');
    expect(layoutDe('boho-atardecer')).toBe('boho');
  });

  test('claseTema: clasica sin clase; el resto tema-<id>', () => {
    expect(claseTema('clasica')).toBe('');
    expect(claseTema('clasica-salvia')).toBe('tema-clasica-salvia');
    expect(claseTema('jardin')).toBe('tema-jardin');
    expect(claseTema('jardin-menta')).toBe('tema-jardin-menta');
    expect(claseTema('vals-zafiro')).toBe('tema-vals-zafiro');
  });
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `npx vitest run tests/catalogo.test.ts`
Expected: FAIL — `layoutDe` / `claseTema` no existen; `PLANTILLAS` tiene 3 ids.

- [ ] **Step 3: Implementar el catálogo**

Reemplazar `src/lib/templates/catalogo.ts` por:

```ts
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
```

- [ ] **Step 4: Correr el test y ver que pasa**

Run: `npx vitest run tests/catalogo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit** — omitido (sesión sin commits)

---

### Task 2: Skins CSS

**Files:**
- Modify: `src/app/globals.css` (después de `.tema-mariposas`, antes de `.marco-mariposas`)

**Interfaces:**
- Consumes: ids de Task 1
- Produces: `.tema-<id>` para los 17 ids nuevos + `.tema-jardin` / `.tema-mariposas` sin tocar. Clases de marco `.marco-vals` y `.marco-deco` para los layouts nuevos.

- [ ] **Step 1: Añadir las 17 clases de tema y dos marcos**

Insertar después del bloque `.tema-mariposas` existente (no modificar `.tema-jardin` ni `.tema-mariposas`):

```css
.tema-clasica-salvia {
  --color-papel: #e8efe4;
  --color-papel-alto: #f4f8f1;
  --color-tinta: #243028;
  --color-tinta-suave: #5a6b58;
  --color-vino: #3d5a42;
  --color-vino-hondo: #2a3f30;
  --color-oro: #9a8438;
  --color-oro-claro: #c4b06a;
  --color-borde: #c5d0be;
}

.tema-clasica-medianoche {
  --color-papel: #e8edf4;
  --color-papel-alto: #f4f7fb;
  --color-tinta: #1a2744;
  --color-tinta-suave: #4a5a78;
  --color-vino: #2c3e6b;
  --color-vino-hondo: #1e2a4a;
  --color-oro: #8a94a6;
  --color-oro-claro: #b8c0cc;
  --color-borde: #c4cad8;
}

.tema-jardin-durazno {
  --color-papel: #f8ebe3;
  --color-papel-alto: #fff6f1;
  --color-tinta: #4a2e28;
  --color-tinta-suave: #8a5a52;
  --color-vino: #8b4a40;
  --color-vino-hondo: #6a342e;
  --color-oro: #d4a07a;
  --color-oro-claro: #e8c4a8;
  --color-borde: #e8d0c4;
}

.tema-jardin-menta {
  --color-papel: #e6f2ee;
  --color-papel-alto: #f4faf7;
  --color-tinta: #1e3d38;
  --color-tinta-suave: #4a7a70;
  --color-vino: #2a6458;
  --color-vino-hondo: #1e4a42;
  --color-oro: #5a9084;
  --color-oro-claro: #a8c9be;
  --color-borde: #c5ddd6;
}

.tema-mariposas-rosa-antiguo {
  --color-papel: #f3e8e6;
  --color-papel-alto: #faf3f1;
  --color-tinta: #4a3336;
  --color-tinta-suave: #8a6b6e;
  --color-vino: #8a5058;
  --color-vino-hondo: #6a383e;
  --color-oro: #c4a878;
  --color-oro-claro: #d8c49a;
  --color-borde: #e0d0ce;
}

.tema-mariposas-esmeralda {
  --color-papel: #e8f0ea;
  --color-papel-alto: #f4f8f5;
  --color-tinta: #1a3d2e;
  --color-tinta-suave: #4a7a62;
  --color-vino: #2d6b4f;
  --color-vino-hondo: #1e4a38;
  --color-oro: #c4a84a;
  --color-oro-claro: #d8c46a;
  --color-borde: #c5d8cc;
}

.tema-mariposas-oro-rosa {
  --color-papel: #f8eeea;
  --color-papel-alto: #fff6f3;
  --color-tinta: #4a2e2a;
  --color-tinta-suave: #8a5a54;
  --color-vino: #8b4a44;
  --color-vino-hondo: #6a3430;
  --color-oro: #c49070;
  --color-oro-claro: #d8b0a0;
  --color-borde: #e8d4cc;
}

.tema-vals-champan {
  --color-papel: #f3ede4;
  --color-papel-alto: #fbf7f0;
  --color-tinta: #3a2e22;
  --color-tinta-suave: #7a6a54;
  --color-vino: #6b5428;
  --color-vino-hondo: #4a3a1a;
  --color-oro: #b89858;
  --color-oro-claro: #d4bc80;
  --color-borde: #ddd4c4;
}

.tema-vals-borgona {
  --color-papel: #f3e8e6;
  --color-papel-alto: #fbf4f2;
  --color-tinta: #3a181c;
  --color-tinta-suave: #7a4a50;
  --color-vino: #7a1e32;
  --color-vino-hondo: #541418;
  --color-oro: #b8943c;
  --color-oro-claro: #d0b060;
  --color-borde: #e0c8c4;
}

.tema-vals-perla {
  --color-papel: #eef0f2;
  --color-papel-alto: #f8f9fa;
  --color-tinta: #3a3e44;
  --color-tinta-suave: #6a7078;
  --color-vino: #4a5058;
  --color-vino-hondo: #32363c;
  --color-oro: #c4b888;
  --color-oro-claro: #d8d0a8;
  --color-borde: #d4d6d8;
}

.tema-vals-zafiro {
  --color-papel: #e8eef6;
  --color-papel-alto: #f4f7fc;
  --color-tinta: #1a2a4a;
  --color-tinta-suave: #4a5a80;
  --color-vino: #2a4a8a;
  --color-vino-hondo: #1a3268;
  --color-oro: #8a9ab0;
  --color-oro-claro: #b0bcc8;
  --color-borde: #c8d4e4;
}

.tema-deco-negro-oro {
  --color-papel: #f2ede4;
  --color-papel-alto: #faf7f0;
  --color-tinta: #1a1612;
  --color-tinta-suave: #5a5048;
  --color-vino: #1a1612;
  --color-vino-hondo: #0d0b09;
  --color-oro: #c4a030;
  --color-oro-claro: #d8bc50;
  --color-borde: #d4c8b0;
}

.tema-deco-jade {
  --color-papel: #e6eee8;
  --color-papel-alto: #f2f7f4;
  --color-tinta: #14241c;
  --color-tinta-suave: #4a6a58;
  --color-vino: #2a5a48;
  --color-vino-hondo: #1a3a30;
  --color-oro: #b89440;
  --color-oro-claro: #d0b060;
  --color-borde: #c0d4c8;
}

.tema-deco-marfil-cobre {
  --color-papel: #f4ede4;
  --color-papel-alto: #fbf6f0;
  --color-tinta: #2a1a12;
  --color-tinta-suave: #6a4a38;
  --color-vino: #8a4a2e;
  --color-vino-hondo: #6a3420;
  --color-oro: #c47848;
  --color-oro-claro: #d89868;
  --color-borde: #e0d0c0;
}

.tema-boho-terracota {
  --color-papel: #ede4d4;
  --color-papel-alto: #f6f0e4;
  --color-tinta: #3a2a1a;
  --color-tinta-suave: #6a5840;
  --color-vino: #8a4028;
  --color-vino-hondo: #6a2e1c;
  --color-oro: #6a7048;
  --color-oro-claro: #8a9060;
  --color-borde: #d8c8b0;
}

.tema-boho-eucalipto {
  --color-papel: #e8ebe4;
  --color-papel-alto: #f4f5f0;
  --color-tinta: #2a3228;
  --color-tinta-suave: #5a6858;
  --color-vino: #3e5a4c;
  --color-vino-hondo: #2a4036;
  --color-oro: #b07858;
  --color-oro-claro: #c89878;
  --color-borde: #c8d0c4;
}

.tema-boho-atardecer {
  --color-papel: #f6e8e0;
  --color-papel-alto: #fbf2ec;
  --color-tinta: #3a2038;
  --color-tinta-suave: #7a4a58;
  --color-vino: #a04038;
  --color-vino-hondo: #7a2e2a;
  --color-oro: #d49840;
  --color-oro-claro: #e8b860;
  --color-borde: #e8d0c4;
}

.marco-vals {
  border: 1px solid var(--color-oro);
  box-shadow: 0 0 0 6px var(--color-papel-alto), 0 0 0 7px var(--color-borde);
}

.marco-deco {
  border: 2px solid var(--color-oro);
  box-shadow: 0 0 0 5px var(--color-papel-alto), 0 0 0 7px var(--color-tinta);
}
```

- [ ] **Step 2: Confirmar que `.tema-jardin` y `.tema-mariposas` siguen iguales**

No reescribir esos dos bloques.

- [ ] **Step 3: Commit** — omitido

---

### Task 3: Layouts de pantalla (3 nuevos + 3 existentes)

**Files:**
- Create: `src/components/templates/ValsTemplate.tsx`
- Create: `src/components/templates/DecoTemplate.tsx`
- Create: `src/components/templates/BohoTemplate.tsx`
- Modify: `src/components/templates/ClasicaTemplate.tsx`
- Modify: `src/components/templates/JardinTemplate.tsx`
- Modify: `src/components/templates/MariposasTemplate.tsx`

**Interfaces:**
- Consumes: `claseTema` de Task 1; `InvitationView` (`evento.templateId`)
- Produces: seis componentes con la misma firma `{ token, invitacion }`

Cuerpo compartido (familia, mensaje, `BloqueLugar`, `PanelConfirmacion`) idéntico a `ClasicaTemplate`. Solo cambian ornamento del header y la clase `tema-*` en `<main>`.

- [ ] **Step 1: Actualizar los tres layouts existentes**

`ClasicaTemplate.tsx` — importar `claseTema` y aplicar en `<main>`. `clasica` no añade clase; `clasica-salvia` / `clasica-medianoche` sí. Conservar `textura-papel`.

```tsx
import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

export function ClasicaTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} textura-papel min-h-screen px-5 py-12`.trim()}>
      {/* resto igual que hoy */}
    </main>
  );
}
```

`JardinTemplate.tsx` — sustituir `className="tema-jardin relative..."` por:

```tsx
import { claseTema } from '@/lib/templates/catalogo';
// ...
const tema = claseTema(evento.templateId);
<main className={`${tema} relative min-h-screen overflow-hidden px-5 py-12`}>
```

`MariposasTemplate.tsx`:

```tsx
const tema = claseTema(evento.templateId);
<main className={`${tema} min-h-screen px-5 py-12`}>
```

- [ ] **Step 2: Crear `ValsTemplate.tsx`**

```tsx
import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

export function ValsTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
            <MedallonVals className="absolute inset-0 h-full w-full" />
            <p className="relative font-script text-5xl leading-none text-vino">XV</p>
          </div>
          <CintaVals className="mx-auto mt-2 h-6 w-56" />
          <h1 className="mt-5 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
            {evento.quinceanera}
          </h1>
          {padres.length > 0 && (
            <p className="mt-6 text-sm text-tinta-suave">
              Con la bendición de {padres.join(' y ')}
            </p>
          )}
          {evento.padrinos.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-tinta-suave">
              {evento.padrinos.map((padrino) => (
                <li key={`${padrino.rol}-${padrino.nombre}`}>
                  <span className="text-tinta">{padrino.nombre}</span>
                  {padrino.rol && <span className="text-tinta-suave"> · {padrino.rol}</span>}
                </li>
              ))}
            </ul>
          )}
        </header>

        <section className="surgir surgir-2 mt-10 border-y border-borde py-6 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-tinta-suave">
            Esta invitación es para
          </p>
          <p className="mt-3 font-display text-3xl text-tinta">Familia {familia.nombre}</p>
          <p className="mt-2 font-ticket text-sm text-oro">
            {familia.boletos} {familia.boletos === 1 ? 'boleto' : 'boletos'}
          </p>
        </section>

        {evento.mensaje && (
          <p className="surgir surgir-3 mt-10 text-center font-display text-lg leading-relaxed text-tinta-suave">
            {evento.mensaje}
          </p>
        )}

        <div className="surgir surgir-4 mt-12 space-y-10">
          {evento.misa && (
            <BloqueLugar etiqueta="Misa" lugar={evento.misa} quinceanera={evento.quinceanera} />
          )}
          {evento.recepcion && (
            <BloqueLugar
              etiqueta="Recepción"
              lugar={evento.recepcion}
              quinceanera={evento.quinceanera}
            />
          )}
        </div>

        <div className="surgir surgir-5 mt-12 border-t border-borde pt-8">
          <PanelConfirmacion token={token} invitacion={invitacion} />
        </div>
      </article>
    </main>
  );
}

function MedallonVals({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className={className}>
      <circle cx="60" cy="60" r="56" stroke="var(--color-oro)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="48" stroke="var(--color-vino)" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="40" stroke="var(--color-oro)" strokeWidth="0.5" opacity="0.7" />
    </svg>
  );
}

function CintaVals({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 28" fill="none" aria-hidden="true" className={className}>
      <path d="M8 14h204" stroke="var(--color-oro)" strokeWidth="1" />
      <path
        d="M78 14 90 6h40l12 8-12 8H90l-12-8Z"
        fill="var(--color-vino)"
        opacity="0.35"
      />
    </svg>
  );
}
```

- [ ] **Step 3: Crear `DecoTemplate.tsx`**

Misma placa/mensaje/lugares/confirmación. Header:

```tsx
import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

export function DecoTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1">
          <AbanicoDeco className="mx-auto h-16 w-48" />
          <div className="marco-deco mt-4 bg-papel-alto px-6 py-10 text-center">
            <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
              Mis XV años
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-tinta sm:text-6xl">
              {evento.quinceanera}
            </h1>
            {padres.length > 0 && (
              <p className="mt-6 text-sm text-tinta-suave">
                Con la bendición de {padres.join(' y ')}
              </p>
            )}
            {evento.padrinos.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-tinta-suave">
                {evento.padrinos.map((padrino) => (
                  <li key={`${padrino.rol}-${padrino.nombre}`}>
                    <span className="text-tinta">{padrino.nombre}</span>
                    {padrino.rol && <span className="text-tinta-suave"> · {padrino.rol}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>
        {/* placa, mensaje, lugares, PanelConfirmacion — igual que ValsTemplate */}
      </article>
    </main>
  );
}

function AbanicoDeco({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" fill="none" aria-hidden="true" className={className}>
      <path d="M100 60 L12 8" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M100 60 L40 4" stroke="var(--color-tinta)" strokeWidth="0.75" opacity="0.7" />
      <path d="M100 60 L70 2" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M100 60 L100 0" stroke="var(--color-vino)" strokeWidth="1.25" />
      <path d="M100 60 L130 2" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M100 60 L160 4" stroke="var(--color-tinta)" strokeWidth="0.75" opacity="0.7" />
      <path d="M100 60 L188 8" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M20 56 H180" stroke="var(--color-oro)" strokeWidth="1.5" />
      <path d="M36 50 H164" stroke="var(--color-tinta)" strokeWidth="0.75" />
    </svg>
  );
}
```

- [ ] **Step 4: Crear `BohoTemplate.tsx`**

```tsx
import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

export function BohoTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} relative min-h-screen overflow-hidden px-5 py-12`}>
      <RamaBoho className="absolute -left-4 top-8 h-64 w-24 opacity-90" />
      <RamaBoho className="absolute -right-6 bottom-16 h-48 w-20 rotate-[200deg] opacity-70" />

      <article className="relative mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
            Mis XV años
          </p>
          <h1 className="mt-5 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
            {evento.quinceanera}
          </h1>
          {padres.length > 0 && (
            <p className="mt-6 text-sm text-tinta-suave">
              Con la bendición de {padres.join(' y ')}
            </p>
          )}
          {evento.padrinos.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-tinta-suave">
              {evento.padrinos.map((padrino) => (
                <li key={`${padrino.rol}-${padrino.nombre}`}>
                  <span className="text-tinta">{padrino.nombre}</span>
                  {padrino.rol && <span className="text-tinta-suave"> · {padrino.rol}</span>}
                </li>
              ))}
            </ul>
          )}
        </header>
        {/* placa, mensaje, lugares, PanelConfirmacion — igual que ValsTemplate */}
      </article>
    </main>
  );
}

function RamaBoho({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 200" fill="none" aria-hidden="true" className={className}>
      <path
        d="M28 8c8 28-6 48 4 78s-10 52 2 92"
        stroke="var(--color-vino)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M32 36c18-4 28 8 22 18"
        stroke="var(--color-oro)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M50 48c6-10 4-18-2-22" fill="var(--color-oro)" opacity="0.45" />
      <path
        d="M30 88c-16 2-24 16-16 26"
        stroke="var(--color-vino)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <ellipse cx="18" cy="108" rx="7" ry="11" fill="var(--color-borde)" opacity="0.8" />
      <ellipse cx="52" cy="130" rx="6" ry="10" fill="var(--color-oro)" opacity="0.4" />
      <path
        d="M34 150c14 6 20 18 12 28"
        stroke="var(--color-oro)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Step 5: Commit** — omitido

---

### Task 4: Selector admin + página pública

**Files:**
- Modify: `src/components/admin/SelectorPlantilla.tsx`
- Modify: `src/app/invitacion/[token]/page.tsx`
- Modify: `src/app/admin/evento/[eventId]/plantilla/page.tsx` (`max-w-4xl` → `max-w-6xl`)

**Interfaces:**
- Consumes: `PLANTILLAS`, `layoutDe`, `claseTema`, `LayoutId`, los 6 componentes
- Produces: 20 tarjetas accesibles; resolución de plantilla por layout

- [ ] **Step 1: Reescribir `VistaPrevia` y la grilla**

En `SelectorPlantilla.tsx`:

- Importar `claseTema`, `layoutDe` además de `PLANTILLAS` / `TemplateId`.
- Cambiar `grid gap-6 sm:grid-cols-3` por `grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Conservar `min-h-11`, `aria-pressed`, `cursor-pointer`, `disabled` mientras guarda.

```tsx
function VistaPrevia({ id, nombre }: { id: TemplateId; nombre: string }) {
  const layout = layoutDe(id);
  const clase = claseTema(id);
  const nombreVisible = nombre.trim() || 'Quinceañera';

  return (
    <div
      className={`aspect-[3/4] w-full overflow-hidden rounded-[2px] border border-borde bg-papel ${clase}`}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
        {layout === 'jardin' && (
          <>
            <p className="font-script text-4xl leading-none text-vino">XV</p>
            <p className="font-script text-lg leading-none text-vino">años</p>
            <p className="mt-2 font-display text-sm text-tinta">{nombreVisible}</p>
          </>
        )}

        {layout === 'mariposas' && (
          <div className="marco-mariposas bg-papel-alto px-3 py-4">
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-2xl text-vino">{nombreVisible}</p>
          </div>
        )}

        {layout === 'clasica' && (
          <>
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-3xl text-vino">{nombreVisible}</p>
          </>
        )}

        {layout === 'vals' && (
          <>
            <p className="font-script text-4xl leading-none text-vino">XV</p>
            <p className="mt-2 font-script text-2xl text-vino">{nombreVisible}</p>
          </>
        )}

        {layout === 'deco' && (
          <div className="marco-deco bg-papel-alto px-3 py-4">
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-display text-lg text-tinta">{nombreVisible}</p>
          </div>
        )}

        {layout === 'boho' && (
          <>
            <p className="font-ticket text-[8px] uppercase tracking-[0.3em] text-oro">
              Mis XV años
            </p>
            <p className="mt-1 font-script text-3xl text-vino">{nombreVisible}</p>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mapa de componentes en la invitación pública**

Reemplazar el `Record` de 3 entradas en `src/app/invitacion/[token]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadInvitation } from '@/lib/invitation';
import { BohoTemplate } from '@/components/templates/BohoTemplate';
import { ClasicaTemplate } from '@/components/templates/ClasicaTemplate';
import { DecoTemplate } from '@/components/templates/DecoTemplate';
import { JardinTemplate } from '@/components/templates/JardinTemplate';
import { MariposasTemplate } from '@/components/templates/MariposasTemplate';
import { ValsTemplate } from '@/components/templates/ValsTemplate';
import { layoutDe, type LayoutId } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

type PlantillaProps = { token: string; invitacion: InvitationView };

const POR_LAYOUT: Record<LayoutId, (props: PlantillaProps) => React.JSX.Element> = {
  clasica: ClasicaTemplate,
  jardin: JardinTemplate,
  mariposas: MariposasTemplate,
  vals: ValsTemplate,
  deco: DecoTemplate,
  boho: BohoTemplate,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitacion = await loadInvitation(token);
  if (!invitacion) return { title: 'Invitación no encontrada' };
  return {
    title: `XV años de ${invitacion.evento.quinceanera}`,
    description: `Invitación para la familia ${invitacion.familia.nombre}.`,
    robots: { index: false, follow: false },
  };
}

export default async function InvitacionPage({ params }: Props) {
  const { token } = await params;
  const invitacion = await loadInvitation(token);
  if (!invitacion) notFound();
  const Plantilla = POR_LAYOUT[layoutDe(invitacion.evento.templateId)];
  return <Plantilla token={token} invitacion={invitacion} />;
}
```

- [ ] **Step 3: En `plantilla/page.tsx` cambiar `max-w-4xl` por `max-w-6xl`**

- [ ] **Step 4: Commit** — omitido

---

### Task 5: PDF espejo

**Files:**
- Modify: `src/lib/pdf/InvitationPdf.tsx` (archivo completo)

**Interfaces:**
- Consumes: `TemplateId`, `layoutDe`
- Produces: `PALETAS` con 20 entradas; ornamentos `MedallonValsPdf`, `AbanicoDecoPdf`, `RamaBohoPdf`; `Encabezado` por `layoutDe(templateId)`

- [ ] **Step 1: Ampliar `PALETAS` y cambiar switches de id crudo a layout**

Importar `layoutDe` además de `TemplateId`.

`PALETAS` debe ser `Record<TemplateId, Paleta>`. Entradas nuevas (hex en mayúsculas como las existentes; mismos valores que CSS):

```ts
import { layoutDe, type TemplateId } from '@/lib/templates/catalogo';

const PALETAS: Record<TemplateId, Paleta> = {
  clasica: { papel: '#F4ECF1', papelAlto: '#FBF6F9', tinta: '#2A1424', tintaSuave: '#6B4A60', vino: '#7B2D5E', vinoHondo: '#55193F', oro: '#A97722', borde: '#DCC5D5' },
  'clasica-salvia': { papel: '#E8EFE4', papelAlto: '#F4F8F1', tinta: '#243028', tintaSuave: '#5A6B58', vino: '#3D5A42', vinoHondo: '#2A3F30', oro: '#9A8438', borde: '#C5D0BE' },
  'clasica-medianoche': { papel: '#E8EDF4', papelAlto: '#F4F7FB', tinta: '#1A2744', tintaSuave: '#4A5A78', vino: '#2C3E6B', vinoHondo: '#1E2A4A', oro: '#8A94A6', borde: '#C4CAD8' },
  jardin: { papel: '#EEF3F8', papelAlto: '#FFFFFF', tinta: '#223A52', tintaSuave: '#5B7CA8', vino: '#4F7096', vinoHondo: '#37536F', oro: '#C98FAB', borde: '#CFE0EE' },
  'jardin-durazno': { papel: '#F8EBE3', papelAlto: '#FFF6F1', tinta: '#4A2E28', tintaSuave: '#8A5A52', vino: '#8B4A40', vinoHondo: '#6A342E', oro: '#D4A07A', borde: '#E8D0C4' },
  'jardin-menta': { papel: '#E6F2EE', papelAlto: '#F4FAF7', tinta: '#1E3D38', tintaSuave: '#4A7A70', vino: '#2A6458', vinoHondo: '#1E4A42', oro: '#5A9084', borde: '#C5DDD6' },
  mariposas: { papel: '#F4EEFA', papelAlto: '#FFFFFF', tinta: '#4A2F61', tintaSuave: '#8A6BB0', vino: '#9A5FAE', vinoHondo: '#7A3F8E', oro: '#C9932E', borde: '#E4CDEE' },
  'mariposas-rosa-antiguo': { papel: '#F3E8E6', papelAlto: '#FAF3F1', tinta: '#4A3336', tintaSuave: '#8A6B6E', vino: '#8A5058', vinoHondo: '#6A383E', oro: '#C4A878', borde: '#E0D0CE' },
  'mariposas-esmeralda': { papel: '#E8F0EA', papelAlto: '#F4F8F5', tinta: '#1A3D2E', tintaSuave: '#4A7A62', vino: '#2D6B4F', vinoHondo: '#1E4A38', oro: '#C4A84A', borde: '#C5D8CC' },
  'mariposas-oro-rosa': { papel: '#F8EEEA', papelAlto: '#FFF6F3', tinta: '#4A2E2A', tintaSuave: '#8A5A54', vino: '#8B4A44', vinoHondo: '#6A3430', oro: '#C49070', borde: '#E8D4CC' },
  'vals-champan': { papel: '#F3EDE4', papelAlto: '#FBF7F0', tinta: '#3A2E22', tintaSuave: '#7A6A54', vino: '#6B5428', vinoHondo: '#4A3A1A', oro: '#B89858', borde: '#DDD4C4' },
  'vals-borgona': { papel: '#F3E8E6', papelAlto: '#FBF4F2', tinta: '#3A181C', tintaSuave: '#7A4A50', vino: '#7A1E32', vinoHondo: '#541418', oro: '#B8943C', borde: '#E0C8C4' },
  'vals-perla': { papel: '#EEF0F2', papelAlto: '#F8F9FA', tinta: '#3A3E44', tintaSuave: '#6A7078', vino: '#4A5058', vinoHondo: '#32363C', oro: '#C4B888', borde: '#D4D6D8' },
  'vals-zafiro': { papel: '#E8EEF6', papelAlto: '#F4F7FC', tinta: '#1A2A4A', tintaSuave: '#4A5A80', vino: '#2A4A8A', vinoHondo: '#1A3268', oro: '#8A9AB0', borde: '#C8D4E4' },
  'deco-negro-oro': { papel: '#F2EDE4', papelAlto: '#FAF7F0', tinta: '#1A1612', tintaSuave: '#5A5048', vino: '#1A1612', vinoHondo: '#0D0B09', oro: '#C4A030', borde: '#D4C8B0' },
  'deco-jade': { papel: '#E6EEE8', papelAlto: '#F2F7F4', tinta: '#14241C', tintaSuave: '#4A6A58', vino: '#2A5A48', vinoHondo: '#1A3A30', oro: '#B89440', borde: '#C0D4C8' },
  'deco-marfil-cobre': { papel: '#F4EDE4', papelAlto: '#FBF6F0', tinta: '#2A1A12', tintaSuave: '#6A4A38', vino: '#8A4A2E', vinoHondo: '#6A3420', oro: '#C47848', borde: '#E0D0C0' },
  'boho-terracota': { papel: '#EDE4D4', papelAlto: '#F6F0E4', tinta: '#3A2A1A', tintaSuave: '#6A5840', vino: '#8A4028', vinoHondo: '#6A2E1C', oro: '#6A7048', borde: '#D8C8B0' },
  'boho-eucalipto': { papel: '#E8EBE4', papelAlto: '#F4F5F0', tinta: '#2A3228', tintaSuave: '#5A6858', vino: '#3E5A4C', vinoHondo: '#2A4036', oro: '#B07858', borde: '#C8D0C4' },
  'boho-atardecer': { papel: '#F6E8E0', papelAlto: '#FBF2EC', tinta: '#3A2038', tintaSuave: '#7A4A58', vino: '#A04038', vinoHondo: '#7A2E2A', oro: '#D49840', borde: '#E8D0C4' },
};
```

Sustituir `evento.templateId === 'jardin'` / `'mariposas'` por `layoutDe(evento.templateId) === 'jardin'` (y el resto de layouts). Añadir ornamentos PDF con los mismos `viewBox` y paths que en pantalla:

```tsx
function MedallonValsPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={72} height={72} viewBox="0 0 120 120">
      <Circle cx={60} cy={60} r={56} stroke={paleta.oro} strokeWidth={1.5} fill="none" />
      <Circle cx={60} cy={60} r={48} stroke={paleta.vino} strokeWidth={0.75} fill="none" />
      <Circle cx={60} cy={60} r={40} stroke={paleta.oro} strokeWidth={0.5} fill="none" />
    </Svg>
  );
}

function CintaValsPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={160} height={20} viewBox="0 0 220 28">
      <Path d="M8 14h204" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M78 14 90 6h40l12 8-12 8H90l-12-8Z" fill={paleta.vino} opacity={0.35} />
    </Svg>
  );
}

function AbanicoDecoPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={140} height={44} viewBox="0 0 200 64">
      <Path d="M100 60 L12 8" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M100 60 L40 4" stroke={paleta.tinta} strokeWidth={0.75} />
      <Path d="M100 60 L70 2" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M100 60 L100 0" stroke={paleta.vino} strokeWidth={1.25} />
      <Path d="M100 60 L130 2" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M100 60 L160 4" stroke={paleta.tinta} strokeWidth={0.75} />
      <Path d="M100 60 L188 8" stroke={paleta.oro} strokeWidth={1} />
      <Path d="M20 56 H180" stroke={paleta.oro} strokeWidth={1.5} />
    </Svg>
  );
}

function RamaBohoPdf({ paleta }: { paleta: Paleta }) {
  return (
    <Svg width={40} height={100} viewBox="0 0 80 200">
      <Path d="M28 8c8 28-6 48 4 78s-10 52 2 92" stroke={paleta.vino} strokeWidth={1.4} fill="none" />
      <Path d="M32 36c18-4 28 8 22 18" stroke={paleta.oro} strokeWidth={1} fill="none" />
      <Path d="M30 88c-16 2-24 16-16 26" stroke={paleta.vino} strokeWidth={1} fill="none" />
    </Svg>
  );
}
```

En `InvitationPdf`, `const layout = layoutDe(evento.templateId)` y colocar:

- `jardin` → `RamoEsquinaPdf` (como hoy)
- `mariposas` → `MariposaPdf` (como hoy)
- `vals` → `MedallonValsPdf` arriba-centro (el monograma XV lo pinta `Encabezado`)
- `deco` → `AbanicoDecoPdf` arriba-centro
- `boho` → `RamaBohoPdf` arriba-izquierda y otra espejada abajo-derecha

`Encabezado` recibe `templateId` y usa `layoutDe(templateId)`:

```tsx
function Encabezado({
  templateId,
  estilos,
  quinceanera,
  foto,
}: {
  templateId: TemplateId;
  estilos: Estilos;
  quinceanera: string;
  foto?: string;
}) {
  const layout = layoutDe(templateId);

  if (layout === 'jardin') {
    return (
      <View>
        <Text style={estilos.eyebrow}>MIS</Text>
        <Text style={[estilos.tituloScript, { fontSize: 56, marginTop: 0 }]}>XV</Text>
        <Text style={[estilos.tituloScript, { fontSize: 26, marginTop: -8 }]}>años</Text>
        <Text style={estilos.tituloDisplay}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'mariposas') {
    return (
      <View style={estilos.marco}>
        {foto ? <Image style={estilos.foto} src={foto} /> : null}
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={estilos.tituloScript}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'vals') {
    return (
      <View>
        <Text style={[estilos.tituloScript, { fontSize: 40, marginTop: 8 }]}>XV</Text>
        <Text style={estilos.tituloScript}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'deco') {
    return (
      <View style={estilos.marco}>
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={estilos.tituloDisplay}>{quinceanera}</Text>
      </View>
    );
  }

  if (layout === 'boho') {
    return (
      <View>
        <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
        <Text style={[estilos.tituloScript, { fontSize: 46 }]}>{quinceanera}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={estilos.eyebrow}>MIS XV AÑOS</Text>
      <Text style={[estilos.tituloScript, { fontSize: 46 }]}>{quinceanera}</Text>
    </View>
  );
}
```

El resto del PDF (placa, mensaje, lugares, boleto QR) no cambia.

- [ ] **Step 2: `npx tsc --noEmit` debe quejarse si falta alguna clave de `PALETAS`**

- [ ] **Step 3: Commit** — omitido

---

### Task 6: DELETE de eventos + lista admin

**Files:**
- Modify: `src/app/api/events/route.ts`
- Create: `src/components/admin/ListaEventos.tsx`
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: patrón `DELETE` de `src/app/api/families/route.ts` y `quitarFamilia` de `TablaFamilias`
- Produces: `DELETE /api/events?id=`; UI con confirmación destructiva; enlace crear siempre visible

- [ ] **Step 1: Añadir `DELETE` al final de `src/app/api/events/route.ts`**

```ts
export async function DELETE(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  const { error } = await db.from('events').delete().eq('id', id);

  if (error) {
    console.error('events.delete', error.message);
    return NextResponse.json(
      { error: 'No pudimos eliminar el evento. Inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Crear `src/components/admin/ListaEventos.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

type EventoLista = {
  id: string;
  quinceanera_nombre: string;
  estado: string;
};

type Props = {
  eventosIniciales: EventoLista[];
};

export function ListaEventos({ eventosIniciales }: Props) {
  const [eventos, setEventos] = useState(eventosIniciales);
  const [error, setError] = useState<string | null>(null);

  async function eliminarEvento(evento: EventoLista) {
    const confirma = window.confirm(
      `¿Eliminar el evento de ${evento.quinceanera_nombre}? Se borrarán las familias, los PIN del staff y el historial de entrada. Esto no se puede deshacer.`,
    );
    if (!confirma) return;

    setError(null);
    const respuesta = await fetch(`/api/events?id=${evento.id}`, { method: 'DELETE' });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null);
      setError(datos?.error ?? 'No pudimos eliminar el evento.');
      return;
    }

    setEventos((previos) => previos.filter((actual) => actual.id !== evento.id));
  }

  if (eventos.length === 0) {
    return (
      <p className="mt-8 text-sm text-tinta-suave">
        Ya no hay eventos en esta lista. Crea uno nuevo cuando quieras.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-8 space-y-3">
        {eventos.map((evento) => (
          <li key={evento.id} className="talon flex items-center justify-between gap-4 px-6 py-5">
            <Link
              href={`/admin/evento/${evento.id}/invitados`}
              className="min-h-11 flex-1 cursor-pointer"
            >
              <span className="font-display text-xl text-tinta">{evento.quinceanera_nombre}</span>
              <span className="mt-1 block font-ticket text-[11px] uppercase tracking-[0.2em] text-tinta-suave">
                {evento.estado}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href={`/admin/evento/${evento.id}/invitados`}
                className="inline-flex min-h-11 cursor-pointer items-center text-vino underline underline-offset-4"
              >
                Abrir
              </Link>
              <button
                type="button"
                onClick={() => eliminarEvento(evento)}
                className="inline-flex min-h-11 cursor-pointer items-center text-alerta underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
    </>
  );
}
```

- [ ] **Step 3: Actualizar `src/app/admin/page.tsx`**

Siempre mostrar el enlace de crear (texto según haya o no eventos). Sustituir el `<ul>` por `ListaEventos`. Conservar `EstadoHoja` cuando la lista inicial está vacía.

```tsx
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { FormularioAcceso } from '@/components/admin/FormularioAcceso';
import { ListaEventos } from '@/components/admin/ListaEventos';
import { AvisoErrorAuth } from '@/components/auth/AvisoErrorAuth';
import { EstadoHoja } from '@/components/ui/EstadoHoja';
import type { EventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return (
      <main className="textura-papel flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
            Panel del organizador
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-tinta">
            Entra para preparar la invitación
          </h1>
          <div className="mt-8">
            <AvisoErrorAuth />
            <FormularioAcceso />
          </div>
        </div>
      </main>
    );
  }

  const { data: eventos } = await db
    .from('events')
    .select('id, quinceanera_nombre, estado, capacidad_total')
    .order('created_at', { ascending: false })
    .returns<Pick<EventRow, 'id' | 'quinceanera_nombre' | 'estado' | 'capacidad_total'>[]>();

  const hayEventos = Boolean(eventos && eventos.length > 0);

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Panel del organizador
        </p>
        <h1 className="mt-3 font-display text-3xl text-tinta">Tus eventos</h1>

        <Link
          href="/admin/evento/nuevo"
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[2px] border border-vino-hondo bg-vino px-5 text-sm font-medium text-papel-alto transition-colors duration-200 hover:bg-vino-hondo"
        >
          {hayEventos ? 'Crear otro evento' : 'Crear el evento'}
        </Link>

        {!hayEventos ? (
          <div className="talon mt-10 px-6 py-2">
            <EstadoHoja
              compacto
              titulo="Todavía no hay ningún evento"
              detalle="Crea el evento para elegir la plantilla, capturar los datos y armar la lista de familias."
            />
          </div>
        ) : (
          <ListaEventos
            eventosIniciales={eventos!.map((evento) => ({
              id: evento.id,
              quinceanera_nombre: evento.quinceanera_nombre,
              estado: evento.estado,
            }))}
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit** — omitido

---

### Task 7: Barrido TypeScript + verificación

**Files:**
- Grep del repo: `TemplateId`, `tema-jardin`, `PLANTILLAS`, `esTemplateId`, `=== 'jardin'`, `=== 'mariposas'`, `=== 'clasica'`

**Interfaces:**
- Consumes: todo lo anterior
- Produces: `tsc`, lint y vitest en verde

- [ ] **Step 1: Buscar switches exhaustivos que aún solo conocen 3 plantillas**

```
rg -n "TemplateId|'clasica'|'jardin'|'mariposas'|tema-jardin|PLANTILLAS|esTemplateId" src tests --glob "*.{ts,tsx,css}"
```

Corregir cualquier `Record<TemplateId, …>` o `if (templateId === 'jardin')` que no use `layoutDe`.

- [ ] **Step 2: Verificar**

```
npx tsc --noEmit
npm run lint
npx vitest run
```

Expected: exit 0 en los tres.

- [ ] **Step 3: Smoke de `/admin`**

Revisar terminals en `C:\Users\Orusuko\.cursor\projects\c-Users-Orusuko-Desktop-XVs\terminals`. Si no hay `npm run dev`, arrancarlo. Confirmar que `/admin` compila. Si no hay browser MCP, anotarlo.

- [ ] **Step 4: Commit** — omitido

---

## Self-review

**Spec coverage:** crear evento (enlace siempre) → Task 6. Eliminar evento (API + UI + copy destructivo) → Task 6. 20 ids / 6 layouts / skins / PDF / selector / página pública → Tasks 1–5. Tests de helpers → Task 1. Ids de producción intactos → Task 1. Sin schema change → `CLAVE_TEMPLATE_CONFIG` se conserva.

**Placeholder scan:** ningún TBD; el código de cada archivo está en su tarea.

**Type consistency:** `layoutDe(id: TemplateId): LayoutId`, `claseTema(id: TemplateId): string`, `POR_LAYOUT: Record<LayoutId, …>`, `PALETAS: Record<TemplateId, Paleta>`.
