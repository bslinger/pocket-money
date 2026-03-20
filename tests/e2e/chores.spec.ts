import { test, expect } from '@playwright/test';

test.describe('Chores', () => {
    test('can view the chores list', async ({ page }) => {
        await page.goto('/chores');
        await expect(page.getByRole('heading', { name: 'Chores', exact: true })).toBeVisible();
    });

    test('can create an earns chore', async ({ page }) => {
        await page.goto('/chores/create');
        await page.fill('#name', 'Wash the dishes');
        // Select "earns" reward type (should be default)
        await page.locator('input[type=radio][value=earns]').check();
        await page.fill('#amount', '1.50');
        // Select weekly frequency
        await page.selectOption('select', 'weekly');
        // Assign to Emma
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText('Wash the dishes')).toBeVisible();
    });

    test('can create a responsibility chore', async ({ page }) => {
        await page.goto('/chores/create');
        await page.fill('#name', 'Make bed');
        await page.locator('input[type=radio][value=responsibility]').check();
        await page.selectOption('select', 'daily');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText('Make bed')).toBeVisible();
    });

    test('can create a one-off chore', async ({ page }) => {
        await page.goto('/chores/create');
        await page.fill('#name', 'Clean garage');
        await page.locator('input[type=radio][value=earns]').check();
        await page.fill('#amount', '5.00');
        await page.selectOption('select', 'one_off');
        // Assign to Emma to satisfy spender_ids validation
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText('Clean garage')).toBeVisible();
    });

    test('shows validation error for missing chore name', async ({ page }) => {
        await page.goto('/chores/create');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText(/name field is required/i)).toBeVisible();
    });

    test('shows amount field only for earns reward type', async ({ page }) => {
        await page.goto('/chores/create');
        await expect(page.locator('#amount')).toBeVisible();
        await page.locator('input[type=radio][value=responsibility]').check();
        await expect(page.locator('#amount')).not.toBeVisible();
        await page.locator('input[type=radio][value=no_reward]').check();
        await expect(page.locator('#amount')).not.toBeVisible();
    });

    test('can edit a chore', async ({ page }) => {
        // First create one
        await page.goto('/chores/create');
        await page.fill('#name', 'Editable Chore');
        await page.locator('input[type=radio][value=earns]').check();
        await page.fill('#amount', '1.00');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText('Editable Chore')).toBeVisible();

        // Edit it — find the pencil/edit button in the same row
        const choreRow = page.locator('.divide-y > div').filter({ hasText: 'Editable Chore' });
        await choreRow.getByRole('link').first().click();
        await expect(page).toHaveURL(/\/chores\/.*\/edit/);
        await page.fill('#name', 'Edited Chore');
        await page.click('button:has-text("Save Changes")');
        await expect(page.getByText('Edited Chore')).toBeVisible();
    });

    test('can delete a chore', async ({ page }) => {
        // Create a chore to delete
        await page.goto('/chores/create');
        await page.fill('#name', 'Delete Me Chore');
        await page.locator('input[type=radio][value=earns]').check();
        await page.fill('#amount', '1.00');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText('Delete Me Chore')).toBeVisible();

        // Accept the confirm dialog and click the delete (trash) button in that row
        page.once('dialog', dialog => dialog.accept());
        const choreRow = page.locator('.divide-y > div').filter({ hasText: 'Delete Me Chore' });
        // Delete button is the last button in the row (after the edit link)
        await choreRow.locator('button').last().click();
        await expect(page.getByText('Delete Me Chore')).not.toBeVisible();
    });
});
