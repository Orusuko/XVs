'use client';

import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';

export function CrearEventoBoton({ etiqueta }: { etiqueta: string }) {
  const router = useRouter();

  return (
    <Boton type="button" className="mt-6" onClick={() => router.push('/admin/evento/nuevo')}>
      {etiqueta}
    </Boton>
  );
}