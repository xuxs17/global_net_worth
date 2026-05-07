const ExchangeModule = (() => {
  let rates = null;

  async function load() {
    const resp = await fetch('data/rates.json');
    if (!resp.ok) throw new Error('汇率数据加载失败');
    rates = await resp.json();
    return rates;
  }

  function getRates() {
    if (!rates) throw new Error('汇率数据未加载');
    return rates;
  }

  function convertToUSD(amount, fromCurrency) {
    const r = getRates().rates;
    if (!(fromCurrency in r)) throw new Error(`不支持的币种: ${fromCurrency}`);
    return amount / r[fromCurrency];
  }

  function convertFromUSD(amountInUSD, toCurrency) {
    const r = getRates().rates;
    if (!(toCurrency in r)) throw new Error(`不支持的币种: ${toCurrency}`);
    return amountInUSD * r[toCurrency];
  }

  function getDate() {
    return getRates().date;
  }

  return { load, getRates, convertToUSD, convertFromUSD, getDate };
})();
