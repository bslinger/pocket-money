import { test, expect } from './fixtures';

test.describe('Billing page', () => {
    test('shows billing page with family cards', async ({ page }) => {
        await page.goto('/billing');
        await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
        await expect(page.locator('main').getByRole('heading', { name: "Ben's Family" })).toBeVisible();
    });

    test('shows trial status on family cards', async ({ page }) => {
        await page.goto('/billing');
        // Multiple families may have trial badges — just check at least one exists
        await expect(page.locator('main').getByText(/Trial —/).first()).toBeVisible();
    });

    test('shows pricing buttons for families without subscription', async ({ page }) => {
        await page.goto('/billing');
        await expect(page.locator('main').getByText(/\/mo/).first()).toBeVisible();
        await expect(page.locator('main').getByText(/\/yr/).first()).toBeVisible();
    });

    test('shows billing transfer option when family has other members', async ({ page }) => {
        await page.goto('/billing');
        await expect(page.locator('main').getByText(/Transfer billing/).first()).toBeVisible();
    });

    test('billing link is in the profile menu', async ({ page }) => {
        await page.goto('/dashboard');
        await page.locator('nav').getByText("Ben's Family").click();
        await expect(page.getByRole('menuitem', { name: /Billing/ })).toBeVisible();
    });

    test('shows expired status for Trial Expired family', async ({ page }) => {
        await page.goto('/billing');
        // The "Expired" badge should appear on the page (for Trial Expired and Lapsed families)
        await expect(page.locator('main').getByText('Expired').first()).toBeVisible();
    });

    test('shows Active Subscriber family with subscription badge', async ({ page }) => {
        await page.goto('/billing');
        await expect(page.locator('main').getByRole('heading', { name: 'Active Subscriber' })).toBeVisible();
    });
});

test.describe('Frozen state', () => {
    test('shows frozen banner when switching to expired family', async ({ page }) => {
        await page.goto('/dashboard');
        await page.locator('nav').getByText("Ben's Family").click();
        await page.getByRole('menuitem', { name: /Trial Expired/ }).click();
        await page.waitForURL('/dashboard');
        await expect(page.getByText(/trial has expired/i)).toBeVisible();
    });

    test('active subscriber family shows no frozen banner', async ({ page }) => {
        await page.goto('/dashboard');
        // Open the family menu (whatever the current family name is)
        await page.locator('nav button').filter({ hasText: /Family|Subscriber|Trial/ }).first().click();
        await page.getByRole('menuitem', { name: /Active Subscriber/ }).click();
        await page.waitForURL('/dashboard');
        await expect(page.getByText(/trial has expired/i)).not.toBeVisible();
    });
});
