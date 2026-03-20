import { test, expect } from '@playwright/test';

test.describe('Families', () => {
    test('can view the families list', async ({ page }) => {
        await page.goto('/families');
        await expect(page.getByText("Ben's Family")).toBeVisible();
    });

    test('can view a family', async ({ page }) => {
        await page.goto('/families');
        // Family name is a span, not a link — use the "View" link
        await page.getByRole('link', { name: 'View' }).first().click();
        await expect(page.getByText("Ben's Family")).toBeVisible();
    });

    test('can create a new family', async ({ page }) => {
        await page.goto('/families/create');
        await page.fill('#name', 'The Wilsons');
        await page.click('button:has-text("Create Family")');
        await expect(page.getByText('The Wilsons')).toBeVisible();
    });

    test('shows validation error for empty family name', async ({ page }) => {
        await page.goto('/families/create');
        await page.click('button:has-text("Create Family")');
        await expect(page.getByText(/name field is required/i)).toBeVisible();
    });

    test('can edit a family name', async ({ page }) => {
        await page.goto('/families');
        // Click "Edit" link directly from the families list
        await page.getByRole('link', { name: 'Edit' }).first().click();
        await page.fill('input[type=text]', "Ben's Updated Family");
        await page.click('button[type=submit]');
        await expect(page.getByText("Ben's Updated Family")).toBeVisible();

        // Restore original name
        await page.goto('/families');
        await page.getByRole('link', { name: 'Edit' }).first().click();
        await page.fill('input[type=text]', "Ben's Family");
        await page.click('button[type=submit]');
    });
});
