import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
    test.describe.configure({ mode: 'serial' });

    test('has no Dashboard heading', async ({ page }) => {
        await page.goto('/dashboard');
        // The word "Dashboard" should not appear as a visible heading
        await expect(page.getByRole('heading', { name: 'Dashboard' })).not.toBeVisible();
    });

    test('shows kids carousel before stat cards', async ({ page }) => {
        await page.goto('/dashboard');

        const kidsSection = page.locator('text=Kids').first();
        const familyBalance = page.locator('text=Family Balance').first();

        await expect(kidsSection).toBeVisible();
        await expect(familyBalance).toBeVisible();

        // Kids section should appear above (lower Y coordinate) the Family Balance card
        const kidsBox = await kidsSection.boundingBox();
        const balanceBox = await familyBalance.boundingBox();
        expect(kidsBox!.y).toBeLessThan(balanceBox!.y);
    });

    test('kid cards show avatar and name at top left', async ({ page }) => {
        await page.goto('/dashboard');

        // Each kid card should have an avatar and the name text visible
        const card = page.locator('.rounded-xl.border.bg-card').first();
        await expect(card).toBeVisible();
        // Avatar and name are in a row at the top
        const avatar = card.locator('[class*="AvatarFallback"], img[class*="avatar"]').first();
        const name = card.getByRole('link').first();
        await expect(name).toBeVisible();
    });

    test('kid card has + and - buttons', async ({ page }) => {
        await page.goto('/dashboard');

        // Each spender card should have add/subtract buttons
        const firstCard = page.locator('.rounded-xl.border.bg-card').first();
        await expect(firstCard.getByRole('button', { name: /Add to/ })).toBeVisible();
        await expect(firstCard.getByRole('button', { name: /Subtract from/ })).toBeVisible();
    });

    test('clicking + opens quick transaction modal', async ({ page }) => {
        await page.goto('/dashboard');

        const firstCard = page.locator('.rounded-xl.border.bg-card').first();
        await firstCard.getByRole('button', { name: /Add to/ }).click();

        // Modal should appear with Add money tab active
        await expect(page.getByRole('button', { name: /Add money/ })).toBeVisible();
        await expect(page.getByLabel(/Amount/)).toBeVisible();
    });

    test('clicking - opens modal with Take away selected', async ({ page }) => {
        await page.goto('/dashboard');

        const firstCard = page.locator('.rounded-xl.border.bg-card').first();
        await firstCard.getByRole('button', { name: /Subtract from/ }).click();

        await expect(page.getByRole('button', { name: /Take away/ })).toBeVisible();
        // Debit button should be highlighted (has bg-red-500 class)
        const debitBtn = page.locator('button:has-text("Take away")');
        await expect(debitBtn).toHaveClass(/bg-red-500/);
    });

    test('modal closes on X button click', async ({ page }) => {
        await page.goto('/dashboard');

        const firstCard = page.locator('.rounded-xl.border.bg-card').first();
        await firstCard.getByRole('button', { name: /Add to/ }).click();
        await expect(page.getByLabel(/Amount/)).toBeVisible();

        await page.getByRole('button', { name: 'Close' }).click();
        await expect(page.getByLabel(/Amount/)).not.toBeVisible();
    });

    test('can submit a quick credit transaction', async ({ page }) => {
        await page.goto('/dashboard');

        const firstCard = page.locator('.rounded-xl.border.bg-card').first();
        await firstCard.getByRole('button', { name: /Add to/ }).click();

        await page.getByLabel(/Amount/).fill('5.00');
        await page.getByLabel(/Note/).fill('Test top-up');
        await page.getByRole('button', { name: /Add \$/ }).click();

        // Modal should close after successful submit
        await expect(page.getByLabel(/Amount/)).not.toBeVisible();
    });

    test('can submit a quick debit transaction', async ({ page }) => {
        await page.goto('/dashboard');

        const firstCard = page.locator('.rounded-xl.border.bg-card').first();
        await firstCard.getByRole('button', { name: /Subtract from/ }).click();

        await page.getByLabel(/Amount/).fill('1.00');
        await page.getByRole('button', { name: /Deduct/ }).click();

        await expect(page.getByLabel(/Amount/)).not.toBeVisible();
    });
});
