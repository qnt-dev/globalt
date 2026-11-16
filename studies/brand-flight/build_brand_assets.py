"""Read the supplied brandbook; export its graphics and five original spreads."""
from pathlib import Path
import pymupdf as fitz
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
source = next((ROOT.parents[2] / 'assets/brand').rglob('*бренд бук.pdf'))
doc = fitz.open(source)
page = doc[6]
drawings = [d for d in page.get_drawings() if d.get('fill') and max(d['fill']) < .15]

def path_data(drawing):
    out, last = [], None
    for item in drawing['items']:
        kind = item[0]
        if kind in ('l', 'c'):
            start = item[1]
            if last != start:
                if last is not None:
                    out.append('Z')
                out.append(f'M{start.x:g},{start.y:g}')
            if kind == 'l':
                end = item[2]
                out.append(f'L{end.x:g},{end.y:g}')
            else:
                p, q, end = item[2:5]
                out.append(f'C{p.x:g},{p.y:g} {q.x:g},{q.y:g} {end.x:g},{end.y:g}')
            last = end
        elif kind == 're':
            r = item[1]
            out.append(f'M{r.x0:g},{r.y0:g}H{r.x1:g}V{r.y1:g}H{r.x0:g}Z')
            last = None
        elif kind == 'qu':
            q = item[1]
            out.append(f'M{q.ul.x:g},{q.ul.y:g}L{q.ur.x:g},{q.ur.y:g} {q.lr.x:g},{q.lr.y:g} {q.ll.x:g},{q.ll.y:g}Z')
            last = None
    if last is not None:
        out.append('Z')
    return ''.join(out)

centres = [184,345,518,662,795,925,1106]
for row, yrange in enumerate([(240,365),(380,470)]):
    for col, cx in enumerate(centres):
        region = fitz.Rect(cx-78,yrange[0],cx+78,yrange[1])
        chosen = [d for d in drawings if region.contains(d['rect'])]
        bounds = fitz.Rect()
        for d in chosen:
            bounds |= d['rect']
        if not chosen:
            raise RuntimeError(f'No vector symbol at {row},{col}')
        bounds += (-5,-5,5,5)
        paths = ''.join(f'<path d="{path_data(d)}"/>' for d in chosen)
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{bounds.x0:g} {bounds.y0:g} {bounds.width:g} {bounds.height:g}" fill="#ffffff">{paths}</svg>'
        (OUT/f'symbol-{row*7+col+1:02}.svg').write_text(svg,encoding='utf-8')

for number,name in [(7,'sign'),(8,'space'),(9,'phone'),(10,'identity'),(11,'merch')]:
    p = doc[number]
    pix = p.get_pixmap(matrix=fitz.Matrix(1400/p.rect.width,1400/p.rect.width),alpha=False)
    pix.pil_save(OUT/f'brandbook-{name}.webp',format='WEBP',quality=86)

font_path = ROOT.parents[2] / 'designs/trial-01/browser/assets/montserrat-variable.ttf'
font = TTFont(font_path)
font.flavor='woff2'
font.save(OUT/'montserrat.woff2')
print('Exported 14 vector symbols, 5 original brandbook spreads and Montserrat.')
