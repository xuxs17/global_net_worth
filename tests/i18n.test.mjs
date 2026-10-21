import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

import { loadModules, makeContext } from './helpers/sandbox.mjs';

const LANGS = ['en', 'ja', 'ko', 'zh-CN', 'vi', 'hi', 'pt-BR'];

const load = options => loadModules(['i18n'], { expose: ['I18n'], ...options }).I18n;

function loadWithoutStorage(options, failure) {
  const context = makeContext(options);
  Object.defineProperty(context, 'localStorage', {
    get() {
      if (failure === 'access') throw new Error('Storage is blocked');
      return {
        getItem() { throw new Error('Storage reads are blocked'); },
        setItem() { throw new Error('Storage writes are blocked'); },
      };
    },
  });
  vm.runInContext(fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8'), context);
  return { I18n: vm.runInContext('I18n', context), context };
}

const PASSPORT_KEYS = [
  'title', 'heroEyebrow', 'heroLine1', 'heroLine2', 'subtitle', 'startJourney',
  'howItWorks', 'inputTitle', 'monthlySalary', 'currency', 'calcBtn', 'tryExample',
  'quickAmounts', 'privacyShort', 'basisShort', 'loading', 'emptyTitle', 'emptyHint',
  'passport', 'monthlyIncome', 'summaryCount', 'summarySuffix', 'bestTitle',
  'closestTitle', 'lowestTitle', 'ratioSentence', 'resultsTitle', 'resultsSubtitle',
  'yourSalary', 'localAverage', 'averageMarker', 'above', 'below', 'equal',
  'viewDetails', 'scenarios', 'halfSalary', 'doubleSalary', 'shareTitle',
  'shareDescription', 'shareBtn', 'copyLink', 'copied', 'copyPrompt', 'imageReady',
  'capturing', 'screenshotFailed', 'shareChanged', 'dataError', 'retry', 'inputError',
  'amountTooLarge', 'currencyError', 'dataUnavailable', 'resultsReady', 'ratesLabel',
  'salaryYear', 'outdatedRates', 'unknownRates', 'staleNote', 'basisTitle',
  'basisDescription', 'caveat', 'sourceNote', 'freshnessNote', 'whyOrder',
  'orderAnswer', 'privacyTitle', 'privacyDescription', 'aboutTitle',
  'aboutDescription', 'footerTagline', 'backToTop', 'advertisement',
  'captureDisclaimer', 'captureBasis', 'captureDate', 'basedOn', 'partialData',
  'linkPrivacy', 'methodology', 'perMonth', 'sourceLink',
];

test('language selection prefers URL, then stored choice, then browser', () => {
  assert.equal(load({ search: '?lang=vi' }).getLang(), 'vi');
  assert.equal(load({ search: '?lang=vi', storage: { 'gsw-lang': 'ja' } }).getLang(), 'vi');
  assert.equal(load({ storage: { 'gsw-lang': 'ja' } }).getLang(), 'ja');
  assert.equal(load({ languages: ['ko-KR'] }).getLang(), 'ko');
  assert.equal(load({}).getLang(), 'en');
});

test('browser language matching tolerates region variants and falls back', () => {
  assert.equal(load({ languages: ['zh-TW', 'en'] }).getLang(), 'zh-CN');
  assert.equal(load({ languages: ['pt'] }).getLang(), 'pt-BR');
  assert.equal(load({ languages: ['de-DE', 'fr-FR'] }).getLang(), 'en');
  assert.equal(load({ languages: [] }).getLang(), 'en');
});

test('unknown ?lang= values cannot reach inherited Object members', () => {
  // translations['constructor'] is truthy, which previously let a URL parameter
  // select a language whose lookups returned Object itself.
  for (const hostile of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    const I18n = load({ search: `?lang=${hostile}` });
    assert.equal(I18n.getLang(), 'en', `?lang=${hostile} was accepted`);
    assert.equal(typeof I18n.t('title'), 'string');
    assert.equal(I18n.getDefaultCurrency(hostile), 'USD');
  }
});

test('setLang ignores unsupported codes and persists real ones', () => {
  const { I18n, context } = loadModules(['i18n'], { expose: ['I18n'] });
  I18n.setLang('klingon');
  assert.equal(I18n.getLang(), 'en');
  I18n.setLang('hi');
  assert.equal(I18n.getLang(), 'hi');
  assert.equal(I18n.t('title'), 'दुनिया भर में आपकी आय का स्तर क्या है?');
  assert.equal(context.localStorage.getItem('gsw-lang'), 'hi');
  assert.equal(context.document.documentElement.lang, 'hi');
});

test('blocked storage cannot prevent initial language selection or later changes', () => {
  for (const failure of ['access', 'methods']) {
    const { I18n, context } = loadWithoutStorage({ languages: ['ko-KR'] }, failure);
    assert.equal(I18n.getLang(), 'ko');
    assert.doesNotThrow(() => I18n.setLang('vi'));
    assert.equal(I18n.getLang(), 'vi');
    assert.equal(context.document.documentElement.lang, 'vi');
    assert.equal(loadWithoutStorage({ search: '?lang=ja', languages: ['ko-KR'] }, failure).I18n.getLang(), 'ja');
    assert.equal(loadWithoutStorage({ languages: ['de-DE'] }, failure).I18n.getLang(), 'en');
  }
});

test('unsupported URL and stored language values fall through to the browser', () => {
  assert.equal(load({ search: '?lang=bad', storage: { 'gsw-lang': 'bad' }, languages: ['vi-VN'] }).getLang(), 'vi');
});

test('passport wording exists in every supported language', () => {
  const I18n = load({});
  for (const lang of LANGS) {
    I18n.setLang(lang);
    for (const key of PASSPORT_KEYS) {
      const text = I18n.translations[lang][key];
      assert.equal(typeof text, 'string', `missing ${lang}.${key}`);
      assert.ok(text.trim().length > 0 && text !== key, `untranslated ${lang}.${key}`);
    }
  }
});

test('parameter interpolation preserves every locale placeholder and replaces repeated occurrences literally', () => {
  const I18n = load({});
  const parameters = {
    summarySuffix: { count: 7, total: 10 },
    ratioSentence: { ratio: '2.4' },
    resultsReady: { n: 10 },
    salaryYear: { year: 2025 },
    outdatedRates: { days: 8 },
    basedOn: { salary: '$& 1,000' },
    partialData: { count: 2 },
  };
  for (const lang of LANGS) {
    I18n.setLang(lang);
    for (const [key, params] of Object.entries(parameters)) {
      for (const [name, value] of Object.entries(params)) {
        assert.ok(I18n.translations[lang][key].includes(`{${name}}`), `${lang}.${key} lost {${name}}`);
        assert.ok(I18n.t(key, params).includes(String(value)), `${lang}.${key} did not interpolate {${name}}`);
      }
      assert.ok(!/\{\w+\}/.test(I18n.t(key, params)), `${lang}.${key} left placeholders`);
    }
  }
  I18n.setLang('en');
  I18n.translations.en.testRepeated = '{count}/{count} {missing}';
  assert.equal(I18n.t('testRepeated', { count: '$&' }), '$&/$& {missing}');
  assert.equal(I18n.t('testRepeated'), '{count}/{count} {missing}');
});

test('unknown translation keys cannot expose inherited object members', () => {
  const I18n = load({});
  for (const key of ['missingKey', 'constructor', '__proto__', 'toString']) {
    assert.equal(I18n.t(key), key);
  }
});

test('number formatting follows the selected language and caller precision', () => {
  const I18n = load({});
  I18n.setLang('en');
  assert.equal(I18n.formatNumber(1234567.5, { minimumFractionDigits: 2 }), '1,234,567.50');
  I18n.setLang('pt-BR');
  assert.equal(I18n.formatNumber(1234567.5, { minimumFractionDigits: 2 }), '1.234.567,50');
  I18n.setLang('hi');
  assert.equal(I18n.formatNumber(1234567.5), '12,34,567.5');
  I18n.setLang('ja');
  assert.equal(I18n.formatNumber(1234.56, { maximumFractionDigits: 0 }), '1,235');
});

test('every locale covers every key the English UI uses', () => {
  const I18n = load({});
  const reference = Object.keys(I18n.translations.en);
  for (const lang of LANGS) {
    const keys = Object.keys(I18n.translations[lang]);
    assert.deepEqual(keys.slice().sort(), reference.slice().sort(), `key set differs for ${lang}`);
    for (const key of reference) {
      assert.ok(I18n.translations[lang][key], `empty ${lang}.${key}`);
    }
  }
});

test('every locale labels all seven ratio bands without wealth or class assertions', () => {
  const I18n = load({});
  const bands = {
    extremely_rich: '>10×', very_rich: '5–10×', middle: '1–5×',
    average: '0.5–1×', low: '0.2–0.5×', very_low: '0.1–0.2×', extremely_low: '≤0.1×',
  };
  for (const lang of LANGS) {
    I18n.setLang(lang);
    assert.equal(Object.keys(I18n.levelLabels[lang]).length, 7);
    for (const [key, expected] of Object.entries(bands)) {
      assert.equal(I18n.levelLabel(key), expected, `${lang}.${key}`);
    }
  }
});

test('no wealth label uses the banned poverty wording', () => {
  const I18n = load({});
  const banned = ['赤贫', '穷人'];
  for (const lang of LANGS) {
    for (const [key, label] of Object.entries(I18n.levelLabels[lang])) {
      for (const word of banned) {
        assert.ok(!label.includes(word), `${lang}.${key} says "${label}"`);
      }
    }
  }
});

test('country names resolve for all ten countries in all locales', () => {
  const I18n = load({});
  const codes = ['US', 'GB', 'DE', 'JP', 'CN', 'RU', 'IN', 'VN', 'ID', 'BR'];
  for (const lang of LANGS) {
    I18n.setLang(lang);
    for (const code of codes) {
      const name = I18n.countryName(code);
      assert.equal(typeof name, 'string', `${lang}/${code} returned ${typeof name}`);
      assert.ok(name.length > 0 && name !== code, `${lang}/${code} unresolved`);
    }
  }
});

test('each locale defaults to a currency the rate file carries', async () => {
  const { ExchangeModule, I18n } = loadModules(['i18n', 'exchange'], { expose: ['I18n', 'ExchangeModule'] });
  await ExchangeModule.load();
  const rates = ExchangeModule.getRates().rates;
  for (const lang of LANGS) {
    const currency = I18n.getDefaultCurrency(lang);
    assert.ok(currency in rates, `${lang} defaults to ${currency}, which has no rate`);
  }
});
