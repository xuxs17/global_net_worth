const TimerModule = (() => {
  let hourlyRate = 0;
  let currency = 'CNY';
  let startTime = null;
  let elapsedBefore = 0; // ms accumulated before current session
  let rafId = null;
  let running = false;

  const el = (id) => document.getElementById(id);

  function getHourlyRateInUSD() {
    return ExchangeModule.convertToUSD(hourlyRate, currency);
  }

  function calcEarnings() {
    if (!startTime) return 0;
    const totalMs = elapsedBefore + (Date.now() - startTime);
    const hours = totalMs / 3600000;
    return hourlyRate * hours;
  }

  function formatElapsed(totalMs) {
    const s = Math.floor(totalMs / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function tick() {
    if (!running) return;
    const earnings = calcEarnings();
    const totalMs = elapsedBefore + (Date.now() - startTime);

    el('timer-amount').textContent = earnings.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    el('timer-elapsed').textContent = formatElapsed(totalMs);

    // update monthly projection label
    const monthlyRate = hourlyRate * 176; // ~22d * 8h
    const currencySymbol = el('hourly-currency').selectedOptions[0]?.textContent.split(' ')[0] || currency;
    el('timer-label').textContent = `≈ 月薪 ${monthlyRate.toLocaleString('zh-CN', {maximumFractionDigits: 0})} ${currency}`;

    if (totalMs >= 60000) {
      // switch label after 1 minute
      el('timer-label').textContent = `已累计 · 时薪 ${hourlyRate.toLocaleString('zh-CN', {maximumFractionDigits: 2})} ${currency}`;
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    hourlyRate = parseFloat(el('hourly-rate').value);
    currency = el('hourly-currency').value;
    if (!hourlyRate || hourlyRate <= 0) return;

    if (!running) {
      running = true;
      startTime = Date.now();
      el('timer-start').style.display = 'none';
      el('timer-pause').style.display = 'inline-flex';
      el('timer-display').classList.add('active');
      tick();
    }
  }

  function pause() {
    if (running) {
      elapsedBefore += Date.now() - startTime;
      running = false;
      startTime = null;
      if (rafId) cancelAnimationFrame(rafId);
      el('timer-start').style.display = 'inline-flex';
      el('timer-start').textContent = '继续计时';
      el('timer-pause').style.display = 'none';
      el('timer-display').classList.remove('active');
    }
  }

  function reset() {
    pause();
    elapsedBefore = 0;
    el('timer-amount').textContent = '0.00';
    el('timer-label').textContent = '准备开始';
    el('timer-elapsed').textContent = '00:00:00';
    el('timer-start').textContent = '开始计时';
  }

  function getSummary() {
    if (elapsedBefore === 0 && !startTime) return null;
    const totalMs = elapsedBefore + (startTime ? Date.now() - startTime : 0);
    const earnings = hourlyRate * (totalMs / 3600000);
    const monthlyEquivalent = hourlyRate * 176;
    return {
      earnings,
      elapsedMs: totalMs,
      hourlyRate,
      currency,
      monthlyEquivalent,
    };
  }

  return { start, pause, reset, getHourlyRateInUSD, getSummary, isRunning: () => running };
})();
