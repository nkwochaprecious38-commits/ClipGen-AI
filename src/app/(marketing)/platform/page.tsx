import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Scene } from '@/components/Scene';
import { WorkspacePreview } from '@/components/WorkspacePreview';
import { SectionHead, CtaBand, CrossLinks } from '@/components/MarketingBits';

export const metadata: Metadata = {
  title: 'Platform: One Workspace for AI Video Production',
  description: 'The ClipGen AI platform connects text to video, image to video, AI editing, image generation, projects, assets and export in one creative workspace.',
};

const SECTIONS = [
  ['text-to-video', 'Text to Video', 'Describe the scene, motion, camera and style. Settings adapt to the selected model, so every option on screen is one the model supports.', 'mountain'],
  ['image-to-video', 'Image to Video', 'Upload a still, add motion guidance and generate a clip that starts from your own frame.', 'ocean'],
  ['video-to-video', 'Video to Video', 'Restyle or transform existing footage with a prompt. Runs when a video transformation model is connected.', 'city'],
  ['ai-editing', 'AI Editing', 'A timeline workspace with scene navigation, edit history and a prompt panel. Edit actions run when an editing model is connected.', 'studio'],
  ['multi-scene', 'Multi Scene Creation', 'Plan scenes in a storyboard, generate each clip, review them and arrange the sequence.', 'forest'],
  ['image-generation', 'Image Generation', 'Generate reference frames and campaign stills, then save them to your asset library or animate them.', 'desert'],
  ['projects', 'Creative Projects', 'Group generations, assets, prompts and storyboards under one project with a clear status and activity log.', 'studio'],
  ['media', 'Media Management', 'A private library with folders, search, previews and downloads for every video and image.', 'city'],
  ['export', 'Content Export', 'Download finished media and keep an export record against the project it belongs to.', 'ocean'],
];
const FLOW = ['Idea or reference', 'Storyboard', 'Generate', 'Refine', 'Organize in a project', 'Export'];

export default function Platform() {
  return (
    <>
      <section className="container-x pt-16">
        <SectionHead eyebrow="Platform" title="Connect the entire creative production process" text="ClipGen AI brings generation, editing, planning and organization into one workspace, so work moves from idea to export without switching tools." />
        <CrossLinks />
        <div className="mt-12"><WorkspacePreview /></div>
      </section>

      <section className="container-x py-20">
        <SectionHead title="The AI creative workspace" text="A persistent sidebar, a clear generation panel and a project aware library. Create, edit, organize and export without leaving the workspace." />
        <div className="mt-12 space-y-6">
          {SECTIONS.map(([id, t, d, s], i) => (
            <article id={id} key={id} className="card scroll-mt-24 overflow-hidden md:grid md:grid-cols-2">
              <div className={`aspect-video md:aspect-auto ${i % 2 ? 'md:order-2' : ''}`}><Scene variant={s} /></div>
              <div className="p-6 sm:p-8"><h3 className="text-2xl font-bold">{t}</h3><p className="mt-3 leading-relaxed text-mute">{d}</p>
                <Link href="/features" className="mt-5 inline-flex items-center gap-1 text-sm text-accent2 hover:underline">See features<ArrowRight size={14} /></Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-bg2 py-20">
        <div className="container-x">
          <SectionHead eyebrow="AI creative workflow" title="Workflow overview" text="Every project follows the same path, and every step is recorded in your history." />
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {FLOW.map((f, i) => (<li key={f} className="card p-4"><span className="font-head text-sm font-bold text-accent2">{String(i + 1).padStart(2, '0')}</span><p className="mt-2 text-sm font-medium">{f}</p></li>))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <Link href="/solutions" className="text-accent2 hover:underline">Explore Solutions</Link>
            <Link href="/features" className="text-accent2 hover:underline">Explore Features</Link>
            <Link href="/pricing" className="text-accent2 hover:underline">View Pricing</Link>
          </div>
        </div>
      </section>
      <CtaBand title="Bring your whole production into one place" text="Start a workspace and create your first project." cta="Start Creating" />
    </>
  );
}
