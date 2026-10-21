// Optional real-browser acceptance suite. Uses an already available Playwright;
// no browser or package installation is performed by this script.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const output = process.argv[3];
assert.ok(output && fs.existsSync(output), 'Pass an existing screenshot directory as the second argument');
const baseline = JSON.parse(fs.readFileSync(new URL('../data/baseline.json', import.meta.url)));
const rates = JSON.parse(fs.readFileSync(new URL('../data/rates.json', import.meta.url)));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
const leaks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (request.resourceType() !== 'document' && /[?&]amount=/.test(request.headers().referer || '')) leaks.push(request.url());
});
const checkWidth = async () => {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(sizes.document <= sizes.viewport, `Horizontal overflow: ${JSON.stringify(sizes)}`);
};
const ready = async () => page.waitForFunction(() => !document.getElementById('calc-btn').disabled);
const cards = () => page.locator('.result-card');
const ratio = () => page.locator('.card-ratio').first().getAttribute('aria-label');
const checks = [];

try {
  await page.goto(`${base}/?lang=en`, { waitUntil: 'domcontentloaded' });
  await ready();
  await checkWidth();
  await page.screenshot({ path: path.join(output, 'desktop-home.png'), fullPage: true });
  await page.locator('#currency').selectOption('EUR');
  await page.locator('#language').selectOption('ja');
  assert.equal(await page.locator('#currency').inputValue(), 'EUR');
  await page.locator('#language').selectOption('en');
  checks.push('language change preserves a manually selected currency before amount entry');
  await page.locator('.quick-fill').first().click();
  await page.waitForFunction(() => document.querySelectorAll('.result-card').length === 10);
  assert.equal(new URL(page.url()).searchParams.get('lang'), 'en');
  await page.locator('#amount').fill('3000');
  await page.locator('#currency').selectOption('USD');
  const before = await ratio();
  await page.locator('#currency').selectOption('CNY');
  assert.notEqual(await ratio(), before);
  assert.equal(new URL(page.url()).searchParams.has('from'), false);
  await page.locator('#double-btn').click();
  assert.equal(await page.locator('#amount').inputValue(), '6000');
  assert.equal(new URL(page.url()).searchParams.has('amount'), false);
  await page.locator('#half-btn').click();
  assert.equal(await page.locator('#amount').inputValue(), '3000');
  checks.push('preset, amount, currency, double and half stay synchronized');

  await page.locator('#language').selectOption('ja');
  assert.equal(await page.locator('#amount').inputValue(), '3000');
  assert.equal(await page.locator('#currency').inputValue(), 'CNY');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
  await page.locator('#language').selectOption('en');
  await page.locator('#amount').fill('5000');
  await page.locator('#currency').selectOption('USD');
  await page.screenshot({ path: path.join(output, 'desktop-results.png'), fullPage: true });
  assert.equal(await page.locator('#ad-container').isVisible(), false);

  // Export real canvases in every locale. Decode them in the browser, then
  // preserve the exact generated PNGs for visual review.
  for (const lang of ['en', 'zh-CN', 'ja', 'ko', 'vi', 'hi', 'pt-BR']) {
    await page.locator('#language').selectOption(lang);
    await page.setViewportSize({ width: 390, height: 844 });
    await checkWidth();
    assert.equal(await cards().count(), 10);
    assert.equal(await page.locator('#amount').inputValue(), '5000');
    const untranslated = await page.locator('[data-i18n]').evaluateAll(elements => elements
      .filter(element => element.textContent.trim() === element.dataset.i18n).map(element => element.dataset.i18n));
    assert.deepEqual(untranslated, []);
    await page.screenshot({ path: path.join(output, `mobile-${lang}.png`), fullPage: true });
    const image = await page.evaluate(async () => {
      const [rates, baseline] = await Promise.all(['rates', 'baseline'].map(async name => (await fetch(`data/${name}.json`)).json()));
      const report = CalculatorModule.calculate({ amount: 5000, fromCurrency: 'USD', rates, baseline });
      const blob = await ShareModule.createImage(report, { rates, baseline });
      const bitmap = await createImageBitmap(blob);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return { type: blob.type, width: bitmap.width, height: bitmap.height, data: btoa(binary) };
    });
    assert.equal(image.type, 'image/png');
    assert.equal(image.width, 1080);
    assert.equal(image.height, 1350);
    fs.writeFileSync(path.join(output, `passport-${lang}.png`), Buffer.from(image.data, 'base64'));
  }
  checks.push('seven locales retain input, fit mobile width and export real PNG posters');
  await page.locator('#language').selectOption('en');
  await page.setViewportSize({ width: 360, height: 800 });
  await checkWidth();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#share-img-btn').click();
  const download = await downloadPromise;
  await download.saveAs(path.join(output, 'passport-download.png'));
  assert.equal(download.suggestedFilename(), 'global-salary-passport.png');
  checks.push('save button downloads the generated passport');

  // An export started for an older input must never save that old result.
  await page.evaluate(() => {
    const original = ShareModule.createImage;
    window.__restoreExport = () => { ShareModule.createImage = original; };
    ShareModule.createImage = (...args) => new Promise(resolve => {
      window.__finishExport = () => original(...args).then(resolve);
    });
  });
  let staleDownloads = 0;
  const countDownload = () => { staleDownloads++; };
  page.on('download', countDownload);
  await page.locator('#share-img-btn').click();
  await page.waitForFunction(() => typeof window.__finishExport === 'function');
  await page.locator('#amount').fill('7000');
  await page.evaluate(() => window.__finishExport());
  await page.waitForFunction(() => !document.getElementById('share-img-btn').disabled);
  assert.equal(staleDownloads, 0);
  await page.evaluate(() => window.__restoreExport());
  page.off('download', countDownload);
  checks.push('in-flight export is discarded when input changes');

  await page.evaluate(() => {
    const share = Object.getOwnPropertyDescriptor(navigator, 'share');
    const canShare = Object.getOwnPropertyDescriptor(navigator, 'canShare');
    const touch = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
    const matchMedia = window.matchMedia;
    window.__restoreNative = () => {
      if (share) Object.defineProperty(navigator, 'share', share); else delete navigator.share;
      if (canShare) Object.defineProperty(navigator, 'canShare', canShare); else delete navigator.canShare;
      if (touch) Object.defineProperty(navigator, 'maxTouchPoints', touch); else delete navigator.maxTouchPoints;
      window.matchMedia = matchMedia;
    };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 1 });
    window.matchMedia = query => query === '(pointer:coarse)' ? { matches: true } : matchMedia.call(window, query);
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => new Promise((_resolve, reject) => {
      window.__rejectNative = () => reject(new DOMException('Native sharing unavailable', 'NotAllowedError'));
    }) });
  });
  staleDownloads = 0;
  page.on('download', countDownload);
  await page.locator('#share-img-btn').click();
  await page.waitForFunction(() => typeof window.__rejectNative === 'function');
  await page.locator('#amount').fill('9000');
  await page.evaluate(() => window.__rejectNative());
  await page.waitForFunction(() => !document.getElementById('share-img-btn').disabled);
  assert.equal(staleDownloads, 0);
  assert.equal(await page.locator('#toast').textContent(), 'Your input changed. Create a new passport.');
  await page.evaluate(() => window.__restoreNative());
  page.off('download', countDownload);
  checks.push('failed native share cannot download an invalidated old report');

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#copy-link-btn').click();
  const copied = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  assert.equal(copied.searchParams.get('amount'), '9000');
  assert.equal(copied.searchParams.get('from'), 'USD');
  checks.push('copy link writes the current salary, currency and language to the clipboard');

  await page.locator('#amount').fill('');
  assert.equal(await page.locator('#result-section').isVisible(), false);
  assert.equal(new URL(page.url()).searchParams.has('amount'), false);
  await page.locator('#amount').fill('1e20');
  assert.equal(await page.locator('#result-section').isVisible(), false);
  assert.ok((await page.locator('#input-error').textContent()).length > 0);
  await page.goto(`${base}/?amount=12oops&from=USD&lang=en`);
  await ready();
  assert.equal(await page.locator('#amount').inputValue(), '');
  assert.equal(new URL(page.url()).searchParams.has('amount'), false);
  checks.push('clear, excessive input and malformed links invalidate old results');

  const partial = structuredClone(baseline);
  delete partial.IN.average_monthly_salary;
  await page.route('**/data/baseline.json', route => route.fulfill({ json: partial }));
  await page.goto(`${base}/?amount=5000&from=USD&lang=en`);
  await ready();
  assert.equal(await cards().count(), 10);
  assert.equal(await page.locator('.level-unavailable').count(), 1);
  assert.equal((await page.locator('#summary-total').textContent()).trim(), '/9');
  assert.equal(await page.locator('#partial-note').isVisible(), true);
  await page.unroute('**/data/baseline.json');
  checks.push('one unavailable country is isolated and omitted from summary denominator');

  await page.route('**/data/baseline.json', route => route.fulfill({ json: {} }));
  await page.goto(`${base}/?amount=5000&from=USD&lang=en`);
  await page.locator('#retry-btn').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#result-section').isVisible(), false);
  assert.equal(await page.locator('#input-error').textContent(), '');
  await page.unroute('**/data/baseline.json');
  await page.locator('#retry-btn').click();
  await ready();
  assert.equal(await cards().count(), 10);
  checks.push('all-country failure is presented as a data error and retry restores the shared input');

  const oldRates = { ...rates, date: '2020-01-01', stale: { RUB: '2019-12-31' } };
  await page.route('**/data/rates.json', route => route.fulfill({ json: oldRates }));
  await page.goto(`${base}/?amount=3000&from=USD&lang=en`);
  await ready();
  const warning = await page.locator('#data-warning').textContent();
  assert.match(warning, /RUB \(2019-12-31\)/);
  assert.match(warning, /days old/);
  assert.match(await page.locator('#data-date').textContent(), /2020-01-01/);
  await page.unroute('**/data/rates.json');
  checks.push('old and carried-over rates display the real file dates');

  await page.route('**/data/rates.json', route => route.abort());
  await page.goto(`${base}/?lang=en`);
  await page.locator('#retry-btn').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#calc-btn').isDisabled(), true);
  await page.unroute('**/data/rates.json');
  await page.locator('#retry-btn').click();
  await ready();
  checks.push('data load failure has a working retry');

  await page.evaluate(fs.readFileSync(new URL('../scripts/make_og_image.js', import.meta.url), 'utf8'));
  const og = await page.evaluate(async () => {
    const canvas = await window.createOGImage();
    return { width: canvas.width, height: canvas.height, data: canvas.toDataURL('image/png').split(',')[1] };
  });
  assert.equal(og.width, 1200);
  assert.equal(og.height, 630);
  fs.writeFileSync(path.join(output, 'og-image-preview.png'), Buffer.from(og.data, 'base64'));
  checks.push('social preview generated at 1200 by 630');
  assert.deepEqual(errors, []);
  assert.deepEqual(leaks, [], 'Salary leaked into resource referrers');
  console.log(JSON.stringify({ passed: checks, pageErrors: errors, referrerLeaks: leaks, output }, null, 2));
} finally {
  await browser.close();
}
