import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, Empty, label } from '@/components/ui';
import { Scene } from '@/components/Scene';
import { createFromTemplate } from '../actions';

export const metadata = { title: 'Templates' };
const CATS = ['Social Media', 'Product Videos', 'Advertising', 'Cinematic', 'Educational', 'Brand Content', 'Storytelling', 'Animation', 'Promotional Videos'];
const SCENES: Record<string, string> = { 'Social Media': 'city', 'Product Videos': 'studio', Advertising: 'desert', Cinematic: 'mountain', Educational: 'forest', 'Brand Content': 'studio', Storytelling: 'ocean', Animation: 'forest', 'Promotional Videos': 'city' };

export default async function Templates({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const sp = await searchParams; const ctx = await getContext();
  let q = ctx.supabase.from('templates').select('*').order('title'); if (sp.cat) q = q.eq('category', sp.cat);
  const { data } = await q;
  return (
    <>
      <PageHeader title="Templates" text="Built in starting points. Each creates a project with the workflow and a starting prompt already in place." />
      <div className="mb-6 flex flex-wrap gap-2"><Link href="/app/templates" className={`chip ${!sp.cat ? 'border-accent text-ink' : ''}`}>All</Link>{CATS.map((c) => <Link key={c} href={`/app/templates?cat=${encodeURIComponent(c)}`} className={`chip ${sp.cat === c ? 'border-accent text-ink' : 'hover:text-ink'}`}>{c}</Link>)}</div>
      {data?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((t) => (
        <article key={t.id} className="card flex flex-col overflow-hidden">
          <div className="relative aspect-video"><Scene variant={SCENES[t.category] ?? 'mountain'} /><span className="absolute left-3 top-3 rounded-full bg-bg/80 px-2.5 py-0.5 text-[11px]">{t.is_builtin ? 'Built in template' : 'Your template'}</span></div>
          <div className="flex flex-1 flex-col p-5"><h2 className="font-bold">{t.title}</h2><p className="mt-1.5 text-sm text-mute">{t.description}</p>
            <p className="mt-3 text-xs text-mute">{t.category}. Workflow: {label(t.workflow)}</p>{t.starting_prompt && <p className="mt-2 line-clamp-2 rounded-md bg-bg2 px-3 py-2 text-xs text-mute">{t.starting_prompt}</p>}
            <form action={createFromTemplate} className="mt-4"><input type="hidden" name="slug" value={t.slug} /><button className="btn-primary w-full">Create from template</button></form></div>
        </article>))}</div> : <Empty title="No templates" text="Run the database migration to load the built in templates." />}
    </>
  );
}
