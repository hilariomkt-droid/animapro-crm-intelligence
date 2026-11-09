'use client';
import {useEffect,useState} from 'react';
import {browserDb} from '@/lib/supabase';
import modelos from './modelos.json';
import {briefing} from './briefing';

type Client={id:string;name:string;phone:string|null;segment:string|null;last_video_on:string|null};
type Activity={id:string;campaign:string;outcome:string;created_at:string};
const templates:Record<string,string>=modelos;
const states=['Enviado','Respondeu','Pediu proposta','Sem interesse'];
function whatsapp(raw:string|null){
  const digits=(raw || '').replace(/\D/g,'');
  if (/^[1-9]\d{9,10}$/.test(digits)) return '55'+digits;
  return /^55[1-9]\d{9,10}$/.test(digits)?digits:'';
}
export default function Campaigns({org,canEdit}:{org:string;canEdit:boolean}){
  const [clients,setClients]=useState<Client[]>([]),[search,setSearch]=useState(''),[due,setDue]=useState(false);
  const [selected,select]=useState(''),[page,setPage]=useState(0),[more,setMore]=useState(false);
  const [campaign,setCampaign]=useState('Black Friday'),[draft,setDraft]=useState(templates['Black Friday']);
  const [idea,setIdea]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [consent,setConsent]=useState(false),[video,setVideo]=useState(''),[refresh,reload]=useState(0);
  const [history,setHistory]=useState<Activity[]>([]),[outcome,setOutcome]=useState(states[0]),[saving,setSaving]=useState(false);
  const [photo,setPhoto]=useState<File|null>(null);
  const client=clients.find(x=>x.id===selected);
  const text=draft.replaceAll('{empresa}',client?.name || '{empresa}');
  const phone=whatsapp(client?.phone||null);
  const segment=(client?.segment||'').slice(0,120);
  const cutoff=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
  useEffect(()=>{
    let active=true;
    async function load(){
      let query=browserDb().from('clients').select('id,name,phone,segment,last_video_on').eq('organization_id',org);
      if(search.trim()) query=query.ilike('name','%'+search.trim()+'%');
      if(due) query=query.lte('last_video_on',cutoff);
      const {data,error}=await query.order('name').order('id').range(page*50,page*50+50);
      if(!active) return;
      if(error){setNotice('Falha ao carregar clientes: '+error.message);setClients([]);return;}
      const list=(data||[]).slice(0,50);
      setClients(list);setMore((data||[]).length>50);
      select(previous=>list.some(x=>x.id===previous)?previous:list[0]?.id||'');
    }
    void load();return ()=>{active=false};
  },[org,search,due,page,cutoff,refresh]);
  useEffect(()=>{setConsent(false);setIdea('');setVideo(client?.last_video_on||'');},[selected,client?.last_video_on]);
  useEffect(()=>{
    let active=true;setHistory([]);
    if(selected) void browserDb().from('campaign_contacts').select('id,campaign,outcome,created_at').eq('organization_id',org).eq('client_id',selected).order('created_at',{ascending:false}).limit(50).then(({data,error})=>{
      if(active){if(error)setNotice(error.message);else setHistory(data||[]);}
    });
    return ()=>{active=false};
  },[selected,org,refresh]);
  async function generate(){
    setBusy(true);setNotice('');
    try {
      const res=await fetch('/api/sugestoes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campaign,segment})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Falha ao gerar sugestões.');
      setIdea(data.suggestion);
    }catch(err){setNotice(err instanceof Error?err.message:'Falha na conexão.');}finally{setBusy(false);}
  }
  async function copy(){try{await navigator.clipboard.writeText(briefing(campaign,segment));setNotice('Briefing copiado. Cole na conversa do ChatGPT.');}catch{setIdea(briefing(campaign,segment));setNotice('Selecione o texto para copiar.');}}
  async function record(kind:'video'|'outcome'){
    if(!client||saving)return;
    setSaving(true);
    try{
      const db=browserDb();
      const result=kind==='video'?await db.from('clients').update({last_video_on:video}).eq('id',client.id).eq('organization_id',org).select('id').single():
        await db.from('campaign_contacts').insert({client_id:client.id,organization_id:org,campaign,outcome}).select('id').single();
      setNotice(result.error?result.error.message:'Registro salvo.');if(!result.error)reload(n=>n+1);
    }finally{setSaving(false);}
  }
  async function share(){
    if(!photo)return;
    if(!navigator.canShare?.({files:[photo]})){setNotice('Neste aparelho, abra o WhatsApp e anexe a imagem na conversa.');return;}
    try{await navigator.share({files:[photo],text});}catch{setNotice('Compartilhamento encerrado.');}
  }
  return <div className="stack">
    <section className="card stack"><h2>Carteira e retornos</h2>
      <label>Buscar empresa<input className="input" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/></label>
      <label><input type="checkbox" checked={due} onChange={e=>{setDue(e.target.checked);setPage(0)}}/> Último vídeo há 30 dias ou mais</label>
      <label>Cliente<select value={selected} onChange={e=>select(e.target.value)}>{!clients.length&&<option value="">Nenhum cliente encontrado</option>}{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {(more||page>0)&&<div className="row"><button className="btn secondary" disabled={!page} onClick={()=>setPage(page-1)}>Anterior</button><button className="btn secondary" disabled={!more} onClick={()=>setPage(page+1)}>Próxima</button></div>}
      {client&&<div><label>Data do último vídeo<input className="input" type="date" max={new Date().toISOString().slice(0,10)} value={video} onChange={e=>setVideo(e.target.value)}/></label><button className="btn secondary" disabled={!canEdit||!video||video>new Date().toISOString().slice(0,10)||saving} onClick={()=>record('video')}>Salvar data</button></div>}
    </section>
    <section className="card stack"><h2>Planejar campanha</h2><label>Campanha<select disabled={busy} value={campaign} onChange={e=>{setCampaign(e.target.value);setDraft(templates[e.target.value]);setIdea('')}}>{Object.keys(templates).map(c=><option key={c}>{c}</option>)}</select></label>
      <button className="btn" disabled={busy} onClick={generate}>{busy?'Gerando sugestões…':'Sugerir temas e conversas com IA'}</button>
      <div className="row" style={{flexWrap:'wrap'}}><button className="btn secondary" onClick={copy}>Copiar briefing</button><a className="btn secondary" href="https://chatgpt.com/" target="_blank" rel="noreferrer">Abrir meu ChatGPT</a></div>
      {idea&&<label>Sugestões<textarea className="input" rows={8} readOnly value={idea}/></label>}
    </section>
    <section className="card stack"><h2>Disparador AnimaPro</h2><label>Mensagem da campanha<textarea className="input" rows={6} value={draft} onChange={e=>setDraft(e.target.value)}/></label>
      {client&&<p style={{whiteSpace:'pre-wrap'}}>{text}</p>}
      <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> O cliente autorizou o contato.</label>
      {client&&!phone&&<p>Cadastre um WhatsApp brasileiro com DDD para abrir a conversa.</p>}
      {phone&&consent&&text.trim()&&canEdit&&<a className="btn" href={'https://wa.me/'+phone+'?text='+encodeURIComponent(text)} target="_blank" rel="noreferrer">Abrir conversa no WhatsApp</a>}
      <label>Imagem da campanha<input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
      {photo&&<button className="btn secondary" disabled={!consent||!client||!canEdit} onClick={share}>Compartilhar imagem e mensagem</button>}
      <label>Resultado do contato<select value={outcome} onChange={e=>setOutcome(e.target.value)}>{states.map(s=><option key={s}>{s}</option>)}</select></label>
      <button className="btn" disabled={!client||!canEdit||saving} onClick={()=>record('outcome')}>Registrar resultado</button>
      <h3>Histórico do cliente</h3>{history.length?history.map(h=><div key={h.id}>{new Date(h.created_at).toLocaleDateString('pt-BR')} · {h.campaign} · {h.outcome}</div>):<p>Nenhum contato registrado.</p>}
    </section>{notice&&<p role="status" style={{position:'sticky',bottom:0,background:'white',padding:12}}>{notice}</p>}
  </div>;
}
