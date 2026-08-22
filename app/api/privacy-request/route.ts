import { supabaseServer } from "../../../lib/supabase";

const ALLOWED_TYPES = new Set(["acesso", "correcao", "exclusao", "informacoes", "revogar-consentimento", "outro"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string; contact?: string; type?: string; details?: string; privacyAccepted?: boolean;
    };

    const name = String(body.name ?? "").trim().slice(0, 120);
    const contact = String(body.contact ?? "").trim().slice(0, 160);
    const type = String(body.type ?? "");
    const details = String(body.details ?? "").trim().slice(0, 1500);

    if (!name || contact.length < 5 || !ALLOWED_TYPES.has(type) || details.length < 10 || !body.privacyAccepted) {
      return Response.json({ error: "Revise os campos e confirme o aviso de privacidade." }, { status: 400 });
    }

    const { error } = await supabaseServer.from("privacy_requests").insert({
      request_type: type,
      requester_name: name,
      contact,
      details,
      status: "received",
    });

    if (error) throw error;

    return Response.json({
      ok: true,
      message: "Solicitação recebida. A loja fará a validação de identidade antes de fornecer ou alterar dados.",
    });
  } catch {
    return Response.json({ error: "Não foi possível registrar a solicitação agora." }, { status: 500 });
  }
}
