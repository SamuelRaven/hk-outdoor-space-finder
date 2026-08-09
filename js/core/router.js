/* ========================================
   Hash-based SPA Router
   ======================================== */

const routes = new Map();
let currentPageId = null;

/**
 * 注册一个页面
 */
export function register(pageId, initFn, destroyFn) {
  routes.set(pageId, { initFn, destroyFn });
}

/**
 * 跳转到指定 hash
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * 从当前 hash 中提取参数
 * 例: '#/park/ltp' → 'ltp', '#/trail/maclehose-s1' → 'maclehose-s1'
 * 其他 hash 返回 null
 */
export function getHashParam() {
  const hash = window.location.hash;
  const parts = hash.split('/');
  return parts.length > 2 ? parts.slice(2).join('/') : null;
}

/**
 * 路由变化处理
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

  // 移除所有 active 状态
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
 * hash → page id 映射（支持参数化路由）
 */
function hashToPageId(hash) {
  if (hash.startsWith('#/park/'))       return 'page-park-detail';
  if (hash.startsWith('#/trail/'))      return 'page-trail-detail';

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

window.addEventListener('hashchange', handleRouteChange);

if (document.readyState === 'complete') {
  handleRouteChange();
} else {
  document.addEventListener('DOMContentLoaded', handleRouteChange);
}
