(() => {
  'use strict';
  const page = window.RafttRoutes.page;
  if (page === 'map.html' || page === 'welcome.html' || !page) return;
  function mount() {
    const pt = localStorage.getItem('raftt-lang') === 'pt',
      t = (p, e) => (pt ? p : e);
    const footer = document.createElement('footer');
    footer.className = 'raftt-footer';
    footer.setAttribute('aria-label', t('Rodapé RAFTT', 'RAFTT footer'));
    footer.innerHTML = `<div class="rf-inner"><div class="rf-top"><div class="rf-intro"><a class="rf-brand" href="welcome.html"><img class="rf-brand-icon" src="assets/images/raftt-symbol.svg" alt="" aria-hidden="true"><span>raftt<span>.</span></span></a><p>${t('Pequenos barcos. Grandes mercados.', 'Small boats. Big markets.')}<br>${t('Uma jornada compartilhada, com cada etapa à vista.', 'A shared journey, with every milestone in view.')}</p><a class="rf-journey" href="account-workspaces.html">${t('Escolha seu próximo caminho', 'Choose your next path')} <span aria-hidden="true">↗</span></a></div><nav class="rf-links" aria-label="${t('Explorar', 'Explore')}"><h2>${t('Explorar', 'Explore')}</h2><a href="opportunities.html">${t('Oportunidades', 'Opportunities')}</a><a href="portfolio.html">${t('Meu portfólio', 'My portfolio')}</a><a href="investor-dashboard.html">${t('Painel do investidor', 'Investor dashboard')}</a></nav><nav class="rf-links" aria-label="${t('Construir', 'Build')}"><h2>${t('Construir', 'Build')}</h2><a href="company-application.html">${t('Apresentar minha empresa', 'Present my company')}</a><a href="company-dashboard.html">${t('Minha captação', 'My fundraising')}</a><a href="welcome.html#how-it-works">${t('Como funciona', 'How it works')}</a></nav><nav class="rf-links" aria-label="${t('Sobre a RAFTT', 'About RAFTT')}"><h2>${t('Sobre a RAFTT', 'About RAFTT')}</h2><a href="welcome.html#about">${t('Nossa abordagem', 'Our approach')}</a><a href="welcome.html#faq">${t('Perguntas frequentes', 'FAQs')}</a><a href="profile.html">${t('Perfil e preferências', 'Profile & settings')}</a></nav></div><a class="rf-wordmark" href="welcome.html" aria-label="${t('RAFTT — página inicial', 'RAFTT — home')}"><svg viewBox="0 0 1000 290" aria-hidden="true"><defs><linearGradient id="rf-color" x1="0" x2="1"><stop offset="0%" stop-color="#c9f7f0"/><stop offset="25%" stop-color="#83e2dd"/><stop offset="50%" stop-color="#42c5d0"/><stop offset="75%" stop-color="#208eae"/><stop offset="100%" stop-color="#145d83"/></linearGradient><radialGradient id="rf-reveal" cx="50%" cy="50%" r="38%"><stop stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="rf-mask"><rect width="1000" height="290" fill="url(#rf-reveal)"/></mask></defs><text x="30" y="235" textLength="940" lengthAdjust="spacingAndGlyphs" class="rf-wordmark-base">RAFTT</text><text x="30" y="235" textLength="940" lengthAdjust="spacingAndGlyphs" class="rf-wordmark-reveal" fill="url(#rf-color)" mask="url(#rf-mask)">RAFTT</text></svg></a><div class="rf-bottom"><span>© ${new Date().getFullYear()} RAFTT. ${t('Todos os direitos reservados.', 'All rights reserved.')}</span><span>${t('Infraestrutura para ativos privados', 'Infrastructure for private assets')} <i aria-hidden="true">/</i> Signals. Milestones. Progress.</span></div></div>`;
    const host = document.querySelector('.app-body') || document.body;
    document.querySelectorAll('footer:not(.raftt-footer)').forEach((el) => el.remove());
    host.append(footer);
    const mark = footer.querySelector('.rf-wordmark'),
      reveal = footer.querySelector('#rf-reveal');
    let frame = 0,
      point = { x: 50, y: 50 };
    mark.addEventListener('pointermove', (e) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const r = mark.getBoundingClientRect();
      point = {
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      };
      if (!frame)
        frame = requestAnimationFrame(() => {
          reveal.setAttribute('cx', point.x + '%');
          reveal.setAttribute('cy', point.y + '%');
          frame = 0;
        });
    });
    mark.addEventListener('focus', () => {
      reveal.setAttribute('cx', '50%');
      reveal.setAttribute('cy', '50%');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
