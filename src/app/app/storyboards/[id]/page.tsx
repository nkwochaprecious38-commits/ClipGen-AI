import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { getContext } from '@/lib/context';
import { PageHeader, Status, label } from '@/components/ui';
import { updateStoryboard, deleteStoryboard, addScene, updateScene, deleteScene, moveScene } from '../../actions';
import { ConfirmButton } from '@/components/Confirm';
import { SceneClip } from '@/components/SceneClip';
import { SceneReference } from '@/components/SceneReference';
import { SequencePreview } from '@/components/SequencePreview';
import { catalogWithAvailability } from '@/lib/providers';
import { modelsFor } from '@/lib/models';
import { signedUrls } from '@/lib/data';

export const metadata = { title: 'Storyboard' };
export default async function Storyboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getContext(); const sb = ctx.supabase;
  const { data: b } = await sb.from('storyboards').select('*').eq('id', id).maybeSingle(); if (!b) notFound();
  const [{ data: scenes }, { data: projects }, { data: bal }] = await Promise.all([
    sb.from('scenes').select('*').eq('storyboard_id', id).order('position'), sb.from('projects').select('id, title'), sb.from('credit_balances').select('balance').eq('workspace_id', ctx.workspaceId!).maybeSingle(),
  ]);
  const genIds = (scenes ?? []).map((s) => s.generation_id).filter(Boolean) as string[];
  const { data: gens } = genIds.length ? await sb.from('generations').select('id, output_asset_ids').in('id', genIds) : { data: [] as any[] };
  const assetIds = [...(gens ?? []).flatMap((g: any) => g.output_asset_ids ?? []), ...(scenes ?? []).map((s) => s.reference_asset_id).filter(Boolean)] as string[];
  const { data: assets } = assetIds.length ? await sb.from('assets').select('id, storage_path').in('id', assetIds) : { data: [] as any[] };
  const urls = await signedUrls(ctx, (assets ?? []).map((a: any) => a.storage_path));
  const assetUrl = (aid?: string | null) => { const a = (assets ?? []).find((x: any) => x.id === aid); return a ? urls[a.storage_path] ?? null : null; };
  const clipUrl = (s: any) => assetUrl((gens ?? []).find((g: any) => g.id === s.generation_id)?.output_asset_ids?.[0]);
  const ids = new Set(modelsFor('text_to_video').map((m) => m.id)); const models = catalogWithAvailability().filter((m) => ids.has(m.id));
  const done = (scenes ?? []).filter((s) => s.status === 'completed' && clipUrl(s)).map((s) => ({ title: s.title, url: clipUrl(s)! }));
  const ta = 'input min-h-20';
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/app/multi-scene" className="text-accent2 hover:underline">Multi Scene and Storyboards</Link></p>
      <PageHeader title={b.title} action={<Status value={b.status} />} />
      <form action={updateStoryboard} className="card mb-8 grid gap-4 p-5 md:grid-cols-2">
        <input type="hidden" name="id" value={b.id} />
        <div><label className="label" htmlFor="title">Project title</label><input id="title" name="title" className="input" defaultValue={b.title} required /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="st">Status</label><select id="st" name="status" className="input" defaultValue={b.status}>{['draft', 'in_progress', 'review', 'completed', 'archived'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
          <div><label className="label" htmlFor="pj">Project</label><select id="pj" name="projectId" className="input" defaultValue={b.project_id ?? ''}><option value="">None</option>{projects?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div></div>
        <div><label className="label" htmlFor="brief">Creative brief</label><textarea id="brief" name="brief" className={ta} defaultValue={b.brief} /></div>
        <div><label className="label" htmlFor="concept">Story concept</label><textarea id="concept" name="concept" className={ta} defaultValue={b.concept} /></div>
        <div><label className="label" htmlFor="vd">Visual direction</label><textarea id="vd" name="visual_direction" className={ta} defaultValue={b.visual_direction} /></div>
        <div><label className="label" htmlFor="cd">Camera direction</label><textarea id="cd" name="camera_direction" className={ta} defaultValue={b.camera_direction} /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="sn">Style notes</label><textarea id="sn" name="style_notes" className={ta} defaultValue={b.style_notes} /></div>
        <div className="flex flex-wrap gap-2 md:col-span-2"><button className="btn-primary">Save storyboard</button>
          <ConfirmButton action={deleteStoryboard} fields={{ id: b.id }} label="Delete storyboard" title="Delete this storyboard?" message="All scenes are removed. Generated clips stay in your library." className="btn-danger" /></div>
        <p className="text-xs text-mute md:col-span-2">AI assisted storyboard writing needs a language model integration, which is not connected. Write the scenes yourself, then generate clips below.</p>
      </form>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Scenes</h2><form action={addScene}><input type="hidden" name="storyboardId" value={b.id} /><button className="btn-primary btn-sm">Add scene</button></form></div>
      <div className="space-y-5">{scenes?.map((s, i) => (
        <article key={s.id} className="card grid gap-5 p-5 lg:grid-cols-[1fr_340px]">
          <form action={updateScene} className="space-y-3">
            <input type="hidden" name="id" value={s.id} /><input type="hidden" name="storyboardId" value={b.id} /><input type="hidden" name="referenceAssetId" value={s.reference_asset_id ?? ''} />
            <div className="flex items-center gap-3"><span className="font-head text-sm font-bold text-accent2">Scene {i + 1}</span><Status value={s.status} /></div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><div><label className="label" htmlFor={`t${s.id}`}>Scene title</label><input id={`t${s.id}`} name="title" className="input" defaultValue={s.title} /></div>
              <div><label className="label" htmlFor={`d${s.id}`}>Duration (s)</label><input id={`d${s.id}`} name="duration" inputMode="numeric" className="input" defaultValue={s.duration_seconds ?? ''} /></div></div>
            <div><label className="label" htmlFor={`x${s.id}`}>Scene description</label><textarea id={`x${s.id}`} name="description" className="input min-h-16" defaultValue={s.description} /></div>
            <div><label className="label" htmlFor={`p${s.id}`}>Scene prompt</label><textarea id={`p${s.id}`} name="prompt" className="input min-h-20" defaultValue={s.prompt} maxLength={2000} /></div>
            <div className="flex flex-wrap gap-2"><button className="btn-ghost btn-sm">Save scene</button></div>
          </form>
          <div className="space-y-4">
            <SceneClip sceneId={s.id} prompt={s.prompt} models={models} credits={bal?.balance ?? 0} initialStatus={s.status} initialUrl={clipUrl(s)} generationId={s.generation_id} />
            <SceneReference workspaceId={ctx.workspaceId!} sceneId={s.id} storyboardId={b.id} current={assetUrl(s.reference_asset_id)} />
            <p className="text-xs text-mute">Reference images are stored with the scene for your planning. The video models connected today do not take them as scene input.</p>
            <div className="flex flex-wrap gap-2">
              <form action={moveScene}><input type="hidden" name="storyboardId" value={b.id} /><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button className="btn-ghost btn-sm" disabled={i === 0} aria-label="Move scene up"><ArrowUp size={14} /></button></form>
              <form action={moveScene}><input type="hidden" name="storyboardId" value={b.id} /><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button className="btn-ghost btn-sm" disabled={i === (scenes?.length ?? 1) - 1} aria-label="Move scene down"><ArrowDown size={14} /></button></form>
              <ConfirmButton action={deleteScene} fields={{ id: s.id, storyboardId: b.id }} label="Delete scene" title="Delete this scene?" message="The scene is removed from the storyboard." />
            </div>
          </div>
        </article>))}
        {!scenes?.length && <div className="card px-6 py-12 text-center text-sm text-mute">No scenes yet. Add the first scene to begin.</div>}
      </div>
      <section className="mt-10"><h2 className="mb-3 text-xl font-bold">Sequence preview</h2><div className="card p-5"><SequencePreview clips={done} /></div></section>
    </>
  );
}
