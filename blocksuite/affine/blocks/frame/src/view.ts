import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects';
import { FrameHighlightManager } from './frame-highlight-manager';
import { FrameBlockSpec } from './frame-spec';
import { FrameTool } from './frame-tool';
import { PresentTool } from './preset-tool';

export class FrameViewExtension extends ViewExtensionProvider {
  override name = 'affine-frame-block';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext): void {
    super.setup(context);
    context.register(FrameBlockSpec);
    if (this.isEdgeless(context.scope)) {
      context.register(FrameHighlightManager);
      context.register(FrameTool);
      context.register(PresentTool);
    }
  }
}
