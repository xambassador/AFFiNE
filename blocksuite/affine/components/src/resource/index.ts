import type { BlobEngine, BlobState } from '@blocksuite/sync';
import { effect, type ReadonlySignal, signal } from '@preact/signals-core';
import type { TemplateResult } from 'lit-html';

export type ResourceKind = 'Blob' | 'File' | 'Image';

export type StateKind =
  | 'loading'
  | 'uploading'
  | 'error'
  | 'error:oversize'
  | 'none';

export type StateInfo = {
  icon: TemplateResult;
  title?: string;
  description?: string;
};

export type ResolvedStateInfo = StateInfo & {
  loading: boolean;
  error: boolean;
  state: StateKind;
};

export class ResourceController {
  readonly state$ = signal<Partial<BlobState>>({});

  private engine?: BlobEngine;

  constructor(
    readonly blobId$: ReadonlySignal<string | undefined>,
    readonly kind: ResourceKind = 'File'
  ) {}

  setEngine(engine: BlobEngine) {
    this.engine = engine;
    return this;
  }

  determineState(
    hasExceeded: boolean,
    hasError: boolean,
    uploading: boolean,
    downloading: boolean
  ): StateKind {
    if (hasExceeded) return 'error:oversize';
    if (hasError) return 'error';
    if (uploading) return 'uploading';
    if (downloading) return 'loading';
    return 'none';
  }

  resolveStateWith(
    info: {
      loadingIcon: TemplateResult;
      errorIcon?: TemplateResult;
    } & StateInfo
  ): ResolvedStateInfo {
    const {
      uploading = false,
      downloading = false,
      overSize = false,
      errorMessage,
    } = this.state$.value;
    const hasExceeded = overSize;
    const hasError = hasExceeded || Boolean(errorMessage);
    const state = this.determineState(
      hasExceeded,
      hasError,
      uploading,
      downloading
    );
    const loading = state === 'uploading' || state === 'loading';

    const { icon, title, description, loadingIcon, errorIcon } = info;

    const result = {
      error: hasError,
      loading,
      state,
      icon,
      title,
      description,
    };

    if (loading) {
      result.icon = loadingIcon ?? icon;
      result.title = state === 'uploading' ? 'Uploading...' : 'Loading...';
    } else if (hasError) {
      result.icon = errorIcon ?? icon;
      result.description = errorMessage ?? description;
    }

    return result;
  }

  updateState(state: Partial<BlobState>) {
    this.state$.value = { ...this.state$.value, ...state };
  }

  subscribe() {
    return effect(() => {
      const blobId = this.blobId$.value;
      if (!blobId) return;

      const blobState$ = this.engine?.blobState$(blobId);
      if (!blobState$) return;

      const subscription = blobState$.subscribe(state => {
        let { uploading, downloading } = state;
        if (state.overSize || state.errorMessage) {
          uploading = false;
          downloading = false;
        }

        this.updateState({ ...state, uploading, downloading });
      });

      return () => subscription.unsubscribe();
    });
  }

  async blob() {
    const blobId = this.blobId$.peek();
    if (!blobId) return null;

    let blob: Blob | null = null;
    let errorMessage: string | null = null;

    try {
      blob = (await this.engine?.get(blobId)) ?? null;

      if (!blob) errorMessage = `${this.kind} not found`;
    } catch (err) {
      console.error(err);
      errorMessage = `Failed to retrieve ${this.kind}`;
    }

    if (errorMessage) this.updateState({ errorMessage });

    return blob;
  }

  async createBlobUrlWith(type?: string) {
    let blob = await this.blob();
    if (!blob) return null;

    if (type) blob = new Blob([blob], { type });

    return URL.createObjectURL(blob);
  }
}
