import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, Empty, Status, fmtDate, label } from '@/components/ui';
import { addToProject, deleteGeneration } from '../actions';
import { ConfirmButton } from '@/components/Confirm';
import { signedUrls } from '@/lib/data';

export const metadata = { title: 'Generation History' };
const TYPES = ['text_to_video', 'image_to_video', 'video_to_video', 'video_edit', 'image', 'video_extension', 'upscale', 'multi_scene', 'variation', 'social'];
const STATUSES = ['queued', 'processing', 'completed', 'failed', 'cancelled'];
const route = (t: string) => ({ image: '/app/images', image_to_video: '/app/image-to-video' } as Record<string, string>)[t] ?? '/app/create';

export default async function History({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string }> }) {
  const sp = await searchParams; const ctx = await getContext();
  let q = ctx.supabase.from('generations').select('*, projects:clipgen_projects(title)').order('created_at', { ascending: false }).limit(100);
  if (sp.type && TYPES.includes(sp.type)) q = q.eq('type', sp.type); if (sp.status && STATUSES.includes(sp.status)) q = q.eq('status', sp.status);
  if (sp.q) q = q.ilike('prompt', `%${sp.q.replace(/[%,]/g, '')}%`);
  const [{ data: gens }, { data: projects }] = await Promise.all([q, ctx.supabase.from('projects').select('id, title')]);
  const ids = (gens ?? []).flatMap((g) => g.output_asset_ids ?? []);
  const { data: assets } = ids.length ? await ctx.supabase.from('assets').select('id, kind, storage_path, name').in('id', ids) : { data: [] as any[] };
  const urls = await signedUrls(ctx, (assets ?? []).map((a: any) => a.storage_path));
  const out = (g: any) => (assets ?? []).filter((a: any) => g.output_asset_ids?.includes(a.id)).map((a: any) => ({ ...a, url: urls[a.storage_path] }));
  return (
    <>
      <PageHeader title="Generation History" text="Every generation with its prompt, model, settings, status, cost and output." />
      <form className="mb-6 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={sp.q} className="input max-w-xs" placeholder="Search prompts" aria-label="Search" />
        <select name="type" defaultValue={sp.type ?? ''} className="input w-auto" aria-label="Type"><option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ''} className="input w-auto" aria-label="Status"><option value="">All statuses</option>{STATUSES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
        <button className="btn-ghost">Filter</button>
      </form>
      {gens?.length ? <div className="space-y-3">{gens.map((g: any) => (
        <article key={g.id} className="card p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex gap-2 md:w-64 md:shrink-0">{out(g).length ? out(g).map((a: any) => <div key={a.id} className="aspect-video flex-1 overflow-hidden rounded-md bg-bg2">{a.kind === 'video' ? <video src={a.url} controls className="h-full w-full object-cover" preload="metadata" /> : <img src={a.url} alt="Generated output" className="h-full w-full object-cover" />}</div>) : <div className="flex aspect-video flex-1 items-center justify-center rounded-md bg-bg2 text-xs text-mute">{g.status === 'completed' ? 'Output removed' : 'No output'}</div>}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><Status value={g.status} /><span className="chip">{label(g.type)}</span><span className="text-xs text-mute">{fmtDate(g.created_at)}</span></div>
              <p className="mt-2 text-sm">{g.prompt}</p>
              <p className="mt-1.5 text-xs text-mute">{g.model_id}, {g.credit_cost} credits{(Array.isArray(g.projects) ? g.projects[0] : g.projects)?.title ? `, ${(Array.isArray(g.projects) ? g.projects[0] : g.projects).title}` : ''}</p>
              {g.error && <p className="mt-1.5 text-xs text-bad">{g.error}</p>}
              <details className="mt-2 text-xs text-mute"><summary className="cursor-pointer text-accent2">Settings</summary><pre className="mt-1 overflow-x-auto rounded bg-bg2 p-2">{JSON.stringify({ ...g.settings, negative_prompt: g.negative_prompt }, null, 2)}</pre></details>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {out(g).map((a: any) => <a key={a.id} href={a.url} download={a.name} className="btn-ghost btn-sm">Download</a>)}
                <Link href={`${route(g.type)}?prompt=${encodeURIComponent(g.prompt)}`} className="btn-ghost btn-sm">Regenerate</Link>
                {g.status === 'completed' && <form action={addToProject} className="flex items-center gap-1.5"><input type="hidden" name="generationId" value={g.id} /><select name="projectId" className="input h-8 w-36 py-1 text-xs" aria-label="Project" required defaultValue=""><option value="" disabled>Add to project</option>{projects?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select><button className="btn-ghost btn-sm">Add</button></form>}
                <ConfirmButton action={deleteGeneration} fields={{ id: g.id }} label="Delete" title="Delete this record?" message="The history record is removed. Saved output files stay in your asset library." />
              </div>
            </div>
          </div>
        </article>))}</div>
        : <Empty title="No generations found" text={sp.q || sp.type || sp.status ? 'Try different filters.' : 'Generated content will be recorded here.'} href="/app/create" cta="Generate a video" />}
    </>
  );
}
