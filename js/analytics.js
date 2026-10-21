const AnalyticsModule = (() => {
  const storageKey = 'globalsalary:analytics-consent:v1';
  const events = new Set(['calculate', 'preset_used', 'scenario_used', 'language_changed', 'copy_link', 'save_image']);
  const sources = new Set(['submit', 'input', 'currency', 'preset', 'scenario', 'restore']);
  const actions = new Set(['half', 'double']);
  let consent = null;
  let readStored = false;
  let bound = false;
  let loaded = false;
  let viewed = false;
  const el = id => document.getElementById(id);
  const configured = () => /^G-[A-Z0-9]{10}$/.test(SiteConfig.analyticsId)
    && window.location.origin === SiteConfig.productionOrigin;
  const optedOut = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';

  function pageParameters() {
    let referrer = '';
    try {
      const url = new URL(document.referrer);
      if (url.protocol === 'https:' || url.protocol === 'http:') referrer = `${url.origin}/`;
    } catch (_) { /* An empty or invalid referrer is ordinary. */ }
    return {
      page_location: `${window.location.origin}${window.location.pathname}`,
      page_referrer: referrer,
      page_title: 'GlobalSalary',
      language: I18n.getLang(),
      send_to: SiteConfig.analyticsId,
    };
  }

  function updateUI() {
    const banner = el('consent-banner');
    if (banner) banner.hidden = !configured() || consent !== null || optedOut();
    const status = el('consent-status');
    if (status) status.textContent = I18n.t(!configured() ? 'analyticsUnavailable'
      : consent === true ? 'analyticsAllowed' : 'analyticsDeclined');
  }

  function enable() {
    if (!configured() || consent !== true) return;
    window[`ga-disable-${SiteConfig.analyticsId}`] = false;
    if (!loaded) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      });
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('js', new Date());
      window.gtag('config', SiteConfig.analyticsId, {
        ...pageParameters(), send_page_view: false,
        allow_google_signals: false, allow_ad_personalization_signals: false,
      });
      const script = document.createElement('script');
      script.id = 'ga4-tag';
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${SiteConfig.analyticsId}`;
      document.head.appendChild(script);
      loaded = true;
    } else {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    if (!viewed) {
      window.gtag('event', 'page_view', pageParameters());
      viewed = true;
    }
  }

  function clearAnalyticsCookies() {
    for (const entry of document.cookie.split(';')) {
      const name = entry.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', `; domain=${window.location.hostname}`, `; domain=.${window.location.hostname}`]) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
      }
    }
  }

  function applyConsent(choice) {
    consent = choice;
    if (consent === true) enable();
    else {
      window[`ga-disable-${SiteConfig.analyticsId}`] = true;
      if (loaded) window.gtag('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
    updateUI();
  }

  function setConsent(allowed) {
    const choice = allowed === true;
    readStored = true;
    try { localStorage.setItem(storageKey, choice ? 'granted' : 'denied'); } catch (_) { /* Memory works when storage is blocked. */ }
    applyConsent(choice);
  }

  function syncConsent() {
    let stored;
    try { stored = localStorage.getItem(storageKey); } catch (_) { return; }
    const choice = optedOut() || stored === 'denied' ? false : stored === 'granted' ? true : null;
    if (choice !== consent) applyConsent(choice);
  }

  function track(name, details = {}) {
    if (!configured() || consent !== true || !loaded || !events.has(name)) return false;
    const parameters = pageParameters();
    if (sources.has(details.source)) parameters.source = details.source;
    if (actions.has(details.action)) parameters.action = details.action;
    window.gtag('event', name, parameters);
    return true;
  }

  function openSettings() {
    const banner = el('consent-banner');
    if (!banner || !configured()) return;
    banner.hidden = false;
    el('consent-decline')?.focus();
  }

  function init() {
    if (!readStored) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored === 'granted' || stored === 'denied') consent = stored === 'granted';
      } catch (_) { /* No implicit consent when storage is unavailable. */ }
      readStored = true;
      if (optedOut()) consent = false;
    }
    if (!bound) {
      el('consent-accept')?.addEventListener('click', () => setConsent(true));
      el('consent-decline')?.addEventListener('click', () => setConsent(false));
      document.querySelectorAll('[data-privacy-settings]').forEach(button => button.addEventListener('click', openSettings));
      window.addEventListener('storage', event => {
        if (event.key === storageKey || event.key === null) syncConsent();
      });
      // The privacy page can change consent while the calculator is held in
      // the back/forward cache, where no storage event is delivered.
      window.addEventListener('pageshow', syncConsent);
      bound = true;
    }
    enable();
    updateUI();
  }
  return { init, track, setConsent, openSettings, updateUI };
})();
