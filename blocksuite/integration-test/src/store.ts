import { StoreExtensionManager } from '@blocksuite/affine/ext-loader';
import { MigratingStoreExtension } from '@blocksuite/affine/extensions/store';

export function getTestStoreManager() {
  const manager = new StoreExtensionManager([MigratingStoreExtension]);
  return manager;
}
