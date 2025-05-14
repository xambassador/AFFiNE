import './config';

import { Module } from '@nestjs/common';

import { ServerConfigModule } from '../../core/config';
import { PermissionModule } from '../../core/permission';
import { SearchProviderFactory } from './factory';
import { IndexerJob } from './job';
import { SearchProviders } from './providers';
import { IndexerResolver } from './resolver';
import { IndexerService } from './service';

@Module({
  imports: [ServerConfigModule, PermissionModule],
  providers: [
    IndexerResolver,
    IndexerService,
    IndexerJob,
    SearchProviderFactory,
    ...SearchProviders,
  ],
  exports: [IndexerService, SearchProviderFactory],
})
export class IndexerModule {}

export { IndexerService };

declare global {
  interface Events {
    'doc.indexer.updated': {
      workspaceId: string;
      docId: string;
    };
    'doc.indexer.deleted': {
      workspaceId: string;
      docId: string;
    };
  }
}
