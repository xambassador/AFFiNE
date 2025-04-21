import { AttachmentStoreExtension } from '@blocksuite/affine/blocks/attachment/store';
import { BookmarkStoreExtension } from '@blocksuite/affine/blocks/bookmark/store';
import { CalloutStoreExtension } from '@blocksuite/affine/blocks/callout/store';
import { CodeStoreExtension } from '@blocksuite/affine/blocks/code/store';
import { DataViewStoreExtension } from '@blocksuite/affine/blocks/data-view/store';
import { DatabaseStoreExtension } from '@blocksuite/affine/blocks/database/store';
import { DividerStoreExtension } from '@blocksuite/affine/blocks/divider/store';
import { EdgelessTextStoreExtension } from '@blocksuite/affine/blocks/edgeless-text/store';
import { EmbedStoreExtension } from '@blocksuite/affine/blocks/embed/store';
import { StoreExtensionManager } from '@blocksuite/affine/ext-loader';

export function createStoreManager() {
  const manager = new StoreExtensionManager([
    AttachmentStoreExtension,
    BookmarkStoreExtension,
    CalloutStoreExtension,
    CodeStoreExtension,
    DataViewStoreExtension,
    DatabaseStoreExtension,
    DividerStoreExtension,
    EdgelessTextStoreExtension,
    EmbedStoreExtension,
  ]);

  return manager;
}
