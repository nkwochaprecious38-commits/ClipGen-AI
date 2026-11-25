import { PageHeader } from '@/components/ui';
import { PendingTool } from '@/components/PendingTool';
import { getContext } from '@/lib/context';
export const metadata = { title: 'AI Video Editing' };
export default async function Page() {
  const { workspaceId } = await getContext();
  return (<><PageHeader title="AI Video Editing" text="Edit footage on a timeline with prompts." /><PendingTool title="AI Video Editing" workspaceId={workspaceId!} actions={["Background replacement", "Object removal", "Object addition", "Lighting adjustment", "Scene transformation", "Video restyling", "Clip extension", "Video enhancement"]} variant="editor" promptLabel="Describe the edit" /></>);
}
