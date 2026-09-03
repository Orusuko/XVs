'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

const PASOS = [
  { seg: 'datos', etiqueta: 'Datos' },
  { seg: 'plantilla', etiqueta: 'Plantilla' },
  { seg: 'invitados', etiqueta: 'Invitados' },
] as const;

/** Shared chrome for every authenticated /admin screen: real steps + sign out. */
export function NavegacionAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const coincidencia = pathname.match(/^\/admin\/evento\/([^/]+)/);
  const eventId = coincidencia?.[1] && coincidencia[1] !== 'nuevo' ? coincidencia[1] : null;

  async function salir() {
    await supabaseBrowser().auth.signOut();
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="border-b border-borde bg-papel-alto">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-5 py-3">
        <nav className="flex flex-wrap gap-x-6">
          {eventId ? (
            PASOS.map((paso) => {
              const href = `/admin/evento/${eventId}/${paso.seg}`;
              const activo = pathname.startsWith(href);
              return (
                <Link
                  key={paso.seg}
                  href={href}
                  aria-current={activo ? 'page' : undefined}
                  className={`inline-flex min-h-11 cursor-pointer items-center text-sm underline-offset-4 transition-colors duration-200 ${
                    activo ? 'text-vino underline' : 'text-tinta-suave hover:text-vino'
                  }`}
                >
                  {paso.etiqueta}
                </Link>
              );
            })
          ) : (
            <Link
              href="/admin"
              className="inline-flex min-h-11 cursor-pointer items-center font-ticket text-[11px] uppercase tracking-[0.28em] text-oro"
            >
              Panel del organizador
            </Link>
          )}
        </nav>

        <button
          type="button"
          onClick={salir}
          className="inline-flex min-h-11 cursor-pointer items-center text-sm text-tinta-suave underline underline-offset-4 transition-colors duration-200 hover:text-vino"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
