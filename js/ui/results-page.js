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

  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/filter');
  });

  // 事件委托：点击卡片 → 详情页
  listEl.addEventListener('click', (e) => {
    const card = e.target.closest('[data-park-id]');
    if (!card) return;
    sessionStorage.setItem('detailReferrer', '#/results');
    navigate(`#/park/${card.dataset.parkId}`);
  });

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
    const desc = getParkDescription(park, filters);

    const card = document.createElement('div');
    card.className = 'park-card';
    card.dataset.region = park.region;
    card.dataset.parkId = park.id;

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
  if (filters.activity && park.activityDescriptions && park.activityDescriptions[filters.activity]) {
    return park.activityDescriptions[filters.activity];
  }
  if (park.activityDescriptions) {
    const first = Object.values(park.activityDescriptions)[0];
    if (first) return first;
  }
  return park.description || '';
}

function destroy() {}

register('page-results', init, destroy);
