import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 2 : 1,
    outputDir: '/tmp/pw-test-results',
    reporter: process.env.CI
        ? [['dot'], ['junit', { outputFile: 'test-results/e2e-junit.xml' }]]
        : 'list',
    timeout: 30000,
    use: {
        baseURL: process.env.APP_URL ?? 'http://localhost',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
});
