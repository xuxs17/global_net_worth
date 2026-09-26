import test from 'node:test';
import assert from 'node:assert/strict';

import { loadModules, readData } from './helpers/sandbox.mjs';

const { ExchangeModule } = loadModules(['exchange']);
const ratesFile = readData('rates.json');

test.before(async () => {
  await ExchangeModule.load();
});

test('converts to and from the USD base', () => {
  const { rates } = ratesFile;
  assert.ok(Math.abs(ExchangeModule.convertToUSD(rates.CNY, 'CNY') - 1) < 1e-9);
  assert.ok(Math.abs(ExchangeModule.convertFromUSD(1, 'VND') - rates.VND) < 1e-6);
});

test('round-tripping a salary returns the original amount', () => {
  for (const currency of Object.keys(ratesFile.rates)) {
    const usd = ExchangeModule.convertToUSD(12345.67, currency);
    const back = ExchangeModule.convertFromUSD(usd, currency);
    assert.ok(Math.abs(back - 12345.67) < 1e-6, `${currency} drifted`);
  }
});

test('rejects a currency the file does not carry', () => {
  assert.throws(() => ExchangeModule.convertToUSD(100, 'XYZ'), /Unsupported currency/);
  assert.throws(() => ExchangeModule.convertFromUSD(100, ''), /Unsupported currency/);
});

test('exposes the date, source and staleness metadata', () => {
  assert.equal(ExchangeModule.getDate(), ratesFile.date);

  const sources = ExchangeModule.getSources();
  for (const currency of Object.keys(ratesFile.rates)) {
    assert.ok(sources[currency], `no recorded source for ${currency}`);
    assert.ok(
      ['reference', 'ecb', 'er-api', 'cached'].includes(sources[currency]),
      `unknown source ${sources[currency]} for ${currency}`
    );
  }

  // RUB and VND are outside ECB coverage; if a run ever falls back to cached
  // values the file must say so instead of showing them under a fresh date.
  const stale = ExchangeModule.getStale();
  for (const currency of Object.keys(stale)) {
    assert.ok(currency in ratesFile.rates, `stale entry ${currency} has no rate`);
    assert.match(String(stale[currency]), /^\d{4}-\d{2}-\d{2}$|^unknown$/);
  }
});

test('rates are all positive and finite', () => {
  for (const [currency, value] of Object.entries(ratesFile.rates)) {
    assert.equal(typeof value, 'number', `${currency} is not a number`);
    assert.ok(Number.isFinite(value) && value > 0, `${currency}=${value} is unusable`);
  }
});
