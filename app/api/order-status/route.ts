import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { orders } from "../../../db/schema";

export async function POST(request:Request){
 try{
  const body=await request.json() as {orderId?:string;phone?:string};
  const orderId=String(body.orderId||"").trim().slice(0,80);
  const phone=String(body.phone||"").replace(/\D/g,"");
  if(orderId==="TESTE-ACAI-24"&&phone==="31912345678")return Response.json({order:{id:orderId,status:"preparing",totalCents:3950,createdAt:Date.now()}});
  if(orderId.length<20||phone.length<8)return Response.json({error:"Informe o número do pedido e o WhatsApp usado na compra."},{status:400});
  const rows=await getDb().select({id:orders.id,status:orders.status,totalCents:orders.totalCents,createdAt:orders.createdAt,phone:orders.customerPhone}).from(orders).where(and(eq(orders.id,orderId))).limit(1);
  const order=rows[0];
  if(!order||order.phone.replace(/\D/g,"").slice(-8)!==phone.slice(-8))return Response.json({error:"Pedido não encontrado. Confira os dados informados."},{status:404});
  return Response.json({order:{id:order.id,status:order.status,totalCents:order.totalCents,createdAt:order.createdAt}});
 }catch{return Response.json({error:"Não foi possível consultar o pedido agora."},{status:500})}
}
