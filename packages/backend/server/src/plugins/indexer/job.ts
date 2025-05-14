import { Injectable, Logger } from '@nestjs/common';

import { JobQueue, OnJob } from '../../base';
import { readAllDocIdsFromWorkspaceSnapshot } from '../../core/utils/blocksuite';
import { Models } from '../../models';
import { IndexerService } from './service';

declare global {
  interface Jobs {
    'indexer.indexDoc': {
      workspaceId: string;
      docId: string;
    };
    'indexer.deleteDoc': {
      workspaceId: string;
      docId: string;
    };
    'indexer.indexWorkspace': {
      workspaceId: string;
    };
    'indexer.deleteWorkspace': {
      workspaceId: string;
    };
  }
}

@Injectable()
export class IndexerJob {
  private readonly logger = new Logger(IndexerJob.name);

  constructor(
    private readonly models: Models,
    private readonly service: IndexerService,
    private readonly queue: JobQueue
  ) {}

  @OnJob('indexer.indexDoc')
  async indexDoc({ workspaceId, docId }: Jobs['indexer.indexDoc']) {
    // delete the 'indexer.deleteDoc' job from the queue
    await this.queue.remove(`${workspaceId}/${docId}`, 'indexer.deleteDoc');
    await this.service.indexDoc(workspaceId, docId);
  }

  @OnJob('indexer.deleteDoc')
  async deleteDoc({ workspaceId, docId }: Jobs['indexer.deleteDoc']) {
    // delete the 'indexer.updateDoc' job from the queue
    await this.queue.remove(`${workspaceId}/${docId}`, 'indexer.indexDoc');
    await this.service.deleteDoc(workspaceId, docId);
  }

  @OnJob('indexer.indexWorkspace')
  async indexWorkspace({ workspaceId }: Jobs['indexer.indexWorkspace']) {
    await this.queue.remove(workspaceId, 'indexer.deleteWorkspace');
    const snapshot = await this.models.doc.getSnapshot(
      workspaceId,
      workspaceId
    );
    if (!snapshot) {
      this.logger.warn(`workspace ${workspaceId} not found`);
      return;
    }
    const docIdsInWorkspace = readAllDocIdsFromWorkspaceSnapshot(snapshot.blob);
    const docIdsInIndexer = await this.service.listDocIds(workspaceId);
    const docIdsInWorkspaceSet = new Set(docIdsInWorkspace);
    const docIdsInIndexerSet = new Set(docIdsInIndexer);
    // diff the docIdsInWorkspace and docIdsInIndexer
    const missingDocIds = docIdsInWorkspace.filter(
      docId => !docIdsInIndexerSet.has(docId)
    );
    const deletedDocIds = docIdsInIndexer.filter(
      docId => !docIdsInWorkspaceSet.has(docId)
    );
    for (const docId of deletedDocIds) {
      await this.queue.add(
        'indexer.deleteDoc',
        {
          workspaceId,
          docId,
        },
        {
          jobId: `${workspaceId}/${docId}`,
          // the delete job should be higher priority than the update job
          priority: 0,
        }
      );
    }
    for (const docId of missingDocIds) {
      await this.queue.add(
        'indexer.indexDoc',
        {
          workspaceId,
          docId,
        },
        {
          jobId: `${workspaceId}/${docId}`,
          priority: 100,
        }
      );
    }
    this.logger.debug(
      `indexed workspace ${workspaceId} with ${missingDocIds.length} missing docs and ${deletedDocIds.length} deleted docs`
    );
  }

  @OnJob('indexer.deleteWorkspace')
  async deleteWorkspace({ workspaceId }: Jobs['indexer.deleteWorkspace']) {
    await this.queue.remove(workspaceId, 'indexer.indexWorkspace');
    await this.service.deleteWorkspace(workspaceId);
  }
}
