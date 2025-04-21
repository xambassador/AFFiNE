import { AttachmentViewExtension } from '@blocksuite/affine/blocks/attachment/view';
import { BookmarkViewExtension } from '@blocksuite/affine/blocks/bookmark/view';
import { CalloutViewExtension } from '@blocksuite/affine/blocks/callout/view';
import { CodeBlockViewExtension } from '@blocksuite/affine/blocks/code/view';
import { DataViewViewExtension } from '@blocksuite/affine/blocks/data-view/view';
import { DatabaseViewExtension } from '@blocksuite/affine/blocks/database/view';
import { ViewExtensionManager } from '@blocksuite/affine/ext-loader';

export function createViewManager() {
  const manager = new ViewExtensionManager([
    AttachmentViewExtension,
    BookmarkViewExtension,
    CalloutViewExtension,
    CodeBlockViewExtension,
    DataViewViewExtension,
    DatabaseViewExtension,
  ]);

  return manager;
}
