import { test, expect } from '@playwright/test';

test.describe('Families edit test', () => {
    test('debug: check what happens when editing a family', async ({ page }) => {
        const requests: string[] = [];
        const responses: {url: string, status: number}[] = [];

        page.on('request', req => {
            if (req.method() !== 'GET') {
                requests.push(`${req.method()} ${req.url()}`);
            }
        });
        page.on('response', resp => {
            if (resp.request().method() !== 'GET') {
                responses.push({url: resp.url(), status: resp.status()});
            }
        });

        await page.goto('/families');
        await page.getByRole('link', { name: 'Edit' }).first().click();
        await page.fill('input[type=text]', "Ben's Updated Family");
        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.request().method() !== 'GET'),
            page.click('button[type=submit]'),
        ]);

        console.log('Current URL:', page.url());
        console.log('Response URL:', response.url());
        console.log('Response status:', response.status());
        console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers())));
        const body = await response.text();
        console.log('Response body (first 500 chars):', body.substring(0, 500));
        expect(true).toBe(true);
    });
});
