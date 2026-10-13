import { describe, expect, test } from 'vitest';
import {
  PLANTILLAS,
  claseTema,
  esTemplateId,
  layoutDe,
  layoutsUnicos,
  plantillasDeLayout,
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
  'picado',
  'corona',
  'charra',
  'retrato',
  'celeste',
  'editorial',
  'vitela',
  'itinerario',
];

describe('catálogo de plantillas', () => {
  test('tiene exactamente 28 diseños con ids únicos', () => {
    expect(PLANTILLAS).toHaveLength(28);
    const ids = PLANTILLAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(28);
    expect(ids.sort()).toEqual([...IDS_ESPERADOS].sort());
  });

  test('cada entrada tiene familia de filtro', () => {
    for (const plantilla of PLANTILLAS) {
      expect(['tradicion', 'jardin', 'gala', 'moderna']).toContain(plantilla.familia);
    }
  });

  test('esTemplateId acepta los 28 y rechaza basura', () => {
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
    expect(layoutDe('picado')).toBe('picado');
    expect(layoutDe('corona')).toBe('corona');
    expect(layoutDe('charra')).toBe('charra');
    expect(layoutDe('retrato')).toBe('retrato');
    expect(layoutDe('celeste')).toBe('celeste');
    expect(layoutDe('editorial')).toBe('editorial');
    expect(layoutDe('vitela')).toBe('vitela');
    expect(layoutDe('itinerario')).toBe('itinerario');
  });

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

  test('claseTema: clasica sin clase; el resto tema-<id>', () => {
    expect(claseTema('clasica')).toBe('');
    expect(claseTema('clasica-salvia')).toBe('tema-clasica-salvia');
    expect(claseTema('jardin')).toBe('tema-jardin');
    expect(claseTema('jardin-menta')).toBe('tema-jardin-menta');
    expect(claseTema('vals-zafiro')).toBe('tema-vals-zafiro');
    expect(claseTema('picado')).toBe('tema-picado');
    expect(claseTema('itinerario')).toBe('tema-itinerario');
  });
});
