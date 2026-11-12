import io, re, sys; sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:4391/index.html'
ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']
ok=[];bad=[]
def held(p,i):
    try: p.wait_for_function('window.__cy.holdNow()==%d'%i,timeout=8000); return True
    except Exception: return False
def check(n,c,x=''): (ok if c else bad).append(n+(' '+str(x) if x not in ('',None) and not c else ''))
CLIP="""()=>{const W=innerWidth,H=innerHeight,out=[];const vis=e=>{const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none'&&e.getClientRects().length>0};
 document.querySelectorAll(%s).forEach(e=>{if(!vis(e))return;const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();if(b.width>0&&(b.right>W+1||b.left<-1))out.push((e.textContent||'').trim().slice(0,22)+':'+Math.round(b.left)+'-'+Math.round(b.right))});return {sw:document.documentElement.scrollWidth,W,out}}"""
IDS=['komplektovshchik','upakovshchik','kladovshchik','gruzchik','vvsh','fasovshchik','operator','sborshchik','brigadir','menedzher']
SIZES=[(320,640),(390,844),(768,1024),(1024,768),(1280,720),(1440,900),(1920,1080)]
BAR="(()=>{const a=document.querySelector('#logo').getBoundingClientRect(),n=document.querySelector('.nq').getBoundingClientRect(),c=document.querySelector('#mn-chip').getBoundingClientRect(),over=(x,y)=>x.width>0&&y.width>0&&x.left<y.right&&y.left<x.right;return {clash:over(a,n)||over(a,c)||over(n,c),right:Math.max(n.right,c.right),W:innerWidth,bottom:Math.max(a.bottom,n.bottom,c.bottom)}})()"
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
        r=p.evaluate(CLIP%"'#hub .hub-t span.w1,#hub .hub-s,#mn-chip'"); check(f'home clip {w}x{h}',not r['out'] and r['sw']<=r['W'],r)
        for k in (0,1,2):
            p.evaluate(f"window.__gt.pick({k})"); p.wait_for_timeout(800)
            r=p.evaluate(CLIP%"'#hub .hub-t span.w1,#hub .hub-s,#hub .hub-go'"); check(f'home clip pick {k} {w}x{h}',not r['out'] and r['sw']<=r['W'] and p.evaluate(WORDS)==0,[r,p.evaluate(WORDS)])
        v=p.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),t=q('#hub .hub-t'),s=q('#hub .hub-s'),g=q('#hub .hub-go');return [Math.round(t.top),Math.round(t.bottom),Math.round(s.top),Math.round(g.bottom),innerHeight]})()")
        check(f'home fits height {w}x{h}',v[0]>=60 and v[1]<=v[2]+1 and v[3]<=v[4],v)
        check(f'home has the menu {w}x{h}',p.is_visible('#mn-chip'))
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
            # мерить надпись, когда ручка встала на станцию, а не пока она едет мимо других
            try: p.wait_for_function(f'window.__gt.air.cur=={i}',timeout=15000); p.wait_for_timeout(600)
            except Exception: pass
            # у «Бренда» сначала идёт начало мира; здесь оно пропущено, его проверки ниже
            if i==3: p.wait_for_function('window.__gt.J.on',timeout=20000); p.evaluate('window.__gt.J.pop=9;window.__gt.J.k=2'); p.wait_for_timeout(1500)
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
    REEL="(()=>{const r=document.querySelector('#rabota');return {v:r.classList.contains('v'),hold:window.__cy.holdNow(),wall:document.querySelector('#w-rows').getBoundingClientRect().bottom,hash:location.hash}})()"
    check('reel under the wall',p.is_visible('#cy-cv') and p.locator('#cy-nav button').count()==10 and p.locator('.cy-pn').count()==10)
    # между стеной и лентой шапка не ложится на полосу поиска; у ленты и наверху стены возвращается
    BH="(st=>{document.querySelector('#rabota').scrollTop=st})"; FH=p.evaluate("document.querySelector('#w-foot').offsetHeight")
    p.evaluate(BH,640-FH+10); p.wait_for_timeout(700); check('header waits while the search band is under it',p.evaluate("document.body.classList.contains('barhide')"))
    p.evaluate(BH,640+40); p.wait_for_timeout(700); check('header back over the reel',not p.evaluate("document.body.classList.contains('barhide')"))
    p.evaluate(BH,0); p.wait_for_timeout(700); check('header back over the wall',not p.evaluate("document.body.classList.contains('barhide')"))
    p.fill('#q','кладов'); p.keyboard.press('Enter'); held(p,0); r=p.evaluate(REEL); check('enter opens the profession in the reel',not r['v'] and r['hold']==0 and r['wall']<=0 and r['hash']=='#rabota',r)
    ORD="[window.__cy.order(),document.querySelector('.cy-pn .cy-eb').textContent,document.querySelector('#cy-nav .cy-nm').dataset.t,document.querySelector('#cy-hn').textContent]"
    o=p.evaluate(ORD); check('chosen profession first, the rest in order',o[0]==['kladovshchik','komplektovshchik','fasovshchik','gruzchik','vvsh','upakovshchik','sborshchik','operator','brigadir','menedzher'] and o[1].startswith('01 · ') and o[2]=='Кладовщик' and o[3]=='01 / 10',o)
    p.mouse.move(700,450); p.mouse.wheel(0,100); p.wait_for_timeout(700); check('one wheel step keeps the chosen profession',p.evaluate('window.__cy.holdNow()')==0 and p.evaluate("+document.querySelector('.cy-pn').style.opacity")>.99)
    check('header ink over the reel',p.evaluate("document.body.classList.contains('ink')"))
    held(p,0); b2=p.locator('.cy-pn:nth-child(1) .cy-cta').bounding_box(); p.mouse.click(b2['x']+b2['width']/2,b2['y']+b2['height']/2); p.wait_for_timeout(500); check('panel reply opens the phone form',p.evaluate("window.__cy.ST[0].page")=='reply' and p.evaluate("document.activeElement.id")=='cy-fi')
    p.evaluate("window.__gt.vacOpen('kladovshchik')"); p.wait_for_timeout(1100); check('vacancy page still opens',p.is_visible('#kladovshchik .v-t') and p.evaluate("location.hash")=='#kladovshchik' and not p.is_visible('#w-wall') and p.evaluate("document.activeElement.classList.contains('v-t')") and p.evaluate("document.querySelector('#kladovshchik .v-bg').naturalWidth")>500)
    p.keyboard.press('Escape'); p.wait_for_timeout(1000); check('escape returns to the wall',p.is_visible('#w-rows') and p.locator('.vac:visible').count()==0 and p.evaluate("location.hash")=='#rabota' and p.evaluate("document.activeElement.id")=='q'); p.fill('#q','')
    p.focus('#w-list li:nth-child(5) button'); p.wait_for_timeout(100); check('keyboard focus lights a row',p.locator('.w-hit').count()==1 and 'ВВШ' in p.inner_text('.w-hit')); p.keyboard.press('Enter'); held(p,0); r=p.evaluate(REEL); check('keyboard opens profession in the reel',not r['v'] and r['hold']==0 and p.evaluate('window.__cy.order()')[:3]==['vvsh','komplektovshchik','kladovshchik'],r)
    p.evaluate("document.querySelector('#rabota').scrollTop=0; window.__gt.vacOpen('vvsh')"); p.wait_for_timeout(1100); check('vacancy page by address',p.is_visible('#vvsh .v-t'))
    p.click('#vvsh .v-next'); p.wait_for_timeout(500); check('next profession',p.is_visible('#fasovshchik .v-t') and p.evaluate("location.hash")=='#fasovshchik' and abs(p.evaluate("document.querySelector('#rabota').scrollTop"))<2)
    p.click('#fasovshchik .v-back'); p.wait_for_timeout(1000); check('back to the wall',p.is_visible('#w-rows') and p.locator('.vac:visible').count()==0)
    p.click('#none-clear') if p.is_visible('#none') else None
    p.fill('#q','комплект'); p.click('.w-hit'); held(p,0); r=p.evaluate(REEL); check('hit click opens the reel',not r['v'] and r['hold']==0 and p.evaluate('window.__cy.order()')[:3]==['komplektovshchik','kladovshchik','fasovshchik'],r)
    p.evaluate("document.querySelector('#rabota').scrollTop=0; window.__gt.vacOpen('komplektovshchik')"); p.wait_for_timeout(1100); K='#komplektovshchik'
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
    c,p=page(390,844,'#rabota'); check('phone has no reel',not p.is_visible('#cy-cv'))
    p.fill('#q','сборщ'); p.click('.w-hit'); p.wait_for_timeout(1100); check('phone wall opens the vacancy page',p.is_visible('#sborshchik .v-t') and p.evaluate("location.hash")=='#sborshchik')
    check('no err phone work',not p.E,p.E); c.close()
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
    # меню справа: плашка раскрывается в панель из пяти пунктов; «Главная» ведёт на главную из любого мира. На телефоне меню стоит на месте фразы-вопроса
    MNB="(()=>{const r=document.querySelector('#mn-panel').getBoundingClientRect();return {l:Math.round(r.left),r:Math.round(r.right),b:Math.round(r.bottom),W:innerWidth,H:innerHeight,sw:document.documentElement.scrollWidth}})()"
    MO="document.querySelector('#mn').dataset.open"
    def world_is(p,wd):
        try: p.wait_for_function(f"document.body.dataset.w=='{wd}'",timeout=15000); return True
        except Exception: return False
    for w,h in [(390,844),(360,740),(667,375),(1440,900),(2000,825)]:
        mob=w<761; c,p=page(w,h,'#klienty')
        check(f'menu chip in the header {w}x{h}',p.is_visible('#mn-chip') and p.is_visible('.nq')!=mob and not p.is_visible('#contact-open'))
        p.click('#mn-chip'); p.wait_for_timeout(900); r=p.evaluate(MNB); items=p.evaluate("[...document.querySelectorAll('#mn .mn-list b')].map(b=>b.textContent)")
        check(f'menu opens with five items {w}x{h}',p.evaluate(MO)=='true' and items==['Главная','Работа','Люди','Клиенты','Напишите нам'],items)
        check(f'menu panel fits {w}x{h}',r['l']>=0 and r['r']<=r['W'] and r['b']<=r['H'] and r['sw']<=r['W'],r)
        check(f'menu marks the current world {w}',p.get_attribute('#mn a[data-go=klienty]','aria-current')=='page')
        p.keyboard.press('Escape'); p.wait_for_timeout(400); check(f'escape closes the menu {w}',p.evaluate(MO)=='false')
        p.click('#mn-chip'); p.wait_for_timeout(700); p.click('#mn a[data-go=home]'); check(f'menu goes home {w}x{h}',world_is(p,'home') and p.evaluate(MO)=='false')
        p.wait_for_timeout(1500); p.click('#mn-chip'); p.wait_for_timeout(700); p.mouse.click(5,h-5); p.wait_for_timeout(400); check(f'click outside closes the menu {w}',p.evaluate(MO)=='false')
        p.click('#mn-chip'); p.wait_for_timeout(700); p.click('#mn a[data-go=rabota]'); check(f'menu goes to work {w}',world_is(p,'rabota'))
        p.wait_for_timeout(800); p.click('#mn-chip'); p.wait_for_timeout(700); p.click('#mn [data-talk]'); p.wait_for_timeout(300); check(f'menu opens the talk {w}',p.is_visible('#talk')); p.click('#talk-x')
        check(f'menu no err {w}x{h}',not p.E,p.E); c.close()
    # эфир с клавиатуры
    c,p=page(1000,640,'#klienty'); p.focus('#tun'); [p.keyboard.press('ArrowRight') for _ in range(22)]; p.wait_for_timeout(2500)
    check('keyboard tunes to station',p.evaluate("document.querySelector('#klienty').classList.contains('tuned')") and p.evaluate('window.__gt.air.cur')==3,p.evaluate('window.__gt.air.cur'))
    p.click('#presets button[data-i="1"]'); p.wait_for_timeout(1600); p.click('#mn-chip'); p.wait_for_timeout(500); p.click('#mn [data-talk]'); check('talk opens from the menu',p.is_visible('#talk')); p.click('#talk-f button[type=submit]'); check('talk error',p.is_visible('#t-contact-e'))
    p.fill('#t-contact','t@example.test'); p.click('#talk-f button[type=submit]'); check('talk done',p.is_visible('#talk-done')); p.click('#talk-x')
    check('no err air',not p.E,p.E); c.close()
    # белый шум не гаснет, когда страница открыта долго
    for hours in (0,1,48):
        c,p=page(1000,640,'#klienty',init="(()=>{const r=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>r(t=>f(t+%d))})()"%(hours*3600000)); p.wait_for_timeout(600)
        p.evaluate("['#air-noise','#air','#bar'].forEach(s=>document.querySelector(s).style.visibility='hidden')"); p.wait_for_timeout(100)
        g=ImageStat.Stat(Image.open(io.BytesIO(p.screenshot())).convert('L')); check(f'noise stays after {hours} h',g.mean[0]>80 and g.stddev[0]>30,(g.mean[0],g.stddev[0])); c.close()
    # «Клиенты». Шкала: Бренд 12, SMM 37, Реклама 63, Сайт 88. Перед «Брендом» ловится плохой сайт, и идёт начало: «Сто одинаковых» и план из четырёх этапов
    JS="window.__gt.J"
    # после примера на надписи одна кнопка: разговор про эту услугу. До конца примера кнопок нет.
    GO="(()=>{const g=document.querySelector('#st-go'),r=g.getBoundingClientRect(),f=document.querySelector('#air-foot').getBoundingClientRect().top;return {on:getComputedStyle(g).display!='none'&&r.height>0,t:g.textContent,b:Math.round(r.bottom),foot:Math.round(f),r:Math.round(r.right),W:innerWidth}})()"
    # надпись после примера проявляется и поднимается (stback, stgo): мерить её, когда она встала
    def until(p,js,ms=9000):
        try: p.wait_for_function(js,timeout=ms); return True
        except Exception: return False
    def go_check(p,name,word,topic):
        until(p,"document.querySelector('#klienty').classList.contains('exd')&&document.getAnimations().filter(a=>['stback','stgo'].includes(a.animationName)).every(a=>a.playState=='finished')"); r=p.evaluate(GO); check(f'{name}: one button after the example',r['on'] and word in r['t'] and r['b']<=r['foot'] and r['r']<=r['W'],r)
        p.click('#st-go'); check(f'{name}: button opens talk',p.is_visible('#talk') and topic in p.input_value('#t-what').lower()); p.click('#talk-x')
    # пропустить начало: сцена сразу в конце, под ней карточка «Бренда»
    def skip_open(p):
        until(p,JS+".on",20000); p.evaluate(JS+".pop=9;"+JS+".k=2"); p.wait_for_timeout(1500)
    SON="document.querySelector('#sonar').classList.contains('on')"
    SONPX="(()=>{const c=document.querySelector('#sonar'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=16)if(d[i]>0)n++;return n})()"
    for w,h in [(390,844),(1024,768),(1440,900)]:
        c,p=page(w,h,'#klienty'); p.click('#presets button[data-i="3"]')
        # плохой сайт ловится, как станция: полосы сквозь шум (junk), потом он закрывает экран (junk2), буквы встают на место, логотипа GT над ним нет
        p.wait_for_function("document.querySelector('#klienty').classList.contains('junk2')&&document.querySelector('#junk').textContent.includes('Заезженный дизайн')&&getComputedStyle(document.querySelector('#logo')).visibility=='hidden'",timeout=20000)
        check(f'open: junk site first {w}',p.is_visible('.j-modal') and not p.is_visible('#st-ask') and not p.evaluate(JS+'.clean'))
        # колесо листает сцену: стена из ста кофеен с подписями, план из четырёх этапов, слова ложатся на подписи шкалы
        until(p,JS+".pop>1.2",10000); p.mouse.move(w/2,h*.45); caps=set(); plan=0
        for _ in range(160):
            caps.add(p.evaluate("(()=>{const c=document.querySelector('#j-cap');return c&&+c.style.opacity>.5?c.textContent:''})()"))
            plan=max(plan,p.evaluate("(()=>{const e=document.querySelector('#j-plan .jl-ph');return e?+e.style.opacity:0})()"))
            if p.evaluate(JS+'.clean'): break
            p.mouse.wheel(0,100); p.wait_for_timeout(120)
        check(f'open: wall captions {w}',{'Сто кофеен. Один шаблон.','Запоминают одну.'}<=caps,caps)
        check(f'open: plan of four stages {w}',plan>.9 and p.evaluate(JS+'.clean'),plan)
        check(f'open: four words landed on the dial {w}',p.locator('#presets button.landed').count()==4)
        p.wait_for_timeout(2500)
        check(f'open: brand card after the scene {w}',p.is_visible('#st-ask') and 'взгляда' in p.text_content('#st-ask') and not p.is_visible('#st-go') and p.evaluate(SON))
        check(f'open: logo back {w}',p.evaluate("getComputedStyle(document.querySelector('#logo')).visibility")=='visible')
        # колесо назад проводит сцену обратно
        for _ in range(6): p.mouse.wheel(0,-100); p.wait_for_timeout(120)
        p.wait_for_timeout(800); check(f'open: wheel back scrubs the scene {w}',p.evaluate(JS+'.k')<1.9 and not p.evaluate(JS+'.clean'),p.evaluate(JS+'.k'))
        check(f'open no err {w}',not p.E,p.E); c.close()
    # без колеса сцена идёт сама и кончается карточкой «Бренда»
    c,p=page(1000,640,'#klienty'); p.click('#presets button[data-i="3"]'); check('open plays by itself',until(p,JS+".clean",90000)); p.wait_for_timeout(2000); check('open by itself: brand card',p.is_visible('#st-ask'))
    # ручка уходит вправо и возвращается: сцена не повторяется
    p.click('#presets button[data-i="2"]'); p.wait_for_timeout(1600); check('junk hidden on other stations',not p.is_visible('#junk'))
    p.click('#presets button[data-i="3"]'); p.wait_for_timeout(1600); check('open stays done on return from the right',p.evaluate(JS+'.clean') and p.is_visible('#st-ask'))
    p.evaluate("(()=>{const t=document.querySelector('#tun');t.value=4;t.dispatchEvent(new Event('input'))})()"); p.wait_for_timeout(1600); check('dial left of brand brings the junk site back',not p.evaluate(JS+'.clean') and p.evaluate("document.querySelector('#klienty').classList.contains('junk')"))
    check('open no err idle',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',rm='reduce'); p.click('#presets button[data-i="3"]'); p.wait_for_timeout(600); check('reduced: open at its end at once',p.evaluate(JS+'.clean') and p.is_visible('#st-ask')); check('no err rm open',not p.E,p.E); c.close()
    # четыре станции: карточка, пример колесом до конца по всем главам, кнопка разговора, назад теми же шагами, щелчок играет первую главу
    CAPH={'#x4-h':"document.querySelector('#x4-h').textContent",'#x3-h':"document.querySelector('#x3-h').textContent",'#x5-h':"document.querySelector('#x5-h').textContent",
          'x2':"(()=>{let best='',bo=.5;document.querySelectorAll('.x2-cap').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!r.height)return;let o=1,n=e;while(n&&n!==document.body){const s=getComputedStyle(n);if(s.visibility==='hidden'||s.display==='none'){o=0;break}o*=+s.opacity;n=n.parentElement}if(o>bo){bo=o;best=e.querySelector('h3').textContent}});return best})()"}
    STN=[(3,'GTBRD','#x4-h',"'#x4-cap small,#x4-cap h3,#x4-cap p'",['Идея','Имя','Знак','Цвет','Буквы','Голос','Правила','Везде','Узнали?','ZERNO','Брендбук'],'взгляда','бренд','бренд',12,'brand'),
         (2,'GTSMM','#x3-h',"'#x3-cap h3,#x3-cap p'",['День 1','План','Неделя','Сторис','Reels','Месяц','Отметки','3 месяца','Отчёт','Образ'],'подписаться','SMM','соцсет',37,'smm'),
         (1,'GTREK','x2',"'.x2-cap small,.x2-cap h3,.x2-cap p'",['Ищет','Находит','Листает','Рядом','Приходит'],'привести','рекламу','реклам',63,'ads'),
         (0,'GTSITE','#x5-h',"'#x5-cap small,#x5-cap h3,#x5-cap p'",['Было','Структура','Дизайн','Заказ','Телефон','Скорость','Заявки'],'видел','сайт','сайт',88,'site')]
    # картинка поста «Рекламы»: слова стоят поверх лент на своих местах, «20» правым краем под ZERNO, холст слова во всю рамку (иначе при dpr 2 он вдвое больше)
    WORD=("(()=>{const m=document.querySelector('#x2-md').getBoundingClientRect(),a=document.querySelector('#x2-p1'),b=document.querySelector('#x2-p2'),"
          "ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(),cv=a.querySelector('canvas').getBoundingClientRect();"
          "return{pos:getComputedStyle(a).position,inside:ra.left>=m.left-1&&ra.right<=m.right+1&&ra.top>=m.top-1&&ra.bottom<=m.bottom+1,"
          "right:Math.abs(ra.right-rb.right)/m.width,below:rb.top>ra.bottom-1,cv:Math.abs(cv.width-ra.width)<1.5&&Math.abs(cv.height-ra.height)<1.5}})()")
    for i,mod,hs,capsel,chapters,ask,word,topic,v,nm in STN:
        MS=f"window.{mod}.state"
        for w,h in [(390,844),(1024,768),(1440,900),(1920,1080)]:
            c,p=page(w,h,'#klienty'); p.click(f'#presets button[data-i="{i}"]'); until(p,f"window.__gt.air.cur=={i}",15000)
            if i==3: skip_open(p)
            p.wait_for_timeout(1800)
            check(f'{nm} card: question and hint, no buttons {w}',p.is_visible('#st-ask') and ask in p.text_content('#st-ask') and p.is_visible('#st-hint') and not p.is_visible('#st-go'),p.text_content('#st-ask'))
            check(f'{nm} card: sonar draws {w}',p.evaluate(SON) and p.evaluate(SONPX)>200,p.evaluate(SONPX))
            # колесо вперёд: все главы по порядку; на каждой новой главе подпись не выходит за экран
            p.mouse.move(w/2,h*.45); seen=[]; clip=[]
            for _ in range(140):
                if p.evaluate(MS)['u']>=1: break
                p.mouse.wheel(0,100); p.wait_for_timeout(70); t=p.evaluate(CAPH[hs])
                if t and (not seen or seen[-1]!=t):
                    seen.append(t); p.wait_for_timeout(600); r=p.evaluate(CLIP%capsel)
                    if r['out'] or r['sw']>r['W']: clip.append((t,r))
                    if nm=='ads' and t=='Листает':
                        wd=p.evaluate(WORD); check(f'ads post: ZERNO 20 over the ribbons, 20 right under the word, inside the picture {w}',wd['pos']=='absolute' and wd['inside'] and wd['right']<.03 and wd['below'] and wd['cv'],wd)
            check(f'{nm} wheel walks all chapters in order {w}',[x for x in seen if x in chapters]==chapters,seen)
            check(f'{nm} chapters fit the screen {w}x{h}',not clip,clip)
            check(f'{nm} no station text while the example runs {w}',p.evaluate(MS)['on'])
            until(p,"document.querySelector('#klienty').classList.contains('exd')")
            check(f'{nm} end card {w}',p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-name') and p.evaluate(SON))
            go_check(p,f'{nm} {w}',word,topic); p.mouse.move(w/2,h*.45); p.wait_for_timeout(500)
            back=[]
            for _ in range(140):
                if p.evaluate(MS)['u']<=0: break
                p.mouse.wheel(0,-100); p.wait_for_timeout(50); t=p.evaluate(CAPH[hs])
                if t and (not back or back[-1]!=t): back.append(t)
            p.wait_for_timeout(1500); s=p.evaluate(MS)
            check(f'{nm} back the same steps {w}',set(chapters)<=set(back) and s['u']==0 and s['ph']==0 and p.is_visible('#st-ask') and abs(float(p.evaluate('__gt.air.v'))-v)<1.5,(back,s))
            p.mouse.click(w*.5,h*.4); p.wait_for_timeout(2500); s=p.evaluate(MS); check(f'{nm} click plays the first chapter {w}',s['on'] and s['u']>0,s)
            check(f'{nm} no err {w}',not p.E,p.E); c.close()
        # 6 секунд покоя на карточке: пример начинается сам; на другой станции он выключен
        c,p=page(1000,640,'#klienty'); p.click(f'#presets button[data-i="{i}"]'); until(p,f"window.__gt.air.cur=={i}",15000)
        if i==3: skip_open(p)
        p.wait_for_timeout(10000); s=p.evaluate(MS); check(f'{nm} starts by itself',s['on'] and s['u']>0,s)
        p.click(f'#presets button[data-i="{(i+1)%4}"]'); p.wait_for_timeout(1600); check(f'{nm} off on another station',not p.evaluate(MS)['on']); check(f'{nm} no err idle',not p.E,p.E); c.close()
        # без анимации колесо доводит пример до последней главы
        c,p=page(1000,640,'#klienty',rm='reduce'); p.click(f'#presets button[data-i="{i}"]'); p.wait_for_timeout(500); p.mouse.move(500,300)
        for _ in range(140):
            if p.evaluate(MS)['u']>=1: break
            p.mouse.wheel(0,100); p.wait_for_timeout(20)
        p.wait_for_timeout(400); check(f'reduced: {nm} by wheel to the end',p.evaluate(MS)['u']>=1,p.evaluate(MS)); check(f'no err rm {nm}',not p.E,p.E); c.close()
    # «Сайт», глава «Заказ»: меню живое — напиток меняет цену, «Заказать» проигрывает заказ
    for w,h in [(390,844),(1440,900)]:
        c,p=page(w,h,'#klienty'); p.click('#presets button[data-i="0"]'); p.wait_for_timeout(1800); p.mouse.move(w/2,h*.45)
        for _ in range(15): p.mouse.wheel(0,100); p.wait_for_timeout(60)
        p.wait_for_timeout(1500); check(f'site order chapter {w}',p.text_content('#x5-h')=='Заказ' and 'Капучино' in p.text_content('#x5-price span'),p.text_content('#x5-price span'))
        p.click('#x5-wall button:nth-child(4)'); p.wait_for_timeout(900); check(f'site menu pick changes the drink {w}','Латте' in p.text_content('#x5-price span'),p.text_content('#x5-price span'))
        if p.is_visible('#x5-take'): p.click('#x5-take')
        else: p.click('#x5-wall button:nth-child(4)'); p.wait_for_timeout(700); p.click('#x5-take')
        check(f'site order plays {w}',until(p,"document.querySelector('#x5-price em').textContent.includes('Оплачено')",8000),p.text_content('#x5-price em'))
        check(f'site order no err {w}',not p.E,p.E); c.close()
    # финал «Каждый день» (final.js): после конца «Сайта» колесо ведёт дальше в финал, ручка стоит на «Сайте»; подписи по порядку;
    # в конце «Coffee time» и кнопка разговора; напиток в кольце нажимается; колесо назад возвращает в «Сайт»
    FS="window.GTFIN.state"
    FCAP="(()=>{let best='',bo=.5;document.querySelectorAll('.x6-cap').forEach(e=>{const s=getComputedStyle(e),o=+s.opacity;if(s.visibility!='hidden'&&o>bo){bo=o;best=e.querySelector('h3').textContent}});return best})()"
    FCH=['До — ровная линия. После — пульс.','Утром, когда не выспались.','В дождь.','В минус двадцать.','Когда всё получается.','Вечером после работы.','В три часа ночи.','Кофе за 20 минут или быстрее.','Нажмите на напиток.']
    for w,h in [(390,844),(1440,900)]:
        c,p=page(w,h,'#klienty'); p.click('#presets button[data-i="0"]'); until(p,"window.__gt.air.cur==0",15000); p.wait_for_timeout(1500); p.mouse.move(w/2,h*.45)
        for _ in range(140):
            if p.evaluate("GTSITE.state.u")>=1: break
            p.mouse.wheel(0,100); p.wait_for_timeout(50)
        p.wait_for_timeout(1800); v0=float(p.evaluate('__gt.air.v'))
        check(f'final: site end card keeps the hint {w}',p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-hint') and not p.evaluate(FS)['vis'])
        seen=[]
        for _ in range(90):
            if p.evaluate(FS)['u']>=1: break
            p.mouse.wheel(0,100); p.wait_for_timeout(110); t=p.evaluate(FCAP)
            if t and (not seen or seen[-1]!=t): seen.append(t)
        check(f'final: wheel walks all captions in order {w}',[x for x in seen if x in FCH]==FCH,seen)
        check(f'final: knob stays on the site {w}',abs(float(p.evaluate('__gt.air.v'))-v0)<.5 and p.evaluate('__gt.air.cur')==0)
        p.wait_for_timeout(1500)
        check(f'final: coffee time, button, dark header {w}',p.is_visible('#x6-go') and p.evaluate("document.body.classList.contains('ink')"))
        p.click('#x6-go'); check(f'final: button opens talk {w}',p.is_visible('#talk') and 'сайт' in p.input_value('#t-what').lower(),p.input_value('#t-what')); p.click('#talk-x')
        p.evaluate('GTFIN.jump(79)'); p.wait_for_timeout(1200); p.click('.x6-d[data-i="2"]'); p.wait_for_timeout(500)
        check(f'final: drink pick changes the caption {w}',p.evaluate(FCAP)=='Флэт уайт.' and p.evaluate(FS)['sel']==2,p.evaluate(FCAP))
        p.mouse.move(w/2,h*.45)
        for _ in range(160):
            if not p.evaluate(FS)['on']: break
            p.mouse.wheel(0,-100); p.wait_for_timeout(50)
        p.wait_for_timeout(1500)
        check(f'final: wheel back returns to the site card {w}',not p.evaluate(FS)['vis'] and p.evaluate("document.querySelector('#klienty').classList.contains('exd')") and p.is_visible('#st-name'))
        for _ in range(3): p.mouse.wheel(0,-100); p.wait_for_timeout(80)
        p.wait_for_timeout(800); check(f'final: then the site example goes back {w}',p.evaluate("GTSITE.state")['u']<1,p.evaluate("GTSITE.state"))
        check(f'final no err {w}',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',rm='reduce'); p.click('#presets button[data-i="0"]'); until(p,"window.__gt.air.cur==0",15000); p.wait_for_timeout(500)
    p.evaluate('GTFIN.jump(100)'); p.wait_for_timeout(1500); check('reduced: final end at once',p.is_visible('#x6-go')); check('no err rm final',not p.E,p.E); c.close()
    # сетка есть на всех четырёх надписях станций; порядок шкалы
    c,p=page(1000,640,'#klienty'); DO="[...document.querySelectorAll('#presets button')].map(b=>b.textContent+b.style.left).join()"; check('dial order: brand, smm, ads, site',p.evaluate(DO)=='Бренд12%,SMM37%,Реклама63%,Сайт88%',p.evaluate(DO))
    # у «Бренда» сетка встаёт за волной от ручки: через 1,5 с после пропуска начала она иногда ещё не встала (так было и до финала), поэтому ждём до 5 с
    p.click('#presets button[data-i="3"]'); skip_open(p); on=[until(p,SON,5000)]
    for i in (2,1,0): p.click(f'#presets button[data-i="{i}"]'); p.wait_for_timeout(1800); on.append(p.evaluate(SON))
    check('sonar on all four cards',all(on),on); check('sonar no err',not p.E,p.E); c.close()
    c,p=page(1000,640,'#klienty',rm='reduce'); p.click('#presets button[data-i="2"]'); p.wait_for_timeout(400); check('reduced: sonar is a still grid',p.evaluate(SON) and p.evaluate(SONPX)>200,p.evaluate(SONPX)); c.close()
    SM=U; SS="window.GTSMM.state"
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
    check('keys start by themselves',r['k']==1 and s2['u']>0,[r,s2]); check('keys no err idle',not p.E,p.E); c.close()
    # телефон: поля нет и three.js не грузится, станция идёт прежним путём
    c,p=gpage(390,844); p.wait_for_timeout(2000); check('keys off on phone',p.evaluate("!document.querySelector('#kx')")); c.close()
    bg.close()
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
