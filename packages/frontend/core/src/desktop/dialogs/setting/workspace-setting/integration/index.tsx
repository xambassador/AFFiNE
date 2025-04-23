import { SettingHeader } from '@affine/component/setting-components';
import { useI18n } from '@affine/i18n';
import { type ReactNode, useState } from 'react';

import { SubPageProvider, useSubPageIsland } from '../../sub-page';
import {
  IntegrationCard,
  IntegrationCardContent,
  IntegrationCardHeader,
} from './card';
import { INTEGRATION_LIST } from './constants';
import { list } from './index.css';

export const IntegrationSetting = () => {
  const t = useI18n();
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <>
      <SettingHeader
        title={t['com.affine.integration.integrations']()}
        subtitle={
          <>
            {t['com.affine.integration.setting.description']()}
            {/* <br /> */}
            {/* <a>{t['Learn how to develop a integration for AFFiNE']()}</a> */}
          </>
        }
      />
      <ul className={list}>
        {INTEGRATION_LIST.map(item => {
          const title =
            typeof item.name === 'string'
              ? t[item.name]()
              : t[item.name.i18nKey]();
          const desc =
            typeof item.desc === 'string'
              ? t[item.desc]()
              : t[item.desc.i18nKey]();
          return (
            <li key={item.id}>
              <IntegrationCard onClick={() => setOpened(item.id)}>
                <IntegrationCardHeader icon={item.icon} title={title} />
                <IntegrationCardContent desc={desc} />
              </IntegrationCard>
              <IntegrationSettingPage
                open={opened === item.id}
                onClose={() => setOpened(null)}
              >
                {item.setting}
              </IntegrationSettingPage>
            </li>
          );
        })}
      </ul>
    </>
  );
};

const IntegrationSettingPage = ({
  children,
  open,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) => {
  const t = useI18n();
  const island = useSubPageIsland();

  if (!island) {
    return null;
  }

  return (
    <SubPageProvider
      backText={t['com.affine.integration.integrations']()}
      island={island}
      open={open}
      onClose={onClose}
    >
      {children}
    </SubPageProvider>
  );
};
