/* ========================================
   Trail Matcher — 山径匹配纯 AND 过滤
   所有筛选条件必须完全满足 → 返回全部匹配结果
   ======================================== */

/**
 * 根据筛选条件匹配山径
 * @param {Array} trails - 山径数组
 * @param {Object} filters - 用户筛选条件 { region, district, difficulty, scenery, surface }
 * @returns {Array} 全部匹配结果（数据文件原始顺序），翻页在 UI 层控制
 */
export function matchTrails(trails, filters) {
  const results = [];
  const sceneries = Array.isArray(filters.scenery) ? filters.scenery : (filters.scenery ? [filters.scenery] : []);

  for (const trail of trails) {
    if (filters.region && trail.region !== filters.region) continue;
    if (filters.district && trail.district !== filters.district) continue;
    if (filters.difficulty && trail.difficulty !== filters.difficulty) continue;
    if (sceneries.length && (!trail.scenery || !sceneries.some(s => trail.scenery.includes(s)))) continue;
    if (filters.surface && trail.surface !== filters.surface) continue;

    results.push(trail);
  }

  // 多选氛围：按满足程度降序（命中所选氛围越多越靠前），命中数相同时保持原始顺序
  if (sceneries.length > 1) {
    results.sort((a, b) => {
      const ca = (a.scenery || []).filter(x => sceneries.includes(x)).length;
      const cb = (b.scenery || []).filter(x => sceneries.includes(x)).length;
      return cb - ca;
    });
  }

  return results;  // 返回全部匹配结果，翻页在 UI 层控制
}
