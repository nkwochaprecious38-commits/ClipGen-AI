import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, fmtDate, label, Notice } from '@/components/ui';
import { UsageChart } from '@/components/UsageChart';

export const metadata = { title: 'Credits and Usage' };
export default async function Credits() {
  const ctx = await getContext(); const sb = ctx.supabase;
  const [{ data: bal }, { data: tx }, { data: gens }, { data: projects }] = await Promise.all([
    sb.from('credit_balances').select('*').eq('workspace_id', ctx.workspaceId!).maybeSingle(),
    sb.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('generations').select('id, type, project_id, credit_cost, status'), sb.from('projects').select('id, title'),
  ]);
  // Net spend per generation: reserve minus refund, so failed generations do not count.
  const net: Record<string, number> = {}; tx?.forEach((t) => { if (t.generation_id) net[t.generation_id] = (net[t.generation_id] ?? 0) - t.amount; });
  const byType: Record<string, number> = {}, byProject: Record<string, number> = {};
  gens?.forEach((g) => { const n = net[g.id] ?? 0; if (n <= 0) return; byType[g.type] = (byType[g.type] ?? 0) + n; const pn = projects?.find((p) => p.id === g.project_id)?.title ?? 'No project'; byProject[pn] = (byProject[pn] ?? 0) + n; });
  const typeData = Object.entries(byType).map(([k, v]) => ({ label: label(k), credits: v }));
  return (
    <>
      <PageHeader title="Credits and Usage" text="Balances are tracked on the server. Every deduction, refund and grant is recorded." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Available credits', bal?.balance ?? 0], ['Credits used', bal?.lifetime_used ?? 0], ['Credits granted', bal?.lifetime_granted ?? 0]].map(([k, v]) => <div key={k as string} className="card p-5"><p className="text-xs text-mute">{k}</p><p className="mt-2 font-head text-3xl font-extrabold">{(v as number).toLocaleString()}</p></div>)}
        <div className="card p-5"><p className="text-xs text-mute">Monthly allowance</p><p className="mt-2 font-head text-3xl font-extrabold">{bal?.monthly_allowance ? bal.monthly_allowance.toLocaleString() : 'Pending'}</p>{!bal?.monthly_allowance && <p className="mt-1 text-xs text-mute">Set by plan contents, to be confirmed</p>}</div>
      </div>
      {!bal?.balance && <Notice>Your balance is zero. Credits are added when a plan is activated or when the workspace owner grants them. <Link href="/app/billing" className="text-accent2 hover:underline">View plans</Link></Notice>}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="font-bold">Usage by generation type</h2><div className="mt-4"><UsageChart data={typeData} /></div></section>
        <section className="card p-5"><h2 className="font-bold">Usage by project</h2>{Object.keys(byProject).length ? <ul className="mt-3 divide-y divide-line">{Object.entries(byProject).sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k} className="flex justify-between py-2.5 text-sm"><span>{k}</span><span>{v.toLocaleString()} credits</span></li>)}</ul> : <p className="mt-4 text-sm text-mute">No usage recorded yet.</p>}</section>
      </div>
      <section className="card overflow-x-auto"><h2 className="p-5 pb-3 font-bold">Transaction history</h2>
        {tx?.length ? <table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs text-mute"><tr><th className="px-5 py-2 font-medium">Date</th><th className="py-2 font-medium">Type</th><th className="py-2 font-medium">Reason</th><th className="py-2 text-right font-medium">Amount</th><th className="px-5 py-2 text-right font-medium">Balance</th></tr></thead>
          <tbody className="divide-y divide-line">{tx.map((t) => <tr key={t.id}><td className="px-5 py-3 text-mute">{fmtDate(t.created_at)}</td><td>{label(t.kind)}</td><td className="text-mute">{t.reason}</td><td className={`text-right ${t.amount < 0 ? 'text-bad' : 'text-ok'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</td><td className="px-5 text-right">{t.balance_after}</td></tr>)}</tbody></table>
          : <p className="px-5 pb-6 text-sm text-mute">No transactions yet.</p>}</section>
    </>
  );
}
