-- ClipGen AI schema. Everything lives in its own `clipgen` schema so it cannot collide with
-- other applications in the same Supabase project (tables, functions and policies in `public` are untouched).
-- The only shared objects are one trigger on auth.users (clipgen_on_auth_user_created, which ignores any
-- signup that is not from ClipGen) and the storage bucket `clipgen-media` with prefixed policies.
-- Run once in the SQL editor. Afterwards expose the schema: Settings, API, Exposed schemas, add `clipgen`.

create schema if not exists clipgen;
grant usage on schema clipgen to anon, authenticated, service_role;
set search_path to clipgen, public;


-- ---------------------------------------------------------------- config
create table if not exists app_config (key text primary key, value text not null);
insert into app_config (key, value) values ('signup_credits', '0') on conflict do nothing;
alter table app_config enable row level security; -- no policies: service role only

-- ---------------------------------------------------------------- identity
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_limit_bytes bigint not null default 1073741824,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists idx_members_user on workspace_members(user_id);

create or replace function clipgen.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = clipgen, public as $$
  select exists (select 1 from workspace_members where workspace_id = ws and user_id = auth.uid());
$$;

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_generation boolean not null default true,
  notify_projects boolean not null default true,
  notify_billing boolean not null default true,
  notify_system boolean not null default true,
  default_workspace_id uuid references workspaces(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- projects and media
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  title text not null,
  description text not null default '',
  cover_asset_id uuid,
  status text not null default 'draft' check (status in ('draft','in_progress','review','completed','archived')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_ws on projects(workspace_id, updated_at desc);

create table if not exists media_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  parent_id uuid references media_folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_folders_ws on media_folders(workspace_id);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  project_id uuid references projects(id) on delete set null,
  folder_id uuid references media_folders(id) on delete set null,
  kind text not null check (kind in ('video','image','audio','other')),
  origin text not null check (origin in ('uploaded','generated')),
  name text not null,
  description text not null default '',
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  generation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_path)
);
create index if not exists idx_assets_ws on assets(workspace_id, created_at desc);
create index if not exists idx_assets_project on assets(project_id);

alter table projects add constraint projects_cover_fk foreign key (cover_asset_id) references assets(id) on delete set null;

create or replace view videos with (security_invoker = true) as select * from assets where kind = 'video';
create or replace view images with (security_invoker = true) as select * from assets where kind = 'image';

-- ---------------------------------------------------------------- generations
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  project_id uuid references projects(id) on delete set null,
  type text not null check (type in ('text_to_video','image_to_video','video_to_video','video_edit','image','video_extension','upscale','multi_scene','variation','social')),
  model_id text not null,
  provider text not null,
  prompt text not null,
  negative_prompt text,
  settings jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  error text,
  credit_cost integer not null default 0 check (credit_cost >= 0),
  output_asset_ids uuid[] not null default '{}',
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);
create index if not exists idx_gen_ws on generations(workspace_id, created_at desc);
create index if not exists idx_gen_project on generations(project_id);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations(id) on delete cascade,
  provider text not null,
  provider_job_id text,
  status text not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  api_cost_usd numeric(10,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_jobs_gen on generation_jobs(generation_id);

-- ---------------------------------------------------------------- prompts, storyboards, scenes
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  body text not null,
  category text not null default 'Cinematic',
  notes text not null default '',
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_prompts_ws on prompts(workspace_id);

create table if not exists prompt_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  body text not null,
  variables text[] not null default '{}',
  category text not null default 'Cinematic',
  created_at timestamptz not null default now()
);

create table if not exists storyboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  brief text not null default '',
  concept text not null default '',
  visual_direction text not null default '',
  camera_direction text not null default '',
  style_notes text not null default '',
  status text not null default 'draft' check (status in ('draft','in_progress','review','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_storyboards_ws on storyboards(workspace_id);

create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  storyboard_id uuid not null references storyboards(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  position integer not null default 0,
  title text not null default 'Untitled scene',
  description text not null default '',
  prompt text not null default '',
  duration_seconds integer,
  reference_asset_id uuid references assets(id) on delete set null,
  generation_id uuid references generations(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','queued','processing','completed','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_scenes_sb on scenes(storyboard_id, position);

create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  asset_id uuid references assets(id) on delete set null,
  format text not null,
  resolution text,
  status text not null default 'completed',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  category text not null default 'system',
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on notifications(user_id, created_at desc);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_ws on activity_logs(workspace_id, created_at desc);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  category text not null,
  workflow text not null,
  starting_prompt text not null default '',
  is_builtin boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- credits and billing
create table if not exists credit_balances (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_granted integer not null default 0,
  lifetime_used integer not null default 0,
  monthly_allowance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id),
  generation_id uuid references generations(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  kind text not null check (kind in ('grant','reserve','refund','adjustment')),
  amount integer not null, -- signed: negative reduces the balance
  balance_after integer not null,
  reason text not null default '',
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_ctx_ws on credit_transactions(workspace_id, created_at desc);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  plan_key text not null,
  status text not null default 'pending_payment' check (status in ('pending_payment','active','cancelled','past_due')),
  provider text not null default 'selar',
  provider_reference text,
  started_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subs_ws on subscriptions(workspace_id, created_at desc);

create table if not exists billing_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount_usd numeric(10,2) not null,
  status text not null,
  provider_reference text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- credit functions (service role only)
create or replace function clipgen.reserve_credits(p_workspace uuid, p_user uuid, p_amount int, p_generation uuid, p_key text, p_reason text)
returns int language plpgsql security definer set search_path = clipgen, public as $$
declare v_balance int; v_existing int;
begin
  if p_amount < 0 then raise exception 'invalid_amount'; end if;
  select balance_after into v_existing from credit_transactions where idempotency_key = p_key;
  if found then return v_existing; end if;                       -- duplicate request: no second deduction
  select balance into v_balance from credit_balances where workspace_id = p_workspace for update;
  if not found then raise exception 'no_balance_row'; end if;
  if v_balance < p_amount then raise exception 'insufficient_credits'; end if;
  update credit_balances set balance = balance - p_amount, lifetime_used = lifetime_used + p_amount, updated_at = now()
    where workspace_id = p_workspace;
  insert into credit_transactions (workspace_id, user_id, generation_id, kind, amount, balance_after, reason, idempotency_key)
    values (p_workspace, p_user, p_generation, 'reserve', -p_amount, v_balance - p_amount, p_reason, p_key);
  return v_balance - p_amount;
end $$;

create or replace function clipgen.refund_credits(p_generation uuid, p_reason text)
returns int language plpgsql security definer set search_path = clipgen, public as $$
declare t credit_transactions%rowtype; v_balance int; v_key text;
begin
  select * into t from credit_transactions where generation_id = p_generation and kind = 'reserve' order by created_at limit 1;
  if not found or t.amount = 0 then return null; end if;
  v_key := 'refund:' || p_generation::text;
  if exists (select 1 from credit_transactions where idempotency_key = v_key) then return null; end if;  -- already refunded
  select balance into v_balance from credit_balances where workspace_id = t.workspace_id for update;
  update credit_balances set balance = balance + (-t.amount), lifetime_used = greatest(lifetime_used - (-t.amount), 0), updated_at = now()
    where workspace_id = t.workspace_id;
  insert into credit_transactions (workspace_id, user_id, generation_id, kind, amount, balance_after, reason, idempotency_key)
    values (t.workspace_id, t.user_id, p_generation, 'refund', -t.amount, v_balance + (-t.amount), p_reason, v_key);
  return v_balance + (-t.amount);
end $$;

create or replace function clipgen.grant_credits(p_workspace uuid, p_amount int, p_reason text, p_key text)
returns int language plpgsql security definer set search_path = clipgen, public as $$
declare v_balance int;
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if exists (select 1 from credit_transactions where idempotency_key = p_key) then return null; end if;
  update credit_balances set balance = balance + p_amount, lifetime_granted = lifetime_granted + p_amount, updated_at = now()
    where workspace_id = p_workspace returning balance into v_balance;
  insert into credit_transactions (workspace_id, kind, amount, balance_after, reason, idempotency_key)
    values (p_workspace, 'grant', p_amount, v_balance, p_reason, p_key);
  return v_balance;
end $$;

revoke all on function clipgen.reserve_credits(uuid,uuid,int,uuid,text,text) from public, anon, authenticated;
revoke all on function clipgen.refund_credits(uuid,text) from public, anon, authenticated;
revoke all on function clipgen.grant_credits(uuid,int,text,text) from public, anon, authenticated;
grant execute on function clipgen.reserve_credits(uuid,uuid,int,uuid,text,text) to service_role;
grant execute on function clipgen.refund_credits(uuid,text) to service_role;
grant execute on function clipgen.grant_credits(uuid,int,text,text) to service_role;

-- ---------------------------------------------------------------- new user bootstrap
create or replace function clipgen.bootstrap_user(p_user uuid, p_name text)
returns uuid language plpgsql security definer set search_path = clipgen, public as $$
declare v_ws uuid; v_credits int;
begin
  select workspace_id into v_ws from workspace_members where user_id = p_user order by created_at limit 1;
  if v_ws is not null then return v_ws; end if;
  insert into profiles (id, full_name) values (p_user, p_name) on conflict (id) do nothing;
  insert into workspaces (name, owner_id) values (p_name || '''s workspace', p_user) returning id into v_ws;
  insert into workspace_members (workspace_id, user_id, role) values (v_ws, p_user, 'owner');
  insert into credit_balances (workspace_id) values (v_ws);
  insert into user_settings (user_id, default_workspace_id) values (p_user, v_ws) on conflict (user_id) do nothing;
  select coalesce((select value::int from app_config where key = 'signup_credits'), 0) into v_credits;
  if v_credits > 0 then perform clipgen.grant_credits(v_ws, v_credits, 'Signup grant', 'signup:' || p_user::text); end if;
  insert into notifications (user_id, workspace_id, category, title, body, link)
    values (p_user, v_ws, 'system', 'Welcome to ClipGen AI', 'Your workspace is ready. Create a project to get started.', '/app/projects');
  return v_ws;
end $$;
revoke all on function clipgen.bootstrap_user(uuid, text) from public, anon, authenticated;
grant execute on function clipgen.bootstrap_user(uuid, text) to service_role;

-- Signed in users whose workspace is missing (for example accounts created by another app in this project) call this.
create or replace function clipgen.ensure_workspace() returns uuid
language plpgsql security definer set search_path = clipgen, public as $$
declare v_uid uuid := auth.uid(); v_name text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'My') into v_name from auth.users where id = v_uid;
  return clipgen.bootstrap_user(v_uid, v_name);
end $$;
revoke all on function clipgen.ensure_workspace() from public, anon;
grant execute on function clipgen.ensure_workspace() to authenticated, service_role;

-- Runs for every signup in the project, so it ignores everything except ClipGen signups and never raises.
create or replace function clipgen.handle_new_user() returns trigger
language plpgsql security definer set search_path = clipgen, public as $$
begin
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'clipgen' then return new; end if;
  begin
    perform clipgen.bootstrap_user(new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)));
  exception when others then
    raise warning 'clipgen bootstrap failed for %: %', new.id, sqlerrm;  -- ensure_workspace() retries on first login
  end;
  return new;
end $$;
drop trigger if exists clipgen_on_auth_user_created on auth.users;
create trigger clipgen_on_auth_user_created after insert on auth.users for each row execute function clipgen.handle_new_user();

-- ---------------------------------------------------------------- row level security
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table user_settings enable row level security;
alter table projects enable row level security;
alter table media_folders enable row level security;
alter table assets enable row level security;
alter table generations enable row level security;
alter table generation_jobs enable row level security;
alter table prompts enable row level security;
alter table prompt_templates enable row level security;
alter table storyboards enable row level security;
alter table scenes enable row level security;
alter table exports enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
alter table templates enable row level security;
alter table credit_balances enable row level security;
alter table credit_transactions enable row level security;
alter table subscriptions enable row level security;
alter table billing_records enable row level security;

create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_peers on profiles for select using (exists (
  select 1 from workspace_members a join workspace_members b on a.workspace_id = b.workspace_id
  where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy ws_read on workspaces for select using (clipgen.is_member(id));
create policy ws_update on workspaces for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy members_read on workspace_members for select using (clipgen.is_member(workspace_id));
create policy settings_self on user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Members can read and write workspace content. Row ownership of workspace_id is enforced on insert and update.
do $$
declare t text;
begin
  foreach t in array array['projects','media_folders','assets','prompts','prompt_templates','storyboards','scenes','exports','activity_logs']
  loop
    execute format('create policy %I_rw on %I for all using (clipgen.is_member(workspace_id)) with check (clipgen.is_member(workspace_id))', t, t);
  end loop;
end $$;

-- Generations, jobs, credits, subscriptions and billing are read only for members. Writes go through the server.
create policy gen_read on generations for select using (clipgen.is_member(workspace_id));
create policy gen_delete on generations for delete using (clipgen.is_member(workspace_id));
create policy jobs_read on generation_jobs for select using (exists (select 1 from generations g where g.id = generation_id and clipgen.is_member(g.workspace_id)));
create policy bal_read on credit_balances for select using (clipgen.is_member(workspace_id));
create policy ctx_read on credit_transactions for select using (clipgen.is_member(workspace_id));
create policy subs_read on subscriptions for select using (clipgen.is_member(workspace_id));
create policy bill_read on billing_records for select using (clipgen.is_member(workspace_id));
create policy notif_self on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy templates_read on templates for select using (true);

-- ---------------------------------------------------------------- privileges
-- RLS decides row access. Members get table privileges; ledger, jobs, subscriptions and billing have no write policies.
grant select, insert, update, delete on all tables in schema clipgen to authenticated;
grant all on all tables in schema clipgen to service_role;
grant execute on function clipgen.is_member(uuid) to authenticated, service_role;
alter default privileges in schema clipgen grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema clipgen grant all on tables to service_role;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clipgen-media', 'clipgen-media', false, 524288000,
  array['video/mp4','video/quicktime','video/webm','image/png','image/jpeg','image/webp','image/gif','audio/mpeg','audio/wav','audio/mp4','audio/ogg'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Object path convention: <workspace_id>/<uuid>-<filename>
drop policy if exists clipgen_media_select on storage.objects;
drop policy if exists clipgen_media_insert on storage.objects;
drop policy if exists clipgen_media_delete on storage.objects;
create policy clipgen_media_select on storage.objects for select using (bucket_id = 'clipgen-media' and clipgen.is_member(((storage.foldername(name))[1])::uuid));
create policy clipgen_media_insert on storage.objects for insert with check (bucket_id = 'clipgen-media' and clipgen.is_member(((storage.foldername(name))[1])::uuid));
create policy clipgen_media_delete on storage.objects for delete using (bucket_id = 'clipgen-media' and clipgen.is_member(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------- built in templates
insert into clipgen.templates (slug, title, description, category, workflow, starting_prompt) values
('product-spin','Product Spotlight','A slow orbit around a product on a clean studio surface.','Product Videos','text_to_video','A slow cinematic orbit around a matte black wireless speaker on a white studio surface, soft key light, shallow depth of field'),
('social-hook','Social Hook','A fast vertical opener designed to stop the scroll.','Social Media','text_to_video','Vertical close up of hands unboxing a product on a wooden table, natural window light, handheld camera'),
('ad-concept','Ad Concept','A polished brand moment for a paid campaign.','Advertising','text_to_video','A runner crossing a city bridge at sunrise, tracking shot, warm golden light, cinematic color grade'),
('cinematic-landscape','Cinematic Landscape','Wide establishing shot with atmospheric depth.','Cinematic','text_to_video','Aerial drone shot over a misty mountain valley at dawn, volumetric light, slow forward motion'),
('explainer-scene','Explainer Scene','A clean visual to support an educational topic.','Educational','text_to_video','A simple clean animation of water cycling between ocean, clouds and rain, soft colors, minimal style'),
('brand-reveal','Brand Reveal','Animate a logo or brand still into motion.','Brand Content','image_to_video','Subtle camera push in, soft light sweep across the surface, slight parallax'),
('story-opener','Story Opener','The first scene of a short narrative.','Storytelling','multi_scene','A lone traveler walks into a quiet coastal town at dusk, lanterns turning on one by one'),
('animated-character','Animated Character','Bring a character illustration to life.','Animation','image_to_video','The character turns toward the camera and smiles, gentle idle motion, soft background movement'),
('promo-launch','Launch Promo','A short promotional clip for a product launch.','Promotional Videos','text_to_video','Dynamic montage of a new smartphone on a rotating pedestal with colored light accents, high contrast')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- expose the schema to the API
-- Appends clipgen to the existing exposed schema list. If your project stores that list elsewhere this only warns;
-- in that case add `clipgen` under Settings, API, Exposed schemas in the dashboard.
do $$
declare cur text;
begin
  select option_value into cur from pg_options_to_table((select rolconfig from pg_roles where rolname = 'authenticator')) where option_name = 'pgrst.db_schemas';
  if cur is null then raise warning 'Add clipgen to Exposed schemas in Settings, API (setting not found in role config).';
  elsif position('clipgen' in cur) = 0 then execute format('alter role authenticator set pgrst.db_schemas = %L', cur || ', clipgen');
  end if;
  notify pgrst, 'reload config';
  notify pgrst, 'reload schema';
exception when others then raise warning 'Could not update exposed schemas automatically (%). Add clipgen in Settings, API.', sqlerrm;
end $$;
