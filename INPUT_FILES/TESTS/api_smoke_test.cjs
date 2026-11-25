const assert = require('node:assert/strict');
const base = process.env.API_BASE || 'http://127.0.0.1:4317';
(async()=>{
  const health=await fetch(`${base}/api/health`);assert.equal(health.status,200);assert.deepEqual(await health.json(),{status:'ok'});
  const response=await fetch(`${base}/api/transactions`);assert.equal(response.status,200);const rows=await response.json();assert.equal(rows.length,120);assert.equal(new Set(rows.map(r=>r.transaction_id)).size,120);
  const summary=await (await fetch(`${base}/api/summary`)).json();assert.equal(summary.count,120);
  assert.equal(summary.paid,rows.filter(r=>r.status==='Paid').reduce((a,r)=>a+r.amount_inr,0));
  assert.equal((await fetch(`${base}/does-not-exist`)).status,404);
  console.log('PASS: 5 API smoke checks');
})().catch(e=>{console.error(e);process.exitCode=1});
