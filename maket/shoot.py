import os,sys
from playwright.sync_api import sync_playwright
from PIL import Image
H=os.path.dirname(os.path.abspath(__file__)).replace('\\','/')+'/'
ARGS=['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--allow-file-access-from-files']
IDS=['stena','stena2','vak','usl','p1','p2','p3','p4','p5']
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome',args=ARGS,headless=False)
    for name,w,h,sc in (('pc',1440,900,1),('tel',390,844,2)):
        c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=sc,locale='ru-RU'); p=c.new_page(); E=[]
        p.on('pageerror',lambda e:E.append(str(e)[:300]))
        p.goto('file:///'+H+'maket.html',wait_until='load'); p.evaluate('document.fonts.ready'); p.wait_for_timeout(1200)
        over=p.evaluate("[...document.querySelectorAll('.f')].flatMap(s=>{const W=innerWidth;return [...s.querySelectorAll('h1,h2,.sub,.btn,.foot p,.form,.q,.q2')].filter(e=>{const r=e.getBoundingClientRect();return r.right>W+1||r.left<-1}).map(e=>s.id+':'+e.tagName+':'+e.textContent.trim().slice(0,20)+':'+Math.round(e.getBoundingClientRect().right))})")
        print(name,'overflow',over,E)
        for i in IDS: p.locator('#'+i).screenshot(path=f'{H}{name}_{i}.png')
        c.close()
    b.close()
def sheet(name,ids,tw,th,c,out):
    r=(len(ids)+c-1)//c; s=Image.new('RGB',(c*(tw+10)-10,r*(th+10)-10),(40,40,40))
    for k,i in enumerate(ids): s.paste(Image.open(f'{H}{name}_{i}.png').convert('RGB').resize((tw,th),Image.LANCZOS),((k%c)*(tw+10),(k//c)*(th+10)))
    s.save(H+out)
sheet('pc',IDS,800,500,2,'list_pc.png'); sheet('tel',IDS,300,650,5,'list_tel.png')
print('ok')
