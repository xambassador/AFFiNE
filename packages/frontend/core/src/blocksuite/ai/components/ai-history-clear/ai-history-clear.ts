import type { CopilotSessionType } from '@affine/graphql';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { type NotificationService } from '@blocksuite/affine/shared/services';
import { unsafeCSSVarV2 } from '@blocksuite/affine/shared/theme';
import { ShadowlessElement } from '@blocksuite/affine/std';
import type { Store } from '@blocksuite/affine/store';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import { AIProvider } from '../../provider';
import type { ChatContextValue } from '../ai-chat-content';

export class AIHistoryClear extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  accessor chatContextValue!: ChatContextValue;

  @property({ attribute: false })
  accessor session!: CopilotSessionType | null | undefined;

  @property({ attribute: false })
  accessor notification: NotificationService | null | undefined;

  @property({ attribute: false })
  accessor doc!: Store;

  @property({ attribute: false })
  accessor onHistoryCleared!: () => void;

  static override styles = css`
    .chat-history-clear {
      cursor: pointer;
      color: ${unsafeCSSVarV2('icon/primary')};
    }
    .chat-history-clear[aria-disabled='true'] {
      cursor: not-allowed;
      color: ${unsafeCSSVarV2('icon/secondary')};
    }
  `;

  private get _isHistoryClearDisabled() {
    return (
      this.chatContextValue.status === 'loading' ||
      this.chatContextValue.status === 'transmitting' ||
      !this.chatContextValue.messages.length ||
      !this.session
    );
  }

  private readonly _cleanupHistories = async () => {
    if (this._isHistoryClearDisabled || !this.session) {
      return;
    }
    const sessionId = this.session.id;
    try {
      const confirm = this.notification
        ? await this.notification.confirm({
            title: 'Clear History',
            message:
              'Are you sure you want to clear all history? This action will permanently delete all content, including all chat logs and data, and cannot be undone.',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
          })
        : true;

      if (confirm) {
        const actionIds = this.chatContextValue.messages
          .filter(item => 'sessionId' in item)
          .map(item => item.sessionId);
        await AIProvider.histories?.cleanup(
          this.doc.workspace.id,
          this.doc.id,
          [...(sessionId ? [sessionId] : []), ...(actionIds || [])]
        );
        this.notification?.toast('History cleared');
        this.onHistoryCleared?.();
      }
    } catch {
      this.notification?.toast('Failed to clear history');
    }
  };

  override render() {
    return html`
      <div
        class="chat-history-clear"
        aria-disabled=${this._isHistoryClearDisabled}
        @click=${this._cleanupHistories}
        data-testid="chat-panel-clear"
      >
        Clear
      </div>
    `;
  }
}
