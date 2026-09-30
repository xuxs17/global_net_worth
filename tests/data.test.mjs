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

test('public URLs all agree on one host', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const brand = html.match(/<div class="capture-brand">([^<]+)<\/div>/);

  const urls = [
    ...[...html.matchAll(/content="(https?:\/\/[^"]+)"/g)].map(m => m[1]),
    ...[...robots.matchAll(/Sitemap: (https?:\/\/\S+)/g)].map(m => m[1]),
    ...[...sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map(m => m[1]),
  ];
  assert.ok(urls.length >= 4, `expected several absolute URLs, found ${urls.length}`);

  const hosts = new Set(urls.map(u => new URL(u).host));
  // A dead host in the share-image watermark breaks the whole referral loop,
  // so the brand line has to name the same host the metadata uses.
  assert.ok(brand, 'share-image brand line is missing');
  hosts.add(brand[1]);

  assert.equal(hosts.size, 1, `URLs disagree on host: ${[...hosts].join(', ')}`);
});

test('every markdown file in the repo is blocked from the public site', () => {
  // Netlify only accepts `*` as a whole path segment, so `/*.md` cannot work and
  // each document needs its own rule. This test is what keeps that convention
  // from rotting when someone adds a new doc.
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  const blocked = new Set(
    [...toml.matchAll(/from = "([^"]+)"/g)].map(m => decodeURIComponent(m[1]))
  );
  const docs = [...fs.readdirSync(ROOT, { recursive: true })]
    .map(p => String(p))
    .filter(p => p.endsWith('.md') && !p.startsWith('.git') && !p.startsWith('node_modules'));

  assert.ok(docs.length >= 4, `expected the project docs to be found, got ${docs.length}`);
  for (const doc of docs) {
    assert.ok(blocked.has('/' + doc.split(path.sep).join('/')),
      `${doc} would be publicly served - add a [[redirects]] rule with force = true`);
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
