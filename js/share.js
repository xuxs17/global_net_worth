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

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'global-salary-fun.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '我的全球收入排行榜',
            text: '看看你的工资在全球算什么水平？',
            files: [file],
          });
          return;
        }
      }
      // fallback: direct download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'global-salary-fun.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // user cancelled share
      if (e.name !== 'AbortError') console.error('Screenshot failed:', e);
    }
  }

  return { updateURL, readURLParams, captureImage };
})();
