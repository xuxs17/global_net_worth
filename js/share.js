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

  async function captureImage() {
    const el = document.getElementById('capture-area');
    if (!el || !window.html2canvas) return;

    const btn = document.getElementById('share-img-btn');
    const originalHTML = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="share-icon">⏳</span> <span id="share-text">Capturing...</span>';
      btn.disabled = true;

      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      let copied = false;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        copied = true;
      } catch (_) {
        // Clipboard write not supported — fall through to download
      }

      if (copied) {
        btn.innerHTML = '<span class="share-icon">✅</span> <span id="share-text">Copied!</span>';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
        }, 2000);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'global-salary-fun.png';
        a.click();
        URL.revokeObjectURL(url);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    } catch (e) {
      console.error('Screenshot failed:', e);
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }

  return { updateURL, readURLParams, captureImage };
})();
