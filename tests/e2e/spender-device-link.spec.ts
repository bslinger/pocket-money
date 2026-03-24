import { test, expect } from './fixtures';

test.describe('Spender device linking', () => {
    test('shows Linked Devices card on manage tab', async ({ page }) => {
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        const emmaLink = page.getByRole('link', { name: 'Emma' });
        const href = await emmaLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Switch to Manage tab
        await page.getByRole('button', { name: 'Manage' }).click();

        await expect(page.getByText('Linked Devices')).toBeVisible();
        await expect(page.getByText('No devices linked yet.')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Generate Link Code' })).toBeVisible();
    });

    test('full lifecycle: generate code, child connects, parent revokes', async ({ page, browser, workerIndex }) => {
        // Navigate to Emma's spender page
        await page.goto('/spenders');
        await page.waitForLoadState('networkidle');
        const emmaLink = page.getByRole('link', { name: 'Emma' });
        const href = await emmaLink.getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Switch to Manage tab
        await page.getByRole('button', { name: 'Manage' }).click();

        // Click "Generate Link Code" — opens QR modal
        const generateBtn = page.getByRole('button', { name: 'Generate Link Code' });
        await generateBtn.scrollIntoViewIfNeeded();
        await generateBtn.click();

        await expect(page.getByText('Scan this QR code or enter the code below')).toBeVisible({ timeout: 10000 });

        // Extract the 6-char code
        const codeElement = page.locator('span.tracking-\\[0\\.3em\\]');
        const code = (await codeElement.textContent())?.trim();
        expect(code).toBeTruthy();
        expect(code!.length).toBe(6);

        // Close modal
        await page.getByRole('button', { name: 'Done' }).click();

        const baseUrl = new URL(page.url()).origin;

        // Child claims the code from a separate context (simulating mobile)
        const childContext = await browser.newContext({
            extraHTTPHeaders: { 'X-Test-DB': String(workerIndex) },
        });
        const claimResponse = await childContext.request.post(`${baseUrl}/api/v1/spender-devices/claim`, {
            data: { code, device_name: 'Test iPad' },
        });
        expect(claimResponse.ok()).toBeTruthy();

        const claimData = await claimResponse.json();
        expect(claimData.data.token).toBeTruthy();
        expect(claimData.data.spender.name).toBe('Emma');
        const deviceToken = claimData.data.token;

        // Child accesses their dashboard
        const dashResponse = await childContext.request.get(`${baseUrl}/api/v1/child/dashboard`, {
            headers: { Authorization: `Bearer ${deviceToken}` },
        });
        expect(dashResponse.ok()).toBeTruthy();
        const dashData = await dashResponse.json();
        expect(dashData.data.spender.name).toBe('Emma');
        expect(dashData.data.accounts).toBeInstanceOf(Array);
        await childContext.close();

        // Parent sees the device
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: 'Manage' }).click();
        await expect(page.getByText('Test iPad')).toBeVisible({ timeout: 5000 });

        // Parent revokes the device
        const revokeBtn = page.locator('a:has(svg.lucide-trash-2), button:has(svg.lucide-trash-2)').first();
        await revokeBtn.scrollIntoViewIfNeeded();
        await revokeBtn.click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('Test iPad')).not.toBeVisible({ timeout: 5000 });

        // Revoked token is rejected
        const revokedContext = await browser.newContext({
            extraHTTPHeaders: { 'X-Test-DB': String(workerIndex) },
        });
        const revokedResponse = await revokedContext.request.get(`${baseUrl}/api/v1/child/dashboard`, {
            headers: { Authorization: `Bearer ${deviceToken}` },
        });
        expect(revokedResponse.status()).toBe(401);
        await revokedContext.close();
    });
});
