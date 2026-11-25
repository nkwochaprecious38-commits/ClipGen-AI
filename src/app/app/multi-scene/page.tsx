import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, Empty, Status } from '@/components/ui';
import { createStoryboard } from '../actions';
export const metadata = { title: 'Multi Scene Video' };
const STEPS = ['Define the concept', 'Plan scenes and prompts', 'Generate each scene clip', 'Review and regenerate', 'Arrange scenes in order', 'Preview the sequence'];
export default async function MultiScene() {
  const ctx = await getContext();
  const { data: boards } = await ctx.supabase.from('storyboards').select('id, title, status, scenes(id)').order('updated_at', { ascending: false });
  const { data: projects } = await ctx.supabase.from('projects').select('id, title');
  return (
    <>
      <PageHeader title="Multi Scene Video" text="Build a structured video from a sequence of scenes. Each scene is generated as its own clip." />
      <ol className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{STEPS.map((s, i) => <li key={s} className="card p-3 text-xs"><span className="font-head font-bold text-accent2">{String(i + 1).padStart(2, '0')}</span><p className="mt-1">{s}</p></li>)}</ol>
      <form action={createStoryboard} className="card mb-8 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1"><label className="label" htmlFor="t">Video idea</label><input id="t" name="title" className="input" required placeholder="Name your multi scene video" maxLength={120} /></div>
        <div><label className="label" htmlFor="p">Project</label><select id="p" name="projectId" className="input" defaultValue=""><option value="">None</option>{projects?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <button className="btn-primary">Start storyboard</button>
      </form>
      {boards?.length ? <div className="grid gap-3 sm:grid-cols-2">{boards.map((b: any) => <Link key={b.id} href={`/app/storyboards/${b.id}`} className="card flex items-center justify-between p-4 hover:border-accent/60"><div><p className="font-medium">{b.title}</p><p className="text-xs text-mute">{b.scenes?.length ?? 0} scenes</p></div><Status value={b.status} /></Link>)}</div> : <Empty title="No multi scene videos yet" text="Start a storyboard above." />}
    </>
  );
}
