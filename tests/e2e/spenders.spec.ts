import { test, expect } from './fixtures';

test.describe('Spenders index', () => {
    test.describe.configure({ mode: 'serial' });

    test('shows kids index page via nav link', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('link', { name: 'Kids' }).first().click();
        await expect(page).toHaveURL('/spenders');
        await expect(page.getByRole('heading', { name: 'Kids' })).toBeVisible();
    });

    test('lists seeded spenders with balance', async ({ page }) => {
        await page.goto('/spenders');
        await expect(page.getByText('Emma')).toBeVisible();
        await expect(page.getByText('Jack')).toBeVisible();
    });

    test('spender name links to their profile', async ({ page }) => {
        await page.goto('/spenders');
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await expect(page).toHaveURL(/\/spenders\//);
    });
});

test.describe('Spenders', () => {
    test('can view a spender from the dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByRole('heading', { name: 'Emma' })).toBeVisible();
    });

    test('can create a spender', async ({ page }) => {
        await page.goto('/spenders/create');
        await page.fill('#name', 'Lily');
        await page.click('button:has-text("Add Spender")');
        await expect(page).toHaveURL(/\/spenders\//);
        await expect(page.getByText('Lily')).toBeVisible();
    });

    test('shows validation error for empty spender name', async ({ page }) => {
        await page.goto('/spenders/create');
        await page.click('button:has-text("Add Spender")');
        await expect(page.getByText(/name field is required/i)).toBeVisible();
    });

    test('can select a colour for the spender', async ({ page }) => {
        await page.goto('/spenders/create');
        await page.fill('#name', 'ColouredKid');
        // Click the pink colour (#ec4899)
        await page.click('button[aria-label="#ec4899"]');
        await page.click('button:has-text("Add Spender")');
        await expect(page).toHaveURL(/\/spenders\//);
    });

    test('can edit a spender', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        // Navigate to the edit page by appending /edit to the current URL
        const spenderUrl = page.url();
        await page.goto(spenderUrl + '/edit');
        await page.fill('#name', 'Emma-Edited');
        await page.click('button:has-text("Save Changes")');
        await expect(page.getByRole('heading', { name: 'Emma-Edited' })).toBeVisible();

        // Restore original name
        await page.goto(spenderUrl + '/edit');
        await page.fill('#name', 'Emma');
        await page.click('button:has-text("Save Changes")');
    });

    test('shows child login section on spender page for parents', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        // Child login is on the Manage tab
        await page.getByRole('button', { name: 'Manage' }).click();
        await expect(page.getByText('Child Login Accounts')).toBeVisible();
        await expect(page.getByPlaceholder("Child's email address")).toBeVisible();
    });

    test('can send a child invitation and see it as pending', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        // Switch to Manage tab
        await page.getByRole('button', { name: 'Manage' }).click();
        await page.fill('input[type="email"]', 'newchild@example.com');
        await page.getByRole('button', { name: 'Invite' }).click();

        // Confirmation modal should appear
        await expect(page.getByText('Invite child account')).toBeVisible();
        await expect(page.getByText('newchild@example.com')).toBeVisible();
        await expect(page.getByText("What they'll get access to")).toBeVisible();

        // Confirm the invitation
        await page.getByRole('button', { name: 'Send invitation' }).click();

        await expect(page.getByText('newchild@example.com')).toBeVisible();
        await expect(page.getByText('Pending')).toBeVisible();
    });

    test('can set a weekly pocket money schedule', async ({ page }) => {
        await page.goto('/spenders');
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        const spenderUrl = page.url();
        await page.goto(spenderUrl + '/edit');
        await expect(page.getByRole('heading', { name: 'Edit Spender' })).toBeVisible();

        await page.fill('#pm-amount', '5.00');
        await page.getByRole('button', { name: 'Fri' }).click();
        await page.getByRole('button', { name: 'Set schedule' }).click();
        await page.waitForTimeout(3000);

        // Navigate away and back to confirm schedule was saved
        await page.goto('/spenders');
        await page.getByRole('link', { name: 'Emma' }).first().click();
        await expect(page).toHaveURL(/\/spenders\//);
        await page.goto(page.url() + '/edit');

        // Should show the active schedule
        await expect(page.getByText(/Active:/i)).toBeVisible({ timeout: 10000 });
    });


    test('shows Spend and Add buttons on account cards', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await expect(page.getByRole('button', { name: /Spend/i }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /Add/i }).first()).toBeVisible();
    });

    test('clicking Add on an account card opens the quick transaction modal', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: /Add/i }).first().click();
        await expect(page.getByText('Add money')).toBeVisible();
    });

    test('clicking Spend on an account card opens the modal in debit mode', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: /Spend/i }).first().click();
        // The modal should open — the debit toggle should be active
        await expect(page.getByText('Deduct')).toBeVisible();
    });

    test('can add money to an account from the spender page', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: /Add/i }).first().click();
        await expect(page.getByText('Add money')).toBeVisible();
        await page.fill('#quick-amount', '5');
        await page.getByRole('button', { name: /Add \$5/i }).click();

        // Submitting redirects to the account show page
        await expect(page).toHaveURL(/\/accounts\//, { timeout: 10000 });
    });

    test('shows tab navigation on spender page', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await expect(page.getByRole('button', { name: 'Accounts' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Goals' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Chores' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Transactions' })).toBeVisible();
    });

    test('switching to Transactions tab shows transaction history', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: 'Transactions' }).click();
        // Should show the transactions tab content (either transactions or empty state)
        await expect(page.locator('text=/No transactions yet|Transaction/i').first()).toBeVisible();
    });

    test('switching to Goals tab shows savings goals', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: 'Goals' }).click();
        // Should show goals content
        await expect(page.locator('text=/Goals|No savings goals/i').first()).toBeVisible();
    });

    test('switching to Chores tab shows chore list', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: 'Chores' }).click();
        // Should show chores content
        await expect(page.locator('text=/No chores|Chore|chore/i').first()).toBeVisible();
    });

    test('can switch to child view and see the exit banner', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByText('Emma').first().click();
        await expect(page).toHaveURL(/\/spenders\//);

        await page.getByRole('button', { name: /View as Emma/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        // Dashboard shows Emma's kid view with the back button
        await expect(page.getByText("Emma's view")).toBeVisible();

        // Return to parent view
        await page.getByRole('button', { name: /Back to parent view/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText("Emma's view")).not.toBeVisible();
    });
});
