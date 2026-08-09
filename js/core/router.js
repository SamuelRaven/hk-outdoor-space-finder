/* ========================================
   Hash-based SPA Router
   路由映射：
     #/         → 首页
     #/filter   → 筛选页
     #/results  → 结果页
     #/blindbox → 盲盒页
   ======================================== */

const routes = new Map();
let currentPageId = null;

/**
 * 注册一个页面
 * @param {string} pageId - 页面标识（对应 section id，如 'page-landing'）
 * @param {Function} initFn - 页面激活时调用
 * @param {Function} [destroyFn] - 页面离开时调用（可选）
 */
export function register(pageId, initFn, destroyFn) {
  routes.set(pageId, { initFn, destroyFn });
}

/**
 * 跳转到指定 hash
 * @param {string} hash - 目标 hash（如 '#/filter'）
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * 路由变化处理：隐藏旧页面 → 显示新页面 → 调用生命周期
 */
function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const targetPageId = hashToPageId(hash);

  if (!routes.has(targetPageId)) {
    console.warn(`[Router] 未知路由: ${hash}`);
    return;
  }

  // 销毁旧页面
  if (currentPageId && routes.has(currentPageId)) {
    const oldRoute = routes.get(currentPageId);
    if (oldRoute.destroyFn) oldRoute.destroyFn();
  }

  // ★ 安全措施：先移除所有页面的 active 状态，防止残留
  document.querySelectorAll('.page--active').forEach(el => {
    el.classList.remove('page--active');
  });

  // 初始化新页面
  const newRoute = routes.get(targetPageId);
  const newSection = document.getElementById(targetPageId);
  if (newSection) {
    newSection.classList.add('page--active');
  }
  newRoute.initFn();

  currentPageId = targetPageId;
}

/**
 * hash → page id 映射
 */
function hashToPageId(hash) {
  switch (hash) {
    case '#/filter':          return 'page-filter';
    case '#/results':         return 'page-results';
    case '#/blindbox':        return 'page-blindbox';
    case '#/dice-tired':      return 'page-dice-tired';
    case '#/hiking-filter':   return 'page-hiking-filter';
    case '#/hiking-results':  return 'page-hiking-results';
    case '#/hiking-blindbox': return 'page-hiking-blindbox';
    case '#/':
    default:                  return 'page-landing';
  }
}

// 监听浏览器 hash 变化
window.addEventListener('hashchange', handleRouteChange);

// 页面加载时触发初始路由
// 使用 DOMContentLoaded 确保所有模块脚本已执行完毕
if (document.readyState === 'complete') {
  handleRouteChange();
} else {
  document.addEventListener('DOMContentLoaded', handleRouteChange);
}
