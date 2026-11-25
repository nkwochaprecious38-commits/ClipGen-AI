import { PageHeader } from '@/components/ui';
import { PendingTool } from '@/components/PendingTool';
import { getContext } from '@/lib/context';
export const metadata = { title: 'Video to Video' };
export default async function Page() {
  const { workspaceId } = await getContext();
  return (<><PageHeader title="Video to Video" text="Transform existing footage with a prompt." /><PendingTool title="Video to Video" workspaceId={workspaceId!} actions={["Restyle a scene", "Change the environment", "Modify lighting", "Creative transformation", "Product scene variation", "Background transformation"]} variant="standard" promptLabel="Editing instructions" /></>);
}
