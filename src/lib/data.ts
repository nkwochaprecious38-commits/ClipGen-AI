import 'server-only';
import { getContext } from './context';
import { catalogWithAvailability } from './providers';
import { modelsFor, type GenKind } from './models';

export async function creatorProps(kind: GenKind) {
  const ctx = await getContext();
  const [{ data: bal }, { data: projects }] = await Promise.all([
    ctx.supabase.from('credit_balances').select('balance').eq('workspace_id', ctx.workspaceId!).maybeSingle(),
    ctx.supabase.from('projects').select('id, title').neq('status', 'archived').order('updated_at', { ascending: false }),
  ]);
  const ids = new Set(modelsFor(kind).map((m) => m.id));
  return { ctx, props: { kind, models: catalogWithAvailability().filter((m) => ids.has(m.id)), workspaceId: ctx.workspaceId!, credits: bal?.balance ?? 0, projects: projects ?? [] } };
}
export async function signedUrls(ctx: Awaited<ReturnType<typeof getContext>>, paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const { data } = await ctx.supabase.storage.from('clipgen-media').createSignedUrls(paths, 3600);
  const m: Record<string, string> = {};
  data?.forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl; });
  return m;
}
