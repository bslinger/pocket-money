import { test, expect, Page } from './fixtures';

// Known emoji unified codes for reliable test targeting
const EMOJI_UNIFIED: Record<string, string> = {
    star:  '2b50',   // ⭐
    tooth: '1f9b7',  // 🦷
    leaf:  '1f342',  // 🍂 fallen leaf — names[0]="leaf" so pluralize gives "Leaves"
};

// Open the emoji picker, search, and click the matching emoji by unified code when known
async function pickEmojiBySearch(page: Page, searchTerm: string) {
    await page.locator('button[aria-label="Pick emoji"]').click();
    await expect(page.locator('aside.EmojiPickerReact')).toBeVisible();
    await page.locator('input[placeholder="Search emoji…"]').fill(searchTerm);

    const unified = EMOJI_UNIFIED[searchTerm.toLowerCase()];
    const selector = unified
        ? `aside.EmojiPickerReact button[data-unified="${unified}"]`
        : 'aside.EmojiPickerReact button[data-unified]';

    const emoji = page.locator(selector).first();
    await expect(emoji).toBeVisible({ timeout: 5000 });
    await emoji.click();
}

// Register a fresh user and navigate to the onboarding custom currency step
async function goToOnboardingCustomCurrencyStep(page: Page) {
    const email = `plural+${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('#name', 'Test Parent');
    await page.fill('#email', email);
    await page.fill('#password', 'password123');
    await page.fill('#password_confirmation', 'password123');
    await page.click('button[type=submit]');
    await page.waitForURL(/verify-email/);
    await page.goto('/dev/verify-email');
    await page.fill('#family-name', 'The Testers');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("⭐ Custom currency")');
}

test.describe('Currency pluralization — onboarding custom currency', () => {
    test.use({
        viewport: { width: 1280, height: 720 },
        storageStatePath: null,
    });

    test('picking an emoji auto-populates the name and plural fields', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);
        await pickEmojiBySearch(page, 'star');

        await expect(page.locator('#currency-name')).not.toHaveValue('');
        await expect(page.locator('#currency-plural')).not.toHaveValue('');
    });

    test('irregular plural: tooth → Teeth, not Tooths', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);
        await pickEmojiBySearch(page, 'tooth');

        await expect(page.locator('#currency-name')).toHaveValue(/tooth/i, { timeout: 3000 });
        await expect(page.locator('#currency-plural')).toHaveValue('Teeth', { timeout: 3000 });
    });

    test('irregular plural: leaf → Leaves, not Leafs', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);
        await pickEmojiBySearch(page, 'leaf');

        await expect(page.locator('#currency-name')).toHaveValue(/leaf/i, { timeout: 3000 });
        await expect(page.locator('#currency-plural')).toHaveValue(/leaves/i, { timeout: 3000 });
    });

    test('preview text uses the correct pluralized form', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);
        await pickEmojiBySearch(page, 'tooth');

        await expect(page.locator('p:has-text("Preview")')).toContainText('Teeth', { timeout: 3000 });
        await expect(page.locator('p:has-text("Preview")')).not.toContainText('Tooths');
    });

    test('whole numbers label updates with typed currency name', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);

        await page.fill('#currency-name', 'Gem');
        await page.fill('#currency-plural', 'Gems');

        await expect(page.getByText(/1 Gem.*not.*0\.50 Gems/)).toBeVisible();
    });

    test('whole numbers label uses the pluralized form from picker', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);
        await pickEmojiBySearch(page, 'tooth');

        await page.locator('label:has-text("Whole numbers") input[type=checkbox]').check();

        await expect(page.getByText(/1 Tooth/i).first()).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/0\.50 Teeth/i).first()).toBeVisible({ timeout: 3000 });
    });

    test('switching back to real money hides the custom fields', async ({ page }) => {
        await goToOnboardingCustomCurrencyStep(page);

        await page.fill('#currency-name', 'Star');

        await page.click('button:has-text("💵 Real money")');

        // Symbol grid should reappear, custom name fields hidden
        await expect(page.locator('button:has-text("$")')).toBeVisible();
        await expect(page.locator('#currency-name')).not.toBeVisible();
    });
});

test.describe('Currency pluralization — account create currency override', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('irregular plural: tooth → Teeth in account currency override', async ({ page }) => {
        await page.goto('/accounts/create');

        await page.locator('label:has-text("Custom currency for this account") input[type=checkbox]').check();
        await page.click('button:has-text("⭐ Custom")');

        await pickEmojiBySearch(page, 'tooth');

        await expect(page.locator('#currency_name')).toHaveValue(/tooth/i, { timeout: 3000 });
        await expect(page.locator('#currency_name_plural')).toHaveValue('Teeth', { timeout: 3000 });
    });

    test('preview shows correct plural in account currency override', async ({ page }) => {
        await page.goto('/accounts/create');

        await page.locator('label:has-text("Custom currency for this account") input[type=checkbox]').check();
        await page.click('button:has-text("⭐ Custom")');

        await pickEmojiBySearch(page, 'tooth');

        await expect(page.locator('p:has-text("Preview")')).toContainText('Teeth', { timeout: 3000 });
        await expect(page.locator('p:has-text("Preview")')).not.toContainText('Tooths');
    });

    test('real money symbol grid appears by default when override is enabled', async ({ page }) => {
        await page.goto('/accounts/create');

        await page.locator('label:has-text("Custom currency for this account") input[type=checkbox]').check();

        // Default override mode is real money — symbol grid visible
        await expect(page.locator('button:has-text("£")')).toBeVisible();

        // Select £ and verify it is highlighted
        await page.click('button:has-text("£")');
        await expect(page.locator('button:has-text("£")')).toHaveClass(/border-eucalyptus-400/);
    });
});
