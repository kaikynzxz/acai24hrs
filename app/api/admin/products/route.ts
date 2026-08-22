import { verifyAdminRequest } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";

export async function GET(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("products")
    .select("id, name, category, price_cents, is_available, sort_order, image_url")
    .order("sort_order");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ products: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { productId?: string; is_available?: boolean } | null;
  if (!body?.productId || typeof body.is_available !== "boolean") {
    return Response.json({ error: "productId e is_available são obrigatórios." }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("products")
    .update({ is_available: body.is_available, updated_at: new Date().toISOString() })
    .eq("id", body.productId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
