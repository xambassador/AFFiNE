import { AttachmentStoreExtension } from '@blocksuite/affine/blocks/attachment/store';
import { BookmarkStoreExtension } from '@blocksuite/affine/blocks/bookmark/store';
import { CalloutStoreExtension } from '@blocksuite/affine/blocks/callout/store';
import { CodeStoreExtension } from '@blocksuite/affine/blocks/code/store';
import { DataViewStoreExtension } from '@blocksuite/affine/blocks/data-view/store';
import { DatabaseStoreExtension } from '@blocksuite/affine/blocks/database/store';
import { StoreExtensionManager } from '@blocksuite/affine/ext-loader';

export function createStoreManager() {
  const manager = new StoreExtensionManager([
    AttachmentStoreExtension,
    BookmarkStoreExtension,
    CalloutStoreExtension,
    CodeStoreExtension,
    DataViewStoreExtension,
    DatabaseStoreExtension,
  ]);

  return manager;
}
