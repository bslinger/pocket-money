import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    timeout: 30000,
    use: {
        baseURL: 'http://localhost',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'setup',
            testMatch: '**/setup/*.setup.ts',
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],

    globalSetup: './tests/e2e/global-setup.ts',
});
