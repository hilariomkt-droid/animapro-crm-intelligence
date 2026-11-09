begin;
alter table public.clients add column if not exists last_video_on date;
create table if not exists public.campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  campaign text not null check(length(campaign) between 1 and 100),
  outcome text not null check(outcome in ('Enviado','Respondeu','Sem interesse','Pediu proposta')),
  created_at timestamptz not null default now()
);
create index if not exists campaign_contacts_client_time on public.campaign_contacts(client_id,created_at desc);
alter table public.campaign_contacts enable row level security;
do $$ begin
if not exists(select from pg_policies where schemaname='public' and tablename='campaign_contacts' and policyname='campaign_team_read') then
create policy campaign_team_read on public.campaign_contacts for select to authenticated using(exists(select 1 from public.memberships m where m.organization_id=campaign_contacts.organization_id and m.user_id=(select auth.uid())));
end if;
if not exists(select from pg_policies where schemaname='public' and tablename='campaign_contacts' and policyname='campaign_team_insert') then
create policy campaign_team_insert on public.campaign_contacts for insert to authenticated with check(exists(select 1 from public.memberships m where m.organization_id=campaign_contacts.organization_id and m.user_id=(select auth.uid()) and m.role in ('admin','marketing','sales')) and exists(select 1 from public.clients c where c.id=campaign_contacts.client_id and c.organization_id=campaign_contacts.organization_id));
end if;
end $$;
grant select,insert on public.campaign_contacts to authenticated;
commit;
