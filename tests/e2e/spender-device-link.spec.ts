import { test, expect } from './fixtures';

test.describe('Spender device linking', () => {
    test.describe.configure({ mode: 'serial' });

    test('shows "Linked Devices" card on spender page', async ({ page }) => {
        await page.goto('/spenders');
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByText('Linked Devices')).toBeVisible();
    });

    test('generates a link code', async ({ page }) => {
        await page.goto('/spenders');
        await page.getByRole('link', { name: 'Emma' }).first().click();

        // Click generate button
        await page.getByRole('button', { name: 'Generate Link Code' }).click();

        // Should show the expiry text and the code input area
        await expect(page.getByText('Expires in 10 minutes')).toBeVisible();
        await expect(page.getByText("Enter this code on the child's device")).toBeVisible();
    });

    test('shows no devices initially', async ({ page }) => {
        await page.goto('/spenders');
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await expect(page.getByText('No devices linked yet.')).toBeVisible();
    });
});
