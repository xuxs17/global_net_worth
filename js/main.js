(() => {
  let baseline = null;
  let targetCountries = [];

  const amountInput = document.getElementById('amount');
  const currencySelect = document.getElementById('currency');
  const calcBtn = document.getElementById('calc-btn');

  async function init() {
    try {
      await ExchangeModule.load();
      RenderModule.renderEmpty();
      const resp = await fetch('data/baseline.json');
      if (!resp.ok) throw new Error('基准数据加载失败');
      baseline = await resp.json();
      targetCountries = Object.keys(baseline);

      // 检查 URL 参数
      const saved = ShareModule.readURLParams();
      if (saved) {
        amountInput.value = saved.amount;
        currencySelect.value = saved.fromCurrency;
        calculate();
      }
    } catch (e) {
      RenderModule.renderError('数据加载失败，请稍后刷新页面');
      console.error(e);
    }
  }

  function calculate() {
    const amount = parseFloat(amountInput.value);
    const fromCurrency = currencySelect.value;

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
      ShareModule.updateURL(amount, fromCurrency);
      document.getElementById('share-actions').style.display = 'flex';
    } catch (e) {
      RenderModule.renderError('计算出错，请检查输入');
      console.error(e);
    }
  }

  calcBtn.addEventListener('click', calculate);
  amountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calculate();
  });

  // debounce URL update on input change
  let debounceTimer;
  amountInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const amount = parseFloat(amountInput.value);
    const fromCurrency = currencySelect.value;
    if (amount > 0) {
      debounceTimer = setTimeout(() => ShareModule.updateURL(amount, fromCurrency), 500);
    }
  });
  currencySelect.addEventListener('change', () => {
    const amount = parseFloat(amountInput.value);
    if (amount > 0) {
      ShareModule.updateURL(amount, currencySelect.value);
    }
  });

  // share image button
  document.getElementById('share-img-btn').addEventListener('click', () => {
    ShareModule.captureImage();
  });

  // quick fill buttons
  document.querySelectorAll('.quick-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      amountInput.value = btn.dataset.amount;
      currencySelect.value = btn.dataset.currency;
      calculate();
    });
  });

  init();
})();
