import type { FeatureFlagService } from '@affine/core/modules/feature-flag';
import { IntegrationTypeIcon } from '@affine/core/modules/integration';
import type { I18nString } from '@affine/i18n';
import { TodayIcon } from '@blocksuite/icons/rc';
import { LiveData } from '@toeverything/infra';
import type { ReactNode } from 'react';

import { CalendarSettingPanel } from './calendar/setting-panel';
import { ReadwiseSettingPanel } from './readwise/setting-panel';

interface IntegrationCard {
  id: string;
  name: I18nString;
  desc: I18nString;
  icon: ReactNode;
  setting: ReactNode;
}

const INTEGRATION_LIST = [
  {
    id: 'readwise' as const,
    name: 'com.affine.integration.readwise.name',
    desc: 'com.affine.integration.readwise.desc',
    icon: <IntegrationTypeIcon type="readwise" />,
    setting: <ReadwiseSettingPanel />,
  },
  BUILD_CONFIG.isElectron && {
    id: 'calendar' as const,
    name: 'com.affine.integration.calendar.name',
    desc: 'com.affine.integration.calendar.desc',
    icon: <TodayIcon />,
    setting: <CalendarSettingPanel />,
  },
] satisfies (IntegrationCard | false)[];

type IntegrationId = Exclude<
  Extract<(typeof INTEGRATION_LIST)[number], {}>,
  false
>['id'];

export type IntegrationItem = Exclude<IntegrationCard, 'id'> & {
  id: IntegrationId;
};

export function getAllowedIntegrationList$(
  featureFlagService: FeatureFlagService
) {
  return LiveData.computed(get => {
    return INTEGRATION_LIST.filter(item => {
      if (!item) return false;

      if (item.id === 'calendar') {
        return get(featureFlagService.flags.enable_calendar_integration.$);
      }

      return true;
    }) as IntegrationItem[];
  });
}
