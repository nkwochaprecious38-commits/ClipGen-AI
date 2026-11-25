import { PageHeader } from '@/components/ui';
import { PendingTool } from '@/components/PendingTool';
import { getContext } from '@/lib/context';
export const metadata = { title: 'Video Extension' };
export default async function Page() {
  const { workspaceId } = await getContext();
  return (<><PageHeader title="Video Extension" text="Continue a clip by generating more footage." /><PendingTool title="Video Extension" workspaceId={workspaceId!} actions={["Extend from final frame", "Set extension duration"]} variant="standard" promptLabel="Extension prompt" /></>);
}
