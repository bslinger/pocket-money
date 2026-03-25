import { test, expect, MOBILE } from './fixtures';

test.use({ viewport: MOBILE });

/**
 * Core page functionality at mobile viewport (390×844).
 * These tests verify that key workflows are usable on small screens —
 * not duplicating desktop logic, but confirming nothing is broken at mobile size.
 */

test.describe('Mobile core pages', () => {
    test('dashboard renders with spender cards', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('Emma').first()).toBeVisible();
        await expect(page.getByText('Jack').first()).toBeVisible();
    });

    test('can navigate to a spender from dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByRole('heading', { name: 'Emma' })).toBeVisible();
    });

    test('spender page tabs are accessible', async ({ page }) => {
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        // Tab labels are icon-only on mobile (hidden sm:inline) — use title attribute
        await expect(page.locator('button[title="Accounts"]')).toBeVisible();
        await expect(page.locator('button[title="Chores"]')).toBeVisible();
        await expect(page.locator('button[title="Goals"]')).toBeVisible();
        await expect(page.locator('button[title="Transactions"]')).toBeVisible();
    });

    test('chores list renders', async ({ page }) => {
        await page.goto('/chores');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: 'Chores', exact: true })).toBeVisible();
    });

    test('goals page renders', async ({ page }) => {
        await page.goto('/goals');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: 'Goals' })).toBeVisible();
    });

    test('pocket money page renders', async ({ page }) => {
        await page.goto('/pocket-money/release');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: /Pocket Money/i })).toBeVisible();
    });
});

test.describe('Mobile profile menu', () => {
    test('profile dropdown opens via avatar button', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        // Family name text is hidden at mobile — click the button that wraps it
        await page.locator('nav').locator('button').filter({ hasText: "Ben's Family" }).click();
        await expect(page.getByText('Profile settings')).toBeVisible();
    });
});
