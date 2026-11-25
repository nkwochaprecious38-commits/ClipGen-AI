import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Scene } from '@/components/Scene';
import { SectionHead, CtaBand, CrossLinks } from '@/components/MarketingBits';
import { SOLUTIONS } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Solutions: AI Video for Creators, Marketers and Agencies',
  description: 'See how creators, marketing teams, agencies, e commerce brands, small businesses, filmmakers and educators use ClipGen AI to produce video content.',
};

export default function Solutions() {
  return (
    <>
      <section className="container-x pt-16">
        <SectionHead eyebrow="Solutions" title="A creative studio for every kind of team" text="Whether you publish daily, run campaigns for clients or explore a film concept, ClipGen AI organizes the work around how you produce." />
        <nav aria-label="Solutions index" className="mt-8 flex flex-wrap gap-2">
          {SOLUTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="chip transition-colors hover:border-accent hover:text-ink">{s.name}</a>)}
        </nav>
      </section>
      <section className="container-x space-y-6 py-14">
        {SOLUTIONS.map((s, i) => (
          <article id={s.id} key={s.id} className="card scroll-mt-24 overflow-hidden md:grid md:grid-cols-2">
            <div className={`aspect-video md:aspect-auto ${i % 2 ? 'md:order-2' : ''}`}><Scene variant={s.scene} /></div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent2">{s.name}</p>
              <h2 className="mt-3 text-2xl font-bold">{s.headline}</h2>
              <p className="mt-3 leading-relaxed text-mute">{s.desc}</p>
              <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">{s.features.map((f) => <li key={f} className="flex items-center gap-2"><Check size={14} className="text-accent2" />{f}</li>)}</ul>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="btn-primary">{s.cta}</Link>
                <Link href="/platform" className="text-sm text-accent2 hover:underline">Platform</Link>
                <Link href="/features" className="text-sm text-accent2 hover:underline">Features</Link>
              </div>
            </div>
          </article>
        ))}
        <CrossLinks />
      </section>
      <CtaBand />
    </>
  );
}
