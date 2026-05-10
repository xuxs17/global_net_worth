(() => {
  let baseline = null;
  let targetCountries = [];
  let ready = false;
  let resultsShowing = false;

  const el = (id) => document.getElementById(id);

  // --- Update all UI text for current language ---
  function setText(id, text) {
    const e = el(id);
    if (e) e.textContent = text;
  }
  function setPlaceholder(id, text) {
    const e = el(id);
    if (e) e.placeholder = text;
  }
  function updateCurrencyPlaceholder() {
    const c = el('currency').value;
    setPlaceholder('amount', `${I18n.t('amountPlaceholder')} (${c})`);
  }
  function updateUIText() {
    setText('hero-title', I18n.t('title'));
    setText('hero-subtitle', I18n.t('subtitle'));
    setText('calc-btn', I18n.t('calcBtn'));
    setText('empty-hint', I18n.t('emptyHint'));
    setText('rank-title', I18n.t('rankTitle'));
    setText('share-text', I18n.t('shareBtn'));
    setText('disc-1', I18n.t('disclaimer1'));
    setText('disc-2', I18n.t('disclaimer2'));
    setText('disc-3', I18n.t('disclaimer3'));
    setText('disc-4', I18n.t('disclaimer4'));
    setText('current-lang', I18n.getLang().toUpperCase().replace('-', '-'));
    document.title = I18n.t('title');
  }

  // --- Language switcher ---
  function updateLangDisplay() {
    const lang = I18n.getLang();
    const short = lang === 'pt-BR' ? 'BR' : lang === 'zh-CN' ? 'ZH' : lang.toUpperCase().slice(0, 2);
    el('current-lang').textContent = short;
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  el('lang-toggle').addEventListener('click', () => {
    el('lang-dropdown').classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!el('lang-switcher').contains(e.target)) {
      el('lang-dropdown').classList.remove('open');
    }
  });

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      I18n.setLang(btn.dataset.lang);
      updateLangDisplay();
      updateUIText();
      el('currency').value = I18n.getDefaultCurrency(btn.dataset.lang);
      updateCurrencyPlaceholder();
      el('lang-dropdown').classList.remove('open');
      // Re-render results if any
      if (resultsShowing) {
        const amount = parseFloat(el('amount').value);
        if (amount > 0) calculateMonthly();
      }
    });
  });

  // --- Data loading ---
  async function init() {
    try {
      await ExchangeModule.load();
      RenderModule.renderEmpty();
      const resp = await fetch('data/baseline.json');
      if (!resp.ok) throw new Error('Failed to load baseline');
      baseline = await resp.json();
      targetCountries = Object.keys(baseline);
      ready = true;

      const saved = ShareModule.readURLParams();
      if (saved) {
        el('amount').value = saved.amount;
        el('currency').value = saved.fromCurrency;
        calculateMonthly();
      }
    } catch (e) {
      RenderModule.renderError(I18n.t('dataError'));
      console.error(e);
    }
  }

  function calculateMonthly() {
    if (!ready) {
      RenderModule.renderError(I18n.t('dataError'));
      return;
    }

    const amount = parseFloat(el('amount').value);
    const fromCurrency = el('currency').value;

    if (!amount || amount <= 0) {
      resultsShowing = false;
      RenderModule.renderEmpty();
      return;
    }

    try {
      const amountInUSD = ExchangeModule.convertToUSD(amount, fromCurrency);
      buildResults(amountInUSD);
      ShareModule.updateURL(amount, fromCurrency);
      el('share-actions').style.display = 'flex';
      resultsShowing = true;
    } catch (e) {
      resultsShowing = false;
      RenderModule.renderError(I18n.t('calcError'));
      console.error(e);
    }
  }

  function buildResults(amountInUSD) {
    const annualIncomeUSD = amountInUSD * 12;
    const results = targetCountries.map(code => {
      const country = baseline[code];
      const convertedAmount = ExchangeModule.convertFromUSD(amountInUSD, country.currencyCode);
      const ratio = annualIncomeUSD / country.gni_per_capita;
      const level = LevelsModule.determineLevel(ratio);

      return {
        countryCode: code,
        countryName: I18n.countryName(code),
        currencyCode: country.currencyCode,
        flagEmoji: RenderModule.countryCodeToFlag(code),
        convertedAmount,
        ratio,
        nominalLevel: level.key,
        nominalLabel: LevelsModule.getLevelLabel(level.key),
        characterEmoji: CharactersModule.getEmoji(level.key),
      };
    });
    RenderModule.renderCards(results);
  }

  // --- Event binding ---
  el('calc-btn').addEventListener('click', calculateMonthly);
  el('amount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calculateMonthly();
  });

  let debounceTimer;
  el('amount').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const amount = parseFloat(el('amount').value);
      const c = el('currency').value;
      if (amount > 0) ShareModule.updateURL(amount, c);
    }, 500);
  });
  el('currency').addEventListener('change', () => {
    updateCurrencyPlaceholder();
    const amount = parseFloat(el('amount').value);
    if (amount > 0) ShareModule.updateURL(amount, el('currency').value);
  });

  // Quick fills
  document.querySelectorAll('.quick-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      el('amount').value = btn.dataset.amount;
      el('currency').value = btn.dataset.currency;
      calculateMonthly();
    });
  });

  // Share
  el('share-img-btn').addEventListener('click', () => {
    ShareModule.captureImage();
  });

  // Apply detected language immediately (before async data load)
  updateUIText();
  updateLangDisplay();
  el('currency').value = I18n.getDefaultCurrency(I18n.getLang());
  updateCurrencyPlaceholder();

  init();
})();
