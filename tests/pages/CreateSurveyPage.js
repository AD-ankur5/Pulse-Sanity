const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

/**
 * Page Object for the Vantage Pulse "Create Survey" wizard.
 *
 * Covers both creation paths exposed from the Create-Survey home page:
 *   1. Create Custom Survey  → buildCustomSurvey()
 *   2. Browse Templates      → buildSurveyFromTemplate()
 *
 * `this.page` is expected to be the HR Admin Dashboard tab (i.e. `page1`
 * in the recorded flow), already authenticated and on the Pulse product.
 */
class CreateSurveyPage extends BasePage {
    constructor(page) {
        super(page);
    }

    // ─── Navigation ───────────────────────────────────────────────────────────

    /** Go straight to the Create-Survey home page. */
    async openCreateSurveyHome(dashboardBaseUrl) {
        try {
            await this.page.goto(`${dashboardBaseUrl}/pulse/create-survey-home`);
            await this.page.waitForLoadState('networkidle');
            return { status: 'success', message: 'Create-Survey home opened' };
        } catch (error) {
            return { status: 'error', message: `Failed to open Create-Survey home: ${error.message}` };
        }
    }

    /** Dismiss the in-wizard onboarding tooltips ("Got it") if they appear. */
    async dismissTooltips() {
        for (let i = 0; i < 3; i++) {
            try {
                const gotIt = this.page.getByRole('button', { name: 'Got it' }).first();
                await gotIt.waitFor({ state: 'visible', timeout: 3000 });
                await gotIt.click();
                await this.page.waitForTimeout(300);
            } catch {
                break;
            }
        }
        return { status: 'success' };
    }

    /** Generic "Next →" step advance. */
    async clickNext() {
        try {
            const next = this.page.getByRole('button', { name: 'Next →' });
            await next.waitFor({ state: 'visible', timeout: 15000 });
            await next.click();
            await this.page.waitForTimeout(800);
            return { status: 'success', message: 'Advanced to next step' };
        } catch (error) {
            return { status: 'error', message: `Next step failed: ${error.message}` };
        }
    }

    // ─── Path 1: Custom Survey ──────────────────────────────────────────────────

    async startCustomSurvey() {
        try {
            await this.page.getByRole('link', { name: 'Create Survey' }).click();
            await this.page.getByRole('button', { name: 'Create Custom Survey →' }).click();
            await this.page.waitForTimeout(800);
            return { status: 'success', message: 'Custom survey wizard started' };
        } catch (error) {
            return { status: 'error', message: `Could not start custom survey: ${error.message}` };
        }
    }

    /**
     * Fill the survey name + purpose. Returns the generated name so the test
     * can assert against it later.
     */
    async fillSurveyDetails(name = this.generateRandomName('Pulse'), purpose = 'Automated sanity test') {
        try {
            const nameField = this.page.getByRole('textbox', { name: 'Survey name' });
            await nameField.click();
            await nameField.fill(name);

            const purposeField = this.page.getByRole('textbox', { name: 'Why are we running this' });
            await purposeField.click();
            await purposeField.fill(purpose);

            return { status: 'success', message: `Survey details filled: ${name}`, name };
        } catch (error) {
            return { status: 'error', message: `Failed to fill survey details: ${error.message}`, name };
        }
    }

    /**
     * Configure schedule on the Duration step.
     * @param {string} duration   e.g. 'One Month'
     * @param {string} sendOption e.g. 'All at once'
     */
    async configureSchedule(duration = 'One Month', sendOption = 'All at once') {
        try {
            await this.page.getByRole('button', { name: duration }).click();
            await this.page.waitForTimeout(300);

            await this.page.locator('div').filter({ hasText: new RegExp(`^${sendOption}$`) }).first().click();
            await this.page.waitForTimeout(300);

            await this.selectTodayInCalendar();
            return { status: 'success', message: `Schedule set: ${duration} / ${sendOption}` };
        } catch (error) {
            return { status: 'error', message: `Schedule config failed: ${error.message}` };
        }
    }

    /** Open the first date picker and pick today's date (robust to the date). */
    async selectTodayInCalendar() {
        try {
            await this.page.getByRole('button', { name: 'Open calendar' }).first().click();
            await this.page.waitForTimeout(500);

            // Angular Material marks today's cell with .mat-calendar-body-today
            const today = this.page.locator('.mat-calendar-body-today');
            if (await today.count()) {
                await today.first().click();
            } else {
                // Fallback: any selectable, non-disabled date cell
                await this.page.locator('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').first().click();
            }
            await this.page.waitForTimeout(300);
            return { status: 'success', message: "Today's date selected" };
        } catch (error) {
            return { status: 'error', message: `Calendar date selection failed: ${error.message}` };
        }
    }

    /**
     * Select the survey frequency (Daily / Weekly / Fortnightly / etc.).
     *
     * The frequency options are custom radio cards whose hidden <input> never
     * reflects a `checked` property, so Playwright's .check() fails its
     * post-action state verification (same pattern as the audience vc-checkbox).
     * Click the option's label instead — this matches the recorded flow.
     */
    async selectFrequency(freq = 'Weekly') {
        try {
            const label = this.page
                .locator('label')
                .filter({ hasText: new RegExp(`^\\s*${freq}`, 'i') })
                .first();
            await label.waitFor({ state: 'visible', timeout: 10000 });
            await label.click();
            await this.page.waitForTimeout(300);
            return { status: 'success', message: `Frequency '${freq}' selected` };
        } catch (error) {
            return { status: 'error', message: `Frequency select failed: ${error.message}` };
        }
    }

    // ─── Audience ────────────────────────────────────────────────────────────

    // ─── Audience locators ─────────────────────────────────────────────────────

    /** Chevron that opens the "Including" segment dropdown. */
    get includingDropdownToggle() {
        return this.page.locator('i.fa-solid.fa-angle-down').first();
    }

    /** The "All" segment group row (drills into its checkbox list). */
    get allSegmentGroup() {
        return this.page
            .locator('.truncate.cursor-pointer')
            .filter({ has: this.page.locator('p', { hasText: /^All$/ }) })
            .first();
    }

    /** The "All Employees" checkbox label (a custom vc-checkbox — must be clicked, not .check()'d). */
    get allEmployeesOption() {
        return this.page.getByText('All Employees', { exact: true }).first();
    }

    /** Confirm button inside the segment dropdown. */
    get segmentSelectButton() {
        return this.page.getByRole('button', { name: 'Select', exact: true });
    }

    /**
     * Pick the "All Employees" audience and advance to the Questions step.
     *
     * The audience picker is a custom Angular component: clicking the chevron
     * opens a segment dropdown, the "All" group expands to reveal an
     * "All Employees" checkbox, and "Select" confirms the choice. The checkbox
     * is a custom vc-checkbox whose hidden <input> never receives a `checked`
     * property, so it must be toggled with .click() on the label (Playwright's
     * .check() would fail its state verification).
     */
    async selectAudienceAndProceed() {
        try {
            // 1. Open the "Including" segment dropdown
            await this.includingDropdownToggle.click();
            await this.page.waitForTimeout(600);

            // 2. Drill into the "All" segment group
            await this.allSegmentGroup.click();
            await this.page.waitForTimeout(500);

            // 3. Tick the "All Employees" checkbox (click the label)
            await this.allEmployeesOption.click();
            await this.page.waitForTimeout(300);

            // 4. Confirm the segment selection
            await this.segmentSelectButton.click();
            await this.page.waitForTimeout(500);

            // 5. Advance to the Questions step
            await this.clickNext();

            return { status: 'success', message: 'All Employees segment selected' };
        } catch (error) {
            return { status: 'error', message: `Audience selection failed: ${error.message}` };
        }
    }

    // ─── Questions ───────────────────────────────────────────────────────────

    /**
     * Add one question from each of the given category buttons.
     * @param {string[]} categories category button labels, e.g. ['mcq (3)', 'Open-ended (11)']
     */
    async addQuestionsFromCategories(categories = [/^mcq/i, /^Open-ended/i, /^Relationship with Peers/i]) {
        try {
            await this.dismissTooltips();
            for (const category of categories) {
                // Category buttons carry a live count (e.g. "mcq (3)") — match by prefix.
                await this.page.getByRole('button', { name: category }).first().click();
                await this.page.waitForTimeout(500);

                // nth(2) skips the top-nav "Add Employees" button and lands on the
                // first question's "Add" control in the expanded category panel.
                const addBtn = this.page.getByRole('button', { name: 'Add' }).nth(2);
                await addBtn.click();
                await this.page.waitForTimeout(500);
            }
            return { status: 'success', message: `Added questions from ${categories.length} categories` };
        } catch (error) {
            return { status: 'error', message: `Adding questions failed: ${error.message}` };
        }
    }

    // ─── Launch & Verify ───────────────────────────────────────────────────────

    async launchSurvey() {
        try {
            const launch = this.page.getByRole('button', { name: 'Launch Survey' });
            await launch.waitFor({ state: 'visible', timeout: 15000 });
            await launch.scrollIntoViewIfNeeded();
            await launch.click();
            return { status: 'success', message: 'Launch Survey clicked' };
        } catch (error) {
            return { status: 'error', message: `Launch failed: ${error.message}` };
        }
    }

    /** Assert the success confirmation heading is shown after launch. */
    async verifyLaunchSuccess() {
        try {
            const heading = this.page.getByRole('heading', { name: 'Survey launched successfully' });
            await expect(heading).toBeVisible({ timeout: 30000 });
            return { status: 'success', message: 'Survey launched successfully confirmation shown' };
        } catch (error) {
            return { status: 'failure', message: `Launch confirmation not shown: ${error.message}` };
        }
    }

    // ─── Path 2: Template Survey ─────────────────────────────────────────────────

    /** Open Browse Templates and pick the first available template card. */
    async startTemplateSurvey() {
        try {
            await this.page.getByRole('button', { name: 'Browse Templates →' }).click();
            await this.page.waitForTimeout(1000);

            // "Use this template" / preview button on the first template card
            const previewBtn = this.page
                .locator('vantage-circle-dashboard-survey-card button')
                .filter({ hasText: /template|use|preview/i })
                .first();
            await previewBtn.click();
            await this.page.waitForTimeout(800);
            return { status: 'success', message: 'Template preview opened' };
        } catch (error) {
            return { status: 'error', message: `Could not open template: ${error.message}` };
        }
    }

    async useSelectedTemplate(purpose = 'Automated sanity test', name = this.generateRandomName('PulseTpl')) {
        try {
            await this.page.getByRole('button', { name: 'Use template' }).click();
            await this.page.waitForTimeout(800);

            // The template pre-fills its own survey name, which already exists
            // ("Survey name already exists"). Overwrite it with a unique one.
            const nameField = this.page.getByRole('textbox', { name: 'Survey name' });
            if (await nameField.isVisible().catch(() => false)) {
                await nameField.click();
                await nameField.fill(name);
            }

            const purposeField = this.page.getByRole('textbox', { name: 'Why are we running this' });
            await purposeField.click();
            await purposeField.fill(purpose);
            return { status: 'success', message: `Template applied with unique name: ${name}`, name };
        } catch (error) {
            return { status: 'error', message: `Use template failed: ${error.message}`, name };
        }
    }
}

module.exports = CreateSurveyPage;
