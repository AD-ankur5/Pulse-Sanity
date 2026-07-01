class BasePage {
    constructor(page) {
        try {
            this.page = page;
        } catch (error) {
            console.error(`Failed to initialize BasePage: ${error.message}`);
            throw error;
        }
    }

    async setUp() {
        try {
            await this.page.setViewportSize({ width: 1920, height: 1080 });
            this.page.setDefaultTimeout(30000);
            this.page.setDefaultNavigationTimeout(30000);
            return { status: "success", message: "Page setup completed successfully" };
        } catch (error) {
            return { status: "error", message: `Page setup failed: ${error.message}` };
        }
    }

    async waitForElement(selector, timeout = 30000) {
        try {
            const element = await this.page.waitForSelector(selector, {
                state: 'attached',
                timeout: timeout
            });
            return { status: "success", message: `Element found: ${selector}`, element };
        } catch (error) {
            return { status: "error", message: `Element not found: ${selector} - ${error.message}` };
        }
    }

    async clickElement(selector, timeout = 30000) {
        try {
            await this.waitForElement(selector, timeout);
            await this.page.click(selector);
            return { status: "success", message: `Element clicked: ${selector}` };
        } catch (error) {
            return { status: "error", message: `Failed to click: ${selector} - ${error.message}` };
        }
    }

    async fillInput(selector, text, timeout = 30000) {
        try {
            await this.waitForElement(selector, timeout);
            await this.page.fill(selector, text);
            return { status: "success", message: `Input filled: ${selector}` };
        } catch (error) {
            return { status: "error", message: `Failed to fill: ${selector} - ${error.message}` };
        }
    }

    async getText(selector, timeout = 30000) {
        try {
            await this.waitForElement(selector, timeout);
            const text = await this.page.textContent(selector);
            return { status: "success", text };
        } catch (error) {
            return { status: "error", message: `Failed to get text: ${selector} - ${error.message}` };
        }
    }

    async getAllTexts(locator) {
        try {
            const allTexts = await this.page.locator(locator).evaluateAll((els) =>
                els.map(el => el.textContent?.trim()).filter(Boolean)
            );
            return { status: "success", message: `Retrieved ${allTexts.length} texts`, texts: allTexts };
        } catch (error) {
            return { status: "error", message: `Failed getAllTexts: ${error.message}` };
        }
    }

    async isVisible(selector, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { state: 'visible', timeout });
            return { status: "success", visible: true };
        } catch {
            return { status: "success", visible: false };
        }
    }

    async waitForNavigation(timeout = 30000) {
        try {
            await this.page.waitForLoadState('networkidle', { timeout });
            return { status: "success", message: "Navigation completed" };
        } catch (error) {
            return { status: "error", message: `Navigation failed: ${error.message}` };
        }
    }

    async scrollToElement(selector) {
        try {
            await this.page.locator(selector).scrollIntoViewIfNeeded();
            return { status: "success", message: `Scrolled to: ${selector}` };
        } catch (error) {
            return { status: "error", message: `Scroll failed: ${error.message}` };
        }
    }

    async hoverElement(selector) {
        try {
            await this.waitForElement(selector);
            await this.page.hover(selector);
            return { status: "success" };
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }

    async takeScreenshot(name) {
        try {
            const timestamp = new Date().getTime();
            await this.page.screenshot({
                path: `screenshots/${name}-${timestamp}.png`,
                fullPage: true
            });
            return { status: "success", message: `Screenshot: ${name}-${timestamp}.png` };
        } catch (error) {
            return { status: "error", message: `Screenshot failed: ${error.message}` };
        }
    }

    async assertText(xpath, expected) {
        try {
            const el = this.page.locator(`xpath=${xpath}`);
            await el.waitFor({ state: "visible", timeout: 7000 });
            const raw = (await el.textContent()) ?? "";
            const normalize = (s) => s.replace(/\s+/g, " ").trim();
            const actualText = normalize(raw);
            const expectedText = normalize(expected);
            if (actualText !== expectedText) {
                throw new Error(`Expected "${expectedText}" but got "${actualText}"`);
            }
            console.log(`[PASS] Text matched: '${actualText}'`);
            return { status: "success", actualText, expectedText };
        } catch (error) {
            console.error(`[FAIL] assertText: ${error.message}`);
            return { status: "failure", message: error.message };
        }
    }

    async assertLink(expectedLink) {
        try {
            await this.page.waitForTimeout(1000);
            const actualLink = this.page.url();
            const anchor = '/pulse';
            const actualIdx = actualLink.indexOf(anchor);
            const expectedIdx = expectedLink.indexOf(anchor);
            const actualPath = actualIdx === -1 ? '' : actualLink.substring(actualIdx).split('?')[0];
            const expectedPath = expectedIdx === -1 ? '' : expectedLink.substring(expectedIdx).split('?')[0];
            if (!actualPath.includes(expectedPath)) {
                throw new Error(`Actual "${actualPath}" does not include expected "${expectedPath}"`);
            }
            return { status: 'success', message: `URL path verified: ${expectedPath}` };
        } catch (error) {
            return { status: 'failure', message: error.message };
        }
    }

    async waitForURL(urlPart, timeout = 30000) {
        try {
            await this.page.waitForURL(`**/*${urlPart}*`, { timeout });
            return { status: "success" };
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }

    async navigateTo(url) {
        try {
            await this.page.goto(url);
            await this.waitForNavigation();
            return { status: "success", message: `Navigated to: ${url}` };
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }

    generateRandomName(prefix = 'Test', length = 8) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, length + 2);
        return `${prefix}_${randomString}_${timestamp}`;
    }
}

module.exports = BasePage;
