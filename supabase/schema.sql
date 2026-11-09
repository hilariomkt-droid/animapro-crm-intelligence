-- Execute no SQL Editor do Supabase em um projeto NOVO.
create extension if not exists pgcrypto;
create table public.organizations(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table public.memberships(organization_id uuid not null references public.organizations(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in ('admin','sales','production','marketing','finance')),created_at timestamptz not null default now(),primary key(organization_id,user_id));
create table public.invitations(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,email text not null,role text not null check(role in ('admin','sales','production','marketing','finance')),invited_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(organization_id,email));
create table public.clients(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,name text not null check(length(trim(name))>0),segment text,city text,phone text,email text,instagram text,created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.deals(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,client_id uuid not null references public.clients(id) on delete cascade,title text not null,amount numeric(12,2) not null default 0 check(amount>=0),stage text not null default 'new' check(stage in ('new','contact','proposal','won','lost')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index clients_org_created on public.clients(organization_id,created_at desc);
create index clients_org_name on public.clients(organization_id,name);
create index deals_org_stage on public.deals(organization_id,stage);
create index deals_client on public.deals(client_id);
create or replace function public.is_org_member(org uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.memberships m where m.organization_id=org and m.user_id=(select auth.uid()))$$;
create or replace function public.is_org_admin(org uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.memberships m where m.organization_id=org and m.user_id=(select auth.uid()) and m.role='admin')$$;
create or replace function public.can_sell(org uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.memberships m where m.organization_id=org and m.user_id=(select auth.uid()) and m.role in ('admin','sales','marketing'))$$;
create or replace function public.client_in_org(cid uuid,org uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.clients c where c.id=cid and c.organization_id=org)$$;
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
create trigger clients_updated before update on public.clients for each row execute function public.touch_updated_at();
create trigger deals_updated before update on public.deals for each row execute function public.touch_updated_at();
create or replace function public.validate_deal_client() returns trigger language plpgsql as $$begin if not public.client_in_org(new.client_id,new.organization_id) then raise exception 'Cliente não pertence à organização';end if;return new;end$$;
create trigger deals_same_org before insert or update on public.deals for each row execute function public.validate_deal_client();
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.clients enable row level security;
alter table public.deals enable row level security;
create policy org_read on public.organizations for select to authenticated using(public.is_org_member(id));
create policy member_read on public.memberships for select to authenticated using(public.is_org_member(organization_id));
-- Invitations are managed only by the server using the service role.
create policy clients_read on public.clients for select to authenticated using(public.is_org_member(organization_id));
create policy clients_insert on public.clients for insert to authenticated with check(public.can_sell(organization_id));
create policy clients_update on public.clients for update to authenticated using(public.can_sell(organization_id)) with check(public.can_sell(organization_id));
create policy deals_read on public.deals for select to authenticated using(public.is_org_member(organization_id));
create policy deals_insert on public.deals for insert to authenticated with check(public.can_sell(organization_id) and public.client_in_org(client_id,organization_id));
create policy deals_update on public.deals for update to authenticated using(public.can_sell(organization_id)) with check(public.can_sell(organization_id) and public.client_in_org(client_id,organization_id));
-- Automatic membership activation on accepting a valid invite.
create or replace function public.accept_invitation() returns trigger language plpgsql security definer set search_path='' as $$declare inv record;begin for inv in select id,organization_id,role from public.invitations where lower(email)=lower(new.email) loop insert into public.memberships(organization_id,user_id,role) values(inv.organization_id,new.id,inv.role) on conflict(organization_id,user_id) do nothing;delete from public.invitations where id=inv.id;end loop;return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.accept_invitation();
-- Invited users may already exist; ensure membership after first login as well.
create or replace function public.claim_invitation() returns void language plpgsql security definer set search_path='' as $$declare inv record;begin if auth.uid() is null then raise exception 'Not authenticated';end if;for inv in select id,organization_id,role from public.invitations where lower(email)=lower((select email from auth.users where id=auth.uid())) loop insert into public.memberships(organization_id,user_id,role) values(inv.organization_id,auth.uid(),inv.role) on conflict(organization_id,user_id) do nothing;delete from public.invitations where id=inv.id;end loop;end$$;
grant execute on function public.claim_invitation() to authenticated;
