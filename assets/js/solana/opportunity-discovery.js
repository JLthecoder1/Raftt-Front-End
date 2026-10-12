(() => {
  'use strict';
  const host = document.getElementById('investment-app');
  if (!host || window.RafttRoutes.page !== 'opportunities.html') return;
  const pt = window.RafttI18n.lang === 'pt';
  const t = (a, b) => (pt ? a : b);
  const esc = (value) =>
    String(value || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  function enhance() {
    const grid = host.querySelector('#investment-content > .chain-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('article')].map((card) => {
      const name = card.querySelector('h2').textContent;
      const sector = card.querySelector('.eyebrow').textContent;
      const description = card.querySelector('h2 + p').textContent;
      const badge = card.querySelector('.badge').textContent;
      const numbers = [...card.querySelectorAll('.chain-stats strong')].map((x) => x.textContent);
      const progress = card.querySelector('progress');
      const percent = Math.min(
        100,
        (Number(progress.getAttribute('value')) / Number(progress.getAttribute('max'))) * 100,
      );
      const href = card.querySelector('a').getAttribute('href');
      const remaining = card.querySelector('.funding-remaining')?.textContent || '';
      const state =
        badge === t('Falhada', 'Failed')
          ? 'failed'
          : badge === t('Fundos liberados', 'Funds released')
            ? 'released'
            : badge === t('Meta atingida', 'Target reached')
              ? 'reached'
              : 'open';
      const network =
        [...card.querySelectorAll('p')].find(
          (x) => x.tagName === 'P' && x.textContent.includes('SPL'),
        )?.textContent || '';
      return {
        name,
        sector,
        description,
        badge,
        numbers,
        percent,
        href,
        state,
        network,
        remaining,
      };
    });
    const wrapper = document.createElement('section');
    wrapper.innerHTML = `<form class="discovery-filters" role="search"><label>${t('Buscar empresas', 'Search companies')}<input id="discovery-search" type="search" placeholder="${t('Nome, descrição ou setor', 'Name, description or sector')}"></label><label>${t('Setor', 'Sector')}<select id="discovery-sector"><option value="">${t('Todos os setores', 'All sectors')}</option>${[
      ...new Set(cards.map((x) => x.sector)),
    ]
      .sort()
      .map((x) => `<option value="${esc(x)}">${esc(x)}</option>`)
      .join(
        '',
      )}</select></label><label>${t('Captação', 'Fundraising')}<select id="discovery-state"><option value="">${t('Todos os estados', 'All states')}</option><option value="open">${t('Aberta', 'Open')}</option><option value="reached">${t('Meta atingida', 'Target reached')}</option><option value="failed">${t('Falhada', 'Failed')}</option><option value="released">${t('Fundos liberados', 'Funds released')}</option></select></label></form><div class="discovery-results"><p id="discovery-count" role="status" aria-live="polite"></p><a href="map">${t('Explorar pelo mapa', 'Explore the map')} ↗</a></div><div class="discovery-grid" id="discovery-list"></div>`;
    grid.replaceWith(wrapper);
    const search = wrapper.querySelector('#discovery-search'),
      sector = wrapper.querySelector('#discovery-sector'),
      state = wrapper.querySelector('#discovery-state');
    const update = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const results = cards.filter(
        (c) =>
          (!query ||
            [c.name, c.sector, c.description].join(' ').toLocaleLowerCase().includes(query)) &&
          (!sector.value || c.sector === sector.value) &&
          (!state.value || c.state === state.value),
      );
      wrapper.querySelector('#discovery-count').textContent =
        `${results.length} ${results.length === 1 ? t('oportunidade', 'opportunity') : t('oportunidades', 'opportunities')}`;
      wrapper.querySelector('#discovery-list').innerHTML =
        results
          .map(
            (c) =>
              `<article class="discovery-card"><div class="discovery-cover"><span class="discovery-contours" aria-hidden="true"></span><span class="discovery-category">STARTUPS</span><span class="discovery-logo">${esc(c.name.slice(0, 2).toUpperCase())}</span></div><div class="discovery-body"><div class="discovery-heading"><p class="eyebrow">${esc(c.sector)}</p><span class="discovery-state state-${c.state}">${esc(c.badge)}</span></div><h2>${esc(c.name)}</h2><p class="discovery-description">${esc(c.description)}</p><div class="discovery-amount"><strong>${esc(c.numbers[0])}</strong><span>${t('tokens captados', 'tokens raised')}</span></div><progress max="100" value="${c.percent}" aria-label="${t('Progresso da captação', 'Fundraising progress')}"></progress><div class="discovery-target"><span>${t('Meta', 'Target')}: ${esc(c.numbers[1])}</span><strong>${c.percent.toLocaleString(pt ? 'pt-BR' : 'en-US', { maximumFractionDigits: 1 })}%</strong></div><p class="discovery-remaining">${esc(c.remaining)}</p><p class="discovery-network">${esc(c.network)}</p><a class="button discovery-link" href="${esc(c.href)}">${t('Ver oportunidade', 'View opportunity')} <span aria-hidden="true">↗</span></a></div></article>`,
          )
          .join('') ||
        `<section class="discovery-empty"><h2>${t('Nenhuma empresa encontrada', 'No companies found')}</h2><p>${t('Tente outro termo ou ajuste os filtros.', 'Try another search or adjust the filters.')}</p></section>`;
    };
    wrapper.querySelector('form').onsubmit = (e) => e.preventDefault();
    search.addEventListener('input', update);
    sector.addEventListener('change', update);
    state.addEventListener('change', update);
    update();
  }
  new MutationObserver(enhance).observe(host, { childList: true, subtree: true });
  enhance();
})();
