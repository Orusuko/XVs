# Pulido de oficio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Que el catálogo de 28 se lea como diseños distintos de verdad, y que el organizador pueda previsualizar, publicar, editar familias y preparar la entrada sin fricción.

**Architecture:** No se agregan plantillas ni skins de color. Se cambia cómo se elige (selector agrupado), cómo se ve el cuerpo de Retrato/Editorial/Itinerario, y se cierran huecos de admin que el código ya permite a medias (`PATCH /api/families` existe; `events.estado` se muestra crudo y no frena WhatsApp; `foto_url` se guarda pero no se previsualiza).

**Tech Stack:** Next.js App Router, Tailwind v4, React, Supabase, Vitest, `@react-pdf/renderer`

**Spec:** [xv-anos-sistema-invitaciones.md](../../../xv-anos-sistema-invitaciones.md) §4 (admin), §5 (invitación/PDF), §10 Fase 2. Índice: [README.md](./README.md)

## Global Constraints

- Un solo evento. Copy en español, voz de boleto (`EstadoHoja`, `Boton`). Sin jerga de sistema.
- No más `clasica-*` / `jardin-*`. No Wallet. No Storage. No i18n. No analytics.
- Ids `clasica`, `jardin`, `mariposas` no cambian.
- Targets ≥ 44px, `cursor-pointer`, `aria-pressed`, `prefers-reduced-motion`.
- Plantilla sigue en `template_config.plantilla`. Foto en `template_config.foto_url`.
- Errores de DB no se muestran crudos. Esta sesión no crea commits salvo que lo pidan.
- `loadInvitation` ya oculta `estado === 'cancelado'`. **No** 404 en `borrador`: el organizador debe poder abrir un token de prueba. El candado es solo Copiar/WhatsApp.

## Ya no hacer (está en el código)

- MVP de los tres módulos, login password, EstadoHoja, 28 plantillas (20 skins + 8 layouts), chips de familia, crear/borrar eventos, WhatsApp, QR/`jti`, staff offline, aforo en **staff** (`VistaConteo`), `.ics` + Google Calendar, historial de escaneos, `DELETE` familias, campo URL de foto, `PATCH /api/families`, `PATCH /api/events` con `estado`.
- Editorial ya tiene fallback `XV` si no hay fecha. El PDF editorial ya usa `diaEditorial` a la izquierda. No rehacer eso.
- Picado en pantalla ya es un SVG (franja + puntos), no dos `div`. El oficio es calarlo (rombos) y que la **miniatura** deje de ser dos barras.

## File Structure

| Path | Qué cambia |
|---|---|
| `src/lib/templates/catalogo.ts` | `plantillasDeLayout`, `layoutsUnicos`, `CLAVE_VESTIMENTA_CONFIG` |
| `src/components/admin/SelectorPlantilla.tsx` | Una card por `LayoutId`; swatches eligen la paleta |
| `src/lib/templates/por-layout.ts` | Extraer `POR_LAYOUT` de la página pública |
| `src/lib/templates/muestra.ts` | `InvitationView` de demostración |
| `src/app/admin/evento/[eventId]/vista/page.tsx` | Preview real |
| `src/components/admin/NavegacionAdmin.tsx` | Cuarto paso “Vista” |
| `src/components/invitation/CuerpoInvitacion.tsx` | `alineacion`, `placa`, `sinConfirmacion` |
| `src/components/invitation/PadresPadrinos.tsx` | Extraer el bloque copiado |
| `src/components/templates/RetratoTemplate.tsx` | Cuerpo a la izquierda |
| `src/components/templates/EditorialTemplate.tsx` | Sin `11vw`; placa distinta |
| `src/components/templates/ItinerarioTemplate.tsx` | Placa tipo programa |
| `src/components/templates/PicadoTemplate.tsx` | Banner calado |
| `src/components/templates/CelesteTemplate.tsx` | Cielo más presente |
| `src/components/admin/FormularioEvento.tsx` | Preview de foto + vestimenta |
| `src/lib/invitation.ts` + `src/lib/types.ts` | Leer `vestimenta` |
| `src/lib/pdf/InvitationPdf.tsx` | Corona/Picado/Vitela; línea de vestimenta |
| `src/components/admin/TablaFamilias.tsx` | Editar + aforo + candado de publicación |
| `src/app/admin/evento/[eventId]/invitados/page.tsx` | Pasar `estado` y `capacidad_total` |
| `src/components/admin/ListaEventos.tsx` | Etiqueta humana Borrador / Publicado |
| `src/components/admin/PanelStaff.tsx` | URL absoluta + copiar |

---

### Task 1: Selector agrupado por layout

**Files:**
- Modify: `src/lib/templates/catalogo.ts`
- Modify: `src/components/admin/SelectorPlantilla.tsx` (miniaturas de `clasica` / `vals` / `boho` / `picado`)
- Test: `tests/catalogo.test.ts`

**Interfaces:**

```ts
export function plantillasDeLayout(layout: LayoutId): TemplateInfo[] {
  return PLANTILLAS.filter((p) => p.layout === layout);
}

export function layoutsUnicos(filtro: FamiliaCatalogo | 'todas'): LayoutId[] {
  const vistos = new Set<LayoutId>();
  const orden: LayoutId[] = [];
  for (const plantilla of PLANTILLAS) {
    if (filtro !== 'todas' && plantilla.familia !== filtro) continue;
    if (vistos.has(plantilla.layout)) continue;
    vistos.add(plantilla.layout);
    orden.push(plantilla.layout);
  }
  return orden;
}
```

- [x] **Step 1: Test que falla**

Añadir al describe existente de `tests/catalogo.test.ts`:

```ts
import { layoutsUnicos, plantillasDeLayout } from '@/lib/templates/catalogo';

test('plantillasDeLayout agrupa variantes', () => {
  expect(plantillasDeLayout('clasica').map((p) => p.id)).toEqual([
    'clasica',
    'clasica-salvia',
    'clasica-medianoche',
  ]);
  expect(plantillasDeLayout('picado').map((p) => p.id)).toEqual(['picado']);
});

test('layoutsUnicos no repite layout', () => {
  expect(layoutsUnicos('todas')).toHaveLength(14);
  expect(layoutsUnicos('moderna')).toEqual(['retrato', 'editorial']);
});
```

- [x] **Step 2:** `npx vitest run tests/catalogo.test.ts` — FAIL (`plantillasDeLayout` no existe)

- [x] **Step 3: Implementar helpers y selector**

Una card por `LayoutId` (14 cards, no 28). Título = `plantillasDeLayout(layout)[0].nombre` sin el sufijo de paleta: usar el canónico (`Clásica`, `Jardín`, `Picado`…). Miniatura del id elegido si pertenece al grupo; si no, el primero.

Debajo, swatches: cada `TemplateInfo` del grupo es un botón `min-h-11 min-w-11` con `aria-pressed` y `aria-label={plantilla.nombre}`. Clic llama al `elegir(id)` de hoy (mismo `PATCH`).

Chips Todas / Tradición / Jardín / Gala / Moderna llaman `layoutsUnicos(filtro)`.

Miniaturas que hoy se copian:

| Layout | Miniatura |
|---|---|
| `clasica` | Solo ceja “Mis XV años” + nombre script. Sin círculo XV. |
| `vals` | Círculo `border border-oro` con “XV” script adentro. |
| `boho` | Rama (`w-8`) a la izquierda + nombre. Sin ceja centrada idéntica a Clásica. |
| `picado` | Misma silueta que el banner calado (no `h-3 bg-vino` + `h-2 bg-oro`). |

- [x] **Step 4:** `npx vitest run tests/catalogo.test.ts` — PASS

---

### Task 2: Vista previa real

**Files:**
- Create: `src/lib/templates/por-layout.ts`
- Create: `src/lib/templates/muestra.ts`
- Create: `src/app/admin/evento/[eventId]/vista/page.tsx`
- Modify: `src/app/invitacion/[token]/page.tsx` — importar `POR_LAYOUT`
- Modify: `src/components/admin/NavegacionAdmin.tsx`
- Modify: `src/components/invitation/CuerpoInvitacion.tsx` — `sinConfirmacion?: boolean`

**Interfaces:**

```ts
// src/lib/templates/por-layout.ts
export type PlantillaProps = { token: string; invitacion: InvitationView };
export const POR_LAYOUT: Record<LayoutId, (props: PlantillaProps) => React.JSX.Element>;

// src/lib/templates/muestra.ts
export function invitacionMuestra(evento: {
  quinceanera_nombre: string;
  padre: string | null;
  madre: string | null;
  padrinos: Padrino[];
  mensaje: string | null;
  misa: Lugar | null;
  recepcion: Lugar | null;
  template_config: Record<string, string>;
}): InvitationView
```

`invitacionMuestra` usa `CLAVE_TEMPLATE_CONFIG` + `esTemplateId` igual que `loadInvitation`. Familia fija: `{ nombre: 'Los Ramírez', boletos: 4, estado: 'pendiente' }`.

Auth de la página vista: copiar el patrón de `src/app/admin/evento/[eventId]/plantilla/page.tsx` (`redirect('/admin')` si no hay user, `notFound` si no hay evento). Select: `quinceanera_nombre, padre, madre, padrinos, mensaje, misa, recepcion, template_config`.

`NavegacionAdmin` `PASOS`:

```ts
const PASOS = [
  { seg: 'datos', etiqueta: 'Datos' },
  { seg: 'plantilla', etiqueta: 'Plantilla' },
  { seg: 'vista', etiqueta: 'Vista' },
  { seg: 'invitados', etiqueta: 'Invitados' },
] as const;
```

En `CuerpoInvitacion`, si `sinConfirmacion` es true, no montar `PanelConfirmacion`. La página vista pasa `token="muestra"` y `sinConfirmacion`.

- [x] **Step 1:** Extraer `POR_LAYOUT` sin cambiar el mapa (las 14 entradas de `src/app/invitacion/[token]/page.tsx`)
- [x] **Step 2:** `muestra.ts` + página + nav + `sinConfirmacion`
- [x] **Step 3:** Abrir `/admin/evento/<id>/vista` logueado — se ve la plantilla elegida con el nombre real, sin botones de confirmar

---

### Task 3: Cuerpos que no sean el de Clásica

**Files:**
- Modify: `src/components/invitation/CuerpoInvitacion.tsx`
- Modify: `src/components/templates/RetratoTemplate.tsx`
- Modify: `src/components/templates/EditorialTemplate.tsx`
- Modify: `src/components/templates/ItinerarioTemplate.tsx`

**Interfaces:**

```ts
type Props = {
  token: string;
  invitacion: InvitationView;
  lugares?: 'bloques' | 'columna';
  alineacion?: 'centro' | 'izquierda';
  placa?: 'grabada' | 'programa' | 'ninguna';
  sinConfirmacion?: boolean;
};
```

Defaults: `lugares='bloques'`, `alineacion='centro'`, `placa='grabada'` (el bloque `border-y` de hoy).

- `alineacion="izquierda"`: quitar `text-center` de placa, mensaje y (si aplica) lugares.
- `placa="ninguna"`: no hay `border-y`. Una línea ticket: `Familia {nombre} · {n} boletos`.
- `placa="programa"`: sin `border-y`. Etiqueta `Invitados` (`font-ticket` uppercase) + `Familia X · N boletos`, alineado a la columna (`text-left`), no centrado.

- [x] **Step 1:** Retrato: `<CuerpoInvitacion … alineacion="izquierda" />`. Editorial: `placa="ninguna"`. Itinerario: `placa="programa"` (sigue `lugares="columna"`).
- [x] **Step 2:** Recorrer las tres en `/vista` — la placa no puede ser un calco de Clásica

---

### Task 4: `PadresPadrinos` + oficio de 4 layouts

**Files:**
- Create: `src/components/invitation/PadresPadrinos.tsx`
- Modify: Picado, Corona, Charra, Celeste, Editorial, Vitela, Itinerario, Retrato (quitar las copias locales; Picado/Corona/Charra ya tienen una función local idéntica)
- Modify: `PicadoTemplate.tsx`, `CelesteTemplate.tsx`, `EditorialTemplate.tsx`, `SelectorPlantilla.tsx` (miniatura picado si no se hizo en Task 1)

**Interfaces:**

```ts
export function PadresPadrinos({
  padres,
  padrinos,
  className = 'text-center',
}: {
  padres: string[];
  padrinos: { nombre: string; rol: string }[];
  className?: string;
}): React.JSX.Element
```

Copy (el de Picado/Corona/Charra hoy):

```tsx
{padres.length > 0 && (
  <p className="mt-6 text-sm text-tinta-suave">Con la bendición de {padres.join(' y ')}</p>
)}
{padrinos.length > 0 && (
  <ul className="mt-3 space-y-1 text-sm text-tinta-suave">
    {padrinos.map((padrino) => (
      <li key={`${padrino.rol}-${padrino.nombre}`}>
        <span className="text-tinta">{padrino.nombre}</span>
        {padrino.rol && <span className="text-tinta-suave"> · {padrino.rol}</span>}
      </li>
    ))}
  </ul>
)}
```

Retrato pasa `className="text-left"`.

- [x] **Step 1:** Extraer y sustituir las 8 copias.

- [x] **Step 2: Picado** — `BannerPicado` deja de ser franja + círculos. SVG `viewBox="0 0 320 36"` con rombos/cruces recortados (`fill="var(--color-papel)"` sobre `vino`/`oro`). Mismos tokens. Miniatura = esa silueta.

- [x] **Step 3: Celeste** — más estrellas (al menos el doble en `Estrellas`), `Luna` a `h-28 w-28`. El hero no puede leerse como Clásica medianoche.

- [x] **Step 4: Editorial** — en `EditorialTemplate.tsx` línea del día, quitar `text-[11vw]`. Usar `font-ticket text-7xl leading-none tracking-tight text-vino sm:text-8xl`. El fallback `XV` **ya existe**; no tocarlo.

---

### Task 5: Foto usable (sin Storage)

**Files:**
- Modify: `src/components/admin/FormularioEvento.tsx`

El campo ya guarda `template_config.foto_url` con `CLAVE_FOTO_CONFIG`. Hoy es `tipo="url"` y la ayuda dice “Pega el enlace…”.

- Ayuda: “Sube la foto a Drive o Imgur, abre la imagen a pantalla completa y pega el enlace que termina en .jpg o .png.”
- `tipo="text"` (no `url`) para no bloquear el submit si pegan sin `https://`.
- Si `^https://` y hay valor, preview 4:5 `max-h-48 object-cover` con `<img>` (mismo `eslint-disable` que `RetratoTemplate`). `onError` → texto: “Este enlace no muestra una imagen. Prueba otro.”

- [x] **Step 1:** Preview + copy + `type="text"`
- [x] **Step 2:** En Datos, pegar una URL de imagen de prueba — se ve el recorte

---

### Task 6: PDF de las 8 nuevas (solo huecos)

**Files:**
- Modify: `src/lib/pdf/InvitationPdf.tsx`

Ya existe: paletas, `BannerPicadoPdf` (solo arriba), `TiaraPdf`, `HerraduraPdf`, `LunaPdf`, `SelloLacrePdf` (arriba del nombre), `fotoAncha` en Retrato, columna en Itinerario, `diaEditorial` a la izquierda. **No** rehacer Editorial ni Retrato ni Itinerario.

- [x] **Step 1: Corona** — alrededor del nombre, `View` con `borderWidth: 1`, `borderColor: paleta.oro`, `borderTopLeftRadius: 120`, `borderTopRightRadius: 120`, `paddingTop: 28`, `paddingHorizontal: 16`. La tiara puede quedar encima del arco.
- [x] **Step 2: Picado** — repetir `<BannerPicadoPdf paleta={paleta} />` al pie de la página (después del QR o, si no hay QR, después de los lugares).
- [x] **Step 3: Vitela** — `paddingVertical` extra en esa página (p. ej. 72) y mover `SelloLacrePdf` **bajo** el nombre, no encima.
- [x] **Step 4:** Descargar PDF de Picado, Corona, Retrato, Editorial, Itinerario — nada encima de texto, nada cortado

---

### Task 7: Editar familia (API ya existe)

**Files:**
- Modify: `src/components/admin/TablaFamilias.tsx`
- `PATCH /api/families` ya acepta `{ id, nombre_familia, boletos_total }` (`src/app/api/families/route.ts`)

- [x] **Step 1:** Estado `editandoId: string | null` + borrador `{ nombre_familia, boletos_total }`. “Editar” en la fila pone inputs `min-h-11`. Guardar:

```ts
const respuesta = await fetch('/api/families', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: familia.id,
    nombre_familia: borrador.nombre_familia.trim(),
    boletos_total: Number(borrador.boletos_total),
  }),
});
```

Cancelar restaura. Tras ok, actualizar `familias` en estado (el `useMemo` de `summarizeTickets` se recalcula solo).

- [x] **Step 2:** Si `Number(boletos) < 1` o no es entero, no llamar PATCH. Error inline: “Cada familia necesita al menos un boleto.” Mismo `setError` que Quitar.
- [x] **Step 3:** Cambiar boletos de una familia — el recuadro “Boletos” de arriba cambia

---

### Task 8: Publicar el evento

**Files:**
- Modify: `src/app/admin/evento/[eventId]/invitados/page.tsx` — select también `estado`; pasar `estado` y `capacidad_total` a `TablaFamilias`
- Modify: `src/components/admin/TablaFamilias.tsx`
- Modify: `src/components/admin/ListaEventos.tsx` — no mostrar `borrador` crudo

`PATCH /api/events` ya acepta `estado`. Default al crear: `borrador` (default de DB).

Un solo lugar para el botón: Invitados, junto al `<h1>`.

```ts
const publicado = estado === 'publicado';

async function publicar() {
  if (!window.confirm('Las familias podrán abrir su enlace.')) return;
  await fetch('/api/events', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: eventId, estado: 'publicado' }),
  });
}
```

“Volver a borrador” confirma: “Los enlaces dejan de enviarse. Quien ya los tenga sigue pudiendo abrirlos.” PATCH `estado: 'borrador'`.

Si `!publicado`: Copiar deshabilitado (`disabled`), WhatsApp es `<span>` no `<a>` (no abrir `wa.me`). Texto: “Publica el evento para enviar los enlaces.”

`ListaEventos`: `{evento.estado === 'publicado' ? 'Publicado' : 'Borrador'}`.

- [x] **Step 1:** Botón + PATCH
- [x] **Step 2:** Candado Copiar/WhatsApp
- [x] **Step 3:** Etiqueta humana en la lista de eventos

---

### Task 9: Vestimenta + aforo en admin

**Files:**
- Modify: `src/lib/templates/catalogo.ts` — `export const CLAVE_VESTIMENTA_CONFIG = 'vestimenta';`
- Modify: `src/lib/types.ts` — `InvitationView.evento` gana `vestimenta: string | null`
- Modify: `src/lib/invitation.ts` — `vestimenta: evento.template_config?.[CLAVE_VESTIMENTA_CONFIG] || null`
- Modify: `src/lib/templates/muestra.ts` — copiar la misma clave
- Modify: `src/components/admin/FormularioEvento.tsx` — campo “Código de vestimenta” (ej. placeholder “Formal, no blanco”); persistir en `template_config` junto a `foto_url`
- Modify: `CuerpoInvitacion` — si `evento.vestimenta`, una línea `font-ticket` bajo los lugares
- Modify: `InvitationPdf.tsx` — la misma línea
- Modify: `TablaFamilias.tsx` — prop opcional `capacidadTotal: number | null`

El aforo del **staff** (`VistaConteo`) ya existe. Aquí solo el admin:

Bajo el `<dl>` de resumen: si hay `capacidadTotal`, “Boletos en lista: {resumen.total} / aforo {capacidadTotal}”. Si `resumen.total > capacidadTotal`, `text-alerta`: “La lista supera el aforo del salón.”

`invitados/page.tsx` ya selecciona `capacidad_total`; pasarlo.

Sin migración SQL.

- [x] **Step 1:** Constante + campo + `InvitationView` + línea pública + PDF
- [x] **Step 2:** Aforo en Invitados

---

### Task 10: Enlace de staff usable

**Files:**
- Modify: `src/components/admin/PanelStaff.tsx`

Hoy el link es relativo (`/staff/{id}/login`). `siteUrl` vive en `@/lib/format` y ya lo usa Invitados (server). `PanelStaff` es client: pasar `siteUrl` como prop desde `invitados/page.tsx` (`siteUrl()`), no llamar `process.env` en el cliente de otra forma.

- [x] **Step 1:** `const url = `${siteUrl}/staff/${eventId}/login``
- [x] **Step 2:** Botón `Boton variante="contorno"` “Copiar enlace de la entrada” (`min-h-11`) → `navigator.clipboard.writeText(url)`. Confirmación breve: “Enlace copiado.”
- [x] **Step 3:** El `<Link>` interno se queda (mismo `href`) para el organizador que prueba en el mismo aparato; el texto visible es la URL absoluta

---

### Task 11: Verificar

- [x] **Step 1:** `npx tsc --noEmit`
- [x] **Step 2:** `npm run lint`
- [x] **Step 3:** `npx vitest run`
- [ ] **Step 4:** Recorrido con sesión: selector agrupado (14 cards, swatches) → Vista (sin confirmar) → Datos (foto + vestimenta) → Invitados (editar, aforo, publicar) → staff copiar URL absoluta → PDF de Picado/Corona/Vitela. Clasica/Vals/Boho miniaturas distintas. (tsc, lint y vitest ya pasan; sin login no se recorrió.)

---

## Fuera de este plan

- Email al organizador al confirmar (Fase 2 de la spec; hace falta proveedor: Resend u otro; no está en el repo)
- Upload a Storage
- Wallet
- Más plantillas o más paletas
- Limpiar columna `events.template_id` (deuda, no bloquea)
- Aforo en staff (ya está en `VistaConteo`)
- WhatsApp, `.ics`, historial de escaneos (ya están)
