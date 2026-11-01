import os,sys
from playwright.sync_api import sync_playwright
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
H=os.path.dirname(os.path.abspath(__file__)).replace('\\','/')+'/'
ARGS=['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--allow-file-access-from-files']
IDS=['st','st2','st3','h2','tb','ob','h3']
HS=['h2','h4','h5','h6','h1','h7','h8','h9','h10','h3']
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome',args=ARGS,headless=False)
    for name,w,h,sc in (('v_pc',1440,900,1),('v_tel',390,844,2)):
        c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=sc,locale='ru-RU'); p=c.new_page(); E=[]
        p.on('pageerror',lambda e:E.append(str(e)[:300]))
        p.goto('file:///'+H+'maket2.html',wait_until='load'); p.evaluate('document.fonts.ready'); p.wait_for_timeout(1200)
        over=p.evaluate("[...document.querySelectorAll('.f')].flatMap(s=>{const W=innerWidth,Hh=innerHeight,b=s.getBoundingClientRect();return [...s.querySelectorAll('h1,h2,.btn,.foot p,.m,.o,.an,.hit .sg,.hit small,.s1>a,.s2,.pay')].filter(e=>{const r=document.createRange();r.selectNodeContents(e);const q=r.getBoundingClientRect();return q.width>0&&(q.right>W+1||q.left<-1||q.bottom-b.top>Hh+1)}).map(e=>s.id+':'+e.className+':'+e.textContent.trim().slice(0,18))})")
        print(name,'overflow',over,E)
        for i in IDS+HS: p.locator('#'+i).screenshot(path=f'{H}{name}_{i}.png')
        c.close()
    b.close()
def sheet(name,tw,th,c,out,IDS=IDS):
    r=(len(IDS)+c-1)//c; s=Image.new('RGB',(c*(tw+10)-10,r*(th+10)-10),(40,40,40))
    for k,i in enumerate(IDS): s.paste(Image.open(f'{H}{name}_{i}.png').convert('RGB').resize((tw,th),Image.LANCZOS),((k%c)*(tw+10),(k//c)*(th+10)))
    s.save(H+out)
sheet('v_pc',800,500,2,'vakansii_pc.png'); sheet('v_tel',300,650,4,'vakansii_tel.png'); sheet('v_pc',640,400,2,'professii_pc.png',HS); sheet('v_tel',240,520,5,'professii_tel.png',HS)
print('ok')
