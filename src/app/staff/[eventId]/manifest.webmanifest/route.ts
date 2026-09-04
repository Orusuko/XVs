export async function GET(_req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const manifest = {
    name: 'Control de acceso XV años',
    short_name: 'Acceso XV',
    start_url: `/staff/${eventId}/escaner`,
    scope: `/staff/${eventId}/`,
    display: 'standalone',
    background_color: '#2a1424',
    theme_color: '#2a1424',
    orientation: 'portrait',
    icons: [{ src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' }],
  };

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-store',
    },
  });
}
