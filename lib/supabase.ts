import { createClient } from "@supabase/supabase-js";

// Valores inofensivos permitem que o build seja analisado sem segredos. Em
// produção, a Vercel substitui todos eles pelas variáveis do projeto.
const url = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey = process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

/** Cliente público — leitura de produtos e configurações da loja (anon, respeita RLS). */
export const supabase = createClient(url, anonKey);

/** Cliente servidor — ignora RLS; use apenas em rotas de API (nunca no cliente). */
export const supabaseServer = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Cria um cliente anon para verificar tokens de auth sem persistência. */
export function createAuthClient() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
