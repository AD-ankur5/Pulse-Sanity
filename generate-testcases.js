#!/usr/bin/env node
/**
 * Test Case Report Generator
 * --------------------------------------------------
 * Reads Allure results (allure-results/*-result.json) and produces a single
 * self-contained HTML file (testcases-report.html) that can be emailed/Slacked
 * to teammates and opened by double-clicking — no server required.
 *
 * Usage:
 *   node generate-testcases.js [resultsDir] [outFile]
 *   npm run testcases
 */

const fs = require('fs');
const path = require('path');

const resultsDir = process.argv[2] || 'allure-results';
const outFile = process.argv[3] || 'testcases-report.html';

if (!fs.existsSync(resultsDir)) {
  console.error(`✗ Results directory not found: ${resultsDir}`);
  process.exit(1);
}

// ---- Load results -----------------------------------------------------------
const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith('-result.json'));
if (!files.length) {
  console.error(`✗ No *-result.json files in ${resultsDir}`);
  process.exit(1);
}

let tests = files.map((f) => JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf8')));

// Dedupe retries: keep the latest run per historyId (matches Allure behaviour).
const byHistory = new Map();
for (const t of tests) {
  const key = t.historyId || t.uuid;
  const prev = byHistory.get(key);
  if (!prev || (t.start || 0) > (prev.start || 0)) byHistory.set(key, t);
}
tests = [...byHistory.values()];

const labelOf = (t, name) => (t.labels || []).find((l) => l.name === name)?.value || '';

// Group by suite -> subSuite
const suites = {};
for (const t of tests) {
  const suite = labelOf(t, 'suite') || 'Ungrouped';
  const sub = labelOf(t, 'subSuite') || '';
  (suites[suite] = suites[suite] || {})[sub] = (suites[suite][sub] || []);
  suites[suite][sub].push(t);
}

// ---- Stats ------------------------------------------------------------------
const total = tests.length;
const count = (s) => tests.filter((t) => t.status === s).length;
const passed = count('passed');
const failed = count('failed');
const broken = count('broken');
const skipped = count('skipped');
const totalMs = tests.reduce((a, t) => a + ((t.stop || 0) - (t.start || 0)), 0);
const generatedAt = new Date(Math.max(...tests.map((t) => t.stop || 0)) || Date.now());

// ---- Helpers ----------------------------------------------------------------
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const dur = (ms) => (ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : ms + 'ms');
const ICON = { passed: '✓', failed: '✕', broken: '!', skipped: '–' };

function renderSteps(steps, depth = 0) {
  if (!steps || !steps.length) return '';
  return (
    '<ul class="steps">' +
    steps
      .map((s) => {
        const d = (s.stop || 0) - (s.start || 0);
        const nested = renderSteps(s.steps, depth + 1);
        const msg = s.statusDetails && s.statusDetails.message
          ? `<pre class="err">${esc(s.statusDetails.message)}</pre>` : '';
        return (
          `<li class="step ${s.status}"><span class="ic">${ICON[s.status] || '•'}</span>` +
          `<span class="stxt">${esc(s.name)}</span>` +
          (d ? `<span class="sdur">${dur(d)}</span>` : '') +
          msg + nested + `</li>`
        );
      })
      .join('') +
    '</ul>'
  );
}

let testIdx = 0;
function renderTest(t) {
  const d = (t.stop || 0) - (t.start || 0);
  const id = 'tc' + testIdx++;
  const err = t.statusDetails && t.statusDetails.message
    ? `<pre class="err">${esc(t.statusDetails.message)}${t.statusDetails.trace ? '\n\n' + esc(t.statusDetails.trace) : ''}</pre>`
    : '';
  return `
  <div class="test ${t.status}" data-status="${t.status}">
    <div class="thead" onclick="document.getElementById('${id}').classList.toggle('open')">
      <span class="badge ${t.status}">${ICON[t.status] || '•'} ${t.status}</span>
      <span class="tname">${esc(t.name)}</span>
      <span class="tdur">${dur(d)}</span>
      <span class="caret">▸</span>
    </div>
    <div class="tbody" id="${id}">
      ${err}
      ${renderSteps(t.steps)}
    </div>
  </div>`;
}

function renderSuites() {
  return Object.entries(suites)
    .map(([suite, subs]) => {
      const body = Object.entries(subs)
        .map(([sub, ts]) => {
          const head = sub ? `<h3 class="subsuite">${esc(sub)}</h3>` : '';
          const sorted = ts.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
          return head + sorted.map(renderTest).join('');
        })
        .join('');
      return `<section class="suite"><h2 class="suite-title">📄 ${esc(suite)}</h2>${body}</section>`;
    })
    .join('');
}

// ---- HTML -------------------------------------------------------------------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Case Report — Pulse Sanity</title>
<style>
  :root{--ok:#3dab5b;--fail:#e5493a;--broken:#e6a020;--skip:#8a93a2;--bg:#f5f7fa;--card:#fff;--line:#e3e8ef;--ink:#1f2733;--mut:#6b7585}
  *{box-sizing:border-box}
  body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--ink)}
  .wrap{max-width:1000px;margin:0 auto;padding:24px 16px 64px}
  header h1{margin:0 0 4px;font-size:22px}
  .meta{color:var(--mut);font-size:13px;margin-bottom:20px}
  .cards{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px}
  .cards .c{flex:1;min-width:110px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .c .n{font-size:26px;font-weight:700}.c .l{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .c.passed .n{color:var(--ok)}.c.failed .n{color:var(--fail)}.c.broken .n{color:var(--broken)}.c.skipped .n{color:var(--skip)}
  .bar{height:8px;border-radius:6px;overflow:hidden;display:flex;margin-bottom:24px;background:var(--line)}
  .bar span{display:block;height:100%}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  .toolbar button{border:1px solid var(--line);background:var(--card);border-radius:20px;padding:6px 14px;cursor:pointer;font-size:13px;color:var(--ink)}
  .toolbar button.active{background:var(--ink);color:#fff;border-color:var(--ink)}
  .toolbar input{flex:1;min-width:180px;border:1px solid var(--line);border-radius:20px;padding:6px 14px;font-size:13px}
  .suite{margin-bottom:28px}
  .suite-title{font-size:15px;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line)}
  .subsuite{font-size:13px;color:var(--mut);margin:14px 0 8px;font-weight:600}
  .test{background:var(--card);border:1px solid var(--line);border-left-width:4px;border-radius:8px;margin-bottom:8px;overflow:hidden}
  .test.passed{border-left-color:var(--ok)}.test.failed{border-left-color:var(--fail)}.test.broken{border-left-color:var(--broken)}.test.skipped{border-left-color:var(--skip)}
  .thead{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;user-select:none}
  .thead:hover{background:#fafbfc}
  .badge{font-size:11px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:12px;white-space:nowrap}
  .badge.passed{background:#e7f6ec;color:var(--ok)}.badge.failed{background:#fdecea;color:var(--fail)}.badge.broken{background:#fcf3e2;color:var(--broken)}.badge.skipped{background:#eef0f3;color:var(--skip)}
  .tname{flex:1;font-weight:500}
  .tdur{color:var(--mut);font-size:12px;font-variant-numeric:tabular-nums}
  .caret{color:var(--mut);transition:transform .15s}
  .tbody{display:none;padding:0 14px 12px 14px}
  .tbody.open{display:block}
  .test .tbody.open + .caret,.open ~ .caret{}
  ul.steps{list-style:none;margin:6px 0 0;padding-left:6px}
  ul.steps ul.steps{margin-left:14px;border-left:1px solid var(--line);padding-left:12px}
  li.step{padding:3px 0;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}
  li.step .ic{width:16px;text-align:center;font-weight:700;font-size:12px}
  li.step.passed .ic{color:var(--ok)}li.step.failed .ic{color:var(--fail)}li.step.broken .ic{color:var(--broken)}li.step.skipped .ic{color:var(--skip)}
  li.step .stxt{flex:1;min-width:200px}
  li.step .sdur{color:var(--mut);font-size:12px}
  pre.err{background:#fdecea;color:#a4271b;border-radius:6px;padding:10px;white-space:pre-wrap;word-break:break-word;font-size:12px;width:100%;margin:6px 0}
  .hidden{display:none!important}
  footer{color:var(--mut);font-size:12px;text-align:center;margin-top:30px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>🧪 Test Case Report — Pulse Sanity</h1>
    <div class="meta">Generated ${esc(generatedAt.toLocaleString())} · ${total} test cases · total run time ${dur(totalMs)}</div>
  </header>

  <div class="cards">
    <div class="c"><div class="n">${total}</div><div class="l">Total</div></div>
    <div class="c passed"><div class="n">${passed}</div><div class="l">Passed</div></div>
    <div class="c failed"><div class="n">${failed}</div><div class="l">Failed</div></div>
    <div class="c broken"><div class="n">${broken}</div><div class="l">Broken</div></div>
    <div class="c skipped"><div class="n">${skipped}</div><div class="l">Skipped</div></div>
  </div>

  <div class="bar">
    <span style="width:${(passed/total*100)||0}%;background:var(--ok)"></span>
    <span style="width:${(failed/total*100)||0}%;background:var(--fail)"></span>
    <span style="width:${(broken/total*100)||0}%;background:var(--broken)"></span>
    <span style="width:${(skipped/total*100)||0}%;background:var(--skip)"></span>
  </div>

  <div class="toolbar">
    <button data-f="all" class="active" onclick="filter(this,'all')">All</button>
    <button data-f="passed" onclick="filter(this,'passed')">Passed</button>
    <button data-f="failed" onclick="filter(this,'failed')">Failed</button>
    <button data-f="broken" onclick="filter(this,'broken')">Broken</button>
    <button data-f="skipped" onclick="filter(this,'skipped')">Skipped</button>
    <input id="q" placeholder="Search test cases…" oninput="search(this.value)">
    <button onclick="toggleAll(true)">Expand all</button>
    <button onclick="toggleAll(false)">Collapse all</button>
  </div>

  ${renderSuites()}

  <footer>Generated from Allure results · Pulse Sanity automation suite</footer>
</div>

<script>
  function filter(btn,status){
    document.querySelectorAll('.toolbar button[data-f]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.test').forEach(t=>{
      t.classList.toggle('hidden', status!=='all' && t.dataset.status!==status);
    });
  }
  function search(q){
    q=q.toLowerCase();
    document.querySelectorAll('.test').forEach(t=>{
      const hit=t.querySelector('.tname').textContent.toLowerCase().includes(q)
        || t.textContent.toLowerCase().includes(q);
      t.classList.toggle('hidden', q && !hit);
    });
  }
  function toggleAll(open){
    document.querySelectorAll('.tbody').forEach(b=>b.classList.toggle('open',open));
  }
  // header click toggles its own tbody (inline handler targets the id) — ensure caret rotates
  document.querySelectorAll('.thead').forEach(h=>h.addEventListener('click',()=>{
    const body=h.nextElementSibling;
    const caret=h.querySelector('.caret');
    if(caret) caret.style.transform = body.classList.contains('open') ? 'rotate(90deg)' : '';
  }));
</script>
</body>
</html>`;

fs.writeFileSync(outFile, html);
console.log(`✓ Test case report generated: ${outFile}`);
console.log(`  ${total} tests — ${passed} passed, ${failed} failed, ${broken} broken, ${skipped} skipped`);
console.log(`  Self-contained HTML — share directly, opens by double-click (no server needed).`);
