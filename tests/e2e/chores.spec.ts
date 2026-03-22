import { test, expect } from './fixtures';

test.describe('Chores', () => {
    test('can view the chores list', async ({ page }) => {
        await page.goto('/chores');
        await expect(page.getByRole('heading', { name: 'Chores', exact: true })).toBeVisible();
    });

    test('can create an earns chore', async ({ page }) => {
        await page.goto('/chores/create');
        await page.fill('#name', 'Test Earns Chore');
        // "Earns" is the default — click it to be explicit
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '1.50');
        await page.selectOption('select', 'weekly');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Test Earns Chore')).toBeVisible();
    });

    test('can create a responsibility chore', async ({ page }) => {
        await page.goto('/chores/create');
        await page.fill('#name', 'Test Responsibility Chore');
        await page.click('button:has-text("Responsibility")');
        await page.selectOption('select', 'daily');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Test Responsibility Chore')).toBeVisible();
    });

    test('can create a one-off chore', async ({ page }) => {
        await page.goto('/chores/create');
        await page.fill('#name', 'Clean garage');
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '5.00');
        await page.selectOption('select', 'one_off');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Clean garage')).toBeVisible();
    });

    test('shows validation error for missing chore name', async ({ page }) => {
        await page.goto('/chores/create');
        await page.click('button:has-text("Create Chore")');
        await expect(page.getByText(/name field is required/i)).toBeVisible();
    });

    test('shows amount field only for earns reward type', async ({ page }) => {
        await page.goto('/chores/create');
        await expect(page.locator('#amount')).toBeVisible();
        await page.click('button:has-text("Responsibility")');
        await expect(page.locator('#amount')).not.toBeVisible();
        await page.click('button:has-text("No reward")');
        await expect(page.locator('#amount')).not.toBeVisible();
    });

    test('can edit a chore', async ({ page }) => {
        // First create one
        await page.goto('/chores/create');
        await page.fill('#name', 'Editable Chore');
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '1.00');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Editable Chore')).toBeVisible();

        // Edit it — find the pencil/edit button in the same row
        const choreRow = page.locator('.divide-y > div').filter({ hasText: 'Editable Chore' });
        await choreRow.getByRole('link').last().click();
        await expect(page).toHaveURL(/\/chores\/.*\/edit/);
        await page.fill('#name', 'Edited Chore');
        await page.click('button:has-text("Save Changes")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Edited Chore')).toBeVisible();
    });

    test('can delete a chore', async ({ page }) => {
        // Create a chore to delete
        await page.goto('/chores/create');
        await page.fill('#name', 'Delete Me Chore');
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '1.00');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Delete Me Chore')).toBeVisible();

        // Accept the confirm dialog and click the delete (trash) button in that row
        page.once('dialog', dialog => dialog.accept());
        const choreRow = page.locator('.divide-y > div').filter({ hasText: 'Delete Me Chore' });
        // Delete button is the last button in the row (after the edit link)
        await choreRow.locator('button').last().click();
        await expect(page.getByText('Delete Me Chore')).not.toBeVisible();
    });

    test('can view chore history page', async ({ page }) => {
        // Create a chore
        await page.goto('/chores/create');
        await page.fill('#name', 'History Test Chore');
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '1.00');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('History Test Chore')).toBeVisible();

        // Click the history button (clock icon)
        const choreRow = page.locator('.divide-y > div').filter({ hasText: 'History Test Chore' });
        await choreRow.getByTitle('History').click();
        await expect(page).toHaveURL(/\/chores\/.*\/history/);
        await expect(page.getByText('History Test Chore')).toBeVisible();
        await expect(page.getByText('No completions yet.')).toBeVisible();
    });

    test('can view the schedule tab with daily chores', async ({ page }) => {
        // Create a daily chore for Emma
        await page.goto('/chores/create');
        await page.fill('#name', 'Daily Schedule Chore');
        await page.click('button:has-text("Responsibility")');
        await page.selectOption('select', 'daily');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');

        // Wait for redirect to chores list, then switch to Schedule tab
        await page.waitForURL('/chores');
        await page.click('button:has-text("Schedule")');
        await expect(page.getByText('Today')).toBeVisible();
        await expect(page.getByText('Daily Schedule Chore').first()).toBeVisible();
    });

    test('schedule tab shows yesterday summary above Today card', async ({ page }) => {
        // Create a daily chore — it will be scheduled for yesterday too
        await page.goto('/chores/create');
        await page.fill('#name', 'Yesterday Summary Chore');
        await page.click('button:has-text("Responsibility")');
        await page.selectOption('select', 'daily');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');

        await page.waitForURL('/chores');
        await page.click('button:has-text("Schedule")');

        // Yesterday summary should appear above Today
        const yesterdayBtn = page.getByRole('button', { name: /Yesterday/ }).first();
        await expect(yesterdayBtn).toBeVisible();

        // Clicking the yesterday summary should expand it to show chore details
        await yesterdayBtn.click();
        await expect(page.getByText('Yesterday Summary Chore').first()).toBeVisible();
    });

    test('can filter chores by kid', async ({ page }) => {
        // Create a chore assigned only to Emma
        await page.goto('/chores/create');
        await page.fill('#name', 'Emma Only Chore');
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '2.00');
        await page.click('button:has-text("Emma")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Emma Only Chore')).toBeVisible();

        // Create a chore assigned only to Jack
        await page.goto('/chores/create');
        await page.fill('#name', 'Jack Only Chore');
        await page.click('button:has-text("Earns")');
        await page.fill('#amount', '1.00');
        await page.click('button:has-text("Jack")');
        await page.click('button:has-text("Create Chore")');
        await page.waitForURL('/chores');
        await page.click('button:has-text("Manage")');
        await expect(page.getByText('Jack Only Chore')).toBeVisible();

        // Filter by Emma — should see Emma's chore but not Jack's
        await page.goto('/chores');
        await page.click('button:has-text("Manage")');
        await page.selectOption('select[aria-label="Filter by kid"]', { label: 'Emma' });
        await expect(page.getByText('Emma Only Chore')).toBeVisible();
        await expect(page.getByText('Jack Only Chore')).not.toBeVisible();

        // Filter by Jack — should see Jack's chore but not Emma's
        await page.selectOption('select[aria-label="Filter by kid"]', { label: 'Jack' });
        await expect(page.getByText('Jack Only Chore')).toBeVisible();
        await expect(page.getByText('Emma Only Chore')).not.toBeVisible();

        // Reset filter — both visible
        await page.selectOption('select[aria-label="Filter by kid"]', { value: '' });
        await expect(page.getByText('Emma Only Chore')).toBeVisible();
        await expect(page.getByText('Jack Only Chore')).toBeVisible();
    });
});
