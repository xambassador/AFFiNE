import {
  EdgelessBuiltInSpecs,
  PageRootBlockSpec,
  PreviewEdgelessRootBlockSpec,
  PreviewPageRootBlockSpec,
  ReadOnlyClipboard,
} from '@blocksuite/affine-block-root';
import {
  EdgelessSurfaceBlockAdapterExtensions,
  EdgelessSurfaceBlockSpec,
  PageSurfaceBlockSpec,
  SurfaceBlockAdapterExtensions,
} from '@blocksuite/affine-block-surface';
import { inlinePresetExtensions } from '@blocksuite/affine-inline-preset';
import {
  DefaultOpenDocExtension,
  DocDisplayMetaService,
  EditPropsStore,
  FontLoaderService,
} from '@blocksuite/affine-shared/services';
import type { ExtensionType } from '@blocksuite/store';

const CommonBlockSpecs: ExtensionType[] = [
  inlinePresetExtensions,
  DocDisplayMetaService,
  EditPropsStore,
  DefaultOpenDocExtension,
  FontLoaderService,
].flat();

const PageFirstPartyBlockSpecs: ExtensionType[] = [
  CommonBlockSpecs,
  PageSurfaceBlockSpec,

  ...SurfaceBlockAdapterExtensions,
].flat();

const EdgelessFirstPartyBlockSpecs: ExtensionType[] = [
  CommonBlockSpecs,
  EdgelessSurfaceBlockSpec,

  ...EdgelessSurfaceBlockAdapterExtensions,
].flat();

export const MigratingEdgelessEditorBlockSpecs: ExtensionType[] = [
  EdgelessBuiltInSpecs,
  EdgelessFirstPartyBlockSpecs,
].flat();

export const MigratingPageEditorBlockSpecs: ExtensionType[] = [
  PageRootBlockSpec,
  PageFirstPartyBlockSpecs,
].flat();

export const MigratingPreviewEdgelessEditorBlockSpecs: ExtensionType[] = [
  PreviewEdgelessRootBlockSpec,
  EdgelessFirstPartyBlockSpecs,
  ReadOnlyClipboard,
].flat();

export const MigratingPreviewPageEditorBlockSpecs: ExtensionType[] = [
  PreviewPageRootBlockSpec,
  PageFirstPartyBlockSpecs,
  ReadOnlyClipboard,
].flat();
