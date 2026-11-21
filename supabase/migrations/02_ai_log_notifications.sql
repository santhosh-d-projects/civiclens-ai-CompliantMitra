-- Migration 02: AI analysis log (Master Prompt §8.6) + notifications (§10)
create table if not exists ai_analysis_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  ward_id int,
  language text,
  category_slug text,
  severity text,
  confidence numeric(4,3),
  source text not null default 'fallback',
  candidate_count int,
  created_at timestamptz not null default now()
);
alter table ai_analysis_log enable row level security;
create policy ai_log_admin on ai_analysis_log for select using (auth_role() = 'admin');

create table if not exists notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
create policy notif_own on notifications for select using (user_id = auth.uid() or auth_role() = 'admin');
