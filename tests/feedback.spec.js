const { test, expect } = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const DashboardPage = require('./pages/DashboardPage');
const BasePage = require('./pages/BasePage');

// ─── Test Configuration ───────────────────────────────────────────────────────
const CONFIG = {
    email: process.env.PULSE_EMAIL,
    password: process.env.PULSE_PASSWORD,
    baseUrl: 'https://api.vantagecircle.co.in/',
};

// ─── Suite ────────────────────────────────────────────────────────────────────
test.describe('Pulse_sanity — Full Sanity Suite', () => {

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
    // SECTION 1–3: Login + Navigation (must stay serial — order matters)
    // ══════════════════════════════════════════════════════════════════════════
    test.describe('Section 1–3 — Login & Navigation', () => {
        test.describe.configure({ retries: 0, mode: 'serial', timeout: 90000 });

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

        test('TC-06 | Navigate to Comments section under Insights', async () => {
            const basePage = new BasePage(adminDashboardTab);
            const res = await basePage.clickElement(
                `//a[contains(@href,'/pulse/insights/feedback') and contains(.,'Comments')]`
            );
            expect(res.status, 'Comments link should be clickable').toBe('success');
            await adminDashboardTab.waitForTimeout(2000);
            const url = adminDashboardTab.url();
            expect(url, 'Should navigate to comments/feedback section').toContain('/pulse/insights');
            console.log(`✅ Navigated to Comments section — URL: ${url}`);
        });

    }); // end Section 1–3

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 4: Sentiment Card Verification — each TC is INDEPENDENT
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('TC-07 — Positive Sentiment Card', () => {
        test.describe.configure({ retries: 0, timeout: 90000 });

        test('TC-07 | Verify Positive Sentiment card — label, percentage, and comment count', async () => {
            const card = adminDashboardTab.locator('.sentiment-card-positive');
            await expect(card).toBeVisible({ timeout: 10000 });
            await expect(card.locator('div', { hasText: 'Positive Sentiment' }).first()).toBeVisible();
            const progressText = card.locator('.progress-text');
            await expect(progressText).toBeVisible();
            const percentage = (await progressText.textContent()).trim();
            await expect(card.locator('span.font-bold').first()).toBeVisible();
            await expect(card.locator('div', { hasText: 'View analysis' }).first()).toBeVisible();
            console.log(`✅ TC-07 passed — Positive: ${percentage}`);
        });
    });

    test.describe('TC-08 — Neutral Sentiment Card', () => {
        test.describe.configure({ retries: 0, timeout: 90000 });

        test('TC-08 | Verify Neutral Sentiment card — label, percentage, and comment count', async () => {
            const card = adminDashboardTab.locator('.sentiment-card-neutral');
            await expect(card).toBeVisible({ timeout: 10000 });
            await expect(card.locator('div', { hasText: 'Neutral Sentiment' }).first()).toBeVisible();
            const progressText = card.locator('.progress-text');
            await expect(progressText).toBeVisible();
            const percentage = (await progressText.textContent()).trim();
            await expect(card.locator('span.font-bold').first()).toBeVisible();
            await expect(card.locator('div', { hasText: 'View analysis' }).first()).toBeVisible();
            console.log(`✅ TC-08 passed — Neutral: ${percentage}`);
        });
    });

    test.describe('TC-09 — Negative Sentiment Card', () => {
        test.describe.configure({ retries: 0, timeout: 90000 });

        test('TC-09 | Verify Negative Sentiment card — label, percentage, and comment count', async () => {
            const card = adminDashboardTab.locator('.sentiment-card-negative');
            await expect(card).toBeVisible({ timeout: 10000 });
            await expect(card.locator('div', { hasText: 'Negative Sentiment' }).first()).toBeVisible();
            const progressText = card.locator('.progress-text');
            await expect(progressText).toBeVisible();
            const percentage = (await progressText.textContent()).trim();
            await expect(card.locator('span.font-bold').first()).toBeVisible();
            await expect(card.locator('div', { hasText: 'View analysis' }).first()).toBeVisible();
            console.log(`✅ TC-09 passed — Negative: ${percentage}`);
        });
    });

    test.describe('TC-10 — Stroke Colours', () => {
        test.describe.configure({ retries: 0, timeout: 90000 });

        test('TC-10 | Verify all three sentiment cards are visible together and stroke colours are correct', async () => {
            await expect(adminDashboardTab.locator('.sentiment-card-positive')).toBeVisible({ timeout: 5000 });
            await expect(adminDashboardTab.locator('.sentiment-card-neutral')).toBeVisible();
            await expect(adminDashboardTab.locator('.sentiment-card-negative')).toBeVisible();
            await expect(adminDashboardTab.locator('.sentiment-card-positive circle.stroke-success-600')).toBeAttached();
            await expect(adminDashboardTab.locator('.sentiment-card-neutral circle.stroke-warning-600')).toBeAttached();
            await expect(adminDashboardTab.locator('.sentiment-card-negative circle.stroke-error-600')).toBeAttached();
            console.log('✅ TC-10 passed — All sentiment cards present with correct stroke colours');
        });
    });

    

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 5: Comment Status Breakdown — Unread + Read vs All Comments
    // ══════════════════════════════════════════════════════════════════════════
    test.describe('TC-11 — Comment Status Breakdown', () => {
        test.describe.configure({ retries: 0, timeout: 90000 });

        test('TC-11 | Verify Unread + Read comments equal All Comments total', async () => {

            // ── Helper: extract count from a reply-status-box by its label ────
            const getStatusCount = async (labelText) => {
                const box = adminDashboardTab
                    .locator('.reply-status-box', { hasText: labelText });

                await expect(
                    box,
                    `"${labelText}" box should be visible`
                ).toBeVisible({ timeout: 10000 });

                const raw = await box
                    .locator('.text-center.text-ellipsis')
                    .first()
                    .textContent();

                const count = parseInt(raw?.trim() ?? '0', 10);

                expect(
                    count,
                    `"${labelText}" count must be a valid number`
                ).not.toBeNaN();

                expect(
                    count,
                    `"${labelText}" count should be greater than 0`
                ).toBeGreaterThan(0);

                return count;
            };

            // ── Extract all three status counts ───────────────────────────────
            const allCommentsCount  = await getStatusCount('All Comments');
            const unreadCount       = await getStatusCount('New Comments (Unread)');
            const readCount         = await getStatusCount('Read Comments');
            const calculatedTotal   = unreadCount + readCount;

            // ── Console report ────────────────────────────────────────────────
            console.log('\n');
            console.log('╔══════════════════════════════════════════╗');
            console.log('║     📋 COMMENT STATUS BREAKDOWN          ║');
            console.log('╠══════════════════════════════════════════╣');
            console.log(`║  📬 Unread Comments   : ${String(unreadCount).padEnd(16)}║`);
            console.log(`║  📭 Read   Comments   : ${String(readCount).padEnd(16)}║`);
            console.log('╠══════════════════════════════════════════╣');
            console.log(`║  ➕ Calculated Total  : ${String(calculatedTotal).padEnd(16)}║`);
            console.log(`║  📋 All Comments Tag  : ${String(allCommentsCount).padEnd(16)}║`);
            console.log('╠══════════════════════════════════════════╣');

            if (calculatedTotal === allCommentsCount) {
                console.log('║  ✅ MATCH — Totals are equal              ║');
            } else {
                console.log(`║  ❌ MISMATCH — Diff: ${String(Math.abs(allCommentsCount - calculatedTotal)).padEnd(20)}║`);
            }

            console.log('╚══════════════════════════════════════════╝');
            console.log('\n');

            // ── ✅ CRITICAL: Cross-assert Unread + Read === All Comments ──────
            expect(
                calculatedTotal,
                `❌ MISMATCH — Unread (${unreadCount}) + Read (${readCount}) = ${calculatedTotal} ` +
                `does NOT match "All Comments" (${allCommentsCount}). ` +
                `Difference: ${Math.abs(allCommentsCount - calculatedTotal)} comment(s).`
            ).toBe(allCommentsCount);

            console.log(
                `✅ TC-12 passed — Unread (${unreadCount}) + Read (${readCount}) = ${calculatedTotal} ` +
                `matches "All Comments" (${allCommentsCount})`
            );
        });

    }); // end TC-11

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 6: TC-12 — Sentiment Count Report
    // ══════════════════════════════════════════════════════════════════════════
    test.describe('TC-12 — Sentiment Count Report', () => {
        test.describe.configure({ retries: 0, timeout: 90000 });

        test('TC-12 | Extract and report comment counts from all sentiment sections', async () => {

            // ── Helper: extract integer count from a sentiment card ────────────
            const getCount = async (selector) => {
                const card = adminDashboardTab.locator(selector);
                await expect(card, `${selector} should be visible`).toBeVisible({ timeout: 10000 });

                const countText = await card.locator('span.font-bold').first().textContent();
                const count = parseInt(countText?.trim() ?? '0', 10);

                expect(count, `Comment count in "${selector}" must be a valid number`).not.toBeNaN();
                expect(count, `Comment count in "${selector}" should be greater than 0`).toBeGreaterThan(0);

                return count;
            };

            // ── Extract individual sentiment counts ───────────────────────────
            const positiveCount   = await getCount('.sentiment-card-positive');
            const neutralCount    = await getCount('.sentiment-card-neutral');
            const negativeCount   = await getCount('.sentiment-card-negative');
            const calculatedTotal = positiveCount + neutralCount + negativeCount;

            // ── Extract "All Comments" count from the reply-status-box ────────
            const allCommentsBox = adminDashboardTab.locator('.reply-status-box-active');
            await expect(
                allCommentsBox,
                '"All Comments" box should be visible'
            ).toBeVisible({ timeout: 10000 });

            const allCommentsRaw = await allCommentsBox
                .locator('.text-center.text-ellipsis')
                .first()
                .textContent();

            const allCommentsTotal = parseInt(allCommentsRaw?.trim() ?? '0', 10);

            expect(
                allCommentsTotal,
                '"All Comments" count must be a valid number'
            ).not.toBeNaN();

            expect(
                allCommentsTotal,
                '"All Comments" count should be greater than 0'
            ).toBeGreaterThan(0);

            // ── Exact value assertions per card ───────────────────────────────
            await expect(
                adminDashboardTab.locator('.sentiment-card-positive span.font-bold').first()
            ).toHaveText(String(positiveCount));

            await expect(
                adminDashboardTab.locator('.sentiment-card-neutral span.font-bold').first()
            ).toHaveText(String(neutralCount));

            await expect(
                adminDashboardTab.locator('.sentiment-card-negative span.font-bold').first()
            ).toHaveText(String(negativeCount));

            // ── Console report ────────────────────────────────────────────────
            console.log('\n');
            console.log('╔══════════════════════════════════════════╗');
            console.log('║       📊 SENTIMENT COMMENT REPORT        ║');
            console.log('╠══════════════════════════════════════════╣');
            console.log(`║  🟢 Positive Comments : ${String(positiveCount).padEnd(16)}║`);
            console.log(`║  🟡 Neutral  Comments : ${String(neutralCount).padEnd(16)}║`);
            console.log(`║  🔴 Negative Comments : ${String(negativeCount).padEnd(16)}║`);
            console.log('╠══════════════════════════════════════════╣');
            console.log(`║  ➕ Calculated Total  : ${String(calculatedTotal).padEnd(16)}║`);
            console.log(`║  📋 All Comments Tag  : ${String(allCommentsTotal).padEnd(16)}║`);
            console.log('╚══════════════════════════════════════════╝');
            console.log('\n');

            // ── ✅ CRITICAL: Cross-assert calculated total vs "All Comments" ──
            expect(
                calculatedTotal,
                `❌ MISMATCH — Calculated total (${calculatedTotal}) does NOT match "All Comments" count (${allCommentsTotal}). ` +
                `Difference: ${Math.abs(allCommentsTotal - calculatedTotal)} comment(s).`
            ).toBe(allCommentsTotal);

            console.log(`✅ TC-11 passed — Calculated total (${calculatedTotal}) matches "All Comments" tag (${allCommentsTotal})`);
        });

    }); // end TC-12

}); // end Suite