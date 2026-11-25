'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, FolderPlus, X, Download, Film, ImageIcon, Music, File } from 'lucide-react';
import { Uploader, ACCEPT } from './Uploader';
import { ConfirmButton } from './Confirm';
import { renameAsset, deleteAsset, createFolder, deleteFolder } from '@/app/app/actions';
import { fmtBytes, fmtDate } from './ui';

type A = { id: string; name: string; description: string; kind: string; origin: string; mime_type: string; size_bytes: number; created_at: string; project_id: string | null; folder_id: string | null; url: string | null };
const CATS = ['All', 'Generated Videos', 'Uploaded Videos', 'Generated Images', 'Uploaded Images', 'Audio', 'Project Assets', 'Other Files'];
const inCat = (a: A, c: string) => c === 'All' || (c === 'Generated Videos' && a.kind === 'video' && a.origin === 'generated') || (c === 'Uploaded Videos' && a.kind === 'video' && a.origin === 'uploaded') ||
  (c === 'Generated Images' && a.kind === 'image' && a.origin === 'generated') || (c === 'Uploaded Images' && a.kind === 'image' && a.origin === 'uploaded') || (c === 'Audio' && a.kind === 'audio') || (c === 'Project Assets' && !!a.project_id) || (c === 'Other Files' && a.kind === 'other');
const Icon = ({ k }: { k: string }) => (k === 'video' ? <Film size={22} /> : k === 'image' ? <ImageIcon size={22} /> : k === 'audio' ? <Music size={22} /> : <File size={22} />);

export function AssetLibrary({ assets, folders, projects, workspaceId }: { assets: A[]; folders: { id: string; name: string }[]; projects: { id: string; title: string }[]; workspaceId: string }) {
  const router = useRouter();
  const [cat, setCat] = useState('All'); const [q, setQ] = useState(''); const [folder, setFolder] = useState<string>('all'); const [sel, setSel] = useState<A | null>(null); const [sort, setSort] = useState('new');
  const list = useMemo(() => assets.filter((a) => inCat(a, cat) && (folder === 'all' || a.folder_id === folder) && (a.name + a.description).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.size_bytes - a.size_bytes : +new Date(b.created_at) - +new Date(a.created_at)), [assets, cat, q, folder, sort]);
  return (
    <div className="space-y-6">
      <Uploader workspaceId={workspaceId} accept={`${ACCEPT.video},${ACCEPT.image},${ACCEPT.audio}`} label="Drop files or click to upload" multiple extra={folder !== 'all' ? { folderId: folder } : {}} onDone={() => router.refresh()} />
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Search assets" aria-label="Search assets" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest</option><option value="name">Name</option><option value="size">Size</option></select>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">{CATS.map((c) => <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`chip transition-colors ${cat === c ? 'border-accent bg-accent/15 text-ink' : 'hover:text-ink'}`}>{c}</button>)}</div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setFolder('all')} className={`chip ${folder === 'all' ? 'border-accent text-ink' : ''}`}>All folders</button>
        {folders.map((f) => <span key={f.id} className={`chip gap-1.5 ${folder === f.id ? 'border-accent text-ink' : ''}`}><button className="inline-flex items-center gap-1.5" onClick={() => setFolder(f.id)}><Folder size={12} />{f.name}</button>
          <ConfirmButton action={deleteFolder} fields={{ id: f.id }} label={<X size={11} />} title="Delete folder?" message="Assets inside move back to the main library." className="text-mute hover:text-bad" /></span>)}
        <form action={createFolder} className="flex items-center gap-1.5"><input name="name" className="input h-8 w-36 py-1 text-xs" placeholder="New folder" aria-label="New folder name" required maxLength={80} /><button className="btn-ghost btn-sm" aria-label="Create folder"><FolderPlus size={14} /></button></form>
      </div>
      {list.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{list.map((a) => (
          <button key={a.id} onClick={() => setSel(a)} className="card overflow-hidden text-left transition-colors hover:border-accent/60">
            <div className="flex aspect-video items-center justify-center bg-bg2 text-mute">{a.url && a.kind === 'image' ? <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" /> : a.url && a.kind === 'video' ? <video src={a.url} className="h-full w-full object-cover" muted preload="metadata" /> : <Icon k={a.kind} />}</div>
            <div className="p-3"><p className="truncate text-sm font-medium">{a.name}</p><p className="mt-0.5 text-xs text-mute">{fmtBytes(a.size_bytes)} on {fmtDate(a.created_at)}</p></div></button>))}</div>
      ) : <div className="card px-6 py-14 text-center text-sm text-mute">{assets.length ? 'No assets match these filters.' : 'No assets yet. Upload files or generate content to build your library.'}</div>}
      {sel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Asset details" onClick={() => setSel(null)}>
          <div className="card my-auto w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3"><h2 className="truncate font-bold">{sel.name}</h2><button aria-label="Close" onClick={() => setSel(null)}><X size={18} /></button></div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-bg2">{sel.url && sel.kind === 'video' ? <video src={sel.url} controls className="max-h-80 w-full" /> : sel.url && sel.kind === 'image' ? <img src={sel.url} alt={sel.name} className="max-h-80 w-full object-contain" /> : sel.url && sel.kind === 'audio' ? <audio src={sel.url} controls /> : <Icon k={sel.kind} />}</div>
              <form action={async (f) => { await renameAsset(f); setSel(null); }} className="space-y-3">
                <input type="hidden" name="id" value={sel.id} />
                <div><label className="label" htmlFor="n">Name</label><input id="n" name="name" className="input" defaultValue={sel.name} required /></div>
                <div><label className="label" htmlFor="d">Description</label><textarea id="d" name="description" className="input min-h-16" defaultValue={sel.description} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label" htmlFor="f">Folder</label><select id="f" name="folderId" className="input" defaultValue={sel.folder_id ?? ''}><option value="">None</option>{folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                  <div><label className="label" htmlFor="p">Project</label><select id="p" name="projectId" className="input" defaultValue={sel.project_id ?? ''}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div></div>
                <p className="text-xs text-mute">{sel.mime_type}, {fmtBytes(sel.size_bytes)}, added {fmtDate(sel.created_at)}</p>
                <div className="flex flex-wrap gap-2"><button className="btn-primary btn-sm">Save changes</button>{sel.url && <a href={sel.url} download={sel.name} className="btn-ghost btn-sm"><Download size={14} />Download</a>}
                  <ConfirmButton action={async (f) => { await deleteAsset(f); setSel(null); }} fields={{ id: sel.id }} label="Delete" title="Delete this asset?" message="The file is permanently removed from storage." /></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
