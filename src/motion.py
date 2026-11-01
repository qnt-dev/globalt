import os,sys
from playwright.sync_api import sync_playwright
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
OUT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))).replace('\\','/')+'/review/shots/'
ARGS=['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-webgl']
FPS="""()=>new Promise(r=>{let n=0,t0=performance.now(),l=t0,worst=0;const f=t=>{worst=Math.max(worst,t-l);l=t;n++;if(t-t0>1800)r({fps:+(n*1000/(t-t0)).toFixed(1),worst:Math.round(worst)});else requestAnimationFrame(f)};requestAnimationFrame(f)})"""
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome',args=ARGS,headless=False); c=b.new_context(viewport={'width':1440,'height':900}); p=c.new_page(); E=[]
    p.on('console',lambda m:E.append(m.text[:300]) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None); p.on('pageerror',lambda e:E.append(str(e)[:500]))
    fs=[]
    def snap(n): f=f'{OUT}m_{n}.png'; p.screenshot(path=f,timeout=60000); fs.append(f)
    p.goto('http://127.0.0.1:4391/index.html#rabota',wait_until='load'); p.wait_for_timeout(800)
    print('wall',p.evaluate(FPS))
    a=p.evaluate("document.querySelector('.w-track').getBoundingClientRect().left"); p.wait_for_timeout(900); print('rows move',a!=p.evaluate("document.querySelector('.w-track').getBoundingClientRect().left"))
    y=p.evaluate("(()=>{const r=document.querySelector('.w-row:nth-child(3)').getBoundingClientRect();return r.top+r.height/2})()"); p.mouse.move(500,y); p.wait_for_timeout(500); snap('hover')
    print('paused',p.evaluate("getComputedStyle(document.querySelector('.w-track')).animationPlayState"),'under cursor',p.evaluate(f"(document.elementFromPoint(500,{y}).textContent||'').slice(0,30)"))
    p.mouse.click(500,y)
    p.wait_for_timeout(280); snap('open1'); p.wait_for_timeout(240); snap('open2'); p.wait_for_timeout(900); snap('open3'); print('hash',p.evaluate('location.hash'))
    print('hero',p.evaluate(FPS))
    p.mouse.move(720,450); p.mouse.wheel(0,500); p.wait_for_timeout(120); snap('scroll'); p.wait_for_timeout(1000)
    p.keyboard.press('Escape'); p.wait_for_timeout(300); snap('back'); p.wait_for_timeout(800)
    p.evaluate("window.__gt.show('lyudi')"); p.wait_for_timeout(500)
    h=900
    for k,y in enumerate((.5,1.5,2.45,3.3,3.55)):
        p.evaluate(f"(()=>{{const r=document.querySelector('#lyudi');r.style.scrollSnapType='none';r.scrollTop={y}*innerHeight}})()"); p.wait_for_timeout(600); snap(f'lp{k}')
    print('people',p.evaluate(FPS)); print(E); b.close()
ims=[Image.open(f).convert('RGB') for f in fs]; tw,th=540,338; cols=3; rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(cols*(tw+6),rows*(th+6)),(30,30,30))
for i,m in enumerate(ims): s.paste(m.resize((tw,th),Image.LANCZOS),((i%cols)*(tw+6),(i//cols)*(th+6)))
s.save(OUT+'motion.png'); print(OUT+'motion.png')
