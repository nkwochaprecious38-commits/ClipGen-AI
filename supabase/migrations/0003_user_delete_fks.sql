-- Fixes: deleting an auth user failed when they owned ClipGen rows (foreign keys had no delete rule).
-- Owned content is removed with the user (their workspace already cascades). Attribution columns are set to null.
alter table clipgen.projects drop constraint if exists projects_owner_id_fkey;
alter table clipgen.projects add constraint projects_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete cascade;

alter table clipgen.generations drop constraint if exists generations_user_id_fkey;
alter table clipgen.generations add constraint generations_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table clipgen.prompts drop constraint if exists prompts_user_id_fkey;
alter table clipgen.prompts add constraint prompts_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table clipgen.assets drop constraint if exists assets_uploaded_by_fkey;
alter table clipgen.assets add constraint assets_uploaded_by_fkey foreign key (uploaded_by) references auth.users(id) on delete set null;

alter table clipgen.credit_transactions drop constraint if exists credit_transactions_user_id_fkey;
alter table clipgen.credit_transactions add constraint credit_transactions_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table clipgen.activity_logs drop constraint if exists activity_logs_user_id_fkey;
alter table clipgen.activity_logs add constraint activity_logs_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table clipgen.exports drop constraint if exists exports_created_by_fkey;
alter table clipgen.exports add constraint exports_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
