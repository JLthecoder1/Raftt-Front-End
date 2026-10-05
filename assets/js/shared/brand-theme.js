(() => {
  function apply() {
    const logo = `<img class="raftt-brand-symbol" src="assets/images/raftt-symbol.svg" alt="" aria-hidden="true"><span class="raftt-brand-word">raftt<span>.</span></span>`;
    document
      .querySelectorAll('a.brand,a.logo,a.sidebar-brand,a.rf-brand,a.footer-brand')
      .forEach((el) => {
        el.classList.add('raftt-unified-brand');
        el.innerHTML = logo;
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
