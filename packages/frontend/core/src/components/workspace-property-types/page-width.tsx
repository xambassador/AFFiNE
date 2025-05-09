import { PropertyValue, type RadioItem } from '@affine/component';
import { DocService } from '@affine/core/modules/doc';
import { EditorSettingService } from '@affine/core/modules/editor-setting';
import { useI18n } from '@affine/i18n';
import { LongerIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import { StackProperty } from '../explorer/docs-view/stack-property';
import type { DocListPropertyProps } from '../explorer/types';
import type { PropertyValueProps } from '../properties/types';
import { PropertyRadioGroup } from '../properties/widgets/radio-group';
import { container } from './page-width.css';

export const PageWidthValue = ({ readonly }: PropertyValueProps) => {
  const t = useI18n();
  const editorSetting = useService(EditorSettingService).editorSetting;
  const defaultPageWidth = useLiveData(editorSetting.settings$).fullWidthLayout;

  const doc = useService(DocService).doc;
  const pageWidth = useLiveData(doc.properties$.selector(p => p.pageWidth));

  const radioValue = pageWidth ?? (defaultPageWidth ? 'fullWidth' : 'standard');

  const radioItems = useMemo<RadioItem[]>(
    () => [
      {
        value: 'standard',
        label:
          t[
            'com.affine.settings.editorSettings.page.default-page-width.standard'
          ](),
        testId: 'standard-width-trigger',
      },
      {
        value: 'fullWidth',
        label:
          t[
            'com.affine.settings.editorSettings.page.default-page-width.full-width'
          ](),
        testId: 'full-width-trigger',
      },
    ],
    [t]
  );

  const handleChange = useCallback(
    (value: string) => {
      doc.record.setProperty('pageWidth', value);
    },
    [doc]
  );
  return (
    <PropertyValue className={container} hoverable={false} readonly={readonly}>
      <PropertyRadioGroup
        value={radioValue}
        onChange={handleChange}
        items={radioItems}
        disabled={readonly}
      />
    </PropertyValue>
  );
};

export const PageWidthDocListProperty = ({ doc }: DocListPropertyProps) => {
  const t = useI18n();
  const pageWidth = useLiveData(doc.properties$.selector(p => p.pageWidth));

  return (
    <StackProperty icon={<LongerIcon />}>
      {pageWidth === 'standard' || !pageWidth
        ? t[
            'com.affine.settings.editorSettings.page.default-page-width.standard'
          ]()
        : t[
            'com.affine.settings.editorSettings.page.default-page-width.full-width'
          ]()}
    </StackProperty>
  );
};
