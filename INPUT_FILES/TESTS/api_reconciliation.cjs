const assert = require('node:assert/strict');
const base = process.env.API_BASE || 'http://127.0.0.1:4317';
(async () => {
  const health = await fetch(`${base}/api/health`); assert.equal(health.status,200); assert.deepEqual(await health.json(),{status:'ok'}); console.log('T-01 PASS');
  const response = await fetch(`${base}/api/transactions`); assert.equal(response.status,200); const rows = await response.json(); assert.equal(rows.length,120); assert.equal(new Set(rows.map(r=>r.transaction_id)).size,120); console.log('T-02 PASS');
  const s = await fetch(`${base}/api/summary`); assert.equal(s.status,200); const summary=await s.json();
  const expected = {count:rows.length,paid:0,pending:0,refunded:0,failed:0};
  for (const row of rows) { if(row.status==='Failed') expected.failed++; else expected[row.status.toLowerCase()]+=row.amount_inr; }
  assert.deepEqual(summary,expected); console.log('T-03 PASS',JSON.stringify(summary));
  const unknown=await fetch(`${base}/api/unknown-test`); assert.equal(unknown.status,404); assert.deepEqual(await unknown.json(),{error:'not_found'}); console.log('T-04 PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
