const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async switchToDashboardWindow() {
        const pages = this.page.context().pages();
        if (pages.length >= 2) {
            const newPage = pages.find(p => p !== this.page);
            await newPage.waitForLoadState('load');
            console.log(`[INFO] Switched to tab: ${await newPage.title()}`);
            return newPage;
        }
        throw new Error("Dashboard window not found — no new tab detected");
    }

    async waitForNewTab(triggerAction) {
        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            triggerAction()
        ]);
        await newPage.waitForLoadState('load');
        console.log(`[INFO] New tab opened: ${await newPage.title()}`);
        return newPage;
    }

    async selectPulseFromMenu() {
        await this.waitForElement("//button[@data-collapsed='true']");
        await this.clickElement("//button[@data-collapsed='true']");
        await this.page.waitForTimeout(250);

        await this.waitForElement("//span[normalize-space()='Vantage Pulse']");
        await this.clickElement("//span[normalize-space()='Vantage Pulse']");
        await this.page.waitForURL(/.*\/pulse\/dashboard/);
        await this.page.waitForTimeout(250);
        return { status: 'success', message: 'Pulse selected from menu' };
    }

    async createSurvey() {
        await this.waitForElement("//a[normalize-space()='Create Survey']");
        await this.clickElement("//a[normalize-space()='Create Survey']");
        await this.page.waitForTimeout(500);
        return { status: 'success', message: 'Create Survey clicked' };
    }

    async selectPulseSection(section) {
        try {
            await this.waitForElement(`//*[normalize-space(.)='${section}']`);
            await this.clickElement(`//*[normalize-space(.)='${section}']`);
            await this.page.waitForTimeout(1000);
            await this.waitForNavigation();
            const url = await this.page.url();
            return { status: "success", message: `Switched to ${section}`, url };
        } catch (error) {
            return { status: "failure", message: `Failed to switch to ${section}: ${error.message}` };
        }
    }

    async scheduleSurvey(date, timeHr) {
        try {
            await this.waitForElement("(//input[@id='mat-input-0'])[1]");
            await this.fillInput("(//input[@id='mat-input-0'])[1]", date);
            await this.page.waitForTimeout(2000);

            await this.waitForElement("button[class$='ngx-material-timepicker-toggle']");
            await this.clickElement("button[class$='ngx-material-timepicker-toggle']");
            await this.page.waitForTimeout(500);
            await this.clickElement(`//div[@class="clock-face__number clock-face__number--outer ng-star-inserted"]/span[normalize-space()='${timeHr}']`);
            await this.clickElement("//span[normalize-space()='Ok']");

            return { status: 'success', message: 'Survey scheduled' };
        } catch (error) {
            return { status: 'failure', message: `Schedule failed: ${error.message}` };
        }
    }

    async selectFrequency(freqType) {
        try {
            await this.waitForElement(`//p[normalize-space()='${freqType}']/parent::div/following-sibling::div//input[@type='radio']`);
            await this.clickElement(`//p[normalize-space()='${freqType}']/parent::div/following-sibling::div//input[@type='radio']`);
            return { status: 'success', message: `Frequency '${freqType}' selected` };
        } catch (error) {
            return { status: 'failure', message: `Frequency select failed: ${error.message}` };
        }
    }

    // ─── Dashboard Engagement Chart & Cards ──────────────────────────────────

    async navigateToPulseDashboard(baseUrl) {
        await this.page.goto(`${baseUrl}/pulse/dashboard`);
        await this.page.waitForLoadState('networkidle');
        return { status: 'success' };
    }

    async clickEngagementChart() {
        const chart = this.page.locator('vantage-circle-dashboard-engagment-index canvas');
        const visible = await chart.isVisible().catch(() => false);
        if (!visible) return { status: 'no-data', message: 'Engagement chart not present — no survey data' };
        await chart.click({ position: { x: 265, y: 41 } });
        await this.page.waitForTimeout(500);
        return { status: 'success' };
    }

    async clickSurveyResultCards() {
        await this.page.locator('.flex.border.rounded-\\[8px\\].flex-1').first().click();
        await this.page.waitForTimeout(500);
        await this.page.locator('.flex.border.rounded-\\[8px\\].flex-1.flex-col.items-start.gap-\\[10px\\].p-6.h-full.bg-\\[\\#EDEEFCB3\\]').click();
        await this.page.waitForTimeout(500);
        await this.page.locator('.h-full.flex.flex-1.flex-col.items-center').click();
        await this.page.waitForTimeout(500);
        return { status: 'success' };
    }

    async clickViewMoreInTimeline() {
        await this.page.locator('vantage-circle-dashboard-new-timeline').getByText('View more').click();
        await this.page.waitForTimeout(500);
        return { status: 'success' };
    }

    // ─── Filter Panel — Cycle All Types ──────────────────────────────────────

    async cycleFilterTypes() {
        await this.page.getByText('Filter By: Department').click();
        await this.page.getByText('Business Unit').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Filter By: Business Unit').click();
        await this.page.getByText('BU - Sub Department').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Filter By: BU - Sub Department').click();
        await this.page.getByText('Location').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Filter By: Location').click();
        await this.page.getByText('Department', { exact: true }).click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Filter By: Department').click();
        await this.page.getByText('Employee Type').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Filter By: Employee Type').click();
        await this.page.getByText('Gender').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Filter By: Gender').click();
        await this.page.getByText('Grade').click();
        await this.page.waitForTimeout(300);
        await this.page.keyboard.press('Escape');
        return { status: 'success' };
    }

    // ─── Survey Navigation & Question Insights ────────────────────────────────

    async clickNextSurvey() {
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(500);
        return { status: 'success' };
    }

    async clickWhatsWorkingWell() {
        await this.page.getByText("What's working wellYour highest performing questionsView more").click();
        await this.page.waitForTimeout(500);
        return { status: 'success' };
    }

    async openQuestionTypeFilter() {
        await this.page.locator('.cursor-pointer.flex.min-w-\\[80px\\] > span > svg').first().click();
        await this.page.waitForTimeout(300);
        return { status: 'success' };
    }

    async toggleQuestionTypes() {
        await this.page.getByText('Open-Ended').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Multi-choice').click();
        await this.page.waitForTimeout(300);
        await this.page.getByText('Rating Questions').click();
        await this.page.waitForTimeout(300);
        return { status: 'success' };
    }

    // ─── Categories Tab & Table Sorting ──────────────────────────────────────

    async switchToCategoriesTab() {
        await this.page.getByRole('tab', { name: 'Categories' }).click();
        await this.page.waitForTimeout(500);
        return { status: 'success' };
    }

    async sortCategoriesTable() {
        const table = this.page.getByRole('table').filter({ hasText: 'Relationship with Manager16' });
        await table.getByLabel('Toggle participation sort').click();
        await this.page.waitForTimeout(300);
        await table.getByLabel('Toggle engagement sort direction').click();
        await this.page.waitForTimeout(300);
        await table.getByLabel(/toggle.*enps.*sort/i).click();
        await this.page.waitForTimeout(300);
        await table.getByLabel('Toggle trend sort direction').click();
        await this.page.waitForTimeout(300);
        await table.getByLabel('Toggle comments sort direction').click();
        return { status: 'success' };
    }

    async launchSurvey() {
        try {
            await this.waitForElement("(//button[normalize-space()='Launch Survey'])[1]");
            await this.scrollToElement("(//button[normalize-space()='Launch Survey'])[1]");
            await this.clickElement("(//button[normalize-space()='Launch Survey'])[1]");
            return { status: 'success', message: 'Survey launched' };
        } catch (error) {
            return { status: 'failure', message: `Launch failed: ${error.message}` };
        }
    }
}

module.exports = DashboardPage;
