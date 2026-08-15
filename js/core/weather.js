/* ========================================
   Weather — Open-Meteo 實時天氣（僅動畫角標）
   免費無 key、CORS 可跨域；30 分鐘內存緩存
   失敗 / 無座標 → 返回 null（角標留空兜底）
   ======================================== */

import { weatherIcon, windIcon } from './weather-icons.js?v=2';

const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map();

// 風速閾值（km/h）：>= 此值視為「大風」，角標顯示風力線條（覆蓋天氣碼圖標）
const WIND_THRESHOLD_KMH = 40;

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

// 注入詳情頁天氣角標（山徑 + 公園共用同一 DOM 結構）
// 大風（wind_speed_10m >= 閾值）→ 風力線條；白天晴天 → 太陽溢出角標（只露約 1/3）；其餘 → 角標內嵌完整展現
export async function renderWeather(container, lat, lng) {
  const corner = container.querySelector('.detail-hero__weather');
  if (!corner) return;

  const w = await fetchWeather(lat, lng);
  if (!w) return; // 失敗 / 無數據 → 角標留空

  const windy = typeof w.windSpeed === 'number' && w.windSpeed >= WIND_THRESHOLD_KMH;
  const isSun = !windy && w.isDay && (w.code === 0 || w.code === 1);
  corner.classList.add(isSun ? 'detail-hero__weather--corner' : 'detail-hero__weather--inline');
  corner.innerHTML = windy ? windIcon() : weatherIcon(w.code, w.isDay);
  corner.classList.add('detail-hero__weather--show');
}
