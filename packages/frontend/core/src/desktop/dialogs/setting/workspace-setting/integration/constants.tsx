import { IntegrationTypeIcon } from '@affine/core/modules/integration';
import type { I18nString } from '@affine/i18n';
import type { ReactNode } from 'react';

import { ReadwiseSettingPanel } from './readwise/setting-panel';

export type IntegrationCard = {
  id: string;
  name: I18nString;
  desc: I18nString;
  icon: ReactNode;
  setting: ReactNode;
};

export const INTEGRATION_LIST: IntegrationCard[] = [
  {
    id: 'readwise',
    name: 'com.affine.integration.readwise.name',
    desc: 'com.affine.integration.readwise.desc',
    icon: <IntegrationTypeIcon type="readwise" />,
    setting: <ReadwiseSettingPanel />,
  },
];
