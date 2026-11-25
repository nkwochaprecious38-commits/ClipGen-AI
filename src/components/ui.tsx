import Link from 'next/link';
import { AlertTriangle, Info } from 'lucide-react';

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{text && <p className="mt-1.5 max-w-2xl text-sm text-mute">{text}</p>}</div>{action}
    </div>
  );
}
export function Empty({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center"><h3 className="font-bold">{title}</h3><p className="mt-1.5 max-w-sm text-sm text-mute">{text}</p>
      {href && cta && <Link href={href} className="btn-primary mt-5">{cta}</Link>}</div>
  );
}
const TONE: Record<string, string> = { completed: 'text-ok border-ok/40', processing: 'text-accent2 border-accent/40', queued: 'text-warn border-warn/40', failed: 'text-bad border-bad/40', cancelled: 'text-mute border-line',
  draft: 'text-mute border-line', in_progress: 'text-accent2 border-accent/40', review: 'text-warn border-warn/40', archived: 'text-mute border-line', active: 'text-ok border-ok/40', pending_payment: 'text-warn border-warn/40' };
export const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export function Status({ value }: { value: string }) { return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${TONE[value] || 'text-mute border-line'}`}>{label(value)}</span>; }
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: React.ReactNode }) {
  const I = tone === 'warn' ? AlertTriangle : Info;
  return <div className={`mb-6 flex gap-3 rounded-xl border p-4 text-sm text-mute ${tone === 'warn' ? 'border-warn/40 bg-warn/5' : 'border-line bg-bg2'}`} role={tone === 'warn' ? 'alert' : undefined}><I size={18} className={`mt-0.5 shrink-0 ${tone === 'warn' ? 'text-warn' : 'text-accent2'}`} /><div>{children}</div></div>;
}
export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`);
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
