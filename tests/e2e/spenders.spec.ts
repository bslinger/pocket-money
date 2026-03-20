import { test, expect } from '@playwright/test';

test.describe('Spenders', () => {
    test('can view a spender from the dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByText('Emma')).toBeVisible();
    });

    test('can create a spender', async ({ page }) => {
        await page.goto('/spenders/create');
        await page.fill('#name', 'Lily');
        await page.click('button:has-text("Add Spender")');
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByText('Lily')).toBeVisible();
    });

    test('shows validation error for empty spender name', async ({ page }) => {
        await page.goto('/spenders/create');
        await page.click('button:has-text("Add Spender")');
        await expect(page.getByText(/name field is required/i)).toBeVisible();
    });

    test('can select a colour for the spender', async ({ page }) => {
        await page.goto('/spenders/create');
        await page.fill('#name', 'ColouredKid');
        // Click the pink colour (#ec4899)
        await page.click('button[aria-label="#ec4899"]');
        await page.click('button:has-text("Add Spender")');
        await expect(page).toHaveURL(/\/spenders\//);
    });

    test('can edit a spender', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        // Navigate to the edit page by appending /edit to the current URL
        const spenderUrl = page.url();
        await page.goto(spenderUrl + '/edit');
        await page.fill('#name', 'Emma-Edited');
        await page.click('button:has-text("Save Changes")');
        await expect(page.getByText('Emma-Edited')).toBeVisible();

        // Restore original name
        await page.goto(spenderUrl + '/edit');
        await page.fill('#name', 'Emma');
        await page.click('button:has-text("Save Changes")');
    });
});
