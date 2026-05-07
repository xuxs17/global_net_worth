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

  function showToast(icon, msg) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'share-toast';
      toast.className = 'share-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => toast.classList.remove('show'), 2500);
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
      let done = false;

      // 1. Try clipboard (desktop Chrome/Edge/Safari)
      if (!done && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          done = true;
          showToast('✅', 'Copied to clipboard!');
        } catch (_) { /* fall through */ }
      }

      // 2. Try Web Share API (mobile)
      if (!done && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        try {
          const file = new File([blob], 'global-salary-fun.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            done = true;
          }
        } catch (_) { /* user cancelled or not supported */ }
      }

      // 3. Fallback: open image in new tab (works everywhere)
      if (!done) {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) {
          // popup blocked — download instead
          const a = document.createElement('a');
          a.href = url;
          a.download = 'global-salary-fun.png';
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToast('📥', 'Image ready! Long-press to save');
      }
    } catch (e) {
      console.error('Screenshot failed:', e);
      showToast('❌', 'Screenshot failed');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }

  return { updateURL, readURLParams, captureImage };
})();
