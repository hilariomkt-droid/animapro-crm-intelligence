import { getCloudflareContext } from '@opennextjs/cloudflare';
import { identity } from '@/lib/server';
import { NextResponse } from 'next/server';
import { briefing } from '@/app/campanhas/briefing';
type Engine = {run(model:string, input:{messages:{role:string;content:string}[];max_tokens:number}):Promise<{response?:string}>};
export async function POST(req:Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response(null,{status:403});
  const {user,org}=await identity();
  if (!user || !org) return new Response(null,{status:403});
  const body=await req.json().catch(()=>null);
  if (typeof body?.campaign !== 'string' || typeof body?.segment !== 'string' || body.campaign.length>100 || body.segment.length>120) return new Response(null,{status:400});
  try {
    const {env}=await getCloudflareContext({async:true});
    const ai=(env as unknown as {AI:Engine}).AI;
    const result=await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast',{messages:[{role:'user',content:briefing(body.campaign,body.segment)}],max_tokens:550});
    if (!result.response?.trim()) throw new Error();
    return NextResponse.json({suggestion:result.response},{headers:{'Cache-Control':'no-store'}});
  } catch { return NextResponse.json({error:'IA indisponível. Você pode copiar o briefing para o ChatGPT.'},{status:503}); }
}
