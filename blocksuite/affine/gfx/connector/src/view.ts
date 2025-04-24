import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { ConnectorTool } from './connector-tool';
import { effects } from './effects';
import { ConnectorFilter } from './element-transform';
import { connectorToolbarExtension } from './toolbar/config';
import { connectorQuickTool } from './toolbar/quick-tool';

export class ConnectorViewExtension extends ViewExtensionProvider {
  override name = 'affine-connector-gfx';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    if (this.isEdgeless(context.scope)) {
      context.register(ConnectorTool);
      context.register(ConnectorFilter);
      context.register(connectorQuickTool);
      context.register(connectorToolbarExtension);
    }
  }
}
