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

/**
 * 獲取用戶位置（每次調用都重新請求）
 * @returns {Promise<{coords: {lat:number,lng:number}|null, error: string|null}>}
 */
export function getUserPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: null, error: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, error: null }),
      (err) => {
        resolve({ coords: null, error: err.code === 1 ? 'denied' : 'unavailable' });
      },
      { enableHighAccuracy: false, timeout: 10000 }
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
