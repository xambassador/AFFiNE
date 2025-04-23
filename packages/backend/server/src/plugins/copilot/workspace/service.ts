import { createHash } from 'node:crypto';

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { FileUpload, JobQueue } from '../../../base';
import { Models } from '../../../models';
import { CopilotStorage } from '../storage';
import { readStream } from '../utils';

declare global {
  interface Events {
    'workspace.file.embedding.finished': {
      jobId: string;
    };
    'workspace.file.embedding.failed': {
      jobId: string;
    };
  }
  interface Jobs {
    'copilot.workspace.embedding.files': {
      userId: string;
      workspaceId: string;
      blobId: string;
      fileId: string;
      fileName: string;
    };
  }
}

@Injectable()
export class CopilotWorkspaceService implements OnApplicationBootstrap {
  private supportEmbedding = false;

  constructor(
    private readonly models: Models,
    private readonly queue: JobQueue,
    private readonly storage: CopilotStorage
  ) {}

  async onApplicationBootstrap() {
    const supportEmbedding =
      await this.models.copilotContext.checkEmbeddingAvailable();
    if (supportEmbedding) {
      this.supportEmbedding = true;
    }
  }

  get canEmbedding() {
    return this.supportEmbedding;
  }

  async addWorkspaceFile(
    userId: string,
    workspaceId: string,
    content: FileUpload
  ) {
    const fileName = content.filename;
    const buffer = await readStream(content.createReadStream());
    const blobId = createHash('sha256').update(buffer).digest('base64url');
    await this.storage.put(userId, workspaceId, blobId, buffer);
    const file = await this.models.copilotWorkspace.addFile(workspaceId, {
      fileName,
      mimeType: content.mimetype,
      size: buffer.length,
    });
    return { blobId, file };
  }

  async getWorkspaceFile(workspaceId: string, fileId: string) {
    return await this.models.copilotWorkspace.getFile(workspaceId, fileId);
  }

  async addWorkspaceFileEmbeddingQueue(
    file: Jobs['copilot.workspace.embedding.files']
  ) {
    if (!this.supportEmbedding) return;

    const { userId, workspaceId, blobId, fileId, fileName } = file;
    await this.queue.add('copilot.workspace.embedding.files', {
      userId,
      workspaceId,
      blobId,
      fileId,
      fileName,
    });
  }
}
