import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export function SectionHead({ eyebrow, title, text, center }: { eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent2">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 leading-relaxed text-mute">{text}</p>}
    </div>
  );
}
export function CtaBand({ title = 'Create more. Imagine further.', text = 'Turn your creative ideas into compelling video content with ClipGen AI.', cta = 'Start Creating' }: { title?: string; text?: string; cta?: string }) {
  return (
    <section className="container-x py-20">
      <div className="rounded-2xl border border-line bg-card px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-mute">{text}</p>
        <Link href="/signup" className="btn-primary mt-8 px-6 py-3">{cta}<ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}
export function CrossLinks() {
  return (
    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {[['Platform', '/platform'], ['Solutions', '/solutions'], ['Features', '/features'], ['Pricing', '/pricing']].map(([l, h]) => (
        <Link key={h} href={h} className="inline-flex items-center gap-1 text-accent2 hover:underline">{l}<ArrowRight size={14} /></Link>
      ))}
    </div>
  );
}
