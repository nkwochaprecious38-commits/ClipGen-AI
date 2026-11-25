import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getContext } from '@/lib/context';
import { PageHeader, Empty, Status, fmtDate } from '@/components/ui';
import { createProject } from '../actions';
import { signedUrls } from '@/lib/data';

export const metadata = { title: 'Projects' };
const STATUS = ['draft', 'in_progress', 'review', 'completed', 'archived'];

export default async function Projects({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; sort?: string; new?: string }> }) {
  const sp = await searchParams; const ctx = await getContext();
  let q = ctx.supabase.from('projects').select('id, title, description, status, created_at, updated_at, owner_id');
  if (sp.q) q = q.ilike('title', `%${sp.q.replace(/[%,]/g, '')}%`);
  if (sp.status && STATUS.includes(sp.status)) q = q.eq('status', sp.status);
  q = sp.sort === 'title' ? q.order('title') : sp.sort === 'created' ? q.order('created_at', { ascending: false }) : q.order('updated_at', { ascending: false });
  const { data: projects } = await q;
  const ids = (projects ?? []).map((p) => p.id);
  const { data: covers } = ids.length ? await ctx.supabase.from('assets').select('project_id, storage_path, kind').in('project_id', ids).eq('kind', 'image').order('created_at', { ascending: false }) : { data: [] as any[] };
  const urls = await signedUrls(ctx, (covers ?? []).map((c: any) => c.storage_path));
  const cover = (id: string) => { const c = (covers ?? []).find((x: any) => x.project_id === id); return c ? urls[c.storage_path] : null; };
  return (
    <>
      <PageHeader title="Projects" text="Organize generations, assets, prompts and storyboards by production." action={<Link href="/app/projects?new=1" className="btn-primary"><Plus size={16} />New project</Link>} />
      {sp.new && (
        <form action={createProject} className="card mb-6 grid gap-4 p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div><label className="label" htmlFor="title">Project title</label><input id="title" name="title" className="input" required autoFocus maxLength={120} /></div>
          <div><label className="label" htmlFor="description">Description</label><input id="description" name="description" className="input" maxLength={500} /></div>
          <div className="flex gap-2"><button className="btn-primary">Create</button><Link href="/app/projects" className="btn-ghost">Cancel</Link></div>
        </form>
      )}
      <form className="mb-6 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={sp.q} className="input max-w-xs" placeholder="Search projects" aria-label="Search projects" />
        <select name="status" defaultValue={sp.status ?? ''} className="input w-auto" aria-label="Status"><option value="">All statuses</option>{STATUS.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>)}</select>
        <select name="sort" defaultValue={sp.sort ?? ''} className="input w-auto" aria-label="Sort"><option value="">Recently modified</option><option value="created">Newest</option><option value="title">Title</option></select>
        <button className="btn-ghost">Apply</button>
      </form>
      {projects?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => (
          <Link key={p.id} href={`/app/projects/${p.id}`} className="card group overflow-hidden transition-colors hover:border-accent/60">
            <div className="flex aspect-video items-center justify-center bg-bg2">{cover(p.id) ? <img src={cover(p.id)!} alt={`Cover for ${p.title}`} className="h-full w-full object-cover" /> : <span className="text-xs text-mute">No cover image</span>}</div>
            <div className="p-4"><p className="truncate font-bold">{p.title}</p><p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-mute">{p.description || 'No description'}</p>
              <div className="mt-3 flex items-center justify-between"><Status value={p.status} /><span className="text-xs text-mute">Modified {fmtDate(p.updated_at)}</span></div></div></Link>))}</div>
      ) : <Empty title={sp.q || sp.status ? 'No matching projects' : 'No projects yet'} text={sp.q || sp.status ? 'Try a different search or filter.' : 'Create your first project to get started.'} href={sp.q || sp.status ? undefined : '/app/projects?new=1'} cta="New project" />}
    </>
  );
}
