import type {
  EmbedSyncedDocBlockProps,
  NoteBlockModel,
  ParagraphProps,
  RootBlockProps,
} from '@blocksuite/affine-model';
import type { Store } from '@blocksuite/store';
import type { Page } from '@playwright/test';
/**
 * using page.evaluate to init the embed synced doc state
 * @param page - playwright page
 * @param data - the data to init the embed synced doc state
 * @param option.chain - doc1 -> doc2 -> doc3 -> ..., if chain is false, doc1 will be the parent of remaining docs
 * @returns the ids of created docs
 */
export async function initEmbedSyncedDocState(
  page: Page,
  data: { title: string; content: string }[],
  option?: {
    chain?: boolean;
  }
) {
  if (data.length === 0) {
    throw new Error('Data is empty');
  }

  return await page.evaluate(
    ({ data, option }) => {
      const createDoc = async (
        docId: string,
        title: string,
        content: string
      ) => {
        const { collection, $blocksuite } = window;
        const Text = $blocksuite.store.Text;

        const store = (
          collection.getDoc(docId) ?? collection.createDoc(docId)
        ).getStore();
        store.load();

        const rootId = store.addBlock('affine:page', {
          title: new Text(title),
        } satisfies Partial<RootBlockProps>);

        store.addBlock('affine:surface', {}, rootId);

        const noteId = store.addBlock('affine:note', {}, rootId);
        store.addBlock(
          'affine:paragraph',
          {
            text: new Text(content),
          } satisfies Partial<ParagraphProps>,
          noteId
        );
      };

      const getVisibleNote = (store: Store) => {
        const note = store
          .getModelsByFlavour('affine:note')
          .filter((note): note is NoteBlockModel => {
            return (
              note instanceof NoteBlockModel &&
              note.props.displayMode === NoteDisplayMode.DocAndEdgeless
            );
          })[0];
        return note ?? null;
      };

      const docIds = data.map(({ title, content }, index) => {
        const id = index === 0 ? window.doc.id : `embed-doc-${index}`;
        createDoc(id, title, content);
        return id;
      });

      const { NoteBlockModel, NoteDisplayMode } =
        window.$blocksuite.affineModel;

      let prevId = window.doc.id;
      for (let index = 1; index < docIds.length; index++) {
        const docId = docIds[index];

        const store = window.collection
          .getDoc(option?.chain ? prevId : docIds[0])
          ?.getStore();
        if (!store) {
          throw new Error('Store not found');
        }

        const note = getVisibleNote(store);
        if (!note) {
          throw new Error(`Note not found in ${docId}`);
        }

        store.addBlock(
          'affine:embed-synced-doc',
          {
            pageId: docId,
          } satisfies Partial<EmbedSyncedDocBlockProps>,
          note
        );

        prevId = docId;
      }

      return docIds;
    },
    { data, option }
  );
}
