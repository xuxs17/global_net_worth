const CalculatorModule = (() => {
  const MAX_MONTHLY_USD = 1e8;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }

  function readInput({ amount, fromCurrency }, rates) {
    const raw = String(amount ?? '').trim();
    if (!/^[+]?((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$/.test(raw)) fail('input');
    const value = Number(raw);
    if (!positive(value)) fail('input');
    if (!rates || rates.base !== 'USD' || !rates.rates || rates.rates.USD !== 1) fail('data');
    if (typeof fromCurrency !== 'string' || !own(rates.rates, fromCurrency)) fail('currency');
    if (!positive(rates.rates[fromCurrency])) fail('data');
    const amountUSD = value / rates.rates[fromCurrency];
    if (!positive(amountUSD) || amountUSD > MAX_MONTHLY_USD) fail('limit');
    return { amount: value, fromCurrency, amountUSD };
  }

  function calculate({ amount, fromCurrency, rates, baseline }) {
    const input = readInput({ amount, fromCurrency }, rates);
    if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) fail('data');
    if (baseline._meta?.salaryCurrency && baseline._meta.salaryCurrency !== 'USD') fail('data');
    const countries = Object.keys(baseline).filter(code => !code.startsWith('_')).map(countryCode => {
      const country = baseline[countryCode];
      const currencyCode = country?.currencyCode;
      const salary = country?.average_monthly_salary;
      const rate = own(rates.rates, currencyCode) ? rates.rates[currencyCode] : null;
      if (!positive(salary) || !positive(rate)) return { countryCode, currencyCode, failed: true };
      const rawRatio = input.amountUSD / salary;
      // Two currency divisions can turn exact equality into 0.9999999999999999.
      // Normalize only machine-precision noise, never a display-rounded value.
      const ratio = Math.abs(rawRatio - 1) <= 4 * Number.EPSILON ? 1 : rawRatio;
      const convertedAmount = input.amountUSD * rate;
      const averageLocal = salary * rate;
      if (!positive(ratio) || !positive(convertedAmount) || !positive(averageLocal)) {
        return { countryCode, currencyCode, failed: true };
      }
      return {
        countryCode, currencyCode, ratio, convertedAmount, averageLocal,
        averageUSD: salary, nominalLevel: LevelsModule.determineLevel(ratio).key,
      };
    }).sort((a, b) => Number(!!a.failed) - Number(!!b.failed) || (b.ratio || 0) - (a.ratio || 0));

    const valid = countries.filter(country => !country.failed);
    if (!valid.length) fail('data');
    return {
      ...input, countries,
      summary: {
        aboveAverage: valid.filter(country => country.ratio > 1).length,
        available: valid.length,
        total: countries.length,
        best: valid[0],
        closest: valid.reduce((a, b) => Math.abs(a.ratio - 1) <= Math.abs(b.ratio - 1) ? a : b),
        lowest: valid[valid.length - 1],
      },
    };
  }

  function getFreshness(rates, now = new Date()) {
    const date = rates?.date || '';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const valid = Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === date && parsed <= today;
    const ageDays = valid ? Math.floor((today - parsed) / 86400000) : null;
    return {
      date, ageDays, unknown: !valid, outdated: valid && ageDays > 7,
      stale: rates?.stale && typeof rates.stale === 'object' ? { ...rates.stale } : {},
    };
  }

  return { calculate, readInput, getFreshness, MAX_MONTHLY_USD };
})();
