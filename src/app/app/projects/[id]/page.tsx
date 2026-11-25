import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContext } from '@/lib/context';
import { PageHeader, Status, Empty, fmtDate, fmtBytes, label } from '@/components/ui';
import { updateProject, deleteProject, createStoryboard } from '../../actions';
import { ConfirmButton } from '@/components/Confirm';
import { ProjectUpload } from '@/components/ProjectUpload';
import { signedUrls } from '@/lib/data';

const TABS = ['overview', 'generations', 'storyboard', 'assets', 'prompts', 'exports', 'activity'];
export const metadata = { title: 'Project' };

export default async function Project({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params; const tab = TABS.includes((await searchParams).tab ?? '') ? (await searchParams).tab! : 'overview';
  const ctx = await getContext(); const sb = ctx.supabase;
  const { data: p } = await sb.from('projects').select('*').eq('id', id).maybeSingle(); if (!p) notFound();
  const { data: owner } = await sb.from('profiles').select('full_name').eq('id', p.owner_id).maybeSingle();
  const { data: gens } = tab === 'generations' ? await sb.from('generations').select('*').eq('project_id', id).order('created_at', { ascending: false }) : { data: [] as any[] };
  const { data: boards } = tab === 'storyboard' ? await sb.from('storyboards').select('*').eq('project_id', id) : { data: [] as any[] };
  const { data: assets } = tab === 'assets' ? await sb.from('assets').select('*').eq('project_id', id).order('created_at', { ascending: false }) : { data: [] as any[] };
  const { data: prompts } = tab === 'prompts' ? await sb.from('prompts').select('*').eq('project_id', id) : { data: [] as any[] };
  const { data: exps } = tab === 'exports' ? await sb.from('exports').select('*, assets(name)').eq('project_id', id).order('created_at', { ascending: false }) : { data: [] as any[] };
  const { data: acts } = tab === 'activity' ? await sb.from('activity_logs').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(50) : { data: [] as any[] };
  const urls = await signedUrls(ctx, (assets ?? []).map((a: any) => a.storage_path));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/app/projects" className="text-accent2 hover:underline">Projects</Link></p>
      <PageHeader title={p.title} text={p.description || undefined} action={<Status value={p.status} />} />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => <Link key={t} href={`?tab=${t}`} role="tab" aria-selected={tab === t} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm capitalize ${tab === t ? 'border-accent text-ink' : 'border-transparent text-mute hover:text-ink'}`}>{t}</Link>)}
      </div>
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <form action={updateProject} className="card space-y-4 p-5">
            <input type="hidden" name="id" value={p.id} />
            <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" defaultValue={p.title} className="input" required maxLength={120} /></div>
            <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" defaultValue={p.description} className="input min-h-20" /></div>
            <div><label className="label" htmlFor="status">Status</label><select id="status" name="status" defaultValue={p.status} className="input">{['draft', 'in_progress', 'review', 'completed', 'archived'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
            <div><label className="label" htmlFor="notes">Notes</label><textarea id="notes" name="notes" defaultValue={p.notes} className="input min-h-32" /></div>
            <button className="btn-primary">Save project</button>
          </form>
          <div className="space-y-4">
            <dl className="card space-y-3 p-5 text-sm"><div className="flex justify-between"><dt className="text-mute">Owner</dt><dd>{owner?.full_name || 'Unknown'}</dd></div><div className="flex justify-between"><dt className="text-mute">Created</dt><dd>{fmtDate(p.created_at)}</dd></div><div className="flex justify-between"><dt className="text-mute">Last modified</dt><dd>{fmtDate(p.updated_at)}</dd></div></dl>
            <div className="card space-y-2 p-5 text-sm"><p className="font-bold">Create in this project</p>
              <Link href={`/app/create?project=${p.id}`} className="btn-ghost w-full">Generate video</Link><Link href="/app/images" className="btn-ghost w-full">Generate image</Link></div>
            <ConfirmButton action={deleteProject} fields={{ id: p.id }} label="Delete project" title="Delete this project?" message="The project record is removed. Assets stay in your library but are no longer linked to it." className="btn-danger w-full" />
          </div>
        </div>
      )}
      {tab === 'generations' && (gens?.length ? <ul className="space-y-3">{gens.map((g: any) => <li key={g.id} className="card flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate text-sm">{g.prompt}</p><p className="mt-1 text-xs text-mute">{label(g.type)} on {fmtDate(g.created_at)}, {g.credit_cost} credits</p></div><Status value={g.status} /></li>)}</ul> : <Empty title="No generations" text="Generate content and choose this project to see it here." href={`/app/create?project=${p.id}`} cta="Generate video" />)}
      {tab === 'storyboard' && (<div className="space-y-4">
        <form action={createStoryboard} className="card flex flex-wrap items-end gap-3 p-4"><input type="hidden" name="projectId" value={p.id} /><div className="min-w-[200px] flex-1"><label className="label" htmlFor="sbt">New storyboard</label><input id="sbt" name="title" className="input" required placeholder="Storyboard title" /></div><button className="btn-primary">Create</button></form>
        {boards?.length ? <ul className="space-y-3">{boards.map((b: any) => <li key={b.id}><Link href={`/app/storyboards/${b.id}`} className="card flex items-center justify-between p-4 hover:border-accent/60"><span>{b.title}</span><Status value={b.status} /></Link></li>)}</ul> : <Empty title="No storyboards" text="Plan scenes before you generate." />}</div>)}
      {tab === 'assets' && (<div className="space-y-4"><ProjectUpload workspaceId={ctx.workspaceId!} projectId={p.id} />
        {assets?.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{assets.map((a: any) => <div key={a.id} className="card overflow-hidden"><div className="aspect-video bg-bg2">{a.kind === 'image' ? <img src={urls[a.storage_path]} alt={a.name} className="h-full w-full object-cover" /> : a.kind === 'video' ? <video src={urls[a.storage_path]} className="h-full w-full object-cover" muted preload="metadata" /> : null}</div><div className="p-3"><p className="truncate text-sm">{a.name}</p><p className="text-xs text-mute">{fmtBytes(a.size_bytes)}</p></div></div>)}</div> : <Empty title="No assets" text="Upload files or save generations to this project." />}</div>)}
      {tab === 'prompts' && (prompts?.length ? <ul className="space-y-3">{prompts.map((x: any) => <li key={x.id} className="card p-4"><p className="font-medium">{x.title}</p><p className="mt-1 text-sm text-mute">{x.body}</p></li>)}</ul> : <Empty title="No prompts" text="Associate prompts with this project from the Prompt Library." href="/app/prompts" cta="Open Prompt Library" />)}
      {tab === 'exports' && (exps?.length ? <ul className="space-y-3">{exps.map((x: any) => <li key={x.id} className="card flex justify-between p-4 text-sm"><span>{x.assets?.name ?? 'Deleted asset'}</span><span className="text-mute">{x.format} on {fmtDate(x.created_at)}</span></li>)}</ul> : <Empty title="No exports" text="Record an export from the Exports page." href="/app/exports" cta="Open Exports" />)}
      {tab === 'activity' && (acts?.length ? <ul className="card divide-y divide-line">{acts.map((a: any) => <li key={a.id} className="flex justify-between gap-3 p-4 text-sm"><span>{a.action}<span className="text-mute">: {a.detail}</span></span><span className="shrink-0 text-xs text-mute">{fmtDate(a.created_at)}</span></li>)}</ul> : <Empty title="No activity" text="Changes to this project are recorded here." />)}
    </>
  );
}
