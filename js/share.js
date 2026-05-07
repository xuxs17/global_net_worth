const ShareModule = (() => {
  function updateURL(amount, fromCurrency) {
    const url = new URL(window.location);
    url.searchParams.set('amount', amount);
    url.searchParams.set('from', fromCurrency);
    window.history.replaceState({}, '', url);
  }

  function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    const amount = parseFloat(params.get('amount'));
    const from = params.get('from');
    if (amount > 0 && from) {
      return { amount, fromCurrency: from };
    }
    return null;
  }

  return { updateURL, readURLParams };
})();
