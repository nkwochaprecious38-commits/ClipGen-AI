import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { SectionHead, CrossLinks } from '@/components/MarketingBits';

export const metadata: Metadata = {
  title: 'Pricing: ClipGen AI Subscription Plans',
  description: 'Monthly ClipGen AI subscription plans for AI video generation, image animation and creative production.',
};

const TBC = 'To be confirmed';
const ROWS: [string, (p: (typeof PLANS)[number]) => string][] = [
  ['Billing', (p) => `$${p.priceUsd} per month`],
  ['Monthly credits', (p) => (p.monthlyCredits === null ? TBC : String(p.monthlyCredits))],
  ['Storage', (p) => (p.storageGb === null ? TBC : `${p.storageGb} GB`)],
  ['Project limit', (p) => (p.projectLimit === null ? TBC : String(p.projectLimit))],
  ['Export quality', (p) => p.exportQuality ?? TBC],
];

export default function Pricing() {
  return (
    <>
      <section className="container-x pt-16">
        <SectionHead eyebrow="Pricing" title="Simple monthly plans" text="Three subscription tiers billed monthly in US dollars." center />
        <div className="mx-auto mt-8 flex max-w-3xl gap-3 rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm text-mute">
          <Info size={18} className="mt-0.5 shrink-0 text-warn" />
          <p>Prices and billing frequency come from the Selar subscription pages. Those pages do not publish plan names, credit allowances, storage, project limits or feature lists, so those fields are marked To be confirmed and the plan names are placeholders until the package contents are supplied.</p>
        </div>
      </section>
      <section className="container-x py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.key} className={`card relative flex flex-col p-7 ${p.recommended ? 'border-accent ring-1 ring-accent' : ''}`}>
              {p.recommended && <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-white">Recommended</span>}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="mt-1 text-xs text-mute">Plan name pending confirmation</p>
              <p className="mt-6 font-head text-5xl font-extrabold">${p.priceUsd}<span className="ml-1 text-base font-medium text-mute">per month</span></p>
              <dl className="mt-7 flex-1 space-y-3 border-t border-line pt-6 text-sm">
                {ROWS.slice(1).map(([k, f]) => (<div key={k} className="flex justify-between gap-4"><dt className="text-mute">{k}</dt><dd className={f(p) === TBC ? 'text-warn' : ''}>{f(p)}</dd></div>))}
                <div className="flex justify-between gap-4"><dt className="text-mute">Creative tools</dt><dd className="text-right">Full workspace</dd></div>
              </dl>
              <Link href={`/signup?plan=${p.key}`} className={`${p.recommended ? 'btn-primary' : 'btn-ghost'} mt-8`}>Choose {p.name}</Link>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x pb-20">
        <h2 className="text-2xl font-bold">Compare plans</h2>
        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-bg2"><tr><th className="p-4 font-medium text-mute">Feature</th>{PLANS.map((p) => <th key={p.key} className="p-4 font-semibold">{p.name}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{ROWS.map(([k, f]) => (<tr key={k}><td className="p-4 text-mute">{k}</td>{PLANS.map((p) => <td key={p.key} className={`p-4 ${f(p) === TBC ? 'text-warn' : ''}`}>{f(p)}</td>)}</tr>))}</tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-mute">Checkout is completed on Selar. Subscription activation after payment is confirmed by the account owner until automatic confirmation is connected.</p>
        <CrossLinks />
      </section>
    </>
  );
}
