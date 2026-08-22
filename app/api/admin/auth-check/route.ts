import { verifyAdminRequest } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true });
}
