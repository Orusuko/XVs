import type { ReactNode } from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import { NavegacionAdmin } from '@/components/admin/NavegacionAdmin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) return <>{children}</>;

  return (
    <>
      <NavegacionAdmin />
      {children}
    </>
  );
}
