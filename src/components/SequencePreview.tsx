'use client';
import { useState } from 'react';
export function SequencePreview({ clips }: { clips: { title: string; url: string }[] }) {
  const [i, setI] = useState(0); const [started, setStarted] = useState(false);
  if (!clips.length) return <p className="text-sm text-mute">Generate at least one scene clip to preview the sequence.</p>;
  return (
    <div className="space-y-3">
      <video key={clips[i].url} src={clips[i].url} controls autoPlay={started} onEnded={() => { if (i < clips.length - 1) { setI(i + 1); setStarted(true); } }} className="aspect-video w-full rounded-lg bg-black" />
      <div className="flex flex-wrap gap-2">{clips.map((c, n) => <button key={c.url} onClick={() => { setI(n); setStarted(true); }} className={`chip ${n === i ? 'border-accent text-ink' : 'hover:text-ink'}`}>{n + 1}. {c.title}</button>)}</div>
      <p className="text-xs text-mute">Plays the generated clips in scene order. Merging clips into a single exported file is not available yet: download each clip from its scene.</p>
    </div>
  );
}
