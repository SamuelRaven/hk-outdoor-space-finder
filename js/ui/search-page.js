/* ========================================
   Search Page — 搜尋公園和山徑
   ======================================== */

import { navigate, register } from '../core/router.js';

let parks = [];
let trails = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-search');
  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  const emptyEl = document.getElementById('search-empty');

  // 返回按钮
  handlers.onBack = () => navigate('#/');
  section.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);

  // 自动聚焦 + 清空搜索框
  input.value = '';
  resultsEl.innerHTML = '';
  emptyEl.style.display = 'none';
  setTimeout(() => input.focus(), 100);

  // 加载数据
  const loadParkPromise = parks.length === 0
    ? fetch('js/data/parks.json').then(r => r.json()).then(d => { parks = d; })
    : Promise.resolve();
  const loadTrailPromise = trails.length === 0
    ? fetch('js/data/trails.json').then(r => r.json()).then(d => { trails = d; })
    : Promise.resolve();

  Promise.all([loadParkPromise, loadTrailPromise]).then(() => {
    // 监听输入
    handlers.onInput = () => doSearch(input.value.trim(), resultsEl, emptyEl);
    input.addEventListener('input', handlers.onInput);

    // 如果 URL 带了搜索词（#/search/xxx）
    if (input.value) {
      doSearch(input.value.trim(), resultsEl, emptyEl);
    }
  });
}

function doSearch(query, resultsEl, emptyEl) {
  if (!query) {
    resultsEl.innerHTML = '';
    emptyEl.style.display = 'none';
    return;
  }

  const q = query.toLowerCase();

  // 搜索公园：名称、地区、区域、公园类型
  const matchedParks = parks.filter(p =>
    p.nameZh.toLowerCase().includes(q) ||
    (p.district && p.district.includes(query)) ||
    (p.region && p.region.includes(query)) ||
    (p.parkType && p.parkType.includes(query))
  ).slice(0, 10);

  // 搜索山径：名称、径名、地区、难度
  const matchedTrails = trails.filter(t =>
    t.nameZh.toLowerCase().includes(q) ||
    (t.trailName && t.trailName.includes(query)) ||
    (t.district && t.district.includes(query)) ||
    (t.region && t.region.includes(query)) ||
    t.section.includes(query)
  ).slice(0, 10);

  const total = matchedParks.length + matchedTrails.length;

  if (total === 0) {
    resultsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  let html = `<div class="search-results__count">找到 ${total} 個結果</div>`;

  // 公园结果
  if (matchedParks.length > 0) {
    html += '<div class="search-section-title">🌳 公園</div>';
    matchedParks.forEach(p => {
      html += `
        <div class="park-card search-result-card" data-region="${p.region}" data-park-id="${p.id}">
          <div class="park-card__body">
            <div class="park-card__name">${p.nameZh}</div>
            <div class="park-card__hours">${p.region} · ${p.district} ｜ ${p.parkType || ''}</div>
            <div class="park-card__desc">${p.description || ''}</div>
          </div>
          <span class="park-card__region">${p.region}</span>
        </div>`;
    });
  }

  // 山径结果
  if (matchedTrails.length > 0) {
    html += '<div class="search-section-title">⛰ 山徑</div>';
    matchedTrails.forEach(t => {
      const sectionText = t.trailName ? `${t.trailName} — ${t.section}` : t.section;
      html += `
        <div class="trail-card search-result-card" data-difficulty="${t.difficulty}" data-trail-id="${t.id}">
          <div class="trail-card__body">
            <div class="trail-card__name">${t.nameZh}</div>
            <div class="trail-card__section">${sectionText}</div>
            <div class="trail-card__meta">
              <span class="trail-card__stat">🕐 ${t.durationHrs} 小時</span>
              <span class="trail-card__stat">📏 ${t.lengthKm} 公里</span>
            </div>
            <div class="trail-card__desc">${t.description || ''}</div>
          </div>
          <span class="trail-card__difficulty">${t.difficulty}</span>
        </div>`;
    });
  }

  resultsEl.innerHTML = html;

  // 点击事件：公园 → 详情，山径 → 详情
  resultsEl.querySelectorAll('[data-park-id]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      sessionStorage.setItem('detailReferrer', '#/search');
      navigate(`#/park/${card.dataset.parkId}`);
    });
  });
  resultsEl.querySelectorAll('[data-trail-id]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      sessionStorage.setItem('detailReferrer', '#/search');
      navigate(`#/trail/${card.dataset.trailId}`);
    });
  });
}

function destroy() {
  const section = document.getElementById('page-search');
  if (section && handlers.onBack) {
    const btn = section.querySelector('[data-action="back"]');
    if (btn) btn.removeEventListener('click', handlers.onBack);
  }
  const input = document.getElementById('search-input');
  if (input && handlers.onInput) {
    input.removeEventListener('input', handlers.onInput);
  }
  handlers = {};
}

register('page-search', init, destroy);
