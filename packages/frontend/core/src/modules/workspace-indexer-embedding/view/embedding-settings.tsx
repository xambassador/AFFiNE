import { Button, Switch } from '@affine/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@affine/component/setting-components';
import { Upload } from '@affine/core/components/pure/file-upload';
import { WorkspaceDialogService } from '@affine/core/modules/dialogs';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import { useLiveData, useService } from '@toeverything/infra';
import type React from 'react';
import { useCallback, useEffect } from 'react';

import { COUNT_PER_PAGE } from '../constants';
import { EmbeddingService } from '../services/embedding';
import { Attachments } from './attachments';
import EmbeddingProgress from './embedding-progress';
import { IgnoredDocs } from './ignored-docs';

interface EmbeddingSettingsProps {}

export const EmbeddingSettings: React.FC<EmbeddingSettingsProps> = () => {
  const t = useI18n();
  const embeddingService = useService(EmbeddingService);
  const embeddingEnabled = useLiveData(embeddingService.embedding.enabled$);
  const { totalCount } = useLiveData(embeddingService.embedding.attachments$);
  const attachments = useLiveData(
    embeddingService.embedding.mergedAttachments$
  );
  const ignoredDocs = useLiveData(embeddingService.embedding.ignoredDocs$);
  const embeddingProgress = useLiveData(
    embeddingService.embedding.embeddingProgress$
  );

  const isIgnoredDocsLoading = useLiveData(
    embeddingService.embedding.isIgnoredDocsLoading$
  );
  const workspaceDialogService = useService(WorkspaceDialogService);
  const isEnabledLoading = useLiveData(
    embeddingService.embedding.isEnabledLoading$
  );

  const handleEmbeddingToggle = useCallback(
    (checked: boolean) => {
      track.$.settingsPanel.indexerEmbedding.toggleWorkspaceEmbedding({
        type: 'Embedding',
        control: 'Workspace embedding',
        option: checked ? 'on' : 'off',
      });
      embeddingService.embedding.setEnabled(checked);
    },
    [embeddingService.embedding]
  );

  const handleAttachmentUpload = useCallback(
    (file: File) => {
      track.$.settingsPanel.indexerEmbedding.addAdditionalDocs({
        type: 'Embedding',
        control: 'Select doc',
        docType: file.type,
      });
      embeddingService.embedding.addAttachments([file]);
    },
    [embeddingService.embedding]
  );

  const handleAttachmentsDelete = useCallback(
    (fileId: string) => {
      embeddingService.embedding.removeAttachment(fileId);
    },
    [embeddingService.embedding]
  );

  const handleAttachmentsPageChange = useCallback(
    (offset: number) => {
      embeddingService.embedding.getAttachments({
        offset,
      });
    },
    [embeddingService.embedding]
  );

  const handleSelectDoc = useCallback(() => {
    if (isIgnoredDocsLoading) {
      return;
    }
    const initialIds = ignoredDocs.map(doc => doc.docId);
    workspaceDialogService.open(
      'doc-selector',
      {
        init: initialIds,
      },
      selectedIds => {
        if (selectedIds === undefined) {
          return;
        }
        track.$.settingsPanel.indexerEmbedding.addIgnoredDocs({
          type: 'Embedding',
          control: 'Additional docs',
          result: 'success',
        });
        const add = selectedIds.filter(id => !initialIds?.includes(id));
        const remove = initialIds?.filter(id => !selectedIds.includes(id));
        embeddingService.embedding.updateIgnoredDocs({ add, remove });
      }
    );
  }, [
    ignoredDocs,
    isIgnoredDocsLoading,
    workspaceDialogService,
    embeddingService.embedding,
  ]);

  useEffect(() => {
    embeddingService.embedding.startEmbeddingProgressPolling();
    embeddingService.embedding.getEnabled();
    embeddingService.embedding.getAttachments({
      first: COUNT_PER_PAGE,
      after: null,
    });
    embeddingService.embedding.getIgnoredDocs();
    embeddingService.embedding.getEmbeddingProgress();

    return () => {
      embeddingService.embedding.stopEmbeddingProgressPolling();
    };
  }, [embeddingService.embedding]);

  return (
    <>
      <SettingHeader
        title={t[
          'com.affine.settings.workspace.indexer-embedding.embedding.title'
        ]()}
        subtitle={t[
          'com.affine.settings.workspace.indexer-embedding.embedding.description'
        ]()}
      />
      <SettingWrapper title={''} testId="workspace-embedding-setting-wrapper">
        <SettingRow
          name={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.switch.title'
          ]()}
          desc={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.switch.description'
          ]()}
        >
          <Switch
            data-testid="workspace-embedding-setting-switch"
            checked={embeddingEnabled ?? false}
            onChange={handleEmbeddingToggle}
            disabled={isEnabledLoading}
          />
        </SettingRow>

        <SettingRow
          name={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.progress.title'
          ]()}
          style={{ marginBottom: '0px' }}
        />

        <EmbeddingProgress status={embeddingProgress} />

        <SettingRow
          name={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.additional-attachments.title'
          ]()}
          desc={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.additional-attachments.description'
          ]()}
        >
          <Upload fileChange={handleAttachmentUpload}>
            <Button
              data-testid="workspace-embedding-setting-upload-button"
              variant="primary"
            >
              {t['Upload']()}
            </Button>
          </Upload>
        </SettingRow>

        {attachments.length > 0 && (
          <Attachments
            attachments={attachments}
            onDelete={handleAttachmentsDelete}
            totalCount={totalCount}
            onPageChange={handleAttachmentsPageChange}
          />
        )}

        <SettingRow
          name={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.ignore-docs.title'
          ]()}
          desc={t[
            'com.affine.settings.workspace.indexer-embedding.embedding.ignore-docs.description'
          ]()}
        >
          <Button
            data-testid="workspace-embedding-setting-ignore-docs-button"
            variant="primary"
            onClick={handleSelectDoc}
          >
            {t[
              'com.affine.settings.workspace.indexer-embedding.embedding.select-doc'
            ]()}
          </Button>
        </SettingRow>

        {ignoredDocs.length > 0 && (
          <IgnoredDocs
            ignoredDocs={ignoredDocs}
            isLoading={isIgnoredDocsLoading}
          />
        )}
      </SettingWrapper>
    </>
  );
};
