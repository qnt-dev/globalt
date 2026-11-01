import os,sys
from playwright.sync_api import sync_playwright
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
OUT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))).replace('\\','/')+'/review/shots/'
os.makedirs(OUT,exist_ok=True)
ARGS=['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-webgl']
W,H=int(sys.argv[1]),int(sys.argv[2])
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome',args=ARGS,headless=False); c=b.new_context(viewport={'width':W,'height':H},device_scale_factor=1.5 if W<700 else 1); p=c.new_page(); E=[]
    p.on('console',lambda m:E.append(m.text[:300]) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None); p.on('pageerror',lambda e:E.append(str(e)[:500]))
    fs=[]
    def snap(n,wait=700):
        p.wait_for_timeout(wait); f=f'{OUT}{n}_{W}.png'; p.screenshot(path=f,timeout=60000); fs.append(f)
    p.goto('http://127.0.0.1:4391/index.html#rabota',wait_until='load'); p.wait_for_timeout(800)
    snap('w0',300)
    p.fill('#q','ричтрак'); snap('w1',400); p.fill('#q',''); p.click('.chip[data-f=noexp]'); snap('w2',400); p.click('.chip[data-f=noexp]')
    for i in ('komplektovshchik','upakovshchik','kladovshchik','gruzchik','vvsh','fasovshchik','operator','sborshchik','brigadir','menedzher'):
        p.evaluate(f"window.__gt.vacOpen('{i}',true)"); snap('v_'+i,1500)
    for i,pick in (('komplektovshchik',None),('vvsh',None),('brigadir',None)):
        p.evaluate(f"window.__gt.vacOpen('{i}',true)"); p.wait_for_timeout(200); p.evaluate(f"document.querySelector('#{i} .v-board').scrollIntoView()"); snap('b_'+i,500)
    p.evaluate("window.__gt.vacOpen('komplektovshchik',true);window.__gt.objSet(document.querySelector('#komplektovshchik'),2,false);document.querySelector('#komplektovshchik .v-obj').scrollIntoView()"); snap('o_komp',700)
    p.evaluate("window.__gt.vacOpen('menedzher',true);document.querySelector('#menedzher .v-obj').scrollIntoView()"); snap('o_men',700)
    p.evaluate("(()=>{const r=document.querySelector('#rabota');r.scrollTop=r.scrollHeight})()"); snap('reply',300)
    p.evaluate("window.__gt.vacClose(true);window.__gt.show('lyudi')"); p.wait_for_timeout(500)
    n=p.evaluate("document.querySelectorAll('.ly-f').length")
    for i in range(n):
        p.evaluate(f"document.querySelector('#lyudi').scrollTop=document.querySelectorAll('.ly-f')[{i}].offsetTop"); snap(f'l{i}',600)
    print(E); b.close()
ims=[Image.open(f).convert('RGB') for f in fs]
tw=640 if W>H else 250; th=int(tw*H/W); cols=3 if W>H else 6; rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(cols*(tw+6),rows*(th+6)),(30,30,30))
for i,m in enumerate(ims): s.paste(m.resize((tw,th),Image.LANCZOS),((i%cols)*(tw+6),(i//cols)*(th+6)))
s.save(OUT+f'sheet_{W}.png'); print(OUT+f'sheet_{W}.png')
