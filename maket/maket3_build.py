"""Собирает maket3.html: все ресурсы встроены, поэтому макет открывается и без сервера."""
import base64, os
HERE = os.path.dirname(os.path.abspath(__file__)); AS = os.path.join(os.path.dirname(HERE), 'assets')
def uri(mime, p): return f'data:{mime};base64,' + base64.b64encode(open(p, 'rb').read()).decode()
t = open(os.path.join(HERE, 'maket3_src.html'), encoding='utf8').read()
for k, m, p in (('FONT', 'font/woff2', os.path.join(AS, 'science-gothic-2axis.woff2')), ('LOGO', 'image/svg+xml', os.path.join(AS, 'logo-white.svg')), ('MARK', 'image/svg+xml', os.path.join(AS, 'mark-white.svg')),
                ('PHOTO', 'image/webp', os.path.join(HERE, 'img', 'sayt_photo.webp')), ('MASK', 'image/webp', os.path.join(HERE, 'img', 'sayt_mask.webp'))):
    t = t.replace('{{' + k + '}}', uri(m, p))
open(os.path.join(HERE, 'maket3.html'), 'w', encoding='utf8').write(t)
print('maket3', os.path.getsize(os.path.join(HERE, 'maket3.html')) // 1024, 'KB')
