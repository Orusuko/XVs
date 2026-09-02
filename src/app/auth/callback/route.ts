import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Completes the magic-link PKCE handshake. The verifier lives in this
 * browser's cookies, which is why the email link only works on the same
 * device that requested it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/admin';
  const destino = new URL(next.startsWith('/') ? next : '/admin', url.origin);

  if (!code) {
    destino.searchParams.set('error', 'auth');
    return NextResponse.redirect(destino);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    destino.searchParams.set('error', 'auth');
    return NextResponse.redirect(destino);
  }

  return NextResponse.redirect(destino);
}
