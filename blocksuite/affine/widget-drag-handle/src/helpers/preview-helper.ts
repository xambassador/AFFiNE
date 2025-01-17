import { SpecProvider } from '@blocksuite/affine-shared/utils';
import {
  type BlockComponent,
  BlockStdScope,
  type DndEventState,
} from '@blocksuite/block-std';
import { Point } from '@blocksuite/global/utils';
import { type BlockViewType, type Query } from '@blocksuite/store';

import { DragPreview } from '../components/drag-preview.js';
import type { AffineDragHandleWidget } from '../drag-handle.js';

export class PreviewHelper {
  private readonly _calculatePreviewOffset = (
    blocks: BlockComponent[],
    state: DndEventState
  ) => {
    const { top, left } = blocks[0].getBoundingClientRect();
    const previewOffset = new Point(state.raw.x - left, state.raw.y - top);
    return previewOffset;
  };

  private readonly _calculateQuery = (selectedIds: string[]): Query => {
    const ids: Array<{ id: string; viewType: BlockViewType }> = selectedIds.map(
      id => ({
        id,
        viewType: 'display',
      })
    );

    // The ancestors of the selected blocks should be rendered as Bypass
    selectedIds.forEach(block => {
      let parent: string | null = block;
      do {
        if (!selectedIds.includes(parent)) {
          ids.push({ viewType: 'bypass', id: parent });
        }
        parent = this.widget.doc.getParent(parent)?.id ?? null;
      } while (parent && !ids.map(({ id }) => id).includes(parent));
    });

    // The children of the selected blocks should be rendered as Display
    const addChildren = (id: string) => {
      const children = this.widget.doc.getBlock(id)?.model.children ?? [];
      children.forEach(child => {
        ids.push({ viewType: 'display', id: child.id });
        addChildren(child.id);
      });
    };
    selectedIds.forEach(addChildren);

    return {
      match: ids,
      mode: 'strict',
    };
  };

  createDragPreview = (
    blocks: BlockComponent[],
    state: DndEventState,
    dragPreviewEl?: HTMLElement,
    dragPreviewOffset?: Point
  ): DragPreview => {
    let dragPreview: DragPreview;
    if (dragPreviewEl) {
      dragPreview = new DragPreview(dragPreviewOffset);
      dragPreview.append(dragPreviewEl);
    } else {
      let width = 0;
      blocks.forEach(element => {
        width = Math.max(width, element.getBoundingClientRect().width);
      });

      const selectedIds = blocks.map(block => block.model.id);

      const query = this._calculateQuery(selectedIds);

      const store = this.widget.doc.doc.getStore({ query });

      const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
      const previewStd = new BlockStdScope({
        store,
        extensions: previewSpec.value,
      });
      const previewTemplate = previewStd.render();

      const offset = this._calculatePreviewOffset(blocks, state);
      const posX = state.raw.x - offset.x;
      const posY = state.raw.y - offset.y;
      const altKey = state.raw.altKey;

      dragPreview = new DragPreview(offset);
      dragPreview.template = previewTemplate;
      dragPreview.onRemove = () => {
        this.widget.doc.doc.clearQuery(query);
      };
      dragPreview.style.width = `${width / this.widget.scaleInNote.peek()}px`;
      dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this.widget.scaleInNote.peek()})`;

      dragPreview.style.opacity = altKey ? '1' : '0.5';
    }
    this.widget.rootComponent.append(dragPreview);
    return dragPreview;
  };

  constructor(readonly widget: AffineDragHandleWidget) {}
}
