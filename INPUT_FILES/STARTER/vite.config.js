import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const fixturePath = fileURLToPath(new URL('../DATA/transactions.json', import.meta.url));
export default defineConfig({
  plugins: [react(), {
    name: 'deployment-fixture',
    apply: 'build',
    generateBundle() {
      const data = JSON.parse(readFileSync(fixturePath, 'utf8'));
      const rows = data.map(({transaction_id, date, department, amount_inr, status, channel}) => ({transaction_id, date, department, amount_inr, status, channel}));
      this.emitFile({ type: 'asset', fileName: 'api/transactions.json', source: JSON.stringify(rows) });
    },
  }],
  server: { proxy: { '/api': 'http://127.0.0.1:4317' } },
});
