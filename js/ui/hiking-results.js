/* ========================================
   Hiking Results Page — 山径推荐结果
   ======================================== */

import { navigate, register } from '../core/router.js';
import { matchTrails } from '../core/trail-matcher.js';
import { getUserPosition, sortByDistance } from '../core/geo.js';

let trails = [];
let cachedResults = null;    // 从详情页返回时恢复用
let originalOrder = null;    // 默认排序（匹配器返回的原始顺序）
let distanceOrder = null;    // 距离排序结果
let isDistanceSort = false;  // 当前是否按距离排序
let userCoords = null;       // 缓存用户位置

function init() {
  const section = document.getElementById('page-hiking-results');
  const listEl = document.getElementById('hiking-results-list');
  const countEl = document.getElementById('hiking-results-count');
  const emptyEl = document.getElementById('hiking-results-empty');
  const sortBtn = document.getElementById('trail-sort-distance');

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
    navigate('#/hiking-filter');
  });

  // 距离排序按钮
  if (sortBtn) {
    sortBtn.addEventListener('click', () => handleSortClick(sortBtn, listEl, countEl));
  }

  // 从详情页返回 → 恢复缓存结果
  if (cachedResults) {
    const { results, filters } = cachedResults;
    countEl.textContent = `(${results.length})`;
    emptyEl.style.display = 'none';
    originalOrder = results;
    showNotice(filters);
    renderCards(results, listEl);
    if (sortBtn) sortBtn.style.display = results.length > 0 ? '' : 'none';
    return;
  }

  if (trails.length === 0) {
    fetch('js/data/trails.json')
      .then(r => r.json())
      .then(data => {
        trails = data;
        doMatch(listEl, countEl, emptyEl, sortBtn);
      })
      .catch(err => {
        console.error('加载 trails.json 失败:', err);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
      });
  } else {
    doMatch(listEl, countEl, emptyEl, sortBtn);
  }
}

function doMatch(listEl, countEl, emptyEl, sortBtn) {
  const filters = (window.__appState && window.__appState.hikingFilters) || {};
  const results = matchTrails(trails, filters);

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
  showNotice(filters);
  renderCards(results, listEl);
}

async function handleSortClick(sortBtn, listEl, countEl) {
  if (isDistanceSort) {
    // 取消距离排序 → 恢复默认顺序
    isDistanceSort = false;
    updateSortButton(sortBtn, false);
    renderCards(originalOrder, listEl);
    const toast = await import('./toast.js');
    toast.showToast('已取消按距離排序');
    return;
  }

  // 如果已有缓存的距离排序结果，直接切换
  if (distanceOrder) {
    isDistanceSort = true;
    updateSortButton(sortBtn, true);
    renderCards(distanceOrder, listEl);
    const toast = await import('./toast.js');
    toast.showToast('已按距離排序');
    return;
  }

  // 获取用户位置（每次都重新请求，不缓存失败）
  const geoResult = await getUserPosition();
  if (!geoResult.coords) {
    const toast = await import('./toast.js');
    toast.showToast('請打開手機定位\n並允許瀏覽器使用定位權限 刷新即可', 3500);
    return;
  }
  userCoords = geoResult.coords;

  // 按距离排序
  distanceOrder = sortByDistance(originalOrder, userCoords.lat, userCoords.lng);
  isDistanceSort = true;
  updateSortButton(sortBtn, true);
  renderCards(distanceOrder, listEl);

  const toast = await import('./toast.js');
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

function showNotice(filters) {
  const noticeEl = document.getElementById('hiking-results-notice');
  const noticeText = buildFilterNotice(filters);
  if (noticeEl && noticeText) {
    noticeEl.textContent = noticeText;
    noticeEl.style.display = 'block';
  } else if (noticeEl) {
    noticeEl.style.display = 'none';
  }
}

function buildFilterNotice(filters) {
  const parts = [];
  if (filters.difficulty === '著咩鞋都腳軟') {
    parts.push('⚠️ 你選擇了高難度路線，請確認體能充足、結伴同行並告知親友行程');
  } else if (filters.difficulty === '著行山鞋穩陣D') {
    parts.push('你選擇了中等難度，建議出發前查看天氣預報及路線最新狀況');
  }
  if (filters.surface === '山徑為主') {
    parts.push('天然泥路雨後濕滑，務必穿防滑行山鞋');
  } else if (filters.surface === '樓梯為主') {
    parts.push('沿途大量石級，建議佩戴護膝及使用行山杖');
  }
  if (filters.scenery === '瀑布溪澗') {
    parts.push('溯溪路段濕滑，注意石面青苔，雨季切勿下水');
  }
  return parts.length > 0 ? '📋 根據你的選擇：' + parts.join('；') : '';
}

function renderCards(trailList, container) {
  container.innerHTML = '';

  trailList.forEach(trail => {
    const sectionText = trail.trailName
      ? `${trail.trailName} — ${trail.section}`
      : trail.section;

    let tipsHtml = '';
    if (trail.tips) {
      tipsHtml += `<div class="trail-card__tips">💡 ${trail.tips}</div>`;
    }

    const card = document.createElement('div');
    card.className = 'trail-card';
    card.dataset.difficulty = trail.difficulty;
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="trail-card__body">
        <div class="trail-card__name">${trail.nameZh}</div>
        <div class="trail-card__section">${sectionText}</div>
        <div class="trail-card__meta">
          <span class="trail-card__stat">🕐 ${trail.durationHrs} 小時</span>
          <span class="trail-card__stat">🥾 ${trail.lengthKm} 公里</span>
        </div>
        <div class="trail-card__desc">${trail.description}</div>
        ${tipsHtml}
      </div>
      <span class="trail-card__difficulty">${trail.difficulty}</span>
    `;

    card.addEventListener('click', () => {
      sessionStorage.setItem('detailReferrer', '#/hiking-results');
      navigate(`#/trail/${trail.id}`);
    });

    container.appendChild(card);
  });
}

function destroy() {
  // 不清理 cachedResults——從詳情頁返回時需要保留
}

register('page-hiking-results', init, destroy);
