import test from 'node:test';
import assert from 'node:assert/strict';

import { loadModules } from './helpers/sandbox.mjs';

const { LevelsModule } = loadModules(['i18n', 'levels']);

// The bands documented in CLAUDE.md: >10, (5,10], (1,5], (0.5,1], (0.2,0.5],
// (0.1,0.2], <=0.1. The exact boundary values are where the implementation has
// drifted before, so they are the point of this table rather than decoration.
const BANDS = [
  [10.5, 'extremely_rich'],
  [10, 'very_rich'],
  [9.999, 'very_rich'],
  [5, 'middle'],
  [4.9, 'middle'],
  [1, 'average'],
  [0.99, 'average'],
  [0.5, 'low'],
  [0.49, 'low'],
  [0.2, 'very_low'],
  [0.19, 'very_low'],
  [0.1, 'extremely_low'],
  [0.05, 'extremely_low'],
  [0, 'extremely_low'],
];

test('determineLevel matches the documented half-open bands', () => {
  for (const [ratio, expected] of BANDS) {
    assert.equal(LevelsModule.determineLevel(ratio).key, expected, `ratio ${ratio}`);
  }
});

test('extreme ratios stay inside a band', () => {
  assert.equal(LevelsModule.determineLevel(Infinity).key, 'extremely_rich');
  assert.equal(LevelsModule.determineLevel(Number.MAX_VALUE).key, 'extremely_rich');
  assert.equal(LevelsModule.determineLevel(1e-12).key, 'extremely_low');
});

test('bands are contiguous and descending with no overlap', () => {
  const levels = LevelsModule.LEVELS;
  assert.equal(levels[0].min, 10);
  assert.equal(levels[levels.length - 1].max, 0.1);
  for (let i = 1; i < levels.length; i += 1) {
    assert.equal(levels[i - 1].min, levels[i].max, `gap between ${levels[i - 1].key}/${levels[i].key}`);
    assert.ok(levels[i].min < levels[i].max, `${levels[i].key} is inverted`);
  }
});

test('every level resolves to a non-empty label', () => {
  for (const { key } of LevelsModule.LEVELS) {
    const label = LevelsModule.getLevelLabel(key);
    assert.equal(typeof label, 'string');
    assert.ok(label.length > 0, `empty label for ${key}`);
    assert.notEqual(label, key, `label for ${key} fell through to the raw key`);
  }
});
