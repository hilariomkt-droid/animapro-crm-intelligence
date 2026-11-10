'use client';
import {useEffect,useRef,useState} from 'react';
import {browserDb} from '@/lib/supabase';
type Turn={id:string;question:string;answer:string;provider:string;created_at:string};
export default function Chat({initial,provider,org,user}:{initial:Turn[];provider:string;org:string;user:string}){
  const [turns,setTurns]=useState(initial),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [older,setOlder]=useState(initial.length===30),[loading,setLoading]=useState(false);
  const id=useRef(''),end=useRef<HTMLDivElement>(null),scroll=useRef(false);
  useEffect(()=>{if(scroll.current){end.current?.scrollIntoView({block:'nearest'});scroll.current=false;}},[turns]);
  async function send(e:React.FormEvent){
    e.preventDefault();if(busy||!draft.trim())return;
    setBusy(true);setError('');id.current ||= crypto.randomUUID();
    try{
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id.current,question:draft})});
      if(!response.ok)throw new Error();
      const turn=await response.json() as Turn;
      scroll.current=true;setTurns(rows=>[...rows.filter(r=>r.id!==turn.id),turn]);setDraft('');id.current='';
    }catch{setError('Não foi possível receber a resposta. Tente novamente.');}finally{setBusy(false);}
  }
  async function earlier(){
    setLoading(true);
    try{
      const {data,error}=await browserDb().from('brand_chat_turns').select('id,question,answer,provider,created_at').eq('organization_id',org).eq('user_id',user).lt('created_at',turns[0].created_at).order('created_at',{ascending:false}).limit(30);
      if(error)throw error;
      setOlder(data.length===30);setTurns(current=>[...data.reverse(),...current]);
    }catch{setError('Falha ao carregar mensagens anteriores.');}finally{setLoading(false);}
  }
  return <section className="card stack" style={{maxWidth:900}}>
    <p className="muted">Conversa privada da sua conta · {provider}</p>
    {older&&<button className="btn secondary" onClick={earlier} disabled={loading}>Carregar mensagens anteriores</button>}
    {!turns.length&&<div><h2>O que vamos criar para a AnimaPro?</h2><p>Peça um roteiro, uma campanha ou uma abordagem para um cliente.</p></div>}
    {turns.map(turn=><article key={turn.id}><p style={{background:'#f1ebfa',borderRadius:12,padding:14,whiteSpace:'pre-wrap'}}><strong>Você</strong><br/>{turn.question}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}><strong>AnimaPro · {turn.provider}</strong><br/>{turn.answer}</p></article>)}
    <div ref={end}/><form className="stack" onSubmit={send}><label>Mensagem para a AnimaPro<textarea rows={3} maxLength={4000} disabled={busy} className="input" value={draft} onChange={e=>{id.current='';setDraft(e.target.value)}}/></label><button className="btn" disabled={busy||!draft.trim()}>{busy?'Preparando resposta…':'Enviar mensagem'}</button></form>
    {error&&<p role="alert">{error}</p>}
  </section>;
}
