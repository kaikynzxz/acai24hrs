"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: unknown;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

type Product = { id: string; name: string; category: string; price_cents: number; is_available: boolean; image_url?: string };
type StoreSettings = { is_open: boolean; store_name: string; updated_at: string };

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Aguardando pagamento", paid: "Pago", failed: "Falhou", refunded: "Reembolsado",
};
const FULFILL_LABELS: Record<string, string> = {
  new: "Novo pedido", preparing: "Em preparo", delivery: "Saiu para entrega",
  completed: "Entregue", cancelled: "Cancelado",
};
const NEXT_BTN: Record<string, string> = {
  new: "▶ Iniciar preparo", preparing: "🛵 Saiu para entrega", delivery: "✓ Marcar entregue",
};
const money = (n: number) => (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (s: string) => new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Tom 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tom 2: B5 (987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.18);
    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.error("Erro ao tocar som de notificação:", e);
  }
}

export default function Admin() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("Visão geral");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const knownOrderIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    fetch("/api/admin/auth-check")
      .then(r => { if (!r.ok) router.replace("/admin/login"); else setAuthChecked(true); })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    setLoadError("");
    try {
      const [oRes, sRes, pRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/store"),
        fetch("/api/admin/products"),
      ]);
      if ([oRes, sRes, pRes].some(r => !r.ok)) {
        if ([oRes, sRes, pRes].some(r => r.status === 401)) router.replace("/admin/login");
        throw new Error("Não foi possível carregar os dados do painel.");
      }
      const [oData, sData, pData] = await Promise.all([oRes.json(), sRes.json(), pRes.json()]);
      const fetchedOrders: Order[] = oData.orders ?? [];
    
      if (initialLoadDone.current && soundEnabled) {
        const hasNewArrival = fetchedOrders.some(
          o => o.fulfillment_status === "new" && !knownOrderIds.current.has(o.id)
        );
        if (hasNewArrival) {
          playNotificationChime();
        }
      }

      fetchedOrders.forEach(o => knownOrderIds.current.add(o.id));
      initialLoadDone.current = true;
      setOrders(fetchedOrders);
      setSettings(sData.settings ?? null);
      setProducts(pData.products ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os dados do painel.");
    } finally {
      setLoadingData(false);
    }
  }, [router, soundEnabled]);

  useEffect(() => { if (authChecked) loadAll(); }, [authChecked, loadAll]);

  useEffect(() => {
    if (!authChecked) return;
    const t = setInterval(loadAll, 15_000);
    return () => clearInterval(t);
  }, [authChecked, loadAll]);

  async function advanceStatus(orderId: string) {
    setActionId(orderId);
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, advance: true }),
    });
    await loadAll();
    setActionId(null);
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Cancelar este pedido?")) return;
    setActionId(orderId);
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, fulfillmentStatus: "cancelled" }),
    });
    await loadAll();
    setActionId(null);
  }

  async function toggleStore() {
    if (!settings) return;
    setActionId("store");
    try {
      const response = await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_open: !settings.is_open }),
      });
      const data = await response.json() as { settings?: StoreSettings; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível atualizar a loja.");
      if (data.settings) setSettings(data.settings);
      await loadAll();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível atualizar a loja.");
    } finally {
      setActionId(null);
    }
  }

  async function toggleProduct(productId: string, current: boolean) {
    setActionId(productId);
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, is_available: !current }),
    });
    await loadAll();
    setActionId(null);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!authChecked) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#1d0822" }}>
        <p style={{ color: "#d9f46a", fontWeight: 800, fontSize: 14 }}>Verificando acesso…</p>
      </main>
    );
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
  const todaySales = todayOrders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total_cents, 0);
  const activeOrders = orders.filter(o => ["new", "preparing", "delivery"].includes(o.fulfillment_status) && o.payment_status === "paid");
  const newOrders = activeOrders.filter(o => o.fulfillment_status === "new");
  const pendingPayment = orders.filter(o => o.payment_status === "pending").length;

  const getItems = (o: Order): Array<{ qty: number; name: string; unitCents: number; topping?: string; notes?: string }> => {
    const raw = o.items as { items?: unknown[] } | unknown[];
    if (Array.isArray(raw)) return raw as typeof getItems extends (o: Order) => infer R ? R : never;
    if (Array.isArray((raw as { items?: unknown[] }).items)) return (raw as { items: Array<{ qty: number; name: string; unitCents: number; topping?: string; notes?: string }> }).items;
    return [];
  };

  const getAdvanceButtonStyle = (status: string) => {
    if (status === "new") {
      return {
        background: "linear-gradient(135deg, #3b123f, #6c1f62)",
        color: "#d9f46a",
        border: "1px solid #6c1f62",
        boxShadow: "0 4px 12px rgba(59, 18, 63, 0.25)",
      };
    }
    if (status === "preparing") {
      return {
        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
        color: "#ffffff",
        border: "none",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
      };
    }
    if (status === "delivery") {
      return {
        background: "linear-gradient(135deg, #16a34a, #15803d)",
        color: "#ffffff",
        border: "none",
        boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
      };
    }
    return { background: "var(--purple)", color: "#fff" };
  };

  let body: React.ReactNode;

  if (tab === "Pedidos") {
    const active = orders.filter(o => !["completed", "cancelled"].includes(o.fulfillment_status));
    const done = orders.filter(o => ["completed", "cancelled"].includes(o.fulfillment_status)).slice(0, 20);

    body = (
      <div>
        <div className="admin-panel" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: active.length > 0 ? 18 : 0 }}>
            <h2 style={{ margin: 0 }}>
              Pedidos ativos
              {newOrders.length > 0 && (
                <span style={{ marginLeft: 10, background: "#d9f46a", color: "#1d0822", borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 900 }}>
                  {newOrders.length} novo{newOrders.length > 1 ? "s" : ""}
                </span>
              )}
            </h2>
            <button
              onClick={() => {
                if (!soundEnabled) playNotificationChime();
                setSoundEnabled(!soundEnabled);
              }}
              style={{
                background: soundEnabled ? "#ede0f4" : "#f0e8dc",
                color: soundEnabled ? "var(--berry)" : "var(--muted)",
                border: "1px solid #dcd1c7",
                borderRadius: 99,
                padding: "6px 14px",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {soundEnabled ? "🔔 Som ativado" : "🔕 Som desativado"}
            </button>
          </div>
          {active.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12 }}>Nenhum pedido ativo no momento.</p>
          ) : (
            active.map(order => {
              const isExpanded = expandedOrder === order.id;
              const canAdvance = NEXT_BTN[order.fulfillment_status] && order.payment_status === "paid";
              const btnStyle = getAdvanceButtonStyle(order.fulfillment_status);

              return (
                <div key={order.id} className="admin-order admin-order-action" style={{ flexWrap: "wrap", padding: "18px 0", borderBottom: "1px solid #eee6df" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b style={{ fontSize: 14, color: "var(--purple)" }}>{order.customer_name}</b>
                    <span style={{ fontFamily: "monospace", fontSize: 10, display: "block", color: "var(--muted)", marginTop: 2 }}>#{order.id.slice(0, 8)}</span>
                    <span style={{ fontSize: 9, display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <em style={{
                        fontStyle: "normal", padding: "4px 10px", borderRadius: 99, fontWeight: 900,
                        background: order.payment_status === "paid" ? "#e8f6d2" : "#fff1cf",
                        color: order.payment_status === "paid" ? "#4b6915" : "#73530d",
                      }}>
                        {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                      </em>
                      <em style={{ fontStyle: "normal", padding: "4px 10px", borderRadius: 99, fontWeight: 900, background: "#ede0f4", color: "var(--berry)" }}>
                        {FULFILL_LABELS[order.fulfillment_status] ?? order.fulfillment_status}
                      </em>
                      <span style={{ color: "var(--muted)", display: "flex", alignItems: "center" }}>{fmt(order.created_at)}</span>
                    </span>
                  </div>

                  <strong style={{ fontSize: 16, color: "var(--purple)", fontFamily: "var(--font-jakarta)" }}>
                    {money(order.total_cents)}
                  </strong>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {canAdvance && (
                      <button
                        disabled={actionId === order.id}
                        onClick={() => advanceStatus(order.id)}
                        style={{
                          ...btnStyle,
                          borderRadius: 12,
                          padding: "10px 16px",
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          opacity: actionId === order.id ? 0.6 : 1,
                        }}
                      >
                        {actionId === order.id ? "Atualizando…" : NEXT_BTN[order.fulfillment_status]}
                      </button>
                    )}
                    {order.payment_status === "pending" && (
                      <button
                        onClick={() => advanceStatus(order.id)}
                        style={{
                          background: "linear-gradient(135deg, #16a34a, #15803d)",
                          color: "#fff",
                          border: 0,
                          borderRadius: 12,
                          padding: "10px 14px",
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)",
                        }}
                        title="Marcar como pago manualmente"
                      >
                        ✓ Confirmar pago
                      </button>
                    )}
                    {!["completed", "cancelled"].includes(order.fulfillment_status) && (
                      <button
                        disabled={actionId === order.id}
                        onClick={() => cancelOrder(order.id)}
                        style={{ background: "#fceaea", color: "#a44141", border: 0, borderRadius: 10, padding: "10px 12px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      style={{ background: "#f0e8dc", color: "var(--ink)", border: 0, borderRadius: 10, padding: "10px 14px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}
                    >
                      {isExpanded ? "Fechar ▲" : "Detalhes ▼"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ gridColumn: "1/-1", background: "#f8f2ec", border: "1px solid #e8ded6", borderRadius: 16, padding: "18px", fontSize: 11, lineHeight: 1.8, width: "100%", marginTop: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                          <b style={{ color: "var(--berry)", display: "block", fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>Endereço de Entrega</b>
                          <span>{order.delivery_address}</span>
                        </div>
                        <div>
                          <b style={{ color: "var(--berry)", display: "block", fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>Contato WhatsApp</b>
                          <span>{order.customer_phone}</span>
                        </div>
                      </div>
                      <b style={{ color: "var(--berry)", display: "block", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Itens do Pedido</b>
                      <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink)" }}>
                        {getItems(order).map((item, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>
                            <strong>{item.qty}× {item.name}</strong> — {money((item.unitCents ?? 0) * item.qty)}
                            {item.topping && <span style={{ color: "var(--berry)", display: "block", fontSize: 10 }}>Cobertura: {item.topping}</span>}
                            {item.notes && <span style={{ color: "#7a6750", display: "block", fontSize: 10, fontStyle: "italic" }}>Obs.: {item.notes}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {done.length > 0 && (
          <div className="admin-panel">
            <h2>Histórico recente</h2>
            {done.map(order => (
              <div key={order.id} className="admin-order">
                <div>
                  <b style={{ fontSize: 12 }}>{order.customer_name}</b>
                  <span style={{ fontFamily: "monospace", fontSize: 9 }}>#{order.id.slice(0, 8)} · {fmt(order.created_at)}</span>
                </div>
                <em style={{ fontStyle: "normal", color: order.fulfillment_status === "cancelled" ? "#a44141" : "#4b6915", background: order.fulfillment_status === "cancelled" ? "#fceaea" : "#e8f6d2", padding: "5px 10px", borderRadius: 99, fontSize: 9, fontWeight: 900 }}>
                  {FULFILL_LABELS[order.fulfillment_status]}
                </em>
                <strong style={{ fontSize: 13 }}>{money(order.total_cents)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (tab === "Cardápio") {
    const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
      (acc[p.category] = acc[p.category] ?? []).push(p);
      return acc;
    }, {});
    body = (
      <div className="admin-panel">
        <h2>Disponibilidade de produtos</h2>
        {loadError && <p style={{ color: "#a44141", fontSize: 12 }}>{loadError}</p>}
        {Object.entries(byCategory).map(([cat, prods]) => (
          <div key={cat}>
            <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: "var(--berry)", textTransform: "uppercase", margin: "20px 0 10px" }}>{cat}</p>
            {prods.map(p => (
              <div key={p.id} className="admin-order" style={{ padding: "12px 0" }}>
                <div>
                  <b style={{ fontSize: 12 }}>{p.name}</b>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{money(p.price_cents)}</span>
                </div>
                <button
                  disabled={actionId === p.id}
                  onClick={() => toggleProduct(p.id, p.is_available)}
                  style={{
                    border: 0, borderRadius: 9, padding: "8px 14px", fontSize: 10, fontWeight: 900, cursor: "pointer",
                    background: p.is_available ? "#e8f6d2" : "#fceaea",
                    color: p.is_available ? "#4b6915" : "#a44141",
                    opacity: actionId === p.id ? 0.6 : 1,
                  }}
                >
                  {actionId === p.id ? "…" : p.is_available ? "Disponível" : "Indisponível"}
                </button>
              </div>
            ))}
          </div>
        ))}
        {loadingData && <p style={{ color: "var(--muted)", fontSize: 12 }}>Carregando produtos…</p>}
        {!loadingData && !loadError && products.length === 0 && <p style={{ color: "var(--muted)", fontSize: 12 }}>Nenhum produto cadastrado ainda.</p>}
      </div>
    );
  } else if (tab === "Loja") {
    body = (
      <div className="admin-panel">
        <h2>Status da loja</h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Controle manual para abrir ou fechar a loja. O horário automático (ter–dom 12h–23h59) continua valendo no site, mas este botão sobrepõe o status.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
          <span style={{
            padding: "10px 18px", borderRadius: 99, fontWeight: 900, fontSize: 12,
            background: settings?.is_open ? "#e8f6d2" : "#fceaea",
            color: settings?.is_open ? "#4b6915" : "#a44141",
          }}>
            {settings?.is_open ? "● Aberta agora" : "● Fechada agora"}
          </span>
          <button
            className="primary"
            onClick={toggleStore}
            disabled={actionId === "store"}
            style={{ justifyContent: "center" }}
          >
            {actionId === "store" ? "Atualizando…" : settings?.is_open ? "Fechar loja" : "Abrir loja"}
          </button>
        </div>
        {settings?.updated_at && (
          <small style={{ display: "block", marginTop: 18, color: "var(--muted)", fontSize: 10 }}>
            Última atualização: {fmt(settings.updated_at)}
          </small>
        )}
        <div style={{ marginTop: 30, padding: "16px 0", borderTop: "1px solid #e8ded6" }}>
          <b style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Horário de funcionamento</b>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.8, margin: 0 }}>
            Terça a domingo: <strong>12h às 23h59</strong><br />
            Segunda-feira: fechado
          </p>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        <div className="admin-stats">
          <article><small>VENDAS HOJE</small><b>{money(todaySales)}</b></article>
          <article><small>PEDIDOS ATIVOS</small><b>{activeOrders.length}</b></article>
          <article><small>AGUARD. PAGAMENTO</small><b>{pendingPayment}</b></article>
        </div>

        {newOrders.length > 0 && (
          <div className="admin-panel" style={{ marginBottom: 16, borderLeft: "4px solid #d9f46a" }}>
            <h2>🔔 {newOrders.length} novo{newOrders.length > 1 ? "s pedidos" : " pedido"}</h2>
            {newOrders.slice(0, 3).map(o => (
              <div key={o.id} className="admin-order">
                <div>
                  <b style={{ fontSize: 12 }}>{o.customer_name}</b>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{o.delivery_address.slice(0, 45)}{o.delivery_address.length > 45 ? "…" : ""}</span>
                </div>
                <strong>{money(o.total_cents)}</strong>
                <button
                  onClick={() => { setTab("Pedidos"); setExpandedOrder(o.id); }}
                  style={{ background: "var(--purple)", color: "#fff", border: 0, borderRadius: 9, padding: "9px 13px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}
                >
                  Ver →
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="admin-panel">
          <h2>Últimos pedidos</h2>
          {loadingData ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Carregando…</p> :
            orders.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Nenhum pedido ainda.</p> : (
              orders.slice(0, 8).map(o => (
                <div key={o.id} className="admin-order">
                  <div>
                    <b style={{ fontSize: 12 }}>{o.customer_name}</b>
                    <span style={{ fontFamily: "monospace", fontSize: 9 }}>#{o.id.slice(0, 8)} · {fmt(o.created_at)}</span>
                  </div>
                  <em style={{ fontStyle: "normal", padding: "5px 10px", borderRadius: 99, fontSize: 9, fontWeight: 900, background: "#ede0f4", color: "var(--berry)" }}>
                    {FULFILL_LABELS[o.fulfillment_status] ?? o.fulfillment_status}
                  </em>
                  <strong style={{ fontSize: 13 }}>{money(o.total_cents)}</strong>
                </div>
              ))
            )
          }
        </div>
      </>
    );
  }

  return (
    <main className="admin-shell">
      <aside>
        <Link href="/" className="logo"><b>Açaí 24 horas</b></Link>
        {(["Visão geral", "Pedidos", "Cardápio", "Loja"] as const).map(x => (
          <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x}</button>
        ))}
        <button className="admin-logout" onClick={logout} style={{ marginTop: "auto" }}>Sair</button>
      </aside>
      <section className="admin-content">
        <header>
          <div>
            <small>ADMINISTRAÇÃO</small>
            <h1>{tab}</h1>
          </div>
          <span className="admin-live">● {settings?.is_open ? "Loja aberta" : "Loja fechada"}</span>
        </header>
        {body}
      </section>
    </main>
  );
}
