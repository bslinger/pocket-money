import { test, expect } from './fixtures';

test.describe('Kid view (parent preview)', () => {
    test.describe.configure({ mode: 'serial' });

    // Ensure we always start from the parent dashboard (exit kid view if active)
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        const backBtn = page.getByRole('button', { name: /Back to parent view/i });
        if (await backBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await backBtn.click();
            await page.waitForURL('/dashboard');
            await expect(page.getByText('Family Balance')).toBeVisible({ timeout: 5000 });
        }
    });

    async function enterKidView(page: any) {
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await page.waitForURL(/spenders\//);
        await page.getByRole('button', { name: /View as/i }).click();
        await page.waitForURL('/dashboard');
        await expect(page.getByText("Emma's view")).toBeVisible({ timeout: 5000 });
    }

    test("header shows kid's name, not Quiddo", async ({ page }) => {
        await enterKidView(page);
        await expect(page.getByText("Emma's view")).toBeVisible();
        await expect(page.getByText('Quiddo')).not.toBeVisible();
    });

    test('no nav bar or app menu is shown', async ({ page }) => {
        await enterKidView(page);
        // The authenticated nav bar (with Dashboard / Chores links) should not be present
        await expect(page.getByRole('navigation')).not.toBeVisible();
    });

    test('"Back to parent view" button is shown instead of Log out', async ({ page }) => {
        await enterKidView(page);
        await expect(page.getByRole('button', { name: /Back to parent view/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Log out/i })).not.toBeVisible();
    });

    test('"Back to parent view" returns to parent dashboard without logging out', async ({ page }) => {
        await enterKidView(page);
        await page.getByRole('button', { name: /Back to parent view/i }).click();
        await page.waitForURL('/dashboard');
        // Should be back on the parent dashboard — stat cards are visible again
        await expect(page.getByText('Family Balance')).toBeVisible();
    });

    test('amber banner on other pages shows "name\'s view"', async ({ page }) => {
        await enterKidView(page);
        // Navigate to a parent page (still in view-as session)
        await page.goto('/chores');
        await expect(page.getByText("Emma's view")).toBeVisible();
    });
});
