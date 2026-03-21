import { test, expect } from './fixtures';

test.describe('Settings', () => {
    test('can view the settings page', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByText('Settings')).toBeVisible();
    });

    test('can update display name', async ({ page }) => {
        await page.goto('/settings');
        // Display name input placeholder is user.name ('ben'), value is display_name
        const displayNameInput = page.getByPlaceholder('ben');
        await displayNameInput.fill('Ben Updated');
        await page.click('button:has-text("Save Changes")');
        // After save, redirects back to /settings and re-renders with updated display_name
        await page.waitForURL('/settings');
        await expect(page.getByPlaceholder('ben')).toHaveValue('Ben Updated');

        // Restore
        await page.getByPlaceholder('ben').fill('Ben');
        await page.click('button:has-text("Save Changes")');
        await page.waitForURL('/settings');
    });

    test('can trigger data export', async ({ page }) => {
        await page.goto('/settings');
        // Export calls window.location.href — wait for the JSON response
        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('settings/export')),
            page.click('button:has-text("Export")'),
        ]);
        expect(response.status()).toBe(200);
    });
});

test.describe('Dashboard', () => {
    test('shows parent dashboard for parent user', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText(/dashboard/i).first()).toBeVisible();
        // Parent sees spender cards
        await expect(page.getByText('Emma').first()).toBeVisible();
        await expect(page.getByText('Jack').first()).toBeVisible();
    });

    test('shows total balance summary', async ({ page }) => {
        await page.goto('/dashboard');
        // Should display "Family Balance" stat card
        await expect(page.getByText(/family balance/i)).toBeVisible();
    });
});

test.describe('Pocket Money Release', () => {
    test('can view the pocket money release page', async ({ page }) => {
        await page.goto('/pocket-money/release');
        await expect(page.getByText(/release pocket money/i)).toBeVisible();
        // Spenders are listed
        await expect(page.getByText('Emma')).toBeVisible();
        await expect(page.getByText('Jack')).toBeVisible();
    });

    test('can pay pocket money to a spender', async ({ page }) => {
        await page.goto('/pocket-money/release');
        // Find the first spender release card's amount input and pay button
        const amountInput = page.locator('input[type=number]').first();
        if (await amountInput.count() > 0) {
            await amountInput.fill('5.00');
            await page.locator('button:has-text("Pay Now")').first().click();
            await expect(page.getByText(/paid/i).first()).toBeVisible();
        }
    });
});
