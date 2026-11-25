'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line rounded-xl border border-line">
      {items.map((it, i) => (
        <div key={it.q}>
          <h3>
            <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium sm:text-base" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {it.q}{open === i ? <Minus size={16} className="shrink-0 text-accent2" /> : <Plus size={16} className="shrink-0 text-mute" />}
            </button>
          </h3>
          {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-mute">{it.a}</p>}
        </div>
      ))}
    </div>
  );
}
