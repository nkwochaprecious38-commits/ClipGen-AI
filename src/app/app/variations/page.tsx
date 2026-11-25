import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { Generator } from '@/components/Generator';
import { creatorProps } from '@/lib/data';
export const metadata = { title: 'Content Variations' };
export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams; const kind = sp.kind === 'image' ? 'image' : 'text_to_video';
  const { ctx, props } = await creatorProps(kind);
  const { data: past } = await ctx.supabase.from('generations').select('id, prompt').eq('status', 'completed').eq('type', kind).order('created_at', { ascending: false }).limit(25);
  return (<><PageHeader title="Content Variations" text="Start from an earlier generation and create new versions with a different scene, style or camera." />
    <div className="mb-6 flex gap-2">{[['text_to_video', 'Video', '/app/variations'], ['image', 'Image', '/app/variations?kind=image']].map(([k, l, h]) => <Link key={k} href={h} className={`btn-sm ${kind === k ? 'btn-primary' : 'btn-ghost'}`}>{l}</Link>)}</div>
    <Generator key={kind} {...props} variations={past ?? []} /></>);
}
