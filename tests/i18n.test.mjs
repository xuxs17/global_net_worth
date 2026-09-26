import test from 'node:test';
import assert from 'node:assert/strict';

import { loadModules } from './helpers/sandbox.mjs';

const LANGS = ['en', 'ja', 'ko', 'zh-CN', 'vi', 'hi', 'pt-BR'];

const load = options => loadModules(['i18n'], { expose: ['I18n'], ...options }).I18n;

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
  const I18n = load({});
  I18n.setLang('klingon');
  assert.equal(I18n.getLang(), 'en');
  I18n.setLang('hi');
  assert.equal(I18n.getLang(), 'hi');
  assert.equal(I18n.t('title'), 'दुनिया भर में आपकी आय का स्तर क्या है?');
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

test('every locale labels all seven wealth levels', () => {
  const I18n = load({});
  const keys = Object.keys(I18n.levelLabels.en);
  assert.equal(keys.length, 7);
  for (const lang of LANGS) {
    for (const key of keys) {
      const label = I18n.levelLabels[lang]?.[key];
      assert.equal(typeof label, 'string', `${lang} is missing level ${key}`);
      assert.ok(label.length > 0);
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
