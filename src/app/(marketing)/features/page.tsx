import type { Metadata } from 'next';
import Link from 'next/link';
import { Scene } from '@/components/Scene';
import { SectionHead, CtaBand, CrossLinks } from '@/components/MarketingBits';
import { FEATURES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Features: AI Video, Image and Editing Tools',
  description: 'Explore ClipGen AI features: text to video, image to video, AI video editing, image generation, storyboards, upscaling, variations and project management.',
};

export default function Features() {
  return (
    <>
      <section className="container-x pt-16">
        <SectionHead eyebrow="Features" title="Everything in one creative workspace" text="Eighteen capabilities across generation, editing, planning and organization. Each is marked with its current state so you always know what is ready to use." />
        <CrossLinks />
        <nav aria-label="Feature index" className="mt-8 flex flex-wrap gap-2">
          {FEATURES.map((f) => <a key={f.id} href={`#${f.id}`} className="chip transition-colors hover:border-accent hover:text-ink">{f.title}</a>)}
        </nav>
      </section>
      <section className="container-x space-y-6 py-14">
        {FEATURES.map((f, i) => (
          <article id={f.id} key={f.id} className="card scroll-mt-24 overflow-hidden md:grid md:grid-cols-2">
            <div className={`aspect-video md:aspect-auto ${i % 2 ? 'md:order-2' : ''}`}><Scene variant={f.scene} /></div>
            <div className="p-6 sm:p-8">
              <span className={`chip ${f.status === 'connected' ? 'text-ok' : 'text-warn'}`}>{f.status === 'connected' ? 'Available with a connected model' : 'Requires model integration'}</span>
              <h2 className="mt-4 text-2xl font-bold">{f.title}</h2>
              <p className="mt-3 leading-relaxed text-mute">{f.desc}</p>
              <p className="mt-4 text-sm"><span className="font-semibold text-ink">Value:</span> <span className="text-mute">{f.value}</span></p>
              <Link href="/signup" className="btn-ghost btn-sm mt-6">Try it in the workspace</Link>
            </div>
          </article>
        ))}
      </section>
      <CtaBand />
    </>
  );
}
