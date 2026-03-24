import { test, expect } from './fixtures';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'mobile/.maestro/screenshots/web');

// Mobile viewport to match Maestro screenshots
test.use({ viewport: { width: 390, height: 844 } });

test.describe('Web screenshots for mobile comparison', () => {
    test('login page', async ({ page }) => {
        test.use({ storageStatePath: null } as any);
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login.png`, fullPage: false });
    });

    test('dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-dashboard.png`, fullPage: false });
    });

    test('kids page', async ({ page }) => {
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-kids.png`, fullPage: false });
    });

    test('chores page', async ({ page }) => {
        await page.goto('/chores');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-chores.png`, fullPage: false });
    });

    test('goals page', async ({ page }) => {
        await page.goto('/goals');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-goals.png`, fullPage: false });
    });

    test('pocket money page', async ({ page }) => {
        await page.goto('/pocket-money/release');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-pocket-money.png`, fullPage: false });
    });

    test('billing page', async ({ page }) => {
        await page.goto('/billing');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-billing.png`, fullPage: false });
    });

    test('create chore page', async ({ page }) => {
        await page.goto('/chores/create');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/08-create-chore.png`, fullPage: false });
    });
});
