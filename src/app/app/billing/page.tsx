import { getContext } from '@/lib/context';
import { PageHeader, Status, Notice, fmtDate, label } from '@/components/ui';
import { PLANS, getPlan } from '@/lib/plans';
import { selectPlan, cancelSubscription } from '../actions';
import { ConfirmButton } from '@/components/Confirm';

export const metadata = { title: 'Billing and Subscription' };
export default async function Billing({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const sp = await searchParams; const ctx = await getContext();
  const [{ data: subs }, { data: bills }] = await Promise.all([
    ctx.supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(10),
    ctx.supabase.from('billing_records').select('*').order('created_at', { ascending: false }).limit(20),
  ]);
  const current = subs?.find((s) => ['active', 'pending_payment'].includes(s.status));
  const curPlan = current ? getPlan(current.plan_key) : null;
  return (
    <>
      <PageHeader title="Billing and Subscription" text="Choose a plan and manage your subscription." />
      <Notice tone="warn"><p>Payment is completed on Selar. ClipGen AI does not yet receive payment confirmations automatically, so a selected plan stays at Payment pending until the workspace owner confirms it. Credit allowances and plan contents are to be confirmed.</p></Notice>
      {current && (
        <section className="card mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <div><p className="text-xs text-mute">Current selection</p><p className="mt-1 text-lg font-bold">{curPlan?.name ?? current.plan_key}{curPlan && <span className="ml-2 text-sm font-normal text-mute">${curPlan.priceUsd} per month</span>}</p><div className="mt-2 flex items-center gap-3"><Status value={current.status} /><span className="text-xs text-mute">Selected {fmtDate(current.created_at)}</span></div></div>
          <div className="flex flex-wrap gap-2">{curPlan && current.status === 'pending_payment' && <a href={curPlan.checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">Continue to checkout</a>}
            <ConfirmButton action={cancelSubscription} fields={{ id: current.id }} label="Cancel subscription" title="Cancel this subscription?" message="This ends the subscription in ClipGen AI. Recurring charges on Selar must also be cancelled using the link in your Selar billing emails." confirmLabel="Cancel subscription" className="btn-danger" /></div>
        </section>
      )}
      <div className="grid gap-6 md:grid-cols-3">{PLANS.map((p) => {
        const mine = current?.plan_key === p.key; const preselect = sp.plan === p.key;
        return (
          <div key={p.key} className={`card flex flex-col p-6 ${preselect || p.recommended ? 'border-accent' : ''}`}>
            <h2 className="font-bold">{p.name}</h2><p className="mt-4 font-head text-4xl font-extrabold">${p.priceUsd}<span className="ml-1 text-sm font-medium text-mute">per month</span></p>
            <p className="mt-4 flex-1 text-xs text-mute">Credits, storage and limits: to be confirmed.</p>
            <form action={selectPlan} className="mt-5"><input type="hidden" name="plan" value={p.key} /><button className={`${mine ? 'btn-ghost' : 'btn-primary'} w-full`} disabled={mine}>{mine ? 'Selected' : current ? 'Switch to this plan' : 'Select plan'}</button></form>
          </div>);
      })}</div>
      <section className="card mt-8 overflow-x-auto"><h2 className="p-5 pb-3 font-bold">Billing history</h2>
        {bills?.length ? <table className="w-full min-w-[480px] text-left text-sm"><tbody className="divide-y divide-line">{bills.map((b) => <tr key={b.id}><td className="px-5 py-3 text-mute">{fmtDate(b.created_at)}</td><td>${b.amount_usd}</td><td>{label(b.status)}</td><td className="px-5 text-mute">{b.provider_reference}</td></tr>)}</tbody></table> : <p className="px-5 pb-6 text-sm text-mute">No billing records. Payments made on Selar are recorded here once confirmation is connected.</p>}</section>
    </>
  );
}
