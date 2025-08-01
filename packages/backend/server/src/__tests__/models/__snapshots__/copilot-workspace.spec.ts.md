# Snapshot report for `src/__tests__/models/copilot-workspace.spec.ts`

The actual snapshot is saved in `copilot-workspace.spec.ts.snap`.

Generated by [AVA](https://avajs.dev).

## should manage copilot workspace ignored docs

> should add ignored doc

    1

> should return added doc

    [
      {
        docId: 'doc1',
      },
    ]

> should return ignored docs in workspace

    [
      'doc1',
    ]

> should not change if ignored doc exists

    0

> should not add ignored doc again

    [
      {
        docId: 'doc1',
      },
    ]

> should add new ignored doc

    1

> should add ignored doc

    [
      {
        docId: 'new_doc',
      },
      {
        docId: 'doc1',
      },
    ]

> should remove ignored doc

    [
      {
        docId: 'new_doc',
      },
    ]

## should insert and search embedding

> should match workspace file embedding

    [
      {
        blobId: 'blob1',
        chunk: 0,
        content: 'content',
        distance: 0,
        mimeType: 'text/plain',
        name: 'file1',
      },
    ]

> should find docs to embed

    1

> should not find docs to embed

    0

> should find docs to embed

    1

> should not find docs to embed

    0

## should filter outdated doc id style in embedding status

> should include modern doc format

    {
      embedded: 0,
      total: 1,
    }

> should count docs after filtering outdated

    {
      embedded: 1,
      total: 1,
    }
