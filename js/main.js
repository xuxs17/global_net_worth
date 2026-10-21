(() => {
  const el = id => document.getElementById(id);
  const state = { ready: false, loading: true, initialized: false, engaged: false, rates: null, baseline: null, report: null, dataError: false, sharing: false, measuredCalculation: false };
  const examples = {
    USD: [2000, 5000, 10000], EUR: [2000, 4000, 6000], GBP: [2000, 3500, 5000],
    CNY: [5000, 10000, 20000], JPY: [200000, 400000, 600000],
    INR: [30000, 50000, 100000], VND: [10000000, 25000000, 50000000],
    BRL: [2500, 5000, 10000], IDR: [5000000, 10000000, 20000000], RUB: [50000, 100000, 200000],
  };
  const meta = () => ({ rates: state.rates, baseline: state.baseline });

  function updateExamples() {
    const currency = I18n.getDefaultCurrency(I18n.getLang());
    el('quick-fills').replaceChildren(...examples[currency].map(amount => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quick-fill';
      button.dataset.amount = amount;
      button.dataset.currency = currency;
      button.textContent = `${I18n.formatNumber(amount)} ${currency}`;
      button.disabled = !state.ready;
      return button;
    }));
  }

  function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = I18n.t(element.dataset.i18n); });
    el('language').value = I18n.getLang();
    document.title = `${I18n.t('title')} | GlobalSalary`;
    document.querySelector('meta[name="description"]').content = I18n.t('subtitle');
    document.querySelectorAll('[data-language-link]').forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('lang', I18n.getLang());
      link.href = url.href;
    });
    el('amount').placeholder = I18n.formatNumber(examples[el('currency').value]?.[0] || 3000);
    if (state.sharing) el('share-text').textContent = I18n.t('capturing');
    updateExamples();
    AnalyticsModule.updateUI();
  }

  function enableControls() {
    ['amount', 'currency', 'calc-btn'].forEach(id => { el(id).disabled = !state.ready; });
    el('retry-btn').disabled = state.loading;
    updateExamples();
  }

  function scrollToResults() {
    el('result-section').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  function calculate(scroll = false, source = 'input') {
    if (!state.ready) return;
    state.report = null;
    state.dataError = false;
    el('input-error').textContent = '';
    el('amount').setAttribute('aria-invalid', 'false');
    const raw = el('amount').value;
    if (!raw && !el('amount').validity.badInput) {
      ShareModule.clearURL();
      RenderModule.renderEmpty();
      return;
    }
    try {
      state.report = CalculatorModule.calculate({ amount: raw, fromCurrency: el('currency').value, ...meta() });
      ShareModule.updateURL(state.report.amount, state.report.fromCurrency, I18n.getLang());
      RenderModule.renderReport(state.report, meta());
      if (!state.measuredCalculation && AnalyticsModule.track('calculate', { source })) state.measuredCalculation = true;
      if (scroll) scrollToResults();
      return state.report;
    } catch (error) {
      ShareModule.clearURL();
      if (error.code === 'data') {
        state.dataError = true;
        RenderModule.renderEmpty({ error: 'data' });
      } else {
        const key = error.code === 'limit' ? 'amountTooLarge' : error.code === 'currency' ? 'currencyError' : 'inputError';
        el('input-error').textContent = I18n.t(key);
        el('amount').setAttribute('aria-invalid', 'true');
        RenderModule.renderEmpty();
      }
    }
  }

  async function init() {
    state.loading = true;
    state.ready = false;
    state.report = null;
    state.dataError = false;
    enableControls();
    RenderModule.renderEmpty({ loading: true });
    try {
      const [rates, baselineResponse] = await Promise.all([ExchangeModule.load(), fetch('data/baseline.json')]);
      if (!baselineResponse.ok) throw new Error('baseline');
      const baseline = await baselineResponse.json();
      // Validate shared data before making the input interactive. This report is
      // never displayed and contains no visitor input.
      CalculatorModule.calculate({ amount: 1, fromCurrency: 'USD', rates, baseline });
      state.rates = rates;
      state.baseline = baseline;
      state.ready = true;
      state.loading = false;
      if (!state.initialized) {
        const saved = ShareModule.readURLParams(rates);
        if (saved) {
          state.engaged = true;
          el('amount').value = saved.amount;
          el('currency').value = saved.fromCurrency;
        } else {
          ShareModule.clearURL();
        }
        state.initialized = true;
      }
      enableControls();
      calculate(false, 'restore');
    } catch (_) {
      state.loading = false;
      state.dataError = true;
      enableControls();
      RenderModule.renderEmpty({ error: 'data' });
    }
  }

  el('salary-form').addEventListener('submit', event => {
    event.preventDefault();
    calculate(true, 'submit');
  });
  el('amount').addEventListener('input', () => {
    state.engaged = true;
    calculate();
  });
  el('currency').addEventListener('change', () => {
    state.engaged = true;
    el('amount').placeholder = I18n.formatNumber(examples[el('currency').value]?.[0] || 3000);
    calculate(false, 'currency');
  });
  el('quick-fills').addEventListener('click', event => {
    const button = event.target.closest('.quick-fill');
    if (!button || !state.ready) return;
    state.engaged = true;
    el('amount').value = button.dataset.amount;
    el('currency').value = button.dataset.currency;
    if (calculate(true, 'preset')) AnalyticsModule.track('preset_used');
  });
  el('language').addEventListener('change', () => {
    I18n.setLang(el('language').value);
    AnalyticsModule.track('language_changed');
    ShareModule.updateLangParam(I18n.getLang());
    if (!state.engaged) el('currency').value = I18n.getDefaultCurrency(I18n.getLang());
    updateUIText();
    if (state.ready) calculate();
    else RenderModule.renderEmpty({ loading: state.loading, error: state.dataError ? 'data' : '' });
  });
  [['half-btn', .5], ['double-btn', 2]].forEach(([id, factor]) => {
    el(id).addEventListener('click', () => {
      if (!state.report) return;
      el('amount').value = Number((state.report.amount * factor).toPrecision(12));
      if (calculate(false, 'scenario')) AnalyticsModule.track('scenario_used', { action: factor === .5 ? 'half' : 'double' });
    });
  });
  el('retry-btn').addEventListener('click', init);
  el('copy-link-btn').addEventListener('click', async () => {
    if (!state.report) return;
    if (await ShareModule.copyLink(state.report)) {
      AnalyticsModule.track('copy_link');
      RenderModule.showToast(I18n.t('copied'));
    }
  });
  el('share-img-btn').addEventListener('click', async () => {
    if (!state.report || state.sharing) return;
    const report = state.report;
    const lang = I18n.getLang();
    const isCurrent = () => state.report === report && I18n.getLang() === lang;
    state.sharing = true;
    el('share-img-btn').disabled = true;
    el('share-text').textContent = I18n.t('capturing');
    try {
      const image = await ShareModule.createImage(report, meta());
      if (!isCurrent()) {
        RenderModule.showToast(I18n.t('shareChanged'));
        return;
      }
      const saved = await ShareModule.saveImage(image, isCurrent);
      if (!isCurrent() || saved === 'stale') RenderModule.showToast(I18n.t('shareChanged'));
      else if (saved) {
        AnalyticsModule.track('save_image');
        RenderModule.showToast(I18n.t('imageReady'));
      }
    } catch (_) {
      RenderModule.showToast(I18n.t('screenshotFailed'));
    } finally {
      state.sharing = false;
      el('share-img-btn').disabled = false;
      el('share-text').textContent = I18n.t('shareBtn');
    }
  });
  el('currency').value = I18n.getDefaultCurrency(I18n.getLang());
  updateUIText();
  AnalyticsModule.init();
  init();
})();
