import { Checkbox, MenuItem, MenuSub } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { useLiveData } from '@toeverything/infra';
import { useCallback, useContext } from 'react';

import { DocExplorerContext } from '../context';
import { type QuickAction, quickActions } from '../quick-actions.constants';

export const QuickActionsConfig = () => {
  const t = useI18n();

  return (
    <MenuSub
      items={quickActions.map(action => {
        if (action.disabled) return null;

        return <QuickActionItem key={action.key} action={action} />;
      })}
    >
      {t['com.affine.all-docs.quick-actions']()}
    </MenuSub>
  );
};

const QuickActionItem = ({ action }: { action: QuickAction }) => {
  const t = useI18n();
  const explorerContextValue = useContext(DocExplorerContext);

  const value = useLiveData(explorerContextValue[`${action.key}$`]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const value = explorerContextValue[`${action.key}$`]?.value;
      explorerContextValue[`${action.key}$`]?.next(!value);
    },
    [action.key, explorerContextValue]
  );

  return (
    <MenuItem prefixIcon={<Checkbox checked={!!value} />} onClick={handleClick}>
      {t.t(action.name)}
    </MenuItem>
  );
};
