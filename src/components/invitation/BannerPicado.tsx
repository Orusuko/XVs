const PUNTOS = [20, 60, 100, 140, 180, 220, 260, 300];
const FLECO = `M0 20h320v6${'l-20 10-20-10'.repeat(8)}V20Z`;

/** Papel picado: franja vino y fleco oro con rombos y cruces recortados. */
export function BannerPicado({
  invertido = false,
  className = 'h-10 w-full',
}: {
  invertido?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 36"
      fill="none"
      aria-hidden="true"
      className={`${className} ${invertido ? 'rotate-180' : ''}`.trim()}
    >
      <path d="M0 0h320v20H0Z" fill="var(--color-vino)" />
      <path d={FLECO} fill="var(--color-oro)" />
      {PUNTOS.map((x) => (
        <g key={x} fill="var(--color-papel)">
          <path d={`M${x} 3l8 8-8 8-8-8Z`} />
          <path d={`M${x - 1} 21h2v3h3v2h-3v3h-2v-3h-3v-2h3Z`} />
        </g>
      ))}
    </svg>
  );
}
