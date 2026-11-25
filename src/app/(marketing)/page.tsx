import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Type, ImagePlus, Scissors, Megaphone, Copy, FolderKanban, Download } from 'lucide-react';
import { Scene } from '@/components/Scene';
import { WorkspacePreview } from '@/components/WorkspacePreview';
import { SectionHead, CtaBand } from '@/components/MarketingBits';
import { Faq } from '@/components/Faq';
import { FAQ, FEATURES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'ClipGen AI: AI Video Generator and Creative Studio',
  description: 'Generate video from text, animate images, plan storyboards and organize creative projects in one AI video creation workspace.',
  openGraph: { title: 'ClipGen AI: AI Video Generator and Creative Studio', description: 'Your ideas. Your vision. Videos that come to life.' },
};

const VALUE = [
  [Type, 'Create from text', 'Write a prompt and generate a video clip.'], [ImagePlus, 'Animate images', 'Give a still image motion with guidance.'],
  [Scissors, 'Edit existing videos', 'Prompt based editing on a timeline workspace.'], [Megaphone, 'Generate marketing content', 'Start from templates built for campaigns.'],
  [Copy, 'Create multiple versions', 'Explore variations of a scene or concept.'], [FolderKanban, 'Organize creative projects', 'Keep prompts, assets and generations together.'],
  [Download, 'Export professional content', 'Download media with a clear record of every export.'],
] as const;
const STEPS = [
  ['01', 'Describe your vision', 'Enter a prompt, upload an image or import a video.'],
  ['02', 'Create and refine', 'Select a creative workflow, adjust settings, generate and refine your content.'],
  ['03', 'Export and share', 'Download your content and organize finished projects.'],
];
const USES = [
  ['Marketing campaigns', 'studio'], ['Social media videos', 'city'], ['Product videos', 'studio'], ['Short films', 'ocean'], ['Storytelling', 'forest'], ['Video advertisements', 'desert'],
  ['Educational content', 'mountain'], ['Brand content', 'city'], ['Visual concepts', 'ocean'], ['Animation', 'forest'], ['Content repurposing', 'desert'],
];
const PREVIEW_FEATURES = ['text-to-video', 'image-to-video', 'ai-video-editing', 'multi-scene', 'project-management', 'video-upscaling', 'video-to-video', 'content-variations', 'ai-image-generation'];

export default function Home() {
  return (
    <>
      <section className="container-x pb-16 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">Your ideas. Your vision. Videos that come to life.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mute sm:text-lg">Transform ideas, images and footage into stunning video content with AI powered creative tools designed to help you create, edit and produce faster.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary px-6 py-3">Start Creating<ArrowRight size={16} /></Link>
            <Link href="/platform" className="btn-ghost px-6 py-3">Explore the Platform</Link>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-5xl"><WorkspacePreview /></div>
        <p className="mx-auto mt-3 max-w-5xl text-xs text-mute">Frames shown across this site are illustrative samples, not generated output.</p>
      </section>

      <section className="bg-white py-20 text-[#101114]">
        <div className="container-x">
          <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Everything you need to create your next video.</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#52525b]">ClipGen AI turns a creative idea into finished content: generate, refine, organize and export from a single workspace.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE.map(([Icon, t, d]) => (
              <div key={t} className="rounded-xl border border-[#e4e4e7] p-5">
                <Icon size={20} className="text-accent" /><h3 className="mt-4 font-semibold">{t}</h3><p className="mt-1.5 text-sm text-[#52525b]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <SectionHead eyebrow="How it works" title="From idea to finished video in three steps" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(([n, t, d], i) => (
            <div key={n} className="card overflow-hidden">
              <div className="aspect-[16/8]"><Scene variant={['studio', 'city', 'ocean'][i]} /></div>
              <div className="p-6"><span className="font-head text-sm font-bold text-accent2">{n}</span><h3 className="mt-2 text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-mute">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg2 py-20">
        <div className="container-x">
          <SectionHead eyebrow="Creative possibilities" title="Built for every kind of video" text="From a single social clip to a campaign sequence, start with the use case and let the workspace organize the rest." />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {USES.map(([t, s]) => (
              <Link key={t} href="/solutions" className="card group overflow-hidden transition-colors hover:border-accent/60">
                <div className="aspect-video overflow-hidden"><div className="h-full transition-transform duration-300 group-hover:scale-105"><Scene variant={s} /></div></div>
                <p className="px-4 py-3 text-sm font-medium">{t}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <SectionHead eyebrow="Features" title="Tools for the whole production" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEW_FEATURES.map((id) => { const f = FEATURES.find((x) => x.id === id)!; return (
            <Link key={id} href={`/features#${id}`} className="card group p-6 transition-colors hover:border-accent/60">
              <h3 className="font-bold">{f.title}</h3><p className="mt-2 text-sm leading-relaxed text-mute">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent2">Learn more<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
            </Link>); })}
        </div>
      </section>

      <CtaBand />

      <section className="container-x pb-24">
        <SectionHead eyebrow="FAQ" title="Questions, answered" center />
        <div className="mx-auto mt-10 max-w-3xl"><Faq items={FAQ} /></div>
      </section>
    </>
  );
}
