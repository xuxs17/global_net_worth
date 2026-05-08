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
        allowTaint: true,
        onclone: (clonedDoc) => {
          const area = clonedDoc.getElementById('capture-area');
          if (!area) return;
          // Force explicit styles for reliable rendering
          area.style.width = '640px';
          area.style.background = '#ffffff';
          area.style.border = 'none';
          area.style.borderRadius = '0';
          area.style.padding = '24px 24px 20px';
          area.style.boxSizing = 'border-box';

          // Show the title
          const title = area.querySelector('.capture-title');
          if (title) {
            title.style.display = 'block';
            title.style.fontFamily = 'Georgia, "Times New Roman", serif';
            title.style.fontSize = '20px';
            title.style.fontWeight = '700';
            title.style.color = '#1a1a2e';
            title.style.textAlign = 'center';
            title.style.padding = '8px 0 16px';
          }

          // Fix cards
          area.querySelectorAll('.result-card').forEach(card => {
            card.style.animation = 'none';
            card.style.background = '#faf8f5';
            card.style.border = '1px solid #f0ece6';
            card.style.borderRadius = '14px';
            card.style.padding = '16px 18px';
            card.style.marginBottom = '8px';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.gap = '14px';
          });

          // Fix fonts — use web-safe fallbacks
          area.querySelectorAll('*').forEach(node => {
            if (node.style) {
              node.style.fontFamily = node.style.fontFamily
                .replace(/'Playfair Display',\s*/g, '')
                .replace(/'Inter',\s*/g, '')
                .replace(/-apple-system,\s*/g, '')
                .replace(/BlinkMacSystemFont,\s*/g, '');
              if (!node.style.fontFamily || node.style.fontFamily === '') {
                node.style.fontFamily = 'Georgia, "Times New Roman", serif';
              }
              // Force visible colors
              const cs = window.getComputedStyle(node);
              if (cs.color === 'rgb(250, 248, 245)' || cs.color === '#faf8f5') {
                node.style.color = '#1a1a2e';
              }
            }
          });

          // Ensure rank title is visible
          const rankTitle = area.querySelector('#rank-title') || area.querySelector('.capture-title');
          if (rankTitle && !rankTitle.textContent) {
            rankTitle.textContent = 'Global Income Ranking';
          }
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
