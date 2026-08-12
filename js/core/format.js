/* ========================================
   Format — 格式化工具
   ======================================== */

/**
 * 格式化山径需时
 * 2.75 → "2小時45分鐘"
 * 1.5  → "1小時30分鐘"
 * 0.75 → "45分鐘"
 * 1.0  → "1小時"
 * 0.3  → "18分鐘"
 */
export function formatDuration(hours) {
  const num = parseFloat(hours);
  if (isNaN(num) || num <= 0) return '—';

  const hrs = Math.floor(num);
  const mins = Math.round((num - hrs) * 60);

  if (hrs === 0) {
    return `${mins}分鐘`;
  }
  if (mins === 0) {
    return `${hrs}小時`;
  }
  return `${hrs}小時${mins}分鐘`;
}

/**
 * 格式化距离
 * 0.45 → "450m"
 * 3.2  → "3.2km"
 * 12.0 → "12km"
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return '';
  if (km < 1) {
    return Math.round(km * 1000) + 'm';
  }
  // 去掉不必要的小数位
  const rounded = Math.round(km * 10) / 10;
  return rounded % 1 === 0 ? rounded + 'km' : rounded.toFixed(1) + 'km';
}
