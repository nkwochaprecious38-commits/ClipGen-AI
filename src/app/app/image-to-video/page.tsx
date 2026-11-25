import { PageHeader } from '@/components/ui';
import { Generator } from '@/components/Generator';
import { creatorProps } from '@/lib/data';
export const metadata = { title: 'Image to Video' };
export default async function Page({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const sp = await searchParams; const { props } = await creatorProps('image_to_video');
  return (<><PageHeader title="Image to Video" text="Upload an image and describe how it should move." /><Generator {...props} initialPrompt={sp.prompt} /></>);
}
