import { supabaseServer } from "../../../lib/supabase";
import { addDemoOrder } from "../../../lib/demo-store";

const prices: Record<string, { name: string; cents: number }> = {
  "550": { name: "Açaí 550ml", cents: 2400 },
  "combo-amigo": { name: "Combo amigo 2× 500ml", cents: 3960 },
  "combo-kids": { name: "Combo Kids 2× 300ml", cents: 2999 },
  casal: { name: "Combo casal 2× 550ml", cents: 4048 },
  "sorvete-ferrero": { name: "Sorvete Ferrero Rocher", cents: 1700 },
  "sorvete-ovomaltine": { name: "Sorvete Ovomaltine", cents: 1700 },
  "sorvete-baunilha": { name: "Sorvete de Baunilha Branca", cents: 1700 },
  "sorvete-morango": { name: "Sorvete de Morango", cents: 1700 },
  "shake-ferrero": { name: "Milk-shake Ferrero Rocher", cents: 2250 },
  "shake-morango": { name: "Milk-shake de Morango", cents: 2250 },
  "shake-baunilha": { name: "Milk-shake de Baunilha", cents: 2250 },
  "shake-ovomaltine": { name: "Milk-shake Ovomaltine", cents: 2250 },
  "vitamina-300": { name: "Vitamina de Açaí 300ml", cents: 1500 },
  "vitamina-500": { name: "Vitamina de Açaí 500ml", cents: 2000 },
  "330": { name: "Açaí 330ml", cents: 1800 },
  "440": { name: "Açaí 440ml", cents: 2200 },
  "770": { name: "Açaí 770ml", cents: 3200 },
  "1l": { name: "Açaí 1 litro", cents: 4800 },
  especial: { name: "Especial Nutella + Ninho", cents: 3500 },
};
const premium: Record<string, number> = {
  "Paçoquê": 300, "Choco-Malte": 400, "Creme de Ninho": 350, Nutella: 400,
};
type CartItem = {
  id: string; qty: number; premium?: string[]; extras?: string[];
  cutlery?: string; topping?: string; notes?: string;
};
type Input = {
  customer: { name?: string; phone?: string; address?: string };
  cart: CartItem[];
  deliveryMethod?: "delivery" | "pickup";
  privacyAccepted?: boolean;
  marketingConsent?: boolean;
  returnOrigin?: string;
};

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY as string | undefined;
  const isTestMode = process.env.TEST_MODE === "true" || !stripeKey;

  const body = await request.json() as Input;
  if (
    !body.customer?.name || !body.customer.phone || !body.customer.address ||
    !Array.isArray(body.cart) || !body.cart.length
  ) return Response.json({ error: "Confira os dados de entrega e a sacola." }, { status: 400 });

  if (!body.privacyAccepted) {
    return Response.json(
      { error: "É necessário confirmar a Política de Privacidade e os Termos para concluir o pedido." },
      { status: 400 }
    );
  }

  let total = 0;
  let items: Array<{ id: string; qty: number; name: string; unitCents: number; topping?: string; notes?: string; extras?: string[]; premium?: string[] }>;
  const dbResult = await supabaseServer.from("products").select("id,price_cents,sale_price_cents,is_available");
  const dbProducts = new Map((dbResult.error ? [] : dbResult.data ?? []).map(p => [p.id, p]));
  try {
    items = body.cart.map(item => {
      const staticProduct = prices[item.id];
      const saved = dbProducts.get(item.id);
      const product = staticProduct && (!saved || saved.is_available !== false) ? {
        ...staticProduct,
        cents: saved && Number.isFinite(saved.sale_price_cents) && Number(saved.sale_price_cents) < saved.price_cents ? Number(saved.sale_price_cents) : (saved?.price_cents ?? staticProduct.cents),
      } : undefined;
      const qty = Math.max(1, Math.min(20, Number(item.qty) || 1));
      if (!product) throw new Error();
      const needsTopping = item.id.startsWith("shake-") || item.id.startsWith("sorvete-");
      const validToppings = ["Cobertura de Chocolate", "Cobertura de Morango", "Cobertura de Uva", "Cobertura de Caramelo"];
      if (needsTopping && !validToppings.includes(String(item.topping ?? ""))) throw new Error();
      const extras = (item.premium ?? []).reduce((s, x) => s + (premium[x] ?? 0), 0);
      total += (product.cents + extras) * qty;
      return {
        id: item.id, qty, name: product.name,
        topping: needsTopping ? item.topping : undefined,
        notes: String(item.notes ?? "").trim().slice(0, 300) || undefined,
        extras: item.extras ?? [],
        premium: item.premium ?? [],
        unitCents: product.cents + extras,
      };
    });
  } catch {
    return Response.json({ error: "Há um produto inválido ou sem cobertura na sacola." }, { status: 400 });
  }

  const { data: deliveryData } = await supabaseServer
    .from("delivery_settings")
    .select("pickup_enabled,minimum_order_cents,default_fee_cents,zones")
    .eq("id", true)
    .maybeSingle();
  const delivery = deliveryData ?? { pickup_enabled: true, minimum_order_cents: 1400, default_fee_cents: 500, zones: [] };
  const minimumOrder = Math.max(0, Number(delivery.minimum_order_cents) || 1400);
  if (total < minimumOrder) return Response.json({ error: `O pedido mínimo é ${(minimumOrder / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` }, { status: 400 });

  const method = body.deliveryMethod === "pickup" && delivery.pickup_enabled ? "pickup" : "delivery";
  const zones = Array.isArray(delivery.zones) ? delivery.zones as Array<{ name?: string; fee_cents?: number }> : [];
  const address = String(body.customer.address).toLocaleLowerCase("pt-BR");
  const matchedZone = zones.find(zone => address.includes(String(zone.name ?? "").toLocaleLowerCase("pt-BR")));
  const deliveryFeeCents = method === "pickup" ? 0 : Math.max(0, Number(matchedZone?.fee_cents ?? delivery.default_fee_cents) || 0);
  total += deliveryFeeCents;

  const orderId = crypto.randomUUID();
  const requestOrigin = new URL(request.url).origin;
  const allowedReturnOrigins = new Set([requestOrigin, "https://acai-24-horas-pn.vercel.app"]);
  const origin = allowedReturnOrigins.has(String(body.returnOrigin ?? ""))
    ? String(body.returnOrigin) : requestOrigin;

  const newOrderObj = {
    id: orderId,
    customer_name: String(body.customer.name).trim().slice(0, 120),
    customer_phone: String(body.customer.phone).replace(/[^0-9()+ -]/g, "").slice(0, 30),
    delivery_address: String(body.customer.address).trim().slice(0, 300),
    items: { items, deliveryMethod: method, deliveryFeeCents, deliveryZone: matchedZone?.name ?? null, privacyNoticeVersion: "2026-08-20", marketingConsent: Boolean(body.marketingConsent) },
    total_cents: total,
    payment_status: isTestMode ? "paid" : "pending",
    fulfillment_status: "new",
    privacy_accepted: true,
    marketing_consent: Boolean(body.marketingConsent),
    created_at: new Date().toISOString(),
  };

  addDemoOrder(newOrderObj);

  try {
    await supabaseServer.from("orders").insert(newOrderObj);
  } catch {}

  if (isTestMode) {
    return Response.json({ url: `${origin}/pedido-confirmado?pedido=${orderId}` });
  }

  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/pedido-confirmado?pedido=${orderId}`,
    cancel_url: `${origin}/?checkout=cancelado`,
    "metadata[order_id]": orderId,
    "payment_method_types[0]": "card",
    "payment_method_types[1]": "pix",
  });

  items.forEach((item, i) => {
    params.set(`line_items[${i}][quantity]`, String(item.qty));
    params.set(`line_items[${i}][price_data][currency]`, "brl");
    params.set(`line_items[${i}][price_data][unit_amount]`, String(item.unitCents));
    params.set(`line_items[${i}][price_data][product_data][name]`, item.name);
  });
  if (deliveryFeeCents > 0) {
    const i = items.length;
    params.set(`line_items[${i}][quantity]`, "1");
    params.set(`line_items[${i}][price_data][currency]`, "brl");
    params.set(`line_items[${i}][price_data][unit_amount]`, String(deliveryFeeCents));
    params.set(`line_items[${i}][price_data][product_data][name]`, "Taxa de entrega");
  }

  const stripe = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${stripeKey}`, "content-type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const session = await stripe.json() as { id?: string; url?: string; error?: { message?: string } };

  if (!stripe.ok || !session.id || !session.url) {
    return Response.json({ error: session.error?.message ?? "Não foi possível abrir o pagamento." }, { status: 502 });
  }

  try {
    await supabaseServer.from("orders").update({ stripe_session_id: session.id }).eq("id", orderId);
  } catch {}

  return Response.json({ url: session.url });
}
