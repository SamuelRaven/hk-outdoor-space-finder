/* ========================================
   Trail Detail Page — 山径详情
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js';

let trails = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-trail-detail');
  const trailId = getHashParam();
  const container = document.getElementById('trail-detail-content');

  // 返回按钮
  handlers.onBack = () => {
    const ref = sessionStorage.getItem('detailReferrer');
    navigate(ref || '#/hiking-results');
  };
  section.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);

  function render(trail) {
    if (!trail) {
      container.innerHTML = '<p class="detail-empty">找不到這條山徑 😢</p>';
      return;
    }

    const sectionText = trail.trailName
      ? `${trail.trailName} — ${trail.section}`
      : trail.section;

    const sceneryTags = (trail.scenery || [])
      .map(s => `<span class="detail-tag detail-tag--scenery">${s}</span>`)
      .join('');

    const diffClass = {
      '著波鞋就得': 'detail-badge--easy',
      '著行山鞋穩陣D': 'detail-badge--medium',
      '著咩鞋都腳軟': 'detail-badge--hard',
    }[trail.difficulty] || '';

    container.innerHTML = `
      <div class="detail-hero">
        <div class="detail-hero__name">${trail.nameZh}</div>
        <div class="detail-hero__section">${sectionText}</div>
        <div class="detail-hero__meta">
          <span class="detail-badge detail-badge--region">${trail.region} · ${trail.district}</span>
          <span class="detail-badge ${diffClass}">${trail.difficulty}</span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-block detail-block--half">
          <div class="detail-label">📏 長度</div>
          <div class="detail-value detail-value--big">${trail.lengthKm} 公里</div>
        </div>
        <div class="detail-block detail-block--half">
          <div class="detail-label">🕐 需時</div>
          <div class="detail-value detail-value--big">${trail.durationHrs} 小時</div>
        </div>
      </div>
      ${sceneryTags ? `
      <div class="detail-block">
        <div class="detail-label">🏞 風景</div>
        <div class="detail-tags">${sceneryTags}</div>
      </div>` : ''}
      <div class="detail-block">
        <div class="detail-label">🛤 路況</div>
        <div class="detail-value">${trail.surface}</div>
      </div>
      <div class="detail-block">
        <div class="detail-label">📝 簡介</div>
        <div class="detail-descs">
          <div class="detail-desc-item">${trail.description || '暫無簡介'}</div>
        </div>
      </div>
      ${trail.tips ? `
      <div class="detail-block detail-block--tips">
        <div class="detail-label">💡 實用貼士</div>
        <div class="detail-desc-item">${trail.tips}</div>
      </div>` : ''}
    `;
  }

  if (trails.length === 0) {
    fetch('js/data/trails.json')
      .then(r => r.json())
      .then(data => {
        trails = data;
        render(trails.find(t => t.id === trailId));
      });
  } else {
    render(trails.find(t => t.id === trailId));
  }
}

function destroy() {
  const section = document.getElementById('page-trail-detail');
  if (section && handlers.onBack) {
    const btn = section.querySelector('[data-action="back"]');
    if (btn) btn.removeEventListener('click', handlers.onBack);
  }
  handlers = {};
}

register('page-trail-detail', init, destroy);
