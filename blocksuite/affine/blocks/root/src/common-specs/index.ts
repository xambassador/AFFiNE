import { NoteBlockSchema } from '@blocksuite/affine-model';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';

import { RootBlockAdapterExtensions } from '../adapters/extension';
import { clipboardConfigs } from '../clipboard';
import { builtinToolbarConfig } from '../configs/toolbar';
import { fallbackKeymap } from '../keyboard/keymap';
import { viewportOverlayWidget } from './widgets';

export const CommonSpecs: ExtensionType[] = [
  FlavourExtension('affine:page'),
  ...RootBlockAdapterExtensions,
  ...clipboardConfigs,
  viewportOverlayWidget,
  fallbackKeymap,

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier(NoteBlockSchema.model.flavour),
    config: builtinToolbarConfig,
  }),
];

export * from './widgets';
