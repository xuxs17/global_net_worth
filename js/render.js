const RenderModule = (() => {
  const el = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const text = (id, value) => { if (el(id)) el(id).textContent = value; };
  const flagSrc = code => `assets/flags/${encodeURIComponent(code.toLowerCase())}.svg`;

  function formatAmount(amount, currencyCode) {
    const decimals = ['JPY', 'VND', 'IDR', 'RUB', 'INR'].includes(currencyCode) ? 0 : 2;
    return I18n.formatNumber(amount, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function formatRatio(ratio) {
    return ratio < .01 ? `<${I18n.formatNumber(.01, { maximumFractionDigits: 2 })}`
      : I18n.formatNumber(ratio, { maximumFractionDigits: 2 });
  }

  function dataNotes(meta, now) {
    const freshness = CalculatorModule.getFreshness(meta.rates, now);
    const warnings = [];
    if (freshness.unknown) warnings.push(I18n.t('unknownRates'));
    else if (freshness.outdated) warnings.push(I18n.t('outdatedRates', { days: freshness.ageDays }));
    const cached = Object.entries(freshness.stale).map(([currency, date]) => `${currency} (${date})`).join(', ');
    if (cached) warnings.push(`${I18n.t('staleNote')} ${cached}`);
    return {
      date: `${I18n.t('ratesLabel')}: ${freshness.date || '—'}`,
      salary: I18n.t('salaryYear', { year: meta.baseline?._meta?.salaryAsOf || '—' }),
      warning: warnings.join(' '),
    };
  }

  function highlight(country, title) {
    return `<div class="highlight-card"><div><p class="highlight-label">${escape(I18n.t(title))}</p><p class="highlight-country"><img src="${flagSrc(country.countryCode)}" width="22" height="22" alt="">${escape(I18n.countryName(country.countryCode))}</p></div><strong class="highlight-ratio">${escape(formatRatio(country.ratio))}×</strong></div>`;
  }

  function card(country, index, scale) {
    const name = escape(I18n.countryName(country.countryCode));
    const header = `<div class="card-top"><img class="card-flag" src="${flagSrc(country.countryCode)}" alt="" width="33" height="33"><div><h3 class="card-country">${name}</h3><div class="card-currency">${escape(country.currencyCode)}</div></div><span class="card-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></div>`;
    if (country.failed) return `<article class="result-card" data-country="${escape(country.countryCode)}">${header}<p class="level-unavailable">${escape(I18n.t('dataUnavailable'))}</p></article>`;
    const status = country.ratio > 1 ? 'above' : country.ratio < 1 ? 'below' : 'equal';
    const salary = escape(formatAmount(country.convertedAmount, country.currencyCode));
    const average = escape(formatAmount(country.averageLocal, country.currencyCode));
    return `<article class="result-card ${country.ratio < 1 ? 'below-average' : 'above-average'}" data-country="${escape(country.countryCode)}" style="animation-delay:${index * 25}ms">
      ${header}
      <div class="ratio-row"><div class="card-ratio" aria-label="${escape(I18n.t('ratioSentence', { ratio: formatRatio(country.ratio) }))}">${escape(formatRatio(country.ratio))}<small aria-hidden="true">×</small></div><span class="ratio-status">${escape(I18n.t(status))}</span></div>
      <div class="ratio-track" aria-hidden="true"><div class="ratio-fill" style="width:${country.ratio / scale * 100}%"></div><span class="average-marker" style="left:${100 / scale}%"></span></div>
      <div class="card-money"><div><span class="money-label">${escape(I18n.t('yourSalary'))}</span><strong class="money-value">${salary}<small>${escape(country.currencyCode)}</small></strong></div><div><span class="money-label">${escape(I18n.t('localAverage'))}</span><strong class="money-value">${average}<small>${escape(country.currencyCode)}</small></strong></div></div>
    </article>`;
  }

  function renderReport(report, meta) {
    const notes = dataNotes(meta);
    el('result-section').hidden = false;
    el('empty-state').hidden = true;
    text('summary-count', I18n.formatNumber(report.summary.aboveAverage));
    text('summary-total', `/${I18n.formatNumber(report.summary.available)}`);
    text('summary-sentence', I18n.t('summarySuffix', { count: report.summary.aboveAverage, total: report.summary.available }));
    text('report-amount', `${formatAmount(report.amount, report.fromCurrency)} ${report.fromCurrency}`);
    el('summary-highlights').innerHTML = highlight(report.summary.best, 'bestTitle') + highlight(report.summary.closest, 'closestTitle');
    const scale = Math.max(2, ...report.countries.filter(country => !country.failed).map(country => country.ratio));
    el('results-container').innerHTML = report.countries.map((country, index) => card(country, index, scale)).join('');
    text('data-warning', notes.warning);
    el('data-warning').hidden = !notes.warning;
    text('data-date', notes.date);
    text('salary-year', notes.salary);
    const missing = report.summary.total - report.summary.available;
    text('partial-note', missing ? I18n.t('partialData', { count: missing }) : '');
    el('partial-note').hidden = !missing;
    text('results-status', I18n.t('resultsReady', { n: report.summary.available }));
  }

  function renderEmpty({ loading = false, error = '' } = {}) {
    el('result-section').hidden = true;
    el('empty-state').hidden = false;
    el('empty-state').classList.toggle('is-error', !!error);
    text('empty-title', I18n.t(loading ? 'loading' : error ? 'dataError' : 'emptyTitle'));
    text('empty-hint', loading || error ? '' : I18n.t('emptyHint'));
    el('retry-btn').hidden = !error;
    text('results-status', '');
  }

  let toastTimer;
  function showToast(message) {
    const toast = el('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
  }

  return { formatAmount, formatRatio, dataNotes, renderReport, renderEmpty, showToast, flagSrc };
})();
