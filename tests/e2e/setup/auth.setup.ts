import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(import.meta.dirname, '../.auth/user.json');

setup('authenticate as parent', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'ben@example.com');
    await page.fill('#password', 'test1234');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/dashboard');
    await page.context().storageState({ path: authFile });
});
