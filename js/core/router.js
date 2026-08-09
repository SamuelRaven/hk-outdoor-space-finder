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

  currentPageId = targetPageId;
}

export function getHashParam() {
  const hash = window.location.hash;
  const parts = hash.split('/');
  return parts.length > 2 ? parts.slice(2).join('/') : null;
}

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
