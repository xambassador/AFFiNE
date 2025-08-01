import { test } from '@affine-test/kit/playwright';
import {
  createRandomUser,
  enableCloudWorkspace,
  loginUser,
} from '@affine-test/kit/utils/cloud';
import {
  clickNewPageButton,
  getBlockSuiteEditorTitle,
  waitForEditorLoad,
} from '@affine-test/kit/utils/page-logic';
import { createLocalWorkspace } from '@affine-test/kit/utils/workspace';
import { expect } from '@playwright/test';

test.describe('comments', () => {
  let user: {
    id: string;
    name: string;
    email: string;
    password: string;
  };

  test.beforeEach(async ({ page }) => {
    user = await createRandomUser();
    await loginUser(page, user);
  });

  test('can create and display a comment on selected text', async ({
    page,
  }) => {
    // Reload page and wait for editor - following the pattern from working collaboration test
    await page.reload();
    await waitForEditorLoad(page);

    // Create a new workspace
    await createLocalWorkspace(
      {
        name: 'test-comment-workspace',
      },
      page
    );

    // Enable cloud workspace for comments feature
    await enableCloudWorkspace(page);

    // Create a new doc
    await clickNewPageButton(page);
    await waitForEditorLoad(page);

    // Add title and content
    const title = getBlockSuiteEditorTitle(page);
    await title.click();
    await title.fill('Test Comment Document');

    // Add some text content
    await page.keyboard.press('Enter');
    await page.keyboard.type(
      'This is a test paragraph with some text that we will comment on.',
      { delay: 50 }
    );

    // Select some text using triple-click and then refine selection
    // Triple-click to select the entire paragraph
    await page.locator('affine-paragraph').first().click({ clickCount: 3 });

    // Wait for selection
    await page.waitForTimeout(100);

    // Now we have the whole paragraph selected, let's use mouse to select just "some text"
    const paragraph = page.locator('affine-paragraph').first();
    const bbox = await paragraph.boundingBox();
    if (!bbox) throw new Error('Paragraph not found');

    // Click and drag to select "some text" portion
    // Start roughly where "some" begins (estimated position)
    await page.mouse.move(bbox.x + bbox.width * 0.45, bbox.y + bbox.height / 2);
    await page.mouse.down();
    await page.mouse.move(bbox.x + bbox.width * 0.58, bbox.y + bbox.height / 2);
    await page.mouse.up();

    // Wait a bit for selection to stabilize
    await page.waitForTimeout(200);

    // Wait for the toolbar to appear after text selection
    const toolbar = page.locator('editor-toolbar');
    await expect(toolbar).toBeVisible({ timeout: 5000 });

    // Click the comment button in the toolbar
    // The comment button has tooltip "Comment" based on blockCommentToolbarButton
    const commentButton = page.locator(
      'editor-icon-button[aria-label="Comment"]'
    );
    await expect(commentButton).toBeVisible();
    await commentButton.click();

    // Verify comment sidebar is opened by checking comment editor is visible
    await page.waitForTimeout(300); // Wait for sidebar animation

    // Find the comment editor
    const commentEditor = page.locator('.comment-editor-viewport');
    await expect(commentEditor).toBeVisible();

    // Enter comment text
    await commentEditor.click();
    await page.keyboard.type('This is my first comment on this text', {
      delay: 50,
    });

    // Commit the comment (click the commit button or press Cmd/Ctrl+Enter)
    // The commit button is in the footer with an arrow icon
    const commitButton = page.locator('.comment-editor-viewport button').last();
    await expect(commitButton).toBeVisible();
    await commitButton.click();

    // Wait for comment to be saved
    await page.waitForTimeout(500);

    // Verify the comment appears in the sidebar
    await expect(page.locator('text=Comments')).toBeVisible();
    await expect(
      page.locator('text=This is my first comment on this text')
    ).toBeVisible();

    // Verify the preview text appears in the sidebar
    // The preview should show the selected text that was commented on
    // Target specifically the sidebar tab content to avoid conflicts with editor content
    const sidebarTab = page.getByTestId('sidebar-tab-content-comment');
    await expect(
      sidebarTab.locator(
        'text=This is a test paragraph with some text that we will comment on.'
      )
    ).toBeVisible();

    // This text should appear in the sidebar as the preview of what was commented on

    // Verify the comment is successfully created by checking the sidebar content
    const commentSidebar = page.locator('text=Comments').locator('..');
    await expect(commentSidebar).toBeVisible();
  });
});
