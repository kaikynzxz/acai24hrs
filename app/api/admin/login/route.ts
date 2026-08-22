import { NextResponse } from "next/server";
import { createAuthClient } from "../../../../lib/supabase";

const ADMIN_UID = "bd6c3942-4ecf-45b4-a438-8e5002aa110a";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });

  const client = createAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: body?.email ?? "",
    password: body?.password ?? "",
  });

  if (error || !data.user || data.user.id !== ADMIN_UID) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("acai_admin_token", data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return response;
}
