/* ========================================
   Weather — Open-Meteo 實時天氣
   免費無 key、CORS 可跨域；30 分鐘內存緩存
   失敗 / 無座標 → 返回 null（角標留空兜底）
   ======================================== */

import { weatherIcon } from './weather-icons.js?v=1';

const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map();

// 风向 8 向（气象惯例：风向指风「来自」的方向）
function windDirText(deg) {
  if (deg == null) return '';
  const dirs = ['北風', '東北風', '東風', '東南風', '南風', '西南風', '西風', '西北風'];
  return dirs[Math.round(deg / 45) % 8];
}

export async function fetchWeather(lat, lng) {
  if (lat == null || lng == null) return null;
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.w;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    if (!c) return null;

    const w = {
      temp: Math.round(c.temperature_2m),
      humidity: Math.round(c.relative_humidity_2m),
      code: c.weather_code,
      isDay: c.is_day === 1,
      wind: Math.round(c.wind_speed_10m),
      windText: windDirText(c.wind_direction_10m),
    };
    cache.set(key, { t: Date.now(), w });
    return w;
  } catch {
    return null;
  }
}

// 注入详情页天气（山径 + 公园共用同一 DOM 结构）
// 晴 / 晴夜 → 角标溢出（装饰感）；其他天气 → 角标内嵌（清晰可辨）
export async function renderWeather(container, lat, lng) {
  const corner = container.querySelector('.detail-hero__weather');
  const block = container.querySelector('.detail-weather');
  if (!corner || !block) return;

  const w = await fetchWeather(lat, lng);
  if (!w) return; // 失败 / 无数据 → 角标留空，数据块隐藏

  const isClear = w.code === 0 || w.code === 1;
  corner.classList.add(isClear ? 'detail-hero__weather--corner' : 'detail-hero__weather--inline');
  corner.innerHTML = weatherIcon(w.code, w.isDay);
  corner.classList.add('detail-hero__weather--show');

  const windPart = w.windText ? `${w.windText} ${w.wind} km/h` : `${w.wind} km/h`;
  block.querySelector('.detail-weather__temp').textContent = `${w.temp}°C`;
  block.querySelector('.detail-weather__text').textContent = `· ${windPart} · 濕度 ${w.humidity}%`;
  block.classList.add('detail-weather--show');
}
