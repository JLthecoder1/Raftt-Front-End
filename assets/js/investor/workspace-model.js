(() => {
  'use strict';
  function groupAmounts(rows, field) {
    const groups = new Map();
    for (const row of rows) {
      const key = `${row.mint}:${row.decimals}`;
      const group = groups.get(key) || { mint: row.mint, decimals: row.decimals, amount: 0n };
      group.amount += BigInt(row[field] || 0);
      groups.set(key, group);
    }
    return [...groups.values()];
  }
  function positionState(row) {
    if (row.position === 0n) return row.failed ? 'refunded' : 'empty';
    if (row.failed) return 'refund';
    if (row.version === 2 && row.status === 0) return 'draft';
    if (row.released > 0n || row.legacyReleased) return 'execution';
    if (row.closed) return 'funded';
    return 'fundraising';
  }
  window.RafttWorkspaceModel = { groupAmounts, positionState };
})();
