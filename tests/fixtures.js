const base = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const DashboardPage = require('./pages/DashboardPage');
const CreateSurveyPage = require('./pages/CreateSurveyPage');

// ─── Shared Test Configuration ──────────────────────────────────────────────────
const CONFIG = {
    email: process.env.PULSE_EMAIL,
    password: process.env.PULSE_PASSWORD,
    baseUrl: 'https://api.vantagecircle.co.in/',
    dashboardBaseUrl: 'https://dashboard-v2.vantagecircle.co.in',
};

/**
 * Custom fixtures for the Pulse sanity suite.
 *
 * These are WORKER-scoped on purpose: the survey-creation flow is a single
 * serial wizard spread across many tests that all share one admin tab. Logging
 * in per-test would re-open the wizard from scratch and break that continuity,
 * so we log in once per worker and reuse the session across the serial steps.
 *
 *   loggedInPage    → main app tab, authenticated, post-login pop-up dismissed
 *   pulseAdminTab   → HR Admin Dashboard tab, landed on the Vantage Pulse product
 *   createSurveyPage→ CreateSurveyPage page object bound to the Pulse admin tab
 */
const test = base.test.extend({
    // ── Logged-in main tab (login + pop-up handling) ────────────────────────────
    loggedInPage: [async ({ browser }, use) => {
        const page = await browser.newPage();
        const loginPage = new LoginPage(page);

        // SETUP — log in
        await loginPage.navigateToLoginPage();
        const loginResult = await loginPage.login(CONFIG.email, CONFIG.password);
        if (loginResult.status !== 'success') {
            throw new Error(`Login failed: ${loginResult.message}`);
        }
        await page.waitForURL('**/ng/home', { timeout: 30000 });

        // Handle the redeem pop-up that appears after login
        await loginPage.handleRedeemPopup();

        await use(page);

        // TEARDOWN
        await page.close();
    }, { scope: 'worker' }],

    // ── HR Admin Dashboard tab, on Vantage Pulse ────────────────────────────────
    pulseAdminTab: [async ({ loggedInPage }, use) => {
        const loginPage = new LoginPage(loggedInPage);
        const dashboardPage = new DashboardPage(loggedInPage);

        await loginPage.clickProfile();
        const adminTab = await dashboardPage.waitForNewTab(() => loginPage.clickAdminDashboard());

        // Land on the Vantage Pulse product
        await new DashboardPage(adminTab).selectPulseFromMenu();

        await use(adminTab);

        // TEARDOWN — close the admin tab before the main tab is closed
        await adminTab.close().catch(() => {});
    }, { scope: 'worker' }],

    // ── CreateSurveyPage bound to the Pulse admin tab ───────────────────────────
    createSurveyPage: [async ({ pulseAdminTab }, use) => {
        await use(new CreateSurveyPage(pulseAdminTab));
    }, { scope: 'worker' }],
});

const expect = base.expect;

module.exports = { test, expect, CONFIG };
