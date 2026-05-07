(() => {
  let baseline = null;
  let targetCountries = [];
  let currentMode = 'monthly';

  const el = (id) => document.getElementById(id);

  // --- Data loading ---
  async function init() {
    try {
      await ExchangeModule.load();
      RenderModule.renderEmpty();
      const resp = await fetch('data/baseline.json');
      if (!resp.ok) throw new Error('基准数据加载失败');
      baseline = await resp.json();
      targetCountries = Object.keys(baseline);

      const saved = ShareModule.readURLParams();
      if (saved) {
        el('amount').value = saved.amount;
        el('currency').value = saved.fromCurrency;
        calculateMonthly();
      }
    } catch (e) {
      RenderModule.renderError('数据加载失败，请稍后刷新页面');
      console.error(e);
    }
  }

  // --- Mode switching ---
  function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    el('panel-monthly').style.display = mode === 'monthly' ? '' : 'none';
    el('panel-hourly').style.display = mode === 'hourly' ? '' : 'none';

    if (mode === 'hourly') {
      el('share-actions').style.display = 'none';
      RenderModule.renderEmpty();
    }
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // --- Monthly mode ---
  function calculateMonthly() {
    const amount = parseFloat(el('amount').value);
    const fromCurrency = el('currency').value;

    if (!amount || amount <= 0) {
      RenderModule.renderEmpty();
      return;
    }
    if (!baseline) {
      RenderModule.renderError('基准数据未加载');
      return;
    }

    try {
      const amountInUSD = ExchangeModule.convertToUSD(amount, fromCurrency);
      buildResults(amountInUSD);
      ShareModule.updateURL(amount, fromCurrency);
      el('share-actions').style.display = 'flex';
    } catch (e) {
      RenderModule.renderError('计算出错，请检查输入');
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
        nominalLabel: nominalLevel.label,
        pppLevel: pppLevel.key,
        pppLabel: pppLevel.label,
        characterEmoji: CharactersModule.getEmoji(nominalLevel.key),
      };
    });
    RenderModule.renderCards(results);
  }

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

  // Monthly quick fills
  document.querySelectorAll('#panel-monthly .quick-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      el('amount').value = btn.dataset.amount;
      el('currency').value = btn.dataset.currency;
      calculateMonthly();
    });
  });

  // --- Hourly / Timer mode ---
  el('timer-start').addEventListener('click', () => TimerModule.start());
  el('timer-pause').addEventListener('click', () => TimerModule.pause());
  el('timer-reset').addEventListener('click', () => TimerModule.reset());

  el('hourly-rate').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') TimerModule.start();
  });

  document.querySelectorAll('.hourly-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      el('hourly-rate').value = btn.dataset.rate;
      el('hourly-currency').value = btn.dataset.currency;
      TimerModule.start();
    });
  });

  // --- Share ---
  el('share-img-btn').addEventListener('click', () => {
    ShareModule.captureImage();
  });

  init();
})();
