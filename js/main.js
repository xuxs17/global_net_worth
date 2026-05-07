(() => {
  let baseline = null;
  let targetCountries = [];
  let ready = false;

  const el = (id) => document.getElementById(id);

  // --- Update all UI text for current language ---
  function updateUIText() {
    el('hero-title').textContent = I18n.t('title');
    el('hero-subtitle').textContent = I18n.t('subtitle');
    el('amount').placeholder = I18n.t('amountPlaceholder');
    el('calc-btn').textContent = I18n.t('calcBtn');
    el('empty-hint').textContent = I18n.t('emptyHint');
    el('rank-title').textContent = I18n.t('rankTitle');
    el('share-text').textContent = I18n.t('shareBtn');
    el('disc-1').textContent = I18n.t('disclaimer1');
    el('disc-2').textContent = I18n.t('disclaimer2');
    el('disc-3').textContent = I18n.t('disclaimer3');
    el('disc-4').textContent = I18n.t('disclaimer4');
    el('current-lang').textContent = I18n.getLang().toUpperCase().replace('-', '-');
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
      el('lang-dropdown').classList.remove('open');
      // Re-render results if any
      if (el('share-actions').style.display !== 'none') {
        const amount = parseFloat(el('amount').value);
        const c = el('currency').value;
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
      RenderModule.renderEmpty();
      return;
    }

    try {
      const amountInUSD = ExchangeModule.convertToUSD(amount, fromCurrency);
      buildResults(amountInUSD);
      ShareModule.updateURL(amount, fromCurrency);
      el('share-actions').style.display = 'flex';
    } catch (e) {
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
      const nominalLevel = LevelsModule.determineLevel(ratio);
      const pppAdjustedIncome = annualIncomeUSD / country.ppp_conversion_factor;
      const pppRatio = pppAdjustedIncome / country.gni_per_capita;
      const pppLevel = LevelsModule.determineLevel(pppRatio);

      return {
        countryCode: code,
        countryName: country.countryName,
        currencyCode: country.currencyCode,
        flagEmoji: RenderModule.countryCodeToFlag(code),
        convertedAmount,
        ratio,
        nominalLevel: nominalLevel.key,
        nominalLabel: LevelsModule.getLevelLabel(nominalLevel.key),
        pppLevel: pppLevel.key,
        pppLabel: LevelsModule.getLevelLabel(pppLevel.key),
        characterEmoji: CharactersModule.getEmoji(nominalLevel.key),
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
    const amount = parseFloat(el('amount').value);
    const c = el('currency').value;
    if (amount > 0) {
      debounceTimer = setTimeout(() => ShareModule.updateURL(amount, c), 500);
    }
  });
  el('currency').addEventListener('change', () => {
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

  init();
})();
