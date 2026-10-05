(() => {
function apply(){const logo=`<svg class="raftt-brand-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15h18l-3 6H7zM12 3v12M12 4 5 12h7"/></svg><span class="raftt-brand-word">raftt<span>.</span></span>`;document.querySelectorAll('a.brand,a.logo,a.sidebar-brand,a.rf-brand,a.footer-brand').forEach(el=>{el.classList.add('raftt-unified-brand');el.innerHTML=logo;});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
