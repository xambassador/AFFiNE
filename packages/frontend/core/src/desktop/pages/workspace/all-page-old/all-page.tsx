import { useBlockSuiteDocMeta } from '@affine/core/components/hooks/use-block-suite-page-meta';
import {
  PageListHeader,
  VirtualizedPageList,
} from '@affine/core/components/page-list';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { IntegrationService } from '@affine/core/modules/integration';
import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useMemo, useState } from 'react';

import {
  useIsActiveView,
  ViewBody,
  ViewHeader,
  ViewIcon,
  ViewTitle,
} from '../../../../modules/workbench';
import { AllDocSidebarTabs } from '../layouts/all-doc-sidebar-tabs';
import { EmptyPageList } from '../page-list-empty';
import * as styles from './all-page.css';
import { AllPageHeader } from './all-page-header';

export const AllPage = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const globalContext = useService(GlobalContextService).globalContext;
  const permissionService = useService(WorkspacePermissionService);
  const integrationService = useService(IntegrationService);
  const pageMetas = useBlockSuiteDocMeta(currentWorkspace.docCollection);
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);
  const isAdmin = useLiveData(permissionService.permission.isAdmin$);
  const isOwner = useLiveData(permissionService.permission.isOwner$);
  const importing = useLiveData(integrationService.importing$);

  const filteredPageMetas = useMemo(
    () => pageMetas.filter(page => !page.trash),
    [pageMetas]
  );

  const isActiveView = useIsActiveView();

  useEffect(() => {
    if (isActiveView) {
      globalContext.isAllDocs.set(true);

      return () => {
        globalContext.isAllDocs.set(false);
      };
    }
    return;
  }, [globalContext, isActiveView]);

  const t = useI18n();

  if (importing) {
    return null;
  }

  return (
    <>
      <ViewTitle title={t['All pages']()} />
      <ViewIcon icon="allDocs" />
      <ViewHeader>
        <AllPageHeader showCreateNew={!hideHeaderCreateNew} />
      </ViewHeader>
      <ViewBody>
        <div className={styles.body}>
          {filteredPageMetas.length > 0 ? (
            <VirtualizedPageList
              disableMultiDelete={!isAdmin && !isOwner}
              setHideHeaderCreateNewPage={setHideHeaderCreateNew}
            />
          ) : (
            <EmptyPageList type="all" heading={<PageListHeader />} />
          )}
        </div>
      </ViewBody>
      <AllDocSidebarTabs />
    </>
  );
};

export const Component = () => {
  return <AllPage />;
};
