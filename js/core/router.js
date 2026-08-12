/* ========================================
   Hash-based SPA Router
   ======================================== */

const routes = new Map();
let currentPageId = null;

export function register(pageId, initFn, destroyFn) {
  routes.set(pageId, { initFn, destroyFn });
}

export function navigate(hash) {
  window.location.hash = hash;
}

function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const targetPageId = hashToPageId(hash);

  if (!routes.has(targetPageId)) {
    console.warn(`[Router] 未知路由: ${hash}`);
    return;
  }

  if (currentPageId && routes.has(currentPageId)) {
    const oldRoute = routes.get(currentPageId);
    if (oldRoute.destroyFn) oldRoute.destroyFn();
  }

  document.querySelectorAll('.page--active').forEach(el => {
    el.classList.remove('page--active');
  });

  const newRoute = routes.get(targetPageId);
  const newSection = document.getElementById(targetPageId);
  if (newSection) {
    newSection.classList.add('page--active');
  }
  newRoute.initFn();

  // 切换到新页面时重置滚动位置到顶部
  window.scrollTo(0, 0);

  currentPageId = targetPageId;
}

export function getHashParam() {
  const hash = window.location.hash;
  // strip query (?) and coords (@) suffixes
  let clean = hash;
  const qIdx = hash.indexOf('?');
  const atIdx = hash.indexOf('@');
  if (qIdx >= 0 && atIdx >= 0) clean = hash.slice(0, Math.min(qIdx, atIdx));
  else if (qIdx >= 0) clean = hash.slice(0, qIdx);
  else if (atIdx >= 0) clean = hash.slice(0, atIdx);
  const parts = clean.split('/');
  return parts.length > 2 ? parts.slice(2).join('/') : null;
}

export function getHashQuery() {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex < 0) return {};
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return Object.fromEntries(params.entries());
}

/** 从 hash 中提取坐标（@lat,lng 格式，WeChat 兼容） */
export function getHashCoords() {
  const hash = window.location.hash;
  const atIdx = hash.indexOf('@');
  if (atIdx < 0) return null;
  const parts = hash.slice(atIdx + 1).split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

/** 从 search params 提取坐标（?ll=lat,lng，server 可见，分享最可靠） */
export function getSearchCoords() {
  const params = new URLSearchParams(window.location.search);
  const ll = params.get('ll');
  if (!ll) return null;
  const parts = ll.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

function hashToPageId(hash) {
  if (hash.startsWith('#/park/'))       return 'page-park-detail';
  if (hash.startsWith('#/trail/'))      return 'page-trail-detail';

  switch (hash) {
    case '#/filter':          return 'page-filter';
    case '#/results':         return 'page-results';
    case '#/blindbox':        return 'page-blindbox';
    case '#/dice-tired':      return 'page-dice-tired';
    case '#/fav-parks':       return 'page-fav-parks';
    case '#/fav-trails':      return 'page-fav-trails';
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
