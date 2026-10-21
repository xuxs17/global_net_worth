import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModules, readData } from './helpers/sandbox.mjs';

const rates = readData('rates.json');
const load = search => loadModules(['i18n', 'levels', 'calculator', 'share'], { search });

test('restores complete, supported salary links', () => {
  const { ShareModule } = load('?amount=10000&from=CNY&lang=zh-CN');
  const input = ShareModule.readURLParams(rates);
  assert.equal(input.amount, 10000);
  assert.equal(input.fromCurrency, 'CNY');
});

test('ignores partial numbers, excessive salaries, unsupported currencies and incomplete links', () => {
  for (const search of [
    '?amount=12oops&from=CNY', '?amount=0x10&from=USD', '?amount=1e309&from=USD',
    '?amount=100000001&from=USD', '?amount=-1&from=USD', '?amount=0&from=USD',
    '?amount=100&from=XYZ', '?amount=100&from=constructor', '?amount=100', '?from=USD',
  ]) {
    assert.equal(load(search).ShareModule.readURLParams(rates), null, search);
  }
});

test('salary URL updates carry language and preserve unrelated parameters and hash', () => {
  const { ShareModule, context } = load('?utm_source=friend#results');
  ShareModule.updateURL(10000, 'CNY', 'zh-CN');
  const url = context.window.location;
  assert.equal(url.searchParams.get('amount'), '10000');
  assert.equal(url.searchParams.get('from'), 'CNY');
  assert.equal(url.searchParams.get('lang'), 'zh-CN');
  assert.equal(url.searchParams.get('utm_source'), 'friend');
  assert.equal(url.hash, '#results');
});

test('clearing an invalidated result removes the salary from its URL', () => {
  const { ShareModule, context } = load('?amount=10000&from=CNY&lang=ja&utm_source=friend');
  assert.equal(typeof ShareModule.clearURL, 'function');
  ShareModule.clearURL();
  const params = context.window.location.searchParams;
  assert.equal(params.has('amount'), false);
  assert.equal(params.has('from'), false);
  assert.equal(params.get('lang'), 'ja');
  assert.equal(params.get('utm_source'), 'friend');
});

test('a failed native share cannot fall back to downloading a report invalidated while awaiting it', async () => {
  const { ShareModule, context } = load('?lang=en');
  let rejectNative;
  let current = true;
  let downloads = 0;
  context.File = File;
  context.setTimeout = () => {};
  context.URL = class extends URL {
    static createObjectURL() { downloads++; return 'blob:test'; }
  };
  context.document.body = { appendChild() {} };
  context.document.createElement = () => ({ click() {}, remove() {} });
  context.navigator.canShare = () => true;
  context.navigator.share = () => new Promise((_resolve, reject) => { rejectNative = reject; });
  const saving = ShareModule.saveImage(new Blob(['PNG'], { type: 'image/png' }), () => current);
  current = false;
  rejectNative(new Error('Native sharing unavailable'));
  assert.equal(await saving, 'stale');
  assert.equal(downloads, 0);
});
