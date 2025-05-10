import { type MenuProps, RadioGroup, type RadioItem } from '@affine/component';
import { DocExplorerContext } from '@affine/core/components/explorer/context';
import { ExplorerDisplayMenuButton } from '@affine/core/components/explorer/display-menu';
import {
  type DocListItemView,
  DocListViewIcon,
} from '@affine/core/components/explorer/docs-view/doc-list-item';
import { ExplorerNavigation } from '@affine/core/components/explorer/header/navigation';
import { useLiveData } from '@toeverything/infra';
import { useCallback, useContext } from 'react';

import * as styles from './all-page-header.css';

const views = [
  {
    label: <DocListViewIcon view="masonry" />,
    value: 'masonry',
    className: styles.viewToggleItem,
  },
  {
    label: <DocListViewIcon view="grid" />,
    value: 'grid',
    className: styles.viewToggleItem,
  },
  {
    label: <DocListViewIcon view="list" />,
    value: 'list',
    className: styles.viewToggleItem,
  },
] satisfies RadioItem[];

const ViewToggle = () => {
  const explorerContextValue = useContext(DocExplorerContext);

  const view = useLiveData(explorerContextValue.view$);

  const handleViewChange = useCallback(
    (view: DocListItemView) => {
      explorerContextValue.view$?.next(view);
    },
    [explorerContextValue.view$]
  );

  return (
    <RadioGroup
      itemHeight={24}
      gap={8}
      padding={0}
      items={views}
      value={view}
      onChange={handleViewChange}
      className={styles.viewToggle}
      borderRadius={4}
      indicatorClassName={styles.viewToggleIndicator}
    />
  );
};

const menuProps: Partial<MenuProps> = {
  contentOptions: {
    side: 'bottom',
    align: 'end',
    alignOffset: 0,
    sideOffset: 8,
  },
};
export const AllDocsHeader = () => {
  return (
    <div className={styles.header}>
      <ExplorerNavigation active="docs" />

      <div className={styles.actions}>
        <ViewToggle />
        <ExplorerDisplayMenuButton menuProps={menuProps} />
      </div>
    </div>
  );
};
