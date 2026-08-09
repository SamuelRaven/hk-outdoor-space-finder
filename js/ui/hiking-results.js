/* ========================================
   Hiking Results Page — 山径推荐结果
   ======================================== */

import { navigate, register } from '../core/router.js';
import { matchTrails } from '../core/trail-matcher.js';

let trails = [];

function init() {
  const section = document.getElementById('page-hiking-results');
  const listEl = document.getElementById('hiking-results-list');
  const countEl = document.getElementById('hiking-results-count');
  const emptyEl = document.getElementById('hiking-results-empty');

  // 返回按钮
  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/hiking-filter');
  });

  // 加载山径数据
  if (trails.length === 0) {
    fetch('js/data/trails.json')
      .then(r => r.json())
      .then(data => {
        trails = data;
        doMatch(listEl, countEl, emptyEl);
      })
      .catch(err => {
        console.error('加载 trails.json 失败:', err);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
      });
  } else {
    doMatch(listEl, countEl, emptyEl);
  }
}

function doMatch(listEl, countEl, emptyEl) {
  const filters = (window.__appState && window.__appState.hikingFilters) || {};
  const results = matchTrails(trails, filters);

  // 更新计数
  countEl.textContent = `(${results.length})`;

  if (results.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  // 生成页面顶部统一的动态提示（只出现一次）
  const noticeEl = document.getElementById('hiking-results-notice');
  const noticeText = buildFilterNotice(filters);
  if (noticeEl && noticeText) {
    noticeEl.textContent = noticeText;
    noticeEl.style.display = 'block';
  } else if (noticeEl) {
    noticeEl.style.display = 'none';
  }

  renderCards(results, listEl);
}

/** 根据用户筛选条件生成一条统合提示 */
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
    const card = document.createElement('div');
    card.className = 'trail-card';
    card.dataset.difficulty = trail.difficulty;

    const sectionText = trail.trailName
      ? `${trail.trailName} — ${trail.section}`
      : trail.section;

    // 只保留 trail 自带的实用贴士
    let tipsHtml = '';
    if (trail.tips) {
      tipsHtml += `<div class="trail-card__tips">💡 ${trail.tips}</div>`;
    }

    card.innerHTML = `
      <div class="trail-card__body">
        <div class="trail-card__name">${trail.nameZh}</div>
        <div class="trail-card__section">${sectionText}</div>
        <div class="trail-card__meta">
          <span class="trail-card__stat">🕐 ${trail.durationHrs} 小時</span>
          <span class="trail-card__stat">📏 ${trail.lengthKm} 公里</span>
        </div>
        <div class="trail-card__desc">${trail.description}</div>
        ${tipsHtml}
      </div>
      <span class="trail-card__difficulty">${trail.difficulty}</span>
    `;

    container.appendChild(card);
  });
}

function destroy() {
  // 清理
}

register('page-hiking-results', init, destroy);
