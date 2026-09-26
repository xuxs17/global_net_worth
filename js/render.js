const RenderModule = (() => {
  const container = () => document.getElementById('results-container');
  const captureTitle = () => document.querySelector('.capture-title');
  const captureMeta = () => document.getElementById('capture-meta');
  const captureFooter = () => document.getElementById('capture-footer');
  const disclaimerDate = () => document.getElementById('data-date');
  const shareActions = () => document.getElementById('share-actions');
  const status = () => document.getElementById('results-status');

  // Self-hosted SVG flags: emoji flags degrade to bare letters on Windows and are
  // font-dependent once the result is flattened into a share image.
  function flagSrc(countryCode) {
    return `assets/flags/${countryCode.toLowerCase()}.svg`;
  }

  function setCaptureChrome(visible) {
    const value = visible ? 'block' : 'none';
    [captureTitle(), captureMeta(), captureFooter()].forEach(el => {
      if (el) el.style.display = value;
    });
  }

  function describeStale(stale) {
    const codes = Object.keys(stale || {});
    if (!codes.length) return '';
    const dates = [...new Set(codes.map(c => String(stale[c])))].join(', ');
    return `${I18n.t('staleNote')} ${codes.join(', ')} (${dates})`;
  }

  function formatAmount(amount, currencyCode) {
    const intCurrencies = new Set(['JPY', 'VND', 'IDR', 'RUB', 'INR']);
    const decimals = intCurrencies.has(currencyCode) ? 0 : 2;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function renderCards(results, meta) {
    if (!container()) return;
    container().innerHTML = '';
    setCaptureChrome(true);

    const sorted = [...results].sort((a, b) => {
      if (!!a.failed !== !!b.failed) return a.failed ? 1 : -1;
      return b.ratio - a.ratio;
    });

    sorted.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.style.animationDelay = `${index * 0.06}s`;
      const body = item.failed ? `
        <div class="card-info">
          <div class="card-currency">${item.currencyCode}</div>
          <div class="card-country">${item.countryName}</div>
        </div>
        <div class="card-levels">
          <span class="level-tag level-unavailable">${I18n.t('dataUnavailable')}</span>
        </div>
      ` : `
        <div class="card-info">
          <div class="card-currency">${item.currencyCode}</div>
          <div class="card-amount">${formatAmount(item.convertedAmount, item.currencyCode)}</div>
          <div class="card-country">${item.countryName}</div>
        </div>
        <div class="card-levels">
          <span class="level-tag level-nominal ${item.nominalLevel}">${item.nominalLabel}</span>
        </div>
        <div class="card-character">${item.characterEmoji}</div>
      `;
      card.innerHTML = `
        <div class="card-rank">#${index + 1}</div>
        <img class="card-flag" src="${flagSrc(item.countryCode)}" alt="" width="30" height="30">
        ${body}
      `;
      container().appendChild(card);
    });

    if (captureMeta()) {
      captureMeta().textContent = I18n.t('basedOn')
        .replace('{salary}', `${meta.salaryText} ${meta.currencyCode}`);
    }
    const staleText = describeStale(meta.stale);
    const pageStale = document.getElementById('stale-note');
    if (pageStale) pageStale.textContent = staleText;
    if (captureFooter()) {
      captureFooter().querySelector('#capture-fine').textContent =
        `${I18n.t('captureDisclaimer')} · ${I18n.t('captureBasis')}`;
      captureFooter().querySelector('#capture-date-label').textContent = I18n.t('captureDate');
      captureFooter().querySelector('#capture-date-value').textContent =
        staleText ? `${meta.ratesDate} — ${staleText}` : meta.ratesDate;
    }

    if (disclaimerDate()) {
      disclaimerDate().textContent = meta.ratesDate;
    }
  }

  function renderError(msg) {
    if (!container()) return;
    container().innerHTML = `<div class="error-message">${msg}</div>`;
    if (status()) status().textContent = '';
    setCaptureChrome(false);
    if (shareActions()) shareActions().style.display = 'none';
  }

  function renderEmpty() {
    if (!container()) return;
    container().innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌍</div>
        <div class="empty-hint" id="empty-hint">${I18n.t('emptyHint')}</div>
      </div>`;
    if (status()) status().textContent = '';
    setCaptureChrome(false);
    if (shareActions()) shareActions().style.display = 'none';
  }

  return { renderCards, renderError, renderEmpty };
})();
