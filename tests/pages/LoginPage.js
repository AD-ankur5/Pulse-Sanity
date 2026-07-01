const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async navigateToLoginPage() {
        await this.page.goto('https://api.vantagecircle.co.in/');
        await this.page.waitForLoadState('domcontentloaded');
        const title = await this.page.title();
        console.log(`[INFO] Page title: ${title}`);
        return { status: 'success', title };
    }

    async login(email, password) {
        try {
            await this.waitForElement('//button[@id="logindropdown"]');
            await this.page.click('//button[@id="logindropdown"]');

            await this.waitForElement("//input[@id='LoginForm_email']");
            await this.page.fill("//input[@id='LoginForm_email']", email);

            await this.waitForElement("//input[@id='LoginForm_password']");
            await this.page.fill("//input[@id='LoginForm_password']", password);

            await this.waitForElement("//button[@id='loginbtn']");
            await this.page.click("//button[@id='loginbtn']");

            return { status: 'success', message: 'Login submitted' };
        } catch (error) {
            return { status: 'error', message: `Login failed: ${error.message}` };
        }
    }

    // ─── Handle Redeem Popup ──────────────────────────────────────────────────

    async handleRedeemPopup() {
        // Dismiss "Open in App" smart banner if present
        try {
            const appBanner = this.page.locator('text=Open in app for a faster experience').first();
            await appBanner.waitFor({ state: 'visible', timeout: 4000 });
            await this.page.keyboard.press('Escape');
            await appBanner.waitFor({ state: 'hidden', timeout: 3000 });
            console.log('App banner dismissed');
        } catch {
            console.log('No app banner found');
        }

        // Redeem popup — detect the dialog body and click its close (X) button.
        // Markup: <div class="dialog-body dining_disclaimer ...">
        //           <button aria-label="Close" class="vc-modal-close-btn"><svg class="lucide-x-icon">…
        try {
            const popup = this.page.locator('.dialog-body.dining_disclaimer');
            await popup.waitFor({ state: 'visible', timeout: 8000 });

            const closeBtn = popup.getByRole('button', { name: 'Close' });
            await closeBtn.click();

            await popup.waitFor({ state: 'hidden', timeout: 5000 });
            console.log('Redeem popup dismissed');
        } catch {
            // Fallback: generic dialog dismissal via Escape
            try {
                await this.page.waitForSelector("[role='dialog']", { state: 'visible', timeout: 3000 });
                await this.page.keyboard.press('Escape');
                await this.page.waitForSelector("[role='dialog']", { state: 'hidden', timeout: 3000 });
                console.log('Redeem popup dismissed (fallback)');
            } catch {
                console.log('No redeem popup found');
            }
        }
    }

    async clickProfile() {
        try {
            await this.waitForElement("(//img[@alt='profileImage'])[1]", 30000);
            await this.page.click("(//img[@alt='profileImage'])[1]");
            await this.page.waitForTimeout(500);
            return { status: 'success', message: 'Profile icon clicked' };
        } catch (error) {
            return { status: 'error', message: `Profile click failed: ${error.message}` };
        }
    }

    async clickAdminDashboard() {
        try {
            await this.waitForElement("//span[normalize-space()='Admin Dashboard']", 30000);
            await this.page.click("//span[normalize-space()='Admin Dashboard']");
            return { status: 'success', message: 'Admin Dashboard clicked' };
        } catch (error) {
            return { status: 'error', message: `Admin Dashboard click failed: ${error.message}` };
        }
    }
}

module.exports = LoginPage;
