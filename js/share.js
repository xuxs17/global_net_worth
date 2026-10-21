const ShareModule = (() => {
  function updateURL(amount, fromCurrency, lang = I18n.getLang()) {
    const url = new URL(window.location);
    url.searchParams.set('amount', String(amount));
    url.searchParams.set('from', fromCurrency);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }

  function updateLangParam(lang) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }

  function clearURL() {
    const url = new URL(window.location);
    url.searchParams.delete('amount');
    url.searchParams.delete('from');
    window.history.replaceState({}, '', url);
  }

  function readURLParams(rates) {
    const params = new URLSearchParams(window.location.search);
    try {
      const input = CalculatorModule.readInput({ amount: params.get('amount'), fromCurrency: params.get('from') }, rates);
      return { amount: input.amount, fromCurrency: input.fromCurrency };
    } catch (_) {
      return null;
    }
  }

  async function copyLink() {
    const value = window.location.href;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      return window.prompt(I18n.t('copyPrompt'), value) !== null;
    }
  }

  function loadFlag(countryCode) {
    return new Promise(resolve => {
      const image = new Image();
      image.referrerPolicy = 'no-referrer';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = new URL(RenderModule.flagSrc(countryCode), window.location.href).href;
    });
  }

  async function createImage(report, meta) {
    // Capture translated copy and the report before any asynchronous asset load.
    const notes = RenderModule.dataNotes(meta);
    const t = key => I18n.t(key);
    const labels = {
      passport: t('passport'), first: t('heroLine1'), second: t('heroLine2'),
      income: t('monthlyIncome'), count: t('summaryCount'),
      summary: I18n.t('summarySuffix', { count: report.summary.aboveAverage, total: report.summary.available }),
    };
    const seen = new Set();
    const highlights = [['best', 'bestTitle'], ['closest', 'closestTitle'], ['lowest', 'lowestTitle']]
      .filter(([key]) => {
        const code = report.summary[key].countryCode;
        if (seen.has(code)) return false;
        seen.add(code);
        return true;
      }).map(([key, title]) => {
        const country = report.summary[key];
        return {
          ...country, name: I18n.countryName(country.countryCode), title: t(title),
          ratioText: `${RenderModule.formatRatio(country.ratio)}×`,
          average: `${t('localAverage')}: ${RenderModule.formatAmount(country.averageLocal, country.currencyCode)} ${country.currencyCode}`,
        };
      });
    const salary = `${RenderModule.formatAmount(report.amount, report.fromCurrency)} ${report.fromCurrency}`;
    const missing = report.summary.total - report.summary.available;
    const warning = [notes.warning, missing ? I18n.t('partialData', { count: missing }) : ''].filter(Boolean).join(' ');
    const footer = [
      { text: t('captureBasis'), size: 20, color: '#486253' },
      { text: `${notes.date} · ${notes.salary}`, size: 18, color: '#486253' },
      ...(warning ? [{ text: warning, size: 17, color: '#8c5520' }] : []),
      { text: t('sourceNote'), size: 16, color: '#687160' },
      { text: t('captureDisclaimer'), size: 16, color: '#687160' },
    ];
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const family = '"Trebuchet MS", "Microsoft YaHei", sans-serif';
    const font = (size, weight = 400) => `${weight} ${size}px ${family}`;

    function lines(text, size, width) {
      ctx.font = font(size);
      const result = [];
      let line = '';
      for (const word of String(text).split(/(\s+)/)) {
        if (ctx.measureText(line + word).width <= width) { line += word; continue; }
        if (line.trim()) { result.push(line.trim()); line = ''; }
        for (const char of word) {
          if (line && ctx.measureText(line + char).width > width) { result.push(line.trim()); line = ''; }
          line += char;
        }
      }
      if (line.trim()) result.push(line.trim());
      return result;
    }
    footer.forEach(block => { block.lines = lines(block.text, block.size, 952); });
    const footerHeight = footer.reduce((height, block) => height + block.lines.length * (block.size + 7) + 8, 0);
    canvas.height = Math.max(1350, 1010 + footerHeight + 100);

    function fit(text, x, y, maxWidth, size, color, weight = 400, align = 'left') {
      let actual = size;
      while (actual > 12 && (ctx.font = font(actual, weight), ctx.measureText(text).width > maxWidth)) actual--;
      ctx.font = font(actual, weight);
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      ctx.textAlign = 'left';
    }
    function box(x, y, width, height, color, radius = 12) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    }
    ctx.fillStyle = '#f7f7ef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ccd5bd';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 1032, canvas.height - 48);
    fit('GlobalSalary.', 64, 92, 380, 36, '#173d32', 700);
    fit(labels.passport, 1016, 88, 540, 21, '#486253', 400, 'right');
    fit(labels.first, 64, 205, 952, 80, '#202d25', 700);
    fit(labels.second, 64, 291, 952, 80, '#173d32', 700);
    box(64, 337, 952, 77, '#e9efdc');
    fit(labels.income, 84, 384, 350, 23, '#486253');
    fit(salary, 996, 387, 530, 36, '#173d32', 700, 'right');
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = '#b8c4a5';
    ctx.beginPath(); ctx.moveTo(64, 448); ctx.lineTo(1016, 448); ctx.stroke();
    ctx.setLineDash([]);
    fit(labels.count, 64, 493, 900, 24, '#486253');
    fit(`${report.summary.aboveAverage} / ${report.summary.available}`, 64, 591, 420, 100, '#173d32', 700);
    const summaryLines = lines(labels.summary, 28, 480);
    summaryLines.forEach((line, index) => fit(line, 530, 541 + index * 37, 480, 28, '#486253'));

    const flags = await Promise.all(highlights.map(country => loadFlag(country.countryCode)));
    highlights.forEach((country, index) => {
      const y = 625 + index * 116;
      box(64, y, 952, 104, index === 0 ? '#e5edcf' : '#fffef9');
      const image = flags[index];
      if (image) {
        ctx.save(); ctx.beginPath(); ctx.arc(104, y + 49, 21, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(image, 83, y + 28, 42, 42); ctx.restore();
      } else fit(country.countryCode, 84, y + 57, 46, 23, '#173d32', 700);
      fit(country.title, 146, y + 28, 560, 17, '#68765e');
      fit(country.name, 146, y + 61, 570, 30, '#173d32', 700);
      fit(country.average, 146, y + 86, 800, 18, '#687160');
      fit(country.ratioText, 990, y + 61, 280, 49, '#173d32', 700, 'right');
    });
    ctx.strokeStyle = '#ccd5bd';
    ctx.beginPath(); ctx.moveTo(64, 990); ctx.lineTo(1016, 990); ctx.stroke();
    let footerY = 1020;
    footer.forEach(block => {
      block.lines.forEach(line => { fit(line, 64, footerY, 952, block.size, block.color); footerY += block.size + 7; });
      footerY += 8;
    });
    fit('global-salary-fun.netlify.app', 64, canvas.height - 55, 800, 21, '#173d32', 700);
    fit('GS / 010', 1016, canvas.height - 55, 150, 17, '#687160', 400, 'right');
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
  }

  async function saveImage(blob, isCurrent = () => true) {
    if (!isCurrent()) return 'stale';
    const file = new File([blob], 'global-salary-passport.png', { type: 'image/png' });
    const touchDevice = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer:coarse)').matches;
    if (touchDevice && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return true;
      } catch (error) {
        if (error.name === 'AbortError') return false;
      }
    }
    // Native sharing can reject much later; validate again before a download.
    if (!isCurrent()) return 'stale';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }

  return { updateURL, updateLangParam, clearURL, readURLParams, copyLink, createImage, saveImage };
})();
