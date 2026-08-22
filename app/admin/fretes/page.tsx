"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Zone = { name: string; fee_cents: number };
type Settings = { pickup_enabled: boolean; minimum_order_cents: number; default_fee_cents: number; zones: Zone[] };
const initial: Settings = { pickup_enabled: true, minimum_order_cents: 1400, default_fee_cents: 500, zones: [] };
const moneyInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const parseMoney = (value: string) => Math.round(Number(value.replace(",", ".")) * 100);

export default function FretesAdmin() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(initial);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth-check").then(async r => {
      if (!r.ok) return router.replace("/admin/login");
      const response = await fetch("/api/admin/delivery");
      const data = await response.json();
      if (response.ok && data.settings) setSettings(data.settings);
      else setMessage("Rode o SQL de fretes para ativar o salvamento.");
      setLoaded(true);
    }).catch(() => router.replace("/admin/login"));
  }, [router]);

  async function save() {
    setSaving(true); setMessage("");
    const response = await fetch("/api/admin/delivery", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error ?? "Não foi possível salvar. Rode o SQL de fretes.");
    setSettings(data.settings); setMessage("Fretes salvos. O checkout já usa esses valores.");
  }

  if (!loaded) return <main className="admin-shell" style={{ display: "grid", placeItems: "center" }}><p>Carregando fretes…</p></main>;
  return <main className="admin-shell"><section className="admin-content" style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>
    <Link href="/admin" style={{ color: "var(--berry)", fontWeight: 900, fontSize: 12 }}>← Voltar para o admin</Link>
    <header><div><small>CONFIGURAÇÃO</small><h1>Fretes e entrega</h1></div></header>
    <div className="admin-panel">
      <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>Defina a taxa padrão e, se quiser, valores específicos por bairro. O checkout usa o bairro que vem do CEP/endereço do cliente.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, margin: "20px 0" }}>
        <label style={{ fontSize: 11, fontWeight: 800 }}>Pedido mínimo (R$)<input value={moneyInput(settings.minimum_order_cents)} inputMode="decimal" onChange={e => setSettings(s => ({ ...s, minimum_order_cents: parseMoney(e.target.value) || 0 }))} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 10, border: "1px solid #ded5cd" }} /></label>
        <label style={{ fontSize: 11, fontWeight: 800 }}>Taxa padrão (R$)<input value={moneyInput(settings.default_fee_cents)} inputMode="decimal" onChange={e => setSettings(s => ({ ...s, default_fee_cents: parseMoney(e.target.value) || 0 }))} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 10, border: "1px solid #ded5cd" }} /></label>
        <label style={{ fontSize: 11, fontWeight: 800, display: "flex", alignItems: "end", gap: 8, paddingBottom: 12 }}><input type="checkbox" checked={settings.pickup_enabled} onChange={e => setSettings(s => ({ ...s, pickup_enabled: e.target.checked }))} /> Permitir retirada na loja</label>
      </div>
      <div style={{ borderTop: "1px solid #e8ded6", paddingTop: 18 }}><b style={{ fontSize: 13 }}>Taxas por bairro</b><p style={{ fontSize: 11, color: "var(--muted)" }}>Ex.: Nova Almeida — R$ 4,00. Se não encontrar o bairro, o site cobra a taxa padrão.</p>
        {settings.zones.map((zone, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8, marginBottom: 8 }}><input value={zone.name} placeholder="Nome do bairro" onChange={e => setSettings(s => ({ ...s, zones: s.zones.map((z,n) => n === i ? { ...z, name: e.target.value } : z) }))} style={{ padding: 11, borderRadius: 10, border: "1px solid #ded5cd" }} /><input value={moneyInput(zone.fee_cents)} inputMode="decimal" onChange={e => setSettings(s => ({ ...s, zones: s.zones.map((z,n) => n === i ? { ...z, fee_cents: parseMoney(e.target.value) || 0 } : z) }))} style={{ padding: 11, borderRadius: 10, border: "1px solid #ded5cd" }} /><button onClick={() => setSettings(s => ({ ...s, zones: s.zones.filter((_, n) => n !== i) }))} style={{ border: 0, borderRadius: 9, padding: "0 12px", color: "#a44141", cursor: "pointer" }}>Remover</button></div>)}
        <button onClick={() => setSettings(s => ({ ...s, zones: [...s.zones, { name: "", fee_cents: s.default_fee_cents }] }))} style={{ border: 0, borderRadius: 9, padding: "10px 14px", color: "var(--berry)", fontWeight: 900, cursor: "pointer" }}>+ Adicionar bairro</button>
      </div>
      {message && <p style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#fff1cf", fontSize: 12 }}>{message}</p>}
      <button className="primary" onClick={save} disabled={saving} style={{ marginTop: 18 }}>{saving ? "Salvando…" : "Salvar fretes"}</button>
    </div>
  </section></main>;
}
