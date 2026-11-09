begin;
create table if not exists public.campaign_videos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  client_id uuid not null references public.clients(id) on delete cascade,
  video_on date not null check(video_on <= current_date),
  created_at timestamptz not null default now()
);
create index if not exists campaign_videos_by_client on public.campaign_videos(client_id,created_at desc,id desc);
alter table public.campaign_videos enable row level security;
revoke all on public.campaign_videos from anon,authenticated;
grant select,insert on public.campaign_videos to authenticated;
create policy videos_team_read on public.campaign_videos for select to authenticated using
  (exists(select 1 from public.memberships m where m.organization_id=campaign_videos.organization_id and m.user_id=(select auth.uid())));
create policy videos_team_insert on public.campaign_videos for insert to authenticated with check
  (exists(select 1 from public.memberships m where m.organization_id=campaign_videos.organization_id and m.user_id=(select auth.uid()) and m.role in ('admin','marketing','sales'))
   and exists(select 1 from public.clients c where c.id=campaign_videos.client_id and c.organization_id=campaign_videos.organization_id));
create or replace view public.campaign_roster with (security_invoker=true) as
select c.id,c.organization_id,c.name,c.phone,c.segment,
  (select v.video_on from public.campaign_videos v where v.client_id=c.id and v.organization_id=c.organization_id order by v.created_at desc,v.id desc limit 1) as last_video_on
from public.clients c;
revoke all on public.campaign_roster from anon,authenticated;
grant select on public.campaign_roster to authenticated;
commit;
