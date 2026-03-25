import { test, expect, MOBILE } from './fixtures';

test.use({ viewport: MOBILE });

test.describe('Mobile bottom nav', () => {
    test.describe.configure({ mode: 'serial' });

    test('bottom nav is visible', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.getByRole('heading').first().waitFor({ state: 'visible' });
        const nav = page.locator('nav.fixed.bottom-0');
        await expect(nav).toBeVisible({ timeout: 10000 });
    });

    test('bottom nav shows all items', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        const nav = page.locator('nav.fixed.bottom-0');
        await expect(nav.getByRole('link', { name: /Dashboard/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Chores/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Goals/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Pocket Money/i })).toBeVisible();
    });

    test('tapping a bottom nav item navigates correctly', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        const nav = page.locator('nav.fixed.bottom-0');
        await nav.getByRole('link', { name: /Chores/i }).click();
        await page.waitForURL('/chores');
        await expect(page).toHaveURL('/chores');
    });

    test('desktop sidebar nav is not visible', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        // Desktop inline nav links are hidden on mobile
        const desktopNav = page.locator('nav.border-b').locator('.hidden.sm\\:flex');
        await expect(desktopNav).not.toBeVisible();
    });
});
