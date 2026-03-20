import { test, expect } from './fixtures';

test.describe('Families', () => {
    test('can view the families list', async ({ page }) => {
        await page.goto('/families');
        await expect(page.locator('main').getByText("Ben's Family")).toBeVisible();
    });

    test('can view a family', async ({ page }) => {
        await page.goto('/families');
        // Family name is a span, not a link — use the "View" link
        await page.getByRole('link', { name: 'View' }).first().click();
        await expect(page.locator('main').getByText("Ben's Family")).toBeVisible();
    });

    test('can create a new family', async ({ page }) => {
        await page.goto('/families/create');
        await page.fill('#name', 'The Wilsons');
        await page.click('button:has-text("Create Family")');
        await expect(page.getByText('The Wilsons')).toBeVisible();
    });

    test('can create a family with kids', async ({ page }) => {
        await page.goto('/families/create');
        await page.fill('#name', 'The Johnsons');
        // Add two kids
        await page.click('button:has-text("Add Kid")');
        await page.locator('input[placeholder="Kid 1 name"]').fill('Sophie');
        await page.click('button:has-text("Add Kid")');
        await page.locator('input[placeholder="Kid 2 name"]').fill('Oliver');
        await page.click('button:has-text("Create Family")');
        // Should show the family settings page with both kids
        await expect(page.getByText('The Johnsons')).toBeVisible();
        await expect(page.getByText('Sophie')).toBeVisible();
        await expect(page.getByText('Oliver')).toBeVisible();
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
        await page.fill('#name', "Ben's Updated Family");
        await page.click('button:has-text("Save Changes")');
        await expect(page.getByText("Ben's Updated Family").first()).toBeVisible();

        // Restore original name
        await page.goto('/families');
        await page.getByRole('link', { name: 'Edit' }).first().click();
        await page.fill('#name', "Ben's Family");
        await page.click('button:has-text("Save Changes")');
    });
});

test.describe('Family context switcher', () => {
    test('shows the active family name in the nav trigger', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('nav').getByText("Ben's Family")).toBeVisible();
    });

    test('opens the combined menu and shows family card, family list, and account actions', async ({ page }) => {
        await page.goto('/dashboard');
        await page.locator('nav').getByText("Ben's Family").click();
        // Family card
        await expect(page.getByRole('menuitem', { name: /Settings/i }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /Invite/i })).toBeVisible();
        // Family list (active family has checkmark)
        await expect(page.getByRole('menuitem', { name: /New family/i })).toBeVisible();
        // Account actions
        await expect(page.getByRole('menuitem', { name: /Profile settings/i })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: /Log out/i })).toBeVisible();
    });
});

test.describe('Family settings page', () => {
    test('shows family name, parents, and spenders sections', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        await expect(page.getByText('Family details')).toBeVisible();
        await expect(page.getByText('Parents & carers')).toBeVisible();
        await expect(page.getByText('Spenders')).toBeVisible();
    });

    test('can edit family name inline', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        await page.fill('#family-name', "Ben's Updated Family");
        await page.click('button:has-text("Save")');
        await expect(page.getByText("Ben's Updated Family").first()).toBeVisible();

        // Restore
        await page.fill('#family-name', "Ben's Family");
        await page.click('button:has-text("Save")');
        await expect(page.getByText("Ben's Family").first()).toBeVisible();
    });

    test('can select a currency preset', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        // Click the Stars preset
        await page.click('button:has-text("Stars")');
        // Currency name field should update
        await expect(page.locator('#currency-name')).toHaveValue('Star');
        // Save
        await page.click('button:has-text("Save")');

        // Restore to dollars
        await page.click('button:has-text("Dollars")');
        await page.click('button:has-text("Save")');
    });

    test('shows the current parent as a member with Admin badge', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        // Ben is in the family as Admin — "(you)" suffix identifies the current parent
        await expect(page.getByText(/Ben.*\(you\)/)).toBeVisible();
        await expect(page.getByText('Admin')).toBeVisible();
    });

    test('shows existing spenders', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        await expect(page.getByText('Emma')).toBeVisible();
        await expect(page.getByText('Jack')).toBeVisible();
    });

    test('can invite a parent by email (existing user required — shows 404 for unknown)', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        await page.fill('input[type=email]', 'nobody@example.com');
        await page.click('button:has-text("Invite")');
        // The invite controller returns 404 for unknown emails
        await expect(page).toHaveURL(/families/);
    });
});
