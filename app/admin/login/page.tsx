"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        router.replace("/admin");
      } else {
        setError(data.error ?? "Erro ao fazer login.");
      }
    } catch {
      setError("Não foi possível conectar ao servidor.");
    }
    setLoading(false);
  }

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <Link href="/" className="logo"><b>Açaí 24 horas</b></Link>
        <small>PAINEL ADMINISTRATIVO</small>
        <h1>Entrar</h1>
        <p>Acesso restrito ao administrador da loja.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            E-mail
            <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" />
          </label>
          <label>
            Senha
            <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </label>
          {error && (
            <p style={{ color: "#a44141", fontSize: 11, margin: 0, padding: "10px 12px", background: "#fceaea", borderRadius: 9 }}>
              {error}
            </p>
          )}
          <button className="primary" type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 4 }}>
            {loading ? "Entrando…" : "Entrar no painel"}
          </button>
        </form>
        <Link href="/" style={{ display: "block", textAlign: "center", marginTop: 22, fontSize: 11, color: "var(--berry)", fontWeight: 800 }}>
          ← Voltar à loja
        </Link>
      </div>
    </main>
  );
}
