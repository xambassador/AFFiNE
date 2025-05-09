import type { DropTargetOptions } from '@affine/component';
import { isFavoriteSupportType } from '@affine/core/modules/favorite';
import type { AffineDNDData } from '@affine/core/types/dnd';

import type { NavigationPanelTreeNodeDropEffect } from '../../tree';

export const favoriteChildrenDropEffect: NavigationPanelTreeNodeDropEffect =
  data => {
    if (
      data.treeInstruction?.type === 'reorder-above' ||
      data.treeInstruction?.type === 'reorder-below'
    ) {
      if (
        data.source.data.from?.at === 'navigation-panel:favorite:list' &&
        data.source.data.entity?.type &&
        isFavoriteSupportType(data.source.data.entity.type)
      ) {
        return 'move';
      } else if (
        data.source.data.entity?.type &&
        isFavoriteSupportType(data.source.data.entity.type)
      ) {
        return 'link';
      }
    }
    return; // not supported
  };

export const favoriteRootDropEffect: NavigationPanelTreeNodeDropEffect =
  data => {
    const sourceType = data.source.data.entity?.type;
    if (sourceType && isFavoriteSupportType(sourceType)) {
      return 'link';
    }
    return;
  };

export const favoriteRootCanDrop: DropTargetOptions<AffineDNDData>['canDrop'] =
  data => {
    return data.source.data.entity?.type
      ? isFavoriteSupportType(data.source.data.entity.type)
      : false;
  };

export const favoriteChildrenCanDrop: DropTargetOptions<AffineDNDData>['canDrop'] =
  // Same as favoriteRootCanDrop
  data => favoriteRootCanDrop(data);
