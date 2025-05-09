import { type MenuProps, RadioGroup, type RadioItem } from '@affine/component';
import { DocExplorerContext } from '@affine/core/components/explorer/context';
import { ExplorerDisplayMenuButton } from '@affine/core/components/explorer/display-menu';
import { DocListViewIcon } from '@affine/core/components/explorer/docs-view/doc-list-item';
import { ExplorerNavigation } from '@affine/core/components/explorer/header/navigation';
import type { ExplorerPreference } from '@affine/core/components/explorer/types';
import { type Dispatch, type SetStateAction, useContext } from 'react';

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
  const { view, setView } = useContext(DocExplorerContext);
  return (
    <RadioGroup
      itemHeight={24}
      gap={8}
      padding={0}
      items={views}
      value={view}
      onChange={setView}
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
export const AllDocsHeader = ({
  explorerPreference,
  setExplorerPreference,
}: {
  explorerPreference: ExplorerPreference;
  setExplorerPreference: Dispatch<SetStateAction<ExplorerPreference>>;
}) => {
  return (
    <div className={styles.header}>
      <ExplorerNavigation active="docs" />

      <div className={styles.actions}>
        <ViewToggle />
        <ExplorerDisplayMenuButton
          preference={explorerPreference}
          onChange={setExplorerPreference}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
};
