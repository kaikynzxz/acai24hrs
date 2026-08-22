import { verifyAdminRequest } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";

const DEFAULT_PRODUCTS = [
  ["550", "Açaí 550ml", "Açaí", 2400], ["330", "Açaí 330ml", "Açaí", 1800], ["440", "Açaí 440ml", "Açaí", 2200], ["770", "Açaí 770ml", "Açaí", 3200], ["1l", "Açaí 1 litro", "Açaí", 4800],
  ["combo-amigo", "Combo amigo • 2× 500ml", "Combos", 3960], ["combo-kids", "Combo Kids • 2× 300ml", "Combos", 2999], ["casal", "Combo casal • 2× 550ml", "Combos", 4048],
  ["sorvete-ferrero", "Sorvete Ferrero Rocher", "Sorvetes", 1700], ["sorvete-ovomaltine", "Sorvete Ovomaltine", "Sorvetes", 1700], ["sorvete-baunilha", "Sorvete de Baunilha Branca", "Sorvetes", 1700], ["sorvete-morango", "Sorvete de Morango", "Sorvetes", 1700],
  ["shake-ferrero", "Milk-shake Ferrero Rocher", "Milk-shakes", 2250], ["shake-morango", "Milk-shake de Morango", "Milk-shakes", 2250], ["shake-baunilha", "Milk-shake de Baunilha", "Milk-shakes", 2250], ["shake-ovomaltine", "Milk-shake Ovomaltine", "Milk-shakes", 2250],
  ["vitamina-300", "Vitamina de Açaí 300ml", "Vitaminas", 1500], ["vitamina-500", "Vitamina de Açaí 500ml", "Vitaminas", 2000], ["especial", "Especial Nutella + Ninho", "Copos prontos", 3500],
] as const;

export async function GET(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let { data, error } = await supabaseServer
    .from("products")
    .select("id, name, category, price_cents, is_available, sort_order, image_url")
    .order("sort_order");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data?.length) {
    const seed = DEFAULT_PRODUCTS.map(([id, name, category, price_cents], sort_order) => ({ id, name, category, price_cents, sort_order: sort_order + 1 }));
    const { error: seedError } = await supabaseServer.from("products").upsert(seed, { onConflict: "id", ignoreDuplicates: true });
    if (seedError) return Response.json({ error: seedError.message }, { status: 500 });
    const refreshed = await supabaseServer
      .from("products")
      .select("id, name, category, price_cents, is_available, sort_order, image_url")
      .order("sort_order");
    data = refreshed.data;
    error = refreshed.error;
  }
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
    .upsert({ id: body.productId, is_available: body.is_available, updated_at: new Date().toISOString() }, { onConflict: "id" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
