# Чёткие куски карт NASA для первых экранов разделов. Земля в разделах крупная: 1° на экране — около 40 точек,
# а в общих картах сайта 10–11 точек на градус. Поэтому для видимой части каждого раздела вырезаем кусок из больших карт:
#   день — Blue Marble NG, июль 2004, world.topo.bathy.200407.3x21600x10800.jpg (60 точек на градус), та же съёмка, что day.webp сайта;
#   ночь — Black Marble 2016, BlackMarble_2016_3km_gray.jpg (37,5 точки на градус), та же съёмка, что night.webp.
# Окно куска: видимая часть на 1440, 2000, 390 и 1280×1000 плюс запас на вращение Земли на восток. Ширина не больше 4096: столько берут телефоны.
# Пишет img/detail-<раздел>-day.webp и -night.webp и окна в tools/detail.json (их читает tools/pages.py).
import os, json
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__)); SYS = os.path.join(HERE, '..')
DAY = os.path.join(SYS, 'nasa', 'day', 'world.topo.bathy.200407.3x21600x10800.jpg')
NIGHT = os.path.join(SYS, 'nasa', 'night', 'BlackMarble_2016_3km_gray.jpg')
# раздел: долготы и широты окна (запад, восток, юг, север) и какие карты нужны
WIN = {
    'rabota': ((20, 140, 22, 81), ('night',)),        # ночь над Казахстаном и Уралом: только огни
    'lyudi': ((-15, 115, 28, 82), ('day', 'night')),  # рассвет над Европой: справа день, слева огни
    'klienty': ((53, 158, -5, 50), ('day',)),         # день над Азией
}
def crop(path, w, mode):
    im = Image.open(path); W, H = im.size; lo0, lo1, la0, la1 = w
    box = (round((lo0 + 180) / 360 * W), round((90 - la1) / 180 * H), round((lo1 + 180) / 360 * W), round((90 - la0) / 180 * H))
    c = im.crop(box).convert(mode); k = min(1, 4096 / c.width)
    return c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS) if k < 1 else c
out = {}
for name, (w, kinds) in WIN.items():
    out[name] = {'win': list(w)}
    for kind in kinds:
        im = crop(DAY if kind == 'day' else NIGHT, w, 'RGB' if kind == 'day' else 'L')
        f = f'img/detail-{name}-{kind}.webp'; im.save(os.path.join(SYS, f), quality=80 if kind == 'day' else 85, method=6)
        out[name][kind] = f; print(name, kind, im.size, round(im.width / (w[1] - w[0]), 1), 'точек на градус', os.path.getsize(os.path.join(SYS, f)) // 1024, 'KB')
json.dump(out, open(os.path.join(HERE, 'detail.json'), 'w'), indent=1)
