import { Sparkles, Image as ImageIcon, Film, Play, SlidersHorizontal, Clock } from 'lucide-react';
import { Scene } from './Scene';

// Static preview of the real workspace layout. Shown on marketing pages and labelled as an interface preview.
export function WorkspacePreview() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-bg2 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="ml-3 text-xs text-mute">Create Video</span>
        <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] text-accent2">Interface preview</span>
      </div>
      <div className="grid md:grid-cols-[220px_1fr_200px]">
        <aside className="hidden space-y-3 border-r border-line p-4 md:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Settings</p>
          {[['Model', 'Kling 1.6 Standard'], ['Aspect ratio', '16:9'], ['Duration', '5 seconds']].map(([k, v]) => (
            <div key={k}><p className="text-[11px] text-mute">{k}</p><div className="mt-1 rounded-md border border-line bg-bg px-2.5 py-1.5 text-xs">{v}</div></div>
          ))}
          <div className="flex items-center justify-between rounded-md border border-line bg-bg px-2.5 py-1.5 text-xs"><span className="text-mute">Estimated cost</span><span>50 credits</span></div>
        </aside>
        <div className="p-4">
          <div className="aspect-video overflow-hidden rounded-lg border border-line"><Scene variant="mountain" /></div>
          <div className="mt-3 flex items-center gap-3 text-xs text-mute"><Play size={14} className="text-accent2" /><div className="h-1 flex-1 rounded bg-line"><div className="h-1 w-2/5 rounded bg-accent" /></div><span>00:02 / 00:05</span></div>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 rounded-lg border border-line bg-bg px-3 py-2.5 text-xs text-mute">Aerial drone shot over a misty mountain valley at dawn, volumetric light</div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2.5 text-xs font-medium text-white"><Sparkles size={14} />Generate</div>
          </div>
        </div>
        <aside className="hidden space-y-3 border-l border-line p-4 md:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Project assets</p>
          {['city', 'ocean', 'studio'].map((v) => <div key={v} className="aspect-video overflow-hidden rounded-md border border-line"><Scene variant={v} /></div>)}
          <div className="flex items-center gap-1.5 text-[11px] text-mute"><Clock size={12} />Status: Processing</div>
        </aside>
      </div>
      <figcaption className="sr-only">Preview of the ClipGen AI creative workspace</figcaption>
    </figure>
  );
}
export const _icons = { SlidersHorizontal, Film, ImageIcon };
