"use client";

import { LiveblocksProvider, RoomProvider, useMyPresence, useOthers, useStatus, useStorage, useMutation } from '@liveblocks/react';
import { useEffect, useMemo, useRef } from 'react';
import { Page } from '../../types/builder';
import { useBuilderStore } from '../../stores/builderStore';

type DocumentSnapshot = {
  pages: Page[];
  currentPageId: string;
  projectName: string | null;
};

const getSnapshot = (pages: Page[], currentPageId: string, projectName: string | null): DocumentSnapshot => ({
  pages,
  currentPageId,
  projectName,
});

export function CollaborationRoom({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { pages, currentPageId, projectName } = useBuilderStore();
  const initialStorage = useMemo(
    () => ({ document: JSON.stringify(getSnapshot(pages, currentPageId, projectName)) }),
    [pages, currentPageId, projectName],
  );

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={100}>
      <RoomProvider
        id={`project:${projectId}`}
        initialPresence={{ selectedElementId: null }}
        initialStorage={initialStorage}
      >
        <CollaborationSync projectId={projectId} />
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function CollaborationSync({ projectId }: { projectId: string }) {
  const document = useStorage((root) => root.document);
  const updateDocument = useMutation(({ storage }, nextDocument: string) => {
    storage.set('document', nextDocument);
  }, []);
  const { pages, currentPageId, projectName, selectedElementId, loadProject } = useBuilderStore();
  const hydrated = useRef(false);
  const documentRef = useRef<string | null>(null);
  const applyingRemote = useRef(false);
  const localDocument = JSON.stringify(getSnapshot(pages, currentPageId, projectName));
  const [, updatePresence] = useMyPresence();

  useEffect(() => {
    if (!document) return;

    hydrated.current = true;
    documentRef.current = document;
    const currentState = useBuilderStore.getState();
    const currentDocument = JSON.stringify(
      getSnapshot(currentState.pages, currentState.currentPageId, currentState.projectName),
    );
    if (document === currentDocument) return;

    try {
      const snapshot = JSON.parse(document) as DocumentSnapshot;
      if (!Array.isArray(snapshot.pages) || !snapshot.currentPageId) return;

      applyingRemote.current = true;
      loadProject(projectId, snapshot.pages, snapshot.currentPageId, snapshot.projectName || undefined);
    } catch {
      console.error('Unable to read the shared project document.');
    }
  }, [document, loadProject, projectId]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    if (documentRef.current === localDocument) return;

    updateDocument(localDocument);
  }, [localDocument, updateDocument]);

  useEffect(() => {
    updatePresence({ selectedElementId });
  }, [selectedElementId, updatePresence]);

  return null;
}

export function CollaborationStatus() {
  const status = useStatus();
  const others = useOthers();

  return (
    <div className="pointer-events-none absolute right-4 top-2 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[#161d27]/95 px-3 py-1.5 text-[11px] text-white shadow-lg">
      <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-400' : status === 'reconnecting' ? 'bg-amber-400' : 'bg-slate-500'}`} />
      <span>{status === 'connected' ? 'Live' : status === 'reconnecting' ? 'Reconnecting' : 'Offline'}</span>
      {others.length > 0 && <span className="border-l border-white/15 pl-2">{others.length} other{others.length === 1 ? '' : 's'} here</span>}
    </div>
  );
}
