import { ViewExtensionManager } from '@blocksuite/affine/ext-loader';
import { MigratingViewExtension } from '@blocksuite/affine/extensions/view';

export function getTestViewManager() {
  const manager = new ViewExtensionManager([MigratingViewExtension]);
  return manager;
}
