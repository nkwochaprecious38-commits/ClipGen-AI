import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, Empty, fmtDate, label } from '@/components/ui';
import { markRead, clearNotifications } from '../actions';

export const metadata = { title: 'Notifications' };
export default async function Notifications() {
  const ctx = await getContext();
  const { data } = await ctx.supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  return (
    <>
      <PageHeader title="Notifications" text="Generation results, project updates, credits and billing." action={<div className="flex gap-2"><Link href="/app/settings?tab=notifications" className="btn-ghost btn-sm">Preferences</Link><form action={markRead}><input type="hidden" name="id" value="" /><button className="btn-ghost btn-sm">Mark all read</button></form><form action={clearNotifications}><input type="hidden" name="id" value="" /><button className="btn-ghost btn-sm">Clear all</button></form></div>} />
      {data?.length ? <ul className="card divide-y divide-line">{data.map((n) => (
        <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-line' : 'bg-accent'}`} aria-label={n.read_at ? 'Read' : 'Unread'} />
            <div><p className="text-sm font-medium">{n.title}</p>{n.body && <p className="mt-0.5 text-sm text-mute">{n.body}</p>}<p className="mt-1 text-xs text-mute">{label(n.category)} on {fmtDate(n.created_at)}</p></div></div>
          <div className="flex gap-2">{n.link && <Link href={n.link} className="btn-ghost btn-sm">View</Link>}{!n.read_at && <form action={markRead}><input type="hidden" name="id" value={n.id} /><button className="btn-ghost btn-sm">Mark read</button></form>}<form action={clearNotifications}><input type="hidden" name="id" value={n.id} /><button className="btn-ghost btn-sm">Clear</button></form></div>
        </li>))}</ul> : <Empty title="You are all caught up" text="New notifications appear here." />}
    </>
  );
}
