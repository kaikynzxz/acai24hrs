import { verifyAdminRequest } from "../../../../lib/admin-auth";
import { supabaseServer } from "../../../../lib/supabase";

export async function POST(request: Request) {
  if (!await verifyAdminRequest(request)) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return Response.json({ error: "Envie uma imagem de até 5 MB." }, { status: 400 });
  await supabaseServer.storage.createBucket("product-images", { public: true, fileSizeLimit: "5MB", allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] }).catch(() => undefined);
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const { error } = await supabaseServer.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const { data } = supabaseServer.storage.from("product-images").getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
