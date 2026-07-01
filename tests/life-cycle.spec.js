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
test.describe('Pulse_sanity — Employee Lifecycle Suite', () => {

    test.describe.configure({ retries: 0, mode: 'serial', timeout: 90000 });

    let page;
    let loginPage;
    let adminDashboardTab;
    let adminDashboardPage;

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
    // SECTION 4: Employee Lifecycle Navigation
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-06 | Navigate to Employee-Lifecycle page', async () => {
        await adminDashboardTab.getByRole('link', { name: 'Employee-Lifecycle' }).click();
        await adminDashboardTab.waitForLoadState('networkidle');

        const url = adminDashboardTab.url();
        expect(url, 'Should navigate to employee lifecycle section').toContain('/pulse/insights');
        console.log(`✅ Employee-Lifecycle page loaded — URL: ${url}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 5: Lifecycle Chart — Select Data Points & Open View Report
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-07 | Click Lifecycle chart data points and open View Report', async () => {
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 335, y: 275 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 468, y: 273 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 340, y: 275 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 465, y: 276 } });
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('button', { name: 'View Report' }).first().click();
        await adminDashboardTab.waitForLoadState('networkidle');

        console.log(`✅ Lifecycle chart data points clicked and View Report opened — URL: ${adminDashboardTab.url()}`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 6: Tenure Band Tabs Navigation
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-08 | Navigate through all tenure band tabs (Early Integration → Organizational Pillars)', async () => {
        await adminDashboardTab.getByRole('tab', { name: 'Early Integration' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: 'Stability & Growth' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: 'Core Contributors' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: 'Experienced Talent' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: 'Institutional Knowledge' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('button', { name: 'Scroll right' }).click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByRole('tab', { name: 'Legacy Contributors' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('button', { name: 'Scroll right' }).click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByRole('button', { name: 'Scroll right' }).click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByRole('tab', { name: 'Veteran Employees' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('button', { name: 'Scroll right' }).click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByRole('tab', { name: 'Organizational Pillars' }).click();
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ All tenure band tabs navigated: Early Integration → Stability & Growth → Core Contributors → Experienced Talent → Institutional Knowledge → Legacy Contributors → Veteran Employees → Organizational Pillars');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 7: Organizational Pillars — Content & Driver Cards
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-09 | Verify Organizational Pillars content and driver cards', async () => {
        await expect(
            adminDashboardTab.getByText('Organizational Pillars Evaluate long-term commitment drivers, legacy impact,'),
            'Organizational Pillars description should be visible'
        ).toBeVisible({ timeout: 10000 });

        await adminDashboardTab.getByText('Organizational Pillars Evaluate long-term commitment drivers, legacy impact,').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.locator('.h-full').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByText('Top PerformerAlignment66 vs').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByText('Needs AttentionRecognition66').click();
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ Organizational Pillars content verified — Top Performer and Needs Attention driver cards visible');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 8: Filter Panel — Cycle Through Filter Types
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-10 | Cycle through filter types and close filter panel in Organizational Pillars view', async () => {
        await adminDashboardTab.locator('.cursor-pointer > svg').first().click();
        await adminDashboardTab.waitForTimeout(300);

        await adminDashboardTab.getByText('Filter By: Department').click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByText('Business Unit').click();
        await adminDashboardTab.waitForTimeout(300);

        await adminDashboardTab.getByText('Filter By: Business Unit').click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByText('BU - Sub Department').click();
        await adminDashboardTab.waitForTimeout(300);

        await adminDashboardTab.getByText('Filter By: BU - Sub Department').click();
        await adminDashboardTab.waitForTimeout(300);
        await adminDashboardTab.getByText('Location').click();
        await adminDashboardTab.waitForTimeout(300);

        // Close filter panel (2 with .ng-star-inserted child, then 8 without)
        await adminDashboardTab.locator('.ng-tns-c3592188533-11 > svg > .ng-star-inserted').click();
        await adminDashboardTab.waitForTimeout(200);
        await adminDashboardTab.locator('.ng-tns-c3592188533-11 > svg > .ng-star-inserted').click();
        await adminDashboardTab.waitForTimeout(200);
        for (let i = 0; i < 8; i++) {
            await adminDashboardTab.locator('.ng-tns-c3592188533-11 > svg').click();
            await adminDashboardTab.waitForTimeout(200);
        }

        console.log('✅ Filter types cycled: Department → Business Unit → BU - Sub Department → Location; filter panel closed');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 9: Onboarding Surveys — Chart Interaction & View Report
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-11 | Navigate to Onboarding Surveys and interact with chart', async () => {
        await adminDashboardTab.getByText('Onboarding Surveys').click();
        await adminDashboardTab.waitForTimeout(1000);

        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 341, y: 275 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 464, y: 275 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 334, y: 276 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 460, y: 275 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 465, y: 276 } });
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ Onboarding Surveys section selected and chart data points clicked');
    });

    test('TC-12 | Open Onboarding View Report and verify 7 Days from joining content', async () => {
        await adminDashboardTab.getByRole('button', { name: 'View Report' }).first().click();
        await adminDashboardTab.waitForLoadState('networkidle');

        await expect(
            adminDashboardTab.getByText('7 Days from joining Gain'),
            '7 Days from joining section should be visible'
        ).toBeVisible({ timeout: 10000 });

        await adminDashboardTab.getByText('7 Days from joining Gain').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.locator('.h-full').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByText('Top PerformerAlignment66 vs').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByText('Needs AttentionRecognition66').click();
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ Onboarding View Report opened — 7 Days from joining content and driver cards verified');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 10: Onboarding Milestone Tabs Navigation
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-13 | Navigate through all Onboarding milestone tabs and close filter panel', async () => {
        await adminDashboardTab.getByRole('tab', { name: '15 Days from joining' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '30 Days from joining' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '45 Days from joining' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '60 Days from joining' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '90 Days from joining' }).click();
        await adminDashboardTab.waitForTimeout(500);

        // Close filter panel (6 times)
        for (let i = 0; i < 6; i++) {
            await adminDashboardTab.locator('.ng-tns-c3592188533-11 > svg').click();
            await adminDashboardTab.waitForTimeout(200);
        }

        console.log('✅ All Onboarding milestone tabs navigated: 15 Days → 30 Days → 45 Days → 60 Days → 90 Days');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 11: Work Anniversary Surveys — Engagement Data & Chart
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-14 | Navigate to Work Anniversary Surveys and verify engagement chart data', async () => {
        await adminDashboardTab.getByText('Work Anniversary Surveys').click();
        await adminDashboardTab.waitForTimeout(1000);

        await expect(
            adminDashboardTab.getByText('Average engagement & attrition risk 3 YearsEngagement Score0Attrition Risk0'),
            'Average engagement & attrition risk section should be visible'
        ).toBeVisible({ timeout: 10000 });

        await adminDashboardTab.getByText('Average engagement & attrition risk 3 YearsEngagement Score0Attrition Risk0').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 339, y: 272 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 467, y: 273 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 335, y: 274 } });
        await adminDashboardTab.waitForTimeout(500);
        await adminDashboardTab.locator('#chart canvas').click({ position: { x: 468, y: 275 } });
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ Work Anniversary Surveys selected — engagement data verified and chart data points clicked');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 12: Work Anniversary — View Report & Year Tabs
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-15 | Open Work Anniversary View Report and navigate through all year tabs', async () => {
        await adminDashboardTab.getByRole('button', { name: 'View Report' }).first().click();
        await adminDashboardTab.waitForLoadState('networkidle');

        await adminDashboardTab.getByRole('tab', { name: '2 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '3 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '5 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '7 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '10 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '7 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '5 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '3 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: '2 Years Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByRole('tab', { name: 'Year Completed' }).click();
        await adminDashboardTab.waitForTimeout(500);

        // Close filter panel (11 times)
        for (let i = 0; i < 11; i++) {
            await adminDashboardTab.locator('.ng-tns-c3592188533-11 > svg').click();
            await adminDashboardTab.waitForTimeout(200);
        }

        console.log('✅ Work Anniversary year tabs navigated: 1 Year → 2 Years → 3 Years → 5 Years → 7 Years → 10 Years and back');
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 13: Survey Filter — Aggregated Score & Report Options
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-16 | Navigate to Onboarding and open specific View Report with survey filter', async () => {
        await adminDashboardTab.getByText('Onboarding Surveys').click();
        await adminDashboardTab.waitForTimeout(1000);

        await adminDashboardTab.getByRole('button', { name: 'View Report' }).nth(5).click();
        await adminDashboardTab.waitForLoadState('networkidle');

        await adminDashboardTab.locator('.ng-tns-c3592188533-11 > svg > .ng-star-inserted').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByText('All Surveys (Aggregated Score)').click();
        await adminDashboardTab.waitForTimeout(500);

        await adminDashboardTab.getByText('timing test1').click();
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ Onboarding View Report (nth 5) opened — filter opened and "All Surveys (Aggregated Score)" / "timing test1" options selected');
    });

    test('TC-17 | Verify survey date range and completion status', async () => {
        await expect(
            adminDashboardTab.getByText('Dec, 2025 - 17 Jan, 2026'),
            'Survey date range "Dec, 2025 - 17 Jan, 2026" should be visible'
        ).toBeVisible({ timeout: 10000 });

        await adminDashboardTab.getByText('Dec, 2025 - 17 Jan, 2026').click();
        await adminDashboardTab.waitForTimeout(500);

        await expect(
            adminDashboardTab.getByText('Survey 101Completed'),
            '"Survey 101 Completed" status should be visible'
        ).toBeVisible({ timeout: 10000 });

        await adminDashboardTab.getByText('Survey 101Completed').click();
        await adminDashboardTab.waitForTimeout(500);

        console.log('✅ Survey date range "Dec, 2025 - 17 Jan, 2026" and "Survey 101 Completed" status verified');
    });

});
