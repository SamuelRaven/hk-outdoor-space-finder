/* ========================================
   Weather Icons — 包豪斯風天氣 SVG 動效
   自 weather-preview.html 抽出，供詳情頁角標使用
   動畫類名加 weather- 前綴避免與其他模組衝突
   黑色用 #000000（與全局 --color-black 一致）
   ======================================== */

const BLACK = '#000000';
const YELLOW = '#F6B81F';   // --color-yellow
const BLUE = '#354A67';     // --color-blue
const GRAY = '#8A7F72';     // --color-gray

const CLOUD = "M 52 128 C 42 128 42 112 52 108 C 46 96 56 86 66 90 C 64 74 78 66 88 74 C 90 60 110 60 116 72 C 124 64 138 70 138 82 C 150 78 158 90 152 100 C 160 108 156 124 144 128 C 138 136 120 136 114 130 C 104 138 86 138 80 130 C 70 136 56 134 52 128 Z";

// 云（position 为外层定位 transform；内层做涌动动画）
function cloud(pos) {
  const t = pos ? ` transform="${pos}"` : '';
  return `<g${t}><g class="weather-cloud-drift"><path d="${CLOUD}" fill="${BLUE}" stroke="${BLACK}" stroke-width="4"/></g></g>`;
}

// 太阳：短射线（与太阳有间隙）
function sunRays() {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const inner = 56, outer = 72, cx = 100, cy = 100;
  let lines = '';
  for (const a of angles) {
    const r = a * Math.PI / 180;
    const x1 = cx + inner * Math.cos(r), y1 = cy - inner * Math.sin(r);
    const x2 = cx + outer * Math.cos(r), y2 = cy - outer * Math.sin(r);
    lines += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  return lines;
}

function sunSVG() {
  return `<svg viewBox="0 0 200 200"><g class="weather-sun-rays"><g stroke="${YELLOW}" stroke-width="5" stroke-linecap="round">${sunRays()}</g></g><circle cx="100" cy="100" r="42" fill="${YELLOW}" stroke="${BLACK}" stroke-width="4"/></svg>`;
}

// 弯月（几何正确的月牙）
function crescentPath(cx, cy, r) {
  const R1 = r, R2 = r * 0.88, d = r * 0.55;
  const o1x = cx - d / 2;
  const a = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
  const h = Math.sqrt(R1 * R1 - a * a);
  const ix = o1x + a;
  return `M ${ix.toFixed(1)} ${(cy - h).toFixed(1)} A ${R1} ${R1} 0 1 0 ${ix.toFixed(1)} ${(cy + h).toFixed(1)} A ${R2} ${R2} 0 0 1 ${ix.toFixed(1)} ${(cy - h).toFixed(1)} Z`;
}

// 雨点
function drops(n, speed, x0, gap, y1, y2) {
  let s = '';
  const delays = ['', 'weather-d2', 'weather-d3', 'weather-d4', 'weather-d5'];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * gap;
    s += `<line class="weather-rain ${speed} ${delays[i % 5]}" x1="${x}" y1="${y1}" x2="${x - 8}" y2="${y2}"/>`;
  }
  return s;
}

function rainIcon(n, speed, w, x0, gap, y1, y2) {
  return `<svg viewBox="0 0 200 200">${cloud('translate(0 -30)')}<g stroke="${BLUE}" stroke-width="${w}" stroke-linecap="round">${drops(n, speed, x0, gap, y1, y2)}</g></svg>`;
}

function overcastIcon() {
  return `<svg viewBox="0 0 200 200">${cloud('translate(0 -6)')}</svg>`;
}

function partlyDayIcon() {
  return `<svg viewBox="0 0 200 200"><circle cx="100" cy="76" r="40" fill="${YELLOW}" stroke="${BLACK}" stroke-width="4"/>${cloud('translate(0 16)')}</svg>`;
}

function partlyNightIcon() {
  return `<svg viewBox="0 0 200 200"><path d="${crescentPath(100, 76, 42)}" fill="${YELLOW}" stroke="${BLACK}" stroke-width="4" stroke-linejoin="round"/>${cloud('translate(0 16)')}</svg>`;
}

function fogIcon() {
  return `<svg viewBox="0 0 200 200"><g stroke="${GRAY}" stroke-width="6" stroke-linecap="round"><line class="weather-fog" x1="40" y1="80" x2="160" y2="80"/><line class="weather-fog weather-d2" x1="55" y1="108" x2="150" y2="108"/><line class="weather-fog weather-d3" x1="40" y1="136" x2="165" y2="136"/></g></svg>`;
}

function thunderIcon() {
  return `<svg viewBox="0 0 200 200"><polygon class="weather-lightning" points="110,56 62,114 86,114 76,150 130,86 102,86" fill="${YELLOW}" stroke="${BLACK}" stroke-width="4" stroke-linejoin="round"/>${cloud('translate(0 -30)')}<g stroke="${BLUE}" stroke-width="7" stroke-linecap="round"><line class="weather-rain weather-fast" x1="50" y1="138" x2="42" y2="162"/><line class="weather-rain weather-fast weather-d2" x1="70" y1="138" x2="62" y2="162"/><line class="weather-rain weather-fast weather-d3" x1="90" y1="138" x2="82" y2="162"/><line class="weather-rain weather-fast weather-d4" x1="110" y1="138" x2="102" y2="162"/><line class="weather-rain weather-fast weather-d5" x1="130" y1="138" x2="122" y2="162"/><line class="weather-rain weather-fast weather-d2" x1="150" y1="138" x2="142" y2="162"/></g></svg>`;
}

function nightClearIcon() {
  return `<svg viewBox="0 0 200 200"><path d="${crescentPath(100, 100, 48)}" fill="${YELLOW}" stroke="${BLACK}" stroke-width="4" stroke-linejoin="round"/><circle class="weather-star" cx="152" cy="92" r="3.5" fill="${YELLOW}"/><circle class="weather-star weather-d2" cx="144" cy="128" r="2.5" fill="${YELLOW}"/><circle class="weather-star weather-d3" cx="160" cy="52" r="3" fill="${YELLOW}"/><circle class="weather-star weather-d4" cx="30" cy="104" r="3" fill="${YELLOW}"/><circle class="weather-star weather-d5" cx="38" cy="162" r="2.5" fill="${YELLOW}"/><circle class="weather-star weather-d2" cx="64" cy="34" r="4" fill="${YELLOW}"/><circle class="weather-star weather-d3" cx="126" cy="28" r="2.5" fill="${YELLOW}"/></svg>`;
}

// WMO 天气码 → 图标（Open-Meteo weather_code）
// 0/1 晴 · 2 多云 · 3 阴 · 45/48 雾 · 51-57 毛毛雨 · 61-67 雨 · 71-77 雪(兜底雨) · 80-82 阵雨 · 85/86 雪阵(兜底雨) · 95-99 雷暴
export function weatherIcon(code, isDay) {
  if (code == null) return '';
  if (code === 0 || code === 1) return isDay ? sunSVG() : nightClearIcon();
  if (code === 2) return isDay ? partlyDayIcon() : partlyNightIcon();
  if (code === 3) return overcastIcon();
  if (code === 45 || code === 48) return fogIcon();
  // 小雨 / 毛毛雨 / 小雪
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57 ||
      code === 61 || code === 80 || code === 71 || code === 77 || code === 85) {
    return rainIcon(2, 'weather-slow', 5, 90, 30, 122, 144);
  }
  // 中雨 / 冻雨 / 中雪
  if (code === 63 || code === 66 || code === 81 || code === 73 || code === 86) {
    return rainIcon(4, '', 6, 66, 22, 122, 146);
  }
  // 大雨 / 暴雨 / 大雪
  if (code === 65 || code === 67 || code === 82 || code === 75) {
    return rainIcon(5, 'weather-fast', 7, 62, 19, 120, 148);
  }
  if (code === 95 || code === 96 || code === 99) return thunderIcon();
  return ''; // 未知 → 兜底留空
}
