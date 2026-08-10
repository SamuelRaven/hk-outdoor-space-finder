/* ========================================
   Geo — 地理定位 & 距離計算
   ======================================== */

/**
 * Haversine 公式計算兩點間距離
 * @returns {number} 距離（公里）
 */
export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

/**
 * 檢查瀏覽器定位權限狀態
 * @returns {Promise<'granted'|'denied'|'prompt'|'unknown'>}
 */
async function checkPermission() {
  if (!navigator.permissions) return 'unknown';
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/**
 * 獲取用戶位置（每次調用都重新請求）
 * @returns {Promise<{coords: {lat:number,lng:number}|null, error: string|null}>}
 */
export async function getUserPosition() {
  // 微信内置浏览器不支持标准 Geolocation API
  if (isWeChat()) {
    return { coords: null, error: 'wechat' };
  }

  if (!navigator.geolocation) {
    return { coords: null, error: 'unsupported' };
  }

  const perm = await checkPermission();
  if (perm === 'denied') {
    return { coords: null, error: 'denied' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, error: null }),
      (err) => {
        resolve({ coords: null, error: err.code === 1 ? 'denied' : 'unavailable' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * 按距離排序（返回新陣列，不修改原陣列）
 */
export function sortByDistance(items, userLat, userLng) {
  return [...items].sort((a, b) => {
    const distA = calcDistance(userLat, userLng, a.lat, a.lng);
    const distB = calcDistance(userLat, userLng, b.lat, b.lng);
    return distA - distB;
  });
}
