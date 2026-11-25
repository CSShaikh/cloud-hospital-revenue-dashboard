import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles/Dashboard.module.css';
import MetricCard from './components/MetricCard.jsx';
import TransactionTable from './components/TransactionTable.jsx';
import { calculateMetrics, compactINR, formatINR } from './lib/transactions.js';
import { dataMode, useTransactions } from './hooks/useTransactions.js';
import logo from './assets/logo.svg';
const links = [['overview','Overview'], ['transactions','Transactions'], ['reports','Reports']];
function activeSection() {
  const hash = window.location.hash.slice(1);
  return links.some(([id]) => id === hash) ? hash : 'overview';
}
export default function Dashboard() {
  const { phase, rows, retry } = useTransactions();
  const totals = useMemo(() => calculateMetrics(rows), [rows]);
  const [active, setActive] = useState(activeSection);
  const layoutRef = useRef(null);
  const sidebarRef = useRef(null);
  useEffect(() => {
    const syncSection = () => setActive(activeSection());
    window.addEventListener('hashchange', syncSection);
    return () => window.removeEventListener('hashchange', syncSection);
  }, []);
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const layout = layoutRef.current;
    const updateOffset = () => layout.style.setProperty('--nav-height', `${sidebar.getBoundingClientRect().height}px`);
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, []);
  const metrics = [
    ['Collected Revenue', totals.paid, true, 'Paid transactions'],
    ['Outstanding', totals.pending, true, 'Pending transactions'],
    ['Transaction Count', totals.count, false, 'All transaction statuses'],
    ['Refund Total', totals.refunded, true, 'Refunded transactions'],
  ];
  return <div className={styles.layout} ref={layoutRef}>
    <a className={styles.skip} href="#main-content">Skip to dashboard</a>
    <aside ref={sidebarRef} className={styles.sidebar} aria-label="Primary navigation">
      <div className={styles.brand}><img src={logo} alt="Cloud Hospital India — Revenue Operations"/></div>
      <nav aria-label="Dashboard sections">{links.map(([id, title]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{title}</a>)}</nav>
    </aside>
    <main className={styles.main} id="main-content" tabIndex={-1}>
      <header id="overview" className={styles.header}><p className={styles.eyebrow}>ADMIN WORKSPACE</p><h1>Revenue Operations</h1><p className={styles.subtitle}>Billing overview &amp; transaction activity</p></header>
      <section aria-label="Revenue metrics" className={styles.cards}>
        {metrics.map(([title, value, monetary, detail]) => <MetricCard key={title} title={title} phase={phase} value={monetary ? formatINR(value) : String(value)} compactValue={monetary ? compactINR(value) : String(value)} detail={detail}/>)}
      </section>
      <section id="transactions" className={styles.panel} aria-labelledby="tx-heading"><h2 id="tx-heading">Transaction log</h2><TransactionTable rows={rows} phase={phase} onRetry={retry}/></section>
      <footer id="reports" className={styles.footer} aria-label="Reporting information"><strong>Reporting information</strong><p>Constructed billing records for demonstration only. Not live hospital performance. {dataMode === 'api' ? 'Source: local read-only API.' : 'Source: supplied static JSON fixture.'} KPI totals include all records, independent of transaction filters.</p></footer>
    </main>
  </div>;
}
