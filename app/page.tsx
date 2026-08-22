"use client";
import { useEffect, useMemo, useState } from "react";

type Product = { id: string; name: string; price: number; oldPrice?: number; category: string; description: string; image: string; custom?: boolean; milkshake?: boolean; badge?: string };
type CartItem = Product & { qty: number; extras: string[]; premium: string[]; cutlery: string; topping?: string; notes?: string };

const products: Product[] = [
  { id: "550", name: "Açaí 550ml", price: 24, category: "Açaí", description: "Até 8 adicionais grátis", custom: true, badge: "Mais pedido", image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/acai-hero-premium.png" },
  { id: "combo-amigo", name: "Combo amigo • 2× 500ml", price: 39.6, oldPrice: 44, category: "Combos", description: "Leite condensado e leite em pó. Não permite troca dos adicionais.", badge: "10% OFF", image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202608041757_882C_iblob" },
  { id: "combo-kids", name: "Combo Kids • 2× 300ml", price: 29.99, category: "Combos", description: "Os dois copos devem ser exatamente iguais.", custom: true, image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202607161211_L0SF_iblob" },
  { id: "casal", name: "Combo casal • 2× 550ml", price: 40.48, oldPrice: 46, category: "Combos", description: "Os dois copos devem ser exatamente iguais.", custom: true, badge: "12% OFF", image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202504031513_80HQ_blob" },
  { id: "sorvete-ferrero", name: "Sorvete Ferrero Rocher", price: 17, category: "Sorvetes", description: "300ml, 3 bolas. Escolha sua cobertura.", milkshake: true, image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141629_1KF1_iblob" },
  { id: "sorvete-ovomaltine", name: "Sorvete Ovomaltine", price: 17, category: "Sorvetes", description: "300ml, 3 bolas. Escolha sua cobertura.", milkshake: true, image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141626_68D0_iblob" },
  { id: "sorvete-baunilha", name: "Sorvete de Baunilha Branca", price: 17, category: "Sorvetes", description: "300ml, 3 bolas. Escolha sua cobertura.", milkshake: true, image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202605292039_6353_iblob" },
  { id: "sorvete-morango", name: "Sorvete de Morango", price: 17, category: "Sorvetes", description: "300ml, 3 bolas. Escolha sua cobertura.", milkshake: true, image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141632_NFK8_iblob" },
  { id: "shake-ferrero", name: "Milk-shake Ferrero Rocher", price: 22.5, oldPrice: 25, category: "Milk-shakes", description: "500ml cremoso e refrescante. Escolha sua cobertura.", milkshake: true, badge: "10% OFF", image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/milkshake-ferrero-premium.png" },
  { id: "shake-morango", name: "Milk-shake de Morango", price: 22.5, oldPrice: 25, category: "Milk-shakes", description: "500ml cremoso e refrescante. Escolha sua cobertura.", milkshake: true, badge: "10% OFF", image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/milkshake-morango-premium.png" },
  { id: "shake-baunilha", name: "Milk-shake de Baunilha", price: 22.5, oldPrice: 25, category: "Milk-shakes", description: "500ml cremoso e refrescante. Escolha sua cobertura.", milkshake: true, badge: "10% OFF", image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/milkshake-baunilha-premium.png" },
  { id: "shake-ovomaltine", name: "Milk-shake Ovomaltine", price: 22.5, oldPrice: 25, category: "Milk-shakes", description: "500ml cremoso e refrescante. Escolha sua cobertura.", milkshake: true, badge: "10% OFF", image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/milkshake-ovomaltine-premium.png" },
  { id: "vitamina-300", name: "Vitamina de Açaí 300ml", price: 15, category: "Vitaminas", description: "Cremosa, nutritiva e refrescante.", image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202509061444_ORUW_blob" },
  { id: "vitamina-500", name: "Vitamina de Açaí 500ml", price: 20, category: "Vitaminas", description: "Cremosa, nutritiva e refrescante.", image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141621_D813_iblob" },
  { id: "330", name: "Açaí 330ml", price: 18, category: "Açaí", description: "Até 8 adicionais grátis", custom: true, image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/acai-330-premium.png" },
  { id: "440", name: "Açaí 440ml", price: 22, category: "Açaí", description: "Até 8 adicionais grátis", custom: true, image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/acai-440-premium.png" },
  { id: "770", name: "Açaí 770ml", price: 32, category: "Açaí", description: "Até 8 adicionais grátis", custom: true, image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/acai-770-premium.png" },
  { id: "1l", name: "Açaí 1 litro", price: 48, category: "Açaí", description: "Tamanho família, adicionais grátis", custom: true, image: "https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/acai-1l-premium.png" },
  { id: "especial", name: "Especial Nutella + Ninho", price: 35, category: "Copos prontos", description: "550ml com Nutella e creme de Ninho", image: "https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202506111947_0054_blob" },
];

const free = ["Amendoim", "Banana", "Morango", "Chocoball", "Confete", "Granola", "Granulado", "Leite condensado", "Leite em pó", "Ovomaltine", "Paçoca", "Mousse de Maracujá", "Mousse de Morango"];
const premium = [["Paçoquê", 3], ["Choco-Malte", 4], ["Creme de Ninho", 3.5], ["Nutella", 4]] as const;
const toppings = ["Cobertura de Chocolate", "Cobertura de Morango", "Cobertura de Uva", "Cobertura de Caramelo"];
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function storeStatus() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const weekday = parts.find(p => p.type === "weekday")?.value;
  const hour = Number(parts.find(p => p.type === "hour")?.value || 0);
  const minute = Number(parts.find(p => p.type === "minute")?.value || 0);
  const minutes = hour * 60 + minute;
  if (weekday === "Mon") return { open: false, label: "Fechado hoje" };
  if (minutes < 720) return { open: false, label: "Abre às 12h" };
  if (minutes < 1440) return { open: true, label: "Aberto até 23h59" };
  return { open: false, label: "Fechado agora" };
}

export default function Store() {
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [builder, setBuilder] = useState<Product | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [prem, setPrem] = useState<string[]>([]);
  const [cutlery, setCutlery] = useState("Sem talher");
  const [topping, setTopping] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [notice, setNotice] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryFee, setDeliveryFee] = useState(5);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [cookieOpen, setCookieOpen] = useState(false);
  const [cookieSettings, setCookieSettings] = useState(false);
  const [performanceCookies, setPerformanceCookies] = useState(false);
  const [marketingCookies, setMarketingCookies] = useState(false);
  const [hours, setHours] = useState(storeStatus);
  const [manualClosed, setManualClosed] = useState(false);
  const [cancelledNotice, setCancelledNotice] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("acai24-cookie-preferences");
      if (!saved) setCookieOpen(true);
      else {
        const parsed = JSON.parse(saved) as { performance?: boolean; marketing?: boolean };
        setPerformanceCookies(Boolean(parsed.performance));
        setMarketingCookies(Boolean(parsed.marketing));
      }
    } catch { setCookieOpen(true); }
  }, []);

  useEffect(() => {
    const refresh = () => { if (!manualClosed) setHours(storeStatus()); };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [manualClosed]);

  useEffect(() => {
    fetch("/api/store-status")
      .then(r => r.json())
      .then((data: { is_open?: boolean }) => {
        // `false` é o fechamento manual; `true` devolve o controle ao horário automático.
        const closed = data.is_open === false;
        setManualClosed(closed);
        if (closed) setHours({ open: false, label: "Fechado pela loja" });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancelado") {
      setCancelledNotice(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const categories = ["Todos", "Açaí", "Combos", "Sorvetes", "Milk-shakes", "Vitaminas", "Copos prontos"];

  const shown = useMemo(() => {
    let list = category === "Todos" ? products : products.filter(p => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    return list;
  }, [category, search]);

  const total = useMemo(() => cart.reduce((s, i) => s + (i.price + i.premium.reduce((a, n) => a + (premium.find(p => p[0] === n)?.[1] || 0), 0)) * i.qty, 0), [cart]);
  const toggle = (name: string, list: string[], set: (v: string[]) => void, max = 99) => set(list.includes(name) ? list.filter(x => x !== name) : list.length < max ? [...list, name] : list);
  const open = (p: Product) => { if (p.custom || p.milkshake) { setBuilder(p); setExtras([]); setPrem([]); setCutlery("Sem talher"); setTopping(""); setNotes(""); } else add(p, [], [], "Sem talher"); };
  const add = (p: Product, e: string[], pr: string[], c: string) => { setCart(v => [...v, { ...p, qty: 1, extras: e, premium: pr, cutlery: c, topping: topping || undefined, notes: notes.trim() || undefined }]); setBuilder(null); setCartOpen(true); };
  const changeQty = (i: number, d: number) => setCart(v => v.map((x, n) => n === i ? { ...x, qty: x.qty + d } : x).filter(x => x.qty > 0));

  async function lookupCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
    if (digits.length !== 8) { setAddressHint(""); return; }
    setAddressHint("Buscando seu endereço…");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) throw new Error();
      const suggested = [data.logradouro, data.bairro, data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : data.localidade].filter(Boolean).join(", ");
      setAddress(suggested);
      void quoteDelivery(suggested);
      setAddressHint("✓ Endereço encontrado. Agora informe o número e complemento.");
    } catch { setAddressHint("CEP não encontrado. Você ainda pode preencher o endereço manualmente."); }
  }

  async function quoteDelivery(value: string) {
    try {
      const response = await fetch(`/api/delivery?address=${encodeURIComponent(value)}`);
      const data = await response.json() as { deliveryFeeCents?: number; pickupEnabled?: boolean };
      if (response.ok) {
        setDeliveryFee((data.deliveryFeeCents ?? 0) / 100);
        setPickupEnabled(Boolean(data.pickupEnabled));
      }
    } catch {}
  }

  function saveCookies(performance: boolean, marketing: boolean) {
    localStorage.setItem("acai24-cookie-preferences", JSON.stringify({ essential: true, performance, marketing, updatedAt: new Date().toISOString() }));
    setPerformanceCookies(performance); setMarketingCookies(marketing); setCookieOpen(false); setCookieSettings(false);
  }

  async function pay(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setNotice("Preparando seu pagamento seguro…");
    const fd = new FormData(ev.currentTarget);
    const fullAddress = `${fd.get("address")}, ${fd.get("number")} • CEP ${fd.get("cep")}`;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: { name: fd.get("name"), phone: fd.get("phone"), address: fullAddress },
          cart: cart.map(i => ({ id: i.id, qty: i.qty, premium: i.premium, extras: i.extras, cutlery: i.cutlery, topping: i.topping, notes: i.notes })),
          privacyAccepted: fd.get("privacyAccepted") === "on",
          marketingConsent: fd.get("marketingConsent") === "on",
          deliveryMethod,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Não foi possível iniciar o pagamento.");
      window.location.href = data.url;
    } catch (err) { setNotice(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento."); }
  }

  return <main>
    <header className="top"><div className="store-shell nav2"><a className="logo" href="#"><img src="/logo-acai-24-horas.jpg" alt="Logo Açaí 24 horas" /><b>Açaí 24 horas</b></a><nav><a href="#cardapio">Cardápio</a><a href="#como">Como funciona</a><a href="/pedidos">Pedidos</a><a href="https://instagram.com/acai24horas.pn">Instagram</a></nav><div className={`open-pill ${hours.open ? "is-open" : "is-closed"}`}><i /> {hours.label}</div><button className="cart-btn" onClick={() => setCartOpen(true)}>Sacola <span>{cart.reduce((s, i) => s + i.qty, 0)}</span></button></div></header>

    {cancelledNotice && (
      <div style={{ background: "#fff1cf", color: "#73530d", textAlign: "center", padding: "12px 20px", fontSize: 12, fontWeight: 700 }}>
        Pagamento cancelado. Seus itens ainda estão na sacola. <button style={{ background: "none", border: 0, cursor: "pointer", color: "var(--berry)", fontWeight: 900 }} onClick={() => setCancelledNotice(false)}>✕</button>
      </div>
    )}

    <section className="hero2"><div className="store-shell hero2-grid"><div><div className="micro">DELIVERY ATÉ MEIA-NOITE • PEDIDO MÍNIMO R$ 14</div><h1>Monte seu açaí.<br /><em>Do seu jeito.</em></h1><p>Escolha o tamanho, combine até 8 adicionais grátis e receba a felicidade em forma de açaí.</p><a className="primary" href="#cardapio">Começar meu pedido <span>↓</span></a><div className="proof"><b>4.9 ★</b><span>Mais de 150 clientes satisfeitos</span></div></div><div className="hero-product"><div className="sun" /><img src="https://raw.githubusercontent.com/kaikynzxz/acai24hrs/codex/admin-supabase/public/acai-hero-premium.png" alt="Açaí 550ml com frutas e acompanhamentos" /><div className="float f1"><small>A partir de</small><b>R$ 18</b></div><div className="float f2"><b>8 adicionais</b><small>grátis para escolher</small></div></div></div></section>

    <section className="promise"><div className="promise-track">{[0, 1].map(group => <div className="promise-group" aria-hidden={group === 1} key={group}>{["✦ Açaí cremoso", "✦ Adicionais grátis", "✦ Entrega rápida", "✦ Pagamento seguro"].map(item => <span key={item}>{item}</span>)}</div>)}</div></section>

    <section className="catalog" id="cardapio"><div className="store-shell">
      <div className="section-title">
        <div><small>ESCOLHA SEU FAVORITO</small><h2>O que vai pedir hoje?</h2></div>
        <div className="search">⌕ <input aria-label="Buscar no cardápio" placeholder="Buscar no cardápio" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="tabs">{categories.map(c => <button className={category === c ? "active" : ""} onClick={() => setCategory(c)} key={c}>{c}</button>)}</div>
      {shown.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 24 }}>Nenhum produto encontrado para "<strong>{search}</strong>".</p>}
      <div className="product-grid">{shown.map(p => <article className="product" key={p.id}>{p.badge && <span className="badge">{p.badge}</span>}<div className="photo"><img src={p.image} alt={p.name} /></div><div className="product-body"><small>{p.category}</small><h3>{p.name}</h3><p>{p.description}</p><div><b>{p.oldPrice && <del>{money(p.oldPrice)}</del>}{money(p.price)}</b><button onClick={() => open(p)} aria-label={`Adicionar ${p.name}`}>+</button></div></div></article>)}</div>
    </div></section>

    <section className="how" id="como"><div className="store-shell"><div><small>SEM COMPLICAÇÃO</small><h2>Seu açaí em<br />três passos.</h2></div>{[["01", "Escolha o tamanho", "Do 330ml ao 1 litro."], ["02", "Monte como quiser", "Até 8 adicionais grátis."], ["03", "Receba em casa", "Finalize e acompanhe seu pedido."]].map(x => <article key={x[0]}><b>{x[0]}</b><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></section>

    <section className="store-info"><div className="store-shell"><div><small>INFORMAÇÕES DA LOJA</small><h2>O melhor produto<br />para o melhor cliente.</h2><p>Pedido mínimo de R$ 14,00 • Delivery até 23h59</p></div><article><b>◷ Horários</b><p>Terça a domingo<br /><strong>12h às 23h59</strong></p><em>Segunda-feira: fechado</em></article><article><b>▣ Pagamentos</b><p>Pix, Google Pay, Nubank, cartões online ou na entrega e dinheiro.</p><em>Visa • Mastercard • Elo</em></article></div></section>

    <section className="map-section"><div className="store-shell map-grid"><div><small>COMO CHEGAR</small><h2>Estamos em<br />Ponte Nova.</h2><p>Rua Doutor Pedro Soares Moura, 94<br />Nova Almeida, Ponte Nova - MG<br />CEP 35430-118</p><a className="primary" href="https://maps.google.com/maps?ll=-20.414297,-42.896451&z=16" target="_blank">Abrir rota no Google Maps <span>↗</span></a></div><iframe title="Localização da Açaí 24 Horas no Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=-20.414297,-42.896451&z=16&output=embed" /></div></section>

    <footer><div className="store-shell"><a className="logo" href="#"><img src="/logo-acai-24-horas.jpg" alt="Logo Açaí 24 horas" /><b>Açaí 24 horas</b></a><p>Seu açaí, suas escolhas, sua melhor hora.</p><nav className="privacy-links"><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a><a href="/cookies">Cookies</a><a href="/seus-direitos">Seus direitos</a><button onClick={() => setCookieOpen(true)}>Preferências de cookies</button></nav><a href="https://instagram.com/acai24horas.pn">@acai24horas.pn ↗</a><span className="made-by">Feito por <b>Webly</b></span></div></footer>

    {builder && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setBuilder(null)}><section className="builder" role="dialog" aria-modal="true" aria-label={`Montar ${builder.name}`}><button className="close" onClick={() => setBuilder(null)}>×</button><div className="builder-head"><img src={builder.image} alt="" /><div><small>MONTE DO SEU JEITO</small><h2>{builder.name}</h2><p>{money(builder.price)} • {builder.milkshake ? "escolha 1 cobertura" : "até 8 adicionais grátis"}</p></div></div><div className="builder-scroll">{builder.milkshake ? <>
      <h3>1. Escolha a cobertura <span>{topping ? "1/1" : "0/1"}</span></h3><p>Escolha exatamente uma opção.</p>
      <div className="topping-choices">{toppings.map(x => <label className={topping === x ? "selected" : ""} key={x}><input type="radio" name="topping" value={x} checked={topping === x} onChange={() => setTopping(x)} /><span>{topping === x ? "●" : "○"}</span>{x}</label>)}</div>
      <h3>2. Observações <span>opcional</span></h3>
      <textarea className="product-notes" value={notes} maxLength={300} onChange={e => setNotes(e.target.value)} placeholder="Ex.: sem chantilly, pouca cobertura…" />
      <small className="notes-count">{notes.length}/300</small>
    </> : <>
      <h3>1. Escolha seus adicionais <span>{extras.length}/8</span></h3><p>Selecione até 8 opções grátis.</p>
      <div className="choices">{free.map(x => <button className={extras.includes(x) ? "selected" : ""} onClick={() => toggle(x, extras, setExtras, 8)} key={x}><span>{extras.includes(x) ? "✓" : "+"}</span>{x}</button>)}</div>
      <h3>2. Quer turbinar? <span>opcional</span></h3>
      <div className="choices premium">{premium.map(([x, v]) => <button className={prem.includes(x) ? "selected" : ""} onClick={() => toggle(x, prem, setPrem)} key={x}><span>{prem.includes(x) ? "✓" : "+"}</span><b>{x}</b><em>+ {money(v)}</em></button>)}</div>
      <h3>3. Observações <span>opcional</span></h3>
      <textarea className="product-notes" value={notes} maxLength={300} onChange={e => setNotes(e.target.value)} placeholder="Ex.: pouco leite condensado, extra granola…" />
      <small className="notes-count">{notes.length}/300</small>
      <h3 style={{ marginTop: 20 }}>4. Precisa de talher?</h3>
      <div className="cutlery">{["Quero talher", "Sem talher"].map(x => <button className={cutlery === x ? "selected" : ""} onClick={() => setCutlery(x)} key={x}>{cutlery === x ? "●" : "○"} {x}</button>)}</div>
    </>}</div><div className="builder-foot"><div><small>Total</small><b>{money(builder.price + prem.reduce((s, x) => s + (premium.find(p => p[0] === x)?.[1] || 0), 0))}</b></div><button className="primary" disabled={Boolean(builder.milkshake && !topping)} onClick={() => add(builder, extras, prem, cutlery)}>Adicionar à sacola <span>→</span></button></div></section></div>}

    {cartOpen && <div className="overlay right" onMouseDown={e => e.target === e.currentTarget && setCartOpen(false)}><aside className="cart"><button className="close" onClick={() => setCartOpen(false)}>×</button><h2>Sua sacola <span>{cart.length}</span></h2>{cart.length === 0 ? <div className="empty"><b>♡</b><h3>Sua sacola está vazia</h3><p>Escolha seu açaí favorito para começar.</p><button className="primary" onClick={() => setCartOpen(false)}>Ver cardápio</button></div> : <><div className="cart-items">{cart.map((i, n) => <article key={n}><img src={i.image} alt="" /><div><h3>{i.name}</h3><p>{[i.topping, ...i.extras, ...i.premium, i.notes && `Obs.: ${i.notes}`].filter(Boolean).join(", ") || "Sem adicionais"}</p><b>{money(i.price + i.premium.reduce((s, x) => s + (premium.find(p => p[0] === x)?.[1] || 0), 0))}</b></div><div className="qty"><button onClick={() => changeQty(n, -1)}>−</button><span>{i.qty}</span><button onClick={() => changeQty(n, 1)}>+</button></div></article>)}</div><div className="cart-total"><p><span>Subtotal</span><b>{money(total)}</b></p><small>Taxa de entrega calculada no checkout</small><button className="primary" onClick={() => { setCartOpen(false); setCheckout(true); }} disabled={total < 14}>Continuar para pagamento <span>→</span></button>{total < 14 && <em>O pedido mínimo é R$ 14,00</em>}</div></>}</aside></div>}

    {checkout && <div className="overlay"><section className="checkout" role="dialog" aria-modal="true"><button className="close" onClick={() => setCheckout(false)}>×</button><div><small>ÚLTIMO PASSO</small><h2>Entrega e pagamento</h2></div><form onSubmit={pay}><label>Nome completo<input name="name" required maxLength={120} autoComplete="name" placeholder="Seu nome" /></label><label>WhatsApp<input name="phone" required maxLength={30} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" /></label><label>CEP<input name="cep" required inputMode="numeric" autoComplete="postal-code" value={cep} onChange={e => lookupCep(e.target.value)} placeholder="00000-000" /></label><label>Número e complemento<input name="number" required maxLength={100} placeholder="Ex.: 123, ap. 12" /></label><label className="wide">Endereço de entrega<input name="address" required maxLength={200} autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} onBlur={e => void quoteDelivery(e.currentTarget.value)} placeholder="Digite o CEP para preencher automaticamente" /></label>{addressHint && <p className={`address-hint wide ${addressHint.startsWith("✓") ? "ok" : ""}`}>{addressHint}</p>}<fieldset className="wide"><legend>Entrega ou retirada</legend><label><input type="radio" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} /> <span>🛵</span> Entrega <small>{deliveryFee > 0 ? `Taxa: ${money(deliveryFee)}` : "Taxa grátis"}</small></label>{pickupEnabled && <label><input type="radio" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} /> <span>⌖</span> Retirar na loja <small>Sem taxa</small></label>}</fieldset><fieldset className="wide"><legend>Como quer pagar?</legend><label><input type="radio" name="payment" defaultChecked /> <span>▣</span> Pix <small>Aprovação imediata</small></label><label><input type="radio" name="payment" /> <span>▤</span> Cartão <small>Crédito ou débito</small></label></fieldset><label className="consent wide"><input type="checkbox" name="privacyAccepted" required /><span>Li e aceito os <a href="/termos" target="_blank">Termos</a> e a <a href="/privacidade" target="_blank">Política de Privacidade</a>. Meus dados serão usados para processar e entregar o pedido.</span></label><label className="consent wide optional"><input type="checkbox" name="marketingConsent" /><span>Quero receber promoções pelo WhatsApp. Opcional e revogável a qualquer momento.</span></label>{notice && <p className="notice wide">{notice}</p>}<div className="checkout-total wide"><span>{deliveryMethod === "delivery" ? "Pedido + entrega" : "Total do pedido"}</span><b>{money(total + (deliveryMethod === "delivery" ? deliveryFee : 0))}</b></div><button className="primary wide" type="submit">Pagar com segurança <span>→</span></button></form><small className="secure">🔒 O pagamento é processado pelo provedor financeiro. A loja não armazena os dados completos do cartão.</small></section></div>}

    {cookieOpen && <section className="cookie-banner" role="dialog" aria-modal="true" aria-label="Preferências de cookies"><div><b>Sua privacidade importa</b><p>Usamos armazenamento essencial para o site funcionar. Cookies de desempenho e marketing ficam desligados até você permitir. <a href="/cookies">Saiba mais</a>.</p>{cookieSettings && <div className="cookie-options"><label><input type="checkbox" checked disabled /> Essenciais <small>Sempre ativos</small></label><label><input type="checkbox" checked={performanceCookies} onChange={e => setPerformanceCookies(e.target.checked)} /> Desempenho <small>Opcional</small></label><label><input type="checkbox" checked={marketingCookies} onChange={e => setMarketingCookies(e.target.checked)} /> Marketing <small>Opcional</small></label></div>}</div><div className="cookie-actions">{cookieSettings ? <button onClick={() => saveCookies(performanceCookies, marketingCookies)}>Salvar preferências</button> : <button onClick={() => setCookieSettings(true)}>Configurar</button>}<button onClick={() => saveCookies(false, false)}>Recusar opcionais</button><button className="accept" onClick={() => saveCookies(true, true)}>Aceitar todos</button></div></section>}
  </main>;
}
