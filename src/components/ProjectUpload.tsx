'use client';
import { useRouter } from 'next/navigation';
import { Uploader, ACCEPT } from './Uploader';
export function ProjectUpload({ workspaceId, projectId }: { workspaceId: string; projectId: string }) {
  const router = useRouter();
  return <Uploader workspaceId={workspaceId} accept={`${ACCEPT.video},${ACCEPT.image},${ACCEPT.audio}`} label="Upload project assets" multiple compact extra={{ projectId }} onDone={() => router.refresh()} />;
}
