import type { ReactNode } from 'react';
import { organizadorActual } from '@/lib/organizador';
import { NavegacionAdmin } from '@/components/admin/NavegacionAdmin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actual = await organizadorActual();

  if (!actual) return <>{children}</>;

  return (
    <>
      <NavegacionAdmin />
      {children}
    </>
  );
}
