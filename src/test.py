import io, re, sys; sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image, ImageStat
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
    def page(w=1440,h=900,hash='',rm='no-preference',init=None,url=U):
        c=b.new_context(viewport={'width':w,'height':h},reduced_motion=rm); p=c.new_page(); p.E=[]
        if init: p.add_init_script(init)
        p.on('pageerror',lambda e:p.E.append('ERR '+str(e)))
        p.on('console',lambda m:p.E.append(m.text[:300]) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None)
        # внешний запрос (шрифты Google) изредка зависает, и загрузка не наступает: один повтор открытия
        try: p.goto(url+hash,wait_until='load')
        except Exception: p.goto(url+hash,wait_until='load')
        p.wait_for_timeout(900); return c,p
    for w,h in SIZES:
        c,p=page(w,h)
        # главная: Земля и три раздела на ней. Слова не выходят за экран и не наезжают друг на друга, когда одно выбрано (меряем строку слова, а не запас шрифта над и под буквами)
        WORDS="(()=>{const b=[...document.querySelectorAll('#hub .hub-t span.w1')].map(e=>e.getBoundingClientRect());let hit=0;for(let i=0;i<b.length;i++)for(let k=i+1;k<b.length;k++){const x=b[i],y=b[k];if(x.left<y.right-1&&y.left<x.right-1&&x.top<y.bottom-1&&y.top<x.bottom-1)hit++}return hit})()"
        r=p.evaluate(CLIP%"'#hub .hub-t span.w1,#hub .hub-s,#contact-open'"); check(f'home clip {w}x{h}',not r['out'] and r['sw']<=r['W'],r)
        for k in (0,1,2):
            p.evaluate(f"window.__gt.pick({k})"); p.wait_for_timeout(800)
            r=p.evaluate(CLIP%"'#hub .hub-t span.w1,#hub .hub-s,#hub .hub-go'"); check(f'home clip pick {k} {w}x{h}',not r['out'] and r['sw']<=r['W'] and p.evaluate(WORDS)==0,[r,p.evaluate(WORDS)])
        v=p.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),t=q('#hub .hub-t'),s=q('#hub .hub-s'),g=q('#hub .hub-go');return [Math.round(t.top),Math.round(t.bottom),Math.round(s.top),Math.round(g.bottom),innerHeight]})()")
        check(f'home fits height {w}x{h}',v[0]>=60 and v[1]<=v[2]+1 and v[3]<=v[4],v)
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
        for i in range(4):
            p.click(f'#presets button[data-i="{i}"]'); p.wait_for_timeout(1800 if w>800 else 1200)
            if i==0: p.wait_for_selector('#klienty.clean',state='attached',timeout=40000); p.wait_for_timeout(300)
            r=p.evaluate(CLIP%"'#st-name,#st-line,#st-ask,#st-hint,#presets button'"); check(f'air clip st{i} {w}x{h}',not r['out'],r)
            m=p.evaluate("(()=>{const a=document.querySelector('#st-hint').getBoundingClientRect(),d=document.querySelector('#air-foot').getBoundingClientRect(),n=document.querySelector('#st-name').getBoundingClientRect();return [Math.round(a.bottom),Math.round(d.top),Math.round(n.top)]})()")
            check(f'air fits st{i} {w}x{h}',m[0]<=m[1]+1 and m[2]>=40,m)
        check(f'no errors {w}x{h}',not p.E,p.E); c.close()
    # главная: вступления нет, сразу Земля. Без выбора она вращается, наведение выбирает раздел и поворачивает Землю к нему
    c,p=page(1000,640); p.wait_for_function('window.__gt.earth()>=3',timeout=60000); check('earth maps load',True)
    a=p.evaluate('window.__gt.S.v[0]'); p.mouse.move(990,10); p.wait_for_timeout(1200); check('earth turns by itself',p.evaluate('window.__gt.S.v[0]')>a+1 and p.evaluate('window.__gt.S.k')==-1 and not p.is_visible('#hub .hub-go'))
    p.hover('#hub .hub-t button:nth-child(1)'); p.wait_for_timeout(1500)
    check('hover picks work',p.evaluate('window.__gt.S.k')==0 and 'Вакансии' in p.inner_text('#hub .hub-s') and p.is_visible('#hub .hub-go') and p.get_attribute('#hub .hub-t button:nth-child(1)','aria-selected')=='true' and abs(p.evaluate('window.__gt.S.v[0]')-66)<3)
    # Землю можно крутить мышью: выбор снимается, Земля идёт за рукой
    p.mouse.move(500,150); p.mouse.down(); p.mouse.move(380,170,steps=6); p.mouse.up(); p.wait_for_timeout(200); check('drag turns the earth',p.evaluate('window.__gt.S.k')==-1)
    # «Распад»: Земля распадается на квадратики, раздел собирается из них
    p.hover('#hub .hub-t button:nth-child(1)'); p.wait_for_timeout(600); p.click('#hub .hub-go'); p.wait_for_timeout(500); check('dust runs',p.evaluate('window.__gt.S.dv')>0)
    p.wait_for_selector('#w-rows',timeout=30000); p.wait_for_timeout(1500)
    check('dust into work',p.is_visible('#w-rows') and p.evaluate("getComputedStyle(document.querySelector('#veil')).display")=='none' and p.evaluate('window.__gt.S.dv')==0)
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
    # один щелчок колеса — следующий экран, портрет сразу меняется
    p.mouse.move(500,320); p.mouse.wheel(0,100); p.wait_for_timeout(1300)
    check('one wheel notch is one screen',abs(p.evaluate("document.querySelector('#lyudi').scrollTop-document.querySelectorAll('.ly-f')[1].offsetTop"))<3 and p.evaluate(PV,1)>.9,p.evaluate("document.querySelector('#lyudi').scrollTop"))
    p.mouse.wheel(0,-100); p.wait_for_timeout(1300); check('one notch back',abs(p.evaluate("document.querySelector('#lyudi').scrollTop"))<3)
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
    p.click('#logo'); p.wait_for_timeout(2800); check('home shows earth again',p.evaluate("getComputedStyle(document.querySelector('#gl')).display")=='block' and p.is_visible('#hub .hub-t') and p.evaluate("document.querySelector('#gl').parentNode.id")=='home' and p.evaluate('window.__gt.S.dv')==0)
    check('no err people',not p.E,p.E); c.close()
    # эфир с клавиатуры
    c,p=page(1000,640,'#klienty'); p.focus('#tun'); [p.keyboard.press('ArrowRight') for _ in range(22)]; p.wait_for_selector('#klienty.clean',state='attached',timeout=40000)
    check('keyboard tunes to station',p.evaluate("document.querySelector('#klienty').classList.contains('tuned')"))
    p.click('#presets button[data-i="1"]'); p.wait_for_timeout(1600); p.click('#contact-open'); check('talk opens',p.is_visible('#talk')); p.click('#talk-f button[type=submit]'); check('talk error',p.is_visible('#t-contact-e'))
    p.fill('#t-contact','t@example.test'); p.click('#talk-f button[type=submit]'); check('talk done',p.is_visible('#talk-done')); p.click('#talk-x')
    check('no err air',not p.E,p.E); c.close()
    # белый шум не гаснет, когда страница открыта долго
    for hours in (0,1,48):
        c,p=page(1000,640,'#klienty',init="(()=>{const r=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>r(t=>f(t+%d))})()"%(hours*3600000)); p.wait_for_timeout(600)
        p.evaluate("['#air-noise','#air','#bar'].forEach(s=>document.querySelector(s).style.visibility='hidden')"); p.wait_for_timeout(100)
        g=ImageStat.Stat(Image.open(io.BytesIO(p.screenshot())).convert('L')); check(f'noise stays after {hours} h',g.mean[0]>80 and g.stddev[0]>30,(g.mean[0],g.stddev[0])); c.close()
    # «Сайт»: плохой сайт разваливается, куча лежит, колесо роняет телефон в воду, из воды встаёт пример
    ST="window.GTSAYT.state"
    # после примера на надписи одна кнопка: разговор про эту услугу. До конца примера кнопок нет.
    GO="(()=>{const g=document.querySelector('#st-go'),r=g.getBoundingClientRect(),f=document.querySelector('#air-foot').getBoundingClientRect().top;return {on:getComputedStyle(g).display!='none'&&r.height>0,t:g.textContent,b:Math.round(r.bottom),foot:Math.round(f),r:Math.round(r.right),W:innerWidth}})()"
    # надпись после примера проявляется и поднимается (stback, stgo): мерить её, когда она встала
    def until(p,js,ms=9000):
        try: p.wait_for_function(js,timeout=ms); return True
        except Exception: return False
    def go_check(p,name,word,topic):
        until(p,"document.querySelector('#klienty').classList.contains('exd')&&document.getAnimations().filter(a=>['stback','stgo'].includes(a.animationName)).every(a=>a.playState=='finished')"); r=p.evaluate(GO); check(f'{name}: one button after the example',r['on'] and word in r['t'] and r['b']<=r['foot'] and r['r']<=r['W'],r)
        p.click('#st-go'); check(f'{name}: button opens talk',p.is_visible('#talk') and topic in p.input_value('#t-what').lower()); p.click('#talk-x')
    for w,h in SIZES:
        # плохой сайт ловится, как станция: сначала полосы сквозь шум (junk), потом он закрывает экран (junk2), буквы встают на место
        c,p=page(w,h,'#klienty'); p.click('#presets button[data-i="0"]'); p.wait_for_selector('#klienty.junk',state='attached',timeout=20000)
        p.wait_for_function("document.querySelector('#klienty').classList.contains('junk2')&&document.querySelector('#junk').textContent.includes('Заезженный дизайн')&&getComputedStyle(document.querySelector('#logo')).visibility=='hidden'",timeout=20000)
        check(f'junk page first {w}',p.is_visible('.j-modal') and not p.is_visible('#st-ask') and not p.evaluate("document.querySelector('#klienty').classList.contains('clean')"))
        check(f'no GT logo over junk {w}',p.evaluate("getComputedStyle(document.querySelector('#logo')).visibility")=='hidden')
        check(f'junk says worn design {w}','Заезженный дизайн' in p.text_content('#junk'))
        p.wait_for_selector('#klienty.clean',state='attached',timeout=40000); p.wait_for_timeout(2500)
        # куча не закрывает текст: под вопросом и подсказкой обломки ниже подсказки, сбоку от них не выше нижнего края вопроса
        r=p.evaluate("(()=>{const P=[...document.querySelectorAll('#junk .jp.fell')].map(e=>e.getBoundingClientRect()),f=document.querySelector('#air-foot').getBoundingClientRect(),a=document.querySelector('#st-hint').getBoundingClientRect(),R=s=>{const g=document.createRange();g.selectNodeContents(document.querySelector(s));return g.getBoundingClientRect()},ht=R('#st-hint'),ak=R('#st-ask'),L=Math.min(ht.left,ak.left),Rt=Math.max(ht.right,ak.right),u=P.filter(q=>q.right>L&&q.left<Rt),sd=P.filter(q=>!(q.right>L&&q.left<Rt)),mn=A=>A.length?Math.round(Math.min(...A.map(q=>q.top))):9999;return {n:P.length,out:P.filter(q=>q.left<-3||q.right>innerWidth+3||q.bottom>f.top+8).length,top:mn(u),side:mn(sd),hint:Math.round(a.bottom),ask:Math.round(ak.bottom),sheet:getComputedStyle(document.querySelector('#j-sheet')).visibility}})()")
        check(f'junk pile on floor {w}x{h}',r['n']>=10 and r['out']==0,r); check(f'junk sheet gone {w}',r['sheet']=='hidden',r); check(f'junk leaves text {w}x{h}',r['top']>=r['hint']-30 and r['side']>=r['ask'],r)
        check(f'site station: face and question, no buttons {w}',p.is_visible('#st-ask') and p.is_visible('#st-hint') and not p.is_visible('#st-go') and p.locator('#st-x').count()==0 and 'лицо компании' in p.text_content('#st-line'))
        check(f'logo back after junk {w}',p.evaluate("getComputedStyle(document.querySelector('#logo')).visibility")=='visible')
        r=p.evaluate("(()=>{const q=document.querySelector('#junk .jp.j-modal').getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]})()"); y0=r[1]; p.mouse.move(r[0],r[1]); p.mouse.down(); p.mouse.move(r[0],max(90,r[1]-160),steps=5); p.wait_for_timeout(500)
        y1=p.evaluate("(()=>{const q=document.querySelector('#junk .jp.j-modal').getBoundingClientRect();return q.top+q.height/2})()"); p.mouse.up(); check(f'junk can be grabbed {w}',y1<y0-40,(y0,y1)); p.wait_for_timeout(300)
        check(f'pile waits for the visitor {w}',p.evaluate(ST)['ph']==0)
        # колесо вниз: телефон падает в воду, встаёт пример
        p.mouse.move(w/2,h/2)
        for _ in range(6): p.mouse.wheel(0,100); p.wait_for_timeout(40)
        p.wait_for_timeout(1500); s=p.evaluate(ST)
        check(f'wheel starts example {w}',s['ph']==2 and p.is_visible('#x1-cap') and not p.is_visible('#st-name'),s)
        r=p.evaluate(CLIP%"'#x1-cap h2,#x1-cap p,#x1-forms .lb,#x1-forms .t,#x1-hd .ix button,#x1-tag'"); check(f'example clip {w}x{h}',not r['out'] and r['sw']<=r['W'],r)
        r=p.evaluate("(()=>{const f=document.querySelector('#air-foot').getBoundingClientRect(),q=s=>document.querySelector(s).getBoundingClientRect(),c=q('#x1-cap'),m=q('#x1-forms'),hd=q('#x1-hd'),b=q('#bar');return {forms:Math.round(m.bottom),foot:Math.round(f.top),cap:Math.round(c.top),hd:Math.round(hd.top),bar:Math.round(b.bottom)}})()")
        check(f'example fits {w}x{h}',r['forms']<=r['foot'] and r['cap']>=r['hd'] and r['hd']>=r['bar']-1,r)
        # колесо проводит по формам и обратно теми же шагами. Лишние щелчки после края по правилу крутят ручку, поэтому их нет.
        seen=set()
        for _ in range(40):
            if p.evaluate(ST)['u']>=1: break
            p.mouse.wheel(0,100); p.wait_for_timeout(60); seen.add(p.evaluate(ST)['shape'])
        p.wait_for_timeout(1200); s=p.evaluate(ST)
        check(f'wheel walks all forms {w}',seen>={1,2,3} and s['u']==1,(seen,s))
        check(f'station text after example {w}',p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-name') and not p.is_visible('#st-hint'))
        go_check(p,f'site {w}','сайт','сайт'); p.mouse.move(w/2,h/2)
        back=set()
        for _ in range(40):
            if p.evaluate(ST)['u']<=-.18: break
            p.mouse.wheel(0,-100); p.wait_for_timeout(60); back.add(p.evaluate(ST)['shape'])
        p.wait_for_timeout(1200); s=p.evaluate(ST)
        check(f'wheel goes back the same steps {w}',back>={1,2,3} and s['ph']==0 and abs(float(p.evaluate('__gt.air.v'))-12)<1.5,(back,s))
        check(f'phone back in the pile {w}',p.evaluate("getComputedStyle(document.querySelector('#junk .j-call')).visibility")=='visible' and not p.is_visible('#x1-call'))
        # щелчок по пустому месту: вступление, затем следующая форма
        # первый щелчок проигрывает вступление до первой остановки, второй ведёт к следующей форме
        p.mouse.click(w*.5,h*.45); until(p,ST+".ph==2&&"+ST+".u>=0"); p.wait_for_timeout(300); s=p.evaluate(ST); check(f'click starts example {w}',s['ph']==2,s)
        p.mouse.click(*s['c']); until(p,ST+".shape==1",6000); s=p.evaluate(ST); check(f'click shows next form {w}',s['shape']==1,s)
        if w>760: p.click('#x1-hd .h3c'); check(f'example contact opens talk {w}',p.is_visible('#talk') and 'сайт' in p.input_value('#t-what').lower()); p.click('#talk-x')
        check(f'site no err {w}',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty'); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(1300); check('junk hidden on other stations',not p.is_visible('#junk'))
    p.click('#presets button[data-i="0"]'); p.wait_for_selector('#klienty.clean',state='attached',timeout=40000)
    # ручка уходит вправо: развалившийся сайт не собирается и при возвращении справа сразу лежит кучей
    KJ="(()=>{const k=document.querySelector('#klienty');return k.classList.contains('clean')&&!k.classList.contains('junk')})()"
    p.evaluate("(()=>{const t=document.querySelector('#tun');t.value=19;t.dispatchEvent(new Event('input'))})()"); p.wait_for_timeout(1400); check('junk stays fallen when the dial moves on',p.evaluate(KJ))
    p.click('#presets button[data-i="2"]'); p.wait_for_timeout(1500); p.evaluate("window.__jk=0;new MutationObserver(()=>{if(document.querySelector('#klienty').classList.contains('junk'))window.__jk=1}).observe(document.querySelector('#klienty'),{attributes:true})")
    p.click('#presets button[data-i="0"]'); p.wait_for_timeout(1800); check('junk stays fallen on return from the right',p.evaluate(KJ) and p.evaluate('window.__jk')==0)
    p.evaluate("(()=>{const t=document.querySelector('#tun');t.value=6;t.dispatchEvent(new Event('input'))})()"); p.wait_for_timeout(1400); check('dial back restores junk',p.evaluate("document.querySelector('#klienty').classList.contains('junk')"))
    p.click('#presets button[data-i="0"]'); p.wait_for_selector('#klienty.clean',state='attached',timeout=40000); p.wait_for_timeout(7500); check('example starts by itself',p.evaluate(ST)['ph']==2); check('site no err idle',not p.E,p.E); c.close()
    # на полпути к «Сайту» плохой сайт ещё ловится: полосы сквозь шум, помехи, буквы перебираются, и он не валится, пока сигнал не встал
    c,p=page(1000,640,'#klienty'); p.evaluate("(()=>{const t=document.querySelector('#tun');t.value=5;t.dispatchEvent(new Event('input'))})()"); p.wait_for_timeout(2500)
    r=p.evaluate("(()=>{const b=document.querySelector('#junk'),k=document.querySelector('#klienty');return {f:b.style.filter,m:!!(b.style.maskImage||b.style.webkitMaskImage),txt:b.textContent.includes('Заезженный дизайн'),junk:k.classList.contains('junk'),clean:k.classList.contains('clean')}})()")
    check('junk tunes in through bands',r['junk'] and 'j-tv' in r['f'] and r['m'] and not r['txt'] and not r['clean'],r)
    p.click('#presets button[data-i="0"]'); p.wait_for_selector('#klienty.clean',state='attached',timeout=40000)
    r=p.evaluate("(()=>{const b=document.querySelector('#junk');return {f:b.style.filter,m:!!(b.style.maskImage||b.style.webkitMaskImage),txt:b.textContent.includes('Заезженный дизайн')}})()")
    check('junk whole before it falls',not r['f'] and not r['m'] and r['txt'],r); check('no err junk tune',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',rm='reduce'); p.click('#presets button[data-i="0"]'); p.wait_for_timeout(300); check('reduced: junk already fallen',p.evaluate("document.querySelector('#klienty').classList.contains('clean') && document.querySelectorAll('#junk .jp.fell').length>=10"))
    p.mouse.move(500,320); [p.mouse.wheel(0,100) for _ in range(8)]; p.wait_for_timeout(300); check('reduced: example by wheel',p.evaluate(ST)['ph']==2); check('no err rm site',not p.E,p.E); c.close()
    # «Реклама»: поиск, лента, сайт кофейни, назад теми же шагами
    RK=U; RS="window.GTREK.state"
    # остановки шкалы в щелчках колеса из 32,4: выдача, лента, сайт, меню
    S1,S2,S3,S4=7.8/32.4,16.4/32.4,22.6/32.4,27.2/32.4
    FOOT="document.querySelector('#air-foot').getBoundingClientRect().top"
    # конец примера: он виден только в кружках на местах точек сетки, а сетка-сонар уже встаёт из него (класс mv)
    HT="(()=>{const x=document.querySelector(%s),s=document.querySelector('#sonar');return {m:(x.style.maskImage||x.style.webkitMaskImage||'').slice(0,16),on:s.classList.contains('on'),mv:s.classList.contains('mv')}})()"
    def to(p,t):
        for _ in range(90):
            u=p.evaluate(RS)['u']
            if abs(u-t)<.002: break
            p.mouse.wheel(0,max(-100,min(100,(t-u)*3240))); p.wait_for_timeout(25)
        p.wait_for_timeout(800)
    for w,h in [(320,640),(390,844),(1024,768),(1280,720),(1440,900)]:
        c,p=page(w,h,'#klienty',url=RK); p.click('#presets button[data-i="1"]'); p.wait_for_timeout(1800)
        check(f'ads card: question and hint, no buttons {w}',p.is_visible('#st-ask') and 'привести' in p.text_content('#st-ask') and p.is_visible('#st-hint') and not p.is_visible('#st-go'))
        p.mouse.move(w/2,h*.45); to(p,S1)
        check(f'ads search {w}',p.is_visible('#x2-find') and p.text_content('#x2-q')=='кофе с доставкой бишкек' and p.text_content('#x2-ad .t')=='ZERNO — кофе за 20 минут' and not p.is_visible('#st-name'))
        r=p.evaluate(CLIP%"'#x2-find h3,#x2-find p,#x2-fld,#x2-ad .t,#x2-ad .d'"); check(f'ads search clip {w}x{h}',not r['out'],r)
        # фон примера по умолчанию тёмный, переключатель даёт светлый; переключатель не наезжает на подпись
        r=p.evaluate("(()=>{const a=document.querySelector('#x2-th').getBoundingClientRect(),g=document.createRange();g.selectNodeContents(document.querySelector('#x2-c1 h3'));const c=g.getBoundingClientRect(),f=document.querySelector('#air-foot').getBoundingClientRect().top;return {hit:a.left<c.right&&a.right>c.left&&a.top<c.bottom&&a.bottom>c.top,out:a.right>innerWidth||a.bottom>f+1}})()")
        check(f'ads dark by default {w}',p.is_visible('#x2-th') and not p.evaluate("document.body.classList.contains('ink')") and not r['hit'] and not r['out'],r)
        p.click('#x2-th button[data-t="l"]'); p.wait_for_timeout(300); check(f'ads light switch {w}',p.evaluate("document.querySelector('#x2').classList.contains('lt') && document.body.classList.contains('ink')"))
        p.click('#x2-th button[data-t="d"]'); p.wait_for_timeout(300); p.mouse.move(w/2,h*.45)
        r=p.evaluate("(()=>{const f=document.querySelector('#air-foot').getBoundingClientRect().top,a=document.querySelector('#x2-ad').getBoundingClientRect(),b=document.querySelector('#bar').getBoundingClientRect(),c=document.querySelector('#x2-c1').getBoundingClientRect();return {ad:Math.round(a.bottom),cap:Math.round(c.top),foot:Math.round(f),bar:Math.round(b.bottom)}})()")
        check(f'ads search fits {w}x{h}',r['ad']<=r['foot'] and r['cap']>=r['bar']-1,r)
        to(p,S2)
        r=p.evaluate("(()=>{const s=document.querySelector('#x2-ph .scr').getBoundingClientRect(),m=document.querySelector('#x2-md').getBoundingClientRect(),f=document.querySelector('#air-foot').getBoundingClientRect().top,ph=document.querySelector('#x2-ph').getBoundingClientRect(),t=[...document.querySelectorAll('#x2-tags li')].map(e=>e.getBoundingClientRect());return {mid:Math.round(m.top+m.height/2-(s.top+s.height/2)),ph:[Math.round(ph.top),Math.round(ph.bottom)],foot:Math.round(f),tags:t.filter(q=>q.left<-1||q.right>innerWidth+1||q.bottom>f+2||(q.right>ph.left+2&&q.left<ph.right-2&&q.bottom>ph.top&&q.top<ph.bottom)).length}})()")
        check(f'ads feed: post in the middle of the phone {w}',p.is_visible('#x2-feed') and abs(r['mid'])<=2,r); check(f'ads feed fits {w}x{h}',r['ph'][1]<=r['foot']+1 and r['tags']==0,r)
        to(p,S3)
        r=p.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),f=q('#air-foot').top,hd=q('#x2-hd'),b=q('#bar'),see=q('#x2-see'),w2=q('#x2-w2');return {hd:Math.round(hd.top),bar:Math.round(b.bottom),see:Math.round(see.bottom),w2:Math.round(w2.bottom),foot:Math.round(f),ink:document.body.classList.contains('ink')}})()")
        check(f'ads site {w}',p.evaluate(RS)['land']==1 and p.evaluate('GTREK.dark') and not r['ink'],r); check(f'ads site fits {w}x{h}',r['hd']>=r['bar']-1 and r['see']<=r['foot'] and r['w2']<=r['foot'],r)
        r=p.evaluate(CLIP%"'#x2-hd b,#x2-meta,#x2-see'"); check(f'ads site clip {w}x{h}',not r['out'],r)
        to(p,S4); p.click('#x2-wall button:nth-child(4)'); check(f'ads menu pick {w}','Латте' in p.text_content('#x2-price'))
        p.click('#x2-take'); check(f'ads order note {w}',p.is_visible('#x2-sd')); p.click('#x2-sd-go'); check(f'ads talk {w}',p.is_visible('#talk') and 'реклам' in p.input_value('#t-what').lower()); p.click('#talk-x')
        # надпись станции чёрная, как у «Сайта»: буквы белые, поэтому класса ink нет
        p.mouse.move(w/2,h*.45); to(p,30.7/32.4); p.wait_for_timeout(700); r=p.evaluate(HT%"'#x2'"); check(f'ads ends as halftone into the grid {w}','radial' in r['m'] and r['on'] and r['mv'],r)
        to(p,1); until(p,"document.querySelector('#klienty').classList.contains('exd')"); check(f'ads end card {w}',p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-name') and not p.is_visible('#x2-land') and not p.evaluate("document.body.classList.contains('ink')"))
        go_check(p,f'ads {w}','рекламу','реклам'); p.mouse.move(w/2,h*.45)
        # назад по щелчку колеса до края. Лишние щелчки после края по правилу крутят ручку, поэтому их нет.
        back=set(); SC="['#x2-land','#x2-feed','#x2-find'].filter(s=>getComputedStyle(document.querySelector(s)).visibility=='visible')"
        for _ in range(40):
            if p.evaluate(RS)['u']<=0: break
            p.mouse.wheel(0,-100); p.wait_for_timeout(40); back.update(p.evaluate(SC))
        p.wait_for_timeout(1200); s=p.evaluate(RS); check(f'ads back the same steps {w}',back>={'#x2-land','#x2-feed','#x2-find'} and s['u']==0 and s['ph']==0 and p.is_visible('#st-ask') and abs(float(p.evaluate('__gt.air.v'))-63)<1.5,s)
        # начало и конец примера идут медленно, поэтому щелчок играет до выдачи около трёх секунд
        p.mouse.click(w*.5,h*.4); until(p,f"Math.abs({RS}.u-{S1})<.002"); s=p.evaluate(RS); check(f'ads click plays search {w}',abs(s['u']-S1)<.002,s)
        check(f'ads no err {w}',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',url=RK); p.click('#presets button[data-i="1"]'); p.wait_for_timeout(10500); check('ads start by itself',abs(p.evaluate(RS)['u']-S1)<.002,p.evaluate(RS))
    p.click('#presets button[data-i="2"]'); p.wait_for_timeout(1500); check('ads off on other station',not p.evaluate(RS)['on'] and p.evaluate("window.GTSMM.state")['on']); check('ads no err idle',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',rm='reduce',url=RK); p.click('#presets button[data-i="1"]'); p.wait_for_timeout(400); p.mouse.move(500,300)
    for _ in range(21): p.mouse.wheel(0,100); p.wait_for_timeout(20)
    p.wait_for_timeout(300); check('reduced: ads site by wheel',p.evaluate(RS)['land']==1); check('no err rm ads',not p.E,p.E); c.close()
    # SMM: профиль кофейни за три месяца, серия постов складывается в картину, назад теми же шагами
    SM=U; SS="window.GTSMM.state"
    # остановки шкалы в щелчках колеса из 28: день 1, посты месяца, разговор, серия, картина
    T1,T2,T3,T4,T5=3.2/28,9.4/28,14/28,20.2/28,22.6/28
    def to3(p,t):
        for _ in range(120):
            u=p.evaluate(SS)['u']
            if abs(u-t)<.002: break
            p.mouse.wheel(0,max(-100,min(100,(t-u)*2800))); p.wait_for_timeout(25)
        p.wait_for_timeout(800)
    VIS="(s=>getComputedStyle(document.querySelector(s)).visibility=='visible'&&+getComputedStyle(document.querySelector(s)).opacity>.9)"
    for w,h in [(320,640),(390,844),(1024,768),(1280,720),(1440,900)]:
        c,p=page(w,h,'#klienty',url=SM); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(1800)
        check(f'smm card: question and hint, no buttons {w}',p.is_visible('#st-ask') and 'подписаться' in p.text_content('#st-ask') and p.is_visible('#st-hint') and not p.is_visible('#st-go'))
        p.mouse.move(w/2,h*.45); to3(p,T1)
        check(f'smm day 1 {w}',p.is_visible('#x3-scene') and p.text_content('#x3-h')=='День 1' and p.text_content('#x3-np')=='0' and not p.is_visible('#st-name'))
        r=p.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),f=q('#air-foot').top,hd=q('#x3-hd'),b=q('#bar'),g=q('#x3-grid'),ts=parseFloat(getComputedStyle(document.querySelector('#x3')).getPropertyValue('--ts'));return {hd:Math.round(hd.top),bar:Math.round(b.bottom),rows:Math.round(g.top+3*ts),foot:Math.round(f),right:Math.round(g.right),W:innerWidth,ink:document.body.classList.contains('ink')}})()")
        check(f'smm profile fits {w}x{h}',r['hd']>=r['bar']-1 and r['rows']<=r['foot']+2 and r['right']<=r['W'] and not r['ink'],r)
        r=p.evaluate(CLIP%"'#x3-cap h3,#x3-cap p,#x3-hd .who b,#x3-sub,#x3-ct'"); check(f'smm clip {w}x{h}',not r['out'] and r['sw']<=r['W'],r)
        to3(p,T2); check(f'smm month posts {w}',p.text_content('#x3-np')=='10' and p.text_content('#x3-h')=='Месяц')
        to3(p,T3)
        r=p.evaluate("(()=>{const f=document.querySelector('#air-foot').getBoundingClientRect().top,b=[...document.querySelectorAll('#x3-cm .bb')].filter(e=>getComputedStyle(e).visibility=='visible').map(e=>e.getBoundingClientRect());return {n:b.length,out:b.filter(q=>q.left<-1||q.right>innerWidth+1||q.bottom>f+2).length}})()")
        check(f'smm talk {w}',p.evaluate(VIS+"('#x3-q2')") and p.evaluate("document.querySelector('#x3-q2').classList.contains('vip')") and (w<=760 or p.evaluate(VIS+"('#x3-a1')")) and r['out']==0,r)
        p.click('#x3-sub'); check(f'smm subscribe note {w}',p.is_visible('#x3-sd')); p.click('#x3-sd-go'); check(f'smm talk opens {w}',p.is_visible('#talk') and 'соцсет' in p.input_value('#t-what').lower()); p.click('#talk-x')
        p.mouse.move(w/2,h*.45); to3(p,T4); check(f'smm series {w}',p.text_content('#x3-np')=='92' and p.text_content('#x3-h')=='3 месяца')
        to3(p,T5)
        r=p.evaluate("(()=>{const q=document.querySelector('#x3-big').getBoundingClientRect(),f=document.querySelector('#air-foot').getBoundingClientRect().top;return {op:+getComputedStyle(document.querySelector('#x3-big')).opacity,hd:+getComputedStyle(document.querySelector('#x3-hd')).opacity,l:Math.round(q.left),r:Math.round(q.right),b:Math.round(q.bottom),t:Math.round(q.top),foot:Math.round(f),W:innerWidth}})()")
        check(f'smm image {w}x{h}',p.text_content('#x3-h')=='Образ' and r['op']>.99 and r['hd']<.01 and r['l']>=0 and r['r']<=r['W'] and r['b']<=r['foot']+2,r)
        to3(p,26.3/28); p.wait_for_timeout(700); r=p.evaluate(HT%"'#x3'"); check(f'smm ends as halftone into the grid {w}','radial' in r['m'] and r['on'] and r['mv'],r)
        to3(p,1); until(p,"document.querySelector('#klienty').classList.contains('exd')"); check(f'smm end card {w}',p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-name') and not p.is_visible('#x3-scene'))
        go_check(p,f'smm {w}','SMM','соцсет'); p.mouse.move(w/2,h*.45)
        back=set(); SC="['#x3-big','#x3-q2','#x3-scene'].filter(s=>getComputedStyle(document.querySelector(s)).visibility=='visible'&&+getComputedStyle(document.querySelector(s)).opacity>.5)"
        for _ in range(60):
            if p.evaluate(SS)['u']<=0: break
            p.mouse.wheel(0,-100); p.wait_for_timeout(40); back.update(p.evaluate(SC))
        p.wait_for_timeout(1200); s=p.evaluate(SS); check(f'smm back the same steps {w}',back>={'#x3-big','#x3-q2','#x3-scene'} and s['u']==0 and s['ph']==0 and p.is_visible('#st-ask') and abs(float(p.evaluate('__gt.air.v'))-88)<1.5,s)
        p.mouse.click(w*.5,h*.4); until(p,f"Math.abs({SS}.u-{T1})<.002"); s=p.evaluate(SS); check(f'smm click plays day 1 {w}',abs(s['u']-T1)<.002,s)
        check(f'smm no err {w}',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',url=SM); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(10500); check('smm start by itself',abs(p.evaluate(SS)['u']-T1)<.002,p.evaluate(SS))
    p.click('#presets button[data-i="1"]'); p.wait_for_timeout(1500); check('smm off on ads',not p.evaluate(SS)['on'] and p.evaluate(RS)['on'])
    p.click('#presets button[data-i="3"]'); p.wait_for_timeout(1500); check('smm off on brand',not p.evaluate(SS)['on'] and p.evaluate("window.GTBRD.state")['on']); check('smm no err idle',not p.E,p.E); c.close()
    # поле клавиш SMM (smm-keys.js) рисуется только на настоящей видеокарте: на программной (SwiftShader) его нет, станция идёт прежним путём
    c,p=page(1000,640,'#klienty',url=SM); p.wait_for_timeout(800); check('keys off on software gpu',p.evaluate("!document.querySelector('#kx')")); c.close()
    bg=pw.chromium.launch(channel='chrome',args=['--use-angle=d3d11','--ignore-gpu-blocklist'])
    def gpage(w,h):
        c=bg.new_context(viewport={'width':w,'height':h}); p=c.new_page(); p.E=[]
        p.on('pageerror',lambda e:p.E.append('ERR '+str(e)))
        p.on('console',lambda m:p.E.append(m.text[:300]) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None)
        try: p.goto(SM+'#klienty',wait_until='load')
        except Exception: p.goto(SM+'#klienty',wait_until='load')
        p.wait_for_timeout(1500); p.click('#presets button[data-i="2"]'); return c,p
    KX="({k:window.__kx.K.k,kx:getComputedStyle(document.querySelector('#kx')).visibility,son:+getComputedStyle(document.querySelector('#sonar')).opacity,st:document.querySelector('#st-name').style.opacity})"
    c,p=gpage(1440,900); p.wait_for_function("window.__kx&&window.__kx.ready&&window.__gt.air.cur===2",timeout=30000); p.wait_for_timeout(1200)
    r=p.evaluate(KX); check('keys field on gpu',r['kx']=='visible' and r['son']==0 and r['k']==0,r)
    # 6 щелчков колеса: 9 клавиш встают в клетки профиля, пример ещё не начался, надпись станции погасла
    p.mouse.move(720,450)
    for _ in range(6): p.mouse.wheel(0,100); p.wait_for_timeout(350)
    p.wait_for_timeout(1500); r=p.evaluate(KX); s2=p.evaluate(SS); check('keys 6 notches: tiles in cells',r['k']==1 and s2['u']==0 and r['kx']=='visible' and float(r['st'] or 1)<.05,[r,s2])
    # ещё 2 щелчка: плитки становятся пунктиром клеток, поле уходит, «День 1», надпись станции снова своя
    for _ in range(2): p.mouse.wheel(0,100); p.wait_for_timeout(450)
    p.wait_for_timeout(2500); r=p.evaluate(KX)
    check('keys hand over to day 1',r['kx']=='hidden' and r['st']=='' and p.text_content('#x3-h')=='День 1' and p.evaluate("+getComputedStyle(document.querySelector('#x3-bg')).opacity")>.99,r)
    # назад: пример до начала, потом клавиши обратно в поле
    for _ in range(40):
        if p.evaluate(SS)['u']<=0 and p.evaluate('window.__kx.K.k')<=0: break
        p.mouse.wheel(0,-100); p.wait_for_timeout(120)
    p.wait_for_timeout(1500); r=p.evaluate(KX); check('keys back to the field',r['k']==0 and r['kx']=='visible' and r['st']=='',r)
    check('keys no err',not p.E,p.E); c.close()
    # 6 секунд покоя на станции: переход идёт сам, потом пример сам доходит до «Дня 1»
    c,p=gpage(1000,640); p.wait_for_timeout(11000); r=p.evaluate(KX); s2=p.evaluate(SS)
    check('keys start by themselves',r['k']==1 and abs(s2['u']-T1)<.002,[r,s2]); check('keys no err idle',not p.E,p.E); c.close()
    # телефон: поля нет и three.js не грузится, станция идёт прежним путём
    c,p=gpage(390,844); p.wait_for_timeout(2000); check('keys off on phone',p.evaluate("!document.querySelector('#kx')")); c.close()
    bg.close()
    c,p=page(1000,640,'#klienty',rm='reduce',url=SM); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(400); p.mouse.move(500,300)
    for _ in range(22): p.mouse.wheel(0,100); p.wait_for_timeout(20)
    p.wait_for_timeout(300); check('reduced: smm image by wheel',p.evaluate("+getComputedStyle(document.querySelector('#x3-big')).opacity")>.99); check('no err rm smm',not p.E,p.E); c.close()
    # «Бренд»: брендбук кофейни по шагам, назад теми же шагами
    BD=U; BS="window.GTBRD.state"
    # сетка-сонар: под чёрной надписью станции, пока пример не идёт
    SON="document.querySelector('#sonar').classList.contains('on')"
    SONPX="(()=>{const c=document.querySelector('#sonar'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=16)if(d[i]>0)n++;return n})()"
    # точки шкалы в щелчках колеса из 33,2: знак, красный на весь экран, палитра, буквы, правила, носители, проверка
    B1,B2,B3,B4,B5,B6,B7=[n/33.2 for n in (4.8,9.4,12,15,18.6,23.4,27.6)]
    def to4(p,t):
        for _ in range(140):
            u=p.evaluate(BS)['u']
            if abs(u-t)<.002: break
            p.mouse.wheel(0,max(-100,min(100,(t-u)*3320))); p.wait_for_timeout(25)
        p.wait_for_timeout(800)
    for w,h in [(320,640),(390,844),(1024,768),(1280,720),(1440,900)]:
        c,p=page(w,h,'#klienty',url=BD); p.click('#presets button[data-i="3"]'); p.wait_for_timeout(1800)
        check(f'brand card: question and hint, no buttons {w}',p.is_visible('#st-ask') and 'взгляда' in p.text_content('#st-ask') and p.is_visible('#st-hint') and not p.is_visible('#st-go'))
        check(f'brand card: sonar draws {w}',p.evaluate(SON) and p.evaluate(SONPX)>200,p.evaluate(SONPX))
        p.mouse.move(w/2,h*.45); to4(p,B1)
        check(f'brand sign {w}',p.is_visible('#x4-scene') and p.text_content('#x4-h')=='Знак' and not p.is_visible('#st-name') and not p.evaluate(SON))
        r=p.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),f=q('#air-foot').top,b=q('#bar').bottom,sh=q('#x4-sheet'),cp=q('#x4-cap'),g=q('#x4-get'),pg=q('#x4-pg');return {top:Math.round(Math.min(sh.top,cp.top,g.top,pg.top)),bar:Math.round(b),bot:Math.round(Math.max(sh.bottom,cp.bottom)),foot:Math.round(f),l:Math.round(Math.min(sh.left,cp.left)),r:Math.round(Math.max(sh.right,cp.right,g.right)),W:innerWidth,hit:cp.right>sh.left&&cp.left<sh.right&&cp.bottom>pg.top&&cp.top<sh.bottom,ink:document.body.classList.contains('ink')}})()")
        check(f'brand sheet fits {w}x{h}',r['top']>=r['bar']-1 and r['bot']<=r['foot']+1 and r['l']>=0 and r['r']<=r['W'] and not r['hit'] and not r['ink'],r)
        r=p.evaluate(CLIP%"'#x4-cap small,#x4-cap h3,#x4-cap p,#x4-get,#x4-pg'"); check(f'brand clip {w}x{h}',not r['out'] and r['sw']<=r['W'],r)
        to4(p,B2); check(f'brand red flood {w}',p.text_content('#x4-h')=='Цвет' and p.evaluate("document.querySelector('#x4').classList.contains('red')") and p.evaluate(VIS+"('#x4-flood')"))
        to4(p,B3)
        r=p.evaluate("(()=>{const f=document.querySelector('#air-foot').getBoundingClientRect().top,c=[...document.querySelectorAll('#x4-pal .ch')].map(e=>[e.getBoundingClientRect(),+getComputedStyle(e).opacity]);return {n:c.filter(x=>x[1]>.99).length,out:c.filter(([q])=>q.left<-1||q.right>innerWidth+1||q.bottom>f+2).length}})()")
        check(f'brand palette {w}x{h}',r['n']==4 and r['out']==0,r)
        p.click('#x4-get'); check(f'brand pdf note {w}',p.is_visible('#x4-sd')); p.click('#x4-sd-go'); check(f'brand talk opens {w}',p.is_visible('#talk') and 'бренд' in p.input_value('#t-what').lower()); p.click('#talk-x')
        p.mouse.move(w/2,h*.45); to4(p,B4); check(f'brand letters {w}',p.text_content('#x4-h')=='Буквы')
        to4(p,B5); check(f'brand rules {w}',p.text_content('#x4-h')=='Правила')
        to4(p,B6); check(f'brand carriers {w}',p.text_content('#x4-h')=='Везде')
        to4(p,B7); check(f'brand check {w}',p.text_content('#x4-h')=='ZERNO' and p.evaluate("+getComputedStyle(document.querySelector('#x4-get')).opacity")<.01)
        to4(p,1); until(p,"document.querySelector('#klienty').classList.contains('exd')"); check(f'brand end card {w}',p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-name') and not p.is_visible('#x4-scene') and p.evaluate(SON))
        go_check(p,f'brand {w}','бренд','бренд'); p.mouse.move(w/2,h*.45)
        back=set()
        for _ in range(70):
            if p.evaluate(BS)['u']<=0: break
            p.mouse.wheel(0,-100); p.wait_for_timeout(40); back.add(p.text_content('#x4-h'))
        p.wait_for_timeout(1200); s=p.evaluate(BS); check(f'brand back the same steps {w}',back>={'ZERNO','Узнали?','Везде','Правила','Буквы','Цвет','Знак'} and s['u']==0 and s['ph']==0 and p.is_visible('#st-ask') and abs(float(p.evaluate('__gt.air.v'))-37)<1.5,(back,s))
        p.mouse.click(w*.5,h*.4); p.wait_for_timeout(2000); s=p.evaluate(BS); check(f'brand click plays the sign {w}',abs(s['u']-B1)<.002,s)
        check(f'brand no err {w}',not p.E,p.E); c.close()
    # сетка есть на всех четырёх надписях станций, пока пример идёт, её нет
    c,p=page(1000,640,'#klienty',url=BD); DO="[...document.querySelectorAll('#presets button')].map(b=>b.textContent+b.style.left).join()"; check('dial order: site, brand, ads, smm',p.evaluate(DO)=='Сайт12%,Бренд37%,Реклама63%,SMM88%',p.evaluate(DO))
    p.click('#presets button[data-i="0"]'); p.wait_for_selector('#klienty.clean',state='attached',timeout=40000); p.wait_for_timeout(700); on=[p.evaluate(SON)]
    for i in (1,2,3): p.click(f'#presets button[data-i="{i}"]'); p.wait_for_timeout(1800); on.append(p.evaluate(SON))
    check('sonar on all four cards',all(on),on)
    p.wait_for_timeout(9000); check('brand start by itself',abs(p.evaluate(BS)['u']-B1)<.002,p.evaluate(BS)); check('sonar off while the brand example runs',not p.evaluate(SON))
    p.click('#presets button[data-i="2"]'); p.wait_for_timeout(1500); check('brand off on smm',not p.evaluate(BS)['on'] and p.evaluate(SS)['on']); check('brand no err idle',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',rm='reduce',url=BD); p.click('#presets button[data-i="3"]'); p.wait_for_timeout(400); check('reduced: sonar is a still grid',p.evaluate(SON) and p.evaluate(SONPX)>200,p.evaluate(SONPX)); p.mouse.move(500,300)
    for _ in range(27): p.mouse.wheel(0,100); p.wait_for_timeout(20)
    p.wait_for_timeout(300); check('reduced: brand check by wheel',p.text_content('#x4-h')=='ZERNO',p.text_content('#x4-h')); check('no err rm brand',not p.E,p.E); c.close()
    # без анимации
    c,p=page(1000,640,rm='reduce'); p.wait_for_timeout(300); check('reduced: earth and words at once',p.is_visible('#hub .hub-t')); p.click('#hub .hub-t button:nth-child(3)'); p.wait_for_timeout(200); check('reduced: hover picks, click goes at once',p.is_visible('#st-name')); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(300); check('reduced: tuned',p.evaluate("document.querySelector('#klienty').classList.contains('tuned')"))
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
    c,p=page(1000,640,init=NOGL); p.wait_for_timeout(200); check('nogl class',p.evaluate("document.body.classList.contains('nogl')")); check('nogl: words readable',p.is_visible('#hub .hub-t') and p.evaluate("getComputedStyle(document.querySelector('#hub .hub-t .w1')).mixBlendMode")=='normal')
    p.evaluate("window.__gt.show('rabota')"); p.wait_for_timeout(200); check('nogl: work readable',p.is_visible('#w-rows')); p.evaluate("window.__gt.show('lyudi')"); p.wait_for_timeout(200); check('nogl: people readable',p.is_visible('#ly-t') and p.evaluate("document.querySelector('.ly-im img').naturalWidth")>500); check('no err nogl',not p.E,p.E); c.close()
    b.close()
print('PASS',len(ok),'FAIL',len(bad))
for x in bad: print(' -',x[:330])
