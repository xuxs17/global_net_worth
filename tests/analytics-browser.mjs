// Boundary checks using the existing Playwright installation. The Google tag
// is intercepted so these deterministic checks never pollute real analytics.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = new URL(process.argv[2] || 'http://127.0.0.1:4173').origin;
const output = process.argv[3];
assert.ok(output && fs.existsSync(output), 'Pass an existing screenshot output directory');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const scripts = [];
const errors = [];
const leaks = [];
const checks = [];
const config = fs.readFileSync(new URL('../js/site-config.js', import.meta.url), 'utf8')
  .replace("productionOrigin: 'https://global-salary-fun.netlify.app'", `productionOrigin: '${base}'`);
await context.route('**/js/site-config.js', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: config }));
await context.route('https://www.googletagmanager.com/gtag/js?*', route => {
  scripts.push(route.request().url());
  return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* Vendor tag intercepted during acceptance checks. */' });
});
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
context.on('request', request => {
  if (request.resourceType() !== 'document' && /[?&]amount=/.test(request.headers().referer || '')) leaks.push(request.url());
});
const page = await context.newPage();
const layer = () => page.evaluate(() => Array.from(window.dataLayer || [], values => Array.from(values)));
const valid = async () => page.waitForFunction(() => !document.getElementById('calc-btn').disabled);
const width = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile overflow');
try {
  await page.goto(`${base}/?amount=58731.29&from=CNY&lang=zh-CN`);
  await valid();
  assert.equal(await page.locator('#amount').inputValue(), '58731.29');
  assert.equal(new URL(page.url()).searchParams.has('amount'), false);
  assert.equal(new URL(page.url()).searchParams.has('from'), false);
  assert.equal(scripts.length, 0);
  assert.equal(await page.locator('#consent-banner').isVisible(), true);
  await width();
  await page.screenshot({ path: path.join(output, 'analytics-consent-mobile.png'), fullPage: false });
  await page.locator('#consent-decline').click();
  await page.locator('#amount').fill('61234.56');
  assert.equal(await page.locator('.result-card').count(), 10);
  assert.equal(scripts.length, 0);
  assert.equal((await layer()).length, 0);
  checks.push('legacy inputs restore, the address is cleaned, and refusal makes no Google requests');

  await page.locator('[data-privacy-settings]').click();
  await page.locator('#consent-accept').click();
  await page.waitForFunction(() => document.getElementById('ga4-tag'));
  await page.locator('#amount').fill('7000');
  await page.locator('#amount').fill('8000');
  await page.locator('#double-btn').click();
  await page.locator('#half-btn').click();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await page.locator('#copy-link-btn').click();
  const copied = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  assert.equal(copied.searchParams.get('amount'), '8000');
  assert.equal(copied.searchParams.get('from'), 'CNY');
  assert.equal(new URL(page.url()).searchParams.has('amount'), false);
  const download = page.waitForEvent('download');
  await page.locator('#share-img-btn').click();
  await download;
  const events = (await layer()).filter(values => values[0] === 'event');
  assert.equal(scripts.length, 1);
  assert.equal(events.filter(values => values[1] === 'page_view').length, 1);
  assert.equal(events.filter(values => values[1] === 'calculate').length, 1);
  for (const name of ['scenario_used', 'copy_link', 'save_image']) assert.ok(events.some(values => values[1] === name), name);
  for (const values of events) {
    assert.equal(values[2].page_location, `${base}/`);
    assert.equal(values[2].send_to, 'G-F5R6C0T4YV');
    assert.equal(/[?&]amount=|58731|61234|8000|16000/.test(JSON.stringify(values)), false);
  }
  checks.push('consent loads one tag, sends one view and one first calculation, and shares never leak amounts');

  await context.addCookies([{ name: '_ga', value: 'GA1.1.123.456', url: base }]);
  await page.locator('[data-privacy-settings]').click();
  await page.locator('#consent-decline').click();
  assert.equal(await page.evaluate(() => AnalyticsModule.track('calculate')), false);
  assert.equal((await context.cookies()).some(cookie => cookie.name === '_ga'), false);
  await page.reload();
  await valid();
  assert.equal(await page.locator('#consent-banner').isVisible(), false);
  assert.equal(scripts.length, 1);
  checks.push('withdrawal stops events, removes analytics cookies and remains declined after reload');

  await page.locator('[data-privacy-settings]').click();
  await page.locator('#consent-accept').click();
  const privacyTab = await context.newPage();
  await privacyTab.goto(`${base}/privacy.html?lang=zh-CN`);
  await privacyTab.locator('[data-privacy-settings]').click();
  await privacyTab.locator('#consent-decline').click();
  await page.waitForFunction(() => window['ga-disable-G-F5R6C0T4YV'] === true);
  assert.equal(await page.evaluate(() => AnalyticsModule.track('calculate')), false);
  await privacyTab.close();
  checks.push('withdrawing in a privacy tab immediately stops an already-open calculator');

  for (const name of ['privacy', 'about']) {
    for (const lang of ['en', 'zh-CN', 'ja', 'ko', 'vi', 'hi', 'pt-BR']) {
      await page.goto(`${base}/${name}.html?lang=${lang}`);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      await width();
      const missing = await page.locator('[data-i18n]').evaluateAll(elements => elements
        .filter(element => element.textContent === element.dataset.i18n).map(element => element.dataset.i18n));
      assert.deepEqual(missing, []);
      assert.equal(new URL(await page.locator('[data-language-link]').first().getAttribute('href')).searchParams.get('lang'), lang);
      await page.screenshot({ path: path.join(output, `${name}-${lang}.png`), fullPage: true });
    }
  }
  checks.push('privacy and about pages are complete and fit mobile width in seven languages');
  assert.deepEqual(errors, []);
  assert.deepEqual(leaks, []);
  console.log(JSON.stringify({ ok: true, checks, screenshots: output, pageErrors: errors, referrerLeaks: leaks }, null, 2));
} finally {
  await browser.close();
}
