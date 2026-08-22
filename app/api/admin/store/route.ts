import { verifyAdminRequest } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";

export async function GET(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("store_settings")
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}

export async function PATCH(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { is_open?: boolean; store_name?: string } | null;
  if (body === null) return Response.json({ error: "Body inválido." }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.is_open === "boolean") updates.is_open = body.is_open;
  if (typeof body.store_name === "string") updates.store_name = body.store_name.trim().slice(0, 80);

  const { data, error } = await supabaseServer
    .from("store_settings")
    .upsert({ id: true, ...updates }, { onConflict: "id" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, settings: data });
}
