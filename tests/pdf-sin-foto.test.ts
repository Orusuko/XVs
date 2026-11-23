import { createElement, type ReactElement } from 'react';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { Font, pdf, type DocumentProps } from '@react-pdf/renderer';
import { InvitationPdf } from '@/lib/pdf/InvitationPdf';
import { cargarFotoParaPdf } from '@/lib/pdf/foto';
import { invitacionMuestra } from '@/lib/templates/muestra';

beforeAll(() => {
  const dir = resolve(process.cwd(), 'public/fonts');
  Font.register({ family: 'GreatVibes', src: resolve(dir, 'GreatVibes-Regular.ttf') });
  Font.register({ family: 'Fraunces', src: resolve(dir, 'Fraunces-Variable.ttf') });
  Font.register({ family: 'Karla', src: resolve(dir, 'Karla-Variable.ttf') });
  Font.register({
    family: 'SpaceMono',
    fonts: [
      { src: resolve(dir, 'SpaceMono-Regular.ttf'), fontWeight: 400 },
      { src: resolve(dir, 'SpaceMono-Bold.ttf'), fontWeight: 700 },
    ],
  });
});

describe('PDF sin foto cuando falla la imagen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('cargarFotoParaPdf devuelve null si la imagen da 404 o error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(await cargarFotoParaPdf('https://ejemplo.invalid/rota.jpg')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    expect(await cargarFotoParaPdf('https://ejemplo.invalid/caida.jpg')).toBeNull();
  });

  test('Mariposas y Retrato generan PDF válido sin foto cuando fotoSrc es null', async () => {
    for (const templateId of ['mariposas', 'retrato'] as const) {
      const invitacion = invitacionMuestra({
        quinceanera_nombre: 'Sofía',
        padre: 'Carlos',
        madre: 'Elena',
        padrinos: [],
        mensaje: null,
        misa: null,
        recepcion: null,
        template_config: {
          plantilla: templateId,
          foto_url: 'https://ejemplo.invalid/no-existe.jpg',
        },
      });

      const doc = createElement(InvitationPdf, {
        invitacion,
        fotoSrc: null,
      }) as unknown as ReactElement<DocumentProps>;
      const stream = await pdf(doc).toBuffer();
      const chunks: Buffer[] = [];
      for await (const chunk of stream as unknown as AsyncIterable<Buffer | Uint8Array>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bytes = Buffer.concat(chunks);
      expect(bytes.subarray(0, 5).toString('utf8')).toBe('%PDF-');
      expect(bytes.length).toBeGreaterThan(500);
    }
  });
});
