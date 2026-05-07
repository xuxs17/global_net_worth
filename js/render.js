const RenderModule = (() => {
  const container = () => document.getElementById('results-container');
  const captureTitle = () => document.querySelector('.capture-title');
  const disclaimerDate = () => document.getElementById('data-date');
  const shareActions = () => document.getElementById('share-actions');

  function countryCodeToFlag(code) {
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  }

  function formatAmount(amount, currencyCode) {
    const intCurrencies = new Set(['JPY', 'VND', 'IDR', 'RUB', 'INR']);
    const decimals = intCurrencies.has(currencyCode) ? 0 : 2;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function renderCards(results) {
    if (!container()) return;
    container().innerHTML = '';
    if (captureTitle()) captureTitle().style.display = 'block';

    const sorted = [...results].sort((a, b) => b.ratio - a.ratio);

    sorted.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.style.animationDelay = `${index * 0.06}s`;
      card.innerHTML = `
        <div class="card-rank">#${index + 1}</div>
        <div class="card-flag">${item.flagEmoji}</div>
        <div class="card-info">
          <div class="card-currency">${item.currencyCode}</div>
          <div class="card-amount">${formatAmount(item.convertedAmount, item.currencyCode)}</div>
          <div class="card-country">${item.countryName}</div>
        </div>
        <div class="card-levels">
          <span class="level-tag level-nominal ${item.nominalLevel}">${item.nominalLabel}</span>
          <span class="level-tag level-ppp ${item.pppLevel}">PPP: ${item.pppLabel}</span>
        </div>
        <div class="card-character">${item.characterEmoji}</div>
      `;
      container().appendChild(card);
    });

    if (disclaimerDate() && results.length > 0) {
      disclaimerDate().textContent = ExchangeModule.getDate();
    }
  }

  function renderError(msg) {
    if (!container()) return;
    container().innerHTML = `<div class="error-message">${msg}</div>`;
    if (captureTitle()) captureTitle().style.display = 'none';
    if (shareActions()) shareActions().style.display = 'none';
  }

  function renderEmpty() {
    if (!container()) return;
    container().innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌍</div>
        <div class="empty-hint">${I18n.t('emptyHint')}</div>
      </div>`;
    if (captureTitle()) captureTitle().style.display = 'none';
    if (shareActions()) shareActions().style.display = 'none';
  }

  return { countryCodeToFlag, formatAmount, renderCards, renderError, renderEmpty };
})();
