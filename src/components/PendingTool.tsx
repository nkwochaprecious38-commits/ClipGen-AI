'use client';
import { useRef, useState } from 'react';
import { Lock, MapPin, Play, Pause, Trash2 } from 'lucide-react';
import { Uploader, ACCEPT } from './Uploader';

export function PendingTool({ title, workspaceId, actions, variant = 'standard', promptLabel = 'Instructions' }: {
  title: string; workspaceId: string; actions: string[]; variant?: 'standard' | 'editor' | 'upscale'; promptLabel?: string;
}) {
  const [src, setSrc] = useState<{ url: string; name: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [marks, setMarks] = useState<number[]>([]);
  const v = useRef<HTMLVideoElement>(null);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="card overflow-hidden">
          {src ? (
            <video ref={v} src={src.url} className="aspect-video w-full bg-black" onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          ) : (
            <div className="p-4"><Uploader workspaceId={workspaceId} accept={ACCEPT.video} label="Upload a video" onDone={(a, f) => setSrc({ url: URL.createObjectURL(f), name: a.name })} /></div>
          )}
          {src && (
            <div className="space-y-3 border-t border-line p-4">
              <div className="flex items-center gap-3 text-xs text-mute">
                <button className="btn-ghost btn-sm" onClick={() => (playing ? v.current?.pause() : v.current?.play())} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
                <span className="tabular-nums">{fmt(t)} / {fmt(dur)}</span>
                <span className="ml-auto truncate">{src.name}</span>
                <button className="btn-ghost btn-sm" onClick={() => { setSrc(null); setMarks([]); }}>Replace</button>
              </div>
              {variant === 'editor' && (
                <div>
                  <p className="label">Timeline</p>
                  <div className="relative h-12 rounded-lg border border-line bg-bg2">
                    {marks.map((m) => <button key={m} className="absolute top-0 h-full w-0.5 bg-creative" style={{ left: `${(m / (dur || 1)) * 100}%` }} title={`Scene marker ${fmt(m)}`} onClick={() => { if (v.current) v.current.currentTime = m; }} aria-label={`Jump to marker ${fmt(m)}`} />)}
                    <div className="pointer-events-none absolute top-0 h-full w-0.5 bg-accent2" style={{ left: `${(t / (dur || 1)) * 100}%` }} />
                    <input type="range" min={0} max={dur || 1} step={0.04} value={t} onChange={(e) => { const x = Number(e.target.value); if (v.current) v.current.currentTime = x; setT(x); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Seek" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button className="btn-ghost btn-sm" onClick={() => setMarks((m) => [...new Set([...m, Math.round(t * 100) / 100])].sort((a, b) => a - b))}><MapPin size={14} />Mark scene at {fmt(t)}</button>
                    {marks.map((m, i) => <span key={m} className="chip gap-1.5">Scene {i + 1} at {fmt(m)}<button aria-label="Remove marker" onClick={() => setMarks((x) => x.filter((y) => y !== m))}><Trash2 size={11} /></button></span>)}
                  </div>
                  <p className="mt-2 text-xs text-mute">Markers are local to this session and help you navigate. Automatic scene detection requires an integration.</p>
                </div>
              )}
            </div>
          )}
        </div>
        {variant !== 'upscale' && (
          <div><label className="label" htmlFor="instr">{promptLabel}</label><textarea id="instr" className="input min-h-24" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the change you want" /></div>
        )}
        <div className="flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm text-mute" role="status">
          <Lock size={18} className="mt-0.5 shrink-0 text-warn" />
          <p><strong className="text-ink">{title} requires a model integration.</strong> No model for this workflow is connected, so nothing is processed and no credits are used. Your upload and instructions stay in this browser until an integration is added by the workspace owner.</p>
        </div>
        <button className="btn-primary" disabled aria-disabled>Run {title.toLowerCase()} (integration required)</button>
      </div>
      <aside className="space-y-4">
        <div className="card p-4">
          <h2 className="text-sm font-bold">Available actions</h2>
          <ul className="mt-3 space-y-2">{actions.map((a) => <li key={a} className="flex items-center justify-between gap-2 text-sm"><span>{a}</span><span className="chip text-warn">Integration required</span></li>)}</ul>
        </div>
        {variant === 'upscale' && <div className="card p-4 text-sm text-mute"><h2 className="text-sm font-bold text-ink">Output resolution</h2><p className="mt-2">Resolutions are listed here only after an upscaling model is connected, so no unsupported option is shown.</p></div>}
        {variant === 'editor' && <div className="card p-4 text-sm text-mute"><h2 className="text-sm font-bold text-ink">Editing history</h2><p className="mt-2">No edits applied. Applied edits will be listed here once an editing model is connected.</p></div>}
        {variant === 'editor' && <div className="card p-4"><h2 className="text-sm font-bold">Export</h2><p className="mt-2 text-sm text-mute">Export controls activate when an edit has been applied.</p></div>}
      </aside>
    </div>
  );
}
