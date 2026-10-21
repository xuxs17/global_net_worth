(() => {
  function render() {
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = I18n.t(element.dataset.i18n); });
    document.getElementById('language').value = I18n.getLang();
    document.title = `${I18n.t(document.body.dataset.pageTitle)} | GlobalSalary`;
    document.querySelectorAll('[data-language-link]').forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('lang', I18n.getLang());
      link.href = url.href;
    });
    AnalyticsModule.updateUI();
  }
  document.getElementById('language').addEventListener('change', event => {
    I18n.setLang(event.target.value);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', I18n.getLang());
    window.history.replaceState({}, '', url);
    render();
    AnalyticsModule.track('language_changed');
  });
  render();
  AnalyticsModule.init();
})();
