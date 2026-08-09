/* ========================================
   Park Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js';

let parks = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-park-detail');
  const parkId = getHashParam();
  const container = document.getElementById('park-detail-content');

  handlers.onBack = () => {
    const ref = sessionStorage.getItem('detailReferrer');
    navigate(ref || '#/results');
  };
  section.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);

  function render(park) {
    if (!park) {
      container.innerHTML = '<p class="detail-empty">找不到這個公園 😢</p>';
      return;
    }

    const activities = park.activityDescriptions ? Object.keys(park.activityDescriptions) : [];
    const activityTags = activities.map(a => `<span class="detail-tag">${a}</span>`).join('');

    const descItems = park.activityDescriptions
      ? Object.entries(park.activityDescriptions)
          .map(([act, desc]) => `<div class="detail-desc-item"><b>${act}</b>：${desc}</div>`)
          .join('')
      : `<div class="detail-desc-item">${park.description || '暫無簡介'}</div>`;

    container.innerHTML = `
      <div class="detail-hero">
        <div class="detail-hero__name">${park.nameZh}</div>
        <div class="detail-hero__meta">
          <span class="detail-badge detail-badge--region">${park.region} · ${park.district}</span>
          <span class="detail-badge detail-badge--type">${park.parkType || ''}</span>
        </div>
      </div>
      <div class="detail-block">
        <div class="detail-label">🕐 開放時間</div>
        <div class="detail-value">${park.openingHours || '請參閱場地公告'}</div>
      </div>
      ${activities.length ? `
      <div class="detail-block">
        <div class="detail-label">🏷 適合活動</div>
        <div class="detail-tags">${activityTags}</div>
      </div>` : ''}
      <div class="detail-block">
        <div class="detail-label">📝 介紹</div>
        <div class="detail-descs">${descItems}</div>
      </div>
    `;
  }

  if (parks.length === 0) {
    fetch('js/data/parks.json').then(r => r.json()).then(data => {
      parks = data;
      render(parks.find(p => p.id === parkId));
    });
  } else {
    render(parks.find(p => p.id === parkId));
  }
}

function destroy() {
  const section = document.getElementById('page-park-detail');
  if (section && handlers.onBack) {
    const btn = section.querySelector('[data-action="back"]');
    if (btn) btn.removeEventListener('click', handlers.onBack);
  }
  handlers = {};
}

register('page-park-detail', init, destroy);
