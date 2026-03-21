import { test, expect } from './fixtures';

// These tests register new users, so they need no pre-existing auth
test.use({ storageStatePath: null });

test.describe('Onboarding wizard', () => {
    test('new user registration redirects to onboarding', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);

        // New users without email verification land on verify-email
        // For local dev, we can hit the dev verify-email shortcut
        await page.goto('/dev/verify-email');
        await expect(page).toHaveURL('/onboarding');
    });

    test('onboarding step 1: family name', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await expect(page).toHaveURL('/onboarding');
        await expect(page.getByText('Welcome to Quiddo')).toBeVisible();
        await expect(page.locator('h2:has-text("Your family")')).toBeVisible();

        // Continue button should be disabled with empty name
        await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled();

        // Enter family name
        await page.fill('#family-name', 'The Testers');
        await expect(page.getByRole('button', { name: /continue/i })).toBeEnabled();

        await page.click('button:has-text("Continue")');

        // Should now be on step 2 (currency)
        await expect(page.getByText("What do your kids earn?")).toBeVisible();
    });

    test('onboarding step 2: currency - select symbol', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');

        // Default is "Real money" with symbol grid visible
        await expect(page.getByText('💵 Real money')).toBeVisible();

        // Select £ symbol
        await page.click('button:has-text("£")');
        await expect(page.locator('button:has-text("£")')).toHaveClass(/border-primary/);

        await page.click('button:has-text("Continue")');
        await expect(page.getByText('Add your kids')).toBeVisible();
    });

    test('onboarding step 2: custom currency shows emoji picker and name fields', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');

        // Switch to custom currency
        await page.click('button:has-text("⭐ Custom currency")');

        // Should show name fields
        await expect(page.locator('#currency-name')).toBeVisible();
        await expect(page.locator('#currency-plural')).toBeVisible();

        await page.fill('#currency-name', 'Star');
        await page.fill('#currency-plural', 'Stars');

        // Preview should appear
        await expect(page.getByText(/Preview:/)).toBeVisible();
    });

    test('onboarding step 3: add 2 kids then create family', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        // Step 1: family name
        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');

        // Step 2: currency (accept default)
        await page.click('button:has-text("Continue")');

        // Step 3: add kids
        await expect(page.getByText('Add your kids')).toBeVisible();
        await page.click('button:has-text("Add a kid")');
        await page.locator('input[placeholder="Kid 1 name"]').fill('Alice');
        await page.click('button:has-text("Add a kid")');
        await page.locator('input[placeholder="Kid 2 name"]').fill('Bob');

        await page.click('button:has-text("Create family")');

        // Should redirect to the Continue page
        await expect(page).toHaveURL(/onboarding\/.*\/continue/);
        await expect(page.getByText('The Testers is ready!')).toBeVisible();
    });

    test('onboarding step 3: add kid with starting balance', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Continue")');

        // Add a kid with a starting balance
        await page.click('button:has-text("Add a kid")');
        await page.locator('input[placeholder="Kid 1 name"]').fill('Lily');
        await page.locator('input[type=number][placeholder="0"]').fill('15');

        await page.click('button:has-text("Create family")');

        // Should redirect to the Continue page
        await expect(page).toHaveURL(/onboarding\/.*\/continue/);
    });

    test('onboarding continue: pocket money step - enable for first kid', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Add a kid")');
        await page.locator('input[placeholder="Kid 1 name"]').fill('Alice');
        await page.click('button:has-text("Create family")');

        // Pocket money step
        await expect(page.getByText('Set up pocket money')).toBeVisible();

        // Enable pocket money for Alice
        const checkbox = page.locator('label:has-text("Alice") input[type=checkbox]');
        await checkbox.check();

        // Fill amount
        await page.locator('input[type=number][placeholder="5.00"]').fill('5.00');

        await page.click('button:has-text("Continue")');

        // Should proceed to chores step
        await expect(page.getByText('Add some chores')).toBeVisible();
    });

    test('onboarding continue: chores step - add a chore', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Add a kid")');
        await page.locator('input[placeholder="Kid 1 name"]').fill('Alice');
        await page.click('button:has-text("Create family")');

        // Skip pocket money
        await page.click('button:has-text("Do this later")');

        // Chores step
        await expect(page.getByText('Add some chores')).toBeVisible();
        await page.click('button:has-text("Add a chore")');
        await page.locator('input[placeholder="Tidy bedroom"]').fill('Wash dishes');
        await page.locator('input[placeholder="2.00"]').fill('2.00');

        await page.click('button:has-text("Continue")');

        // Should go to invite step
        await expect(page.getByText('Invite others')).toBeVisible();
    });

    test('onboarding continue: invite step - go to dashboard', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Add a kid")');
        await page.locator('input[placeholder="Kid 1 name"]').fill('Alice');
        await page.click('button:has-text("Create family")');

        // Skip pocket money
        await page.click('button:has-text("Do this later")');
        // Skip chores
        await page.click('button:has-text("Do this later")');

        // Invite step
        await expect(page.getByText('Invite others')).toBeVisible();

        // Go to dashboard
        await page.click('button:has-text("Go to dashboard")');
        await expect(page).toHaveURL('/dashboard');

        // Dashboard should show the family data
        await expect(page.getByText('The Testers')).toBeVisible();
    });

    test('onboarding continue: skip all via "Skip setup" link', async ({ page }) => {
        const email = `onboard+${Date.now()}@example.com`;
        await page.goto('/register');
        await page.fill('#name', 'New Parent');
        await page.fill('#email', email);
        await page.fill('#password', 'password123');
        await page.fill('#password_confirmation', 'password123');
        await page.click('button[type=submit]');
        await page.waitForURL(/verify-email/);
        await page.goto('/dev/verify-email');

        await page.fill('#family-name', 'The Testers');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Continue")');
        await page.click('button:has-text("Create family")');

        await expect(page).toHaveURL(/onboarding\/.*\/continue/);

        // Skip all
        await page.click('text=Skip setup and go to dashboard');
        await expect(page).toHaveURL('/dashboard');
    });
});
