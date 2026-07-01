// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ── Load credentials from .env (git-ignored) ─────────────────────────────────
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
if (!process.env.PULSE_EMAIL || !process.env.PULSE_PASSWORD) {
    console.warn('⚠️  PULSE_EMAIL / PULSE_PASSWORD not set — copy .env.example to .env');
}

module.exports = defineConfig({
    // ── Test Discovery ────────────────────────────────────────────────────────
    testDir: './tests',

    // ── Execution ─────────────────────────────────────────────────────────────
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    timeout: 90000,

    // ── Reporting ─────────────────────────────────────────────────────────────
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
    ],

    // ── Shared Settings ───────────────────────────────────────────────────────
    use: {
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        actionTimeout: 30000,
        navigationTimeout: 30000,
    },

    outputDir: 'test-results/',

    // ── Projects ──────────────────────────────────────────────────────────────
    projects: [
        {
            name: 'Google Chrome',
            use: {
                channel: 'chrome',
                viewport: null,
                launchOptions: {
                    headless: false,  // ← add this
                    slowMo: 100,
                    args: ['--start-maximized'],
                },
            },
        },
        {
            name: 'chromium',
            use: {
                viewport: { width: 1920, height: 1080 },
                launchOptions: {
                    slowMo: 100,
                },
            },
        },
    ],
});