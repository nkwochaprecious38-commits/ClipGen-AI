'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import type { ModelDef } from '@/lib/models';

export function SceneClip({ sceneId, prompt, models, credits, initialStatus, initialUrl, generationId }: {
  sceneId: string; prompt: string; models: (ModelDef & { available: boolean })[]; credits: number; initialStatus: string; initialUrl: string | null; generationId: string | null;
}) {
  const router = useRouter();
  const m0 = models.find((m) => m.available) ?? models[0];
  const [modelId, setModelId] = useState(m0?.id); const model = models.find((x) => x.id === modelId)!;
  const [duration, setDuration] = useState(model?.durations[0] ?? 0);
  const [status, setStatus] = useState(initialStatus); const [url, setUrl] = useState(initialUrl); const [err, setErr] = useState(''); const [gid, setGid] = useState(generationId);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setDuration(model?.durations[0] ?? 0); }, [modelId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (gid && ['queued', 'processing'].includes(initialStatus)) poll(gid); return () => { if (timer.current) clearTimeout(timer.current); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function poll(id: string) {
    const r = await fetch(`/api/generations/${id}`); const b = await r.json(); if (!r.ok) return setErr(b.error);
    const s = b.generation.status; setStatus(s);
    if (s === 'completed') { setUrl(b.outputs?.[0]?.url ?? null); router.refresh(); }
    else if (s === 'failed') { setErr(b.generation.error || 'Generation failed. Credits were refunded.'); router.refresh(); }
    else if (['queued', 'processing'].includes(s)) timer.current = setTimeout(() => poll(id), 3000);
  }
  async function run() {
    setErr(''); if (!prompt.trim()) return setErr('Save a scene prompt first.');
    setStatus('queued'); setUrl(null);
    const r = await fetch('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'text_to_video', sceneId, modelId, prompt, aspectRatio: model.aspectRatios[0], duration: duration || undefined, idempotencyKey: crypto.randomUUID() }) });
    const b = await r.json(); if (!r.ok) { setStatus('failed'); return setErr(b.error); }
    setGid(b.generation.id); if (b.generation.status === 'failed') { setStatus('failed'); return setErr(b.generation.error); } poll(b.generation.id);
  }
  if (!model) return null;
  const busy = ['queued', 'processing'].includes(status);
  return (
    <div className="space-y-3">
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-bg2">
        {url ? <video src={url} controls className="h-full w-full" /> : busy ? <div className="text-center text-xs text-mute"><Loader2 className="mx-auto mb-2 animate-spin text-accent2" size={22} />{status === 'queued' ? 'Queued' : 'Processing'}</div> : <span className="text-xs text-mute">No clip generated</span>}
      </div>
      {!model.available && <p className="flex gap-2 text-xs text-warn"><AlertTriangle size={14} className="shrink-0" />Clip generation requires provider integration.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <select className="input h-9 w-auto py-1 text-xs" value={modelId} onChange={(e) => setModelId(e.target.value)} aria-label="Model">{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        {model.durations.length > 0 && <select className="input h-9 w-auto py-1 text-xs" value={duration} onChange={(e) => setDuration(Number(e.target.value))} aria-label="Duration">{model.durations.map((d) => <option key={d} value={d}>{d}s</option>)}</select>}
        <button className="btn-primary btn-sm" disabled={busy || !model.available} onClick={run}>{busy ? <Loader2 size={13} className="animate-spin" /> : url ? <RefreshCw size={13} /> : <Sparkles size={13} />}{url ? 'Regenerate clip' : 'Generate clip'}</button>
      </div>
      <p className="text-xs text-mute">Balance {credits} credits{status === 'completed' ? '. Completed' : status === 'failed' ? '. Failed' : ''}.</p>
      {err && <p role="alert" className="text-xs text-bad">{err}</p>}
    </div>
  );
}
