# GLOBAL TRIUMPH

Концепт сайта для соискателей, работодателей и заказчиков маркетинга. С 2026-11-12 сайт собран на одной системе: главная с Землёй и три раздела.

Четыре адреса показывают один документ: `index.html` (главная), `rabota.html`, `lyudi.html`, `klienty.html`. Между ними Земля не перезагружается: переход — полёт камеры по той же Земле. `kejs-zerno.html` — кейс кофейни ZERNO.

## Открыть

```bash
python -m http.server 4391 --bind 127.0.0.1
```

Затем откройте http://127.0.0.1:4391/. Нужен сервер: без него браузер не даёт WebGL брать карты Земли с диска.

## Собрать и проверить

Нужны Python и Chrome, пакеты: `pip install fonttools brotli playwright pillow`.

Порядок сборки:

1. `python src/build.py` собирает `zerno.html`. Это прежний сайт целиком. Его мир «Клиенты» (станции Бренд, SMM, Реклама, Сайт и финал) показывает страница кейса.
2. `python sistema/tools/extract.py` переносит главную из `src/` в систему: `sistema/base.css`, `sistema/home.css`, `sistema/home.js`, `sistema/parts.json`.
3. `python sistema/tools/pages.py` собирает страницы в корень.

Проверки (нужен сервер на порту 4391):

- `python sistema/tools/root.py`: все страницы без битых файлов и ошибок, шрифт и Земля на месте, кейс показывает мир «Клиенты».
- `python sistema/tools/spa.py`: один документ, полёты между разделами, «Назад».
- `python sistema/tools/kl.py`, `svc_shots.py`, `vac2.py`: стена «Людей», поле «сто одинаковых» в «Услугах», раскрытая вакансия.
- `python sistema/tools/smooth.py`, `fly4.py`: плавность полёта по кадрам.
- `python src/test.py`: прежний сайт в `zerno.html`.

## Что где лежит

- `index.html`, `rabota.html`, `lyudi.html`, `klienty.html`, `kejs-zerno.html`: страницы. Их собирает `sistema/tools/pages.py`, руками не править.
- `sistema/sys.css`, `sistema/sys.js`: общая система (шапка, главы, шаги, формы, три двери). `sistema/rabota.js`: вакансии с табло объектов. `sistema/svc.js`: поле «сто одинаковых» в «Услугах». `sistema/earth-view.js`: Земля для главной и разделов.
- `sistema/tools/world-tail.js`: четыре вида в одном документе и полёт камеры. `extract.py` дописывает его в конец `sistema/home.js`.
- `sistema/img/`: заставки Земли, чёткие куски карт NASA для разделов (`detail-*`, их режет `tools/detail.py` из оригиналов в `sistema/nasa/`, оригиналы в git не идут), кадры кейса.
- `src/`: код прежнего сайта. Из него берутся главная и мир «Клиенты» для кейса.
- `assets/`: логотип, знак, шрифты (Science Gothic, Tektur с лицензией OFL), фото (`photo`), карты Земли (`earth`), картинки кофейни (`zerno`, `kofe`).
- `PHOTOS.txt`: источники всех фото, карт и шрифта Tektur.
- `NOTES.txt`: история правок и ограничения. Все объекты, суммы и условия выдуманы, формы ничего не отправляют.

Лента профессий с телефоном из символов (`src/reel.*`) на новых страницах не используется. Её копия как образец лежит вне репозитория: `C:\MIDGAME\gt-rabota-phone-reel`.
