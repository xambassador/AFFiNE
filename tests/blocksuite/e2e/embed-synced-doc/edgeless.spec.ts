import { expect } from '@playwright/test';

import { switchEditorMode } from '../utils/actions/edgeless.js';
import { enterPlaygroundRoom, waitNextFrame } from '../utils/actions/misc.js';
import { test } from '../utils/playwright.js';
import { initEmbedSyncedDocState } from './utils.js';

test.describe('Embed synced doc', () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page);
  });

  test.fixme(
    'drag embed synced doc to whiteboard should fit in height',
    async ({ page }) => {
      await initEmbedSyncedDocState(page, [
        { title: 'Root Doc', content: 'hello root doc' },
        { title: 'Page 1', content: 'hello page 1' },
      ]);

      // Switch to edgeless mode
      await switchEditorMode(page);

      // Double click on note to enter edit status
      const noteBlock = page.locator('affine-edgeless-note');
      await noteBlock.dblclick();

      // Drag the embed synced doc to whiteboard
      const embedSyncedBlockInNote = page.locator(
        'affine-embed-synced-doc-block'
      );
      const embedSyncedBoxInNote = await embedSyncedBlockInNote.boundingBox();
      if (!embedSyncedBoxInNote) {
        throw new Error('embedSyncedBoxInNote is not found');
      }
      const height = embedSyncedBoxInNote.height;
      await page.mouse.move(
        embedSyncedBoxInNote.x - 10,
        embedSyncedBoxInNote.y - 100
      );
      await page.mouse.move(
        embedSyncedBoxInNote.x - 10,
        embedSyncedBoxInNote.y + 10
      );
      await waitNextFrame(page);
      await page.mouse.down();
      await page.mouse.move(100, 200, { steps: 30 });
      await page.mouse.up();

      // Check the height of the embed synced doc portal, it should be the same as the embed synced doc in note
      const EmbedSyncedDocBlockInCanvas = page.locator(
        'affine-embed-edgeless-synced-doc-block'
      );
      const EmbedSyncedDocBlockBoxInCanvas =
        await EmbedSyncedDocBlockInCanvas.boundingBox();
      const border = 1;
      if (!EmbedSyncedDocBlockBoxInCanvas) {
        throw new Error('EmbedSyncedDocBlockBoxInCanvas is not found');
      }
      expect(EmbedSyncedDocBlockBoxInCanvas.height).toBeCloseTo(
        height + 2 * border,
        1
      );
    }
  );
});
