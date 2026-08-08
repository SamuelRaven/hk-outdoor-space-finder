/* ========================================
   Results Page — 公园推荐结果
   ======================================== */

import { navigate, register } from '../core/router.js';
import { matchParks } from '../core/matcher.js';

let parks = [];

function init() {
  const section = document.getElementById('page-results');
  const listEl = document.getElementById('results-list');
  const countEl = document.getElementById('results-count');
  const emptyEl = document.getElementById('results-empty');

  // 返回按钮
  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/filter');
  });

  // 加载公园数据
  if (parks.length === 0) {
    fetch('js/data/parks.json')
      .then(r => r.json())
      .then(data => {
        parks = data;
        doMatch(listEl, countEl, emptyEl);
      })
      .catch(err => {
        console.error('加载 parks.json 失败:', err);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
      });
  } else {
    doMatch(listEl, countEl, emptyEl);
  }
}

function doMatch(listEl, countEl, emptyEl) {
  const filters = (window.__appState && window.__appState.filters) || {};
  const results = matchParks(parks, filters);

  // 更新计数
  countEl.textContent = `(${results.length})`;

  if (results.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  renderCards(results, listEl, filters);
}

function renderCards(parkList, container, filters) {
  container.innerHTML = '';

  parkList.forEach(park => {
    const card = document.createElement('div');
    card.className = 'park-card';
    card.dataset.region = park.region;

    // 根据用户选择显示对应描述
    const desc = getParkDescription(park, filters);

    card.innerHTML = `
      <div class="park-card__body">
        <div class="park-card__name">${park.nameZh}</div>
        <div class="park-card__hours">${park.openingHours}</div>
        <div class="park-card__desc">${desc}</div>
      </div>
      <span class="park-card__region">${park.region}</span>
    `;

    container.appendChild(card);
  });
}

function getParkDescription(park, filters) {
  // 用户选了活动类型 → 用对应描述
  if (filters.activity && park.activityDescriptions && park.activityDescriptions[filters.activity]) {
    return park.activityDescriptions[filters.activity];
  }
  // 否则用公园类型描述（取第一个 activity 的描述作为通用描述）
  if (park.activityDescriptions) {
    const first = Object.values(park.activityDescriptions)[0];
    if (first) return first;
  }
  // fallback
  return park.description || '';
}

function destroy() {
  // 清理
}

register('page-results', init, destroy);
