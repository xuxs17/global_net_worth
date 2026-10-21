import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadModules } from './helpers/sandbox.mjs';

function load({ storage = {}, id = 'G-TEST123456', search = '?amount=58000&from=CNY&lang=zh-CN' } = {}) {
  const { context } = loadModules(['visit', 'i18n'], { search, storage });
  const scripts = [];
  const listeners = new Map();
  context.window.addEventListener = (name, handler) => listeners.set(name, [...listeners.get(name) || [], handler]);
  context.SiteConfig = { analyticsId: id, productionOrigin: 'https://global-salary-fun.netlify.app' };
  context.document.head = { appendChild: node => scripts.push(node) };
  context.document.createElement = () => ({});
  context.document.referrer = 'https://example.com/path?amount=58000#salary';
  context.document.cookie = '';
  context.document.querySelectorAll = () => [];
  vm.runInContext(fs.readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8'), context);
  const analytics = vm.runInContext('AnalyticsModule', context);
  const events = () => Array.from(context.window.dataLayer || [], args => Array.from(args));
  const dispatch = (name, event = {}) => (listeners.get(name) || []).forEach(handler => handler(event));
  return { analytics, context, scripts, events, dispatch };
}

test('no Google script or event is created before explicit analytics consent', () => {
  const { analytics, scripts, events } = load();
  analytics.init();
  assert.equal(analytics.track('calculate'), false);
  assert.equal(scripts.length, 0);
  assert.equal(events().length, 0);
});

test('consent loads one tag and one sanitized page view; duplicate init and consent do not inflate views', () => {
  const { analytics, context, scripts, events } = load();
  analytics.init();
  analytics.setConsent(true);
  analytics.init();
  analytics.setConsent(true);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /gtag\/js\?id=G-TEST123456$/);
  const views = events().filter(([command, name]) => command === 'event' && name === 'page_view');
  assert.equal(views.length, 1);
  assert.equal(views[0][2].page_location, 'https://global-salary-fun.netlify.app/');
  assert.equal(views[0][2].page_referrer, 'https://example.com/');
  assert.equal(context.localStorage.getItem('globalsalary:analytics-consent:v1'), 'granted');
  const config = events().find(([command]) => command === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(JSON.stringify(events()).includes('58000'), false);
});

test('only named product actions and enum parameters reach the tag', () => {
  const { analytics, events } = load();
  analytics.setConsent(true);
  assert.equal(analytics.track('calculate', { source: 'submit', amount: 58000, page_location: 'https://bad/?amount=58000' }), true);
  assert.equal(analytics.track('scenario_used', { action: 'double', amount: 116000 }), true);
  assert.equal(analytics.track('copy_link', { url: '?amount=58000', source: 'arbitrary' }), true);
  assert.equal(analytics.track('anything', { amount: 58000 }), false);
  assert.equal(analytics.track('page_view'), false);
  const product = events().filter(([command, name]) => command === 'event' && name !== 'page_view');
  assert.equal(product.length, 3);
  assert.equal(product[0][2].source, 'submit');
  assert.equal(product[1][2].action, 'double');
  assert.equal(Object.hasOwn(product[2][2], 'source'), false);
  assert.equal(JSON.stringify(events()).includes('58000'), false);
  assert.equal(JSON.stringify(events()).includes('116000'), false);
});

test('denial persists, suppresses future events and sets Google opt-out after an earlier grant', () => {
  const { analytics, context, scripts, events } = load();
  analytics.setConsent(false);
  analytics.init();
  assert.equal(scripts.length, 0);
  analytics.setConsent(true);
  analytics.setConsent(false);
  const count = events().length;
  assert.equal(analytics.track('save_image'), false);
  assert.equal(events().length, count);
  assert.equal(context.window['ga-disable-G-TEST123456'], true);
  assert.equal(context.localStorage.getItem('globalsalary:analytics-consent:v1'), 'denied');
});

test('stored decisions are respected and missing or malformed IDs never load a script', () => {
  const granted = load({ storage: { 'globalsalary:analytics-consent:v1': 'granted' } });
  granted.analytics.init();
  assert.equal(granted.scripts.length, 1);
  for (const id of ['', 'G-PLACEHOLDER', 'UA-123', 'G-X<script>']) {
    const { analytics, scripts } = load({ id });
    analytics.setConsent(true);
    analytics.init();
    assert.equal(scripts.length, 0, id);
  }
});

test('blocked localStorage does not break explicit in-memory consent or calculations', () => {
  const { analytics, context, scripts } = load();
  context.localStorage.getItem = () => { throw new Error('blocked'); };
  context.localStorage.setItem = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => analytics.init());
  assert.doesNotThrow(() => analytics.setConsent(true));
  assert.equal(scripts.length, 1);
});

test('every public page suppresses referrers before loading the first URL privacy guard', () => {
  for (const name of ['index.html', 'privacy.html', 'about.html']) {
    const html = fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
    const guard = html.indexOf('<script src="js/visit.js"></script>');
    const referrer = html.indexOf('<meta name="referrer" content="no-referrer">');
    assert.ok(referrer >= 0 && referrer < guard, name);
    assert.equal(html.indexOf('<script'), guard, name);
    assert.ok(html.indexOf('src="js/site-config.js"') < html.indexOf('src="js/analytics.js"'), name);
    assert.equal(/<script[^>]+src="https?:/.test(html), false, name);
  }
});

test('a browser privacy opt-out prevents an earlier stored grant from automatically loading Google', () => {
  const { analytics, context, scripts } = load({ storage: { 'globalsalary:analytics-consent:v1': 'granted' } });
  context.navigator.globalPrivacyControl = true;
  analytics.init();
  assert.equal(scripts.length, 0);
  assert.equal(analytics.track('calculate'), false);
});

test('withdrawing consent in another tab stops the already-open calculator', () => {
  const { analytics, context, events, dispatch } = load();
  analytics.init();
  analytics.setConsent(true);
  context.localStorage.setItem('globalsalary:analytics-consent:v1', 'denied');
  dispatch('storage', { key: 'globalsalary:analytics-consent:v1' });
  const count = events().length;
  assert.equal(analytics.track('calculate'), false);
  assert.equal(events().length, count);
  assert.equal(context.window['ga-disable-G-TEST123456'], true);
});

test('a restored page rereads consent after withdrawal on the privacy page', () => {
  const { analytics, context, dispatch } = load();
  analytics.init();
  analytics.setConsent(true);
  context.localStorage.setItem('globalsalary:analytics-consent:v1', 'denied');
  dispatch('pageshow', { persisted: true });
  assert.equal(analytics.track('copy_link'), false);
  assert.equal(context.window['ga-disable-G-TEST123456'], true);
});
