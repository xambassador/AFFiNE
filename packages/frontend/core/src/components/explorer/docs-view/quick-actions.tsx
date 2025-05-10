import {
  Checkbox,
  IconButton,
  type IconButtonProps,
  useConfirmModal,
} from '@affine/component';
import type { DocRecord } from '@affine/core/modules/doc';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/favorite';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import { DeleteIcon, OpenInNewIcon, SplitViewIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { memo, useCallback, useContext } from 'react';

import { IsFavoriteIcon } from '../../pure/icons';
import { DocExplorerContext } from '../context';

export interface QuickActionProps extends IconButtonProps {
  doc: DocRecord;
}

export const QuickFavorite = memo(function QuickFavorite({
  doc,
  ...iconButtonProps
}: QuickActionProps) {
  const contextValue = useContext(DocExplorerContext);
  const quickFavorite = useLiveData(contextValue.quickFavorite$);

  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favourite = useLiveData(favAdapter.isFavorite$(doc.id, 'doc'));

  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      favAdapter.toggle(doc.id, 'doc');
    },
    [doc.id, favAdapter]
  );

  if (!quickFavorite) {
    return null;
  }

  return (
    <IconButton
      icon={<IsFavoriteIcon favorite={favourite} />}
      onClick={toggleFavorite}
      {...iconButtonProps}
    />
  );
});

export const QuickTab = memo(function QuickTab({
  doc,
  ...iconButtonProps
}: QuickActionProps) {
  const contextValue = useContext(DocExplorerContext);
  const quickTab = useLiveData(contextValue.quickTab$);
  const workbench = useService(WorkbenchService).workbench;
  const onOpenInNewTab = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      workbench.openDoc(doc.id, { at: 'new-tab' });
    },
    [doc.id, workbench]
  );

  if (!quickTab) {
    return null;
  }

  return (
    <IconButton
      onClick={onOpenInNewTab}
      icon={<OpenInNewIcon />}
      {...iconButtonProps}
    />
  );
});

export const QuickSplit = memo(function QuickSplit({
  doc,
  ...iconButtonProps
}: QuickActionProps) {
  const contextValue = useContext(DocExplorerContext);
  const quickSplit = useLiveData(contextValue.quickSplit$);
  const workbench = useService(WorkbenchService).workbench;

  const onOpenInSplitView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      track.allDocs.list.docMenu.openInSplitView();
      workbench.openDoc(doc.id, { at: 'tail' });
    },
    [doc.id, workbench]
  );

  if (!quickSplit) {
    return null;
  }

  return (
    <IconButton
      onClick={onOpenInSplitView}
      icon={<SplitViewIcon />}
      {...iconButtonProps}
    />
  );
});

export const QuickDelete = memo(function QuickDelete({
  doc,
  ...iconButtonProps
}: QuickActionProps) {
  const t = useI18n();
  const { openConfirmModal } = useConfirmModal();
  const contextValue = useContext(DocExplorerContext);
  const quickTrash = useLiveData(contextValue.quickTrash$);

  const onMoveToTrash = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!doc) {
        return;
      }

      track.allDocs.list.docMenu.deleteDoc();
      openConfirmModal({
        title: t['com.affine.moveToTrash.confirmModal.title'](),
        description: t['com.affine.moveToTrash.confirmModal.description']({
          title: doc.title$.value || t['Untitled'](),
        }),
        cancelText: t['com.affine.confirmModal.button.cancel'](),
        confirmText: t.Delete(),
        confirmButtonOptions: {
          variant: 'error',
        },
        onConfirm: () => {
          doc.moveToTrash();
        },
      });
    },
    [doc, openConfirmModal, t]
  );

  if (!quickTrash) {
    return null;
  }

  return (
    <IconButton
      onClick={onMoveToTrash}
      icon={<DeleteIcon />}
      variant="danger"
      {...iconButtonProps}
    />
  );
});

export const QuickSelect = memo(function QuickSelect({
  doc,
  ...iconButtonProps
}: QuickActionProps) {
  const contextValue = useContext(DocExplorerContext);
  const quickSelect = useLiveData(contextValue.quickSelect$);
  const selectedDocIds = useLiveData(contextValue.selectedDocIds$);

  const selected = selectedDocIds.includes(doc.id);

  const onChange = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      contextValue.selectedDocIds$?.next(
        selected
          ? selectedDocIds.filter(id => id !== doc.id)
          : [...selectedDocIds, doc.id]
      );
    },
    [contextValue, doc.id, selected, selectedDocIds]
  );

  if (!quickSelect) {
    return null;
  }

  return (
    <IconButton
      onClick={onChange}
      icon={<Checkbox checked={selected} style={{ pointerEvents: 'none' }} />}
      {...iconButtonProps}
    />
  );
});
