import { latexDeltaMarkdownAdapterMatch } from '@blocksuite/affine-inline-latex';
import { referenceDeltaMarkdownAdapterMatch } from '@blocksuite/affine-inline-reference';
import type { ExtensionType } from '@blocksuite/store';

export const InlineDeltaToPlainTextAdapterExtensions: ExtensionType[] = [
  referenceDeltaMarkdownAdapterMatch,
  latexDeltaMarkdownAdapterMatch,
];
