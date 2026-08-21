import {NextResponse} from "next/server";

const adminEmail="kaikynzx@gmail.com";
const initialPassword="lFnVliJDw5MvaCKg";

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {email?:string;password?:string}|null;
 if(body?.email?.trim().toLowerCase()!==adminEmail||body.password!==initialPassword)return NextResponse.json({error:"E-mail ou senha incorretos."},{status:401});
 const response=NextResponse.json({ok:true,email:adminEmail});
 response.cookies.set("acai_admin_session","active",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*8});
 return response;
}
