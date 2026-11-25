import React, { useMemo, useState, useEffect } from 'react';
import { deriveRows, formatINR, STATUSES } from '../lib/transactions.js';
import styles from '../styles/TransactionTable.module.css';
const sortControls = [
  ['date', 'Sort by date', 'Date: oldest first', 'Date: newest first'],
  ['amount', 'Sort by amount', 'Amount: low to high', 'Amount: high to low'],
  ['status', 'Sort by status', 'Status: A–Z', 'Status: Z–A'],
];
function usePageSize() {
  const [size, setSize] = useState(() => window.matchMedia('(max-width: 640px)').matches ? 3 : 5);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const change = () => setSize(query.matches ? 3 : 5);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return size;
}
export default function TransactionTable({ rows, phase, onRetry }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('date:asc');
  const [requestedPage, setPage] = useState(1);
  const pageSize = usePageSize();
  const derived = useMemo(() => deriveRows(rows, search, status, sort), [rows, search, status, sort]);
  const pageCount = Math.max(1, Math.ceil(derived.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const offset = (page - 1) * pageSize;
  const visible = derived.slice(offset, offset + pageSize);
  const activeFilters = Boolean(search.trim()) || status !== 'All';
  const [sortField, direction] = sort.split(':');
  const ariaSort = field => sortField === field ? direction === 'asc' ? 'ascending' : 'descending' : undefined;
  function clear() { setSearch(''); setStatus('All'); setSort('date:asc'); setPage(1); }
  if (phase === 'loading') return <div className={styles.message} role="status" aria-live="polite"><span className={styles.spinner} aria-hidden="true"/>Loading transactions…</div>;
  if (phase === 'error') return <div className={styles.message}><div role="alert"><strong>Unable to load transactions.</strong><p>Check the data connection and try again.</p></div><button onClick={onRetry}>Retry</button></div>;
  return <div className={styles.wrapper}>
    <div className={styles.controls}>
      <label className={styles.search}><span className={styles.srOnly}>Search by transaction ID or department</span><input type="search" placeholder="Search transactions" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></label>
      <label><span className={styles.srOnly}>Filter by status</span><select value={status} className={status !== 'All' ? styles.active : undefined} onChange={e => { setStatus(e.target.value); setPage(1); }}>{STATUSES.map(item => <option key={item} value={item}>{item === 'All' ? 'All status' : item}</option>)}</select></label>
      {sortControls.map(([field, label, asc, desc]) => <label key={field}>
        <span className={styles.srOnly}>{label}</span>
        <select aria-label={label} value={sortField === field ? sort : ''} onChange={e => { if (e.target.value) { setSort(e.target.value); setPage(1); } }}>
          <option value="" disabled>{`Sort: ${field[0].toUpperCase()}${field.slice(1)}`}</option>
          <option value={`${field}:asc`}>{asc}</option><option value={`${field}:desc`}>{desc}</option>
        </select>
      </label>)}
      {activeFilters && <button className={styles.clear} onClick={clear}>Clear filters</button>}
    </div>
    {derived.length === 0 ? <div className={styles.message} role="status"><strong>No matching transactions</strong><p>Try a different transaction ID, department or status.</p><button onClick={clear}>Clear filters</button></div> :
      <div className={styles.tableRegion} role="region" aria-label="Transaction records" tabIndex={0}>
        <table role="table" className={styles.table} aria-label="Billing transactions">
          <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Transaction</th><th role="columnheader" scope="col" aria-sort={ariaSort('date')}>Date</th><th role="columnheader" scope="col">Department</th><th role="columnheader" scope="col" aria-sort={ariaSort('amount')}>Amount</th><th role="columnheader" scope="col" aria-sort={ariaSort('status')}>Status</th><th role="columnheader" scope="col">Channel</th></tr></thead>
          <tbody role="rowgroup">{visible.map(row => <tr role="row" key={row.transaction_id}>
            <th role="rowheader" scope="row" className={styles.id}>{row.transaction_id}</th>
            <td role="cell" className={styles.date}><span className={styles.mobileLabel}>Date: </span><time dateTime={row.date}>{row.date}</time></td>
            <td role="cell" className={styles.department}>{row.department}</td>
            <td role="cell" className={styles.amount}>{formatINR(row.amount_inr)}</td>
            <td role="cell" className={styles.statusCell}><span className={`${styles.status} ${styles[row.status.toLowerCase()]}`}>{row.status}</span></td>
            <td role="cell" className={styles.channel}>{row.channel}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    <div className={styles.pagination}>
      <p role="status" aria-live="polite">{derived.length ? `Showing ${offset + 1}–${offset + visible.length} of ${derived.length}` : '0 results'}{activeFilters ? ` (filtered from ${rows.length})` : ''}</p>
      {derived.length > 0 && <nav aria-label="Transaction pages"><button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">‹ Prev</button><span> {page} / {pageCount} </span><button disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Next page">Next ›</button></nav>}
    </div>
  </div>;
}
