'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECCIONES = [
  { slug: 'conteo', etiqueta: 'Conteo' },
  { slug: 'escaner', etiqueta: 'Escáner' },
  { slug: 'historial', etiqueta: 'Historial' },
];

export function NavegacionStaff({ eventId }: { eventId: string }) {
  const ruta = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 border-t border-papel/15 bg-tinta">
      <ul className="mx-auto flex max-w-lg">
        {SECCIONES.map((seccion) => {
          const href = `/staff/${eventId}/${seccion.slug}`;
          const activa = ruta === href;

          return (
            <li key={seccion.slug} className="flex-1">
              <Link
                href={href}
                aria-current={activa ? 'page' : undefined}
                className={`flex min-h-14 cursor-pointer items-center justify-center text-sm tracking-wide transition-colors duration-200 ${
                  activa ? 'text-oro-claro' : 'text-papel/60 hover:text-papel'
                }`}
              >
                {seccion.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
