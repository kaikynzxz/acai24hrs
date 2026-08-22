import { createAuthClient } from "./supabase";

const ADMIN_UID = "bd6c3942-4ecf-45b4-a438-8e5002aa110a";

/**
 * Extrai o token do cookie cai_admin_token e verifica via Supabase Auth.
 * Retorna true se o token pertence ao administrador da loja.
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/acai_admin_token=([^;]+)/);
  const raw = match?.[1] ?? "";
  const token = decodeURIComponent(raw);
  if (!token) return false;

  try {
    const client = createAuthClient();
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user || user.id !== ADMIN_UID) return false;
    return true;
  } catch {
    return false;
  }
}
