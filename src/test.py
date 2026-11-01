import sys; sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:4391/index.html'
ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']
ok=[];bad=[]
def check(n,c,x=''): (ok if c else bad).append(n+(' '+str(x) if x not in ('',None) and not c else ''))
CLIP="""()=>{const W=innerWidth,H=innerHeight,out=[];const vis=e=>{const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none'&&e.getClientRects().length>0};
 document.querySelectorAll(%s).forEach(e=>{if(!vis(e))return;const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();if(b.width>0&&(b.right>W+1||b.left<-1))out.push((e.textContent||'').trim().slice(0,22)+':'+Math.round(b.left)+'-'+Math.round(b.right))});return {sw:document.documentElement.scrollWidth,W,out}}"""
IDS=['komplektovshchik','upakovshchik','kladovshchik','gruzchik','vvsh','fasovshchik','operator','sborshchik','brigadir','menedzher']
SIZES=[(320,640),(390,844),(768,1024),(1024,768),(1280,720),(1440,900),(1920,1080)]
BAR="(()=>{const a=document.querySelector('#logo').getBoundingClientRect(),n=document.querySelector('.nq').getBoundingClientRect(),c=document.querySelector('#contact-open').getBoundingClientRect(),over=(x,y)=>x.width>0&&y.width>0&&x.left<y.right&&y.left<x.right;return {clash:over(a,n)||over(a,c)||over(n,c),right:Math.max(n.right,c.right),W:innerWidth,bottom:Math.max(a.bottom,n.bottom)}})()"
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome',args=ARGS)
    def page(w=1440,h=900,hash='',rm='no-preference',init=None):
        c=b.new_context(viewport={'width':w,'height':h},reduced_motion=rm); p=c.new_page(); p.E=[]
        if init: p.add_init_script(init)
        p.on('pageerror',lambda e:p.E.append('ERR '+str(e)))
        p.on('console',lambda m:p.E.append(m.text[:300]) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None)
        p.goto(U+hash,wait_until='load'); p.wait_for_timeout(900); return c,p
    for w,h in SIZES:
        c,p=page(w,h)
        p.evaluate('window.__gt.toChoice()'); p.wait_for_timeout(500)
        r=p.evaluate(CLIP%"'.pick b,.pick span,#ask,#thesis h1,#contact-open'"); check(f'home clip {w}x{h}',not r['out'] and r['sw']<=r['W'],r)
        v=p.evaluate("(()=>{const c=document.querySelector('.pick:last-of-type span').getBoundingClientRect(),a=document.querySelector('#ask').getBoundingClientRect(),th=document.querySelector('#thesis').getBoundingClientRect();return [Math.round(a.top),Math.round(Math.max(c.bottom,th.bottom)),innerHeight]})()")
        check(f'home fits height {w}x{h}',v[0]>=60 and v[1]<=v[2],v)
        check(f'home has way to write {w}x{h}',p.is_visible('#contact-open'))
        # работа: стена
        p.evaluate("window.__gt.show('rabota')"); p.wait_for_timeout(300)
        m=p.evaluate(BAR); check(f'bar layout {w}x{h}',not m['clash'] and m['right']<=m['W'] and m['bottom']<=70,m)
        check(f'current word marked {w}x{h}',p.get_attribute('#nav a[data-go=rabota]','aria-current')=='page')
        check(f'no mark in work {w}x{h}',p.evaluate("getComputedStyle(document.querySelector('#gl')).display")=='none')
        r=p.evaluate(CLIP%"'#count,#q,#end-talk,.w-find label,.nq a,.chip'"); check(f'work clip {w}x{h}',not r['out'] and r['sw']<=r['W'] and p.evaluate("document.querySelector('#rabota').scrollWidth<=innerWidth"),r)
        m=p.evaluate("(()=>{const f=document.querySelector('#w-foot').getBoundingClientRect(),o=[...document.querySelectorAll('.w-row')].map(e=>e.getBoundingClientRect());return {fb:f.bottom,ft:f.top,n:o.length,rb:o[o.length-1].bottom,rt:o[0].top,rh:Math.min(...o.map(x=>x.height))}})()")
        check(f'wall fills the screen {w}x{h}',m['n']==6 and abs(m['fb']-h)<1 and abs(m['rb']-m['ft'])<2 and m['rt']<=76 and m['rh']>20,m)
        check(f'search filters and way to write visible {w}x{h}',p.is_visible('#q') and p.is_visible('#count') and p.is_visible('#end-talk') and p.locator('.chip:visible').count()==4)
        HITS="(()=>{const f=document.querySelector('#w-foot').getBoundingClientRect(),b=[...document.querySelectorAll('.w-hit')].map(e=>e.getBoundingClientRect());return {n:b.length,top:Math.min(...b.map(x=>x.top)),bot:Math.max(...b.map(x=>x.bottom)),ft:f.top}})()"
        p.fill('#q','ричтрак'); p.wait_for_timeout(120); r=p.evaluate(CLIP%"'.w-hit .sg,.w-hit small'"); m=p.evaluate(HITS); check(f'one hit fits {w}x{h}',m['n']==1 and not r['out'] and m['bot']<=m['ft'],[r,m]); p.fill('#q','')
        p.click('.chip[data-f=noexp]'); p.wait_for_timeout(120); r=p.evaluate(CLIP%"'.w-hit .sg,.w-hit small'"); m=p.evaluate(HITS); check(f'filter hits fit {w}x{h}',m['n']==4 and not r['out'] and m['bot']<=m['ft'] and m['top']>=40,[r,m]); p.click('.chip[data-f=noexp]')
        # профессии, табло и объект
        for i in IDS:
            p.evaluate(f"window.__gt.vacOpen('{i}',true)"); p.wait_for_timeout(80)
            m=p.evaluate(f"(()=>{{const q=s=>document.querySelector('#{i} '+s).getBoundingClientRect(),w=q('.v-who'),b=q('.v-foot .btn'),e=document.querySelector('#{i} .v-t'),R=document.createRange();R.selectNodeContents(e);const tr=R.getBoundingClientRect();return {{tr:tr.right,tb:tr.bottom,wt:w.top,bb:b.bottom,br:b.right,hh:q('.v-hero').height,W:innerWidth}}}})()")
            check(f'{i} hero fits {w}x{h}',m['tr']<=m['W']+1 and m['tb']<=m['wt']+1 and m['bb']<=h+1 and m['br']<=m['W']+1 and abs(m['hh']-h)<1,m)
            r=p.evaluate(CLIP%f"'#{i} h2,#{i} h3,#{i} li,#{i} .v-does,#{i} .o-pay,#{i} .an b,#{i} .an span,#{i} label,#{i} .demo-note,#{i} .v-next b,#{i} .btn,#{i} .rw .m,#{i} .rw .o,#{i} .rw .ml'"); check(f'{i} clip {w}x{h}',not r['out'] and p.evaluate("document.querySelector('#rabota').scrollWidth<=innerWidth"),r)
        for i in IDS:
            p.evaluate(f"window.__gt.vacOpen('{i}',true)"); p.wait_for_timeout(40)
            for n in range(7 if i=='komplektovshchik' else 1):
                if n: p.evaluate(f"window.__gt.objSet(document.querySelector('#{i}'),{n},false)")
                m=p.evaluate(f"[...document.querySelectorAll('#{i} .an>div')].filter(d=>{{const t=d.querySelector('b'),R=document.createRange();R.selectNodeContents(t);return R.getBoundingClientRect().right>d.getBoundingClientRect().right+1}}).map(d=>d.querySelector('b').textContent)")
                check(f'{i} tile words fit {n} {w}x{h}',not m,m)
        for i in ('komplektovshchik','vvsh','brigadir'):
            p.evaluate(f"window.__gt.vacOpen('{i}',true)"); p.wait_for_timeout(80)
            m=p.evaluate(f"(()=>{{const rows=[...document.querySelectorAll('#{i} .rw')],bad=[];rows.forEach(r=>{{const c=[...r.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>{{const R=document.createRange();R.selectNodeContents(e);return R.getBoundingClientRect()}});for(let k=0;k+1<c.length;k++)if(c[k].top<c[k+1].bottom-1&&c[k+1].top<c[k].bottom-1&&c[k].right>c[k+1].left+1)bad.push(r.textContent.slice(0,20));}});const b=document.querySelector('#{i} .v-board');return {{bad,bh:b.offsetHeight,rh:Math.min(...rows.map(x=>x.offsetHeight))}}}})()")
            check(f'{i} board cells do not collide {w}x{h}',(w<761 or not m['bad']) and m['bh']>=h-1 and m['rh']>=44 and (w<761 or h<700 or m['bh']<=h+1),m)
            m=p.evaluate(f"(()=>{{const o=document.querySelector('#{i} .v-obj'),a=[...o.querySelectorAll('.an>div')];return {{oh:o.offsetHeight,sc:o.scrollWidth-o.clientWidth,over:a.filter(e=>e.scrollHeight>e.clientHeight+1).length,n:a.length}}}})()")
            check(f'{i} object fits {w}x{h}',m['n']==6 and m['sc']<=1 and m['over']==0 and (w<761 or h<700 or m['oh']<=h+1),m)
        p.evaluate("window.__gt.vacClose(true)"); p.wait_for_timeout(100)
        # люди
        p.evaluate("window.__gt.show('lyudi')"); p.wait_for_timeout(300)
        check(f'no mark in people {w}x{h}',p.evaluate("getComputedStyle(document.querySelector('#gl')).display")=='none')
        r=p.evaluate(CLIP%"'#lyudi .ly-h,.ly-sub,.bl,.nq a,#my-go,#my-sample,#ly-skip'"); check(f'people clip {w}x{h}',not r['out'] and r['sw']<=r['W'] and p.evaluate("document.querySelector('#lyudi').scrollWidth<=innerWidth"),r)
        o=p.evaluate("[...document.querySelectorAll('.ly-f')].map(s=>s.offsetHeight)")
        check(f'people frames are screens {w}x{h}',len(o)==7 and min(o)>=h-1 and (max(o)<=h+1 or h<700),o)
        # эфир не менялся
        p.evaluate("window.__gt.show('klienty')"); p.wait_for_timeout(200)
        m=p.evaluate(BAR); check(f'bar over air {w}x{h}',not m['clash'],m)
        for i in range(5):
            p.click(f'#presets button[data-i="{i}"]'); p.wait_for_timeout(1800 if w>800 else 1200)
            r=p.evaluate(CLIP%"'#st-name,#st-line,#st-get,#st-need,#presets button'"); check(f'air clip st{i} {w}x{h}',not r['out'],r)
            m=p.evaluate("(()=>{const a=document.querySelector('#st-more').getBoundingClientRect(),d=document.querySelector('#air-foot').getBoundingClientRect(),n=document.querySelector('#st-name').getBoundingClientRect();return [Math.round(a.bottom),Math.round(d.top),Math.round(n.top)]})()")
            check(f'air fits st{i} {w}x{h}',m[0]<=m[1]+1 and m[2]>=40,m)
        check(f'no errors {w}x{h}',not p.E,p.E); c.close()
    # история без действий посетителя
    c,p=page(1000,640); p.wait_for_function('window.__gt.S.phase!=="dark"',timeout=60000); check('story autostarts',True); check('no err',not p.E,p.E); c.close()
    # кнопка «Пропустить» и переход сквозь звезду
    c,p=page(1000,640); p.click('#skip'); p.wait_for_function('window.__gt.S.phase==="choice"',timeout=120000); check('skip reaches choice',p.is_visible('.pick[data-t="0"]'))
    p.hover('.pick[data-t="0"]'); p.click('.pick[data-t="0"]'); p.wait_for_selector('#w-rows',timeout=30000); p.wait_for_timeout(1500)
    check('wipe into work',p.is_visible('#w-rows') and p.evaluate("getComputedStyle(document.querySelector('#wipe')).display")=='none')
    check('brand orange kept',p.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--or').trim()")=='#ff5c0a')
    # шапка ведёт в миры
    p.click('#nav a[data-go=lyudi]'); p.wait_for_timeout(1500); check('bar goes to people',p.evaluate("document.body.dataset.w")=='lyudi' and p.get_attribute('#nav a[data-go=lyudi]','aria-current')=='page'); p.click('#nav a[data-go=rabota]'); p.wait_for_timeout(1500)
    # стена и поиск
    check('ten professions behind the wall',p.locator('.vac').count()==10 and p.locator('.vac:visible').count()==0 and p.locator('#w-list li').count()==10 and 'ВВШ' in p.inner_text('#w-list'))
    a=p.evaluate("document.querySelector('.w-track').getBoundingClientRect().left"); p.wait_for_timeout(900); check('rows move',a!=p.evaluate("document.querySelector('.w-track').getBoundingClientRect().left"))
    y=p.evaluate("(()=>{const r=document.querySelector('.w-row:nth-child(3)').getBoundingClientRect();return r.top+r.height/2})()"); p.mouse.move(400,y); p.wait_for_timeout(350)
    check('hover stops the wall',p.evaluate("getComputedStyle(document.querySelector('.w-track')).animationPlayState")=='paused'); p.mouse.move(5,5)
    HIT="[...document.querySelectorAll('.w-hit .sg')].map(e=>e.textContent)"
    for q,want in (('ричтрак','ВВШ, погрузчик'),('рохля','Грузчик'),('стикер','Стикеровщик, упаковщик'),('удал','Менеджер по клиентам'),('кондитер','Фасовщик'),('отк','Сборщик')):
        p.fill('#q',q); p.wait_for_timeout(60); check('search word '+q,want in p.evaluate(HIT),p.evaluate(HIT))
    p.fill('#q','кладов'); p.wait_for_timeout(100); check('search finds one',p.locator('.w-hit').count()==1 and p.inner_text('#count').startswith('1 из 10') and '3 600' in p.inner_text('.w-hit') and '4 объекта' in p.inner_text('.w-hit') and p.evaluate("document.querySelector('#w-wall').classList.contains('dim')"))
    p.fill('#q','жираф'); p.wait_for_timeout(100); check('none message',p.is_visible('#none') and p.locator('.w-hit').count()==0)
    p.click('#none-clear'); check('clear',p.locator('.w-hit').count()==0 and p.is_visible('#w-rows') and not p.is_visible('#none') and 'Вахта' in p.inner_text('#count'))
    p.click('.chip[data-f=noexp]'); p.wait_for_timeout(80); check('filter lights professions',p.get_attribute('.chip[data-f=noexp]','aria-pressed')=='true' and p.evaluate(HIT)==['Комплектовщик','Стикеровщик, упаковщик','Грузчик','Фасовщик'],p.evaluate(HIT))
    p.click('.chip[data-f=sit]'); p.wait_for_timeout(80); check('two filters narrow down',p.evaluate(HIT)==['Стикеровщик, упаковщик'],p.evaluate(HIT))
    p.fill('#q','кладов'); p.wait_for_timeout(80); check('search and filter combine',p.locator('.w-hit').count()==0 and p.is_visible('#none')); p.click('#none-clear'); check('clear resets filters',p.get_attribute('.chip[data-f=noexp]','aria-pressed')=='false' and p.locator('.w-hit').count()==0)
    # от стены к отклику
    p.fill('#q','кладов'); p.keyboard.press('Enter'); p.wait_for_timeout(1100); check('enter opens the profession',p.is_visible('#kladovshchik .v-t') and p.evaluate("location.hash")=='#kladovshchik' and not p.is_visible('#w-wall') and p.evaluate("document.activeElement.classList.contains('v-t')") and p.evaluate("document.querySelector('#kladovshchik .v-bg').naturalWidth")>500)
    p.keyboard.press('Escape'); p.wait_for_timeout(1000); check('escape returns to the wall',p.is_visible('#w-rows') and p.locator('.vac:visible').count()==0 and p.evaluate("location.hash")=='#rabota' and p.evaluate("document.activeElement.id")=='q'); p.fill('#q','')
    p.focus('#w-list li:nth-child(5) button'); p.wait_for_timeout(100); check('keyboard focus lights a row',p.locator('.w-hit').count()==1 and 'ВВШ' in p.inner_text('.w-hit')); p.keyboard.press('Enter'); p.wait_for_timeout(1100); check('keyboard opens profession',p.is_visible('#vvsh .v-t'))
    p.click('#vvsh .v-next'); p.wait_for_timeout(500); check('next profession',p.is_visible('#fasovshchik .v-t') and p.evaluate("location.hash")=='#fasovshchik' and abs(p.evaluate("document.querySelector('#rabota').scrollTop"))<2)
    p.click('#fasovshchik .v-back'); p.wait_for_timeout(1000); check('back to the wall',p.is_visible('#w-rows') and p.locator('.vac:visible').count()==0)
    p.click('#none-clear') if p.is_visible('#none') else None
    p.fill('#q','комплект'); p.click('.w-hit'); p.wait_for_timeout(1100); K='#komplektovshchik'
    check('board has seven sites sorted by pay',p.locator(K+' .rw').count()==7 and p.evaluate(f"(()=>{{const a=[...document.querySelectorAll('{K} .rw .m')].map(e=>parseInt(e.firstChild.textContent.replace(/\\D/g,'')));return a.every((x,i)=>!i||a[i-1]>=x)}})()") and 'МАРКЕТПЛЕЙС' in p.inner_text(K+' .rw:first-child').upper())
    check('hero promises the range',('3 500' in p.inner_text(K+' .v-who p').replace('\xa0',' ')) and '7 объектов' in p.inner_text(K+' .v-who p'))
    p.click(K+' .v-pick'); p.wait_for_timeout(1300); check('pick scrolls to the board',abs(p.evaluate(f"document.querySelector('{K} .v-board').getBoundingClientRect().top"))<3 and p.evaluate("document.activeElement.classList.contains('rw')"))
    check('first site is selected',p.get_attribute(K+' .rw:first-child','aria-current')=='true' and 'Маркетплейс' in p.inner_text(K+' .o-l h3').title())
    p.click(K+' .rw:nth-child(3)'); p.wait_for_timeout(1300); check('row opens its site',p.evaluate("location.hash")=='#komplektovshchik-3' and p.get_attribute(K+' .rw:nth-child(3)','aria-current')=='true' and p.get_attribute(K+' .rw:first-child','aria-current') is None and '4\xa0600' in p.inner_text(K+' .o-pay') and abs(p.evaluate(f"document.querySelector('{K} .v-obj').getBoundingClientRect().top"))<3)
    check('site answers six questions',all(x in p.inner_text(K+' .an') for x in ('Где живу','Что ем','Какой график','Когда деньги','Как доеду','Что нужно')) and 'КВАРТИРА' in p.inner_text(K+' .an'))
    check('object image loaded',p.evaluate(f"document.querySelector('{K} .o-r img').naturalWidth")>500)
    check('nearby professions named','сборщик' in p.inner_text(K+' .o-in small'))
    check('form knows the site','Склад электроники' in p.inner_text(K+' .r-o'))
    p.click(K+' .o-in .job-me'); p.wait_for_timeout(1200); check('this is me goes to form',p.evaluate("document.activeElement.classList.contains('k-name')") and p.is_visible(K+' .job-send'))
    p.click(K+' .job-send'); check('two errors',p.locator(K+' .err:visible').count()==2)
    p.fill('#k-name0','Тест'); p.fill('#k-contact0','t@example.test'); p.click(K+' .job-send'); p.wait_for_timeout(300); check('done',p.is_visible(K+' .job-done') and not p.is_visible('#k-name0'))
    # удалённая работа: без табло
    p.evaluate("window.__gt.vacOpen('menedzher',true)"); p.wait_for_timeout(100); check('remote has no board',p.locator('#menedzher .v-board').count()==0 and 'не вахта' in p.inner_text('#menedzher .v-who p') and 'Из дома'.upper() in p.inner_text('#menedzher .an').upper()); p.click('#menedzher .v-foot .job-me'); p.wait_for_timeout(1200); check('remote answer form',p.is_visible('#menedzher .job-send') and p.evaluate("document.activeElement.classList.contains('k-name')"))
    p.evaluate("window.__gt.vacOpen('brigadir',true)"); p.wait_for_timeout(100); check('placeholder pay stays marked','[СУММА]' in p.inner_text('#brigadir .rw:first-child').upper() and '[Сумма]' in p.inner_text('#brigadir .v-who p'))
    p.click('#nav a[data-go=rabota]'); p.wait_for_timeout(1000); p.fill('#q',''); p.click('#end-talk'); check('end opens talk',p.is_visible('#talk')); p.click('#talk-x')
    check('no err work',not p.E,p.E); c.close()
    # мир «Люди»
    c,p=page(1000,640,'#lyudi'); p.wait_for_timeout(300)
    check('white and ink',p.evaluate("document.body.classList.contains('ink')") and p.evaluate("getComputedStyle(document.querySelector('#lyudi')).backgroundColor")=='rgb(255, 255, 255)')
    check('no struck words',p.evaluate("!document.querySelector('.cli-w,.struck')"))
    check('portrait images loaded',p.evaluate("[...document.querySelectorAll('.ly-im img')].every(i=>i.complete&&i.naturalWidth>500)"))
    PV="i=>+document.querySelectorAll('.ly-im img')[i].style.getPropertyValue('--p')"
    SC="n=>{const r=document.querySelector('#lyudi');r.style.scrollSnapType='none';r.scrollTop=document.querySelectorAll('.ly-f')[n].offsetTop}"
    check('first screen is the contour',p.evaluate(PV,0)==1 and p.evaluate(PV,1)==0 and p.evaluate(PV,2)==0)
    p.evaluate(SC,1); p.wait_for_timeout(250); check('step 1 gets lines',p.evaluate(PV,1)>.9 and p.evaluate(PV,2)==0)
    p.evaluate(SC,3); p.wait_for_timeout(250); check('step 3 gets the engraving',p.evaluate(PV,2)>.9 and p.evaluate("document.body.classList.contains('ink')"))
    p.evaluate(SC,4); p.wait_for_timeout(800); check('step 4 is alive on black',not p.evaluate("document.body.classList.contains('ink')") and p.evaluate("getComputedStyle(document.querySelector('#lyudi')).backgroundColor")=='rgb(0, 0, 0)' and p.evaluate("getComputedStyle(document.querySelectorAll('.ly-im img')[3]).opacity")=='1')
    p.evaluate(SC,0); p.evaluate("document.querySelector('#lyudi').style.scrollSnapType=''"); p.wait_for_timeout(600); check('back up returns to paper',p.evaluate("document.body.classList.contains('ink')"))
    p.click('#ly-skip'); p.wait_for_timeout(3000); check('skip link goes to form',p.evaluate("document.activeElement.dataset.k")=='role' and abs(p.evaluate("document.querySelector('.ly-end').getBoundingClientRect().top"))<3)
    p.click('#my-go'); check('role required',p.is_visible('#my-err') and p.evaluate("document.activeElement.dataset.k")=='role')
    p.keyboard.type('главный бухгалтер'); check('error clears',not p.is_visible('#my-err'))
    p.keyboard.press('Enter'); check('enter next blank',p.evaluate("document.activeElement.dataset.k")=='week')
    p.keyboard.type('будет стрессоустойчивым'); p.wait_for_timeout(100); check('editor note',p.is_visible('#my-note') and 'сложного' in p.inner_text('#my-note')); check('highlight',p.evaluate("CSS.highlights.has('cliche')"))
    p.click('#my-go'); check('contact required',p.is_visible('#my-err') and p.evaluate("document.activeElement.dataset.k")=='contact')
    p.evaluate("(()=>{const e=document.querySelector('.bl[data-k=role]');e.textContent='<img src=x onerror=window.__x=1>Бухгалтер';e.dispatchEvent(new Event('input',{bubbles:true}))})()")
    p.click('.bl[data-k=contact]'); p.keyboard.type('t@example.test'); p.click('#my-go'); p.wait_for_timeout(300); check('done state',p.is_visible('#my-done') and not p.is_visible('.my-go'))
    p.click('#my-see'); p.wait_for_selector('#moe .v-t:visible',timeout=30000); p.wait_for_timeout(1500); check('my ad opens first',p.evaluate("document.querySelector('#jobs').firstElementChild.id")=='moe' and p.locator('.vac').count()==11 and p.is_visible('#moe .job-fix') and p.evaluate("location.hash")=='#moe')
    check('input escaped',p.evaluate("!window.__x&&!document.querySelector('#moe img[src=x]')"))
    p.click('#moe .job-fix'); p.wait_for_timeout(1700); check('fix returns to form',p.evaluate("document.body.dataset.w")=='lyudi' and p.is_visible('.my-go') and p.evaluate("document.activeElement.dataset.k")=='role' and abs(p.evaluate("document.querySelector('.ly-end').getBoundingClientRect().top"))<3)
    p.click('#my-sample'); check('sample fills',p.evaluate("document.querySelector('.bl[data-k=week]').textContent").startswith('примет')); p.click('.bl[data-k=contact]'); p.click('#my-go'); p.wait_for_timeout(200); p.click('#my-again'); check('again resets',p.evaluate("document.querySelector('.bl').textContent")=='' and p.is_visible('.my-go') and p.evaluate("document.querySelector('.bl').isContentEditable"))
    p.click('#nav a[data-go=rabota]'); p.wait_for_timeout(1500); check('reset removes my ad',p.locator('#moe').count()==0 and p.evaluate("document.body.dataset.w")=='rabota')
    check('people accent is the brand orange',p.evaluate("getComputedStyle(document.querySelector('#lyudi')).getPropertyValue('--or').trim()")=='#ff5c0a')
    # возврат на главную: знак снова на месте
    p.click('#logo'); p.wait_for_timeout(1600); check('home shows mark again',p.evaluate("getComputedStyle(document.querySelector('#gl')).display")=='block' and p.is_visible('.pick[data-t="0"]'))
    check('no err people',not p.E,p.E); c.close()
    # эфир с клавиатуры
    c,p=page(1000,640,'#klienty'); p.focus('#tun'); [p.keyboard.press('ArrowRight') for _ in range(22)]; p.wait_for_timeout(1500)
    check('keyboard tunes to station',p.evaluate("document.querySelector('#klienty').classList.contains('tuned')"))
    p.click('#st-cta'); check('talk opens',p.is_visible('#talk') and 'сайт' in p.input_value('#t-what').lower()); p.click('#talk-f button[type=submit]'); check('talk error',p.is_visible('#t-contact-e'))
    p.fill('#t-contact','t@example.test'); p.click('#talk-f button[type=submit]'); check('talk done',p.is_visible('#talk-done')); p.click('#talk-x')
    check('no err air',not p.E,p.E); c.close()
    # без анимации
    c,p=page(1000,640,rm='reduce'); p.wait_for_timeout(300); check('reduced: choice at once',p.is_visible('.pick[data-t="0"]')); p.click('.pick[data-t="2"]'); p.wait_for_timeout(200); check('reduced: instant world',p.is_visible('#st-name')); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(300); check('reduced: tuned',p.evaluate("document.querySelector('#klienty').classList.contains('tuned')"))
    p.evaluate("window.__gt.show('rabota')"); p.wait_for_timeout(200); check('reduced: wall is still',p.evaluate("getComputedStyle(document.querySelector('.w-track')).animationName")=='none')
    p.evaluate("window.__gt.vacOpen('komplektovshchik')"); p.wait_for_timeout(100); check('reduced: job opens at once',p.is_visible('#komplektovshchik .v-t') and not p.is_visible('#w-wall') and p.evaluate("getComputedStyle(document.querySelector('#komplektovshchik .v-t')).opacity")=='1')
    p.click('#komplektovshchik .v-back'); p.wait_for_timeout(100); check('reduced: back at once',p.is_visible('#w-rows') and p.locator('.vac:visible').count()==0)
    p.evaluate("window.__gt.show('lyudi')"); p.wait_for_timeout(200); p.evaluate("document.querySelector('#lyudi').scrollTop=document.querySelectorAll('.ly-f')[3].offsetTop"); p.wait_for_timeout(200); check('reduced: portrait follows scroll',float(p.evaluate("document.querySelectorAll('.ly-im img')[2].style.getPropertyValue('--p')"))>.9); check('no err rm',not p.E,p.E); c.close()
    # прямые ссылки
    for h,sel in (('#rabota','#w-rows'),('#vvsh','#vvsh .v-t:visible'),('#lyudi','.ly-f'),('#obyavlenie','.bl'),('#klienty','#st-name')):
        c,p=page(1000,640,h); check('deep '+h,p.locator(sel).count()>0); check('no err '+h,not p.E,p.E); c.close()
    c,p=page(1000,640,'#kladovshchik'); check('deep job open with address',p.is_visible('#kladovshchik .v-t') and not p.is_visible('#w-wall') and p.evaluate("location.hash")=='#kladovshchik'); c.close()
    c,p=page(1000,640,'#vvsh-2'); check('deep site open with address',p.is_visible('#vvsh .v-t') and p.get_attribute('#vvsh .rw:nth-child(2)','aria-current')=='true' and p.evaluate("location.hash")=='#vvsh-2' and not p.E,p.E); c.close()
    c,p=page(1000,640,'#obyavlenie'); check('deep form',abs(p.evaluate("document.querySelector('.ly-end').getBoundingClientRect().top"))<3); c.close()
    # без WebGL
    NOGL="HTMLCanvasElement.prototype.getContext=(g=>function(t,...a){return t==='webgl2'?null:g.call(this,t,...a)})(HTMLCanvasElement.prototype.getContext);"
    c,p=page(1000,640,init=NOGL); p.click('#skip'); p.wait_for_timeout(200); check('nogl class',p.evaluate("document.body.classList.contains('nogl')"))
    p.evaluate("window.__gt.show('rabota')"); p.wait_for_timeout(200); check('nogl: work readable',p.is_visible('#w-rows')); p.evaluate("window.__gt.show('lyudi')"); p.wait_for_timeout(200); check('nogl: people readable',p.is_visible('#ly-t') and p.evaluate("document.querySelector('.ly-im img').naturalWidth")>500); check('no err nogl',not p.E,p.E); c.close()
    b.close()
print('PASS',len(ok),'FAIL',len(bad))
for x in bad: print(' -',x[:330])
