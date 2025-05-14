import {
  indexerSearchQuery,
  SearchQueryOccur,
  SearchQueryType,
  SearchTable,
} from '@affine/graphql';

import { IndexerService } from '../../../plugins/indexer/service';
import { Mockers } from '../../mocks';
import { app, e2e } from '../test';

e2e('should search with query', async t => {
  const owner = await app.signup();

  const workspace = await app.create(Mockers.Workspace, {
    owner: { id: owner.id },
  });

  const indexerService = app.get(IndexerService);

  await indexerService.write(
    SearchTable.block,
    [
      {
        docId: 'doc-0',
        workspaceId: workspace.id,
        content: 'test1',
        flavour: 'markdown',
        blockId: 'block-0',
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
        createdAt: new Date('2025-04-22T00:00:00.000Z'),
        updatedAt: new Date('2025-04-22T00:00:00.000Z'),
      },
      {
        docId: 'doc-1',
        workspaceId: workspace.id,
        content: 'test2',
        flavour: 'markdown',
        blockId: 'block-1',
        refDocId: ['doc-0'],
        ref: ['{"foo": "bar1"}'],
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
        createdAt: new Date('2021-04-22T00:00:00.000Z'),
        updatedAt: new Date('2021-04-22T00:00:00.000Z'),
      },
      {
        docId: 'doc-2',
        workspaceId: workspace.id,
        content: 'test3',
        flavour: 'markdown',
        blockId: 'block-2',
        refDocId: ['doc-0', 'doc-2'],
        ref: ['{"foo": "bar1"}', '{"foo": "bar3"}'],
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
        createdAt: new Date('2025-03-22T00:00:00.000Z'),
        updatedAt: new Date('2025-03-22T00:00:00.000Z'),
      },
    ],
    {
      refresh: true,
    }
  );

  const result = await app.gql({
    query: indexerSearchQuery,
    variables: {
      id: workspace.id,
      input: {
        table: SearchTable.block,
        query: {
          type: SearchQueryType.boolean,
          occur: SearchQueryOccur.must,
          queries: [
            {
              type: SearchQueryType.boolean,
              occur: SearchQueryOccur.should,
              queries: ['doc-0', 'doc-1', 'doc-2'].map(id => ({
                type: SearchQueryType.match,
                field: 'docId',
                match: id,
              })),
            },
            {
              type: SearchQueryType.exists,
              field: 'refDocId',
            },
          ],
        },
        options: {
          fields: ['refDocId', 'ref'],
          pagination: {
            limit: 100,
          },
        },
      },
    },
  });

  t.truthy(result.workspace.search, 'failed to search');
  t.is(result.workspace.search.pagination.count, 2);
  t.is(result.workspace.search.pagination.hasMore, true);
  t.truthy(result.workspace.search.pagination.nextCursor);
  t.is(result.workspace.search.nodes.length, 2);
  t.snapshot(result.workspace.search.nodes);
});
