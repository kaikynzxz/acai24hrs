import { verifyAdminRequest } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";

type Zone = { name: string; fee_cents: number };

const fallback = {
  id: true,
  pickup_enabled: true,
  minimum_order_cents: 1400,
  default_fee_cents: 500,
  zones: [] as Zone[],
};

function clean(input: unknown) {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const zones = Array.isArray(data.zones) ? data.zones.slice(0, 30).flatMap((zone) => {
    const item = zone && typeof zone === "object" ? zone as Record<string, unknown> : {};
    const name = String(item.name ?? "").trim().slice(0, 80);
    const fee = Math.round(Number(item.fee_cents));
    return name && Number.isFinite(fee) && fee >= 0 && fee <= 50000 ? [{ name, fee_cents: fee }] : [];
  }) : [];
  return {
    id: true,
    pickup_enabled: Boolean(data.pickup_enabled),
    minimum_order_cents: Math.max(0, Math.min(500000, Math.round(Number(data.minimum_order_cents) || 1400))),
    default_fee_cents: Math.max(0, Math.min(50000, Math.round(Number(data.default_fee_cents) || 0))),
    zones,
  };
}

export async function GET(request: Request) {
  if (!await verifyAdminRequest(request)) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const { data, error } = await supabaseServer.from("delivery_settings").select("*").eq("id", true).maybeSingle();
  if (error) return Response.json({ error: error.message, needsSetup: true }, { status: 500 });
  return Response.json({ settings: data ?? fallback, needsSetup: !data });
}

export async function PATCH(request: Request) {
  if (!await verifyAdminRequest(request)) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Dados inválidos." }, { status: 400 });
  const settings = clean(body);
  const { data, error } = await supabaseServer.from("delivery_settings")
    .upsert({ ...settings, updated_at: new Date().toISOString() }, { onConflict: "id" }).select().single();
  if (error) return Response.json({ error: error.message, needsSetup: true }, { status: 500 });
  return Response.json({ settings: data });
}
