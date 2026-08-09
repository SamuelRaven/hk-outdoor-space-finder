/* ========================================
   Trail Matcher — 山径匹配打分算法
   硬性过滤 + 加分排序 → 取前10
   ======================================== */

/**
 * 根据筛选条件匹配山径
 * @param {Array} trails - 山径数组
 * @param {Object} filters - 用户筛选条件 { region, district, difficulty, scenery, surface }
 * @returns {Array} 前10个匹配山径
 */
export function matchTrails(trails, filters) {
  const scored = [];

  for (const trail of trails) {
    let score = 0;

    // ---- 🥇 硬过滤：地区 ----
    if (filters.region && trail.region !== filters.region) continue;
    if (filters.district && trail.district !== filters.district) continue;

    // ---- 🥈 硬过滤：难度 ----
    if (filters.difficulty && trail.difficulty !== filters.difficulty) continue;

    // ---- 🥉 加分：氛围 (+2) ----
    if (filters.scenery && trail.scenery && trail.scenery.includes(filters.scenery)) {
      score += 2;
    }

    // ---- 加分：路况 (+2) ----
    if (filters.surface && trail.surface === filters.surface) {
      score += 2;
    }

    scored.push({ trail, score });
  }

  // 按分数降序排列
  scored.sort((a, b) => b.score - a.score);

  // 同分随机打乱
  const groups = new Map();
  for (const item of scored) {
    const key = item.score;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const result = [];
  for (const [, group] of groups) {
    shuffle(group);
    result.push(...group);
  }

  return result.slice(0, 10).map(item => item.trail);
}

/**
 * Fisher-Yates 洗牌
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
