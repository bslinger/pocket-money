import { test, expect } from './fixtures';

test.describe('Family admin controls', () => {
    test('admin sees role toggle buttons for other members', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        // The unverified user is a member of Ben's Family
        await expect(page.getByText('Unverified User')).toBeVisible();
        // Admin should see role toggle (button with "Member" text)
        await expect(page.getByRole('button', { name: /Member/ })).toBeVisible();
    });

    test('admin sees remove button for other members', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        // There should be a trash/remove button (not for self)
        const memberRow = page.locator('li').filter({ hasText: 'Unverified User' });
        await expect(memberRow.getByRole('button').last()).toBeVisible();
    });

    test('admin sees the invite form', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();
        await expect(page.getByPlaceholder(/Invite a parent/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Invite/ })).toBeVisible();
    });

    test('pending invitations show in the members list after inviting', async ({ page }) => {
        await page.goto('/families');
        await page.getByRole('link', { name: 'View' }).first().click();

        // Invite an unknown email to create a pending invitation
        await page.fill('input[type=email]', 'pendingtest@example.com');
        await page.getByRole('button', { name: /Invite/ }).click();

        // Inertia redirects back — wait for the success message or the pending email to appear
        await expect(page.getByText('pendingtest@example.com')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Pending', { exact: true })).toBeVisible();
    });
});

test.describe('Email verification badge', () => {
    test('verified user does not see unverified badge', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText('Unverified')).not.toBeVisible();
    });
});

test.describe('Unverified user', () => {
    // Log in as the unverified user
    test.use({ storageStatePath: null });

    test('unverified user sees the unverified badge after login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'unverified@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await page.waitForURL('/dashboard');

        await expect(page.locator('nav').getByText('Unverified')).toBeVisible();
    });

    test('unverified badge links to verification page', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'unverified@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await page.waitForURL('/dashboard');

        await page.locator('nav').getByText('Unverified').click();
        await page.waitForURL('/verify-email');
        await expect(page.getByText(/Email not yet verified/)).toBeVisible();
    });

    test('verification page shows limitations and trial warning', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'unverified@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await page.waitForURL('/dashboard');

        await page.goto('/verify-email');
        await expect(page.getByText(/Invite other parents/)).toBeVisible();
        await expect(page.getByText(/Transfer billing/)).toBeVisible();
        await expect(page.getByText(/unverified by the end/i)).toBeVisible();
        await expect(page.getByText(/Resend Verification Email/)).toBeVisible();
    });
});
