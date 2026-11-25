import { PageHeader, Notice } from '@/components/ui';
import { Generator, type SocialPreset } from '@/components/Generator';
import { creatorProps } from '@/lib/data';
export const metadata = { title: 'Social Media Content' };
const SOCIAL: SocialPreset[] = [
  { platform: 'Instagram', formats: [{ name: 'Reel', ratio: '9:16' }, { name: 'Feed square', ratio: '1:1' }, { name: 'Feed portrait', ratio: '3:4' }] },
  { platform: 'TikTok', formats: [{ name: 'Vertical video', ratio: '9:16' }] },
  { platform: 'YouTube', formats: [{ name: 'Standard video', ratio: '16:9' }] },
  { platform: 'YouTube Shorts', formats: [{ name: 'Short', ratio: '9:16' }] },
  { platform: 'Facebook', formats: [{ name: 'Feed square', ratio: '1:1' }, { name: 'Landscape', ratio: '16:9' }, { name: 'Story', ratio: '9:16' }] },
  { platform: 'LinkedIn', formats: [{ name: 'Landscape', ratio: '16:9' }, { name: 'Square', ratio: '1:1' }] },
  { platform: 'Pinterest', formats: [{ name: 'Vertical pin', ratio: '9:16' }, { name: 'Square pin', ratio: '1:1' }] },
];
export default async function Page() {
  const { props } = await creatorProps('text_to_video');
  return (<><PageHeader title="Social Media Content" text="Choose a platform and format, then generate content sized for that channel." />
    <Notice>ClipGen AI does not publish to social platforms. Download your content and post it from the platform itself.</Notice>
    <Generator {...props} social={SOCIAL} /></>);
}
