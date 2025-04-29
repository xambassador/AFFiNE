import { effects as fragmentDocTitleEffects } from '@blocksuite/affine-fragment-doc-title/effects';
import { effects as fragmentFramePanelEffects } from '@blocksuite/affine-fragment-frame-panel/effects';
import { effects as fragmentOutlineEffects } from '@blocksuite/affine-fragment-outline/effects';

export function effects() {
  fragmentDocTitleEffects();
  fragmentFramePanelEffects();
  fragmentOutlineEffects();
}
