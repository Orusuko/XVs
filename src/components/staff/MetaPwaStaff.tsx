/** Hoisted into <head> so the staff shell is installable per event. */
export function MetaPwaStaff({ eventId }: { eventId: string }) {
  return (
    <>
      <link rel="manifest" href={`/staff/${eventId}/manifest.webmanifest`} />
      <meta name="theme-color" content="#2a1424" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    </>
  );
}
