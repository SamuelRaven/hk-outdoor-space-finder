/* ========================================
   Results Page — 公园推荐结果
   ======================================== */

import { navigate, register } from '../core/router.js?v=2';
import { matchParks } from '../core/matcher.js?v=2';
import { getUserPosition, sortByDistance } from '../core/geo.js?v=2';

let parks = [];
let cachedResults = null;    // 从详情页返回时恢复用
let originalOrder = null;    // 默认排序（匹配器返回的原始顺序）
let distanceOrder = null;    // 距离排序结果
let isDistanceSort = false;  // 当前是否按距离排序
let userCoords = null;       // 缓存用户位置

function init() {
  const section = document.getElementById('page-results');
  const listEl = document.getElementById('results-list');
  const countEl = document.getElementById('results-count');
  const emptyEl = document.getElementById('results-empty');
  const sortBtn = document.getElementById('park-sort-distance');

  // 每次进入页面重置排序状态
  isDistanceSort = false;
  distanceOrder = null;
  updateSortButton(sortBtn, false);

  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    cachedResults = null;
    originalOrder = null;
    distanceOrder = null;
    isDistanceSort = false;
    userCoords = null;
    navigate('#/filter');
  });

  // 距离排序按钮
  if (sortBtn) {
    sortBtn.addEventListener('click', () => handleSortClick(sortBtn, listEl, countEl));
  }

  // 从详情页返回 → 恢复缓存结果
  if (cachedResults) {
    const { results } = cachedResults;
    countEl.textContent = `(${results.length})`;
    emptyEl.style.display = 'none';
    originalOrder = results;
    renderCards(results, listEl, cachedResults.filters);
    return;
  }

  if (parks.length === 0) {
    fetch('js/data/parks.json')
      .then(r => r.json())
      .then(data => {
        parks = data;
        doMatch(listEl, countEl, emptyEl, sortBtn);
      })
      .catch(err => {
        console.error('加载 parks.json 失败:', err);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
      });
  } else {
    doMatch(listEl, countEl, emptyEl, sortBtn);
  }
}

function doMatch(listEl, countEl, emptyEl, sortBtn) {
  const filters = (window.__appState && window.__appState.filters) || {};
  const results = matchParks(parks, filters);

  cachedResults = { results, filters };
  originalOrder = results;
  isDistanceSort = false;
  updateSortButton(sortBtn, false);

  countEl.textContent = `(${results.length})`;

  if (results.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    if (sortBtn) sortBtn.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  if (sortBtn) sortBtn.style.display = '';
  renderCards(results, listEl, filters);
}

async function handleSortClick(sortBtn, listEl, countEl) {
  if (isDistanceSort) {
    // 取消距离排序 → 恢复默认顺序
    isDistanceSort = false;
    updateSortButton(sortBtn, false);
    renderCards(originalOrder, listEl, cachedResults.filters);
    const toast = await import('./toast.js?v=2');
    toast.showToast('已取消按距離排序');
    return;
  }

  // 如果已有缓存的距离排序结果，直接切换
  if (distanceOrder) {
    isDistanceSort = true;
    updateSortButton(sortBtn, true);
    renderCards(distanceOrder, listEl, cachedResults.filters);
    const toast = await import('./toast.js?v=2');
    toast.showToast('已按距離排序');
    return;
  }

  // 获取用户位置（每次都重新请求，不缓存失败）
  const geoResult = await getUserPosition();
  if (!geoResult.coords) {
    const toast = await import('./toast.js?v=2');
    toast.showToast('請打開手機定位<br>並允許瀏覽器使用定位權限 刷新即可', 3500);
    return;
  }
  userCoords = geoResult.coords;

  // 按距离排序
  distanceOrder = sortByDistance(originalOrder, userCoords.lat, userCoords.lng);
  isDistanceSort = true;
  updateSortButton(sortBtn, true);
  renderCards(distanceOrder, listEl, cachedResults.filters);

  const toast = await import('./toast.js?v=2');
  toast.showToast('已按距離排序');
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
    `;

    card.addEventListener('click', () => {
      sessionStorage.setItem('detailReferrer', '#/results');
      navigate(`#/park/${park.id}`);
    });

    container.appendChild(card);
  });
}

function getParkDescription(park, filters) {
  if (filters.activity && park.activityDescriptions && park.activityDescriptions[filters.activity]) {
    return park.activityDescriptions[filters.activity];
  }
  if (park.activityDescriptions) {
    const first = Object.values(park.activityDescriptions)[0];
    if (first) return first;
  }
  return park.description || '';
}

function destroy() {
  // 不清理 cachedResults——從詳情頁返回時需要保留
}

register('page-results', init, destroy);
