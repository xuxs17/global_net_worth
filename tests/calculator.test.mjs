import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadModules } from './helpers/sandbox.mjs';

export const sampleRates = {
  base: 'USD', date: '2026-10-20',
  rates: { USD: 1, CNY: 10, JPY: 100, INR: 50 },
};
export const sampleBaseline = {
  _meta: { salaryCurrency: 'USD', salaryAsOf: '2025' },
  IN: { currencyCode: 'INR', average_monthly_salary: 100 },
  JP: { currencyCode: 'JPY', average_monthly_salary: 500 },
  US: { currencyCode: 'USD', average_monthly_salary: 1000 },
};

function load() {
  assert.ok(fs.existsSync(path.resolve('js/calculator.js')),
    'the DOM-independent salary calculator is not implemented');
  return loadModules(['levels', 'calculator']).CalculatorModule;
}
const calculate = (module, overrides = {}) => module.calculate({
  amount: 5000, fromCurrency: 'CNY', rates: sampleRates, baseline: sampleBaseline, ...overrides,
});

test('compares USD monthly salary with USD baselines and counts strictly above average', () => {
  const report = calculate(load());
  assert.equal(report.amountUSD, 500);
  assert.deepEqual(Array.from(report.countries, row => row.countryCode), ['IN', 'JP', 'US']);
  assert.equal(report.countries[0].ratio, 5);
  assert.equal(report.countries[1].convertedAmount, 50000);
  assert.equal(report.countries[1].averageLocal, 50000);
  assert.equal(report.summary.aboveAverage, 1);
  assert.equal(report.summary.available, 3);
  assert.equal(report.summary.best.countryCode, 'IN');
  assert.equal(report.summary.closest.countryCode, 'JP');
});

test('doubling salary doubles each ratio without mutating source data or changing country order', () => {
  const module = load();
  const before = JSON.stringify(sampleBaseline);
  const first = calculate(module);
  const second = calculate(module, { amount: 10000 });
  first.countries.forEach((row, index) => {
    assert.equal(second.countries[index].countryCode, row.countryCode);
    assert.equal(second.countries[index].ratio, row.ratio * 2);
  });
  assert.equal(JSON.stringify(sampleBaseline), before);
});

test('a salary exactly on the average line is equal despite binary rounding', () => {
  const module = load();
  const rates = { base: 'USD', rates: { USD: 1, GBP: .75265 } };
  const baseline = { GB: { currencyCode: 'GBP', average_monthly_salary: 3290 } };
  const calculateGBP = amount => module.calculate({ amount, fromCurrency: 'GBP', rates, baseline });
  assert.equal(calculateGBP(2476.2185).countries[0].ratio, 1);
  assert.equal(calculateGBP(2476.2185).summary.aboveAverage, 0);
  assert.ok(calculateGBP(2476.2185 * (1 + 1e-10)).countries[0].ratio > 1);
  assert.ok(calculateGBP(2476.2185 * (1 - 1e-10)).countries[0].ratio < 1);
});

test('rejects partial, non-decimal, non-finite, negative and excessive inputs', () => {
  const module = load();
  for (const amount of ['100oops', '0x10', Infinity, '1e309', -1, 0, '', '   ']) {
    assert.throws(() => calculate(module, { amount }), error => error.code === 'input', String(amount));
  }
  assert.throws(() => calculate(module, { amount: 1e10 }), error => error.code === 'limit');
  assert.equal(calculate(module, { amount: ' 5000.50 ' }).amount, 5000.5);
});

test('rejects unsupported currencies and broken source rates', () => {
  const module = load();
  for (const fromCurrency of ['XYZ', 'constructor', '__proto__']) {
    assert.throws(() => calculate(module, { fromCurrency }), error => error.code === 'currency');
  }
  const rates = structuredClone(sampleRates);
  rates.rates.CNY = 0;
  assert.throws(() => calculate(module, { rates }), error => error.code === 'data');
});

test('isolates bad country data and never substitutes GNI for a missing salary', () => {
  const module = load();
  const baseline = structuredClone(sampleBaseline);
  baseline.IN.average_monthly_salary = undefined;
  baseline.IN.gni_per_capita = 1200;
  const report = calculate(module, { baseline });
  assert.equal(report.countries.at(-1).countryCode, 'IN');
  assert.equal(report.countries.at(-1).failed, true);
  assert.equal(report.summary.available, 2);
  assert.equal(report.summary.aboveAverage, 0);
  assert.equal(report.summary.total, 3);
});

test('all-country failure is a data error rather than an input error', () => {
  const module = load();
  const baseline = { US: { currencyCode: 'USD', average_monthly_salary: NaN } };
  assert.throws(() => calculate(module, { baseline }), error => error.code === 'data');
});

test('non-positive or non-finite target rates cannot produce valid result cards', () => {
  const module = load();
  for (const invalid of [0, -1, Infinity, NaN]) {
    const rates = structuredClone(sampleRates);
    rates.rates.INR = invalid;
    const report = calculate(module, { rates });
    assert.equal(report.countries.find(row => row.countryCode === 'IN').failed, true);
    assert.equal(report.summary.available, 2);
  }
});

test('freshness uses the file date, a seven-day threshold and carried-over currencies', () => {
  const module = load();
  const now = new Date('2026-10-21T12:00:00Z');
  assert.equal(module.getFreshness({ date: '2026-10-14' }, now).outdated, false);
  const old = module.getFreshness({ date: '2026-09-30', stale: { INR: '2026-09-29' } }, now);
  assert.equal(old.outdated, true);
  assert.equal(old.ageDays, 21);
  assert.equal(old.stale.INR, '2026-09-29');
  for (const date of ['nonsense', '2026-02-31', '2027-01-01', '']) {
    assert.equal(module.getFreshness({ date }, now).unknown, true, date);
  }
});
