/* ========================================
   Fav Parks Page — 公園收藏列表
   ======================================== */

import { navigate, register } from '../core/router.js';
import { getFavorites } from '../core/favorites.js';

let parks = [];

const PARK_TYPE_COLORS = { '海濱長廊': 'blue', '市區公園': 'purple', '郊野綠地': 'green', '主題園林': 'teal', '休憩花園': 'orange' };

function init() {
  const section = document.getElementById('page-fav-parks');
  const listEl = document.getElementById('fav-parks-list');
  const countEl = document.getElementById('fav-parks-count');
  const emptyEl = document.getElementById('fav-parks-empty');

  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/filter');
  });

  function render() {
    const favIds = getFavorites('park');
    const favParks = parks.filter(p => favIds.includes(p.id));

    countEl.textContent = `(${favParks.length})`;

    if (favParks.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = '';

    favParks.forEach(park => {
      let desc = park.description || '';

      const card = document.createElement('div');
      card.className = 'park-card';
      card.dataset.region = park.region;
      card.style.cursor = 'pointer';

      card.innerHTML = `
        <div class="park-card__body">
          <div class="park-card__name">${park.nameZh}</div>
          <div class="park-card__hours"><span class="emoji">🕐</span> ${park.openingHours}</div>
          <div class="park-card__desc">${desc}</div>
        </div>
        <span class="park-card__type park-card__type--${PARK_TYPE_COLORS[park.parkType]}">${park.parkType}</span>
      `;

      card.addEventListener('click', () => {
        sessionStorage.setItem('detailReferrer', '#/fav-parks');
        navigate(`#/park/${park.id}`);
      });

      listEl.appendChild(card);
    });
  }

  if (parks.length === 0) {
    fetch('js/data/parks.json?v=7')
      .then(r => r.json())
      .then(data => {
        parks = data;
        render();
      });
  } else {
    render();
  }
}

function destroy() {}

register('page-fav-parks', init, destroy);
