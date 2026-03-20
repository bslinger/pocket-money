import { test, expect } from './fixtures';

test.describe('Savings Goals', () => {
    test('can view the goals list', async ({ page }) => {
        await page.goto('/goals');
        await expect(page.getByRole('heading', { name: 'Savings Goals' })).toBeVisible();
    });

    test('can create a savings goal', async ({ page }) => {
        await page.goto('/goals/create');
        // Emma should be pre-selected as first spender
        await page.fill('input[placeholder="e.g. New bike"]', 'New Bike');
        await page.fill('input[step="0.01"]', '150.00');
        await page.click('button:has-text("Create Goal")');
        await expect(page.getByText('New Bike')).toBeVisible();
    });

    test('can create a goal with a target date', async ({ page }) => {
        await page.goto('/goals/create');
        await page.fill('input[placeholder="e.g. New bike"]', 'Summer Trip');
        await page.fill('input[step="0.01"]', '200.00');
        await page.fill('input[type=date]', '2026-12-25');
        await page.click('button:has-text("Create Goal")');
        await expect(page.getByText('Summer Trip')).toBeVisible();
    });

    test('shows validation error for missing goal name', async ({ page }) => {
        await page.goto('/goals/create');
        await page.fill('input[step="0.01"]', '50.00');
        await page.click('button:has-text("Create Goal")');
        await expect(page.getByText(/name field is required/i)).toBeVisible();
    });

    test('shows validation error for missing target amount', async ({ page }) => {
        await page.goto('/goals/create');
        await page.fill('input[placeholder="e.g. New bike"]', 'No Amount Goal');
        await page.click('button:has-text("Create Goal")');
        await expect(page.getByText(/target amount field is required/i)).toBeVisible();
    });

    test('can view goal detail and add a contribution', async ({ page }) => {
        // Create a goal first
        await page.goto('/goals/create');
        await page.fill('input[placeholder="e.g. New bike"]', 'Scooter');
        await page.fill('input[step="0.01"]', '100.00');
        await page.click('button:has-text("Create Goal")');

        // Click the goal card to go to detail
        await page.getByText('Scooter').first().click();
        await expect(page.getByRole('heading', { name: 'Scooter' })).toBeVisible();
        await expect(page.getByText(/saved so far/)).toBeVisible();

        // Add a contribution
        await page.fill('input[id="amount"]', '25');
        await page.click('button:has-text("Add")');
        await expect(page.getByText('$25.00').first()).toBeVisible();
    });

    test('can edit a goal', async ({ page }) => {
        // Create a goal to edit
        await page.goto('/goals/create');
        await page.fill('input[placeholder="e.g. New bike"]', 'Scooter');
        await page.fill('input[step="0.01"]', '100.00');
        await page.click('button:has-text("Create Goal")');

        // Navigate to the goal and edit it
        await page.getByText('Scooter').first().click();
        await page.getByRole('link', { name: 'Edit' }).click();
        await page.fill('#name', 'Scooter (updated)');
        await page.click('button:has-text("Save Changes")');
        await expect(page.getByRole('heading', { name: 'Scooter (updated)' })).toBeVisible();
    });
});
