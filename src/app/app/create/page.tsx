import { PageHeader } from '@/components/ui';
import { Generator } from '@/components/Generator';
import { creatorProps } from '@/lib/data';
export const metadata = { title: 'Create Video' };
export default async function Page({ searchParams }: { searchParams: Promise<{ prompt?: string; project?: string }> }) {
  const sp = await searchParams; const { props } = await creatorProps('text_to_video');
  return (<><PageHeader title="Create Video" text="Generate a video from a text description." /><Generator {...props} initialPrompt={sp.prompt} initialProject={sp.project} /></>);
}
