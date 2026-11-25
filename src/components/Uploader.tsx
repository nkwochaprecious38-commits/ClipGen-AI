'use client';
import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const ACCEPT = { video: 'video/mp4,video/quicktime,video/webm', image: 'image/png,image/jpeg,image/webp,image/gif', audio: 'audio/mpeg,audio/wav,audio/mp4,audio/ogg' };
const OK = new Set([...ACCEPT.video.split(','), ...ACCEPT.image.split(','), ...ACCEPT.audio.split(',')]);
const MAX = 500 * 1024 * 1024;
export type UploadedAsset = { id: string; name: string; kind: string; mime_type: string; size_bytes: number; storage_path: string };

export async function uploadFile(file: File, workspaceId: string, onProgress: (p: number) => void, extra: { projectId?: string; folderId?: string } = {}): Promise<UploadedAsset> {
  if (!OK.has(file.type)) throw new Error('Unsupported file type. Use MP4, MOV, WebM, PNG, JPG, WebP, GIF or common audio files.');
  if (file.size > MAX) throw new Error('File is larger than the 500 MB limit.');
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Your session has expired. Log in again.');
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'file';
  const path = `${workspaceId}/${crypto.randomUUID()}-${safe}`;
  await new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/clipgen-media/${path}`);
    x.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    x.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    x.setRequestHeader('Content-Type', file.type);
    x.setRequestHeader('x-upsert', 'false');
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => (x.status < 300 ? resolve() : reject(new Error(x.status === 413 ? 'File is too large.' : 'Upload failed. Check your connection and try again.')));
    x.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    x.send(file);
  });
  const res = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, name: file.name, mime: file.type, ...extra }) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Could not register upload');
  return body.asset;
}

export function Uploader({ workspaceId, accept, label, multiple, onDone, extra, compact }: {
  workspaceId: string; accept: string; label: string; multiple?: boolean; compact?: boolean;
  onDone: (a: UploadedAsset, file: File) => void; extra?: { projectId?: string; folderId?: string };
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  async function handle(files: FileList | null) {
    if (!files?.length) return; setErr('');
    for (const f of Array.from(files)) {
      try { setPct(0); const a = await uploadFile(f, workspaceId, setPct, extra); onDone(a, f); }
      catch (e: any) { setErr(e.message); }
    }
    setPct(null); if (ref.current) ref.current.value = '';
  }
  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors ${compact ? 'px-4 py-6' : 'px-6 py-10'} ${drag ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/60'}`}
        onClick={() => ref.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && ref.current?.click()} aria-label={label}>
        {pct === null ? <UploadCloud size={22} className="text-accent2" /> : <Loader2 size={22} className="animate-spin text-accent2" />}
        <p className="mt-2 text-sm font-medium">{pct === null ? label : `Uploading ${pct}%`}</p>
        <p className="mt-1 text-xs text-mute">Up to 500 MB per file</p>
        {pct !== null && <div className="mt-3 h-1 w-48 rounded bg-line"><div className="h-1 rounded bg-accent transition-all" style={{ width: `${pct}%` }} /></div>}
        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      </div>
      {err && <p role="alert" className="mt-2 text-sm text-bad">{err}</p>}
    </div>
  );
}
