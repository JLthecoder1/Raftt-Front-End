(() => {
  'use strict';
  const normalize = (value) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filter = (companies, query, category) =>
    companies.filter(
      (c) =>
        c.publication_status === 'published' &&
        (category === 'all' || category === 'startups') &&
        normalize([c.name, c.description, c.sector, 'startups'].join(' ')).includes(
          normalize(query).trim(),
        ),
    );
  const units = (value, decimals) => {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) return null;
    if (
      !/^\d+$/.test(String(value)) ||
      !Number.isInteger(decimals) ||
      decimals < 0 ||
      decimals > 18
    )
      return null;
    const digits = String(value).padStart(decimals + 1, '0');
    return decimals ? digits.slice(0, -decimals) + '.' + digits.slice(-decimals) : digits;
  };
  window.RafttCatalogModel = { filter, units };
})();
