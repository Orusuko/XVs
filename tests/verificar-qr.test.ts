import { describe, expect, test, vi } from 'vitest';
import { newJti } from '@/lib/qr/jti';
import { signQrToken } from '@/lib/qr/sign';

const familiaMock = {
  id: 'fam-1',
  nombre_familia: 'García',
  boletos_total: 4,
  qr_jti: null as string | null,
  checked_in: false,
  checked_in_at: null as string | null,
};

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: familiaMock }),
        }),
      }),
    }),
  }),
}));

const { verificarQr } = await import('@/lib/checkin/verificar-qr');

describe('verificarQr', () => {
  test('a stale jti (the family moved on to a newer one) is jti_expirado', async () => {
    const jti = newJti();
    familiaMock.qr_jti = 'a-newer-jti-than-this-one';
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    const resultado = await verificarQr(token, 'ev-1');

    expect(resultado.resultado).toBe('jti_expirado');
  });

  test('a token signed for a different event is invalido', async () => {
    const jti = newJti();
    familiaMock.qr_jti = jti;
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    const resultado = await verificarQr(token, 'otro-evento');

    expect(resultado.resultado).toBe('invalido');
  });

  test('garbage input is invalido, not a thrown error', async () => {
    const resultado = await verificarQr('no-es-un-jwt', 'ev-1');
    expect(resultado.resultado).toBe('invalido');
  });

  test('a live jti on a family already checked in is ya_ingresado', async () => {
    const jti = newJti();
    familiaMock.qr_jti = jti;
    familiaMock.checked_in = true;
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    const resultado = await verificarQr(token, 'ev-1');

    expect(resultado.resultado).toBe('ya_ingresado');
    familiaMock.checked_in = false;
  });

  test('a live jti on a family not yet checked in is listo', async () => {
    const jti = newJti();
    familiaMock.qr_jti = jti;
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    const resultado = await verificarQr(token, 'ev-1');

    expect(resultado.resultado).toBe('listo');
    if (resultado.resultado === 'listo') {
      expect(resultado.familia.nombre_familia).toBe('García');
      expect(resultado.familia.boletos_total).toBe(4);
    }
  });

  test('si ya entró, checked_in gana aunque el jti esté consumido (null)', async () => {
    const jti = newJti();
    familiaMock.qr_jti = null;
    familiaMock.checked_in = true;
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    const resultado = await verificarQr(token, 'ev-1');
    expect(resultado.resultado).toBe('ya_ingresado');
    familiaMock.checked_in = false;
  });

  test('tras deshacer (checked_in false y jti null) el QR viejo es jti_expirado', async () => {
    const jti = newJti();
    familiaMock.qr_jti = null;
    familiaMock.checked_in = false;
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    const resultado = await verificarQr(token, 'ev-1');
    expect(resultado.resultado).toBe('jti_expirado');
  });
});
