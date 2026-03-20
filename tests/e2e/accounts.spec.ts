import { test, expect } from './fixtures';

test.describe('Accounts', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Emma's spender page before each test
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
    });

    test('can create an account for a spender', async ({ page }) => {
        await page.click('a:has-text("Add account")');
        await expect(page).toHaveURL(/\/accounts\/create/);
        await page.fill('#name', 'Spending Money');
        await page.click('button[type=submit]');
        await expect(page).toHaveURL(/\/accounts\//);
        await expect(page.getByText('Spending Money')).toBeVisible();
        await expect(page.getByText('$0.00')).toBeVisible();
    });

    test('can create a savings pot account', async ({ page }) => {
        await page.click('a:has-text("Add account")');
        await page.fill('#name', 'Savings Pot');
        await page.locator('#is_savings_pot').check();
        await page.click('button[type=submit]');
        await expect(page).toHaveURL(/\/accounts\//);
        await expect(page.getByText('Savings Pot')).toBeVisible();
    });

    test('shows zero balance on a new account', async ({ page }) => {
        await page.click('a:has-text("Add account")');
        await page.fill('#name', 'Zero Balance');
        await page.click('button[type=submit]');
        await expect(page.getByText('$0.00')).toBeVisible();
    });

    test('can navigate to account from spender page', async ({ page }) => {
        // Assumes at least one account exists (created in previous tests or from seed)
        const accountLink = page.locator('a').filter({ has: page.locator('p.text-2xl') }).first();
        if (await accountLink.count() > 0) {
            await accountLink.click();
            await expect(page).toHaveURL(/\/accounts\//);
        }
    });
});
