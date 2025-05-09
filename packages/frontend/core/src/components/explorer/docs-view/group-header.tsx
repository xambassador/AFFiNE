import { Button, IconButton } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { ToggleRightIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
} from 'react';

import { DocExplorerContext } from '../context';
import * as styles from './group-header.css';

export const DocGroupHeader = ({
  className,
  groupId,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  groupId: string;
}) => {
  const t = useI18n();
  const {
    selectMode,
    collapsed,
    groups,
    selectedDocIds,
    onToggleCollapse,
    onSelect,
  } = useContext(DocExplorerContext);

  const group = groups.find(g => g.key === groupId);
  const isGroupAllSelected = group?.items.every(id =>
    selectedDocIds.includes(id)
  );

  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse(groupId);
  }, [groupId, onToggleCollapse]);

  const handleSelectAll = useCallback(() => {
    if (isGroupAllSelected) {
      onSelect(prev => prev.filter(id => !group?.items.includes(id)));
    } else {
      onSelect(prev => {
        const newSelected = [...prev];
        group?.items.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  }, [group?.items, isGroupAllSelected, onSelect]);

  const selectedCount = group?.items.filter(id =>
    selectedDocIds.includes(id)
  ).length;

  return (
    <div
      className={styles.groupHeader}
      data-collapsed={collapsed.includes(groupId)}
    >
      <div className={clsx(styles.content, className)} {...props} />
      {selectMode ? (
        <div className={styles.selectInfo}>
          {selectedCount}/{group?.items.length}
        </div>
      ) : null}
      <IconButton
        className={styles.collapseButton}
        icon={<ToggleRightIcon className={styles.collapseButtonIcon} />}
        onClick={handleToggleCollapse}
      />
      <div className={styles.space} />
      <Button
        size="custom"
        className={styles.selectAllButton}
        variant="plain"
        onClick={handleSelectAll}
      >
        {t[
          isGroupAllSelected
            ? 'com.affine.page.group-header.clear'
            : 'com.affine.page.group-header.select-all'
        ]()}
      </Button>
    </div>
  );
};

export const PlainTextDocGroupHeader = ({
  groupId,
  docCount,
  className,
  children,
  icon,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  groupId: string;
  docCount: number;
  icon?: ReactNode;
}) => {
  return (
    <DocGroupHeader
      className={clsx(styles.plainTextGroupHeader, className)}
      groupId={groupId}
      {...props}
    >
      {icon ? (
        <div className={styles.plainTextGroupHeaderIcon}>{icon}</div>
      ) : null}
      <div>{children ?? groupId}</div>
      <div>·</div>
      <div>{docCount}</div>
    </DocGroupHeader>
  );
};
