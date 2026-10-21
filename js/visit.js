// Run before any other resource or third-party script. Legacy shared inputs
// remain in memory until the calculator has loaded its static data.
const VisitModule = (() => {
  const url = new URL(window.location.href);
  const shared = { amount: url.searchParams.get('amount'), from: url.searchParams.get('from') };
  if (url.searchParams.has('amount') || url.searchParams.has('from')) {
    url.searchParams.delete('amount');
    url.searchParams.delete('from');
    window.history.replaceState({}, '', url);
  }
  return { sharedInput: () => ({ ...shared }) };
})();
