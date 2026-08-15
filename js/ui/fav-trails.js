/* ========================================
   Fav Trails Page — 山徑收藏列表
   ======================================== */

import { navigate, register } from '../core/router.js';
import { getFavorites } from '../core/favorites.js';
import { formatDuration } from '../core/format.js';

let trails = [];

function init() {
  const section = document.getElementById('page-fav-trails');
  const listEl = document.getElementById('fav-trails-list');
  const countEl = document.getElementById('fav-trails-count');
  const emptyEl = document.getElementById('fav-trails-empty');

  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/hiking-filter');
  });

  function render() {
    const favIds = getFavorites('trail');
    const favTrails = trails.filter(t => favIds.includes(t.id));

    countEl.textContent = `(${favTrails.length})`;

    if (favTrails.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = '';

    favTrails.forEach(trail => {
      const sectionText = trail.trailName
        ? `${trail.trailName} — ${trail.section}`
        : trail.section;

      const highestHtml = trail.highestPointM != null
        ? `<span class="trail-card__stat"><span class="emoji">⛰️</span> ${trail.highestPointM} 米</span>`
        : '';

      const card = document.createElement('div');
      card.className = 'trail-card';
      card.dataset.difficulty = trail.difficulty;
      card.dataset.region = trail.region;
      card.style.cursor = 'pointer';

      card.innerHTML = `
        <div class="trail-card__body">
          <div class="trail-card__name">${trail.nameZh}</div>
          <div class="trail-card__section">${sectionText}</div>
          <div class="trail-card__meta">
            <span class="trail-card__stat"><span class="emoji">🕐</span> ${formatDuration(trail.durationHrs)}</span>
            <span class="trail-card__stat"><span class="emoji">🥾</span> ${trail.lengthKm} 公里</span>
            ${highestHtml}
          </div>
          <div class="trail-card__desc">${trail.description}</div>
        </div>
        <span class="trail-card__difficulty">${trail.difficulty}</span>
      `;

      card.addEventListener('click', () => {
        sessionStorage.setItem('detailReferrer', '#/fav-trails');
        navigate(`#/trail/${trail.id}`);
      });

      listEl.appendChild(card);
    });
  }

  if (trails.length === 0) {
    fetch('js/data/trails.json?v=6')
      .then(r => r.json())
      .then(data => {
        trails = data;
        render();
      });
  } else {
    render();
  }
}

function destroy() {}

register('page-fav-trails', init, destroy);
