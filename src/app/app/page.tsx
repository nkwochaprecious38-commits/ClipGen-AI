import Link from 'next/link';
import { Video, ImagePlus, Scissors, Image as ImageIcon, Layers, FolderPlus, Zap } from 'lucide-react';
import { getContext } from '@/lib/context';
import { Empty, Status, fmtDate, label } from '@/components/ui';
import { UsageChart } from '@/components/UsageChart';
import { getPlan } from '@/lib/plans';
import { signedUrls } from '@/lib/data';

export const metadata = { title: 'Dashboard' };
const QUICK = [['Generate Video', '/app/create', Video], ['Animate Image', '/app/image-to-video', ImagePlus], ['Edit Video', '/app/editing', Scissors], ['Generate Image', '/app/images', ImageIcon], ['Create Multi Scene Video', '/app/multi-scene', Layers], ['Start New Project', '/app/projects?new=1', FolderPlus]] as const;

export default async function Dashboard() {
  const ctx = await getContext(); const sb = ctx.supabase;
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const [prof, bal, sub, projects, gens, acts, tpls, tx, projCount] = await Promise.all([
    sb.from('profiles').select('full_name').eq('id', ctx.user.id).maybeSingle(),
    sb.from('credit_balances').select('*').eq('workspace_id', ctx.workspaceId!).maybeSingle(),
    sb.from('subscriptions').select('*').eq('workspace_id', ctx.workspaceId!).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('projects').select('id, title, status, updated_at').order('updated_at', { ascending: false }).limit(4),
    sb.from('generations').select('id, prompt, type, status, created_at, output_asset_ids').order('created_at', { ascending: false }).limit(6),
    sb.from('activity_logs').select('id, action, detail, created_at').order('created_at', { ascending: false }).limit(6),
    sb.from('templates').select('slug, title, category').limit(4),
    sb.from('credit_transactions').select('amount, created_at, kind').eq('kind', 'reserve').gte('created_at', since),
    sb.from('projects').select('id', { count: 'exact', head: true }),
  ]);
  const days: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) days[new Date(Date.now() - i * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  tx.data?.forEach((t) => { const k = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); if (k in days) days[k] += -t.amount; });
  const chart = Object.entries(days).map(([label, credits]) => ({ label, credits }));
  const outIds = (gens.data ?? []).map((g) => g.output_asset_ids?.[0]).filter(Boolean) as string[];
  const { data: assets } = outIds.length ? await sb.from('assets').select('id, storage_path, kind').in('id', outIds) : { data: [] as any[] };
  const urls = await signedUrls(ctx, (assets ?? []).map((a: any) => a.storage_path));
  const thumb = (g: any) => { const a = (assets ?? []).find((x: any) => x.id === g.output_asset_ids?.[0]); return a ? { url: urls[a.storage_path], kind: a.kind } : null; };
  const name = (prof.data?.full_name || '').split(' ')[0];
  const plan = sub.data ? getPlan(sub.data.plan_key) : null;

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back{name ? `, ${name}` : ''}</h1><p className="mt-1 text-sm text-mute">Start something new or pick up where you left off.</p></div>
      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {QUICK.map(([l, h, Icon]) => <Link key={h} href={h} className="card flex flex-col gap-3 p-4 transition-colors hover:border-accent/60"><Icon size={20} className="text-accent2" /><span className="text-sm font-medium">{l}</span></Link>)}
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2"><h2 className="font-bold">Credit usage, last 14 days</h2><div className="mt-4"><UsageChart data={chart} /></div></section>
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Credits and plan</h2>
          <div><p className="font-head text-4xl font-extrabold">{(bal.data?.balance ?? 0).toLocaleString()}</p><p className="text-xs text-mute">available credits</p></div>
          <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-mute">Used to date</dt><dd>{(bal.data?.lifetime_used ?? 0).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Projects</dt><dd>{projCount.count ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Subscription</dt><dd>{sub.data ? `${plan?.name ?? sub.data.plan_key}: ${label(sub.data.status)}` : 'No plan selected'}</dd></div></dl>
          <Link href="/app/billing" className="btn-ghost w-full"><Zap size={14} />Manage plan</Link>
        </section>
      </div>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent projects</h2><Link href="/app/projects" className="text-sm text-accent2 hover:underline">All projects</Link></div>
        {projects.data?.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{projects.data.map((p) => (
          <Link key={p.id} href={`/app/projects/${p.id}`} className="card p-4 transition-colors hover:border-accent/60"><p className="truncate font-medium">{p.title}</p><div className="mt-3 flex items-center justify-between"><Status value={p.status} /><span className="text-xs text-mute">{fmtDate(p.updated_at)}</span></div></Link>))}</div>
          : <Empty title="No projects yet" text="Create a project to group your generations, assets and storyboards." href="/app/projects?new=1" cta="Start a project" />}</section>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent generations</h2><Link href="/app/history" className="text-sm text-accent2 hover:underline">Full history</Link></div>
        {gens.data?.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{gens.data.map((g) => { const t = thumb(g); return (
          <Link key={g.id} href="/app/history" className="card flex gap-3 p-3 transition-colors hover:border-accent/60">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-bg2">{t?.url && (t.kind === 'video' ? <video src={t.url} className="h-full w-full object-cover" muted preload="metadata" /> : <img src={t.url} alt="" className="h-full w-full object-cover" />)}</div>
            <div className="min-w-0"><p className="truncate text-sm">{g.prompt}</p><div className="mt-1.5 flex items-center gap-2"><Status value={g.status} /><span className="text-xs text-mute">{label(g.type)}</span></div></div></Link>); })}</div>
          : <Empty title="No generations yet" text="Your generated videos and images will appear here." href="/app/create" cta="Generate a video" />}</section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="font-bold">Project activity</h2>
          {acts.data?.length ? <ul className="mt-3 divide-y divide-line">{acts.data.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2.5 text-sm"><span>{a.action}<span className="text-mute">: {a.detail}</span></span><span className="shrink-0 text-xs text-mute">{fmtDate(a.created_at)}</span></li>)}</ul> : <p className="mt-3 text-sm text-mute">Activity appears here as you work.</p>}</section>
        <section className="card p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Starter templates</h2><Link href="/app/templates" className="text-sm text-accent2 hover:underline">All templates</Link></div>
          <ul className="mt-3 divide-y divide-line">{tpls.data?.map((t) => <li key={t.slug}><Link href="/app/templates" className="flex justify-between py-2.5 text-sm hover:text-accent2"><span>{t.title}</span><span className="text-mute">{t.category}</span></Link></li>)}</ul>
          {!tpls.data?.length && <p className="mt-3 text-sm text-mute">Built in templates appear after the migration is applied.</p>}</section>
      </div>
    </div>
  );
}
