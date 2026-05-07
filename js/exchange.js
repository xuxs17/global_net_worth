const ExchangeModule = (() => {
  let rates = null;

  async function load() {
    const resp = await fetch('data/rates.json');
    if (!resp.ok) throw new Error('Failed to load rates');
    rates = await resp.json();
    return rates;
  }

  function getRates() {
    if (!rates) throw new Error('Rates not loaded');
    return rates;
  }

  function convertToUSD(amount, fromCurrency) {
    const r = getRates().rates;
    if (!(fromCurrency in r)) throw new Error(`Unsupported currency: ${fromCurrency}`);
    return amount / r[fromCurrency];
  }

  function convertFromUSD(amountInUSD, toCurrency) {
    const r = getRates().rates;
    if (!(toCurrency in r)) throw new Error(`Unsupported currency: ${toCurrency}`);
    return amountInUSD * r[toCurrency];
  }

  function getDate() {
    return getRates().date;
  }

  return { load, getRates, convertToUSD, convertFromUSD, getDate };
})();
