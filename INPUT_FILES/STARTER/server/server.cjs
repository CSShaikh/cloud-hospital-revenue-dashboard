const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const PORT = Number(process.env.PORT || 4317);
const dataFile = path.resolve(__dirname, '../../DATA/transactions.json');
const transactions = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
function send(res, code, body) {
  res.writeHead(code, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'http://localhost:5173'});
  res.end(JSON.stringify(body));
}
const server = http.createServer((req,res) => {
  if(req.method !== 'GET') return send(res,405,{error:'method_not_allowed'});
  const pathname = new URL(req.url,'http://localhost').pathname;
  if(pathname === '/api/health') return send(res,200,{status:'ok'});
  if(pathname === '/api/transactions') return send(res,200,transactions);
  if(pathname === '/api/summary') {
    const totals = {count:transactions.length,paid:0,pending:0,refunded:0,failed:0};
    for(const item of transactions) {
      const key = item.status.toLowerCase();
      if(key === 'failed') totals.failed += 1;
      else totals[key] += item.amount_inr;
    }
    return send(res,200,totals);
  }
  return send(res,404,{error:'not_found'});
});
server.listen(PORT, '127.0.0.1', () => process.stdout.write(`API listening on http://127.0.0.1:${PORT}\n`));
