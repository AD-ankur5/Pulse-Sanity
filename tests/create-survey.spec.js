const { test, expect, CONFIG } = require('./fixtures');

// ─── Suite ────────────────────────────────────────────────────────────────────
// Login, admin-tab and Vantage Pulse navigation are provided by the worker-scoped
// fixtures (see fixtures.js) — including the post-login redeem pop-up handling.
test.describe('Pulse_sanity — Create Survey', () => {

    test.describe.configure({ retries: 0, mode: 'serial', timeout: 120000 });

    let surveyName;

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 1: Custom Survey creation flow
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-01 | Open the Create Survey wizard', async ({ createSurveyPage, pulseAdminTab }) => {
        expect(pulseAdminTab.url(), 'Should be on the Pulse product').toContain('/pulse');

        const res = await createSurveyPage.startCustomSurvey();
        expect(res.status, 'Custom survey wizard should start').toBe('success');
        console.log('✅ Custom Survey wizard opened');
    });

    test('TC-02 | Fill survey details', async ({ createSurveyPage }) => {
        const res = await createSurveyPage.fillSurveyDetails();
        expect(res.status, 'Survey details should be filled').toBe('success');
        surveyName = res.name;

        const next = await createSurveyPage.clickNext();
        expect(next.status).toBe('success');
        console.log(`✅ Survey details filled — name: "${surveyName}"`);
    });

    test('TC-03 | Configure schedule (duration, send option, start date)', async ({ createSurveyPage }) => {
        const res = await createSurveyPage.configureSchedule('One Month', 'All at once');
        expect(res.status, 'Schedule should be configured').toBe('success');

        const next = await createSurveyPage.clickNext();
        expect(next.status).toBe('success');
        console.log('✅ Schedule configured');
    });

    test('TC-04 | Select audience and advance to Questions', async ({ createSurveyPage }) => {
        const res = await createSurveyPage.selectAudienceAndProceed();
        expect(res.status, 'Audience should be selected').toBe('success');
        console.log(`✅ Audience: ${res.message}`);
    });

    test('TC-05 | Add questions from categories', async ({ createSurveyPage }) => {
        const res = await createSurveyPage.addQuestionsFromCategories();
        expect(res.status, 'Questions should be added').toBe('success');

        const next = await createSurveyPage.clickNext();
        expect(next.status).toBe('success');
        console.log('✅ Questions added');
    });

    test('TC-06 | Launch survey and verify success', async ({ createSurveyPage, pulseAdminTab }) => {
        // Advance through any remaining review step(s) to the Launch button.
        const launchBtn = pulseAdminTab.getByRole('button', { name: 'Launch Survey' });
        if (!(await launchBtn.isVisible().catch(() => false))) {
            await createSurveyPage.clickNext();
        }

        const launch = await createSurveyPage.launchSurvey();
        expect(launch.status, 'Launch Survey should be clicked').toBe('success');

        const verify = await createSurveyPage.verifyLaunchSuccess();
        expect(verify.status, 'Launch success confirmation should appear').toBe('success');
        console.log(`✅ Survey "${surveyName}" launched successfully`);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 2: Template Survey creation flow
    // ══════════════════════════════════════════════════════════════════════════

    test('TC-07 | Open Create-Survey home and select a template', async ({ createSurveyPage }) => {
        // Fresh start from the Create-Survey home page after the custom-survey run.
        const home = await createSurveyPage.openCreateSurveyHome(CONFIG.dashboardBaseUrl);
        expect(home.status, 'Create-Survey home should open').toBe('success');

        const browse = await createSurveyPage.startTemplateSurvey();
        expect(browse.status, 'A template preview should open').toBe('success');
        console.log('✅ Template preview opened');
    });

    test('TC-08 | Apply template and configure schedule (today, weekly)', async ({ createSurveyPage }) => {
        const applied = await createSurveyPage.useSelectedTemplate('Automated sanity test');
        expect(applied.status, 'Template should be applied').toBe('success');

        const next = await createSurveyPage.clickNext();
        expect(next.status).toBe('success');

        const date = await createSurveyPage.selectTodayInCalendar();
        expect(date.status, "Today's date should be selected").toBe('success');

        const freq = await createSurveyPage.selectFrequency('Weekly');
        expect(freq.status, 'Weekly frequency should be selected').toBe('success');

        const next2 = await createSurveyPage.clickNext();
        expect(next2.status).toBe('success');
        console.log('✅ Template applied and schedule configured');
    });

    test('TC-09 | Select audience for templated survey', async ({ createSurveyPage }) => {
        const res = await createSurveyPage.selectAudienceAndProceed();
        expect(res.status, 'Audience should be selected').toBe('success');
        console.log(`✅ Audience: ${res.message}`);
    });

    test('TC-10 | Launch templated survey and verify success', async ({ createSurveyPage, pulseAdminTab }) => {
        // Template ships with its own questions — advance through any remaining
        // review step(s) until the Launch button is reachable.
        const launchBtn = pulseAdminTab.getByRole('button', { name: 'Launch Survey' });
        for (let i = 0; i < 3 && !(await launchBtn.isVisible().catch(() => false)); i++) {
            await createSurveyPage.clickNext();
        }

        const launch = await createSurveyPage.launchSurvey();
        expect(launch.status, 'Launch Survey should be clicked').toBe('success');

        const verify = await createSurveyPage.verifyLaunchSuccess();
        expect(verify.status, 'Launch success confirmation should appear').toBe('success');
        console.log('✅ Templated survey launched successfully');
    });
});
