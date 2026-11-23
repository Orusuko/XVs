import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashPin, verifyPin } from '@/lib/pin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import {
  ORG_COOKIE,
  firmarSesionOrganizador,
  opcionesCookieOrganizador,
} from '@/lib/organizador-token';

export const dynamic = 'force-dynamic';

const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos.';
const MENSAJE_YA_EXISTE = 'Ese correo ya tiene cuenta. Entra con su contraseña.';
const MENSAJE_DEBIL = 'La contraseña debe tener al menos 8 caracteres.';
const MENSAJE_LARGA = 'La contraseña no puede pasar de 72 caracteres.';

// Hash de una clave que no es cuenta. Iguala el tiempo si el correo no existe.
const HASH_VACIO = '$2b$10$jR1uvDhNk5cmEnj0WeFmE.x8ftO66r1.YA7cdSHv1WtnBIxfaZOMW';

function correoDe(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function errorContrasena(valor: unknown): string | null {
  if (typeof valor !== 'string' || valor.length < 8) return MENSAJE_DEBIL;
  if (Buffer.byteLength(valor) > 72) return MENSAJE_LARGA;
  return null;
}

async function responderSesion(id: string, email: string) {
  const token = await firmarSesionOrganizador({ id, email });
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(ORG_COOKIE, token, opcionesCookieOrganizador());
  return respuesta;
}

async function entrar(email: unknown, password: unknown) {
  const correo = correoDe(email);
  const falloClave = errorContrasena(password);
  if (!correo || falloClave || typeof password !== 'string') {
    return NextResponse.json({ error: MENSAJE_CREDENCIALES }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin()
    .from('cuentas')
    .select('id, password_hash')
    .eq('email', correo)
    .maybeSingle<{ id: string; password_hash: string }>();

  if (error) {
    console.error('cuentas.login', error.code);
    return NextResponse.json({ error: 'No pudimos entrar. Inténtalo de nuevo.' }, { status: 500 });
  }

  const coincide = await verifyPin(password, data?.password_hash ?? HASH_VACIO);
  if (!data || !coincide) {
    return NextResponse.json({ error: MENSAJE_CREDENCIALES }, { status: 401 });
  }

  return responderSesion(data.id, correo);
}

async function buscarIdAuthPorCorreo(correo: string): Promise<{ id: string | null; error: boolean }> {
  const admin = supabaseAdmin().auth.admin;
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) {
      console.error('auth.listUsers', error.message);
      return { id: null, error: true };
    }

    const users = data?.users ?? [];
    const encontrado = users.find((u) => u.email?.trim().toLowerCase() === correo);
    if (encontrado) return { id: encontrado.id, error: false };

    if (users.length < perPage) return { id: null, error: false };
  }
}

async function crear(email: unknown, password: unknown) {
  const correo = correoDe(email);
  if (!correo) {
    return NextResponse.json({ error: 'Ese correo no es válido.' }, { status: 400 });
  }

  const falloClave = errorContrasena(password);
  if (falloClave || typeof password !== 'string') {
    return NextResponse.json({ error: falloClave ?? MENSAJE_DEBIL }, { status: 400 });
  }

  const existente = await buscarIdAuthPorCorreo(correo);
  if (existente.error) {
    return NextResponse.json({ error: 'No pudimos crear la cuenta. Inténtalo de nuevo.' }, { status: 500 });
  }

  const passwordHash = await hashPin(password);
  const fila: { id?: string; email: string; password_hash: string } = existente.id
    ? { id: existente.id, email: correo, password_hash: passwordHash }
    : { email: correo, password_hash: passwordHash };

  const { data, error } = await supabaseAdmin()
    .from('cuentas')
    .insert(fila)
    .select('id')
    .single<{ id: string }>();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: MENSAJE_YA_EXISTE }, { status: 409 });
    }
    console.error('cuentas.insert', error.code);
    return NextResponse.json({ error: 'No pudimos crear la cuenta. Inténtalo de nuevo.' }, { status: 500 });
  }

  return responderSesion(data.id, correo);
}

export async function POST(request: Request) {
  const limite = await checkRateLimit(`cuenta:${requestIp(request)}`, 8, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
  }

  let body: { accion?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (body.accion === 'entrar') return entrar(body.email, body.password);
  if (body.accion === 'crear') return crear(body.email, body.password);
  return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
}

export async function DELETE() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(ORG_COOKIE, '', opcionesCookieOrganizador(0));
  return respuesta;
}
