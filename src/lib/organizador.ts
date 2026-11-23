import 'server-only';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ORG_COOKIE, verificarTokenOrganizador } from '@/lib/organizador-token';

/** Cookie válida → cliente service role. El llamador filtra por sesion.id. */
export async function organizadorActual() {
  const raw = (await cookies()).get(ORG_COOKIE)?.value;
  if (!raw) return null;

  const sesion = await verificarTokenOrganizador(raw);
  if (!sesion) return null;

  return { sesion, db: supabaseAdmin() };
}
