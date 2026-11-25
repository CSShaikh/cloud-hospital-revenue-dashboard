import { useEffect, useState } from 'react';
import { isTransactionList } from '../lib/transactions.js';
export const dataMode = import.meta.env.PROD ? 'fixture' : 'api';
const endpoint = dataMode === 'api' ? '/api/transactions' : `${import.meta.env.BASE_URL}api/transactions.json`;
export function useTransactions() {
  const [state, setState] = useState({ phase: 'loading', rows: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: 'loading', rows: [] });
    async function load() {
      try {
        const response = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rows = await response.json();
        if (!isTransactionList(rows)) throw new Error('Invalid transaction response');
        if (!controller.signal.aborted) setState({ phase: 'ready', rows });
      } catch (error) {
        if (!controller.signal.aborted) setState({ phase: 'error', rows: [] });
      }
    }
    load();
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
