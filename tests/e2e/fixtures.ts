import { test as base, BrowserContext } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

type WorkerFixtures = {
    workerIndex: number;
    workerDatabase: void;
    workerStorageState: string;
};

type TestFixtures = {
    /**
     * Path to a storage-state file, null for no auth, or undefined (default)
     * to use the per-worker authenticated state.
     */
    storageStatePath: string | null | undefined;
    context: BrowserContext;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
    workerIndex: [async ({}, use, workerInfo) => {
        await use(workerInfo.workerIndex);
    }, { scope: 'worker' }],

    workerDatabase: [async ({ workerIndex }, use) => {
        const artisan = process.env.LARAVEL_SAIL
            ? 'php artisan'
            : './vendor/bin/sail artisan';
        execSync(`${artisan} test:db:prepare ${workerIndex}`, {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        await use();
    }, { scope: 'worker' }],

    workerStorageState: [async ({ browser, workerIndex, workerDatabase }, use) => {
        const authDir = path.join(process.cwd(), 'tests/e2e/.auth');
        fs.mkdirSync(authDir, { recursive: true });
        const authFile = path.join(authDir, `user_${workerIndex}.json`);

        const ctx = await browser.newContext({
            extraHTTPHeaders: { 'X-Test-DB': String(workerIndex) },
        });
        const page = await ctx.newPage();
        await page.goto('/login');
        await page.fill('#email', 'ben@example.com');
        await page.fill('#password', 'test1234');
        await page.click('button[type=submit]');
        await page.waitForURL('/dashboard');
        await ctx.storageState({ path: authFile });
        await ctx.close();

        await use(authFile);
    }, { scope: 'worker' }],

    // Test-level option: undefined = use workerStorageState, null = no auth, string = custom path
    storageStatePath: [async ({}, use) => { await use(undefined); }, { option: true }],

    context: async ({ browser, storageStatePath, workerStorageState, workerIndex }, use) => {
        const resolvedStorageState = storageStatePath === undefined
            ? workerStorageState          // default: per-worker authenticated state
            : (storageStatePath ?? undefined); // null → undefined = no storage state

        const context = await browser.newContext({
            storageState: resolvedStorageState,
            extraHTTPHeaders: { 'X-Test-DB': String(workerIndex) },
        });
        await use(context);
        await context.close();
    },
});

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';
