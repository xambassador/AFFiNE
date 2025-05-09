import { IconButton } from '@affine/component';
import { ExplorerNavigation } from '@affine/core/components/explorer/header/navigation';
import { PageDisplayMenu } from '@affine/core/components/page-list';
import { Header } from '@affine/core/components/pure/header';
import { PlusIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';

import * as styles from './collection.css';

export const CollectionDetailHeader = ({
  showCreateNew,
  onCreate,
}: {
  showCreateNew: boolean;
  onCreate: () => void;
}) => {
  return (
    <Header
      right={
        <>
          <IconButton
            size="16"
            icon={<PlusIcon />}
            onClick={onCreate}
            className={clsx(
              styles.headerCreateNewButton,
              styles.headerCreateNewCollectionIconButton,
              !showCreateNew && styles.headerCreateNewButtonHidden
            )}
          />
          <PageDisplayMenu />
        </>
      }
      left={<ExplorerNavigation active="collections" />}
    />
  );
};
