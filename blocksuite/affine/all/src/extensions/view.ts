import { AttachmentViewExtension } from '@blocksuite/affine-block-attachment/view';
import { BookmarkViewExtension } from '@blocksuite/affine-block-bookmark/view';
import { CalloutViewExtension } from '@blocksuite/affine-block-callout/view';
import { CodeBlockViewExtension } from '@blocksuite/affine-block-code/view';
import { DataViewViewExtension } from '@blocksuite/affine-block-data-view/view';
import { DatabaseViewExtension } from '@blocksuite/affine-block-database/view';
import { DividerViewExtension } from '@blocksuite/affine-block-divider/view';
import { EdgelessTextViewExtension } from '@blocksuite/affine-block-edgeless-text/view';
import { EmbedViewExtension } from '@blocksuite/affine-block-embed/view';
import { FrameViewExtension } from '@blocksuite/affine-block-frame/view';
import { ImageViewExtension } from '@blocksuite/affine-block-image/view';
import { LatexViewExtension } from '@blocksuite/affine-block-latex/view';
import { ListViewExtension } from '@blocksuite/affine-block-list/view';
import { NoteViewExtension } from '@blocksuite/affine-block-note/view';
import { ParagraphViewExtension } from '@blocksuite/affine-block-paragraph/view';
import { SurfaceRefViewExtension } from '@blocksuite/affine-block-surface-ref/view';
import { TableViewExtension } from '@blocksuite/affine-block-table/view';
import { BrushViewExtension } from '@blocksuite/affine-gfx-brush/view';
import { NoteViewExtension as GfxNoteViewExtension } from '@blocksuite/affine-gfx-note/view';
import { ShapeViewExtension } from '@blocksuite/affine-gfx-shape/view';
import { FootnoteViewExtension } from '@blocksuite/affine-inline-footnote/view';
import { LatexViewExtension as InlineLatexViewExtension } from '@blocksuite/affine-inline-latex/view';
import { LinkViewExtension } from '@blocksuite/affine-inline-link/view';
import { MentionViewExtension } from '@blocksuite/affine-inline-mention/view';
import { InlinePresetViewExtension } from '@blocksuite/affine-inline-preset/view';
import { ReferenceViewExtension } from '@blocksuite/affine-inline-reference/view';

import { MigratingViewExtension } from './migrating-view';

export function getInternalViewExtensions() {
  return [
    GfxNoteViewExtension,
    BrushViewExtension,
    ShapeViewExtension,
    // mind
    // template

    // Block
    AttachmentViewExtension,
    BookmarkViewExtension,
    CalloutViewExtension,
    CodeBlockViewExtension,
    DataViewViewExtension,
    DatabaseViewExtension,
    DividerViewExtension,
    EdgelessTextViewExtension,
    EmbedViewExtension,
    FrameViewExtension,
    ImageViewExtension,
    LatexViewExtension,
    ListViewExtension,
    NoteViewExtension,
    ParagraphViewExtension,
    SurfaceRefViewExtension,
    TableViewExtension,

    // Inline
    FootnoteViewExtension,
    LinkViewExtension,
    ReferenceViewExtension,
    InlineLatexViewExtension,
    MentionViewExtension,
    InlinePresetViewExtension,

    MigratingViewExtension,
  ];
}
