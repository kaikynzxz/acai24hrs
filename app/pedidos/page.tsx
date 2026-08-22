"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const labels: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pagamento confirmado",
  new: "Pedido recebido",
  preparing: "Em preparo",
  delivery: "Saiu para entrega",
  completed: "Entregue com sucesso",
  cancelled: "Pedido cancelado",
  failed: "Pagamento recusado",
  refunded: "Reembolsado",
};

const STEPS = [
  { key: "new", label: "Recebido", icon: "📋" },
  { key: "preparing", label: "Em preparo", icon: "🍧" },
  { key: "delivery", label: "A caminho", icon: "🛵" },
  { key: "completed", label: "Entregue", icon: "✓" },
];

export default function Orders() {
  const [result, setResult] = useState<{ id: string; status: string; totalCents: number; createdAt: number } | null>(null);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillId, setPrefillId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("pedido");
    if (pid) {
      setPrefillId(pid);
    }
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Consultando…");
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const orderId = String(fd.get("orderId") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").replace(/\D/g, "");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch("/api/order-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, phone }),
        signal: controller.signal,
      });
      const data = await res.json() as { order?: typeof result; error?: string };
      if (data.order) {
        setResult(data.order);
        setModalOpen(true);
        setMessage("");
      } else {
        setMessage(data.error ?? "Não foi possível consultar.");
      }
    } catch {
      setMessage("Não foi possível consultar agora. Tente novamente.");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const getStepIndex = (status: string) => {
    if (status === "new" || status === "pending" || status === "paid") return 0;
    if (status === "preparing") return 1;
    if (status === "delivery") return 2;
    if (status === "completed") return 3;
    return -1;
  };

  return (
    <main className="orders-page">
      <section className="orders-card">
        <Link className="logo" href="/">
          <img src="/logo-acai-24-horas.jpg" alt="Logo Açaí 24 horas" />
          <b>Açaí 24 horas</b>
        </Link>
        <small>ACOMPANHE SEU PEDIDO</small>
        <h1>Meus pedidos</h1>
        <p>Digite o código recebido após o pagamento e o WhatsApp usado na compra.</p>
        <form onSubmit={submit}>
          <label>
            Número do pedido
            <input
              name="orderId"
              required
              placeholder="Ex.: 123e4567-e89b…"
              value={prefillId}
              onChange={e => setPrefillId(e.target.value)}
            />
          </label>
          <label>
            WhatsApp
            <input name="phone" required inputMode="tel" placeholder="(00) 00000-0000" />
          </label>
          <button className="primary" type="submit">Consultar pedido <span>→</span></button>
        </form>
        {message && <p role="status" className="order-message">{message}</p>}
        {result && modalOpen && (
          <div
            className="order-modal-backdrop"
            role="presentation"
            onClick={() => setModalOpen(false)}
          >
            <article
              className="order-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Status do pedido"
              onClick={e => e.stopPropagation()}
              style={{ width: "min(460px, 100%)", padding: "34px 28px" }}
            >
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Fechar resultado">×</button>
              <small>STATUS DO PEDIDO</small>
              <code style={{ fontSize: 10 }}>#{result.id}</code>
              
              <h2 style={{ fontSize: 26, margin: "10px 0 6px" }}>{labels[result.status] ?? result.status}</h2>
              <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>Total: <b>{(result.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></p>

              {result.status !== "cancelled" ? (
                <div style={{ margin: "24px 0 28px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", position: "relative", gap: 4 }}>
                  <div style={{ position: "absolute", top: 16, left: "12%", right: "12%", height: 3, background: "#e8ded6", zIndex: 0 }} />
                  <div style={{
                    position: "absolute", top: 16, left: "12%",
                    width: `${Math.max(0, Math.min(100, getStepIndex(result.status) * 28 + 5))}%`,
                    height: 3, background: "var(--purple)", zIndex: 0, transition: "width 0.3s ease"
                  }} />

                  {STEPS.map((step, idx) => {
                    const activeIdx = getStepIndex(result.status);
                    const isDone = idx <= activeIdx;
                    const isCurrent = idx === activeIdx;

                    return (
                      <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: isCurrent ? "var(--purple)" : isDone ? "#6c1f62" : "#fff",
                          color: isCurrent || isDone ? "#d9f46a" : "#b0a5a2",
                          border: `2px solid ${isDone ? "var(--purple)" : "#e8ded6"}`,
                          display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
                          boxShadow: isCurrent ? "0 4px 12px rgba(59, 18, 63, 0.3)" : "none",
                          transition: "all 0.2s ease",
                        }}>
                          {step.icon}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: isCurrent ? 900 : 700, marginTop: 7,
                          color: isCurrent ? "var(--purple)" : isDone ? "var(--ink)" : "var(--muted)",
                        }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ margin: "20px 0", padding: "12px", background: "#fceaea", color: "#a44141", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                  Este pedido foi cancelado.
                </div>
              )}

              <button className="primary" style={{ width: "100%" }} onClick={() => setModalOpen(false)}>Entendi <span>✓</span></button>
            </article>
          </div>
        )}
        <Link className="back-store" href="/">← Voltar ao cardápio</Link>
      </section>
    </main>
  );
}
