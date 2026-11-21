-- =====================================================================
-- Complaint-Sathi : Supabase schema  (run once on a FRESH project, SQL editor)
-- All writes go through server API routes using the service-role key.
-- Clients only READ, and only through the RLS policies below.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- ---------- enums ----------
create type user_role        as enum ('citizen','department_officer','admin');
create type dept_status      as enum ('draft','pending','changes_requested','approved','active','suspended','deactivated','rejected');
create type complaint_status as enum ('submitted','received','in_progress','resolved','closed','reopened');
create type severity_level   as enum ('low','medium','high','critical');

-- ---------- reference data ----------
create table wards (
  id   serial primary key,
  name text not null unique,
  zone text not null
);
create table categories (
  id               serial primary key,
  slug             text unique not null,
  name             text not null,
  default_severity severity_level not null default 'medium'
);

-- ---------- users ----------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'citizen',
  full_name     text,
  email         text,
  phone         text,
  department_id uuid,
  created_at    timestamptz not null default now()
);

-- ---------- departments ----------
create table departments (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  description             text,
  official_email          text not null,
  official_phone          text,
  applicant_name          text,
  status                  dept_status not null default 'draft',
  source                  text not null check (source in ('applied','admin_created')),
  previous_application_id uuid references departments(id),
  created_by              uuid references profiles(id),
  status_reason           text,
  status_changed_at       timestamptz not null default now(),
  created_at              timestamptz not null default now()
);
-- one live department per official email (rejected/deactivated may reapply)
create unique index departments_email_uq
  on departments (lower(official_email)) where status not in ('rejected','deactivated');
create index departments_status_idx on departments(status);

alter table profiles
  add constraint profiles_department_fk foreign key (department_id) references departments(id);

create table department_wards (
  department_id uuid references departments(id) on delete cascade,
  ward_id       int  references wards(id) on delete cascade,
  primary key (department_id, ward_id)
);
create table department_categories (
  department_id uuid references departments(id) on delete cascade,
  category_id   int  references categories(id) on delete cascade,
  primary key (department_id, category_id)
);
create table department_officers (
  id                uuid primary key default gen_random_uuid(),
  department_id     uuid not null references departments(id) on delete cascade,
  profile_id        uuid references profiles(id),
  name              text not null,
  email             text not null,
  phone             text,
  invite_token_hash text,                -- SHA-256 of the token, never the token
  invite_expires_at timestamptz,
  invite_used_at    timestamptz,
  created_at        timestamptz not null default now()
);
create table department_documents (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name          text not null,
  file_path     text not null,          -- storage path in bucket department-docs
  verified_by   uuid references profiles(id),
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- allowed department state changes
create table dept_transitions (
  from_status dept_status not null,
  to_status   dept_status not null,
  primary key (from_status, to_status)
);
insert into dept_transitions values
 ('draft','pending'),
 ('pending','approved'),('pending','rejected'),('pending','changes_requested'),
 ('changes_requested','pending'),
 ('approved','active'),
 ('active','suspended'),('active','deactivated'),
 ('suspended','active'),('suspended','deactivated');

-- ---------- complaints ----------
create sequence complaint_seq start 1000;
create table complaints (
  id                         uuid primary key default gen_random_uuid(),
  ticket_no                  text unique not null default ('CS-' || nextval('complaint_seq')),
  citizen_id                 uuid not null references profiles(id),
  title                      text not null,
  description                text not null,
  language                   text,
  category_id                int  references categories(id),
  severity                   severity_level not null default 'medium',
  ai_category_id             int  references categories(id),
  ai_severity                severity_level,
  ai_confidence              numeric(4,3),
  ai_reason                  text,
  ai_suggested_department_id uuid references departments(id),
  citizen_changed_suggestion boolean not null default false,
  department_id              uuid not null references departments(id),
  ward_id                    int  references wards(id),
  address                    text,
  lat                        double precision,
  lng                        double precision,
  photo_paths                text[] not null default '{}',
  status                     complaint_status not null default 'submitted',
  sla_due_at                 timestamptz,
  resolution_note            text,
  resolution_photo_paths     text[] not null default '{}',
  resolved_at                timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index complaints_dept_idx    on complaints(department_id, status);
create index complaints_citizen_idx on complaints(citizen_id);
create index complaints_ward_cat_idx on complaints(ward_id, category_id, created_at desc);

create table complaint_events (
  id           bigint generated always as identity primary key,
  complaint_id uuid not null references complaints(id) on delete cascade,
  event        text not null,
  actor_id     uuid,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create table complaint_transfers (
  id                 bigint generated always as identity primary key,
  complaint_id       uuid not null references complaints(id) on delete cascade,
  from_department_id uuid not null references departments(id),
  to_department_id   uuid not null references departments(id),
  admin_id           uuid not null references profiles(id),
  reason             text not null,
  created_at         timestamptz not null default now()
);

-- ---------- forensic audit log (hash chain + Ed25519 signatures) ----------
create table audit_log (
  seq         bigint generated always as identity primary key,
  event_id    uuid not null,
  ts          timestamptz not null,
  actor_id    uuid,
  actor_role  text,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  old_status  text,
  new_status  text,
  reason      text,
  ip          text,
  device      text,
  meta        jsonb not null default '{}'::jsonb,
  prev_hash   text not null,
  record_hash text not null
);
create table audit_keys (
  key_id      text primary key,
  public_key  text not null,              -- base64 / PEM public key
  algorithm   text not null default 'Ed25519',
  fingerprint text not null,
  valid_from  timestamptz not null default now(),
  valid_to    timestamptz,
  revoked_at  timestamptz
);
create table audit_signatures (
  audit_seq bigint primary key references audit_log(seq),
  key_id    text not null references audit_keys(key_id),
  signature text not null,
  signed_at timestamptz not null default now()
);

create or replace function audit_block_mutation() returns trigger language plpgsql as $$
begin raise exception 'AUDIT_APPEND_ONLY'; end $$;
create trigger audit_log_no_update  before update or delete on audit_log
  for each row execute function audit_block_mutation();
create trigger audit_sig_no_update  before update or delete on audit_signatures
  for each row execute function audit_block_mutation();

create or replace function audit_canonical(
  p_event uuid, p_ts timestamptz, p_actor uuid, p_role text, p_action text,
  p_etype text, p_entity uuid, p_old text, p_new text, p_reason text,
  p_ip text, p_device text, p_meta jsonb, p_prev text
) returns text language sql immutable as $$
  select jsonb_build_object(
    'event_id',p_event,
    'ts',to_char(p_ts at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'actor_id',p_actor,'actor_role',p_role,'action',p_action,
    'entity_type',p_etype,'entity_id',p_entity,
    'old_status',p_old,'new_status',p_new,'reason',p_reason,
    'ip',p_ip,'device',p_device,'meta',p_meta,'prev_hash',p_prev
  )::text
$$;

create or replace function write_audit(
  p_actor uuid, p_role text, p_action text, p_etype text, p_entity uuid,
  p_old text, p_new text, p_reason text, p_ip text, p_device text,
  p_meta jsonb default '{}'::jsonb
) returns audit_log language plpgsql security definer
  set search_path = public, extensions as $$
declare v_prev text; v_event uuid := gen_random_uuid(); v_ts timestamptz := clock_timestamp();
        v_canon text; v_hash text; v_row audit_log;
begin
  perform pg_advisory_xact_lock(727001);            -- serialise the chain
  select record_hash into v_prev from audit_log order by seq desc limit 1;
  v_prev  := coalesce(v_prev, repeat('0',64));
  v_canon := audit_canonical(v_event,v_ts,p_actor,p_role,p_action,p_etype,p_entity,
                             p_old,p_new,p_reason,p_ip,p_device,coalesce(p_meta,'{}'::jsonb),v_prev);
  v_hash  := encode(digest(convert_to(v_canon,'UTF8'),'sha256'),'hex');
  insert into audit_log(event_id,ts,actor_id,actor_role,action,entity_type,entity_id,
                        old_status,new_status,reason,ip,device,meta,prev_hash,record_hash)
  values (v_event,v_ts,p_actor,p_role,p_action,p_etype,p_entity,
          p_old,p_new,p_reason,p_ip,p_device,coalesce(p_meta,'{}'::jsonb),v_prev,v_hash)
  returning * into v_row;
  return v_row;
end $$;

-- recompute hash + link for one row (signature is verified in the app)
create or replace function verify_audit(p_seq bigint) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a audit_log; p audit_log; v_hash text; v_prev_ok boolean;
begin
  select * into a from audit_log where seq = p_seq;
  if not found then return jsonb_build_object('found',false); end if;
  v_hash := encode(digest(convert_to(audit_canonical(a.event_id,a.ts,a.actor_id,a.actor_role,
            a.action,a.entity_type,a.entity_id,a.old_status,a.new_status,a.reason,a.ip,a.device,
            a.meta,a.prev_hash),'UTF8'),'sha256'),'hex');
  select * into p from audit_log where seq < p_seq order by seq desc limit 1;
  v_prev_ok := (a.prev_hash = coalesce(p.record_hash, repeat('0',64)));
  return jsonb_build_object('found',true,'hash_ok',v_hash = a.record_hash,'prev_ok',v_prev_ok,
                            'record_hash',a.record_hash,'prev_hash',a.prev_hash);
end $$;

create or replace function verify_audit_chain() returns bigint   -- first broken seq, or null
language plpgsql security definer set search_path = public, extensions as $$
declare r audit_log; v jsonb;
begin
  for r in select * from audit_log order by seq loop
    v := verify_audit(r.seq);
    if not ((v->>'hash_ok')::boolean and (v->>'prev_ok')::boolean) then return r.seq; end if;
  end loop;
  return null;
end $$;

-- ---------- new auth user -> profile (always citizen; roles are set server-side) ----------
create or replace function handle_new_user() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  insert into profiles(id,email,full_name,role)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'citizen')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- business functions (called ONLY from server routes with service role) ----------
create or replace function transition_department(
  p_dept uuid, p_to dept_status, p_actor uuid, p_reason text,
  p_ip text default null, p_device text default null
) returns departments language plpgsql security definer
  set search_path = public, extensions as $$
declare d departments; v_role user_role; v_admins int; v_old text;
begin
  if p_actor is null then
    if not (p_to = 'pending') then raise exception 'ADMIN_ONLY'; end if;   -- applicant resubmission only
  else
    select role into v_role from profiles where id = p_actor;
    if v_role is distinct from 'admin' then raise exception 'ADMIN_ONLY'; end if;
  end if;

  select * into d from departments where id = p_dept for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  if not exists (select 1 from dept_transitions where from_status = d.status and to_status = p_to) then
    raise exception 'ILLEGAL_TRANSITION: % -> %', d.status, p_to;
  end if;

  if (p_to in ('rejected','suspended','deactivated','changes_requested')
      or (d.status = 'suspended' and p_to = 'active'))
     and coalesce(btrim(p_reason),'') = '' then
    raise exception 'REASON_REQUIRED';
  end if;

  if d.status = 'approved' and p_to = 'active' then
    if exists (select 1 from department_documents where department_id = p_dept and verified_at is null) then
      raise exception 'DOCUMENTS_NOT_VERIFIED';
    end if;
    if not exists (select 1 from department_officers where department_id = p_dept) then
      raise exception 'NO_OFFICER';
    end if;
    select count(*) into v_admins from profiles where role = 'admin';
    if v_admins > 1 and d.source = 'admin_created' and d.created_by = p_actor then
      raise exception 'MAKER_CHECKER: another admin must activate';
    end if;
  end if;

  v_old := d.status::text;
  update departments
     set status = p_to, status_reason = p_reason, status_changed_at = now()
   where id = p_dept returning * into d;

  perform write_audit(p_actor, coalesce(v_role::text,'applicant'),
          'DEPARTMENT_' || upper(p_to::text), 'department', p_dept,
          v_old, p_to::text, p_reason, p_ip, p_device, '{}'::jsonb);
  return d;
end $$;

create or replace function suspend_department(
  p_dept uuid, p_actor uuid, p_reason text, p_target uuid,
  p_ip text default null, p_device text default null
) returns int language plpgsql security definer
  set search_path = public, extensions as $$
declare v_open int; v_bad int;
begin
  perform transition_department(p_dept,'suspended',p_actor,p_reason,p_ip,p_device);

  select count(*) into v_open from complaints
   where department_id = p_dept and status not in ('resolved','closed');

  if v_open > 0 then
    if p_target is null or p_target = p_dept then raise exception 'TARGET_REQUIRED'; end if;
    if not exists (select 1 from departments where id = p_target and status = 'active') then
      raise exception 'TARGET_NOT_ACTIVE';
    end if;
    select count(*) into v_bad from complaints c
     where c.department_id = p_dept and c.status not in ('resolved','closed')
       and (not exists (select 1 from department_wards dw where dw.department_id = p_target and dw.ward_id = c.ward_id)
         or not exists (select 1 from department_categories dc where dc.department_id = p_target and dc.category_id = c.category_id));
    if v_bad > 0 then raise exception 'TARGET_DOES_NOT_COVER % complaints', v_bad; end if;

    insert into complaint_transfers(complaint_id,from_department_id,to_department_id,admin_id,reason)
      select id, p_dept, p_target, p_actor, p_reason from complaints
       where department_id = p_dept and status not in ('resolved','closed');
    insert into complaint_events(complaint_id,event,actor_id,meta)
      select id,'transferred_on_suspension',p_actor,
             jsonb_build_object('from',p_dept,'to',p_target) from complaints
       where department_id = p_dept and status not in ('resolved','closed');
    update complaints set department_id = p_target, updated_at = now()
     where department_id = p_dept and status not in ('resolved','closed');

    perform write_audit(p_actor,'admin','COMPLAINTS_TRANSFERRED','department',p_dept,null,null,
            p_reason,p_ip,p_device,jsonb_build_object('count',v_open,'target',p_target));
  end if;
  return v_open;
end $$;

create or replace function create_complaint(
  p_citizen uuid, p_title text, p_description text, p_language text,
  p_category int, p_severity severity_level,
  p_ai_category int, p_ai_severity severity_level, p_ai_conf numeric, p_ai_reason text,
  p_ai_dept uuid, p_department uuid, p_ward int,
  p_address text, p_lat double precision, p_lng double precision, p_photos text[]
) returns complaints language plpgsql security definer
  set search_path = public, extensions as $$
declare c complaints; v_hours int;
begin
  if not exists (select 1 from departments where id = p_department and status = 'active') then
    raise exception 'DEPARTMENT_NOT_ACTIVE';
  end if;
  if not exists (select 1 from department_wards where department_id = p_department and ward_id = p_ward) then
    raise exception 'DEPARTMENT_DOES_NOT_COVER_WARD';
  end if;
  if not exists (select 1 from department_categories where department_id = p_department and category_id = p_category) then
    raise exception 'DEPARTMENT_DOES_NOT_HANDLE_CATEGORY';
  end if;
  v_hours := case p_severity when 'critical' then 6 when 'high' then 24 when 'medium' then 72 else 168 end;

  insert into complaints(citizen_id,title,description,language,category_id,severity,
        ai_category_id,ai_severity,ai_confidence,ai_reason,ai_suggested_department_id,
        citizen_changed_suggestion,department_id,ward_id,address,lat,lng,photo_paths,sla_due_at)
  values (p_citizen,p_title,p_description,p_language,p_category,p_severity,
        p_ai_category,p_ai_severity,p_ai_conf,p_ai_reason,p_ai_dept,
        (p_ai_dept is distinct from p_department),p_department,p_ward,p_address,p_lat,p_lng,
        coalesce(p_photos,'{}'), now() + make_interval(hours => v_hours))
  returning * into c;

  insert into complaint_events(complaint_id,event,actor_id,meta)
  values (c.id,'submitted',p_citizen,jsonb_build_object('department',p_department));
  return c;
end $$;

create or replace function officer_update_complaint(
  p_officer uuid, p_complaint uuid, p_status complaint_status,
  p_note text default null, p_photos text[] default null
) returns complaints language plpgsql security definer
  set search_path = public, extensions as $$
declare c complaints; v_dept uuid;
begin
  select department_id into v_dept from profiles where id = p_officer and role = 'department_officer';
  if v_dept is null then raise exception 'NOT_AN_OFFICER'; end if;
  if not exists (select 1 from departments where id = v_dept and status = 'active') then
    raise exception 'DEPARTMENT_NOT_ACTIVE';
  end if;
  select * into c from complaints where id = p_complaint for update;
  if not found or c.department_id <> v_dept then raise exception 'NOT_FOUND'; end if;
  if p_status = 'resolved' and coalesce(btrim(p_note),'') = '' then raise exception 'RESOLUTION_NOTE_REQUIRED'; end if;

  update complaints set status = p_status, updated_at = now(),
         resolved_at = case when p_status = 'resolved' then now() else resolved_at end,
         resolution_note = coalesce(p_note, resolution_note),
         resolution_photo_paths = coalesce(p_photos, resolution_photo_paths)
   where id = p_complaint returning * into c;
  insert into complaint_events(complaint_id,event,actor_id,meta)
  values (p_complaint,'status_'||p_status::text,p_officer,jsonb_build_object('note',p_note));
  return c;
end $$;

-- lock function execution to the service role
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;

-- ---------- RLS ----------
create or replace function auth_role() returns user_role language sql stable
security definer set search_path = public as $$ select role from profiles where id = auth.uid() $$;
create or replace function auth_dept() returns uuid language sql stable
security definer set search_path = public as $$ select department_id from profiles where id = auth.uid() $$;
create or replace function dept_is_active(p uuid) returns boolean language sql stable
security definer set search_path = public as $$ select exists(select 1 from departments where id = p and status = 'active') $$;
grant execute on function auth_role(), auth_dept(), dept_is_active(uuid) to anon, authenticated, service_role;

alter table wards                 enable row level security;
alter table categories            enable row level security;
alter table profiles              enable row level security;
alter table departments           enable row level security;
alter table department_wards      enable row level security;
alter table department_categories enable row level security;
alter table department_officers   enable row level security;
alter table department_documents  enable row level security;
alter table dept_transitions      enable row level security;
alter table complaints            enable row level security;
alter table complaint_events      enable row level security;
alter table complaint_transfers   enable row level security;
alter table audit_log             enable row level security;
alter table audit_keys            enable row level security;
alter table audit_signatures      enable row level security;

create policy ref_wards      on wards      for select using (true);
create policy ref_categories on categories for select using (true);
create policy dw_read on department_wards      for select using (dept_is_active(department_id) or auth_role() = 'admin');
create policy dc_read on department_categories for select using (dept_is_active(department_id) or auth_role() = 'admin');

create policy profiles_self  on profiles for select using (id = auth.uid() or auth_role() = 'admin');

create policy dept_public_active on departments for select using (status = 'active');
create policy dept_admin_all     on departments for select using (auth_role() = 'admin');
create policy dept_officer_own   on departments for select using (id = auth_dept());

create policy officers_admin on department_officers  for select using (auth_role() = 'admin');
create policy docs_admin     on department_documents for select using (auth_role() = 'admin');

create policy cmp_citizen on complaints for select using (citizen_id = auth.uid());
create policy cmp_officer on complaints for select
  using (auth_role() = 'department_officer' and department_id = auth_dept() and dept_is_active(department_id));
create policy cmp_admin   on complaints for select using (auth_role() = 'admin');

create policy evt_read on complaint_events for select
  using (exists (select 1 from complaints c where c.id = complaint_id));
create policy trf_admin on complaint_transfers for select using (auth_role() = 'admin');
create policy trf_dest  on complaint_transfers for select using (to_department_id = auth_dept() and dept_is_active(to_department_id));

create policy audit_admin_log on audit_log        for select using (auth_role() = 'admin');
create policy audit_admin_key on audit_keys       for select using (auth_role() = 'admin');
create policy audit_admin_sig on audit_signatures for select using (auth_role() = 'admin');

-- ---------- storage buckets (private; use signed URLs from the server) ----------
insert into storage.buckets (id, name, public) values
  ('complaint-photos','complaint-photos',false),
  ('department-docs','department-docs',false)
on conflict (id) do nothing;

-- ---------- seed: categories & wards ----------
insert into categories(slug,name,default_severity) values
 ('roads','Roads, potholes & footpaths','medium'),
 ('water_supply','Water supply & pipeline leaks','high'),
 ('sewerage','Sewerage & drain blockage','high'),
 ('electricity','Electricity & street lighting','high'),
 ('solid_waste','Garbage & solid waste','medium'),
 ('drainage_flood','Stormwater drains & flooding','high'),
 ('parks_trees','Parks, trees & fallen branches','low'),
 ('public_safety','Public safety hazards (open manholes, live wires)','critical'),
 ('other','Other civic issue','low');

insert into wards(name,zone) values
 ('Bellandur','Mahadevapura'),('Whitefield','Mahadevapura'),('Marathahalli','Mahadevapura'),
 ('Koramangala','South'),('HSR Layout','South'),('BTM Layout','South'),('Jayanagar','South'),
 ('Indiranagar','East'),('Malleshwaram','West'),('Rajajinagar','West'),
 ('Yelahanka','North'),('Hebbal','North');

-- ---------- seed: DEMO departments (dev/demo only; production must use the approval workflow) ----------
insert into departments(name,description,official_email,official_phone,status,source,applicant_name) values
 ('Demo Water & Sewerage Department','Water supply and sewerage','water@demo.complaintsathi.test','+910000000001','active','admin_created','Demo Seed'),
 ('Demo Electricity & Street Lighting','Power and street lights','power@demo.complaintsathi.test','+910000000002','active','admin_created','Demo Seed'),
 ('Demo Solid Waste Management','Garbage and waste','waste@demo.complaintsathi.test','+910000000003','active','admin_created','Demo Seed'),
 ('Demo Roads & Public Works','Roads and footpaths','roads@demo.complaintsathi.test','+910000000004','active','admin_created','Demo Seed'),
 ('Demo Drainage & Flood Control','Stormwater and flooding','drain@demo.complaintsathi.test','+910000000005','active','admin_created','Demo Seed'),
 ('Demo Parks & Horticulture','Parks and trees','parks@demo.complaintsathi.test','+910000000006','pending','applied','Demo Applicant'),
 ('Demo Lighting Division (rejected sample)','Sample rejected application','old@demo.complaintsathi.test','+910000000007','rejected','applied','Demo Applicant');

insert into department_wards(department_id, ward_id)
  select d.id, w.id from departments d cross join wards w where d.status = 'active';

insert into department_categories(department_id, category_id)
  select d.id, c.id from departments d join categories c on
    (d.name like '%Water%'    and c.slug in ('water_supply','sewerage','public_safety')) or
    (d.name like '%Electric%' and c.slug in ('electricity','public_safety')) or
    (d.name like '%Waste%'    and c.slug in ('solid_waste','other')) or
    (d.name like '%Roads%'    and c.slug in ('roads','public_safety','other')) or
    (d.name like '%Drainage%' and c.slug in ('drainage_flood','sewerage'))
  where d.status = 'active';

select write_audit(null,'system','SEED_DEPARTMENT_ACTIVE','department',id,null,'active','Demo seed',null,null)
  from departments where status = 'active';

-- ---------- ADMIN ----------
-- 1) Create the admin in Supabase Auth (Dashboard > Authentication > Add user) or with scripts/seed-admin.ts
-- 2) Then promote ONE account (replace the email):
-- update profiles set role = 'admin', full_name = 'Platform Admin' where email = 'YOUR_ADMIN_EMAIL';
