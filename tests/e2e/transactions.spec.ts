import { test, expect, Page } from '@playwright/test';

async function createAccountAndNavigate(page: Page, accountName: string) {
    await page.goto('/dashboard');
    await page.getByText('Emma').first().click();
    await page.click('a:has-text("Add account")');
    await page.fill('#name', accountName);
    await page.click('button[type=submit]');
    // Wait for redirect to account show page (UUID: 8 hex chars then dash — rules out /accounts/create)
    await page.waitForURL(/\/accounts\/[0-9a-f]{8}-/);
    return page.url();
}

test.describe('Transactions', () => {
    let accountUrl: string;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/e2e/.auth/user.json' });
        const page = await context.newPage();
        accountUrl = await createAccountAndNavigate(page, 'Tx Test Account');
        await context.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(accountUrl);
    });

    test('can add a credit transaction', async ({ page }) => {
        await page.click('a:has-text("+ Transaction")');
        await page.selectOption('select', 'credit');
        await page.fill('input[type=number]', '10.50');
        await page.fill('input[type=text]', 'Birthday money');
        await page.click('button:has-text("Save Transaction")');
        await expect(page).toHaveURL(accountUrl);
        await expect(page.getByText('Birthday money')).toBeVisible();
        await expect(page.getByText('+$10.50')).toBeVisible();
        await expect(page.getByText('$10.50').first()).toBeVisible();
    });

    test('can add a debit transaction', async ({ page }) => {
        await page.click('a:has-text("+ Transaction")');
        await page.selectOption('select', 'debit');
        await page.fill('input[type=number]', '2.00');
        await page.fill('input[type=text]', 'Sweets');
        await page.click('button:has-text("Save Transaction")');
        await expect(page).toHaveURL(accountUrl);
        await expect(page.getByText('Sweets')).toBeVisible();
        await expect(page.getByText('-$2.00')).toBeVisible();
    });

    test('shows validation error for missing amount', async ({ page }) => {
        await page.click('a:has-text("+ Transaction")');
        await page.click('button:has-text("Save Transaction")');
        await expect(page.getByText(/amount field is required/i)).toBeVisible();
    });

    test('shows no transactions message on empty account', async ({ page }) => {
        // Create a fresh empty account
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await page.click('a:has-text("Add account")');
        await page.fill('#name', 'Empty Account');
        await page.click('button[type=submit]');
        await expect(page.getByText('No transactions yet.')).toBeVisible();
    });
});

test.describe('Transfers', () => {
    test('can transfer between two accounts', async ({ page }) => {
        // Create two accounts
        const url1 = await createAccountAndNavigate(page, 'Transfer Source');

        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await page.click('a:has-text("Add account")');
        await page.fill('#name', 'Transfer Destination');
        await page.click('button[type=submit]');

        // Add some money to source account first
        await page.goto(url1);
        await page.click('a:has-text("+ Transaction")');
        await page.selectOption('select', 'credit');
        await page.fill('input[type=number]', '20.00');
        await page.fill('input[type=text]', 'Initial deposit');
        await page.click('button:has-text("Save Transaction")');

        // Now transfer
        await page.click('a:has-text("Transfer")');
        await expect(page).toHaveURL(/\/transfer/);
    });
});
