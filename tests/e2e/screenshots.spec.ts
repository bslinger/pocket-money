import { test, expect } from './fixtures';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots/web');

// Mobile viewport to match Maestro screenshots
test.use({ viewport: { width: 390, height: 844 } });

test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe('Login screenshot', () => {
    test.use({ storageStatePath: null });

    test('01 - login page', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-filled.png`, fullPage: false });
    });
});

test.describe('Web screenshots for mobile comparison', () => {
    test('02 - dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-dashboard.png`, fullPage: false });
    });

    test('02b - dashboard approvals', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        // Scroll to approvals section
        const approvals = page.getByText('Needs your approval');
        if (await approvals.isVisible({ timeout: 3000 }).catch(() => false)) {
            await approvals.scrollIntoViewIfNeeded();
            await page.screenshot({ path: `${SCREENSHOT_DIR}/02b-dashboard-approvals.png`, fullPage: false });
        }
    });

    test('03 - dashboard full', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-dashboard-full.png`, fullPage: false });
    });

    test('04 - kids', async ({ page }) => {
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-kids.png`, fullPage: false });
    });

    test('05 - chores', async ({ page }) => {
        await page.goto('/chores');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-chores.png`, fullPage: false });
    });

    test('06 - goals', async ({ page }) => {
        await page.goto('/goals');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-goals.png`, fullPage: false });
    });

    test('07 - pocket money', async ({ page }) => {
        await page.goto('/pocket-money/release');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-pocket-money.png`, fullPage: false });
    });

    test('08 - profile panel', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        // Open the profile dropdown (text span is hidden on mobile viewport — click the button)
        await page.locator('nav').locator('button').filter({ hasText: "Ben's Family" }).click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/08-profile-panel.png`, fullPage: false });
    });

    test('09 - create chore empty', async ({ page }) => {
        await page.goto('/chores/create');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/09-create-chore-empty.png`, fullPage: false });
    });

    test('10 - create chore filled', async ({ page }) => {
        await page.goto('/chores/create');
        await page.waitForLoadState('networkidle');
        await page.fill('#name', 'Test Chore');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/10-create-chore-filled.png`, fullPage: false });
    });
});
