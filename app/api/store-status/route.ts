import { supabaseServer } from "../../../lib/supabase";

/** Rota pública — retorna status da loja para o storefront. */
export async function GET() {
  try {
    const { data } = await supabaseServer
      .from("store_settings")
      .select("is_open, opening_hours, store_name")
      .single();
    return Response.json(data ?? { is_open: true });
  } catch {
    return Response.json({ is_open: true });
  }
}
