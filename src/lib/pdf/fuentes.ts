import { Font } from '@react-pdf/renderer';

let registradas = false;

/**
 * Same four families as the web (`layout.tsx`): Great Vibes for the script
 * signature, Fraunces for display type, Karla for body copy, Space Mono for
 * eyebrows and ticket digits. Files live in `public/fonts` (OFL) so the PDF
 * never depends on a CDN being reachable at export time.
 */
export function registrarFuentes() {
  if (registradas) return;
  registradas = true;

  Font.register({ family: 'GreatVibes', src: '/fonts/GreatVibes-Regular.ttf' });
  Font.register({ family: 'Fraunces', src: '/fonts/Fraunces-Variable.ttf' });
  Font.register({ family: 'Karla', src: '/fonts/Karla-Variable.ttf' });
  Font.register({
    family: 'SpaceMono',
    fonts: [
      { src: '/fonts/SpaceMono-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/SpaceMono-Bold.ttf', fontWeight: 700 },
    ],
  });
}
