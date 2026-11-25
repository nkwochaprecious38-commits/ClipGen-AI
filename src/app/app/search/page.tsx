import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, Empty, label } from '@/components/ui';

export const metadata = { title: 'Search' };
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const term = ((await searchParams).q ?? '').trim().replace(/[%,()]/g, ''); const ctx = await getContext(); const sb = ctx.supabase; const like = `%${term}%`;
  const groups: { title: string; items: { id: string; label: string; sub?: string; href: string }[] }[] = [];
  if (term) {
    const [p, a, t, pr, g, sbd] = await Promise.all([
      sb.from('projects').select('id, title, description').or(`title.ilike.${like},description.ilike.${like}`).limit(8),
      sb.from('assets').select('id, name, kind').or(`name.ilike.${like},description.ilike.${like}`).limit(8),
      sb.from('templates').select('slug, title, category').or(`title.ilike.${like},description.ilike.${like}`).limit(8),
      sb.from('prompts').select('id, title, body').or(`title.ilike.${like},body.ilike.${like}`).limit(8),
      sb.from('generations').select('id, prompt, type').ilike('prompt', like).limit(8),
      sb.from('storyboards').select('id, title').ilike('title', like).limit(8),
    ]);
    groups.push({ title: 'Projects', items: (p.data ?? []).map((x) => ({ id: x.id, label: x.title, sub: x.description, href: `/app/projects/${x.id}` })) },
      { title: 'Assets, videos and images', items: (a.data ?? []).map((x) => ({ id: x.id, label: x.name, sub: x.kind, href: '/app/assets' })) },
      { title: 'Templates', items: (t.data ?? []).map((x) => ({ id: x.slug, label: x.title, sub: x.category, href: `/app/templates?cat=${encodeURIComponent(x.category)}` })) },
      { title: 'Prompts', items: (pr.data ?? []).map((x) => ({ id: x.id, label: x.title, sub: x.body, href: `/app/prompts?q=${encodeURIComponent(term)}` })) },
      { title: 'Generation history', items: (g.data ?? []).map((x) => ({ id: x.id, label: x.prompt, sub: label(x.type), href: `/app/history?q=${encodeURIComponent(term)}` })) },
      { title: 'Storyboards', items: (sbd.data ?? []).map((x) => ({ id: x.id, label: x.title, href: `/app/storyboards/${x.id}` })) });
  }
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <PageHeader title="Search" text={term ? `Results for "${term}"` : 'Use the search box above to find projects, assets, prompts, templates and history.'} />
      {term && !total && <Empty title="No results" text="Try a different search term." />}
      <div className="space-y-6">{groups.filter((g) => g.items.length).map((g) => (
        <section key={g.title}><h2 className="mb-2 text-sm font-bold text-mute">{g.title}</h2><ul className="card divide-y divide-line">{g.items.map((i) => <li key={i.id}><Link href={i.href} className="block px-4 py-3 hover:bg-bg2"><p className="truncate text-sm">{i.label}</p>{i.sub && <p className="truncate text-xs text-mute">{i.sub}</p>}</Link></li>)}</ul></section>))}</div>
    </>
  );
}
