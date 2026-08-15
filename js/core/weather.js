/* ========================================
   Weather — Open-Meteo 實時天氣（僅動畫角標）
   免費無 key、CORS 可跨域；30 分鐘內存緩存
   失敗 / 無座標 → 返回 null（角標留空兜底）
   ======================================== */

import { weatherIcon } from './weather-icons.js?v=1';

const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map();

export async function fetchWeather(lat, lng) {
  if (lat == null || lng == null) return null;
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.w;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code,is_day`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    if (!c) return null;

    const w = { code: c.weather_code, isDay: c.is_day === 1 };
    cache.set(key, { t: Date.now(), w });
    return w;
  } catch {
    return null;
  }
}

// 注入详情页天气角标（山径 + 公园共用同一 DOM 结构）
// 晴 / 晴夜 → 角标溢出（装饰感）；其他天气 → 角标内嵌（清晰可辨）
export async function renderWeather(container, lat, lng) {
  const corner = container.querySelector('.detail-hero__weather');
  if (!corner) return;

  const w = await fetchWeather(lat, lng);
  if (!w) return; // 失败 / 无数据 → 角标留空

  const isClear = w.code === 0 || w.code === 1;
  corner.classList.add(isClear ? 'detail-hero__weather--corner' : 'detail-hero__weather--inline');
  corner.innerHTML = weatherIcon(w.code, w.isDay);
  corner.classList.add('detail-hero__weather--show');
}
