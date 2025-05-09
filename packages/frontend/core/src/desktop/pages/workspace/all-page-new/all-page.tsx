import {
  Masonry,
  type MasonryGroup,
  RadioGroup,
  useConfirmModal,
} from '@affine/component';
import {
  DocExplorerContext,
  type DocExplorerContextType,
} from '@affine/core/components/explorer/context';
import { ExplorerDisplayMenuButton } from '@affine/core/components/explorer/display-menu';
import {
  DocListItem,
  type DocListItemView,
} from '@affine/core/components/explorer/docs-view/doc-list-item';
import type { ExplorerPreference } from '@affine/core/components/explorer/types';
import { Filters } from '@affine/core/components/filter';
import { ListFloatingToolbar } from '@affine/core/components/page-list/components/list-floating-toolbar';
import { WorkspacePropertyTypes } from '@affine/core/components/workspace-property-types';
import { CollectionRulesService } from '@affine/core/modules/collection-rules';
import type { FilterParams } from '@affine/core/modules/collection-rules/types';
import { DocsService } from '@affine/core/modules/doc';
import { WorkspacePropertyService } from '@affine/core/modules/workspace-property';
import { Trans, useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVarV2 } from '@toeverything/theme/v2';
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ViewBody,
  ViewHeader,
  ViewIcon,
  ViewTitle,
} from '../../../../modules/workbench';
import { AllDocSidebarTabs } from '../layouts/all-doc-sidebar-tabs';
import * as styles from './all-page.css';
import { MigrationAllDocsDataNotification } from './migration-data';

const GroupHeader = memo(function GroupHeader({
  groupId,
  collapsed,
  itemCount,
}: {
  groupId: string;
  collapsed?: boolean;
  itemCount: number;
}) {
  const { groupBy } = useContext(DocExplorerContext);
  const propertyService = useService(WorkspacePropertyService);
  const allProperties = useLiveData(propertyService.sortedProperties$);

  const groupType = groupBy?.type;
  const groupKey = groupBy?.key;

  const header = useMemo(() => {
    if (groupType === 'property') {
      const property = allProperties.find(p => p.id === groupKey);
      if (!property) return null;

      const config = WorkspacePropertyTypes[property.type];
      if (!config?.groupHeader) return null;
      return (
        <config.groupHeader
          groupId={groupId}
          docCount={itemCount}
          collapsed={!!collapsed}
        />
      );
    } else {
      return '// TODO: ' + groupType;
    }
  }, [allProperties, collapsed, groupId, groupKey, groupType, itemCount]);

  if (!groupType) {
    return null;
  }

  return header;
});

const calcCardHeightById = (id: string) => {
  const max = 5;
  const min = 1;
  const code = id.charCodeAt(0);
  const value = Math.floor((code % (max - min)) + min);
  return 250 + value * 10;
};

const DocListItemComponent = memo(function DocListItemComponent({
  itemId,
  groupId,
}: {
  groupId: string;
  itemId: string;
}) {
  return <DocListItem docId={itemId} groupId={groupId} />;
});

export const AllPage = () => {
  const t = useI18n();
  const docsService = useService(DocsService);
  const [view, setView] = useState<DocListItemView>('masonry');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [prevCheckAnchorId, setPrevCheckAnchorId] = useState<string | null>(
    null
  );

  const [explorerPreference, setExplorerPreference] =
    useState<ExplorerPreference>({
      filters: [
        {
          type: 'system',
          key: 'trash',
          value: 'false',
          method: 'is',
        },
      ],
      displayProperties: [],
      showDocIcon: true,
      showDocPreview: true,
    });

  const [groups, setGroups] = useState<any>([]);

  const { openConfirmModal } = useConfirmModal();

  const masonryItems = useMemo(() => {
    const items = groups.map((group: any) => {
      return {
        id: group.key,
        Component: groups.length > 1 ? GroupHeader : undefined,
        height: groups.length > 1 ? 24 : 0,
        className: styles.groupHeader,
        items: group.items.map((docId: string) => {
          return {
            id: docId,
            Component: DocListItemComponent,
            height:
              view === 'list'
                ? 42
                : view === 'grid'
                  ? 280
                  : calcCardHeightById(docId),
            'data-view': view,
            className: styles.docItem,
          };
        }),
      } satisfies MasonryGroup;
    });
    return items;
  }, [groups, view]);

  const collectionRulesService = useService(CollectionRulesService);
  useEffect(() => {
    const subscription = collectionRulesService
      .watch(
        explorerPreference.filters ?? [],
        explorerPreference.groupBy,
        explorerPreference.orderBy
      )
      .subscribe({
        next: result => {
          setGroups(result.groups);
        },
        error: error => {
          console.error(error);
        },
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [
    collectionRulesService,
    explorerPreference.filters,
    explorerPreference.groupBy,
    explorerPreference.orderBy,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectMode(false);
        setSelectedDocIds([]);
        setPrevCheckAnchorId(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleFilterChange = useCallback((filters: FilterParams[]) => {
    setExplorerPreference(prev => ({
      ...prev,
      filters,
    }));
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      return prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
    });
  }, []);
  const toggleDocSelect = useCallback((docId: string) => {
    setSelectMode(true);
    setSelectedDocIds(prev => {
      return prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId];
    });
  }, []);
  const onSelect = useCallback(
    (...args: Parameters<typeof setSelectedDocIds>) => {
      setSelectMode(true);
      setSelectedDocIds(...args);
    },
    []
  );
  const handleCloseFloatingToolbar = useCallback(() => {
    setSelectMode(false);
    setSelectedDocIds([]);
  }, []);
  const handleMultiDelete = useCallback(() => {
    if (selectedDocIds.length === 0) {
      return;
    }

    openConfirmModal({
      title: t['com.affine.moveToTrash.confirmModal.title.multiple']({
        number: selectedDocIds.length.toString(),
      }),
      description: t[
        'com.affine.moveToTrash.confirmModal.description.multiple'
      ]({
        number: selectedDocIds.length.toString(),
      }),
      cancelText: t['com.affine.confirmModal.button.cancel'](),
      confirmText: t.Delete(),
      confirmButtonOptions: {
        variant: 'error',
      },
      onConfirm: () => {
        for (const docId of selectedDocIds) {
          const doc = docsService.list.doc$(docId).value;
          doc?.moveToTrash();
        }
      },
    });
  }, [docsService.list, openConfirmModal, selectedDocIds, t]);

  const explorerContextValue = useMemo(
    () =>
      ({
        ...explorerPreference,
        view,
        groups,
        collapsed: collapsedGroups,
        selectedDocIds,
        selectMode,
        prevCheckAnchorId,
        setPrevCheckAnchorId,
        onToggleCollapse: toggleGroupCollapse,
        onToggleSelect: toggleDocSelect,
        onSelect,
      }) satisfies DocExplorerContextType,
    [
      collapsedGroups,
      explorerPreference,
      groups,
      onSelect,
      prevCheckAnchorId,
      selectMode,
      selectedDocIds,
      toggleDocSelect,
      toggleGroupCollapse,
      view,
    ]
  );

  return (
    <DocExplorerContext.Provider value={explorerContextValue}>
      <ViewTitle title={t['All pages']()} />
      <ViewIcon icon="allDocs" />
      <ViewHeader></ViewHeader>
      <ViewBody>
        <div className={styles.body}>
          <MigrationAllDocsDataNotification />
          <div>
            <RadioGroup
              items={['masonry', 'grid', 'list']}
              value={view}
              onChange={setView}
              width={240}
            />
            <Filters
              filters={explorerPreference.filters ?? []}
              onChange={handleFilterChange}
            />
            <ExplorerDisplayMenuButton
              preference={explorerPreference}
              onChange={setExplorerPreference}
            />
          </div>
          <div className={styles.scrollArea}>
            <Masonry
              items={masonryItems}
              gapY={12}
              gapX={12}
              groupsGap={12}
              groupHeaderGapWithItems={12}
              columns={view === 'list' ? 1 : undefined}
              itemWidthMin={220}
              preloadHeight={100}
              itemWidth={'stretch'}
              virtualScroll
              collapsedGroups={collapsedGroups}
              paddingX={useCallback(
                (w: number) => (w > 500 ? 24 : w > 393 ? 20 : 16),
                []
              )}
            />
          </div>
        </div>
        <ListFloatingToolbar
          open={selectMode}
          onDelete={handleMultiDelete}
          onClose={handleCloseFloatingToolbar}
          content={
            <Trans
              i18nKey="com.affine.page.toolbar.selected"
              count={selectedDocIds.length}
            >
              <div style={{ color: cssVarV2.text.secondary }}>
                {{ count: selectedDocIds.length } as any}
              </div>
              selected
            </Trans>
          }
        />
      </ViewBody>
      <AllDocSidebarTabs />
    </DocExplorerContext.Provider>
  );
};

export const Component = () => {
  return <AllPage />;
};
