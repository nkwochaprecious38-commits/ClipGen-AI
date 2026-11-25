import { getContext } from '@/lib/context';
import { PageHeader } from '@/components/ui';
import { AssetLibrary } from '@/components/AssetLibrary';
import { signedUrls } from '@/lib/data';
export const metadata = { title: 'My Assets' };
export default async function Assets() {
  const ctx = await getContext(); const sb = ctx.supabase;
  const [{ data: assets }, { data: folders }, { data: projects }, { data: ws }] = await Promise.all([
    sb.from('assets').select('*').order('created_at', { ascending: false }).limit(500), sb.from('media_folders').select('id, name').order('name'),
    sb.from('projects').select('id, title').order('title'), sb.from('workspaces').select('storage_limit_bytes').eq('id', ctx.workspaceId!).single(),
  ]);
  const urls = await signedUrls(ctx, (assets ?? []).map((a) => a.storage_path));
  const used = (assets ?? []).reduce((n, a) => n + Number(a.size_bytes), 0); const limit = Number(ws?.storage_limit_bytes ?? 0);
  return (<><PageHeader title="My Assets" text={`Storage used: ${(used / 1048576).toFixed(1)} MB of ${(limit / 1048576).toFixed(0)} MB`} />
    <AssetLibrary assets={(assets ?? []).map((a) => ({ ...a, size_bytes: Number(a.size_bytes), url: urls[a.storage_path] ?? null }))} folders={folders ?? []} projects={projects ?? []} workspaceId={ctx.workspaceId!} /></>);
}
