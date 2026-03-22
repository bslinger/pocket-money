import { test, expect } from './fixtures';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

test.describe('Mobile bottom nav', () => {
    test.describe.configure({ mode: 'serial' });

    test('bottom nav is visible on mobile', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        const nav = page.locator('nav.fixed.bottom-0');
        await expect(nav).toBeVisible({ timeout: 10000 });
    });

    test('bottom nav shows all nav items on mobile', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        const nav = page.locator('nav.fixed.bottom-0');
        await expect(nav.getByRole('link', { name: /Dashboard/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Chores/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Goals/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Pocket Money/i })).toBeVisible();
    });

    test('bottom nav is hidden on desktop', async ({ page }) => {
        await page.setViewportSize(DESKTOP);
        await page.goto('/dashboard');
        const nav = page.locator('nav.fixed.bottom-0');
        await expect(nav).not.toBeVisible();
    });

    test('clicking bottom nav item navigates to correct page', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        const nav = page.locator('nav.fixed.bottom-0');
        await nav.getByRole('link', { name: /Chores/i }).click();
        await page.waitForURL('/chores');
        await expect(page).toHaveURL('/chores');
    });

    test('desktop nav links are visible on desktop', async ({ page }) => {
        await page.setViewportSize(DESKTOP);
        await page.goto('/dashboard');
        // Desktop nav has links in the top bar
        const topNav = page.locator('nav.border-b');
        await expect(topNav.getByRole('link', { name: /Dashboard/i })).toBeVisible();
        await expect(topNav.getByRole('link', { name: /Chores/i })).toBeVisible();
    });

    test('hamburger button no longer exists', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await expect(page.getByRole('button', { name: 'Toggle menu' })).not.toBeVisible();
    });
});
