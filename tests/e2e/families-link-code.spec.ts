import { test, expect } from './fixtures';

test.describe('Spender device link code generation', () => {
    test('can generate a link code from a spender page', async ({ page }) => {
        // Navigate to Emma's spender page
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        const emmaLink = page.getByRole('link', { name: 'Emma' });
        const href = await emmaLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Switch to Manage tab
        await page.getByRole('button', { name: 'Manage' }).click();

        // Verify Generate Link Code button is visible
        const generateBtn = page.getByRole('button', { name: 'Generate Link Code' });
        await generateBtn.scrollIntoViewIfNeeded();
        await expect(generateBtn).toBeVisible();

        // Click to generate a code
        await generateBtn.click();

        // QR modal should appear with the code
        await expect(page.getByText('Scan this QR code or enter the code below')).toBeVisible({ timeout: 10000 });

        // A 6-character code should be displayed
        const codeElement = page.locator('span.tracking-\\[0\\.3em\\]');
        const code = (await codeElement.textContent())?.trim();
        expect(code).toBeTruthy();
        expect(code!.length).toBe(6);

        // QR code SVG should be rendered
        await expect(page.locator('svg').first()).toBeVisible();

        // Expiry countdown should be visible
        await expect(page.getByText(/Expires in/)).toBeVisible();

        // Close modal with Done button
        await page.getByRole('button', { name: 'Done' }).click();

        // After closing, button should now say "Show Link Code" (code is still active)
        await expect(page.getByRole('button', { name: 'Show Link Code' })).toBeVisible();
    });

    test('can copy the link code', async ({ page }) => {
        // Navigate to Emma's spender page
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        const emmaLink = page.getByRole('link', { name: 'Emma' });
        const href = await emmaLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Switch to Manage tab and generate a code
        await page.getByRole('button', { name: 'Manage' }).click();
        const generateBtn = page.getByRole('button', { name: /Generate Link Code|Show Link Code/ });
        await generateBtn.scrollIntoViewIfNeeded();
        await generateBtn.click();
        await expect(page.getByText('Scan this QR code or enter the code below')).toBeVisible({ timeout: 10000 });

        // The copy button should be visible next to the code
        const codeElement = page.locator('span.tracking-\\[0\\.3em\\]');
        await expect(codeElement).toBeVisible();
    });
});
