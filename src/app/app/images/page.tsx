import { PageHeader } from '@/components/ui';
import { Generator } from '@/components/Generator';
import { creatorProps } from '@/lib/data';
export const metadata = { title: 'Image Generation' };
export default async function Page({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const sp = await searchParams; const { props } = await creatorProps('image');
  return (<><PageHeader title="Image Generation" text="Generate images from text. Results are saved to your asset library." /><Generator {...props} initialPrompt={sp.prompt} /></>);
}
