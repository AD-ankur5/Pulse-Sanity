# Pulse_sanity — Playwright Automation Framework

End-to-end sanity suite for the Vantage Circle admin dashboard, focused on the Vantage Pulse module.

---

## 📁 Project Structure

```
Pulse_sanity/
├── tests/
│   ├── pages/
│   │   ├── BasePage.js         ← Reusable utility methods (click, fill, assert, etc.)
│   │   ├── LoginPage.js        ← Login & profile interactions
│   │   └── DashboardPage.js    ← Admin dashboard & Pulse navigation
│   └── vantage-pulse.spec.js   ← All 36 test cases
├── screenshots/                ← Auto-saved failure screenshots
├── playwright-report/          ← HTML test report (generated after run)
├── test-results/               ← JSON results + traces/videos on failure
├── playwright.config.js        ← Playwright configuration
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Install Playwright browsers
```bash
npm run install:browsers
```

### 3. Run all tests
```bash
npm test
```

### 4. Run tests in headed mode (see the browser)
```bash
npm run test:headed
```

### 5. Open the HTML report
```bash
npm run report
```

---

## 🧪 Test Cases (36 total)

| #  | Test ID | Description |
|----|---------|-------------|
| 1  | TC-01 | Navigate to Login Page |
| 2  | TC-02 | Login with valid credentials |
| 3  | TC-03 | Click Profile icon — verify dropdown |
| 4  | TC-04 | Click Admin Dashboard — handle new window |
| 5  | TC-05 | Select Vantage Pulse from product menu |
| 6  | TC-06 | Click Create Survey → Create Survey Home |
| 7  | TC-07 | Click Build Survey → Survey dialog |
| 8  | TC-08 | Click Use Templates → Recently used templates |
| 9  | TC-09 | Click Create Template → Own survey template |
| 10 | TC-10 | Navigate to Dashboard section |
| 11 | TC-11 | Click Survey Overview dropdown |
| 12 | TC-12 | Verify surveys inside dropdown |
| 13 | TC-13 | Navigate to Insights |
| 14 | TC-14 | Navigate to Categories |
| 15 | TC-15 | Navigate to Segments |
| 16 | TC-16 | Navigate to Employee Lifecycle |
| 17 | TC-17 | Navigate to Feedback |
| 18 | TC-18 | Navigate to Question Scores |
| 19 | TC-19 | Open Configuration → verify 4 sub-modules |
| 20 | TC-20 | Click Question Bank — verify URL |
| 21 | TC-21 | Expand language dropdown in Question Bank |
| 22 | TC-22 | Verify all languages in Question Bank |
| 23 | TC-23 | Select Assamese in Question Bank |
| 24 | TC-24 | Toggle all question toggle buttons |
| 25 | TC-25 | Click Survey Management — verify URL |
| 26 | TC-26 | Switch to Upcoming status tab |
| 27 | TC-27 | Switch to Automated status tab |
| 28 | TC-28 | Click Language Settings — verify URL |
| 29 | TC-29 | Verify all languages in Language Settings |
| 30 | TC-30 | Select Assamese in Language Settings |
| 31 | TC-31 | Click Email Templates — verify navigation |
| 32 | TC-32 | Click Email Template preview button |
| 33 | TC-33 | Verify Email Template preview content |
| 34 | TC-34 | Click Learning — verify navigation |
| 35 | TC-35 | Click Reports — verify navigation |
| 36 | TC-36 | Extract Pulse version, survey limits & counts |

---

## ⚙️ Configuration

Edit `playwright.config.js` to adjust:
- **`timeout`** — per-test timeout (default: 90s)
- **`slowMo`** — slow down actions for debugging (default: 100ms)
- **`screenshot`** / **`video`** / **`trace`** — artifact collection strategy

Credentials are read from environment variables. Copy `.env.example` to `.env` and fill in your values (`.env` is git-ignored):
```bash
cp .env.example .env
```

Base URLs live in the `CONFIG` object of each spec:
```js
const CONFIG = {
    email: process.env.PULSE_EMAIL,
    password: process.env.PULSE_PASSWORD,
    baseUrl: 'https://api.vantagecircle.co.in/',
    dashboardBaseUrl: 'https://dashboard-v2.vantagecircle.co.in'
};
```

---

## 🏗️ Architecture

### Page Object Model (POM)

All page interactions are encapsulated in page classes under `tests/pages/`:

- **`BasePage`** — foundation class with generic helpers (`clickElement`, `assertText`, `assertLink`, `getAllTexts`, `waitForNavigation`, etc.)
- **`LoginPage`** extends `BasePage` — handles login flow, profile, admin redirect
- **`DashboardPage`** extends `BasePage` — handles Pulse menu, tab switching, section navigation

All methods return a structured result object:
```js
{ status: 'success' | 'failure' | 'error', message: '...', ...extras }
```

This allows graceful handling without try/catch in test files.

---

## 🛠️ Debugging Tips

- Run with `--debug` flag to step through tests interactively
- Use `--headed` to watch the browser in real time
- Check `playwright-report/index.html` after a run for full logs, screenshots, and traces
- Traces can be opened with: `npx playwright show-trace test-results/<trace>.zip`
