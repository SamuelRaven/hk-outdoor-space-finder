/* ========================================
   Matcher — 公园匹配打分算法
   硬性过滤 + 加分排序 → 取前10
   ======================================== */

/**
 * 根据筛选条件匹配公园
 * @param {Array} parks - 公园数组
 * @param {Object} filters - 用户筛选条件 { region, district, time, parkType, activity }
 * @returns {Array} 前10个匹配公园
 */
export function matchParks(parks, filters) {
  const scored = [];

  for (const park of parks) {
    let score = 0;

    // ---- 🥇 硬过滤：地区 ----
    if (filters.region && park.region !== filters.region) continue;
    if (filters.district && park.district !== filters.district) continue;

    // ---- 🥈 硬过滤：做点什么 ----
    if (filters.activity && (!park.activityTypes || !park.activityTypes.includes(filters.activity))) continue;

    // ---- 🥉 加分：公园类型 (+2) ----
    if (filters.parkType && park.parkType === filters.parkType) {
      score += 2;
    }

    // ---- 加分：时间 (+1) ----
    if (filters.time && park.bestTime && park.bestTime.includes(filters.time)) {
      score += 1;
    }

    scored.push({ park, score });
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

  return result.slice(0, 10).map(item => item.park);
}

/**
 * 判断今天是否周末（周六或周日）
 * @returns {boolean}
 */
export function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
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
