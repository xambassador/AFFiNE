import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import _test from 'ava';
import { omit, pick } from 'lodash-es';

import {
  createModule,
  TestingModule,
} from '../../../../__tests__/create-module';
import { Mockers } from '../../../../__tests__/mocks';
import { ConfigModule } from '../../../../base/config';
import { User, Workspace } from '../../../../models';
import { IndexerModule } from '../../';
import { SearchProviderType } from '../../config';
import { AggregateQueryDSL, ElasticsearchProvider } from '../../providers';
import { blockMapping, docMapping, SearchTable } from '../../tables';

const test =
  process.env.AFFINE_INDEXER_SEARCH_PROVIDER === 'elasticsearch'
    ? _test
    : _test.skip;

let module: TestingModule;
let searchProvider: ElasticsearchProvider;
let user: User;
let workspace: Workspace;

_test.before(async () => {
  module = await createModule({
    imports: [
      IndexerModule,
      ConfigModule.override({
        indexer: {
          enabled: true,
          provider: {
            type: SearchProviderType.Elasticsearch,
            endpoint: 'http://localhost:9200',
            username: 'elastic',
            password: 'affine',
          },
        },
      }),
    ],
    providers: [ElasticsearchProvider],
  });
  searchProvider = module.get(ElasticsearchProvider);
  user = await module.create(Mockers.User);
  workspace = await module.create(Mockers.Workspace);

  await searchProvider.createTable(
    SearchTable.block,
    JSON.stringify(blockMapping)
  );
  await searchProvider.createTable(SearchTable.doc, JSON.stringify(docMapping));

  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: randomUUID(),
        doc_id: randomUUID(),
        block_id: randomUUID(),
        content: `hello world on search title, ${randomUUID()}`,
        flavour: 'affine:page',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: randomUUID(),
        doc_id: randomUUID(),
        block_id: randomUUID(),
        content: `hello world on search block content, ${randomUUID()}`,
        flavour: 'other:flavour',
        blob: randomUUID(),
        ref_doc_id: randomUUID(),
        ref: ['{"foo": "bar"}', '{"foo": "baz"}'],
        parent_flavour: 'parent:flavour',
        parent_block_id: randomUUID(),
        additional: '{"foo": "bar"}',
        markdown_preview: 'markdownPreview',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: 'workspaceId101',
        doc_id: 'docId101',
        block_id: 'blockId101',
        content: 'hello world on search block content at 101',
        flavour: 'other:flavour',
        blob: 'blob101',
        ref_doc_id: 'docId101',
        ref: ['{"foo": "bar"}', '{"foo": "baz"}'],
        parent_flavour: 'parent:flavour',
        parent_block_id: 'blockId101',
        additional: '{"foo": "bar"}',
        markdown_preview: 'markdownPreview',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date('2025-04-19T08:19:36.160Z'),
        updated_at: new Date('2025-04-19T08:19:36.160Z'),
      },
      {
        workspace_id: 'workspaceId1',
        doc_id: 'docId2',
        block_id: 'blockId8',
        content:
          'title8 hello hello hello hello hello hello hello hello hello hello, hello hello hello hello hello hello hello hello some link https://linear.app/affine-design/issue/AF-1379/slash-commands-%E6%BF%80%E6%B4%BB%E6%8F%92%E5%85%A5-link-%E7%9A%84%E5%BC%B9%E7%AA%97%E9%87%8C%EF%BC%8C%E8%BE%93%E5%85%A5%E9%93%BE%E6%8E%A5%E4%B9%8B%E5%90%8E%E4%B8%8D%E5%BA%94%E8%AF%A5%E7%9B%B4%E6%8E%A5%E5%AF%B9%E9%93%BE%E6%8E%A5%E8%BF%9B%E8%A1%8C%E5%88%86%E8%AF%8D%E6%90%9C%E7%B4%A2',
        flavour: 'flavour8',
        ref_doc_id: 'docId1',
        ref: [
          '{"docId":"docId1","mode":"page"}',
          '{"docId":"docId2","mode":"page"}',
        ],
        parent_flavour: 'parentFlavour8',
        parent_block_id: 'parentBlockId8',
        additional: 'additional8',
        markdown_preview: 'markdownPreview8',
        created_by_user_id: 'userId8',
        updated_by_user_id: 'userId8',
        created_at: new Date('2025-03-08T06:04:13.278Z'),
        updated_at: new Date('2025-03-08T06:04:13.278Z'),
      },
      {
        workspace_id: 'workspaceId1',
        doc_id: 'docId2-affine',
        block_id: 'blockId8',
        content: 'AFFiNE 是一个基于云端的笔记应用',
        flavour: 'flavour8',
        ref_doc_id: 'docId1',
        ref: [
          '{"docId":"docId1","mode":"page"}',
          '{"docId":"docId2","mode":"page"}',
        ],
        parent_flavour: 'parentFlavour8',
        parent_block_id: 'parentBlockId8',
        additional: 'additional8',
        markdown_preview: 'markdownPreview8',
        created_by_user_id: 'userId8',
        updated_by_user_id: 'userId8',
        created_at: new Date('2025-03-08T06:04:13.278Z'),
        updated_at: new Date('2025-03-08T06:04:13.278Z'),
      },
    ],
    {
      refresh: true,
    }
  );
  const blocks = await readFile(
    path.join(import.meta.dirname, '../__fixtures__/test-blocks.json'),
    'utf-8'
  );
  const blockDocuments = blocks
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));
  await searchProvider.write(SearchTable.block, blockDocuments, {
    refresh: true,
  });

  const docs = await readFile(
    path.join(import.meta.dirname, '../__fixtures__/test-docs.json'),
    'utf-8'
  );
  const docDocuments = docs
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));
  await searchProvider.write(SearchTable.doc, docDocuments, {
    refresh: true,
  });
});

_test.after.always(async () => {
  await searchProvider.deleteByQuery(
    SearchTable.block,
    {
      term: {
        workspace_id: workspace.id,
      },
    },
    {
      refresh: true,
    }
  );
  await searchProvider.deleteByQuery(
    SearchTable.doc,
    {
      term: {
        workspace_id: workspace.id,
      },
    },
    {
      refresh: true,
    }
  );

  await module.close();
});

test('should provider is elasticsearch', t => {
  t.is(searchProvider.type, SearchProviderType.Elasticsearch);
});

// #region write

test('should write document work', async t => {
  const docId = randomUUID();
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: 'hello world',
        flavour: 'affine:page',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'block_id', 'content', 'ref_doc_id'],
    sort: ['_score'],
  });
  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello world'],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
  });

  // set ref_doc_id to a string
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: 'hello world',
        flavour: 'affine:page',
        ref_doc_id: 'docId2',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'block_id', 'content', 'ref_doc_id'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello world'],
    ref_doc_id: ['docId2'],
  });

  // not set ref_doc_id and replace the old value to null
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: 'hello world',
        flavour: 'affine:page',
        // ref_doc_id: 'docId2',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'block_id', 'content', 'ref_doc_id'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello world'],
  });
});

test('should handle ref_doc_id as string[]', async t => {
  const docId = randomUUID();
  // set ref_doc_id to a string
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: 'hello world',
        flavour: 'affine:page',
        ref_doc_id: 'docId2',
        ref: '{"foo": "bar"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'ref_doc_id', 'ref'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'ref_doc_id', 'ref'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello world'],
    ref_doc_id: ['docId2'],
    ref: ['{"foo": "bar"}'],
  });

  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    ref_doc_id: 'docId2',
    ref: '{"foo": "bar"}',
  });

  // set ref_doc_id to a string[]
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: 'hello world',
        flavour: 'affine:page',
        ref_doc_id: ['docId2', 'docId3'],
        ref: ['{"foo": "bar"}', '{"foo": "baz"}'],
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'ref_doc_id', 'ref'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'ref_doc_id', 'ref'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello world'],
    ref_doc_id: ['docId2', 'docId3'],
    ref: ['{"foo": "bar"}', '{"foo": "baz"}'],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    ref_doc_id: ['docId2', 'docId3'],
    ref: ['{"foo": "bar"}', '{"foo": "baz"}'],
  });
});

test('should handle content as string[]', async t => {
  const docId = randomUUID();
  // set content to a string
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: 'hello world',
        flavour: 'affine:page',
        ref_doc_id: 'docId2',
        ref: '{"foo": "bar"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'ref_doc_id', 'ref'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'ref_doc_id', 'ref'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello world'],
    ref_doc_id: ['docId2'],
    ref: ['{"foo": "bar"}'],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    ref_doc_id: 'docId2',
    ref: '{"foo": "bar"}',
  });

  // set content to a string[]
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        content: ['hello', 'world 2'],
        flavour: 'affine:page',
        ref_doc_id: 'docId2',
        ref: '{"foo": "bar"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'ref_doc_id', 'ref'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'ref_doc_id', 'ref'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    content: ['hello', 'world 2'],
    ref_doc_id: ['docId2'],
    ref: ['{"foo": "bar"}'],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    ref_doc_id: 'docId2',
    ref: '{"foo": "bar"}',
  });
});

test('should handle blob as string[]', async t => {
  const docId = randomUUID();
  const blockId = randomUUID();
  // set blob to a string
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: blockId,
        content: '',
        flavour: 'affine:page',
        blob: 'blob1',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'blob'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'blob'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    blob: ['blob1'],
    content: [''],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    blob: 'blob1',
  });

  // set blob to a string[]
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: blockId,
        content: '',
        flavour: 'affine:page',
        blob: ['blob1', 'blob2'],
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'blob'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'blob'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    blob: ['blob1', 'blob2'],
    content: [''],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    blob: ['blob1', 'blob2'],
  });

  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: blockId,
        content: '',
        flavour: 'affine:page',
        blob: ['blob3'],
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );
  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'blob'],
    query: { match: { doc_id: docId } },
    fields: ['flavour', 'content', 'blob'],
    sort: ['_score'],
  });
  t.is(result.nodes.length, 1);
  t.deepEqual(result.nodes[0].fields, {
    flavour: ['affine:page'],
    blob: ['blob3'],
    content: [''],
  });
  t.deepEqual(result.nodes[0]._source, {
    doc_id: docId,
    workspace_id: workspace.id,
    blob: ['blob3'],
  });
});

test('should batch write bugfix', async t => {
  const workspaceId = 'workspaceId-batch-write-bugfix-for-elasticsearch';

  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspaceId,
        doc_id: 'a',
        block_id: 'b1',
        content: '2025-05-26',
        flavour: 'affine:page',
        additional: '{"displayMode":"edgeless"}',
        created_by_user_id: '46ce597c-098a-4c61-a106-ce79827ec1de',
        updated_by_user_id: '46ce597c-098a-4c61-a106-ce79827ec1de',
        created_at: '2025-05-26T05:16:23.128Z',
        updated_at: '2025-05-26T05:15:53.091Z',
        flavour_indexed: 'affine:page',
      },
      {
        workspace_id: workspaceId,
        doc_id: 'a',
        block_id: 'b2',
        content: '',
        flavour: 'affine:surface',
        parent_flavour: 'affine:page',
        parent_block_id: 'TcOGF6HSa7',
        additional: '',
        created_by_user_id: '46ce597c-098a-4c61-a106-ce79827ec1de',
        updated_by_user_id: '46ce597c-098a-4c61-a106-ce79827ec1de',
        created_at: '2025-05-26T05:16:23.128Z',
        updated_at: '2025-05-26T05:15:53.091Z',
        flavour_indexed: 'affine:surface',
        parent_flavour_indexed: 'affine:page',
        parent_block_id_indexed: 'TcOGF6HSa7',
      },
    ],
    {
      refresh: true,
    }
  );

  const result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          {
            term: {
              workspace_id: {
                value: workspaceId,
              },
            },
          },
        ],
      },
    },
    fields: ['workspace_id', 'doc_id', 'block_id'],
    sort: ['_score'],
  });

  t.snapshot(result.nodes.map(node => omit(node, ['_score'])));
});

// #endregion

// #region search

test('should search query all and get next cursor work', async t => {
  const result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    sort: [
      '_score',
      {
        updated_at: 'desc',
      },
      'doc_id',
      'block_id',
    ],
    query: {
      match_all: {},
    },
    fields: ['flavour', 'doc_id', 'content', 'created_at', 'updated_at'],
    size: 2,
  });

  t.truthy(result.total);
  t.is(result.timedOut, false);
  t.truthy(result.nextCursor);
  t.is(typeof result.nextCursor, 'string');
  t.is(result.nodes.length, 2);
  t.truthy(result.nodes[0]._id);
  t.truthy(result.nodes[0]._score);
  t.truthy(result.nodes[0].fields.flavour);
  t.truthy(result.nodes[0].fields.doc_id);
  t.truthy(result.nodes[0].fields.content);
  t.truthy(result.nodes[0].fields.created_at);
  t.truthy(result.nodes[0].fields.updated_at);
  t.deepEqual(Object.keys(result.nodes[0]._source), ['workspace_id', 'doc_id']);

  // test cursor
  const result2 = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    sort: [
      '_score',
      {
        updated_at: 'desc',
      },
      'doc_id',
      'block_id',
    ],
    query: {
      match_all: {},
    },
    fields: ['flavour', 'doc_id', 'content', 'created_at', 'updated_at'],
    size: 10000,
    cursor: result.nextCursor,
  });

  t.is(result2.total, result.total);
  t.is(result2.timedOut, false);
  t.truthy(result2.nextCursor);
  t.is(typeof result2.nextCursor, 'string');
  t.true(result2.nodes.length < 10000);

  // next cursor should be empty
  const result3 = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    sort: [
      '_score',
      {
        updated_at: 'desc',
      },
      'doc_id',
      'block_id',
    ],
    query: {
      match_all: {},
    },
    fields: ['flavour', 'doc_id', 'content', 'created_at', 'updated_at'],
    size: 10000,
    cursor: result2.nextCursor,
  });

  t.is(result3.total, result.total);
  t.is(result3.timedOut, false);
  t.falsy(result3.nextCursor);
  t.is(result3.nodes.length, 0);
});

test('should search block table query match url work', async t => {
  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      match: {
        content:
          'https://linear.app/affine-design/issue/AF-1379/slash-commands-%E6%BF%80%E6%B4%BB%E6%8F%92%E5%85%A5-link-%E7%9A%84%E5%BC%B9%E7%AA%97%E9%87%8C%EF%BC%8C%E8%BE%93%E5%85%A5%E9%93%BE%E6%8E%A5%E4%B9%8B%E5%90%8E%E4%B8%8D%E5%BA%94%E8%AF%A5%E7%9B%B4%E6%8E%A5%E5%AF%B9%E9%93%BE%E6%8E%A5%E8%BF%9B%E8%A1%8C%E5%88%86%E8%AF%8D%E6%90%9C%E7%B4%A2',
      },
    },
    fields: [
      'doc_id',
      'content',
      'ref',
      'ref_doc_id',
      'parent_flavour',
      'parent_block_id',
      'additional',
      'markdown_preview',
      'created_at',
      'updated_at',
    ],
    highlight: {
      fields: {
        content: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.true(result.total >= 1);
  t.snapshot(omit(result.nodes[0], ['_score']));

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      match: {
        content: 'https://linear.app',
      },
    },
    fields: [
      'doc_id',
      'content',
      'ref',
      'ref_doc_id',
      'parent_flavour',
      'parent_block_id',
      'additional',
      'markdown_preview',
      'created_at',
      'updated_at',
    ],
    highlight: {
      fields: {
        content: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.true(result.total >= 1);
  t.snapshot(omit(result.nodes[0], ['_score']));
});

test('should search block table query content match cjk work', async t => {
  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      match: {
        content: '笔记应用',
      },
    },
    fields: ['flavour', 'doc_id', 'content'],
    highlight: {
      fields: {
        content: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      match: {
        content: '记',
      },
    },
    fields: ['flavour', 'doc_id', 'content'],
    highlight: {
      fields: {
        content: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));
});

test('should search doc table query title match cjk work', async t => {
  const workspaceId = 'workspace-test-doc-title-cjk';
  await searchProvider.write(
    SearchTable.doc,
    [
      {
        workspace_id: workspaceId,
        doc_id: 'doc-0',
        title: 'AFFiNE 是一个基于云端的笔记应用',
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          { match: { workspace_id: workspaceId } },
          { match: { title: '笔记应' } },
        ],
      },
    },
    fields: ['doc_id', 'title'],
    highlight: {
      fields: {
        title: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));

  // match single chinese character
  result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          { match: { workspace_id: workspaceId } },
          { match: { title: '笔' } },
        ],
      },
    },
    fields: ['doc_id', 'title'],
    highlight: {
      fields: {
        title: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));
});

test('should search doc table query title.autocomplete work', async t => {
  const docId = 'doc-0';
  const workspaceId = 'workspace-test-doc-title-autocomplete';
  await searchProvider.write(
    SearchTable.doc,
    [
      {
        workspace_id: workspaceId,
        doc_id: docId,
        title: 'AFFiNE 是一个基于云端的笔记应用',
      },
    ],
    {
      refresh: true,
    }
  );

  const result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          { match: { workspace_id: workspaceId } },
          { match: { 'title.autocomplete': 'aff' } },
        ],
      },
    },
    fields: ['doc_id', 'title'],
    highlight: {
      fields: {
        'title.autocomplete': {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));
});

test('should search query match ref_doc_id work', async t => {
  const docId = 'doc-0';
  const refDocId1 = 'doc-1';
  const refDocId2 = 'doc-2';
  const refDocId3 = 'doc-3';
  const refDocId4 = 'doc-4';
  const refDocId5 = 'doc-5';
  const refDocId6 = 'doc-6';
  const refDocId7 = 'doc-7';
  const refDocId8 = 'doc-8';
  const refDocId9 = 'doc-9';
  const refDocId10 = 'doc-10';
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId1',
        content: 'hello world on search title blockId1',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId1',
        ref_doc_id: refDocId1,
        ref: '{"docId":"docId1","mode":"page"}',
        additional: '{"foo": "bar0"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId1-not-matched',
        content: 'hello world on search title blockId1-not-matched',
        flavour: 'affine:page',
        parent_flavour: 'affine:database1',
        parent_block_id: 'parentBlockId1',
        ref_doc_id: refDocId1,
        ref: '{"docId":"docId1","mode":"page"}',
        additional: '{"foo": "bar0"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId-all',
        content: 'hello world on search title blockId-all',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId2',
        ref_doc_id: [
          refDocId2,
          refDocId3,
          refDocId4,
          refDocId5,
          refDocId6,
          refDocId7,
          refDocId8,
          refDocId9,
          refDocId10,
          refDocId1,
        ],
        ref: [
          '{"docId":"docId1","mode":"page"}',
          '{"docId":"docId2","mode":"page"}',
        ],
        additional: '{"foo": "bar1"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId1-2',
        content: 'hello world on search title blockId1-2',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId2',
        ref_doc_id: [refDocId1, refDocId2],
        ref: [
          '{"docId":"docId1","mode":"page"}',
          '{"docId":"docId2","mode":"page"}',
        ],
        additional: '{"foo": "bar1"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId2-1',
        content: 'hello world on search title blockId2-1',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId2',
        ref_doc_id: [refDocId2, refDocId1],
        ref: [
          '{"docId":"docId1","mode":"page"}',
          '{"docId":"docId2","mode":"page"}',
        ],
        additional: '{"foo": "bar1"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId3-2-1-4',
        content: 'hello world on search title blockId3-2-1-4',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId2',
        ref_doc_id: [refDocId3, refDocId2, refDocId1, refDocId4],
        ref: [
          '{"docId":"docId1","mode":"page"}',
          '{"docId":"docId2","mode":"page"}',
        ],
        additional: '{"foo": "bar1"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // a link to the `refDocId1` document
      {
        workspace_id: workspace.id,
        doc_id: refDocId1,
        block_id: 'blockId3',
        content: 'hello world on search title blockId3',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId3',
        ref_doc_id: refDocId1,
        ref: '{"docId":"docId1","mode":"page"}',
        additional: '{"foo": "bar2"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId4',
        content: 'hello world on search title blockId4',
        flavour: 'affine:page',
        parent_flavour: 'affine:database',
        parent_block_id: 'parentBlockId4',
        ref_doc_id: refDocId10,
        ref: '{"docId":"docId2","mode":"page"}',
        additional: '{"foo": "bar3"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'blockId1-text',
        content: 'hello world on search title blockId1-text',
        flavour: 'affine:text',
        parent_flavour: 'affine:text',
        parent_block_id: 'parentBlockId1',
        ref_doc_id: refDocId1,
        ref: '{"docId":"docId1","mode":"page"}',
        additional: '{"foo": "bar0"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'parent_flavour'],
    query: {
      bool: {
        must: [
          {
            term: { workspace_id: { value: workspace.id } },
          },
          {
            bool: {
              must: [
                {
                  term: { parent_flavour: { value: 'affine:database' } },
                },
                {
                  // https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/array
                  // match: { ref_doc_id: { query: refDocId1 } },
                  term: { ref_doc_id: { value: refDocId1 } },
                },
                // Ignore if it is a link to the `refDocId1` document
                {
                  bool: {
                    must_not: {
                      term: { doc_id: { value: refDocId1 } },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    fields: [
      'doc_id',
      'block_id',
      'ref_doc_id',
      'parent_block_id',
      'additional',
      'parent_flavour',
    ],
    sort: ['_score'],
  });

  t.is(result.total, 5);
  t.snapshot(result.nodes.map(node => pick(node, ['fields'])));

  result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          {
            term: { workspace_id: { value: workspace.id } },
          },
          {
            bool: {
              must: [
                {
                  term: { parent_flavour: { value: 'affine:database' } },
                },
                {
                  term: { ref_doc_id: { value: refDocId10 } },
                },
                // Ignore if it is a link to the `refDocId1` document
                {
                  bool: {
                    must_not: {
                      term: { doc_id: { value: refDocId1 } },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    fields: [
      'doc_id',
      'block_id',
      'ref_doc_id',
      'parent_block_id',
      'parent_flavour',
      'additional',
    ],
    sort: ['_score'],
  });

  t.is(result.total, 2);
  t.snapshot(result.nodes.map(node => pick(node, ['fields'])));
});

test('should search doc title support stemmer filter', async t => {
  const docId = 'doc-0';
  const workspaceId = 'workspace-test-doc-title-stemmer-filter';
  await searchProvider.write(
    SearchTable.doc,
    [
      {
        workspace_id: workspaceId,
        doc_id: docId,
        title: 'Deploy on Windows by a designer',
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          { match: { workspace_id: workspaceId } },
          { match: { title: 'window' } },
        ],
      },
    },
    fields: ['doc_id', 'title'],
    highlight: {
      fields: {
        title: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));

  result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          { match: { workspace_id: workspaceId } },
          { match: { title: 'windows' } },
        ],
      },
    },
    fields: ['doc_id', 'title'],
    highlight: {
      fields: {
        title: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));

  result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          { match: { workspace_id: workspaceId } },
          { match: { title: 'design' } },
        ],
      },
    },
    fields: ['doc_id', 'title'],
    highlight: {
      fields: {
        title: {
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
        },
      },
    },
    sort: ['_score'],
  });

  t.is(result.total, 1);
  t.snapshot(omit(result.nodes[0], ['_score']));
});

test('should return empty string field:summary value', async t => {
  const workspaceId =
    'workspaceId-search-query-return-empty-string-field-summary-value-for-elasticsearch';
  const docId = 'doc0';

  await searchProvider.write(
    SearchTable.doc,
    [
      {
        workspace_id: workspaceId,
        doc_id: docId,
        title: '',
        summary: '',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.doc, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          {
            term: { workspace_id: { value: workspaceId } },
          },
          {
            term: {
              doc_id: {
                value: docId,
              },
            },
          },
        ],
      },
    },
    fields: ['doc_id', 'title', 'summary'],
    sort: ['_score'],
  });

  t.snapshot(result.nodes.map(node => omit(node, ['_score'])));
});

test('should not return not exists field:ref_doc_id', async t => {
  const workspaceId =
    'workspaceId-search-query-not-return-not-exists-field-ref_doc_id-for-elasticsearch';
  const docId = 'doc0';
  const blockId = 'block0';

  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspaceId,
        doc_id: docId,
        block_id: blockId,
        content: 'hello world on search title blockId1-text',
        flavour: 'affine:text',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  let result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          {
            term: { workspace_id: { value: workspaceId } },
          },
          {
            term: {
              doc_id: {
                value: docId,
              },
            },
          },
        ],
      },
    },
    fields: [
      'doc_id',
      'block_id',
      'ref_doc_id',
      'parent_block_id',
      'additional',
      'parent_flavour',
    ],
    sort: ['_score'],
  });

  t.snapshot(result.nodes.map(node => omit(node, ['_score'])));
});

test('should created_at and updated_at is date type', async t => {
  const result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id', 'created_at', 'updated_at'],
    sort: [
      '_score',
      {
        updated_at: 'desc',
      },
      'doc_id',
      'block_id',
    ],
    query: {
      match_all: {},
    },
    fields: ['created_at', 'updated_at'],
    size: 2,
  });

  t.truthy(result.total);
  t.truthy(result.nodes[0].fields.created_at);
  t.truthy(result.nodes[0].fields.updated_at);
  t.true(
    result.nodes[0].fields.created_at[0] instanceof Date,
    'created_at should be date type, but got ' +
      result.nodes[0].fields.created_at[0]
  );
  t.true(
    result.nodes[0].fields.updated_at[0] instanceof Date,
    'updated_at should be date type, but got ' +
      result.nodes[0].fields.updated_at[0]
  );
  t.true(
    result.nodes[0]._source.created_at instanceof Date,
    'created_at should be date type, but got ' +
      result.nodes[0]._source.created_at
  );
  t.true(
    result.nodes[0]._source.updated_at instanceof Date,
    'updated_at should be date type, but got ' +
      result.nodes[0]._source.updated_at
  );
});

// #endregion

// #region aggregate

test('should aggregate query work', async t => {
  const result = await searchProvider.aggregate(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    sort: ['_score', { updated_at: 'desc' }, 'doc_id', 'block_id'],
    query: {
      bool: {
        must: [
          {
            term: {
              workspace_id: {
                value: 'workspaceId1',
              },
            },
          },
          {
            bool: {
              must: [
                {
                  match: {
                    content: 'hello',
                  },
                },
                {
                  bool: {
                    should: [
                      {
                        match: {
                          content: 'hello',
                        },
                      },
                      {
                        term: {
                          flavour: {
                            value: 'affine:page',
                            boost: 1.5,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    aggs: {
      result: {
        terms: {
          field: 'doc_id',
          order: {
            max_score: 'desc',
          },
        },
        aggs: {
          max_score: {
            max: {
              script: {
                source: '_score',
              },
            },
          },
          result: {
            top_hits: {
              _source: ['workspace_id', 'doc_id'],
              highlight: {
                fields: {
                  content: {
                    pre_tags: ['<b>'],
                    post_tags: ['</b>'],
                  },
                },
              },
              fields: ['block_id', 'flavour'],
              size: 2,
            },
          },
        },
      },
    },
  });

  t.truthy(result.total);
  t.is(result.timedOut, false);
  t.truthy(result.nextCursor);
  t.true(result.buckets.length > 0);
  t.truthy(result.buckets[0].key);
  t.true(result.buckets[0].count > 0);
  t.truthy(result.buckets[0].hits.nodes.length > 0);
  t.deepEqual(Object.keys(result.buckets[0].hits.nodes[0]._source), [
    'workspace_id',
    'doc_id',
  ]);
  t.snapshot(result.buckets[0].hits.nodes.map(node => omit(node, ['_score'])));
});

test('should aggregate query return top score first', async t => {
  const workspaceId = 'aggregate-test-workspace-top-score-max-first';
  await searchProvider.deleteByQuery(
    SearchTable.block,
    {
      bool: {
        must: [{ term: { workspace_id: { value: workspaceId } } }],
      },
    },
    {
      refresh: true,
    }
  );

  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspaceId,
        doc_id: 'doc-0',
        block_id: 'block-0',
        content: `0.15 - week.1进度`,
        flavour: 'affine:page',
        additional: '{"displayMode":"edgeless"}',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspaceId,
        doc_id: 'doc-10',
        block_id: 'block-10-1',
        content: 'Example 1',
        flavour: 'affine:paragraph',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspaceId,
        doc_id: 'doc-10',
        block_id: 'block-10-2',
        content: 'Single substitution format 1',
        flavour: 'affine:paragraph',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  const query = {
    size: 50,
    _source: ['workspace_id', 'doc_id'],
    sort: ['_score', { updated_at: 'desc' }, 'doc_id', 'block_id'],
    query: {
      bool: {
        must: [
          {
            term: {
              workspace_id: {
                value: workspaceId,
              },
            },
          },
          {
            bool: {
              must: [
                {
                  match: {
                    content: '0.15 week.1',
                  },
                },
                {
                  bool: {
                    should: [
                      {
                        match: {
                          content: '0.15 week.1',
                        },
                      },
                      {
                        term: {
                          flavour: {
                            value: 'affine:page',
                            boost: 1.5,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    aggs: {
      result: {
        terms: {
          field: 'doc_id',
          size: 100,
          order: {
            max_score: 'desc',
          },
        },
        aggs: {
          max_score: {
            max: {
              script: {
                source: '_score',
              },
            },
          },
          result: {
            top_hits: {
              _source: ['workspace_id', 'doc_id'],
              highlight: {
                fields: {
                  content: {
                    pre_tags: ['<b>'],
                    post_tags: ['</b>'],
                  },
                },
              },
              fields: ['block_id', 'flavour'],
              size: 2,
            },
          },
        },
      },
    },
  } as AggregateQueryDSL;
  const result = await searchProvider.aggregate(SearchTable.block, query);

  t.truthy(result.total);
  t.is(result.timedOut, false);
  t.truthy(result.nextCursor);
  t.true(result.buckets.length > 0);
  t.truthy(result.buckets[0].key);
  t.true(result.buckets[0].count > 0);
  t.truthy(result.buckets[0].hits.nodes.length > 0);
  t.deepEqual(Object.keys(result.buckets[0].hits.nodes[0]._source), [
    'workspace_id',
    'doc_id',
  ]);
  t.snapshot(
    result.buckets.map(bucket => ({
      key: bucket.key,
      count: bucket.count,
      hits: bucket.hits.nodes.map(node => omit(node, ['_score'])),
    }))
  );

  // set size to 1
  query.aggs.result.terms.size = 1;
  const result2 = await searchProvider.aggregate(SearchTable.block, query);

  t.is(result2.buckets.length, 1);
  t.snapshot(
    result2.buckets.map(bucket => ({
      key: bucket.key,
      count: bucket.count,
      hits: bucket.hits.nodes.map(node => omit(node, ['_score'])),
    }))
  );
  t.is(result2.buckets[0].hits.nodes.length, 1);
});

// #endregion

// #region delete by query

test('should delete by query work', async t => {
  const docId = 'doc-delete-by-query';
  await searchProvider.write(
    SearchTable.block,
    [
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'block-0',
        content: `hello world on search title block-0`,
        flavour: 'affine:page',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        workspace_id: workspace.id,
        doc_id: docId,
        block_id: 'block-1',
        content: `hello world on search title block-1`,
        flavour: 'other:flavour',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    {
      refresh: true,
    }
  );

  const result = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          {
            term: {
              workspace_id: workspace.id,
            },
          },
          {
            term: {
              doc_id: docId,
            },
          },
        ],
      },
    },
    fields: ['block_id'],
    sort: ['_score'],
  });

  t.is(result.nodes.length, 2);

  await searchProvider.deleteByQuery(
    SearchTable.block,
    {
      bool: {
        must: [
          {
            term: {
              workspace_id: workspace.id,
            },
          },
          {
            term: {
              doc_id: docId,
            },
          },
        ],
      },
    },
    {
      refresh: true,
    }
  );

  const result2 = await searchProvider.search(SearchTable.block, {
    _source: ['workspace_id', 'doc_id'],
    query: {
      bool: {
        must: [
          {
            term: {
              workspace_id: workspace.id,
            },
          },
          {
            term: {
              doc_id: docId,
            },
          },
        ],
      },
    },
    fields: ['block_id'],
    sort: ['_score'],
  });

  t.is(result2.nodes.length, 0);
});

// #endregion
