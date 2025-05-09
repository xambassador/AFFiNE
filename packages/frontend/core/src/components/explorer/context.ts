import { createContext, type Dispatch, type SetStateAction } from 'react';

import type { ExplorerPreference } from './types';

export type DocExplorerContextType = ExplorerPreference & {
  view: 'list' | 'grid' | 'masonry';
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
  groups: [],
  collapsed: [],
  selectedDocIds: [],
  prevCheckAnchorId: null,
  onToggleSelect: () => {},
  onToggleCollapse: () => {},
  onSelect: () => {},
  setPrevCheckAnchorId: () => {},
});
