import {
  Button,
  Divider,
  Menu,
  type MenuProps,
  MenuSub,
} from '@affine/component';
import type {
  GroupByParams,
  OrderByParams,
} from '@affine/core/modules/collection-rules/types';
import { useI18n } from '@affine/i18n';
import { ArrowDownSmallIcon } from '@blocksuite/icons/rc';
import { useLiveData } from '@toeverything/infra';
import type React from 'react';
import { useCallback, useContext } from 'react';

import { DocExplorerContext } from '../context';
import { GroupByList, GroupByName } from './group';
import { OrderByList, OrderByName } from './order';
import { DisplayProperties } from './properties';
import { QuickActionsConfig } from './quick-actions';
import * as styles from './styles.css';

const ExplorerDisplayMenu = () => {
  const t = useI18n();
  const explorerContextValue = useContext(DocExplorerContext);
  const groupBy = useLiveData(explorerContextValue.groupBy$);
  const orderBy = useLiveData(explorerContextValue.orderBy$);

  const handleGroupByChange = useCallback(
    (groupBy: GroupByParams) => {
      explorerContextValue.groupBy$?.next(groupBy);
    },
    [explorerContextValue.groupBy$]
  );

  const handleOrderByChange = useCallback(
    (orderBy: OrderByParams) => {
      explorerContextValue.orderBy$?.next(orderBy);
    },
    [explorerContextValue.orderBy$]
  );

  return (
    <div className={styles.displayMenuContainer}>
      <MenuSub
        items={<GroupByList groupBy={groupBy} onChange={handleGroupByChange} />}
      >
        <div className={styles.subMenuSelectorContainer}>
          <span>{t['com.affine.explorer.display-menu.grouping']()}</span>
          <span className={styles.subMenuSelectorSelected}>
            {groupBy ? <GroupByName groupBy={groupBy} /> : null}
          </span>
        </div>
      </MenuSub>
      <MenuSub
        items={<OrderByList orderBy={orderBy} onChange={handleOrderByChange} />}
      >
        <div className={styles.subMenuSelectorContainer}>
          <span>{t['com.affine.explorer.display-menu.ordering']()}</span>
          <span className={styles.subMenuSelectorSelected}>
            {orderBy ? <OrderByName orderBy={orderBy} /> : null}
          </span>
        </div>
      </MenuSub>
      <Divider size="thinner" />
      <DisplayProperties />
      <Divider size="thinner" />
      <QuickActionsConfig />
    </div>
  );
};

export const ExplorerDisplayMenuButton = ({
  style,
  className,
  menuProps,
}: {
  style?: React.CSSProperties;
  className?: string;
  menuProps?: Omit<MenuProps, 'items' | 'children'>;
}) => {
  const t = useI18n();
  return (
    <Menu items={<ExplorerDisplayMenu />} {...menuProps}>
      <Button
        className={className}
        style={style}
        suffix={<ArrowDownSmallIcon />}
      >
        {t['com.affine.explorer.display-menu.button']()}
      </Button>
    </Menu>
  );
};
