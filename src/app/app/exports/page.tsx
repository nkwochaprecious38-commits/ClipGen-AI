import { getContext } from '@/lib/context';
import { PageHeader, Empty, fmtDate } from '@/components/ui';
import { createExport } from '../actions';
import { signedUrls } from '@/lib/data';

export const metadata = { title: 'Exports' };
export default async function Exports() {
  const ctx = await getContext(); const sb = ctx.supabase;
  const [{ data: exps }, { data: assets }] = await Promise.all([
    sb.from('exports').select('id, format, created_at, assets(name, storage_path), projects(title)').order('created_at', { ascending: false }),
    sb.from('assets').select('id, name, kind').in('kind', ['video', 'image']).order('created_at', { ascending: false }).limit(100),
  ]);
  const urls = await signedUrls(ctx, (exps ?? []).map((e: any) => (Array.isArray(e.assets) ? e.assets[0] : e.assets)?.storage_path).filter(Boolean));
  return (
    <>
      <PageHeader title="Exports" text="Download finished media and keep a record of what was exported. Media is exported in the format it was created in." />
      <form action={createExport} className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1"><label className="label" htmlFor="a">Asset to export</label><select id="a" name="assetId" className="input" required defaultValue=""><option value="" disabled>Choose an asset</option>{assets?.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.kind})</option>)}</select></div>
        <button className="btn-primary">Create export record</button>
      </form>
      {exps?.length ? <div className="card divide-y divide-line">{exps.map((e: any) => { const a = Array.isArray(e.assets) ? e.assets[0] : e.assets; const pr = Array.isArray(e.projects) ? e.projects[0] : e.projects; return (
        <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><div><p className="font-medium">{a?.name ?? 'Deleted asset'}</p><p className="text-xs text-mute">{e.format}{pr ? `, ${pr.title}` : ''}, {fmtDate(e.created_at)}</p></div>
          {a && urls[a.storage_path] && <a href={urls[a.storage_path]} download={a.name} className="btn-ghost btn-sm">Download</a>}</div>); })}</div>
        : <Empty title="No exports yet" text="Choose an asset above to record and download an export." />}
    </>
  );
}
