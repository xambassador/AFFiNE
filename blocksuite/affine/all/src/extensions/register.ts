import { SpecProvider } from '@blocksuite/affine-shared/utils';

import {
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from './editor-specs.js';
import { StoreExtensions } from './legacy-store.js';
import {
  PreviewEdgelessEditorBlockSpecs,
  PreviewPageEditorBlockSpecs,
} from './preview-specs.js';

export function registerStoreSpecs() {
  SpecProvider._.addSpec('store', StoreExtensions);
}

export function registerBlockSpecs() {
  SpecProvider._.addSpec('page', PageEditorBlockSpecs);
  SpecProvider._.addSpec('edgeless', EdgelessEditorBlockSpecs);
  SpecProvider._.addSpec('preview:page', PreviewPageEditorBlockSpecs);
  SpecProvider._.addSpec('preview:edgeless', PreviewEdgelessEditorBlockSpecs);
}
