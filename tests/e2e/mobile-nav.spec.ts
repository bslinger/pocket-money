import { test, expect } from './fixtures';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

test.describe('Mobile navigation drawer', () => {
    test.describe.configure({ mode: 'serial' });
    test('hamburger button is visible on mobile', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeVisible({ timeout: 10000 });
    });

    test('nav links are hidden on mobile before opening drawer', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await expect(page.getByRole('link', { name: 'Chores' })).not.toBeVisible();
    });

    test('drawer opens and shows nav links', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        // Target links inside the drawer nav specifically
        const drawer = page.locator('[aria-label="Close menu"]').locator('..');
        await expect(page.getByRole('link', { name: 'Dashboard' }).last()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Chores' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Goals' })).toBeVisible();
    });

    test('drawer closes when close button is clicked', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        await expect(page.getByRole('link', { name: 'Chores' })).toBeVisible();
        await page.getByRole('button', { name: 'Close menu' }).click();
        await expect(page.getByRole('link', { name: 'Chores' })).not.toBeVisible();
    });

    test('drawer closes when backdrop is clicked', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        await expect(page.getByRole('link', { name: 'Chores' })).toBeVisible();
        // Wait for open animation (300ms) to complete before clicking backdrop
        await page.waitForTimeout(350);
        // Click the backdrop (right edge, outside the 288px w-72 drawer)
        await page.mouse.click(370, 400);
        await expect(page.getByRole('link', { name: 'Chores' })).not.toBeVisible();
    });

    test('navigating via drawer closes it and loads the page', async ({ page }) => {
        await page.setViewportSize(MOBILE);
        await page.goto('/dashboard');
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        await page.getByRole('link', { name: 'Chores' }).click();
        await page.waitForURL('/chores');
        await expect(page.getByRole('link', { name: 'Chores' })).not.toBeVisible();
    });

    test('hamburger is hidden on desktop', async ({ page }) => {
        await page.setViewportSize(DESKTOP);
        await page.goto('/dashboard');
        await expect(page.getByRole('button', { name: 'Toggle menu' })).not.toBeVisible();
    });
});
