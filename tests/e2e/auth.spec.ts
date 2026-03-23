import { test, expect } from './fixtures';

// Auth tests run without saved auth state
test.use({ storageStatePath: null });

test.describe('Login', () => {
    test('shows the login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('button', { name: /^log in$/i })).toBeVisible();
    });

    test('logs in with valid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'ben@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('shows error with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'ben@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type=submit]');
        await expect(page.getByText(/these credentials do not match/i)).toBeVisible();
    });

    test('redirects authenticated users away from login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'ben@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await expect(page).toHaveURL('/dashboard');
        // Authenticated users visiting /login are redirected away
        await page.goto('/login');
        await expect(page).not.toHaveURL('/login');
    });
});

test.describe('Register', () => {
    test('registers a new user', async ({ page }) => {
        await page.goto('/register');
        await page.fill('#name', 'Test User');
        await page.fill('#email', `test+${Date.now()}@example.com`);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        // After registration, lands on onboarding, verify-email, or dashboard
        await expect(page).toHaveURL(/onboarding|verify-email|dashboard/);
    });

    test('shows validation error when passwords do not match', async ({ page }) => {
        // Register fields have `required` attribute so we must fill them all;
        // submitting with mismatched passwords triggers a server-side validation error.
        await page.goto('/register');
        await page.fill('#name', 'Test User');
        await page.fill('#email', 'mismatch@example.com');
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'differentpassword');
        await page.click('button[type=submit]');
        await expect(page.getByText(/confirmation does not match|passwords.*not match/i)).toBeVisible();
    });
});

test.describe('Logout', () => {
    // Use a fresh login (not the shared storageState) so we don't invalidate
    // the session cookie that other tests rely on.
    test('logs out successfully', async ({ page }) => {
        await page.goto('/login');
        await page.fill('#email', 'ben@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await expect(page).toHaveURL('/dashboard');

        // Logout is inside a Radix DropdownMenu — open it first, then click "Log out"
        await page.getByRole('button', { name: /ben/i }).first().click();
        await page.getByText('Log out').click();
        await expect(page).toHaveURL('/');
    });
});

test.describe('Forgot password', () => {
    test('shows the forgot password page', async ({ page }) => {
        await page.goto('/forgot-password');
        await expect(page.getByRole('button', { name: /email password reset link/i })).toBeVisible();
    });

    test('accepts a valid email and shows confirmation', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.fill('input[type=email]', 'ben@example.com');
        await page.getByRole('button', { name: /email password reset link/i }).click();
        // Laravel shows a success status message after sending the reset link
        await expect(page.getByText(/we have emailed your password reset link/i)).toBeVisible();
    });
});
