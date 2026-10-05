(() => {
  'use strict';

  // Static demo data. In the backend phase, this object can be replaced by an API response.
  const opportunities = {
    nullun: {
      name: 'NULLUN',
      category: 'STARTUPS',
      image: 'assets/images/Equipe de startup colaborando com protótipo-1.png',
      alt: 'NULLUN team working on a prototype',
      lead: 'Smart monitoring platform for connected operations.',
      tags: ['IoT', 'SaaS', 'Industry 4.0'],
      headline: 'Real-time visibility for connected operations.',
      pitch:
        'NULLUN brings sensors, assets, and teams together on one platform, turning operational data into faster decisions.',
      highlights: [
        'Real-time monitoring of assets and environments.',
        'Central dashboard for data, alerts, and maintenance.',
        'Architecture built for distributed operations.',
      ],
      problem: 'Fewer blind spots across operations.',
      solution:
        'Operations teams often rely on spreadsheets and disconnected information. NULLUN brings business signals together to support incident response and planning.',
      terms: ['$1,000', '$2.5M', '$10', 'Illustrative equity', 'Nov 30, 2026', '$620,000'],
      raised: '25% raised of $2.5M',
      amount: '$620,000',
      investors: '84',
      days: '34 days',
      minimum: '$1,000',
    },
    'solar-horizonte': {
      name: 'Solar Horizonte',
      category: 'ENERGY',
      image: 'assets/images/Fazenda solar em plena operação-4.png',
      alt: 'Solar farm in operation',
      lead: 'Distributed generation from an operating solar portfolio.',
      tags: ['Solar energy', 'Infrastructure', 'ESG'],
      headline: 'Clean energy backed by long-term contracts.',
      pitch:
        'Solar Horizonte operates distributed-generation assets and plans to expand capacity to serve new customers.',
      highlights: [
        'Operating solar assets.',
        'Revenue linked to energy contracts.',
        'Modular expansion of installed capacity.',
      ],
      problem: 'More predictability for the energy transition.',
      solution:
        'The project combines physical assets, technical operations, and supply contracts to expand renewable energy availability.',
      terms: ['$1,000', '$4M', '$25', 'Illustrative debt', 'Dec 18, 2026', '$1.1M'],
      raised: '28% raised of $4M',
      amount: '$1.1M',
      investors: '112',
      days: '52 days',
      minimum: '$1,000',
    },
    'porto-nexus': {
      name: 'Porto Nexus',
      category: 'INFRASTRUCTURE',
      image: 'assets/images/Porto moderno com centro de dados-7.png',
      alt: 'Modern port and data center',
      lead: 'Logistics and data infrastructure for connected supply chains.',
      tags: ['Logistics', 'Data', 'Infrastructure'],
      headline: 'Infrastructure for physical and digital flows.',
      pitch:
        'Porto Nexus combines logistics capacity, connectivity, and data services to make supply chains more efficient.',
      highlights: [
        'Strategic location for distribution.',
        'Integrated logistics and data services.',
        'Expansion plan tied to milestones.',
      ],
      problem: 'Connected supply chains need integrated infrastructure.',
      solution:
        'The project combines logistics and digital resources to reduce operational friction and improve supply-chain visibility.',
      terms: ['$2,000', '$6M', '$50', 'Illustrative equity', 'Dec 12, 2026', '$1.7M'],
      raised: '28% raised of $6M',
      amount: '$1.7M',
      investors: '96',
      days: '46 days',
      minimum: '$2,000',
    },
    'campo-forte': {
      name: 'Campo Forte',
      category: 'AGRICULTURE',
      image: 'assets/images/Trator entre campos e silos-6.png',
      alt: 'Tractor between fields and silos',
      lead: 'Agricultural production, storage, and expansion of farm assets.',
      tags: ['Agriculture', 'Storage', 'Production'],
      headline: 'Capacity to grow between harvests.',
      pitch:
        'Campo Forte invests in production, storage, and equipment to make its agricultural operations more efficient and resilient.',
      highlights: [
        'Operational assets in the field.',
        'Focus on storage and productivity.',
        'Planned releases tied to project stages.',
      ],
      problem: 'Agricultural growth depends on infrastructure at the right pace.',
      solution:
        'The plan combines equipment and storage capacity, with progress tracked against implementation milestones.',
      terms: ['$1,000', '$3M', '$20', 'Illustrative credit', 'Dec 8, 2026', '$890,000'],
      raised: '30% raised of $3M',
      amount: '$890,000',
      investors: '73',
      days: '42 days',
      minimum: '$1,000',
    },
    'fluxo-seguro': {
      name: 'Fluxo Seguro',
      category: 'RECEIVABLES',
      image: 'assets/images/Análise de recebíveis no atacado-5.png',
      alt: 'Wholesale receivables analysis',
      lead: 'Structured receivables financing for growing businesses.',
      tags: ['Credit', 'Receivables', 'SMBs'],
      headline: 'Working capital backed by real cash flows.',
      pitch:
        'Fluxo Seguro structures receivables financing to support businesses with recurring sales and working-capital needs.',
      highlights: [
        'Receivables and cash-flow analysis.',
        'Structures linked to real operations.',
        'Portfolio metrics tracked over time.',
      ],
      problem: 'Healthy businesses can still face cash-flow gaps.',
      solution:
        'Structured receivables financing can shorten the gap between a sale and payment while supporting ongoing operations.',
      terms: ['$500', '$2M', '$5', 'Illustrative credit', 'Nov 22, 2026', '$540,000'],
      raised: '27% raised of $2M',
      amount: '$540,000',
      investors: '128',
      days: '26 days',
      minimum: '$500',
    },
  };

  const opportunity = opportunities[new URLSearchParams(window.location.search).get('opportunity')];
  if (!opportunity) return;

  document.title = `${opportunity.name} | Raftt`;
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  setText('.investment-back', '← Back to opportunities');
  setText(
    '.investment-hero__copy .investment-eyebrow',
    `DEMO CASE STUDY · ${opportunity.category}`,
  );
  setText('#investment-title', opportunity.name);
  setText('.investment-lead', opportunity.lead);
  const image = document.querySelector('.investment-hero__image');
  if (image) {
    image.src = opportunity.image;
    image.alt = opportunity.alt;
  }
  const tags = document.querySelector('.investment-tags');
  if (tags)
    tags.replaceChildren(
      ...opportunity.tags.map((tag) => {
        const item = document.createElement('span');
        item.textContent = tag;
        return item;
      }),
    );
  setText('#pitch h2', opportunity.headline);
  setText('#pitch p:last-child', opportunity.pitch);
  const highlights = document.querySelector('.investment-highlights');
  if (highlights)
    highlights.replaceChildren(
      ...opportunity.highlights.map((highlight) => {
        const item = document.createElement('li');
        item.textContent = highlight;
        return item;
      }),
    );
  const problemSection = document.querySelector(
    '.investment-section:not(#pitch):not(#highlights):not(#terms):not(#documents)',
  );
  if (problemSection) {
    const heading = problemSection.querySelector('h2');
    const paragraph = problemSection.querySelector('p:last-child');
    if (heading) heading.textContent = opportunity.problem;
    if (paragraph) paragraph.textContent = opportunity.solution;
  }
  document.querySelectorAll('.investment-terms strong').forEach((item, index) => {
    item.textContent = opportunity.terms[index] || item.textContent;
  });
  setText('.investment-card__top span', opportunity.raised);
  setText('.investment-card__top strong', opportunity.amount);
  const stats = document.querySelectorAll('.investment-stat-grid strong');
  if (stats[0]) stats[0].textContent = opportunity.investors;
  if (stats[1]) stats[1].textContent = opportunity.days;
  setText('.investment-card__minimum strong', opportunity.minimum);
  setText('.investment-cta', 'Investment is unavailable in this demo');
})();
