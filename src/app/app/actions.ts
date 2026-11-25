'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getContext } from '@/lib/context';
import { getPlan } from '@/lib/plans';
import { adminClient } from '@/lib/supabase/admin';

const STATUSES = ['draft', 'in_progress', 'review', 'completed', 'archived'];
const s = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? '').trim().slice(0, max);
async function log(ctx: Awaited<ReturnType<typeof getContext>>, action: string, detail: string, projectId?: string | null) {
  await ctx.supabase.from('activity_logs').insert({ workspace_id: ctx.workspaceId, user_id: ctx.user.id, project_id: projectId ?? null, action, detail });
}

// ------------------------------------------------------------------ projects
export async function createProject(f: FormData) {
  const ctx = await getContext();
  const title = s(f, 'title', 120); if (!title) return;
  const { data } = await ctx.supabase.from('projects').insert({ workspace_id: ctx.workspaceId, owner_id: ctx.user.id, title, description: s(f, 'description'), status: 'draft' }).select('id').single();
  if (data) { await log(ctx, 'Project created', title, data.id); revalidatePath('/app/projects'); redirect(`/app/projects/${data.id}`); }
}
export async function updateProject(f: FormData) {
  const ctx = await getContext(); const id = s(f, 'id'); const status = s(f, 'status');
  await ctx.supabase.from('projects').update({ title: s(f, 'title', 120) || 'Untitled', description: s(f, 'description'), notes: s(f, 'notes', 8000), status: STATUSES.includes(status) ? status : 'draft', updated_at: new Date().toISOString() }).eq('id', id);
  await log(ctx, 'Project updated', s(f, 'title', 120), id); revalidatePath(`/app/projects/${id}`); revalidatePath('/app/projects');
}
export async function deleteProject(f: FormData) {
  const ctx = await getContext(); await ctx.supabase.from('projects').delete().eq('id', s(f, 'id')); revalidatePath('/app/projects'); redirect('/app/projects');
}
export async function saveGenerationToProject(generationId: string, projectId: string) {
  const ctx = await getContext();
  const { data: p } = await ctx.supabase.from('projects').select('id, title').eq('id', projectId).maybeSingle();
  if (!p) return { error: 'Project not found' };
  const { data: g } = await ctx.supabase.from('generations').select('id, output_asset_ids').eq('id', generationId).maybeSingle();
  if (!g) return { error: 'Generation not found' };
  await ctx.supabase.from('generations').update({ project_id: projectId }).eq('id', generationId);
  if (g.output_asset_ids?.length) await ctx.supabase.from('assets').update({ project_id: projectId }).in('id', g.output_asset_ids);
  await ctx.supabase.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projectId);
  await log(ctx, 'Generation added', `Added to ${p.title}`, projectId); revalidatePath('/app/history'); return {};
}
export async function addToProject(f: FormData) {
  const ctx = await getContext(); const gid = s(f, 'generationId'); const pid = s(f, 'projectId'); if (gid && pid) await saveGenerationToProject(gid, pid); revalidatePath('/app/history');
}
export async function deleteGeneration(f: FormData) {
  const ctx = await getContext(); await ctx.supabase.from('generations').delete().eq('id', s(f, 'id')); revalidatePath('/app/history');
}

// ------------------------------------------------------------------ assets
export async function renameAsset(f: FormData) {
  const ctx = await getContext(); const name = s(f, 'name', 200); if (!name) return;
  await ctx.supabase.from('assets').update({ name, description: s(f, 'description'), project_id: s(f, 'projectId') || null, folder_id: s(f, 'folderId') || null, updated_at: new Date().toISOString() }).eq('id', s(f, 'id'));
  revalidatePath('/app/assets');
}
export async function deleteAsset(f: FormData) {
  const ctx = await getContext(); const id = s(f, 'id');
  const { data: a } = await ctx.supabase.from('assets').select('storage_path').eq('id', id).maybeSingle();
  if (a) { await ctx.supabase.storage.from('clipgen-media').remove([a.storage_path]); await ctx.supabase.from('assets').delete().eq('id', id); }
  revalidatePath('/app/assets');
}
export async function createFolder(f: FormData) {
  const ctx = await getContext(); const name = s(f, 'name', 80); if (!name) return;
  await ctx.supabase.from('media_folders').insert({ workspace_id: ctx.workspaceId, name, parent_id: s(f, 'parentId') || null }); revalidatePath('/app/assets');
}
export async function deleteFolder(f: FormData) {
  const ctx = await getContext(); await ctx.supabase.from('media_folders').delete().eq('id', s(f, 'id')); revalidatePath('/app/assets');
}
export async function createExport(f: FormData) {
  const ctx = await getContext(); const assetId = s(f, 'assetId'); if (!assetId) return;
  const { data: a } = await ctx.supabase.from('assets').select('mime_type, project_id').eq('id', assetId).maybeSingle(); if (!a) return;
  await ctx.supabase.from('exports').insert({ workspace_id: ctx.workspaceId, asset_id: assetId, project_id: a.project_id, format: a.mime_type, created_by: ctx.user.id });
  revalidatePath('/app/exports');
}

// ------------------------------------------------------------------ prompts
export async function savePrompt(f: FormData) {
  const ctx = await getContext(); const id = s(f, 'id'); const body = s(f, 'body'); const title = s(f, 'title', 120); if (!body || !title) return;
  const row = { title, body, category: s(f, 'category', 40) || 'Cinematic', notes: s(f, 'notes', 4000), project_id: s(f, 'projectId') || null, is_template: f.get('isTemplate') === 'on', updated_at: new Date().toISOString() };
  if (id) await ctx.supabase.from('prompts').update(row).eq('id', id);
  else await ctx.supabase.from('prompts').insert({ ...row, workspace_id: ctx.workspaceId, user_id: ctx.user.id });
  revalidatePath('/app/prompts');
}
export async function deletePrompt(f: FormData) { const ctx = await getContext(); await ctx.supabase.from('prompts').delete().eq('id', s(f, 'id')); revalidatePath('/app/prompts'); }

// ------------------------------------------------------------------ storyboards and scenes
export async function createStoryboard(f: FormData) {
  const ctx = await getContext(); const title = s(f, 'title', 120); if (!title) return;
  const { data } = await ctx.supabase.from('storyboards').insert({ workspace_id: ctx.workspaceId, title, project_id: s(f, 'projectId') || null }).select('id').single();
  if (data) redirect(`/app/storyboards/${data.id}`);
}
export async function updateStoryboard(f: FormData) {
  const ctx = await getContext(); const id = s(f, 'id'); const st = s(f, 'status');
  await ctx.supabase.from('storyboards').update({ title: s(f, 'title', 120) || 'Untitled', brief: s(f, 'brief', 6000), concept: s(f, 'concept', 6000), visual_direction: s(f, 'visual_direction', 3000), camera_direction: s(f, 'camera_direction', 3000), style_notes: s(f, 'style_notes', 3000), project_id: s(f, 'projectId') || null, status: STATUSES.includes(st) ? st : 'draft', updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath(`/app/storyboards/${id}`);
}
export async function deleteStoryboard(f: FormData) { const ctx = await getContext(); await ctx.supabase.from('storyboards').delete().eq('id', s(f, 'id')); revalidatePath('/app/storyboards'); redirect('/app/storyboards'); }
export async function addScene(f: FormData) {
  const ctx = await getContext(); const sb = s(f, 'storyboardId');
  const { data: last } = await ctx.supabase.from('scenes').select('position').eq('storyboard_id', sb).order('position', { ascending: false }).limit(1).maybeSingle();
  await ctx.supabase.from('scenes').insert({ storyboard_id: sb, workspace_id: ctx.workspaceId, position: (last?.position ?? -1) + 1, title: `Scene ${(last?.position ?? -1) + 2}` });
  revalidatePath(`/app/storyboards/${sb}`); revalidatePath('/app/multi-scene');
}
export async function updateScene(f: FormData) {
  const ctx = await getContext(); const id = s(f, 'id'); const dur = parseInt(s(f, 'duration'));
  await ctx.supabase.from('scenes').update({ title: s(f, 'title', 120) || 'Untitled scene', description: s(f, 'description', 3000), prompt: s(f, 'prompt', 2000), duration_seconds: Number.isFinite(dur) ? dur : null, reference_asset_id: s(f, 'referenceAssetId') || null, updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath(`/app/storyboards/${s(f, 'storyboardId')}`);
}
export async function deleteScene(f: FormData) { const ctx = await getContext(); await ctx.supabase.from('scenes').delete().eq('id', s(f, 'id')); revalidatePath(`/app/storyboards/${s(f, 'storyboardId')}`); }
export async function moveScene(f: FormData) {
  const ctx = await getContext(); const sb = s(f, 'storyboardId'); const id = s(f, 'id'); const dir = s(f, 'dir') === 'up' ? -1 : 1;
  const { data: list } = await ctx.supabase.from('scenes').select('id, position').eq('storyboard_id', sb).order('position');
  if (!list) return; const i = list.findIndex((x) => x.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((x, n) => ctx.supabase.from('scenes').update({ position: n }).eq('id', x.id)));
  revalidatePath(`/app/storyboards/${sb}`);
}

// ------------------------------------------------------------------ notifications
export async function markRead(f: FormData) { const ctx = await getContext(); const id = s(f, 'id'); const q = ctx.supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', ctx.user.id); await (id ? q.eq('id', id) : q.is('read_at', null)); revalidatePath('/app', 'layout'); }
export async function clearNotifications(f: FormData) { const ctx = await getContext(); const id = s(f, 'id'); const q = ctx.supabase.from('notifications').delete().eq('user_id', ctx.user.id); await (id ? q.eq('id', id) : q.not('id', 'is', null)); revalidatePath('/app', 'layout'); }

// ------------------------------------------------------------------ settings and subscription
export async function updateProfile(f: FormData) { const ctx = await getContext(); await ctx.supabase.from('profiles').update({ full_name: s(f, 'name', 100), updated_at: new Date().toISOString() }).eq('id', ctx.user.id); revalidatePath('/app', 'layout'); }
export async function updateWorkspace(f: FormData) { const ctx = await getContext(); const n = s(f, 'name', 100); if (n) await ctx.supabase.from('workspaces').update({ name: n, updated_at: new Date().toISOString() }).eq('id', ctx.workspaceId).eq('owner_id', ctx.user.id); revalidatePath('/app', 'layout'); }
export async function updateNotificationPrefs(f: FormData) {
  const ctx = await getContext();
  await ctx.supabase.from('user_settings').update({ notify_generation: f.get('generation') === 'on', notify_projects: f.get('projects') === 'on', notify_billing: f.get('billing') === 'on', notify_system: f.get('system') === 'on', updated_at: new Date().toISOString() }).eq('user_id', ctx.user.id);
  revalidatePath('/app/settings');
}
export async function changePassword(_: unknown, f: FormData): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await getContext(); const pw = s(f, 'password', 200);
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return { error: 'Use at least 8 characters with a letter and a number.' };
  if (pw !== s(f, 'confirm', 200)) return { error: 'Passwords do not match.' };
  const { error } = await ctx.supabase.auth.updateUser({ password: pw }); return error ? { error: error.message } : { ok: true };
}
// Records the plan the user chose as pending. It is NOT active until payment is confirmed server side.
export async function selectPlan(f: FormData) {
  const ctx = await getContext(); const key = s(f, 'plan'); const plan = getPlan(key); if (!plan) return;
  const db = adminClient();
  const { data: cur } = await db.from('subscriptions').select('id, plan_key, status').eq('workspace_id', ctx.workspaceId).in('status', ['pending_payment', 'active']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (cur?.status === 'pending_payment') await db.from('subscriptions').update({ plan_key: key, updated_at: new Date().toISOString() }).eq('id', cur.id);
  else if (cur?.status !== 'active' || cur.plan_key !== key) await db.from('subscriptions').insert({ workspace_id: ctx.workspaceId, plan_key: key, status: 'pending_payment' });
  await ctx.supabase.from('notifications').insert({ user_id: ctx.user.id, workspace_id: ctx.workspaceId, category: 'billing', title: 'Plan selected', body: `${plan.name} selected. Complete checkout to activate it.`, link: '/app/billing' });
  revalidatePath('/app/billing'); redirect(plan.checkoutUrl);
}
export async function cancelSubscription(f: FormData) {
  const ctx = await getContext();
  await adminClient().from('subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', s(f, 'id')).eq('workspace_id', ctx.workspaceId);
  revalidatePath('/app/billing');
}

// ------------------------------------------------------------------ templates and scene references
const ROUTES: Record<string, string> = { text_to_video: '/app/create', image_to_video: '/app/image-to-video', image: '/app/images' };
export async function createFromTemplate(f: FormData) {
  const ctx = await getContext();
  const { data: t } = await ctx.supabase.from('templates').select('*').eq('slug', s(f, 'slug')).maybeSingle(); if (!t) return;
  const { data: p } = await ctx.supabase.from('projects').insert({ workspace_id: ctx.workspaceId, owner_id: ctx.user.id, title: t.title, description: `Started from the ${t.title} template.`, status: 'draft' }).select('id').single();
  if (!p) return; await log(ctx, 'Project created from template', t.title, p.id);
  if (t.workflow === 'multi_scene') {
    const { data: sb } = await ctx.supabase.from('storyboards').insert({ workspace_id: ctx.workspaceId, project_id: p.id, title: t.title, concept: t.description }).select('id').single();
    if (sb) { await ctx.supabase.from('scenes').insert({ storyboard_id: sb.id, workspace_id: ctx.workspaceId, position: 0, title: 'Scene 1', prompt: t.starting_prompt }); redirect(`/app/storyboards/${sb.id}`); }
  }
  redirect(`${ROUTES[t.workflow] ?? '/app/create'}?project=${p.id}&prompt=${encodeURIComponent(t.starting_prompt)}`);
}
export async function setSceneReference(sceneId: string, assetId: string, storyboardId: string) {
  const ctx = await getContext();
  await ctx.supabase.from('scenes').update({ reference_asset_id: assetId, updated_at: new Date().toISOString() }).eq('id', sceneId);
  revalidatePath(`/app/storyboards/${storyboardId}`);
}
