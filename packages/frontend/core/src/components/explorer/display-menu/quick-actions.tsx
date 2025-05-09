import { Checkbox, MenuItem, MenuSub } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { useCallback } from 'react';

import { type QuickActionKey, quickActions } from '../quick-actions.constants';
import type { ExplorerPreference } from '../types';

export const QuickActionsConfig = ({
  preference,
  onChange,
}: {
  preference: ExplorerPreference;
  onChange?: (preference: ExplorerPreference) => void;
}) => {
  const t = useI18n();

  const toggleAction = useCallback(
    (key: QuickActionKey) => {
      onChange?.({
        ...preference,
        [key]: !preference[key],
      });
    },
    [preference, onChange]
  );

  return (
    <MenuSub
      items={quickActions.map(action => {
        if (action.disabled) return null;

        return (
          <MenuItem
            key={action.key}
            onClick={e => {
              // do not close sub menu
              e.preventDefault();
              toggleAction(action.key);
            }}
            prefixIcon={<Checkbox checked={!!preference[action.key]} />}
          >
            {t.t(action.name)}
          </MenuItem>
        );
      })}
    >
      {t['com.affine.all-docs.quick-actions']()}
    </MenuSub>
  );
};
