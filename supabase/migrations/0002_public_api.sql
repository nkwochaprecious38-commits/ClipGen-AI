-- ClipGen AI: API access through `public` without exposing the clipgen schema.
-- Creates one security_invoker view per clipgen table (named clipgen_<table>) so RLS keeps applying
-- to the calling user, plus wrapper functions. Names are prefixed to avoid clashing with other apps.
-- Run after 0001_init.sql.

do $$
declare t record;
begin
  for t in select table_name from information_schema.tables where table_schema = 'clipgen' and table_type = 'BASE TABLE' and table_name <> 'app_config'
  loop
    execute format('create or replace view public.%I with (security_invoker = true) as select * from clipgen.%I', 'clipgen_' || t.table_name, t.table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', 'clipgen_' || t.table_name);
    execute format('revoke all on public.%I from anon', 'clipgen_' || t.table_name);
  end loop;
end $$;

create or replace function public.clipgen_reserve_credits(p_workspace uuid, p_user uuid, p_amount int, p_generation uuid, p_key text, p_reason text)
returns int language sql security definer set search_path = clipgen, public as
$$ select clipgen.reserve_credits(p_workspace, p_user, p_amount, p_generation, p_key, p_reason) $$;

create or replace function public.clipgen_refund_credits(p_generation uuid, p_reason text)
returns int language sql security definer set search_path = clipgen, public as
$$ select clipgen.refund_credits(p_generation, p_reason) $$;

create or replace function public.clipgen_ensure_workspace()
returns uuid language sql security definer set search_path = clipgen, public as
$$ select clipgen.ensure_workspace() $$;

revoke all on function public.clipgen_reserve_credits(uuid,uuid,int,uuid,text,text) from public, anon, authenticated;
revoke all on function public.clipgen_refund_credits(uuid,text) from public, anon, authenticated;
revoke all on function public.clipgen_ensure_workspace() from public, anon;
grant execute on function public.clipgen_reserve_credits(uuid,uuid,int,uuid,text,text) to service_role;
grant execute on function public.clipgen_refund_credits(uuid,text) to service_role;
grant execute on function public.clipgen_ensure_workspace() to authenticated, service_role;

notify pgrst, 'reload schema';
