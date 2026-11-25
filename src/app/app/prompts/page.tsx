import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getContext } from '@/lib/context';
import { PageHeader, Empty } from '@/components/ui';
import { savePrompt, deletePrompt } from '../actions';
import { ConfirmButton } from '@/components/Confirm';

export const metadata = { title: 'Prompt Library' };
const CATS = ['Cinematic', 'Product Videos', 'Advertising', 'Social Media', 'Animation', 'Photography', 'Storytelling', 'Business', 'Educational', 'Experimental'];

export default async function Prompts({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; edit?: string; new?: string }> }) {
  const sp = await searchParams; const ctx = await getContext();
  let q = ctx.supabase.from('prompts').select('*').order('updated_at', { ascending: false });
  if (sp.cat && CATS.includes(sp.cat)) q = q.eq('category', sp.cat);
  if (sp.q) { const t = sp.q.replace(/[%,()]/g, ''); q = q.or(`title.ilike.%${t}%,body.ilike.%${t}%,notes.ilike.%${t}%`); }
  const [{ data: prompts }, { data: projects }] = await Promise.all([q, ctx.supabase.from('projects').select('id, title')]);
  const editing = sp.edit ? prompts?.find((p) => p.id === sp.edit) : null;
  const showForm = sp.new || editing;
  const pt = (id: string | null) => projects?.find((p) => p.id === id)?.title;
  return (
    <>
      <PageHeader title="Prompt Library" text="Save, organize and reuse the prompts that work." action={<Link href="/app/prompts?new=1" className="btn-primary"><Plus size={16} />New prompt</Link>} />
      {showForm && (
        <form action={savePrompt} className="card mb-6 space-y-4 p-5">
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="t">Title</label><input id="t" name="title" className="input" defaultValue={editing?.title} required maxLength={120} /></div>
            <div><label className="label" htmlFor="c">Category</label><select id="c" name="category" className="input" defaultValue={editing?.category ?? 'Cinematic'}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div></div>
          <div><label className="label" htmlFor="b">Prompt</label><textarea id="b" name="body" className="input min-h-24" defaultValue={editing?.body} required maxLength={2000} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="n">Notes</label><input id="n" name="notes" className="input" defaultValue={editing?.notes} /></div>
            <div><label className="label" htmlFor="pr">Project</label><select id="pr" name="projectId" className="input" defaultValue={editing?.project_id ?? ''}><option value="">None</option>{projects?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div></div>
          <label className="flex items-center gap-2 text-sm text-mute"><input type="checkbox" name="isTemplate" defaultChecked={editing?.is_template} className="accent-[#8B5CF6]" />Save as a reusable template</label>
          <div className="flex gap-2"><button className="btn-primary">Save prompt</button><Link href="/app/prompts" className="btn-ghost">Cancel</Link></div>
        </form>
      )}
      <form className="mb-4 flex flex-wrap gap-3" role="search"><input name="q" defaultValue={sp.q} className="input max-w-xs" placeholder="Search prompts" aria-label="Search prompts" />{sp.cat && <input type="hidden" name="cat" value={sp.cat} />}<button className="btn-ghost">Search</button></form>
      <div className="mb-6 flex flex-wrap gap-2"><Link href="/app/prompts" className={`chip ${!sp.cat ? 'border-accent text-ink' : ''}`}>All</Link>{CATS.map((c) => <Link key={c} href={`/app/prompts?cat=${encodeURIComponent(c)}`} className={`chip ${sp.cat === c ? 'border-accent text-ink' : 'hover:text-ink'}`}>{c}</Link>)}</div>
      {prompts?.length ? (
        <div className="grid gap-4 md:grid-cols-2">{prompts.map((p) => (
          <article key={p.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3"><h2 className="font-bold">{p.title}</h2><span className="chip shrink-0">{p.category}</span></div>
            <p className="mt-2 line-clamp-4 flex-1 text-sm text-mute">{p.body}</p>
            {(p.notes || p.project_id || p.is_template) && <p className="mt-3 text-xs text-mute">{[p.is_template && 'Template', pt(p.project_id) && `Project: ${pt(p.project_id)}`, p.notes].filter(Boolean).join('. ')}</p>}
            <div className="mt-4 flex flex-wrap gap-2"><Link href={`/app/create?prompt=${encodeURIComponent(p.body)}`} className="btn-primary btn-sm">Use for video</Link><Link href={`/app/images?prompt=${encodeURIComponent(p.body)}`} className="btn-ghost btn-sm">Use for image</Link>
              <Link href={`/app/prompts?edit=${p.id}`} className="btn-ghost btn-sm">Edit</Link><ConfirmButton action={deletePrompt} fields={{ id: p.id }} label="Delete" title="Delete this prompt?" message="This cannot be undone." /></div>
          </article>))}</div>
      ) : <Empty title="No prompts found" text={sp.q || sp.cat ? 'Try another search or category.' : 'Save your first prompt to build a reusable library.'} href={sp.q || sp.cat ? undefined : '/app/prompts?new=1'} cta="New prompt" />}
    </>
  );
}
