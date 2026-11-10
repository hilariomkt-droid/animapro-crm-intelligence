import {getCloudflareContext} from '@opennextjs/cloudflare';
import {identity} from '@/lib/server';
import {NextResponse} from 'next/server';

type Message = {role:'system'|'user'|'assistant';content:string};
type Bindings = {
  OPENAI_API_KEY?:string;
  AI:{run(model:string,input:{messages:Message[];max_tokens:number}):Promise<{response?:string}>}
};
const instructions = `Você trabalha exclusivamente para a AnimaPro Studio, estúdio brasileiro de comerciais animados para empresas. Fale português do Brasil. Preserve o tom da marca: próximo, criativo e comercial, com frases naturais para WhatsApp. A equipe produz vídeos animados, artes para redes sociais e campanhas sazonais. Ajude com temas, propostas, roteiros em cenas, diálogos, narração separada e retornos comerciais. Para cenas verticais use 1080×1920 quando adequado. Personalize pelo estabelecimento. Use preços, prazos e ofertas somente quando informados pelo usuário. Aproveite as decisões anteriores desta conversa. Você redige e planeja; nunca alegue ter enviado mensagens, publicado materiais, consultado a carteira ou executado ações externas.`;
export async function POST(req:Request){
  if(req.headers.get('origin')!==new URL(req.url).origin)return new Response(null,{status:403});
  const {user,org,db}=await identity();
  if(!user||!org)return new Response(null,{status:403});
  const input=await req.json().catch(()=>null);
  const question=typeof input?.question==='string'?input.question.trim():'';
  if(!question||question.length>4000||typeof input?.id!=='string'||!/^\w{8}-[a-f0-9-]{27}$/i.test(input.id))return new Response(null,{status:400});
  const turns=()=>db.from('brand_chat_turns').select('id,question,answer,provider,created_at').eq('organization_id',org).eq('user_id',user.id);
  const previous=await turns().eq('id',input.id).maybeSingle();
  if(previous.data)return NextResponse.json(previous.data);
  const history=await turns().order('created_at',{ascending:false}).limit(20);
  if(history.error)return NextResponse.json({error:'Não foi possível carregar a conversa.'},{status:503});
  const messages:Message[]=[];
  let chars=0;
  for(const turn of history.data){
    chars+=turn.question.length+turn.answer.length;
    if(chars>24000)break;
    messages.unshift({role:'user',content:turn.question},{role:'assistant',content:turn.answer});
  }
  messages.push({role:'user',content:question});
  try{
    const {env}=await getCloudflareContext({async:true});
    const {OPENAI_API_KEY:key,AI}=env as unknown as Bindings;
    let answer:string|undefined;
    if(key){
      const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',instructions,input:messages,store:false,max_output_tokens:1400})});
      if(!response.ok)throw new Error();
      const data=await response.json() as {output?:{content?:{type:string;text?:string}[]}[]};
      answer=data.output?.flatMap(item=>item.content||[]).filter(part=>part.type==='output_text').map(part=>part.text).join('\n');
    }else{
      answer=(await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast',{messages:[{role:'system',content:instructions},...messages],max_tokens:1200})).response;
    }
    if(!answer?.trim())throw new Error();
    const result=await db.from('brand_chat_turns').insert({id:input.id,organization_id:org,user_id:user.id,question,answer,provider:key?'OpenAI':'Cloudflare AI'}).select('id,question,answer,provider,created_at').single();
    if(result.error){
      const existing=await turns().eq('id',input.id).maybeSingle();
      if(existing.data)return NextResponse.json(existing.data);
      throw new Error();
    }
    return NextResponse.json(result.data);
  }catch{return NextResponse.json({error:'A resposta não pôde ser concluída. Sua mensagem continua no campo para tentar novamente.'},{status:503});}
}
