import {
  downloadImageBlob,
  type ImageBlockComponent,
} from '@blocksuite/affine-block-image';
import { CaptionIcon, DownloadIcon } from '@blocksuite/affine-components/icons';
import type { ImageBlockModel } from '@blocksuite/affine-model';
import { WithDisposable } from '@blocksuite/global/lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

export class EdgelessChangeImageButton extends WithDisposable(LitElement) {
  private readonly _download = () => {
    if (!this._blockComponent) return;
    downloadImageBlob(this._blockComponent).catch(console.error);
  };

  private readonly _showCaption = () => {
    this._blockComponent?.captionEditor?.show();
  };

  private get _blockComponent() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const block = this.edgeless.std.view.getBlock(
      blockSelection[0].blockId
    ) as ImageBlockComponent | null;

    return block;
  }

  private get _doc() {
    return this.model.doc;
  }

  override render() {
    return html`
      <editor-icon-button
        aria-label="Download"
        .tooltip=${'Download'}
        ?disabled=${this._doc.readonly}
        @click=${this._download}
      >
        ${DownloadIcon}
      </editor-icon-button>

      <editor-toolbar-separator></editor-toolbar-separator>

      <editor-icon-button
        aria-label="Add caption"
        .tooltip=${'Add caption'}
        class="change-image-button caption"
        ?disabled=${this._doc.readonly}
        @click=${this._showCaption}
      >
        ${CaptionIcon}
      </editor-icon-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor model!: ImageBlockModel;
}

export function renderChangeImageButton(
  edgeless: EdgelessRootBlockComponent,
  images?: ImageBlockModel[]
) {
  if (images?.length !== 1) return nothing;

  return html`
    <edgeless-change-image-button
      .model=${images[0]}
      .edgeless=${edgeless}
    ></edgeless-change-image-button>
  `;
}
