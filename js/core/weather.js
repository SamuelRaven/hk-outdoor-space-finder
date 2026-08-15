/* ========================================
   Weather — 實時天氣角標
   - Open-Meteo：天氣碼 + 風速（免費無 key、CORS）
   - HKO 天文台：熱帶氣旋警告風球信號（免費無 key、CORS）
   失敗 / 無數據 → 兜底留空
   ======================================== */

import { weatherIcon, windIcon, typhoonIcon } from './weather-icons.js?v=3';

const CACHE_TTL = 30 * 60 * 1000;        // Open-Meteo 天氣緩存 30 分鐘
const HKO_CACHE_TTL = 15 * 60 * 1000;    // HKO 風球信號緩存 15 分鐘（全港一致）
const WIND_THRESHOLD_KMH = 40;           // 風速閾值（km/h），>= 此值顯示風圖標

const cache = new Map();                 // 天氣碼緩存（按坐標）
let typhoonCache = { t: 0, v: false };   // 風球信號緩存（不依賴坐標）

export async function fetchWeather(lat, lng) {
  if (lat == null || lng == null) return null;
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.w;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code,is_day,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    if (!c) return null;

    const w = { code: c.weather_code, isDay: c.is_day === 1, windSpeed: c.wind_speed_10m };
    cache.set(key, { t: Date.now(), w });
    return w;
  } catch {
    return null;
  }
}

// 是否正掛熱帶氣旋警告（TC1/TC3/TC8NE..NW/TC9/TC10）
async function hasTyphoonSignal() {
  if (Date.now() - typhoonCache.t < HKO_CACHE_TTL) return typhoonCache.v;
  try {
    const url = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en';
    const res = await fetch(url);
    let v = false;
    if (res.ok) {
      const data = await res.json();
      const entries = Array.isArray(data) ? data : Object.values(data || {});
      v = entries.some(e => {
        if (!e || e.actionCode === 'CANCEL') return false;
        const code = e.code != null ? e.code : e.subtype;
        return typeof code === 'string' && /^TC\d/.test(code);
      });
    }
    typhoonCache = { t: Date.now(), v };
    return v;
  } catch {
    return typhoonCache.v; // 失敗 → 沿用上次緩存
  }
}

// 注入詳情頁天氣角標（山徑 + 公園共用）
// 優先級：颱風風球 > 大風（風速閾值）> 白天晴天溢出太陽（只露 1/3）> 其餘天氣碼內嵌完整
export async function renderWeather(container, lat, lng) {
  const corner = container.querySelector('.detail-hero__weather');
  if (!corner) return;

  const [w, typhoon] = await Promise.all([fetchWeather(lat, lng), hasTyphoonSignal()]);

  if (typhoon) {
    corner.classList.add('detail-hero__weather--inline');
    corner.innerHTML = typhoonIcon();
    corner.classList.add('detail-hero__weather--show');
    return;
  }

  if (!w) return; // 無天氣數據 → 角標留空

  const windy = typeof w.windSpeed === 'number' && w.windSpeed >= WIND_THRESHOLD_KMH;
  const isSun = !windy && w.isDay && (w.code === 0 || w.code === 1);
  corner.classList.add(isSun ? 'detail-hero__weather--corner' : 'detail-hero__weather--inline');
  corner.innerHTML = windy ? windIcon() : weatherIcon(w.code, w.isDay);
  corner.classList.add('detail-hero__weather--show');
}
