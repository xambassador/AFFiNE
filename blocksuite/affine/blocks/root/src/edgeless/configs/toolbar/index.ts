import { groupToolbarExtension } from '@blocksuite/affine-gfx-group';
import { textToolbarExtension } from '@blocksuite/affine-gfx-text';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';

import { builtinLockedToolbarConfig, builtinMiscToolbarConfig } from './misc';

export const EdgelessElementToolbarExtension: ExtensionType[] = [
  groupToolbarExtension,

  textToolbarExtension,

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:*'),
    config: builtinMiscToolbarConfig,
  }),

  // Special Scenarios
  // Only display the `unlock` button when the selection includes a locked element.
  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:locked'),
    config: builtinLockedToolbarConfig,
  }),
];
