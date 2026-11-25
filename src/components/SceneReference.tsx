'use client';
import { useRouter } from 'next/navigation';
import { Uploader, ACCEPT } from './Uploader';
import { setSceneReference } from '@/app/app/actions';
export function SceneReference({ workspaceId, sceneId, storyboardId, current }: { workspaceId: string; sceneId: string; storyboardId: string; current: string | null }) {
  const router = useRouter();
  return (
    <div>
      <p className="label">Reference image</p>
      {current && <img src={current} alt="Scene reference" className="mb-2 h-24 rounded-md object-cover" />}
      <Uploader workspaceId={workspaceId} accept={ACCEPT.image} label={current ? 'Replace reference' : 'Upload reference'} compact onDone={async (a) => { await setSceneReference(sceneId, a.id, storyboardId); router.refresh(); }} />
    </div>
  );
}
