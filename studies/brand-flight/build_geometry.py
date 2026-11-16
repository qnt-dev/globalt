"""Export project-owned Science Gothic outlines for the 3D study."""
from pathlib import Path
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent
font = TTFont(ROOT.parent.parent / 'assets/science-gothic-2axis.woff2')
font = instantiateVariableFont(font, {'wght': 800, 'wdth': 75}, inplace=True)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm
cap = font['OS/2'].sCapHeight
words = ['БРЕНД', 'ТОЧКА ПРИТЯЖЕНИЯ.', 'СЛОВА ИМЕЮТ ВЕС.',
         'ВСЁ СВЯЗАНО.', 'ОДНО ЦЕЛОЕ.', 'ОДНО', 'ЦЕЛОЕ.', 'Аа', 'А']
result = {'upm': upm, 'cap': cap, 'words': {}}
for text in words:
    paths, cursor = [], 0
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, cursor, cap)))
        path = pen.getCommands()
        if path:
            paths.append(f'<path d="{path}"/>')
        cursor += font['hmtx'][name][0] - upm * .035
    result['words'][text] = {'svg': '<svg xmlns="http://www.w3.org/2000/svg">' + ''.join(paths) + '</svg>', 'width': cursor}
(ROOT / 'text-outlines.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
print(f'Exported {len(words)} words from the local font, UPM={upm}, cap={cap}.')
