/* Станция SMM мира «Клиенты»: поле клавиш со знаками соцсетей перед примером SMM (smm.js). Модель и числа взяты из настроек компонента на странице образца
   (framer, компонент на three.js в модуле сайта); код написан заново, чужой код не вставлен.
   — клавиша: скруглённый квадрат 1,2 с радиусом 0,18, высота 0,65, фаска 0,03 (в образце 24 шага, здесь 6: на экране разницы нет, а вершин вчетверо меньше); шаг 1,3; материал MeshPhysicalMaterial, чёрная,
     шероховатость 0,85 (в настройках образца стоит 0, но компонент подставляет вместо нуля 0,85), светящаяся — 0,1;
   — камера: изометрия из точки (10, 12, 10), по высоте экрана видно 7 единиц (в образце 6: клавиш видно чуть больше); свет: рассеянный 1 и направленный 4 из (10, 15, 5) с тенями,
     тональная кривая ACES, экспозиция 1,05;
   — под курсором волна радиусом 3,5: состояние клавиши тянется к (1 − d/3,5)^1,5 со скоростью 12, клавиша поднимается на 0,3 × состояние;
     точка волны догоняет курсор с коэффициентом 12;
   — светящаяся клавиша окрашена «жидкой сеткой» из четырёх цветов (малиновый, сине-фиолетовый, оранжево-красный, бирюзовый):
     цвет считается синусами от точки внутри клавиши и времени (скорость 0,7), поэтому рисунок одинаков на всех клавишах и плывёт;
     клавиша становится глянцевой и светится этим цветом с силой 5;
   — пол цвета rgb(255,122,122) с сеткой линий; возле волны пол светится тем же градиентом с силой 4;
   — знаки: размер 0,4, прозрачность 0,4, на тёмной клавише белые, на светящейся тёмные.
   Наше: знаки соцсетей, место покоя волны без мыши и переход в «День 1» одним движением:
   — 6 щелчков: 9 клавиш под волной (3×3) поднимаются одним блоком, остальное поле уходит вниз и гаснет, пол и сетка исчезают,
     фон становится тёмным фоном примера; блок разворачивается лицом к зрителю и садится ровно в 9 клеток профиля.
     Градиент плиток идёт одной картиной через все 9, как серия постов в примере;
   — следующие щелчки: из середины каждой плитки цвет уходит к краям, остаётся цветная рамка; она тонеет до 1 px, скруглённые углы
     выпрямляются в квадрат клетки, рамка рвётся на штрихи 4/4 px, как пунктир профиля (smm.css .x3-c), и остывает до его серого.
     Пока это идёт, проявляются шапка профиля и подпись, а под рамками встаёт настоящий пунктир клеток.
   Ход перехода сглажен, поэтому он не прыгает на щелчках колеса. Колесо назад проводит всё обратно. */

const SM = window.GTSMM, kl = document.getElementById('klienty');
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
/* программная видеокарта (SwiftShader, llvmpipe, «базовый видеоадаптер») рисует поле 1–2 кадра в секунду: там его нет, станция SMM работает как раньше */
const SOFT = (() => { try { const g = document.createElement('canvas').getContext('webgl2'), d = g && g.getExtension('WEBGL_debug_renderer_info');
  const r = d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; const lc = g && g.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext();
  return !g || /swiftshader|llvmpipe|software|basic render/i.test(r); } catch (e) { return true; } })();
/* поле строится, когда three.js загрузился (загрузчик в конце файла) */
function start(THREE) {
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2;

/* числа образца */
const O = { size: 1.2, radius: .18, height: .65, spacing: 1.3, frustum: 7, roughness: .85, lift: .3, ripple: 3.5, anim: 12, follow: 12, speed: .7, emission: 5,
  floorGlow: 4, light: 1, logoSize: .4, logoOpacity: .4, floor: 'rgb(255, 122, 122)', base: '#000000',
  colors: ['rgb(255, 0, 89)', 'rgb(51, 0, 255)', 'rgb(255, 64, 0)', 'rgb(0, 242, 255)'] };
const N = 8, NK = 6, CAP = .3, ICONS = ['instagram', 'tiktok', 'telegram', 'whatsapp', 'youtube', 'facebook', 'threads', 'vk', 'dzen', 'yandex', 'max'];
/* Знаки соцсетей встроены контуром, сайт их не скачивает. Instagram … VK — Simple Icons 13.21.0 (CC0).
   Дзена, Яндекса и мессенджера MAX нет в Simple Icons: белый знак взят с их иконок на Wikimedia Commons («Zen logo icon 2024.svg», VK;
   «Yandex icon.svg»; «Логотип MAX.svg», с max.ru), файлы помечены как общественное достояние. Здесь только контур знака, без цветной плашки.
   fit — высота знака в полосе: буква «Я» узкая и высокая, поэтому чуть меньше, чтобы на клавише она весила как соседние знаки */
const OWN = {
  instagram: { box: [0, 0, 24, 24], d: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077' },
  tiktok: { box: [0, 0, 24, 24], d: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  telegram: { box: [0, 0, 24, 24], d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  whatsapp: { box: [0, 0, 24, 24], d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
  youtube: { box: [0, 0, 24, 24], d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  facebook: { box: [0, 0, 24, 24], d: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' },
  threads: { box: [0, 0, 24, 24], d: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z' },
  vk: { box: [0, 0, 24, 24], d: 'm9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z' },
  dzen: { box: [20.37, 20, 148.37, 148], d: 'M148.369 82.7304C148.369 82.0906 147.849 81.5608 147.209 81.5308C124.246 80.661 110.271 77.732 100.494 67.955C90.6967 58.1581 87.7776 44.1724 86.9079 21.1596C86.8879 20.5198 86.358 20 85.7082 20H83.0291C82.3893 20 81.8594 20.5198 81.8295 21.1596C80.9597 44.1624 78.0406 58.1581 68.2437 67.955C58.4568 77.742 44.4911 80.661 21.5283 81.5308C20.8885 81.5508 20.3687 82.0806 20.3687 82.7304V85.4096C20.3687 86.0494 20.8885 86.5792 21.5283 86.6092C44.4911 87.4789 58.4667 90.408 68.2437 100.185C78.0206 109.962 80.9397 123.908 81.8195 146.83C81.8394 147.47 82.3693 147.99 83.0191 147.99H85.7082C86.348 147.99 86.8779 147.47 86.9079 146.83C87.7876 123.908 90.7067 109.962 100.484 100.185C110.271 90.398 124.236 87.4789 147.199 86.6092C147.839 86.5892 148.359 86.0594 148.359 85.4096V82.7304H148.369Z' },
  yandex: { box: [7.49, 6.06, 15.39, 17.94], fit: 170, d: 'M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z' },
  max: { box: [117, 120, 885, 880], rule: 'evenodd', d: 'M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.785 0 375.947 171.001 375.947 381.604.707 207.346-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574Z' }
};
const BG = new THREE.Color('#0b0b0e');
const K = { idle: 0, t: 0, hc: 0, sink: 0, shown: false, hp: new THREE.Vector3(0, -1000, 0), tg: new THREE.Vector3(), rest: new THREE.Vector3(), mouse: false, k: 0, kc: 0, auto: false };
/* __kx — для проверок: ход перехода и готовность знаков */
window.__kx = { K, ready: false };

const cv = document.createElement('canvas'); cv.id = 'kx'; cv.setAttribute('aria-hidden', 'true');
kl.insertBefore(cv, document.getElementById('air'));
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' }); R.setClearColor(0x000000, 0);
R.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, O.light));
const sun = new THREE.DirectionalLight(0xffffff, O.light * 4); sun.position.set(10, 15, 5); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { near: .1, far: 50, left: -15, right: 15, top: 15, bottom: -15 }); sun.shadow.bias = -5e-4;
scene.add(sun);
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100); cam.position.set(10, 12, 10); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
const BACK = cam.position.clone().normalize();

/* градиент «жидкой сетки»: четыре цвета смешиваются по синусам от точки и времени */
const U = { uTime: { value: 0 }, uHover: { value: K.hp }, uFloorK: { value: 1 }, uRim: { value: 9 }, uDash: { value: 0 }, uPxU: { value: .01 }, uSq: { value: 0 }, c1: { value: new THREE.Color(O.colors[0]) }, c2: { value: new THREE.Color(O.colors[1]) },
  c3: { value: new THREE.Color(O.colors[2]) }, c4: { value: new THREE.Color(O.colors[3]) }, uBase: { value: new THREE.Color(O.base) } };
const MESH = `
uniform float uTime, uFloorK; uniform vec3 uHover, c1, c2, c3, c4, uBase;
vec3 meshGrad(vec3 p0) {
  vec3 p = p0 * 2.; float t = uTime * ${O.speed.toFixed(2)};
  float n1 = sin(p.x * 1.5 + t) * cos(p.y * 1.5 - t * .8) * .5 + .5;
  float n2 = cos(p.z * 1.2 - t * 1.1) * sin(p.x * 1.8 + t * .9) * .5 + .5;
  float n3 = sin(p.y * 2. + t * 1.3) * cos(p.z * 1.5 - t * .7) * .5 + .5;
  return mix(mix(c1, c2, n1), mix(c3, c4, n2), n3);
}`;
/* плитка перехода: вершины выпрямляются в квадрат клетки (лучом от середины на сторону квадрата 0,6) */
const CARD_V = `
float sqm = max(abs(transformed.x), abs(transformed.z));
if (sqm > .001) transformed.xz *= mix(1., .6 / sqm, uSq);
vLoc = transformed;`;
/* пустота из середины: от середины растёт мягкое пятно — сначала круг, потом скруглённый квадрат, — и оставляет у контура рамку
   шириной uRim; край пятна мягкий, пока рамка широкая, и становится чётким, когда она тонкая. Штрихи 4/4 px идут вдоль стороны
   от её начала, как у пунктира клеток; края сглажены по ширине пикселя */
const CARD_F = `
vec2 pq = vLoc.xz; float he = mix(.63, .6, uSq), hw = he - uRim, hr = clamp(min(hw, mix(.16, 0., uSq)), 0., 1.);
vec2 hq = abs(pq) - vec2(max(hw - hr, 0.)); float hs = length(max(hq, 0.)) + min(max(hq.x, hq.y), 0.) - hr;
float fe = max(min(.07, uRim * .45), fwidth(hs) * 1.5), cov = hw <= 0. ? 1. : smoothstep(0., fe, hs);
float along = (abs(pq.x) > abs(pq.y) ? pq.y : pq.x) + .6, dp = along / (8. * uPxU), fd = max(fwidth(dp), 1e-4), ph = fract(dp);
cov *= 1. - uDash * smoothstep(.5 - fd, .5 + fd, ph) * (1. - smoothstep(1. - fd, 1., ph));
diffuseColor.a *= cov;
if (diffuseColor.a < .004) discard;`;
/* card — плитка перехода: к точке внутри неё прибавлен её сдвиг в блоке 3×3, и градиент идёт одной картиной через все 9 */
function keyMat(card) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .5, metalness: 0, transparent: true });
  m.customProgramCacheKey = () => card ? 'kx4-card' : 'kx4';
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute float aHover;' + (card ? ' attribute vec3 aOff; uniform float uSq; varying vec3 vLoc;' : '') + ' varying float vHover; varying vec3 vPos;\n'
      + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHover = aHover; vPos = position' + (card ? ' + aOff' : '') + ';' + (card ? CARD_V : ''));
    sh.fragmentShader = MESH + '\nvarying float vHover; varying vec3 vPos;\n' + (card ? 'uniform float uRim, uDash, uPxU, uSq; varying vec3 vLoc;\n' : '') + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\nvec3 gcol = meshGrad(vPos);\ndiffuseColor.rgb = mix(uBase, gcol, vHover);' + (card ? CARD_F : ''))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(' + O.roughness.toFixed(2) + ', .1, vHover);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = 0.;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gcol * ' + O.emission.toFixed(1) + ' * vHover;');
  };
  return m;
}
/* клавиша: скруглённый квадрат, выдавленный на высоту h с фаской 0,03 */
function keyGeo(h) {
  const s = O.size / 2, r = O.radius, sh = new THREE.Shape();
  sh.moveTo(-s + r, -s); sh.lineTo(s - r, -s); sh.absarc(s - r, -s + r, r, -Math.PI / 2, 0); sh.lineTo(s, s - r); sh.absarc(s - r, s - r, r, 0, Math.PI / 2);
  sh.lineTo(-s + r, s); sh.absarc(-s + r, s - r, r, Math.PI / 2, Math.PI); sh.lineTo(-s, -s + r); sh.absarc(-s + r, -s + r, r, Math.PI, Math.PI * 1.5);
  /* контур без повтора первой точки в конце: на повторе фаска строится с изломом, и у плитки лицом к экрану виден зубец у угла */
  const pts = sh.getPoints(12); if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: h, bevelEnabled: true, bevelSegments: 6, steps: 2, bevelSize: .03, bevelThickness: .03 });
  g.center(); g.rotateX(-Math.PI / 2); return g;
}

/* пол цвета образца с сеткой линий; возле волны он светится тем же градиентом */
const FLOOR = new THREE.Color(O.floor), floorMat = new THREE.MeshStandardMaterial({ color: FLOOR.clone(), roughness: .95, metalness: 0, transparent: true });
floorMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, U);
  sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(position, 1.)).xyz;');
  sh.fragmentShader = MESH + '\nvarying vec3 vW;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float fm = smoothstep(${(O.ripple * 1.5).toFixed(2)}, ${(O.ripple * .2).toFixed(2)}, distance(vW.xz, uHover.xz));
if (fm > 0.) totalEmissiveRadiance += meshGrad(vW) * fm * ${O.floorGlow.toFixed(1)} * uFloorK;`);
};
const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = -O.height / 2 - .01; floor.receiveShadow = true; floor.renderOrder = -1; scene.add(floor);
const grid = new THREE.GridHelper(60, 60, 0x1f1f1f, 0x1a1a1a); grid.position.y = floor.position.y + .01; grid.material.transparent = true; grid.renderOrder = 0; scene.add(grid);

/* поле клавиш */
const cells = []; for (let j = -N; j <= N; j++) for (let i = -N; i <= N; i++) cells.push([i, j]);
const idx = (i, j) => (j + N) * (2 * N + 1) + (i + N);
const geo = keyGeo(O.height), aHover = new THREE.InstancedBufferAttribute(new Float32Array(cells.length), 1); geo.setAttribute('aHover', aHover);
const mKeys = keyMat(false), keys = new THREE.InstancedMesh(geo, mKeys, cells.length); keys.castShadow = true; keys.receiveShadow = true; keys.renderOrder = 1; scene.add(keys);
const M4 = new THREE.Matrix4(), M5 = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), RX = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
cells.forEach(([i, j], n) => keys.setMatrixAt(n, M4.makeTranslation(i * O.spacing, 0, j * O.spacing)));

/* знаки соцсетей: Simple Icons (CC0), контур рисуется в полосу 8×256; знаки идут по клавишам по кругу, как в образце */
const atlas = document.createElement('canvas'); atlas.width = 256 * ICONS.length; atlas.height = 256;
const tex = new THREE.CanvasTexture(atlas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = R.capabilities.getMaxAnisotropy();
const iconTex = ICONS.map((_, i) => { const t = tex.clone(); t.repeat.set(1 / ICONS.length, 1); t.offset.set(i / ICONS.length, 0); return t; });
/* знак: контур вписан в квадрат 200 px по середине ячейки полосы */
function drawOwn(n, i) {
  const o = OWN[n], g = atlas.getContext('2d'), w = o.box[2] - o.box[0], h = o.box[3] - o.box[1], k = (o.fit || 200) / Math.max(w, h);
  g.save(); g.translate(i * 256 + 128, 128); g.scale(k, k); g.translate(-(o.box[0] + w / 2), -(o.box[1] + h / 2)); g.fillStyle = '#fff'; g.fill(new Path2D(o.d), o.rule || 'nonzero'); g.restore();
}
ICONS.forEach(drawOwn); iconTex.forEach(t => { t.needsUpdate = true; }); window.__kx.ready = true;
const plane = new THREE.PlaneGeometry(O.logoSize, O.logoSize);
/* знак по столбцу, как в образце: вдоль строки экрана знаки чередуются */
const iconOf = n => ((cells[n][0] % ICONS.length) + ICONS.length) % ICONS.length;
const LOGO_Y = O.height / 2 + .03 + .02, WHITE = new THREE.Color(1, 1, 1), BLACK = new THREE.Color(0, 0, 0), LC = new THREE.Color();
const logoMat = ic => new THREE.MeshBasicMaterial({ map: iconTex[ic], transparent: true, opacity: O.logoOpacity, depthWrite: false });
const slot = [], logoMeshes = [];
ICONS.forEach((_, ic) => {
  const own = cells.map((c, n) => [c, n]).filter(([, n]) => iconOf(n) === ic), m = new THREE.InstancedMesh(plane, logoMat(ic), own.length);
  own.forEach(([[i, j], n], k) => { slot[n] = [m, k]; m.setMatrixAt(k, M4.makeTranslation(i * O.spacing, LOGO_Y, j * O.spacing).multiply(RX)); m.setColorAt(k, WHITE); });
  m.renderOrder = 2; scene.add(m); logoMeshes.push(m);
});

/* 9 плиток перехода: короче клавиш поля; сдвиг каждой в блоке 3×3 — для общего градиента */
const CN = 9, cgeo = keyGeo(CAP), cHover = new THREE.InstancedBufferAttribute(new Float32Array(CN), 1); cgeo.setAttribute('aHover', cHover);
cgeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(new Float32Array(Array.from({ length: CN }, (_, q) => [(q % 3 - 1) * O.spacing, 0, (Math.floor(q / 3) - 1) * O.spacing]).flat()), 3));
const cMat = keyMat(true), cards = new THREE.InstancedMesh(cgeo, cMat, CN); cards.visible = false; cards.renderOrder = 3; scene.add(cards);
const cLogos = Array.from({ length: CN }, () => { const m = new THREE.Mesh(plane, logoMat(0)); m.material.color.copy(BLACK); m.matrixAutoUpdate = false; m.visible = false; m.renderOrder = 4; scene.add(m); return m; });

/* размер: по высоте экрана 7 единиц, чуть больше клавиш, чем в образце (6). Место покоя волны — справа от надписи станции */
const L = { ok: false, W: 1, H: 1, S: 100 };
const ray = new THREE.Raycaster(), hoverPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -O.height / 2), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
function toWorld(x, y, out) { ndc.set(x / L.W * 2 - 1, -(y / L.H) * 2 + 1); ray.setFromCamera(ndc, cam); if (ray.ray.intersectPlane(hoverPlane, hit)) out.copy(hit); return out; }
const T = { on: false, sel: [], tgt: [], g0: [] };
const qFace = cam.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)), q0 = new THREE.Quaternion();
function targets() {
  const kr = kl.getBoundingClientRect(), cs = [...document.querySelectorAll('#x3-grid .x3-c')].slice(0, CN).map(e => e.getBoundingClientRect());
  if (cs.length < CN || !cs[0].width) return false;
  T.cw = cs[0].width;
  T.tgt = cs.map(r => { const v = new THREE.Vector3((r.left + r.width / 2 - kr.left) / L.W * 2 - 1, -((r.top + r.height / 2 - kr.top) / L.H) * 2 + 1, -1).unproject(cam);
    /* точка на ближней плоскости камеры, сдвинутая к полю: клавиша стоит перед полем, на экране — ровно над клеткой */
    return { p: v.addScaledVector(BACK, -14), s: r.width / L.S / O.size }; });
  return true;
}
function layout() {
  const kr = kl.getBoundingClientRect(); L.W = Math.round(kr.width); L.H = Math.round(kr.height); if (!L.W) return;
  const a = L.W / L.H; L.S = L.H / O.frustum;
  Object.assign(cam, { left: -O.frustum * a / 2, right: O.frustum * a / 2, top: O.frustum / 2, bottom: -O.frustum / 2 }); cam.updateProjectionMatrix();
  R.setSize(L.W, L.H, false);
  toWorld(L.W * .66, L.H * .46, K.rest); if (K.hp.y < -500) { K.hp.copy(K.rest); K.tg.copy(K.rest); }
  L.ok = targets();
}
addEventListener('resize', () => { L.ok = false; });
addEventListener('pointermove', e => { K.idle = 0; if (!K.shown || !L.ok || T.on) return; const kr = kl.getBoundingClientRect(); toWorld(e.clientX - kr.left, e.clientY - kr.top, K.tg); K.mouse = true; }, { passive: true });
document.addEventListener('pointerleave', () => { K.mouse = false; });
addEventListener('blur', () => { K.mouse = false; });

const st = new Float32Array(cells.length);
/* выбор 9 клавиш: квадрат 3×3 у волны. Столбцы по x (на экране вправо-вниз), ряды по z */
function lock() {
  const i0 = clamp(Math.round(K.hp.x / O.spacing), 1 - N, N - 1), j0 = clamp(Math.round(K.hp.z / O.spacing), 1 - N, N - 1);
  T.sel = []; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const i = i0 + a, j = j0 + b, n = idx(i, j); T.sel.push({ i, j, n, c: (b + 1) * 3 + a + 1 }); }
  T.sel.forEach((s, q) => { T.g0[q] = st[s.n]; keys.setMatrixAt(s.n, ZERO); const [m, k] = slot[s.n]; m.setMatrixAt(k, ZERO); m.instanceMatrix.needsUpdate = true;
    cLogos[q].material.map = iconTex[iconOf(s.n)]; cLogos[q].visible = true; });
  keys.instanceMatrix.needsUpdate = true; cards.visible = true; T.on = true;
}
function unlock() {
  T.sel.forEach((s, q) => { st[s.n] = T.g0[q]; aHover.array[s.n] = T.g0[q]; const y = st[s.n] * O.lift;
    keys.setMatrixAt(s.n, M4.makeTranslation(s.i * O.spacing, y, s.j * O.spacing)); const [m, k] = slot[s.n];
    m.setMatrixAt(k, M4.makeTranslation(s.i * O.spacing, y + LOGO_Y, s.j * O.spacing).multiply(RX)); m.instanceMatrix.needsUpdate = true; cLogos[q].visible = false; });
  aHover.needsUpdate = true; keys.instanceMatrix.needsUpdate = true; cards.visible = false; T.on = false;
}

const ST_TXT = ['#st-name', '#st-line', '#st-ask', '#st-hint'].map(q => document.querySelector(q)).filter(Boolean);
const V3 = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), OFF = new THREE.Matrix4().makeTranslation(0, CAP / 2 + .05, 0).multiply(RX);
function draw(dt, t, hc) {
  /* k — ход переворота (6 щелчков), hc — ход передачи примеру в щелчках колеса, оба сглажены */
  const k = K.kc, sel = ss(0, .25, k), sink = .9 * ss(.05, .55, k), fade = ss(.2, .6, k);
  U.uTime.value = t;
  if (!T.on && k > 0) lock(); else if (T.on && k <= 0) unlock();
  if (!K.mouse && !T.on) K.tg.copy(K.rest);
  /* точка волны догоняет курсор, как в образце */
  K.hp.lerp(K.tg, Math.min(1, O.follow * dt));
  const force = sink !== K.sink; K.sink = sink;
  let moved = false;
  for (let n = 0; n < cells.length; n++) {
    if (T.on && T.sel.some(s => s.n === n)) continue;
    const [i, j] = cells[n], x = i * O.spacing, z = j * O.spacing, d = Math.hypot(x - K.hp.x, z - K.hp.z);
    const c = (d < O.ripple ? Math.pow(1 - d / O.ripple, 1.5) : 0) * (1 - sel), dd = c - st[n];
    if (Math.abs(dd) <= .001 && !force) continue;
    if (Math.abs(dd) > .001) st[n] += dd * Math.min(1, O.anim * dt);
    aHover.array[n] = st[n]; moved = true;
    /* поле уходит вниз, пока 9 клавиш поднимаются */
    const y = st[n] * O.lift - sink; keys.setMatrixAt(n, M4.makeTranslation(x, y, z));
    const [m, kk] = slot[n]; m.setMatrixAt(kk, M4.makeTranslation(x, y + LOGO_Y, z).multiply(RX)); m.setColorAt(kk, LC.copy(WHITE).lerp(BLACK, st[n]));
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
  }
  if (moved) { aHover.needsUpdate = true; keys.instanceMatrix.needsUpdate = true; }
  /* поле, пол, сетка и надпись станции гаснут; фон под ними уже тёмный фон примера */
  mKeys.opacity = 1 - fade; keys.visible = mKeys.opacity > .005;
  logoMeshes.forEach(m => { m.material.opacity = O.logoOpacity * (1 - ss(.05, .35, k)); m.visible = m.material.opacity > .003; });
  U.uFloorK.value = 1 - ss(0, .15, k); floorMat.color.copy(FLOOR).lerp(BG, ss(0, .25, k));
  floorMat.opacity = 1 - ss(.1, .45, k); floor.visible = floorMat.opacity > .005;
  grid.material.opacity = floorMat.opacity * (1 - ss(0, .12, k)); grid.visible = grid.material.opacity > .005;
  const ta = (1 - ss(.15, .5, k)).toFixed(3); ST_TXT.forEach(e => { e.style.opacity = ta === '1.000' ? '' : ta; });
  if (T.on) {
    /* блок 3×3 летит целиком: одна общая доля пути, один поворот, один масштаб, поэтому ряды садятся вместе */
    const lift = ss(0, .3, k), tr = ease(ss(.22, .88, k)), sc = lerp(1, T.tgt[0].s, tr), out = ss(1, 1.6, hc), pxu = O.size / T.cw;
    U.uPxU.value = pxu; U.uRim.value = lerp(.7, pxu, ease(ss(.15, 1.15, hc))); U.uSq.value = ss(.55, 1.15, hc); U.uDash.value = ss(.95, 1.4, hc);
    Q.slerpQuaternions(q0, qFace, tr); SC.set(sc, sc, sc);
    T.sel.forEach((s, q) => {
      const tg = T.tgt[s.c];
      /* свет: насыщенный в полёте, гаснет при передаче примеру — плитка становится пустой клеткой */
      cHover.array[q] = lerp(T.g0[q], .17, sel) * (1 - out);
      V3.set(s.i * O.spacing, 0, s.j * O.spacing).lerp(tg.p, tr); V3.y += (.7 * lift + T.g0[q] * O.lift) * (1 - tr);
      M4.compose(V3, Q, SC); cards.setMatrixAt(q, M4);
      cLogos[q].matrix.copy(M5.multiplyMatrices(M4, OFF)); cLogos[q].material.opacity = O.logoOpacity * (1 - ss(.3, .7, tr));
    });
    /* всё заканчивается до 2: на втором щелчке ход останавливается ровно на 2 */
    cMat.opacity = 1 - ss(1.55, 1.95, hc);
    cHover.needsUpdate = true; cards.instanceMatrix.needsUpdate = true;
  }
  R.render(scene, cam);
}

/* колесо: пока 9 клавиш не встали в клетки, щелчки ведут переход; назад — сначала пример, потом переход */
const w0 = SM.wheel;
SM.wheel = dy => {
  const s = SM.state; if (!s.on || !L.ok) return w0(dy);
  K.idle = 0;
  if (dy > 0) { if (K.k < 1) { K.k = Math.min(1, K.k + dy / (100 * NK)); if (K.k > .995) K.k = 1; K.auto = false; return true; } return w0(dy); }
  if (s.u > 0) return w0(dy);
  if (K.k > 0) { K.k = Math.max(0, K.k + dy / (100 * NK)); if (K.k < .005) K.k = 0; K.auto = false; return true; }
  return w0(dy);
};
/* щелчок по пустому месту проигрывает переход, потом пример сам идёт до «Дня 1» */
addEventListener('click', e => {
  if (!K.shown || K.k >= 1 || SM.state.u > 0 || window.__gt.air.cur !== 2) return;
  if (e.target.closest('button,a,input,#dial,#air-foot,#bar,#x3-sd')) return;
  e.stopPropagation(); K.auto = true;
}, true);

/* сетку белых точек под полем не рисовать, пока поле её закрывает */
const SO = window.GTSONAR, so0 = SO && SO.frame;
if (SO) SO.frame = a => { if (K.shown && document.body.classList.contains('kx-hide')) return; so0(a); };
const s0 = SM.step;
SM.step = (dt, c) => {
  /* пока поле на экране, пример сам не запускается: со станцией можно играть мышью */
  /* «не настроена» только пока клавиши в поле: иначе пример сбросил бы цель хода, и переход не довёл бы его до «Дня 1» */
  s0(dt, c.tuned && K.k < 1 && SM.state.u <= 0 ? { ...c, tuned: false } : c);
  if (!c.near || innerWidth <= 760) {
    if (K.shown) { cv.style.visibility = 'hidden'; document.body.classList.remove('kx-hide'); K.shown = false; }
    if (T.on) unlock(); Object.assign(K, { k: 0, kc: 0, hc: 0, auto: false }); ST_TXT.forEach(e => { e.style.opacity = ''; }); return;
  }
  if (!L.ok) layout(); if (!L.ok) return;
  K.t += dt;
  /* 6 секунд без мыши и колеса на настроенной станции — переход проигрывается сам, как раньше сам начинался пример */
  if (c.tuned && K.k === 0 && SM.state.u <= 0 && !K.auto) { K.idle += dt; if (K.idle > 6) { K.auto = true; K.idle = 0; } } else if (!c.tuned) K.idle = 0;
  if (K.auto) { K.k = Math.min(1, K.k + dt * .7); if (K.k >= 1) { K.auto = false; SM.next(); } }
  K.kc = K.auto ? K.k : lerp(K.kc, K.k, clamp(dt * 6)); if (Math.abs(K.kc - K.k) < 1e-4) K.kc = K.k;
  const n = SM.state.u * 28;
  /* ход передачи идёт с той же скоростью, что и свой ход примера в начале (3,5 в секунду), поэтому рамки и клетки примера идут вместе */
  K.hc = Math.abs(n - K.hc) < 1e-3 ? n : lerp(K.hc, n, clamp(dt * 3.2));
  /* тёмный фон примера встаёт под полем раньше, чем гаснет пол: эфирный шум «Клиентов» не проступает */
  const xb = document.getElementById('x3-bg');
  if (xb && K.kc > 0 && K.hc < 2.05) { const a = Math.max(parseFloat(xb.style.opacity) || 0, ss(0, .2, K.kc) * clamp(c.alpha)); xb.style.opacity = a; xb.style.visibility = a > .004 ? 'visible' : 'hidden'; }
  document.body.classList.toggle('kx-hide', K.hc < 1.6);
  const A = clamp(c.alpha) * (1 - ss(1.93, 1.99, K.hc));
  if (A < .004) { cv.style.visibility = 'hidden'; K.shown = false; ST_TXT.forEach(e => { e.style.opacity = ''; }); return; }
  cv.style.visibility = 'visible'; cv.style.opacity = A.toFixed(3); K.shown = true;
  draw(Math.min(dt, .05), K.t, K.hc);
};
}
/* three.js (678 КБ) грузится, только когда посетитель вошёл в «Клиенты» на компьютере с видеокартой: остальным он не нужен,
   и загрузка страницы его не ждёт. До станции SMM от входа в «Клиенты» хватает времени, чтобы он успел загрузиться */
if (SM && kl && !RM && !SOFT) {
  let asked = false;
  const want = () => { if (asked || document.body.dataset.w !== 'klienty' || innerWidth <= 760) return; asked = true; import('three').then(start).catch(() => { asked = false; }); };
  new MutationObserver(want).observe(document.body, { attributes: true, attributeFilter: ['data-w'] }); addEventListener('resize', want); want();
}
