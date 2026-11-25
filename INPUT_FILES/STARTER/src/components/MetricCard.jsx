import React from 'react';
import styles from '../styles/MetricCard.module.css';
export default function MetricCard({ title, value, compactValue, phase, detail }) {
  return <article className={styles.card} aria-busy={phase === 'loading'}>
    <h2>{title}</h2>
    {phase === 'ready' ? <div className={styles.value} title={value}>
      <span className={styles.full}>{value}</span>
      <span className={styles.compact} aria-hidden="true">{compactValue ?? value}</span>
      <span className={styles.srOnly}>{value}</span>
    </div> : <div className={styles.value} aria-label={phase === 'loading' ? 'Loading value' : 'Value unavailable'}>—</div>}
    <p className={styles.detail}>{phase === 'ready' ? detail : phase === 'loading' ? 'Loading data…' : 'Data unavailable'}</p>
  </article>;
}
