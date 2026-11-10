import {redirect} from 'next/navigation';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {identity} from '@/lib/server';
import Shell from '@/components/Shell';
import Chat from './ui';
export default async function ChatPage(){
  const {user,org,db}=await identity();
  if(!user)redirect('/login');
  if(!org)return <Shell title="Chat AnimaPro"><p>Aguardando acesso à equipe.</p></Shell>;
  const {data,error}=await db.from('brand_chat_turns').select('id,question,answer,provider,created_at').eq('organization_id',org).eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);
  const {env}=await getCloudflareContext({async:true});
  const provider=(env as {OPENAI_API_KEY?:string}).OPENAI_API_KEY?'OpenAI':'Cloudflare AI';
  return <Shell title="Chat AnimaPro">{error?<p>Não foi possível carregar o histórico. Atualize a página para tentar novamente.</p>:<Chat initial={(data||[]).reverse()} provider={provider} org={org} user={user.id}/>}</Shell>;
}
