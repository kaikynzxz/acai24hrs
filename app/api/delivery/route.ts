import { supabaseServer } from "../../../lib/supabase";

type Settings = { pickup_enabled: boolean; minimum_order_cents: number; default_fee_cents: number; zones: Array<{ name: string; fee_cents: number }> };
const fallback: Settings = { pickup_enabled: true, minimum_order_cents: 1400, default_fee_cents: 500, zones: [] };

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address")?.toLocaleLowerCase("pt-BR") ?? "";
  const { data } = await supabaseServer.from("delivery_settings").select("pickup_enabled,minimum_order_cents,default_fee_cents,zones").eq("id", true).maybeSingle();
  const settings = (data ?? fallback) as Settings;
  const zones = Array.isArray(settings.zones) ? settings.zones : [];
  const zone = zones.find(z => address.includes(String(z.name).toLocaleLowerCase("pt-BR")));
  return Response.json({
    pickupEnabled: Boolean(settings.pickup_enabled),
    minimumOrderCents: Number(settings.minimum_order_cents) || 1400,
    deliveryFeeCents: Math.max(0, Number(zone?.fee_cents ?? settings.default_fee_cents) || 0),
    matchedZone: zone?.name ?? null,
  });
}
