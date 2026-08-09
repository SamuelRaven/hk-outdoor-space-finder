/* ========================================
   Park Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js';
import { isFavorite, toggleFavorite } from '../core/favorites.js';

let parks = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-park-detail');
  const parkId = getHashParam();
  const container = document.getElementById('park-detail-content');
  const header = section.querySelector('.detail-page__header');

  // ---- 收藏星星按钮 ----
  let favBtn = header.querySelector('.fav-star');
  if (!favBtn) {
    favBtn = document.createElement('button');
    favBtn.className = 'fav-star';
    favBtn.setAttribute('aria-label', '收藏');
    header.appendChild(favBtn);
  }
  updateStar(favBtn, isFavorite('park', parkId));

  handlers.onFav = async () => {
    const nowFav = toggleFavorite('park', parkId);
    updateStar(favBtn, nowFav);
    const msg = nowFav ? '★ 已收藏' : '☆ 已取消收藏';
    const toast = await import('./toast.js');
    toast.showToast(msg);
  };
  favBtn.addEventListener('click', handlers.onFav);

  // ---- 返回 ----
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

    // 最佳時段
    const bestTimeTags = (park.bestTime || [])
      .map(t => `<span class="detail-tag detail-tag--time">${t}</span>`).join('');

    // 活動標籤
    const activities = park.activityTypes || [];
    const activityTags = activities
      .map(a => `<span class="detail-tag detail-tag--activity">${a}</span>`).join('');

    // 包豪斯交替颜色映射
    const BAUHAUS_COLORS = ['red', 'blue', 'yellow', 'black'];

    // 各活動詳細介紹 — 用交替包豪斯彩色左邊框
    const descBlocks = park.activityDescriptions
      ? Object.entries(park.activityDescriptions)
          .map(([act, desc], i) => `
            <div class="detail-desc-card detail-desc-card--${BAUHAUS_COLORS[i % 4]}">
              <div class="detail-desc-card__act">${act}</div>
              <div class="detail-desc-card__text">${desc}</div>
            </div>`)
          .join('')
      : `<div class="detail-desc-card"><div class="detail-desc-card__text">${park.description || '暫無簡介'}</div></div>`;

    container.innerHTML = `
      <!-- 包豪斯色条装饰 -->
      <div class="detail-color-bar">
        <span class="detail-color-bar__seg detail-color-bar__seg--red"></span>
        <span class="detail-color-bar__seg detail-color-bar__seg--blue"></span>
        <span class="detail-color-bar__seg detail-color-bar__seg--yellow"></span>
      </div>

      <div class="detail-hero">
        <div class="detail-hero__name">${park.nameZh}</div>
        <div class="detail-hero__meta">
          <span class="detail-badge detail-badge--region">${park.region} · ${park.district}</span>
          <span class="detail-badge detail-badge--type">${park.parkType || ''}</span>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-block detail-block--half detail-block--time">
          <div class="detail-label">🕐 開放時間</div>
          <div class="detail-value detail-value--big">${park.openingHours || '-'}</div>
        </div>
        ${bestTimeTags ? `
        <div class="detail-block detail-block--half detail-block--besttime">
          <div class="detail-label">☀️ 最佳時段</div>
          <div class="detail-tags">${bestTimeTags}</div>
        </div>` : ''}
      </div>

      ${activities.length ? `
      <div class="detail-block detail-block--activities">
        <div class="detail-label">🏷 適合活動</div>
        <div class="detail-tags">${activityTags}</div>
      </div>` : ''}

      <div class="detail-block">
        <div class="detail-label">📝 做咩好</div>
        <div class="detail-descs">${descBlocks}</div>
      </div>

      <!-- 智能生成內容 -->
      <div class="detail-row">
        <div class="detail-block detail-block--half detail-block--extra-a">
          <div class="detail-label">👥 適合人群</div>
          <div class="detail-value">${buildParkCrowd(park)}</div>
        </div>
        <div class="detail-block detail-block--half detail-block--extra-b">
          <div class="detail-label">📸 打卡建議</div>
          <div class="detail-value">${buildParkSpot(park)}</div>
        </div>
      </div>
      <div class="detail-block detail-block--extra-c">
        <div class="detail-label">💡 出行貼士</div>
        <div class="detail-descs"><div class="detail-desc-item">${buildParkTips(park)}</div></div>
      </div>

      <!-- 包豪斯底部装饰 -->
      <div class="detail-footer-accent">
        <span class="detail-footer-accent__dot"></span>
        <span class="detail-footer-accent__dot"></span>
        <span class="detail-footer-accent__dot"></span>
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

function updateStar(btn, isFav) {
  btn.innerHTML = isFav ? '★' : '☆';
  btn.dataset.active = isFav ? 'true' : '';
}

// ---- 智能生成：適合人群 ----
function buildParkCrowd(park) {
  const acts = park.activityTypes || [];
  const groups = [];
  if (acts.includes('親子放電')) groups.push('親子家庭');
  if (acts.includes('寵物出行')) groups.push('養寵物人士');
  if (acts.includes('運動出汗')) groups.push('運動愛好者');
  if (acts.includes('散步看景')) groups.push('情侶及長者');
  if (acts.includes('安靜發呆')) groups.push('需要獨處充電的人');
  return groups.length > 0 ? groups.join('、') : '各類人士';
}

// ---- 智能生成：打卡建議 ----
function buildParkSpot(park) {
  const type = park.parkType || '';
  const map = {
    '海濱長廊': '黃昏時分的海濱步道是黃金打卡位，背光剪影效果一流。沿著海岸線走，每個彎位都有不同景緻。',
    '市區公園': '公園內的涼亭、人工湖、大樹下都是熱門取景點。建議在非繁忙時段前往，獨享靜謐氛圍。',
    '郊野綠地': '大片草地配上遠山背景，野餐墊一鋪就是天然攝影棚。清晨或雨後光線最柔和。',
    '主題園林': '園內的對稱設計和幾何花圃極具構圖感，帶上廣角鏡頭吧。每個季節的花卉主題都不同。',
    '休憩花園': '鬧市中的小綠洲，找個長椅或樹蔭下的角落，隨手拍都有城市與自然交融的對比感。',
  };
  return map[type] || '隨心漫步，每個角落都可以是你的打卡位。';
}

// ---- 智能生成：出行貼士 ----
function buildParkTips(park) {
  const parts = [];
  const times = park.bestTime || [];
  const type = park.parkType || '';

  if (times.includes('清晨') || times.includes('夜晚')) {
    parts.push('早晚溫差較大，建議多帶一件薄外套');
  }
  if (times.includes('中午') || times.includes('下午')) {
    parts.push('日照強烈時段注意防曬，帶備充足飲用水');
  }
  if (type === '郊野綠地') {
    parts.push('草地可能蚊蟲較多，出發前噴定防蚊液');
  }
  if (type === '海濱長廊') {
    parts.push('海風較大，建議穿著防風衣物，避免戴易吹走的帽子');
  }
  if (park.activityTypes && park.activityTypes.includes('寵物出行')) {
    parts.push('記得帶備寵物飲用水及垃圾袋，保持公園清潔');
  }
  if (park.activityTypes && park.activityTypes.includes('運動出汗')) {
    parts.push('運動前做好熱身，公園內設有飲水機可補充水分');
  }

  if (parts.length === 0) parts.push('放鬆心情，享受在公園的每一刻');
  return parts.join('。') + '。';
}

function destroy() {
  const section = document.getElementById('page-park-detail');
  if (section && handlers.onBack) {
    const btn = section.querySelector('[data-action="back"]');
    if (btn) btn.removeEventListener('click', handlers.onBack);
  }
  if (section && handlers.onFav) {
    const favBtn = section.querySelector('.fav-star');
    if (favBtn) favBtn.removeEventListener('click', handlers.onFav);
  }
  handlers = {};
}

register('page-park-detail', init, destroy);
