/* ========================================
   Matcher — 公园匹配纯 AND 过滤
   所有筛选条件必须完全满足 → 返回全部匹配结果
   ======================================== */

/**
 * 根据筛选条件匹配公园
 * @param {Array} parks - 公园数组
 * @param {Object} filters - 用户筛选条件 { region, district, time, parkType, activity }
 * @returns {Array} 全部匹配结果（数据文件原始顺序），翻页在 UI 层控制
 */
export function matchParks(parks, filters) {
  const results = [];

  for (const park of parks) {
    if (filters.region && park.region !== filters.region) continue;
    if (filters.district && park.district !== filters.district) continue;
    if (filters.parkType && park.parkType !== filters.parkType) continue;
    if (filters.time && (!park.bestTime || !park.bestTime.includes(filters.time))) continue;
    if (filters.activity && (!park.activityTypes || !park.activityTypes.includes(filters.activity))) continue;

    results.push(park);
  }

  return results;  // 返回全部匹配结果，翻页在 UI 层控制
}
