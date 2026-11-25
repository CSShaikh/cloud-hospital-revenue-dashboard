import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateMetrics, deriveRows, formatINR, compactINR, isTransactionList } from '../STARTER/src/lib/transactions.js';
const rows = JSON.parse(readFileSync(new URL('../DATA/transactions.json', import.meta.url), 'utf8'));
const frozen = Object.freeze(rows.map(row => Object.freeze({...row})));
const ids = list => list.map(row => row.transaction_id);
const totals = calculateMetrics(frozen);
for (const [id,key,status] of [['T-05','paid','Paid'], ['T-06','pending','Pending'], ['T-07','refunded','Refunded']]) {
  test(`${id} ${status} amount`, () => assert.equal(totals[key], rows.filter(row=>row.status===status).reduce((sum,row)=>sum+row.amount_inr,0)));
}
test('T-08 count', () => assert.equal(totals.count,120));
test('T-11 case-insensitive trimmed ID', () => assert.deepEqual(ids(deriveRows(frozen,'  txn-0001 ')),['TXN-0001']));
test('T-12 case-insensitive department', () => assert.deepEqual(new Set(ids(deriveRows(frozen,'  LABORATORY '))),new Set(ids(rows.filter(row=>row.department==='Laboratory')))));
test('T-13 Paid status and combined filter', () => {
  const paid = deriveRows(frozen,'','Paid'); assert.equal(paid.length,rows.filter(row=>row.status==='Paid').length); assert.ok(paid.every(row=>row.status==='Paid'));
  assert.ok(deriveRows(frozen,'laboratory','Paid').every(row=>row.department==='Laboratory' && row.status==='Paid'));
});
test('T-14 no matching records (logic)', () => assert.deepEqual(deriveRows(frozen,'not-a-real-transaction'),[]));
for (const [id,field,key,directions] of [['T-15','date','date',['asc']],['T-16','date','date',['desc']],['T-17','amount','amount_inr',['asc','desc']],['T-18','status','status',['asc','desc']]]) {
  for(const direction of directions) test(`${id} ${field} ${direction}`, () => {
    const ordered=deriveRows(frozen,'','All',`${field}:${direction}`); assert.equal(ordered.length,120);
    for(let i=1;i<ordered.length;i++) {
      const a=ordered[i-1][key], b=ordered[i][key]; const cmp=typeof a==='number'?a-b:a.localeCompare(b);
      assert.ok(direction==='asc'?cmp<=0:cmp>=0); if(cmp===0) assert.ok(ordered[i-1].transaction_id.localeCompare(ordered[i].transaction_id)<=0);
    }
  });
}
test('T-19 immutable fetched data',()=>{const before=JSON.stringify(frozen); deriveRows(frozen,'','All','amount:desc'); assert.equal(JSON.stringify(frozen),before);});
test('Indian currency formatting',()=>{assert.equal(formatINR(168540),'₹ 1,68,540');assert.equal(compactINR(168540),'₹ 1.69L');});
test('Response validation',()=>{assert.equal(isTransactionList(rows),true); assert.equal(isTransactionList({error:'bad'}),false);assert.equal(isTransactionList([rows[0],rows[0]]),false);assert.equal(isTransactionList([]),true);});
test('Empty fixture metrics',()=>assert.deepEqual(calculateMetrics([]),{paid:0,pending:0,count:0,refunded:0}));
