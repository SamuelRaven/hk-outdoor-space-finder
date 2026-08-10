/* ========================================
   Hiking Results Page — 山径推荐结果
   ======================================== */

import { navigate, register } from '../core/router.js?v=4';
import { matchTrails } from '../core/trail-matcher.js?v=4';
import { getUserPosition, sortByDistance } from '../core/geo.js?v=4';

let trails = [];
let cachedResults = null;    // 从详情页返回时恢复用
let originalOrder = null;    // 默认排序（匹配器返回的原始顺序）
let distanceOrder = null;    // 距离排序结果
let isDistanceSort = false;  // 当前是否按距离排序
let userCoords = null;       // 缓存用户位置
let currentPage = 1;         // 当前页码
const PAGE_SIZE = 10;

function init() {
  const section = document.getElementById('page-hiking-results');
  const listEl = document.getElementById('hiking-results-list');
  const countEl = document.getElementById('hiking-results-count');
  const emptyEl = document.getElementById('hiking-results-empty');
  const sortBtn = document.getElementById('trail-sort-distance');
  const pgnEl = document.getElementById('hiking-pagination');

  // 每次进入页面重置排序状态和页码
  isDistanceSort = false;
  distanceOrder = null;
  currentPage = 1;
  updateSortButton(sortBtn, false);

  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    cachedResults = null;
    originalOrder = null;
    distanceOrder = null;
    isDistanceSort = false;
    userCoords = null;
    currentPage = 1;
    navigate('#/hiking-filter');
  });

  // 距离排序按钮
  if (sortBtn) {
    sortBtn.addEventListener('click', () => handleSortClick(sortBtn, listEl, countEl, pgnEl));
  }

  // 从详情页返回 → 恢复缓存结果
  if (cachedResults) {
    const { allResults, filters } = cachedResults;
    countEl.textContent = `(${allResults.length})`;
    emptyEl.style.display = 'none';
    originalOrder = allResults;
    showNotice(filters);
    if (isDistanceSort && distanceOrder) {
      renderCards(distanceOrder.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), listEl);
    } else {
      renderCards(allResults.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), listEl);
    }
    renderPagination(allResults.length, pgnEl, listEl, countEl, sortBtn);
    if (sortBtn) sortBtn.style.display = allResults.length > 0 ? '' : 'none';
    return;
  }

  if (trails.length === 0) {
    fetch('js/data/trails.json')
      .then(r => r.json())
      .then(data => {
        trails = data;
        doMatch(listEl, countEl, emptyEl, sortBtn, pgnEl);
      })
      .catch(err => {
        console.error('加载 trails.json 失败:', err);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
      });
  } else {
    doMatch(listEl, countEl, emptyEl, sortBtn, pgnEl);
  }
}

function doMatch(listEl, countEl, emptyEl, sortBtn, pgnEl) {
  const filters = (window.__appState && window.__appState.hikingFilters)
    || (() => { try { const s = sessionStorage.getItem('trailFilters'); return s ? JSON.parse(s) : {}; } catch { return {}; } })();
  const allResults = matchTrails(trails, filters);

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
  showNotice(filters);
  const pageItems = allResults.slice(0, PAGE_SIZE);
  renderCards(pageItems, listEl);
  renderPagination(allResults.length, pgnEl, listEl, countEl, sortBtn);
}

async function handleSortClick(sortBtn, listEl, countEl, pgnEl) {
  if (isDistanceSort) {
    isDistanceSort = false;
    currentPage = 1;
    updateSortButton(sortBtn, false);
    renderCards(originalOrder.slice(0, PAGE_SIZE), listEl);
    renderPagination(originalOrder.length, pgnEl, listEl, countEl, sortBtn);
    const toast = await import('./toast.js?v=4');
    toast.showToast('已取消按距離排序');
    return;
  }

  if (distanceOrder) {
    isDistanceSort = true;
    currentPage = 1;
    updateSortButton(sortBtn, true);
    renderCards(distanceOrder.slice(0, PAGE_SIZE), listEl);
    renderPagination(distanceOrder.length, pgnEl, listEl, countEl, sortBtn);
    const toast = await import('./toast.js?v=4');
    toast.showToast('已按距離排序');
    return;
  }

  const geoResult = await getUserPosition();
  if (!geoResult.coords) {
    const toast = await import('./toast.js?v=4');
    toast.showToast('請允許瀏覽器使用定位權限');
    return;
  }
  userCoords = geoResult.coords;

  distanceOrder = sortByDistance(originalOrder, userCoords.lat, userCoords.lng);
  isDistanceSort = true;
  currentPage = 1;
  updateSortButton(sortBtn, true);
  renderCards(distanceOrder.slice(0, PAGE_SIZE), listEl);
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
    renderCards(items, listEl);
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderPagination(totalItems, container, listEl, countEl, sortBtn);
  };

  let html = '';
  html += `<button class="pgn-btn" ${currentPage===1?'disabled':''} title="上一頁">←</button>`;

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

  html += `<button class="pgn-btn" ${currentPage===totalPages?'disabled':''} title="下一頁">→</button>`;

  container.innerHTML = html;

  const children = container.querySelectorAll('.pgn-btn, .pgn-num');
  children.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.textContent;
      if (t === '←') { if (currentPage > 1) build(currentPage-1); return; }
      if (t === '→') { if (currentPage < totalPages) build(currentPage+1); return; }
      const n = parseInt(t);
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
