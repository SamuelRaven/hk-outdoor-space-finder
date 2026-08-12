/* ========================================
   Favorites — 收藏功能
   localStorage 持久化，公園/山徑分開存
   ======================================== */

const KEY_PARK  = 'fav_parks';
const KEY_TRAIL = 'fav_trails';

/** 取得某類型的所有收藏 ID */
export function getFavorites(type) {
  const key = type === 'trail' ? KEY_TRAIL : KEY_PARK;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 檢查是否已收藏 */
export function isFavorite(type, id) {
  return getFavorites(type).includes(id);
}

/** 切換收藏狀態，返回新的狀態 (true=已收藏, false=已取消) */
export function toggleFavorite(type, id) {
  const key = type === 'trail' ? KEY_TRAIL : KEY_PARK;
  const list = getFavorites(type);
  const idx = list.indexOf(id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(key, JSON.stringify(list));
    return false;
  } else {
    list.push(id);
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  }
}

