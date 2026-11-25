export const STATUSES = ['All', 'Paid', 'Pending', 'Refunded', 'Failed'];
const currency = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
export const formatINR = amount => `₹ ${currency.format(amount)}`;
export function compactINR(amount) {
  const unit = amount >= 100000 ? [100000, 'L'] : amount >= 1000 ? [1000, 'K'] : null;
  return unit ? `₹ ${Number((amount / unit[0]).toFixed(unit[0] === 100000 ? 2 : 1))}${unit[1]}` : formatINR(amount);
}
export function calculateMetrics(rows) {
  return rows.reduce((totals, row) => {
    totals.count += 1;
    if (row.status === 'Paid') totals.paid += row.amount_inr;
    if (row.status === 'Pending') totals.pending += row.amount_inr;
    if (row.status === 'Refunded') totals.refunded += row.amount_inr;
    return totals;
  }, { paid: 0, pending: 0, count: 0, refunded: 0 });
}
export function deriveRows(rows, search = '', status = 'All', sort = 'date:asc') {
  const query = search.trim().toLowerCase();
  const [field, direction] = sort.split(':');
  const multiplier = direction === 'desc' ? -1 : 1;
  return rows.filter(row => (status === 'All' || row.status === status) &&
    (!query || row.transaction_id.toLowerCase().includes(query) || row.department.toLowerCase().includes(query)))
    .sort((a, b) => {
      const difference = field === 'amount' ? a.amount_inr - b.amount_inr : field === 'status' ? a.status.localeCompare(b.status) : a.date.localeCompare(b.date);
      return difference * multiplier || a.transaction_id.localeCompare(b.transaction_id);
    });
}
export function isTransactionList(value) {
  return Array.isArray(value) && value.every(row => row && typeof row.transaction_id === 'string' &&
    typeof row.department === 'string' && typeof row.date === 'string' && typeof row.channel === 'string' &&
    STATUSES.slice(1).includes(row.status) && Number.isFinite(row.amount_inr)) &&
    new Set(value.map(row => row.transaction_id)).size === value.length;
}
