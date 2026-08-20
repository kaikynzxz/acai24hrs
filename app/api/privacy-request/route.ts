import { getDb } from "../../../db";
import { privacyRequests } from "../../../db/schema";

const allowed=new Set(["acesso","correcao","exclusao","informacoes","revogar-consentimento","outro"]);

export async function POST(request:Request){
 try{
  const body=await request.json() as {name?:string;contact?:string;type?:string;details?:string;privacyAccepted?:boolean};
  const name=String(body.name||"").trim().slice(0,120);
  const contact=String(body.contact||"").trim().slice(0,160);
  const type=String(body.type||"");
  const details=String(body.details||"").trim().slice(0,1500);
  if(!name||contact.length<5||!allowed.has(type)||details.length<10||!body.privacyAccepted)return Response.json({error:"Revise os campos e confirme o aviso de privacidade."},{status:400});
  const now=Date.now();
  await getDb().insert(privacyRequests).values({id:crypto.randomUUID(),requestType:type,requesterName:name,contact,details,status:"received",createdAt:now,retentionUntil:now+5*365*24*60*60*1000});
  return Response.json({ok:true,message:"Solicitação recebida. A loja fará a validação de identidade antes de fornecer ou alterar dados."});
 }catch{return Response.json({error:"Não foi possível registrar a solicitação agora."},{status:500})}
}
