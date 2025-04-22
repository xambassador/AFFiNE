import { Container } from '@blocksuite/global/di';

import {
  registerBlockSpecs,
  registerStoreSpecs,
} from '../../extensions/register';
import { testStoreExtensions } from './store';

registerStoreSpecs();
registerBlockSpecs();

export function getProvider() {
  const container = new Container();
  const exts = testStoreExtensions;
  exts.forEach(ext => {
    ext.setup(container);
  });
  return container.provider();
}
