import { ListLayoutPainterExtension } from '@blocksuite/affine-block-list/turbo-painter';
import { ParagraphLayoutPainterExtension } from '@blocksuite/affine-block-paragraph/turbo-painter';
import { ViewportLayoutPainter } from '@blocksuite/affine-gfx-turbo-renderer/painter';

new ViewportLayoutPainter([
  ParagraphLayoutPainterExtension,
  ListLayoutPainterExtension,
]);
