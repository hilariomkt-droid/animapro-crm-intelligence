create table public.brand_chat_turns (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null default auth.uid() references auth.users(id),
  question text not null check(length(question) between 1 and 4000),
  answer text not null,
  provider text not null,
  created_at timestamptz not null default now()
);
create index brand_chat_timeline on public.brand_chat_turns(organization_id,user_id,created_at desc);
alter table public.brand_chat_turns enable row level security;
revoke all on public.brand_chat_turns from anon,authenticated;
grant select,insert on public.brand_chat_turns to authenticated;
create policy chat_read on public.brand_chat_turns for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.memberships m where m.organization_id=brand_chat_turns.organization_id and m.user_id=(select auth.uid())));
create policy chat_write on public.brand_chat_turns for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.memberships m where m.organization_id=brand_chat_turns.organization_id and m.user_id=(select auth.uid())));
