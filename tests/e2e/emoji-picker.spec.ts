import { test, expect } from './fixtures';

test.describe('EmojiPickerField', () => {
    test.describe.configure({ mode: 'serial' });

    test.describe('desktop (pointer: fine)', () => {
        // Use a standard desktop viewport — pointer: fine by default in Playwright
        test.use({ viewport: { width: 1280, height: 720 } });

        test('shows a button on desktop chore create', async ({ page }) => {
            await page.goto('/chores/create');
            // Should show a button (desktop picker trigger), not a text input
            const pickerBtn = page.locator('button[aria-label="Pick emoji"]');
            await expect(pickerBtn).toBeVisible();
        });

        test('desktop picker opens on button click', async ({ page }) => {
            await page.goto('/chores/create');
            await page.locator('button[aria-label="Pick emoji"]').click();
            // The emoji-picker-react library renders an aside element
            await expect(page.locator('aside.EmojiPickerReact')).toBeVisible();
        });

        test('desktop picker closes when clicking outside', async ({ page }) => {
            await page.goto('/chores/create');
            await page.locator('button[aria-label="Pick emoji"]').click();
            await expect(page.locator('aside.EmojiPickerReact')).toBeVisible();
            // Click outside the picker to close it
            await page.mouse.click(10, 10);
            await expect(page.locator('aside.EmojiPickerReact')).not.toBeVisible();
        });
    });

    test.describe('mobile (touch device)', () => {
        test.use({
            viewport: { width: 390, height: 844 },
            hasTouch: true,
        });

        test('shows a text input instead of picker button on mobile', async ({ page }) => {
            await page.goto('/chores/create');
            // Mobile: should render an <input> with aria-label
            const input = page.locator('input[aria-label="Pick emoji"]');
            await expect(input).toBeVisible();
            // Should NOT show the desktop picker button
            await expect(page.locator('button[aria-label="Pick emoji"]')).not.toBeVisible();
        });

        test('mobile input shows default emoji and reverts to default if cleared', async ({ page }) => {
            await page.goto('/chores/create');
            const input = page.locator('input[aria-label="Pick emoji"]');
            // Default emoji is 📋
            await expect(input).toHaveValue('📋');
            // Clearing and blurring should revert to default
            await input.fill('');
            await input.blur();
            await expect(input).toHaveValue('📋');
        });
    });
});
