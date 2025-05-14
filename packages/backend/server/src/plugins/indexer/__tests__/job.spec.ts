import { randomUUID } from 'node:crypto';
import { mock } from 'node:test';

import test from 'ava';
import Sinon from 'sinon';

import { createModule } from '../../../__tests__/create-module';
import { Mockers } from '../../../__tests__/mocks';
import { ServerConfigModule } from '../../../core/config';
import { IndexerModule, IndexerService } from '..';
import { SearchProviderFactory } from '../factory';
import { IndexerJob } from '../job';
import { ManticoresearchProvider } from '../providers';

const module = await createModule({
  imports: [IndexerModule, ServerConfigModule],
  providers: [IndexerService],
});
const indexerService = module.get(IndexerService);
const indexerJob = module.get(IndexerJob);
const searchProviderFactory = module.get(SearchProviderFactory);
const manticoresearch = module.get(ManticoresearchProvider);

const user = await module.create(Mockers.User);
const workspace = await module.create(Mockers.Workspace, {
  snapshot: true,
  owner: user,
});

test.after.always(async () => {
  await module.close();
});

test.afterEach.always(() => {
  Sinon.restore();
  mock.reset();
});

test.beforeEach(() => {
  mock.method(searchProviderFactory, 'get', () => {
    return manticoresearch;
  });
});

test('should handle indexer.indexDoc job', async t => {
  const spy = Sinon.spy(indexerService, 'indexDoc');
  await indexerJob.indexDoc({
    workspaceId: workspace.id,
    docId: randomUUID(),
  });
  t.is(spy.callCount, 1);
});

test('should handle indexer.deleteDoc job', async t => {
  const spy = Sinon.spy(indexerService, 'deleteDoc');
  await indexerJob.deleteDoc({
    workspaceId: workspace.id,
    docId: randomUUID(),
  });
  t.is(spy.callCount, 1);
});

test('should handle indexer.indexWorkspace job', async t => {
  const count = module.queue.count('indexer.deleteDoc');
  const spy = Sinon.spy(indexerService, 'listDocIds');
  await indexerJob.indexWorkspace({
    workspaceId: workspace.id,
  });
  t.is(spy.callCount, 1);
  const { payload } = await module.queue.waitFor('indexer.indexDoc');
  t.is(payload.workspaceId, workspace.id);
  t.is(payload.docId, '5nS9BSp3Px');
  // no delete job
  t.is(module.queue.count('indexer.deleteDoc'), count);
});

test('should not sync existing doc', async t => {
  const count = module.queue.count('indexer.indexDoc');
  mock.method(indexerService, 'listDocIds', async () => {
    return ['5nS9BSp3Px'];
  });
  await indexerJob.indexWorkspace({
    workspaceId: workspace.id,
  });
  t.is(module.queue.count('indexer.indexDoc'), count);
});

test('should delete doc from indexer when docId is not in workspace', async t => {
  const count = module.queue.count('indexer.deleteDoc');
  mock.method(indexerService, 'listDocIds', async () => {
    return ['mock-doc-id1', 'mock-doc-id2'];
  });
  await indexerJob.indexWorkspace({
    workspaceId: workspace.id,
  });
  const { payload } = await module.queue.waitFor('indexer.indexDoc');
  t.is(payload.workspaceId, workspace.id);
  t.is(payload.docId, '5nS9BSp3Px');
  t.is(module.queue.count('indexer.deleteDoc'), count + 2);
});

test('should handle indexer.deleteWorkspace job', async t => {
  const spy = Sinon.spy(indexerService, 'deleteWorkspace');
  await indexerJob.deleteWorkspace({
    workspaceId: workspace.id,
  });
  t.is(spy.callCount, 1);
});
