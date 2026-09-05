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
