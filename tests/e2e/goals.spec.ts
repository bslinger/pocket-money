import { test, expect } from '@playwright/test';

test.describe('Savings Goals', () => {
    test('can view the goals list', async ({ page }) => {
        await page.goto('/goals');
        await expect(page.getByRole('heading', { name: /goals/i })).toBeVisible();
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
});
