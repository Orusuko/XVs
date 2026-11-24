import { describe, expect, test } from 'vitest';
import {
  ERROR_INVITACION_NO_PUBLICADA,
  eventoAbiertoAInvitados,
} from '@/lib/invitacion-publica';

describe('eventoAbiertoAInvitados', () => {
  test('solo publicado permite invitados', () => {
    expect(eventoAbiertoAInvitados('publicado')).toBe(true);
    expect(eventoAbiertoAInvitados('borrador')).toBe(false);
    expect(eventoAbiertoAInvitados('cancelado')).toBe(false);
    expect(eventoAbiertoAInvitados(null)).toBe(false);
  });
});

describe('mensaje API', () => {
  test('error de no publicado es estable', () => {
    expect(ERROR_INVITACION_NO_PUBLICADA).toMatch(/no está disponible/i);
  });
});