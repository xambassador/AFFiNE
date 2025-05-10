import type { DocCustomPropertyInfo } from '@affine/core/modules/db';
import { type DocRecord, DocsService } from '@affine/core/modules/doc';
import {
  WorkspacePropertyService,
  type WorkspacePropertyType,
} from '@affine/core/modules/workspace-property';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useContext, useMemo } from 'react';

import type { WorkspacePropertyTypes } from '../../workspace-property-types';
import { DocExplorerContext } from '../context';
import { filterDisplayProperties } from '../display-menu/properties';
import { listHide560, listHide750 } from './doc-list-item.css';
import * as styles from './properties.css';

const listInlinePropertyOrder: WorkspacePropertyType[] = [
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
];
const cardInlinePropertyOrder: WorkspacePropertyType[] = [
  'createdBy',
  'updatedBy',
  'createdAt',
  'updatedAt',
];

const useProperties = (docId: string, view: 'list' | 'card') => {
  const contextValue = useContext(DocExplorerContext);
  const displayProperties = useLiveData(contextValue.displayProperties$);
  const docsService = useService(DocsService);
  const workspacePropertyService = useService(WorkspacePropertyService);

  const doc = useLiveData(docsService.list.doc$(docId));
  const properties = useLiveData(doc?.properties$);
  const propertyList = useLiveData(workspacePropertyService.properties$);

  const stackProperties = useMemo(
    () => (properties ? filterDisplayProperties(propertyList, 'stack') : []),
    [properties, propertyList]
  );
  const inlineProperties = useMemo(
    () =>
      properties
        ? filterDisplayProperties(propertyList, 'inline')
            .filter(p => p.property.type !== 'tags')
            .sort((a, b) => {
              const orderList =
                view === 'list'
                  ? listInlinePropertyOrder
                  : cardInlinePropertyOrder;
              const aIndex = orderList.indexOf(a.property.type);
              const bIndex = orderList.indexOf(b.property.type);
              // Push un-recognised types to the tail instead of the head
              return (
                (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
                (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
              );
            })
        : [],
    [properties, propertyList, view]
  );
  const tagsProperty = useMemo(() => {
    return propertyList
      ? filterDisplayProperties(propertyList, 'inline').find(
          prop => prop.property.type === 'tags'
        )
      : undefined;
  }, [propertyList]);

  return useMemo(
    () => ({
      doc,
      displayProperties,
      stackProperties,
      inlineProperties,
      tagsProperty,
    }),
    [doc, displayProperties, stackProperties, inlineProperties, tagsProperty]
  );
};
export const ListViewProperties = ({ docId }: { docId: string }) => {
  const {
    doc,
    displayProperties,
    stackProperties,
    inlineProperties,
    tagsProperty,
  } = useProperties(docId, 'list');

  if (!doc) {
    return null;
  }

  return (
    <>
      {/* stack properties */}
      <div className={clsx(styles.stackContainer, listHide750)}>
        <div className={styles.stackProperties}>
          {stackProperties.map(({ property, config }) => {
            if (!displayProperties?.includes(property.id)) {
              return null;
            }
            return (
              <PropertyRenderer
                key={property.id}
                doc={doc}
                property={property}
                config={config}
              />
            );
          })}
        </div>
        {tagsProperty &&
        displayProperties?.includes(tagsProperty.property.id) ? (
          <div className={styles.stackProperties}>
            <PropertyRenderer
              doc={doc}
              property={tagsProperty.property}
              config={tagsProperty.config}
            />
          </div>
        ) : null}
      </div>
      {/* inline properties */}
      {inlineProperties.map(({ property, config }) => {
        if (!displayProperties?.includes(property.id)) {
          return null;
        }
        return (
          <div
            key={property.id}
            className={clsx(styles.inlineProperty, listHide560)}
          >
            <PropertyRenderer doc={doc} property={property} config={config} />
          </div>
        );
      })}
    </>
  );
};

export const CardViewProperties = ({ docId }: { docId: string }) => {
  const {
    doc,
    displayProperties,
    stackProperties,
    inlineProperties,
    tagsProperty,
  } = useProperties(docId, 'card');

  if (!doc) {
    return null;
  }

  return (
    <div className={styles.cardProperties}>
      {inlineProperties.map(({ property, config }) => {
        if (!displayProperties?.includes(property.id)) {
          return null;
        }
        return (
          <div key={property.id} className={styles.inlineProperty}>
            <PropertyRenderer doc={doc} property={property} config={config} />
          </div>
        );
      })}
      {tagsProperty && displayProperties?.includes(tagsProperty.property.id) ? (
        <PropertyRenderer
          doc={doc}
          property={tagsProperty.property}
          config={tagsProperty.config}
        />
      ) : null}
      {stackProperties.map(({ property, config }) => {
        if (!displayProperties?.includes(property.id)) {
          return null;
        }
        return (
          <PropertyRenderer
            key={property.id}
            doc={doc}
            property={property}
            config={config}
          />
        );
      })}
    </div>
  );
};

const PropertyRenderer = ({
  property,
  doc,
  config,
}: {
  property: DocCustomPropertyInfo;
  doc: DocRecord;
  config: (typeof WorkspacePropertyTypes)[keyof typeof WorkspacePropertyTypes];
}) => {
  const customPropertyValue = useLiveData(doc.customProperty$(property.id));
  if (!config.docListProperty) {
    return null;
  }

  return (
    <config.docListProperty
      value={customPropertyValue}
      doc={doc}
      propertyInfo={property}
    />
  );
};
