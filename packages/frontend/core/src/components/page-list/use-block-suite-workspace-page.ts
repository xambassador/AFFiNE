import { DebugLogger } from '@affine/debug';
import { DisposableGroup } from '@blocksuite/affine/global/slot';
import type { Store, Workspace } from '@blocksuite/affine/store';
import { useEffect, useState } from 'react';

const logger = new DebugLogger('useBlockSuiteWorkspacePage');

export function useDocCollectionPage(
  docCollection: Workspace,
  pageId: string | null
): Store | null {
  const [page, setPage] = useState(
    pageId ? docCollection.getDoc(pageId) : null
  );

  useEffect(() => {
    const group = new DisposableGroup();
    group.add(
      docCollection.slots.docCreated.on(id => {
        if (pageId === id) {
          setPage(docCollection.getDoc(id));
        }
      })
    );
    group.add(
      docCollection.slots.docRemoved.on(id => {
        if (pageId === id) {
          setPage(null);
        }
      })
    );
    return () => {
      group.dispose();
    };
  }, [docCollection, pageId]);

  useEffect(() => {
    if (page && !page.loaded) {
      try {
        page.load();
      } catch (err) {
        logger.error('Failed to load page', err);
      }
    }
  }, [page]);

  useEffect(() => {
    if (page?.id !== pageId) {
      setPage(pageId ? docCollection.getDoc(pageId) : null);
    }
  }, [docCollection, page?.id, pageId]);

  return page;
}
