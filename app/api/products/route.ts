import { supabaseServer } from "../../../lib/supabase";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("products")
    .select("id, price_cents, sale_price_cents, discount_percent, is_available")
    .eq("is_available", true);
  if (error) return Response.json({ products: [] });
  return Response.json({ products: data ?? [] });
}
