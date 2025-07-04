import { CodeBlockHighlighter } from '@blocksuite/affine/blocks/code';
import { toast } from '@blocksuite/affine/components/toast';
import { SignalWatcher, WithDisposable } from '@blocksuite/affine/global/lit';
import type { ImageProxyService } from '@blocksuite/affine/shared/adapters';
import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/affine/shared/theme';
import { type BlockStdScope, ShadowlessElement } from '@blocksuite/affine/std';
import { CopyIcon, PageIcon, ToolIcon } from '@blocksuite/icons/lit';
import type { Signal } from '@preact/signals-core';
import { effect, signal } from '@preact/signals-core';
import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { bundledLanguagesInfo, type ThemedToken } from 'shiki';

import { renderPreviewPanel } from './artifacts-preview-panel';
import type { ToolError } from './type';

interface CodeArtifactToolCall {
  type: 'tool-call';
  toolCallId: string;
  toolName: string; // 'code_artifact'
  args: { title: string };
}

interface CodeArtifactToolResult {
  type: 'tool-result';
  toolCallId: string;
  toolName: string; // 'code_artifact'
  args: { title: string };
  result:
    | {
        title: string;
        html: string;
        size: number;
      }
    | ToolError
    | null;
}

export class CodeHighlighter extends SignalWatcher(WithDisposable(LitElement)) {
  static override styles = css`
    .code-highlighter {
    }

    /* Container */
    .code-highlighter pre {
      margin: 0;
      display: flex;
      overflow: auto;
      font-family: ${unsafeCSSVar('fontMonoFamily')};
    }

    /* Line numbers */
    .code-highlighter .line-numbers {
      user-select: none;
      text-align: right;
      line-height: 20px;
      color: ${unsafeCSSVarV2('text/secondary')};
      white-space: nowrap;
      min-width: 3rem;
      padding: 0 0 12px 12px;
      font-size: 12px;
    }

    .code-highlighter .line-number {
      display: block;
      white-space: nowrap;
    }

    /* Code area */
    .code-highlighter .code-container {
      flex: 1;
      white-space: pre;
      line-height: 20px;
      font-size: 12px;
      padding: 0 12px 12px 12px;
    }

    .code-highlighter .code-line {
      display: flex;
      min-height: 20px;
    }
  `;

  @property({ attribute: false })
  accessor std!: BlockStdScope;

  @property({ attribute: false })
  accessor code: string = '';

  @property({ attribute: false })
  accessor language: string = 'html';

  @property({ attribute: false })
  accessor showLineNumbers: boolean = false;

  // signal holding tokens generated by shiki
  highlightTokens: Signal<ThemedToken[][]> = signal([]);

  get highlighter() {
    return this.std.get(CodeBlockHighlighter);
  }

  override connectedCallback() {
    super.connectedCallback();

    // recompute highlight when code / language changes
    this.disposables.add(
      effect(() => {
        return this._updateHighlightTokens();
      })
    );
  }

  private _updateHighlightTokens() {
    let cancelled = false;
    const language = this.language;
    const highlighter = this.highlighter.highlighter$.value;
    if (!highlighter) return;

    const updateTokens = () => {
      if (cancelled) return;
      this.highlightTokens.value = highlighter.codeToTokensBase(this.code, {
        lang: language,
        theme: this.highlighter.themeKey,
      });
    };

    const loadedLanguages = highlighter.getLoadedLanguages();
    if (!loadedLanguages.includes(language)) {
      const matchedInfo = bundledLanguagesInfo.find(
        info =>
          info.id === language ||
          info.name === language ||
          info.aliases?.includes(language)
      );

      if (matchedInfo) {
        highlighter
          .loadLanguage(matchedInfo.import)
          .then(updateTokens)
          .catch(console.error);
      } else {
        console.warn(`Language not supported: ${language}`);
      }
    } else {
      updateTokens();
    }

    return () => {
      cancelled = true;
    };
  }

  private _tokenStyle(token: ThemedToken): string {
    let result = '';
    if (token.color) {
      result += `color: ${token.color};`;
    }
    if (token.fontStyle) {
      result += `font-style: ${token.fontStyle};`;
    }
    if (token.bgColor) {
      result += `background-color: ${token.bgColor};`;
    }
    return result;
  }

  override render() {
    const tokens = this.highlightTokens.value;
    const lineCount =
      tokens.length > 0 ? tokens.length : this.code.split('\n').length;

    const lineNumbersTemplate = this.showLineNumbers
      ? html`<div class="line-numbers">
          ${Array.from(
            { length: lineCount },
            (_, i) => html`<span class="line-number">${i + 1}</span>`
          )}
        </div>`
      : nothing;

    const renderedCode =
      tokens.length === 0
        ? this.code
        : html`${tokens.map(lineTokens => {
            const line = lineTokens.map(token => {
              const style = this._tokenStyle(token);
              return html`<span style="${style}">${token.content}</span>`;
            });
            return html`<div class="code-line">${line}</div>`;
          })}`;

    return html`<div class="code-highlighter">
      <pre>
        ${lineNumbersTemplate}
        <div class="code-container">${renderedCode}</div>
      </pre>
    </div>`;
  }
}

/**
 * Component to render code artifact tool call/result inside chat.
 */
export class CodeArtifactTool extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .code-artifact-result {
      cursor: pointer;
      margin: 8px 0;
    }

    .code-artifact-result:hover {
      background-color: var(--affine-hover-color);
    }

    .code-artifact-preview {
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .code-artifact-preview > html-preview {
      height: 100%;
    }

    .code-artifact-preview :is(.html-preview-iframe, .html-preview-container) {
      height: 100%;
    }

    .code-artifact-control-btn {
      background: transparent;
      border-radius: 8px;
      border: 1px solid ${unsafeCSSVarV2('button/innerBlackBorder')};
      cursor: pointer;
      font-size: 15px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 32px;
      font-weight: 500;
    }

    .code-artifact-control-btn:hover {
      background: ${unsafeCSSVarV2('switch/buttonBackground/hover')};
    }

    /* Toggle styles (migrated from PreviewButton) */
    .code-artifact-toggle-container {
      display: flex;
      padding: 2px;
      align-items: flex-start;
      gap: 4px;
      border-radius: 4px;
      background: ${unsafeCSSVarV2('segment/background')};
    }

    .code-artifact-toggle-container .toggle-button {
      display: flex;
      padding: 0px 4px;
      justify-content: center;
      align-items: center;
      gap: 4px;
      border-radius: 4px;
      color: ${unsafeCSSVarV2('text/primary')};
      font-family: Inter;
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
      cursor: pointer;
    }

    .code-artifact-toggle-container .toggle-button:hover {
      background: ${unsafeCSSVarV2('layer/background/hoverOverlay')};
    }

    .code-artifact-toggle-container .toggle-button.active {
      background: ${unsafeCSSVarV2('segment/button')};
      box-shadow:
        var(--Shadow-buttonShadow-1-x, 0px) var(--Shadow-buttonShadow-1-y, 0px)
          var(--Shadow-buttonShadow-1-blur, 1px) 0px
          var(--Shadow-buttonShadow-1-color, rgba(0, 0, 0, 0.12)),
        var(--Shadow-buttonShadow-2-x, 0px) var(--Shadow-buttonShadow-2-y, 1px)
          var(--Shadow-buttonShadow-2-blur, 5px) 0px
          var(--Shadow-buttonShadow-2-color, rgba(0, 0, 0, 0.12));
    }
  `;

  @property({ attribute: false })
  accessor data!: CodeArtifactToolCall | CodeArtifactToolResult;

  @property({ attribute: false })
  accessor width: Signal<number | undefined> | undefined;

  @property({ attribute: false })
  accessor imageProxyService: ImageProxyService | null | undefined;

  @property({ attribute: false })
  accessor std: BlockStdScope | undefined;

  @state()
  private accessor mode: 'preview' | 'code' = 'code';

  private renderToolCall() {
    const { args } = this.data as CodeArtifactToolCall;
    const name = `Generating HTML artifact "${args.title}"`;
    return html`<tool-call-card
      .name=${name}
      .icon=${ToolIcon()}
    ></tool-call-card>`;
  }

  private renderToolResult() {
    if (!this.std) return nothing;
    if (this.data.type !== 'tool-result') return nothing;
    const resultData = this.data as CodeArtifactToolResult;
    const result = resultData.result;

    if (result && typeof result === 'object' && 'title' in result) {
      const { title, html: htmlContent } = result as {
        title: string;
        html: string;
      };

      const onClick = () => {
        const copyHTML = async () => {
          if (this.std) {
            await navigator.clipboard
              .writeText(htmlContent)
              .catch(console.error);
            toast(this.std.host, 'Copied HTML to clipboard');
          }
        };

        const downloadHTML = () => {
          try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title || 'artifact'}.html`;
            document.body.append(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error(e);
          }
        };

        const setCodeMode = () => {
          if (this.mode !== 'code') {
            this.mode = 'code';
            renderPreview();
          }
        };

        const setPreviewMode = () => {
          if (this.mode !== 'preview') {
            this.mode = 'preview';
            renderPreview();
          }
        };

        const renderPreview = () => {
          const controls = html`
            <div class="code-artifact-toggle-container">
              <div
                class=${classMap({
                  'toggle-button': true,
                  active: this.mode === 'code',
                })}
                @click=${setCodeMode}
              >
                Code
              </div>
              <div
                class=${classMap({
                  'toggle-button': true,
                  active: this.mode === 'preview',
                })}
                @click=${setPreviewMode}
              >
                Preview
              </div>
            </div>
            <div style="flex: 1"></div>
            <button class="code-artifact-control-btn" @click=${downloadHTML}>
              ${PageIcon({
                width: '20',
                height: '20',
                style: `color: ${unsafeCSSVarV2('icon/primary')}`,
              })}
              Download
            </button>
            <icon-button @click=${copyHTML} title="Copy HTML">
              ${CopyIcon({ width: '20', height: '20' })}
            </icon-button>
          `;
          renderPreviewPanel(
            this,
            html`<div class="code-artifact-preview">
              ${this.mode === 'preview'
                ? html`<html-preview .html=${htmlContent}></html-preview>`
                : html`<code-highlighter
                    .std=${this.std}
                    .code=${htmlContent}
                    .language=${'html'}
                    .showLineNumbers=${true}
                  ></code-highlighter>`}
            </div>`,
            controls
          );
        };

        renderPreview();
      };

      return html`
        <div
          class="affine-embed-linked-doc-block code-artifact-result horizontal"
          @click=${onClick}
        >
          <div class="affine-embed-linked-doc-content">
            <div class="affine-embed-linked-doc-content-title">
              <div class="affine-embed-linked-doc-content-title-icon">
                ${PageIcon({ width: '20', height: '20' })}
              </div>
              <div class="affine-embed-linked-doc-content-title-text">
                ${title}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html`<tool-call-failed
      .name=${'Code artifact failed'}
      .icon=${ToolIcon()}
    ></tool-call-failed>`;
  }

  protected override render() {
    if (this.data.type === 'tool-call') {
      return this.renderToolCall();
    }
    if (this.data.type === 'tool-result') {
      return this.renderToolResult();
    }
    return nothing;
  }
}
