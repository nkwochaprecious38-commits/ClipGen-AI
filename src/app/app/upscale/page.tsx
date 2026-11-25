import { PageHeader } from '@/components/ui';
import { PendingTool } from '@/components/PendingTool';
import { getContext } from '@/lib/context';
export const metadata = { title: 'Video Upscaling' };
export default async function Page() {
  const { workspaceId } = await getContext();
  return (<><PageHeader title="Video Upscaling" text="Improve the resolution of an uploaded video." /><PendingTool title="Video Upscaling" workspaceId={workspaceId!} actions={["Upscale resolution"]} variant="upscale" promptLabel="Instructions" /></>);
}
