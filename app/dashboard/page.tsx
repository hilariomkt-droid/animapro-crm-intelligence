import Shell from '@/components/Shell';
import {identity} from '@/lib/server';
import {redirect} from 'next/navigation';
export default async function Dashboard(){
  const {db,user,org}=await identity();
  if(!user) redirect('/login');
  if(!org) return <Shell title="Aguardando acesso"><div className="card">Sua conta ainda não está vinculada a uma organização.</div></Shell>;
  const cutoff=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
  const [clients,deals,won,returns]=await Promise.all([
    db.from('clients').select('id',{count:'exact',head:true}).eq('organization_id',org),
    db.from('deals').select('amount,stage').eq('organization_id',org),
    db.from('deals').select('id',{count:'exact',head:true}).eq('organization_id',org).eq('stage','won'),
    db.from('campaign_roster').select('id',{count:'exact',head:true}).eq('organization_id',org).lte('last_video_on',cutoff)
  ]);
  const open=(deals.data||[]).filter(x=>!['won','lost'].includes(x.stage));
  const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  return <Shell title="Dashboard"><div className="grid">
    {[['Clientes cadastrados',clients.count??'—'],['Negociações abertas',deals.error?'—':open.length],
      ['Valor em negociação',deals.error?'—':money(open.reduce((sum,deal)=>sum+Number(deal.amount||0),0))],
      ['Vendas concluídas',won.count??'—']].map(([label,value])=><div className="card" key={label}><div className="muted">{label}</div><div className="big">{value}</div></div>)}
    </div><section className="card" style={{marginTop:22}}><h2>Retorno de clientes</h2>
    <p>{returns.error?'Não foi possível consultar os retornos.':`${returns.count??0} cliente(s) com último vídeo registrado há pelo menos 30 dias.`}</p>
    <a className="btn secondary" href="/campanhas">Abrir campanhas e retornos</a></section></Shell>;
}
