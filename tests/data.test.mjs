import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { readData } from './helpers/sandbox.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const baseline = readData('baseline.json');
const rates = readData('rates.json');

// Keys starting with _ are metadata; main.js filters them out of the country list.
const countries = Object.keys(baseline).filter(code => !code.startsWith('_'));

test('the ranking covers exactly ten countries', () => {
  assert.equal(countries.length, 10);
});

test('every country has a rate the converter can use', () => {
  for (const code of countries) {
    const { currencyCode } = baseline[code];
    assert.ok(currencyCode, `${code} has no currencyCode`);
    assert.ok(currencyCode in rates.rates,
      `${code} wants ${currencyCode}, which rates.json does not carry — this would blank the ranking`);
  }
});

test('every country has a usable salary baseline', () => {
  for (const code of countries) {
    const country = baseline[code];
    const monthly = country.average_monthly_salary || country.gni_per_capita / 12;
    assert.ok(monthly > 0 && Number.isFinite(monthly), `${code} has no positive salary basis`);
  }
});

test('the currency dropdown offers every country currency', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const options = [...html.matchAll(/<option value="([A-Z]{3})">/g)].map(m => m[1]);
  assert.equal(options.length, 10, 'expected ten dropdown entries');
  for (const code of countries) {
    assert.ok(options.includes(baseline[code].currencyCode),
      `${code} uses ${baseline[code].currencyCode} but the dropdown has no such option`);
  }
});

test('baseline metadata records where the numbers came from', () => {
  assert.ok(baseline._meta, 'baseline.json lost its _meta provenance block');
  for (const key of ['salarySource', 'salaryAsOf', 'note']) {
    assert.ok(baseline._meta[key], `_meta.${key} is missing`);
  }
});

test('flag assets exist for every country and keep intrinsic size', () => {
  for (const code of countries) {
    const file = path.join(ROOT, 'assets', 'flags', `${code.toLowerCase()}.svg`);
    assert.ok(fs.existsSync(file), `${code} has no flag asset`);
    const svg = fs.readFileSync(file, 'utf8').split('\n')[0];
    // html2canvas measures a viewBox-only SVG as 0x0 and silently drops it
    assert.match(svg, /width="\d+"\s+height="\d+"/, `${code}.svg lacks width/height`);
  }
});
