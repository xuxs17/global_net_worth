import test from 'node:test';
import assert from 'node:assert/strict';

import { loadModules } from './helpers/sandbox.mjs';

// formatAmount is the only money formatter in the app, and TC-02 pins its
// decimal rules per currency.
const { RenderModule } = loadModules(['i18n', 'render']);

test('currencies that never use decimals render as integers (TC-02)', () => {
  for (const currency of ['JPY', 'VND', 'IDR', 'RUB', 'INR']) {
    assert.equal(RenderModule.formatAmount(1234.56, currency), '1,235', currency);
  }
});

test('decimal currencies keep two places', () => {
  for (const currency of ['USD', 'EUR', 'GBP', 'CNY', 'BRL']) {
    assert.equal(RenderModule.formatAmount(1234.5, currency), '1,234.50', currency);
  }
});

test('large amounts keep thousands separators and do not spill digits', () => {
  assert.equal(RenderModule.formatAmount(26684741.2, 'IDR'), '26,684,741');
  assert.equal(RenderModule.formatAmount(1489.6, 'USD'), '1,489.60');
});
