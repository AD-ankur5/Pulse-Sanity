const { test, expect } = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const DashboardPage = require('./pages/DashboardPage');
const BasePage = require('./pages/BasePage');

// ─── Test Configuration ────────────────────────────────────────────────────────
const CONFIG = {
    email: process.env.PULSE_EMAIL,
    password: process.env.PULSE_PASSWORD,
    baseUrl: 'https://api.vantagecircle.co.in/',
    dashboardBaseUrl: 'https://dashboard-v2.vantagecircle.co.in'
};

// ─── Suite ────────────────────────────────────────────────────────────────────
test.describe('Pulse_sanity — Full Sanity Suite', () => {

    test.describe.configure({ retries: 0, mode: 'serial', timeout: 90000 });

    let page;
    let loginPage;
    let adminDashboardTab;
    let adminDashboardPage;
    let hasData = true;

    // ── Setup / Teardown ──────────────────────────────────────────────────────

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        if (adminDashboardTab) await adminDashboardTab.close();
        if (page) await page.close();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 1: Login Flow
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-01 | Navigate to Login Page and verify it loads', async () => {
        loginPage = new LoginPage(page);
        const result = await loginPage.navigateToLoginPage();
        expect(result.status, 'Login page should load successfully').toBe('success');
        console.log(`✅ Login page loaded — title: "${result.title}"`);
    });

    test('TC-02 | Login with valid credentials', async () => {
        loginPage = new LoginPage(page);

        const loginResult = await loginPage.login(CONFIG.email, CONFIG.password);
        expect(loginResult.status, 'Login form submission should succeed').toBe('success');

        await page.waitForURL('**/ng/home', { timeout: 30000 });
        expect(page.url()).toContain('/ng/home');
        console.log(`✅ Logged in — redirected to: ${page.url()}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 2: Profile & Admin Dashboard Navigation
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-03 | Click Profile icon and verify dropdown appears', async () => {
        loginPage = new LoginPage(page);

        await loginPage.handleRedeemPopup();

        const result = await loginPage.clickProfile();
        expect(result.status, 'Profile icon should be clickable').toBe('success');

        await expect(
            page.locator("//span[normalize-space()='Admin Dashboard']").first(),
            'Admin Dashboard option should be visible in dropdown'
        ).toBeVisible({ timeout: 10000 });

        console.log('✅ Profile dropdown opened — Admin Dashboard option visible');
    });

    test('TC-04 | Click Admin Dashboard and handle new window/tab', async () => {
        loginPage = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);

        await loginPage.clickAdminDashboard();
        await page.waitForTimeout(1500);

        adminDashboardTab = await dashboardPage.switchToDashboardWindow();
        expect(adminDashboardTab, 'A new admin dashboard tab should have opened').toBeTruthy();

        adminDashboardPage = new DashboardPage(adminDashboardTab);

        console.log(`✅ Switched to admin tab — URL: ${adminDashboardTab.url()}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 3: Vantage Pulse Product Menu
    // ══════════════════════════════════════════════════════════════════════════

    test("TC-05 | Select 'Vantage Pulse' from product menu", async () => {
        adminDashboardPage = new DashboardPage(adminDashboardTab);
        await adminDashboardPage.selectPulseFromMenu();

        await expect(
            adminDashboardTab.locator("//span[normalize-space()='Vantage Pulse']"),
            'Vantage Pulse label should be visible'
        ).toBeVisible();

        expect(adminDashboardTab.url()).toContain('/pulse/dashboard');
        console.log(`✅ Vantage Pulse selected — URL: ${adminDashboardTab.url()}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 4: Dashboard Overview — Sidebar Navigation
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-06 | Click "Create Survey" from sidebar', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[normalize-space()='Create Survey']`);
        expect(res.status, 'Create Survey link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to create-survey-home').toContain('pulse/create-survey-home');
        console.log(`✅ Create Survey clicked — URL: ${url}`);
    });

    test('TC-07 | Click "Dashboard" from sidebar', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[contains(@href,'/pulse/dashboard')]`);
        expect(res.status, 'Dashboard link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to /pulse/dashboard').toContain('/pulse/dashboard');
        console.log(`✅ Dashboard clicked — URL: ${url}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 5: Insights Sub-Navigation
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-08 | Click "Categories" under Insights', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[normalize-space()='Categories']`);
        expect(res.status, 'Categories link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to /pulse/insights/categories').toContain('/pulse/insights/categories');
        console.log(`✅ Categories clicked — URL: ${url}`);
    });

    test('TC-09 | Click "Questions" under Insights', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[normalize-space()='Questions']`);
        expect(res.status, 'Questions link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to questions section').toContain('/pulse/insights');
        console.log(`✅ Questions clicked — URL: ${url}`);
    });

    test('TC-10 | Click "Comments" under Insights', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[contains(@href,'/pulse/insights/feedback') and contains(.,'Comments')]`);
        expect(res.status, 'Comments link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to comments section').toContain('/pulse/insights');
        console.log(`✅ Comments clicked — URL: ${url}`);
    });

    test('TC-11 | Click "Heatmap" under Insights', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[normalize-space()='Heatmap']`);
        expect(res.status, 'Heatmap link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to heatmap section').toContain('/pulse/insights');
        console.log(`✅ Heatmap clicked — URL: ${url}`);
    });

    test('TC-12 | Click "Employee-Lifecycle" under Insights', async () => {
        const basePage = new BasePage(adminDashboardTab);

        const res = await basePage.clickElement(`//a[normalize-space()='Employee lifecycle']`);
        expect(res.status, 'Employee-Lifecycle link should be clickable').toBe('success');

        await adminDashboardTab.waitForTimeout(1000);
        const url = adminDashboardTab.url();
        expect.soft(url, 'Should navigate to employee lifecycle section').toContain('/pulse/insights');
        console.log(`✅ Employee-Lifecycle clicked — URL: ${url}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 6: Dashboard Engagement Chart & Cards
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-13 | Navigate back to Pulse dashboard and click Engagement Index chart', async () => {
        adminDashboardPage = new DashboardPage(adminDashboardTab);
        await adminDashboardPage.navigateToPulseDashboard(CONFIG.dashboardBaseUrl);

        const res = await adminDashboardPage.clickEngagementChart();
        if (res.status === 'no-data') {
            hasData = false;
            console.log('⚠️  No survey data on dashboard — skipping TC-13 through TC-19');
            test.skip();
        }
        expect(res.status, 'Engagement Index chart should be clickable').toBe('success');
        console.log('✅ Engagement Index chart clicked');
    });

    test('TC-14 | Click survey result cards and "View more" in timeline', async () => {
        if (!hasData) { test.skip(); }

        const cardRes = await adminDashboardPage.clickSurveyResultCards();
        expect(cardRes.status, 'Survey result cards should be clickable').toBe('success');

        const timelineRes = await adminDashboardPage.clickViewMoreInTimeline();
        expect(timelineRes.status, '"View more" in timeline should be clickable').toBe('success');
        console.log('✅ Survey cards and timeline "View more" clicked');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 7: Filter Panel — Cycle Through All Filter Types
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-15 | Cycle through all filter types (Department → Grade)', async () => {
        if (!hasData) { test.skip(); }

        const res = await adminDashboardPage.cycleFilterTypes();
        expect(res.status, 'Filter cycling should complete successfully').toBe('success');
        console.log('✅ Filters cycled: Department → Business Unit → BU-Sub → Location → Department → Employee Type → Gender → Grade');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 8: Survey Navigation & What's Working Well
    // ══════════════════════════════════════════════════════════════════════════

    test("TC-16 | Click 'Next' and open \"What's working well\" section", async () => {
        if (!hasData) { test.skip(); }

        await adminDashboardPage.navigateToPulseDashboard(CONFIG.dashboardBaseUrl);

        const nextRes = await adminDashboardPage.clickNextSurvey();
        expect(nextRes.status, '"Next" button should be clickable').toBe('success');

        const wwRes = await adminDashboardPage.clickWhatsWorkingWell();
        expect(wwRes.status, '"What\'s working well" section should be clickable').toBe('success');
        console.log("✅ Navigated to next survey and opened \"What's working well\"");
    });

    test('TC-17 | Open question type filter and toggle all question types', async () => {
        if (!hasData) { test.skip(); }

        const filterRes = await adminDashboardPage.openQuestionTypeFilter();
        expect(filterRes.status, 'Question type filter icon should be clickable').toBe('success');

        const toggleRes = await adminDashboardPage.toggleQuestionTypes();
        expect(toggleRes.status, 'Question type toggles should work').toBe('success');
        console.log('✅ Toggled: Open-Ended → Multi-choice → Rating Questions');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 9: Categories Tab & Table Sorting
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-18 | Switch to Categories tab', async () => {
        if (!hasData) { test.skip(); }

        const res = await adminDashboardPage.switchToCategoriesTab();
        expect(res.status, 'Categories tab should be clickable').toBe('success');
        console.log('✅ Switched to Categories tab');
    });

    test('TC-19 | Sort Categories table by participation, engagement, eNPS, trend, and comments', async () => {
        if (!hasData) { test.skip(); }

        const res = await adminDashboardPage.sortCategoriesTable();
        expect(res.status, 'Table column sorting should work').toBe('success');
        console.log('✅ Sorted by: Participation → Engagement → eNPS → Trend → Comments');
    });

});
