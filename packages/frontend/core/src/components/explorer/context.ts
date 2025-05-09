import { createContext, type Dispatch, type SetStateAction } from 'react';

import type { DocListItemView } from './docs-view/doc-list-item';
import type { ExplorerPreference } from './types';

export type DocExplorerContextType = ExplorerPreference & {
  view: DocListItemView;
  setView: Dispatch<SetStateAction<DocListItemView>>;
  groups: Array<{ key: string; items: string[] }>;
  collapsed: string[];
  selectMode?: boolean;
  selectedDocIds: string[];
  prevCheckAnchorId?: string | null;
  onToggleCollapse: (groupId: string) => void;
  onToggleSelect: (docId: string) => void;
  onSelect: Dispatch<SetStateAction<string[]>>;
  setPrevCheckAnchorId: Dispatch<SetStateAction<string | null>>;
};

export const DocExplorerContext = createContext<DocExplorerContextType>({
  view: 'list',
  setView: () => {},
  groups: [],
  collapsed: [],
  selectedDocIds: [],
  prevCheckAnchorId: null,
  onToggleSelect: () => {},
  onToggleCollapse: () => {},
  onSelect: () => {},
  setPrevCheckAnchorId: () => {},
});
