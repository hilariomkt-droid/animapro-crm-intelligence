import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function serverDb(){const jar=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return jar.getAll()},setAll(items: {name:string;value:string;options:CookieOptions}[]){try{items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}})}
export async function identity(){const db=await serverDb();const {data:{user}}=await db.auth.getUser();if(!user)return {db,user:null,org:null,role:null};await db.rpc('claim_invitation');const {data:member}=await db.from('memberships').select('organization_id,role').eq('user_id',user.id).limit(1).maybeSingle();return {db,user,org:member?.organization_id??null,role:member?.role??null}}
