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

  // Fetch and cache the CSS text for injection into cloned document
  let _cssText = null;
  async function getCSSText() {
    if (_cssText) return _cssText;
    try {
      const resp = await fetch('css/style.css');
      _cssText = await resp.text();
      return _cssText;
    } catch (_) {
      return '';
    }
  }

  async function captureImage() {
    const el = document.getElementById('capture-area');
    if (!el || !window.html2canvas) return;

    const btn = document.getElementById('share-img-btn');
    if (!btn) return;
    const originalHTML = btn.innerHTML;

    try {
      btn.innerHTML = '<span class="share-icon">⏳</span> <span id="share-text">' + I18n.t('capturing') + '</span>';
      btn.disabled = true;

      const cssText = await getCSSText();

      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Inject the full CSS so ALL elements keep their styles
          if (cssText) {
            const styleEl = clonedDoc.createElement('style');
            styleEl.textContent = cssText;
            clonedDoc.head.appendChild(styleEl);
          }

          // Fix the capture area for clean output
          const area = clonedDoc.getElementById('capture-area');
          if (!area) return;
          area.style.width = '640px';
          area.style.background = '#ffffff';
          area.style.border = 'none';
          area.style.borderRadius = '0';
          area.style.padding = '24px 24px 20px';

          // Ensure title is visible
          const title = area.querySelector('.capture-title');
          if (title) {
            title.style.display = 'block';
          }

          // Freeze all animations at their final frame
          area.querySelectorAll('.result-card').forEach(card => {
            card.style.animation = 'none';
          });
        },
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      let done = false;

      // 1. Clipboard (desktop)
      if (!done && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          done = true;
          showToast('✅', 'Copied to clipboard!');
        } catch (_) { /* fall through */ }
      }

      // 2. Web Share (mobile)
      if (!done && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        try {
          const file = new File([blob], 'global-salary-fun.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            done = true;
          }
        } catch (_) { /* fall through */ }
      }

      // 3. Fallback: new tab
      if (!done) {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) {
          const a = document.createElement('a');
          a.href = url;
          a.download = 'global-salary-fun.png';
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 600000);
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
