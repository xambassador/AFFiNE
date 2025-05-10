import { Button, Divider } from '@affine/component';
import {
  WorkspacePropertyService,
  type WorkspacePropertyType,
} from '@affine/core/modules/workspace-property';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useContext, useMemo } from 'react';

import { WorkspacePropertyName } from '../../properties';
import { WorkspacePropertyTypes } from '../../workspace-property-types';
import { DocExplorerContext } from '../context';
import * as styles from './properties.css';

export const filterDisplayProperties = <
  T extends { type: WorkspacePropertyType },
>(
  propertyList: T[],
  showInDocList: 'inline' | 'stack'
) => {
  return propertyList
    .filter(
      property =>
        WorkspacePropertyTypes[property.type].showInDocList === showInDocList
    )
    .map(property => ({
      property,
      config: WorkspacePropertyTypes[property.type],
    }));
};

export const DisplayProperties = () => {
  const t = useI18n();
  const explorerContextValue = useContext(DocExplorerContext);
  const workspacePropertyService = useService(WorkspacePropertyService);
  const propertyList = useLiveData(workspacePropertyService.properties$);

  const displayProperties = useLiveData(
    explorerContextValue.displayProperties$
  );
  const showIcon = useLiveData(explorerContextValue.showDocIcon$);
  const showBody = useLiveData(explorerContextValue.showDocPreview$);

  const propertiesGroups = useMemo(
    () => [
      {
        type: 'inline',
        properties: filterDisplayProperties(propertyList, 'inline'),
      },
      {
        type: 'stack',
        properties: filterDisplayProperties(propertyList, 'stack'),
      },
    ],
    [propertyList]
  );

  const handleDisplayPropertiesChange = useCallback(
    (displayProperties: string[]) => {
      explorerContextValue.displayProperties$?.next(displayProperties);
    },
    [explorerContextValue.displayProperties$]
  );

  const handlePropertyClick = useCallback(
    (propertyId: string) => {
      handleDisplayPropertiesChange(
        displayProperties && displayProperties.includes(propertyId)
          ? displayProperties.filter(id => id !== propertyId)
          : [...(displayProperties || []), propertyId]
      );
    },
    [displayProperties, handleDisplayPropertiesChange]
  );

  const toggleIcon = useCallback(() => {
    explorerContextValue.showDocIcon$?.next(!showIcon);
  }, [explorerContextValue.showDocIcon$, showIcon]);

  const toggleBody = useCallback(() => {
    explorerContextValue.showDocPreview$?.next(!showBody);
  }, [explorerContextValue.showDocPreview$, showBody]);

  return (
    <div className={styles.root}>
      <section className={styles.sectionLabel}>
        {t['com.affine.all-docs.display.properties']()}
      </section>
      {propertiesGroups.map(list => {
        return (
          <div className={styles.properties} key={list.type}>
            {list.properties.map(({ property }) => {
              return (
                <Button
                  key={property.id}
                  data-show={
                    displayProperties && displayProperties.includes(property.id)
                  }
                  onClick={() => handlePropertyClick(property.id)}
                  className={styles.property}
                  data-property-id={property.id}
                >
                  <WorkspacePropertyName propertyInfo={property} />
                </Button>
              );
            })}
          </div>
        );
      })}
      <Divider size="thinner" />
      <section className={styles.sectionLabel}>
        {t['com.affine.all-docs.display.list-view']()}
      </section>
      <div className={styles.properties}>
        <Button
          className={styles.property}
          data-show={showIcon}
          onClick={toggleIcon}
        >
          {t['com.affine.all-docs.display.list-view.icon']()}
        </Button>
        <Button
          className={styles.property}
          data-show={showBody}
          onClick={toggleBody}
        >
          {t['com.affine.all-docs.display.list-view.body']()}
        </Button>
      </div>
    </div>
  );
};
