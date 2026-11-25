"""Optional QA tooling only. Run against the real Vite dev and production preview.
Install: python -m pip install playwright; python -m playwright install chromium firefox
Run: python ../../VERIFICATION/browser_qa.py (from STARTER, API/dev/preview running).
"""
import csv, json, re, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEV = 'http://localhost:5173'
PREVIEW = 'http://localhost:4173'
MATRIX = HERE / 'ACCEPTANCE_TEST_MATRIX.csv'
EVIDENCE = HERE / 'Screenshots'
EVIDENCE.mkdir(exist_ok=True)
records = json.loads((ROOT/'INPUT_FILES/DATA/transactions.json').read_text(encoding='utf-8'))
results = {}
notes = []

def record(case, fn, detail, environment, evidence='BROWSER_TEST_LOG.txt'):
    try:
        fn(); status='PASS'; actual=detail
    except Exception as exc:
        status='FAIL'; actual=f'{type(exc).__name__}: {exc}'[:450]; notes.append(traceback.format_exc())
    results[case]=(actual,status,environment,evidence)
    notes.append(f'{case} {status}: {actual}')
    print(notes[-1],flush=True)

def assert_true(condition, message):
    if not condition: raise AssertionError(message)

def ready(page, url=DEV):
    page.goto(url,wait_until='domcontentloaded'); expect(page.get_by_role('table',name='Billing transactions')).to_be_visible(timeout=15000)

def rows(page): return page.locator('tbody tr')
def ids(page): return page.locator('tbody th').all_text_contents()
def compare_first(page, field, direction):
    control=page.get_by_role('combobox',name=f'Sort by {field}')
    control.select_option(f'{field}:{direction}')
    key={'date':'date','amount':'amount_inr','status':'status'}[field]
    ordered=sorted(records,key=lambda x:x['transaction_id']); ordered.sort(key=lambda x:x[key],reverse=direction=='desc')
    assert_true(ids(page)==[r['transaction_id'] for r in ordered[:5]],f'Wrong first page for {field}:{direction}')

def no_overflow(page,width,height):
    page.set_viewport_size({'width':width,'height':height}); ready(page)
    assert_true(page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),f'Horizontal page overflow at {width}')
    expect(page.get_by_role('heading',name='Revenue Operations',exact=True)).to_be_visible()
    expect(rows(page).first).to_be_visible()
    page.screenshot(path=str(EVIDENCE/f'Dashboard_{width}.png'),full_page=False,animations='disabled')
    if width in (390,1440): page.screenshot(path=str(EVIDENCE/f'Dashboard_{width}_Full.png'),full_page=True,animations='disabled')

def main():
    with sync_playwright() as pw:
        try:
            browser=pw.chromium.launch(channel='chrome',headless=True); name='Google Chrome'
        except Exception:
            browser=pw.chromium.launch(headless=True); name='Playwright Chromium'
        env=f'{name} {browser.version}; local Vite dev'
        notes.append(env)
        page=browser.new_page(viewport={'width':1440,'height':900}); errors=[]
        page.on('pageerror',lambda exc: errors.append(str(exc)))
        page.on('console',lambda msg: errors.append(msg.text) if msg.type=='error' else None)
        ready(page)
        for case,title,status in [('T-05','Collected Revenue','Paid'),('T-06','Outstanding','Pending'),('T-07','Refund Total','Refunded'),('T-08','Transaction Count',None)]:
            def metric(title=title,status=status):
                if status:
                    value=sum(r['amount_inr'] for r in records if r['status']==status)
                    amount=page.evaluate("v => '₹ '+new Intl.NumberFormat('en-IN').format(v)",value)
                else: amount=str(len(records))
                expect(page.locator('article').filter(has=page.get_by_role('heading',name=title,exact=True)).get_by_text(amount,exact=True).first).to_be_visible()
            record(case,metric,'Rendered KPI reconciles with supplied fixture',env)
        # Capture normal viewport states before intentional network failures.
        for case,width,height in [('T-22',320,844),('T-23',390,844),('T-24',768,1024),('T-25',1200,900),('T-26',1440,900)]:
            record(case,lambda w=width,h=height:no_overflow(page,w,h),f'{width}px: no horizontal page overflow; heading/table visible; visual reference review still required' if width==1440 else f'{width}px: no horizontal page overflow; heading/table visible',env,f'Screenshots/Dashboard_{width}.png')
            if case=='T-26' and results[case][1]=='PASS':
                actual,_,e,evidence=results[case]; results[case]=(actual,'PARTIAL',e,evidence)
        page.set_viewport_size({'width':1440,'height':900}); ready(page)
        search=page.get_by_role('searchbox'); status=page.get_by_role('combobox',name='Filter by status')
        def search_id():
            search.fill('  txn-0001  '); expect(rows(page)).to_have_count(1); assert_true(ids(page)==['TXN-0001'],'Wrong ID'); search.fill('')
        record('T-11',search_id,'Trimmed lowercase ID matches exactly',env)
        def search_dept():
            search.fill('  LABORATORY  '); assert_true(all(x=='Laboratory' for x in page.locator('tbody tr td:nth-child(3)').all_text_contents()),'Wrong department'); expect(rows(page).first).to_be_visible(); search.fill('')
        record('T-12',search_dept,'Trimmed uppercase department matches',env)
        def paid():
            status.select_option('Paid'); expect(rows(page).first).to_be_visible(); assert_true(all(x=='Paid' for x in page.locator('tbody tr td:nth-child(5)').all_text_contents()),'Wrong status'); status.select_option('All')
        record('T-13',paid,'Paid filter shows only Paid',env)
        def empty():
            search.fill('impossible-match-xyz'); expect(page.get_by_text('No matching transactions')).to_be_visible(); expect(page.get_by_text(re.compile('0 results'))).to_be_visible(); page.get_by_role('button',name='Clear filters').last.click(); expect(rows(page).first).to_be_visible()
        record('T-14',empty,'Empty state and clear filters work',env)
        for case,field,directions in [('T-15','date',['asc']),('T-16','date',['desc']),('T-17','amount',['asc','desc']),('T-18','status',['asc','desc'])]:
            record(case,lambda f=field,ds=directions:[compare_first(page,f,d) for d in ds],f'{field} order matches independently sorted fixture',env)
        def accessibility():
            assert_true(page.locator('thead th[scope=col]').count()==6,'Missing scoped headers'); expect(page.get_by_role('table',name='Billing transactions')).to_be_visible(); expect(search).to_have_accessible_name('Search by transaction ID or department'); expect(status).to_have_accessible_name('Filter by status')
        record('T-21',accessibility,'Six scoped column headers and labelled controls',env)
        def focus():
            ready(page); page.keyboard.press('Tab'); focused=page.locator(':focus'); assert_true(focused.evaluate("el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth)>0"),'No visible keyboard outline')
        record('T-20',focus,'First keyboard focus has nonzero visible outline',env)
        def pagination():
            ready(page); before=ids(page); page.get_by_role('button',name='Next page').click(); assert_true(ids(page)!=before,'Next page unchanged'); page.get_by_role('button',name='Previous page').click(); assert_true(ids(page)==before,'Previous page incorrect')
        record('EXTRA-PAGINATION',pagination,'Next/previous controls verified',env)
        def navigation():
            # Short viewports ensure there is real scroll distance to exercise.
            for width,height in [(1000,500),(390,600)]:
                page.set_viewport_size({'width':width,'height':height}); ready(page)
                menu=page.get_by_role('navigation',name='Dashboard sections')
                page.emulate_media(reduced_motion='no-preference')
                for label,target in [('Transactions','transactions'),('Reports','reports'),('Overview','overview')]:
                    link=menu.get_by_role('link',name=label,exact=True)
                    link.click()
                    expect(link).to_have_attribute('aria-current','location')
                    page.wait_for_function("id => location.hash === '#'+id",arg=target)
                    page.wait_for_function("""id => {const r=document.getElementById(id).getBoundingClientRect(); const nav=document.querySelector('aside').getBoundingClientRect(); return Math.abs(nav.top)<2 && r.top<innerHeight && (id==='overview' || r.top>= (innerWidth<=640 ? nav.bottom-2 : -2));}""",arg=target)
                page.wait_for_function('scrollY < 2')
                assert_true(page.evaluate("getComputedStyle(document.documentElement).scrollBehavior")=='smooth','Smooth scroll not enabled')
                # Capture the native animation; intermediate positions must exist.
                samples=page.evaluate("""async () => {const out=[scrollY];document.querySelector('nav a[href="#transactions"]').click(); const start=performance.now(); while(performance.now()-start<850){await new Promise(requestAnimationFrame);out.push(scrollY);} return out;}""")
                assert_true(samples[-1]>10 and any(1 < y < samples[-1]-1 for y in samples),'No intermediate scrolling frames')
                page.evaluate('history.back()'); expect(menu.get_by_role('link',name='Overview')).to_have_attribute('aria-current','location')
                page.wait_for_function('scrollY < 2')
                page.emulate_media(reduced_motion='reduce')
                assert_true(page.evaluate("getComputedStyle(document.documentElement).scrollBehavior")=='auto','Reduced motion not respected')
                page.emulate_media(reduced_motion='no-preference')
            page.set_viewport_size({'width':1440,'height':900}); ready(page)
        record('EXTRA-NAVIGATION',navigation,'Desktop/mobile section links, intermediate scroll frames, sticky menu, history and reduced motion',env)
        def preview():
            ready(page,PREVIEW); assert_true(len(ids(page))==5,'Preview fixture did not render'); expect(page.get_by_text(re.compile('Source: supplied static JSON fixture'))).to_be_visible()
        record('EXTRA-PREVIEW',preview,'Production preview reads supplied fixture',env)
        # Intentional failures in isolated context, so normal console results remain clean.
        state_page=browser.new_page(); pattern='**/api/transactions'
        # Use a held request (route callback returns without resolving until explicitly continued).
        def loading_held():
            held=[]; state_page.route(pattern,lambda route:held.append(route)); state_page.goto(DEV,wait_until='domcontentloaded'); expect(state_page.get_by_text('Loading transactions…')).to_be_visible(); state_page.wait_for_timeout(250); assert_true(bool(held),'Request was not intercepted'); [r.fulfill(status=200,content_type='application/json',body=json.dumps(records)) for r in held[-1:]]; expect(state_page.get_by_role('table')).to_be_visible(timeout=15000); state_page.unroute(pattern)
        record('T-09',loading_held,'Loading text visible while API request held; data appears after release',env)
        def retry():
            state_page.route(pattern,lambda r:r.fulfill(status=503,content_type='application/json',body='{}')); state_page.goto(DEV,wait_until='domcontentloaded'); expect(state_page.get_by_role('alert')).to_contain_text('Unable to load transactions'); state_page.unroute(pattern); state_page.get_by_role('button',name='Retry').click(); expect(state_page.get_by_role('table')).to_be_visible(timeout=15000)
        record('T-10',retry,'HTTP 503 displays recoverable error; retry restores rows',env)
        state_page.close(); browser.close()
        def cross_browser():
            assert_true(not errors,'Chrome/Chromium console errors: '+str(errors)); assert_true(name=='Google Chrome','Installed Google Chrome not available (Chromium checked instead)')
            ff=pw.firefox.launch(headless=True)
            try:
                p=ff.new_page(viewport={'width':1440,'height':900}); ff_errors=[]; p.on('pageerror',lambda e:ff_errors.append(str(e))); p.on('console',lambda m:ff_errors.append(m.text) if m.type=='error' else None); ready(p); ready(p,PREVIEW); assert_true(not ff_errors,'Firefox errors: '+str(ff_errors)); notes.append('Firefox '+ff.version)
            finally: ff.close()
        record('T-28',cross_browser,'Google Chrome and Firefox loaded real dashboard without console/page errors',env+'; Playwright Firefox')

if __name__=='__main__':
    try: main()
    except Exception: notes.append(traceback.format_exc()); print(notes[-1])
    finally:
        with MATRIX.open(encoding='utf-8-sig',newline='') as f: reader=csv.DictReader(f); fields=reader.fieldnames; table=list(reader)
        for row in table:
            if row['Case_ID'] in results:
                row['Actual_Result'],row['Status'],row['Environment'],row['Evidence']=results[row['Case_ID']]
        with MATRIX.open('w',encoding='utf-8',newline='') as f: writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader(); writer.writerows(table)
        (HERE/'BROWSER_TEST_LOG.txt').write_text('\n'.join(notes)+'\n',encoding='utf-8')
    required={f'T-{i:02}' for i in [5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,23,24,25,26,28]}
    if not required.issubset(results) or any(r[1]=='FAIL' for r in results.values()): raise SystemExit(1)
