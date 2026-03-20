import { test, expect } from './fixtures';

test.describe('Spenders', () => {
    test('can view a spender from the dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByRole('heading', { name: 'Emma' })).toBeVisible();
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
        await expect(page.getByRole('heading', { name: 'Emma-Edited' })).toBeVisible();

        // Restore original name
        await page.goto(spenderUrl + '/edit');
        await page.fill('#name', 'Emma');
        await page.click('button:has-text("Save Changes")');
    });

    test('shows child login section on spender page for parents', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByText('Child Login Accounts')).toBeVisible();
        await expect(page.getByPlaceholder("Child's email address")).toBeVisible();
    });

    test('can switch to child view and see the exit banner', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: /View as Emma/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        // Banner should appear with the child's name
        await expect(page.getByText("this is the child's view")).toBeVisible();
        await expect(page.getByText('Emma').first()).toBeVisible();

        // Exit child view
        await page.getByRole('button', { name: /Exit/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText("this is the child's view")).not.toBeVisible();
    });
});
