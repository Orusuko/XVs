import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  htmlRescateHashAuth,
  mapSupabaseAuthError,
  parseAuthCallbackUrl,
  tiposOtpParaTokenHash,
  urlRedireccionAuth,
  type EmailOtpType,
} from '@/lib/auth/callback';

/**
 * Completes organizer login from the email:
 * - `code` → PKCE exchange (same-browser cookies)
 * - `token_hash` + `type` → server-side verifyOtp (skips the hosted Sign In page)
 * - query/hash errors → /admin?error=otp_expired|auth
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseAuthCallbackUrl(request.url);

  if (parsed.kind === 'error') {
    return NextResponse.redirect(urlRedireccionAuth(url.origin, parsed.next, parsed.codigo));
  }

  if (parsed.kind === 'missing') {
    // Fragments like #error=otp_expired never reach this server.
    return new NextResponse(htmlRescateHashAuth(), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
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

  if (parsed.kind === 'pkce') {
    const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
    if (error) {
      return NextResponse.redirect(
        urlRedireccionAuth(url.origin, parsed.next, mapSupabaseAuthError(error)),
      );
    }
    return NextResponse.redirect(urlRedireccionAuth(url.origin, parsed.next));
  }

  let ultimoError: { message?: string; code?: string } | null = null;
  for (const type of tiposOtpParaTokenHash(parsed.type)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: parsed.tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(urlRedireccionAuth(url.origin, parsed.next));
    }
    ultimoError = error;
  }

  return NextResponse.redirect(
    urlRedireccionAuth(url.origin, parsed.next, mapSupabaseAuthError(ultimoError)),
  );
}
