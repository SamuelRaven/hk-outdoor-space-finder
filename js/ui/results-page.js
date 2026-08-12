/* ========================================
   Results Page — 公园推荐结果
   ======================================== */

import { navigate, register } from '../core/router.js?v=4';
import { matchParks } from '../core/matcher.js?v=4';
import { calcDistance, getUserPosition, sortByDistance } from '../core/geo.js?v=4';
import { formatDistance } from '../core/format.js?v=4';

let parks = [];
let cachedResults = null;    // 从详情页返回时恢复用
let originalOrder = null;    // 默认排序（匹配器返回的原始顺序）
let distanceOrder = null;    // 距离排序结果
let isDistanceSort = false;  // 当前是否按距离排序
let userCoords = null;       // 缓存用户位置
let currentPage = 1;         // 当前页码
const PAGE_SIZE = 10;

function init() {
  const section = document.getElementById('page-results');
  const listEl = document.getElementById('results-list');
  const countEl = document.getElementById('results-count');
  const emptyEl = document.getElementById('results-empty');
  const sortBtn = document.getElementById('park-sort-distance');
  const pgnEl = document.getElementById('park-pagination');

  // 每次从筛选页进入时重置排序状态（从详情页返回不重置）
  const isReturnFromDetail = !!cachedResults;
  if (!isReturnFromDetail) {
    isDistanceSort = false;
    distanceOrder = null;
    currentPage = 1;
    // 尝试获取用户位置（用于显示距离，静默失败）
    if (!userCoords) {
      getUserPosition().then(r => { if (r.coords) userCoords = r.coords; });
    }
  }
  updateSortButton(sortBtn, isDistanceSort);

  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    cachedResults = null;
    originalOrder = null;
    distanceOrder = null;
    isDistanceSort = false;
    userCoords = null;
    currentPage = 1;
    navigate('#/filter');
  });

  // 距离排序按钮
  if (sortBtn) {
    sortBtn.addEventListener('click', () => handleSortClick(sortBtn, listEl, countEl, pgnEl));
  }

  // 从详情页返回 → 恢复缓存结果
  if (cachedResults) {
    const { allResults } = cachedResults;
    countEl.textContent = `(${allResults.length})`;
    emptyEl.style.display = 'none';
    originalOrder = allResults;
    if (isDistanceSort && distanceOrder) {
      renderCards(distanceOrder.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), listEl, cachedResults.filters);
    } else {
      renderCards(allResults.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), listEl, cachedResults.filters);
    }
    renderPagination(allResults.length, pgnEl, listEl, countEl, sortBtn);
    // 恢复离开时的滚动位置（双帧 rAF 确保布局完成）
    const savedScroll = sessionStorage.getItem('resultsScrollY');
    if (savedScroll) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScroll));
          sessionStorage.removeItem('resultsScrollY');
        });
      });
    }
    return;
  }

  if (parks.length === 0) {
    fetch('js/data/parks.json?v=4')
      .then(r => r.json())
      .then(data => {
        parks = data;
        doMatch(listEl, countEl, emptyEl, sortBtn, pgnEl);
      })
      .catch(err => {
        console.error('加载 parks.json 失败:', err);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
      });
  } else {
    doMatch(listEl, countEl, emptyEl, sortBtn, pgnEl);
  }
}

function doMatch(listEl, countEl, emptyEl, sortBtn, pgnEl) {
  const filters = (window.__appState && window.__appState.filters)
    || (() => { try { const s = sessionStorage.getItem('parkFilters'); return s ? JSON.parse(s) : {}; } catch { return {}; } })();
  const allResults = matchParks(parks, filters);

  cachedResults = { allResults, filters };
  originalOrder = allResults;
  isDistanceSort = false;
  currentPage = 1;
  updateSortButton(sortBtn, false);

  countEl.textContent = `(${allResults.length})`;

  if (allResults.length === 0) {
    listEl.innerHTML = '';
    if (pgnEl) pgnEl.innerHTML = '';
    emptyEl.style.display = 'block';
    if (sortBtn) sortBtn.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  if (sortBtn) sortBtn.style.display = '';
  const pageItems = allResults.slice(0, PAGE_SIZE);
  renderCards(pageItems, listEl, filters);
  renderPagination(allResults.length, pgnEl, listEl, countEl, sortBtn);
}

async function handleSortClick(sortBtn, listEl, countEl, pgnEl) {
  if (isDistanceSort) {
    // 取消距离排序 → 恢复默认顺序
    isDistanceSort = false;
    currentPage = 1;
    updateSortButton(sortBtn, false);
    const items = originalOrder.slice(0, PAGE_SIZE);
    renderCards(items, listEl, cachedResults.filters);
    renderPagination(originalOrder.length, pgnEl, listEl, countEl, sortBtn);
    const toast = await import('./toast.js?v=4');
    toast.showToast('已取消按距離排序');
    return;
  }

  // 如果已有缓存的距离排序结果，直接切换
  if (distanceOrder) {
    isDistanceSort = true;
    currentPage = 1;
    updateSortButton(sortBtn, true);
    const items = distanceOrder.slice(0, PAGE_SIZE);
    renderCards(items, listEl, cachedResults.filters);
    renderPagination(distanceOrder.length, pgnEl, listEl, countEl, sortBtn);
    const toast = await import('./toast.js?v=4');
    toast.showToast('已按距離排序');
    return;
  }

  // 获取用户位置（每次都重新请求，不缓存失败）
  const geoResult = await getUserPosition();
  if (!geoResult.coords) {
    const toast = await import('./toast.js?v=4');
    toast.showToast('請允許瀏覽器使用定位權限');
    return;
  }
  userCoords = geoResult.coords;

  // 按距离排序
  distanceOrder = sortByDistance(originalOrder, userCoords.lat, userCoords.lng);
  isDistanceSort = true;
  currentPage = 1;
  updateSortButton(sortBtn, true);
  const items = distanceOrder.slice(0, PAGE_SIZE);
  renderCards(items, listEl, cachedResults.filters);
  renderPagination(distanceOrder.length, pgnEl, listEl, countEl, sortBtn);

  const toast = await import('./toast.js?v=4');
  toast.showToast('已按距離排序');
}

function getActiveList() {
  return isDistanceSort ? (distanceOrder || originalOrder) : originalOrder;
}

function renderPagination(totalItems, container, listEl, countEl, sortBtn) {
  if (!container) return;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const build = (page) => {
    currentPage = page;
    const list = getActiveList();
    const items = list.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
    renderCards(items, listEl, cachedResults.filters);
    // scroll to top of page
    const pageEl = document.getElementById('page-results');
    if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // re-render pagination
    renderPagination(totalItems, container, listEl, countEl, sortBtn);
  };

  let html = '';
  html += `<button class="pgn-arrow pgn-arrow--left" ${currentPage===1?'disabled':''} title="上一頁"><svg width="14" height="16" viewBox="0 0 14 16"><polygon points="14,0 0,8 14,16" fill="currentColor"/></svg></button>`;

  // page numbers with ellipsis
  html += '<span class="pgn-pages">';
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pgn-num${i===currentPage?' pgn-num--active':''}">${i}</button>`;
    }
  } else {
    html += `<button class="pgn-num${1===currentPage?' pgn-num--active':''}">1</button>`;
    if (currentPage > 3) html += '<span class="pgn-ellipsis">…</span>';
    for (let i = Math.max(2, currentPage-1); i <= Math.min(totalPages-1, currentPage+1); i++) {
      html += `<button class="pgn-num${i===currentPage?' pgn-num--active':''}">${i}</button>`;
    }
    if (currentPage < totalPages-2) html += '<span class="pgn-ellipsis">…</span>';
    html += `<button class="pgn-num${totalPages===currentPage?' pgn-num--active':''}">${totalPages}</button>`;
  }
  html += '</span>';

  html += `<button class="pgn-arrow pgn-arrow--right" ${currentPage===totalPages?'disabled':''} title="下一頁"><svg width="14" height="16" viewBox="0 0 14 16"><polygon points="0,0 14,8 0,16" fill="currentColor"/></svg></button>`;

  container.innerHTML = html;

  // bind events
  container.querySelectorAll('.pgn-arrow, .pgn-num').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('pgn-arrow')) {
        if (btn.title === '上一頁' && currentPage > 1) build(currentPage-1);
        else if (btn.title === '下一頁' && currentPage < totalPages) build(currentPage+1);
        return;
      }
      const n = parseInt(btn.textContent);
      if (n >= 1 && n <= totalPages) build(n);
    });
  });
}

function updateSortButton(btn, active) {
  if (!btn) return;
  if (active) {
    btn.classList.add('sort-distance--active');
    btn.setAttribute('aria-label', '取消距離排序');
    btn.title = '取消按距離排序';
  } else {
    btn.classList.remove('sort-distance--active');
    btn.setAttribute('aria-label', '按距離排序');
    btn.title = '按距離排序';
  }
}

function renderCards(parkList, container, filters) {
  container.innerHTML = '';

  parkList.forEach(park => {
    const desc = getParkDescription(park, filters);

    let distanceHtml = '';
    if (userCoords && park.lat != null && park.lng != null) {
      const km = calcDistance(userCoords.lat, userCoords.lng, park.lat, park.lng);
      distanceHtml = `<span class="park-card__distance">${formatDistance(km)}</span>`;
    }

    const card = document.createElement('div');
    card.className = 'park-card';
    card.dataset.region = park.region;
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="park-card__body">
        <div class="park-card__name">${park.nameZh}</div>
        <div class="park-card__hours">${park.openingHours}</div>
        <div class="park-card__desc">${desc}</div>
      </div>
      <span class="park-card__region">${park.region}</span>
      ${distanceHtml}
    `;

    card.addEventListener('click', () => {
      sessionStorage.setItem('detailReferrer', '#/results');
      sessionStorage.setItem('resultsScrollY', window.scrollY);
      navigate(`#/park/${park.id}`);
    });

    container.appendChild(card);
  });
}

function getParkDescription(park, filters) {
  return park.description || '';
}

function destroy() {
  // 不清理 cachedResults——從詳情頁返回時需要保留
}

register('page-results', init, destroy);
