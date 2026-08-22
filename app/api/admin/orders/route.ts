import { verifyAdminRequest } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";
import { getDemoOrders, updateDemoOrder } from "../../../../lib/demo-store";

const NEXT_STATUS: Record<string, string> = {
  new: "preparing",
  preparing: "delivery",
  delivery: "completed",
};

const VALID_STATUSES = ["new", "preparing", "delivery", "completed", "cancelled"];

export async function GET(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  try {
    let query = supabaseServer
      .from("orders")
      .select(
        "id, customer_name, customer_phone, delivery_address, items, total_cents, payment_status, fulfillment_status, created_at, stripe_session_id",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("fulfillment_status", status);

    const { data, error } = await query;
    if (error || !data) throw error;
    
    const demo = getDemoOrders();
    const existingIds = new Set(data.map(o => o.id));
    const extraDemo = demo.filter(d => !existingIds.has(d.id));
    const all = [...data, ...extraDemo];
    return Response.json({ orders: all, total: all.length });
  } catch {
    const demo = getDemoOrders();
    const filtered = status ? demo.filter(d => d.fulfillment_status === status) : demo;
    return Response.json({ orders: filtered, total: filtered.length });
  }
}

export async function PATCH(request: Request) {
  if (!await verifyAdminRequest(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    orderId?: string;
    fulfillmentStatus?: string;
    advance?: boolean;
  } | null;

  if (!body?.orderId) {
    return Response.json({ error: "orderId obrigatório." }, { status: 400 });
  }

  let newStatus = body.fulfillmentStatus;
  const demoOrders = getDemoOrders();
  const demoItem = demoOrders.find(d => d.id === body.orderId);

  if (body.advance) {
    let currentStatus = demoItem?.fulfillment_status;
    if (!currentStatus) {
      const { data } = await supabaseServer
        .from("orders")
        .select("fulfillment_status")
        .eq("id", body.orderId)
        .single();
      currentStatus = data?.fulfillment_status;
    }
    if (!currentStatus) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    newStatus = NEXT_STATUS[currentStatus];
    if (!newStatus) return Response.json({ error: "Pedido já concluído." }, { status: 400 });
  }

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return Response.json({ error: "Status inválido." }, { status: 400 });
  }

  updateDemoOrder(body.orderId, { fulfillment_status: newStatus });

  try {
    await supabaseServer
      .from("orders")
      .update({ fulfillment_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", body.orderId);
  } catch {}

  return Response.json({ ok: true, newStatus });
}
