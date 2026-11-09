import Shell from '@/components/Shell';
import {identity} from '@/lib/server';
import {redirect} from 'next/navigation';
import Campaigns from './ui';
export default async function Page(){
  const {user,org,role}=await identity();
  if(!user) redirect('/login');
  return <Shell title="Campanhas e retornos">{org ? <Campaigns org={org} canEdit={['sales','marketing','admin'].includes(role || '')}/> : <p>Aguardando acesso à equipe.</p>}</Shell>;
}
