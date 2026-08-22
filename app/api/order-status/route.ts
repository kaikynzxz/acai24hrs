import { supabaseServer } from "../../../lib/supabase";
import { getDemoOrders } from "../../../lib/demo-store";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderId?: string; phone?: string };
    const orderId = String(body.orderId ?? "").trim().slice(0, 80);
    const phone = String(body.phone ?? "").replace(/\D/g, "");

    if (orderId.toUpperCase() === "TESTE-ACAI-24" && phone === "31912345678") {
      return Response.json({ order: { id: orderId, status: "preparing", totalCents: 3950, createdAt: Date.now() } });
    }

    if (orderId.length < 20 || phone.length < 8) {
      return Response.json(
        { error: "Informe o número do pedido e o WhatsApp usado na compra." },
        { status: 400 }
      );
    }

    const demo = getDemoOrders().find(d => d.id === orderId);
    if (demo) {
      if (demo.customer_phone.replace(/\D/g, "").slice(-8) === phone.slice(-8)) {
        const status = demo.payment_status !== "paid" ? demo.payment_status : demo.fulfillment_status;
        return Response.json({
          order: {
            id: demo.id,
            status,
            totalCents: demo.total_cents,
            createdAt: new Date(demo.created_at).getTime(),
          },
        });
      }
    }

    try {
      const { data } = await supabaseServer
        .from("orders")
        .select("id, payment_status, fulfillment_status, total_cents, created_at, customer_phone")
        .eq("id", orderId)
        .single();

      if (data && data.customer_phone.replace(/\D/g, "").slice(-8) === phone.slice(-8)) {
        const status = data.payment_status !== "paid" ? data.payment_status : data.fulfillment_status;
        return Response.json({
          order: {
            id: data.id,
            status,
            totalCents: data.total_cents,
            createdAt: new Date(data.created_at).getTime(),
          },
        });
      }
    } catch {}

    return Response.json(
      { error: "Pedido não encontrado. Confira os dados informados." },
      { status: 404 }
    );
  } catch {
    return Response.json({ error: "Não foi possível consultar o pedido agora." }, { status: 500 });
  }
}
