// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    expect: {
        timeout: 10000,
    },
    fullyParallel: false,
    forbidOnly: false,
    retries: 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
    ],
    use: {
        baseURL: 'http://127.0.0.1:5500',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});