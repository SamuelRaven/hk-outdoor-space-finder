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

// ---- 简单哈希，为每个公园选取稳定的变体 ----
function parkHash(id, poolSize) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % poolSize;
}

// ---- 智能生成：打卡建議（5 類 × 多變體，簡潔不囉嗦） ----
function buildParkSpot(park) {
  const type = park.parkType || '';
  const hi = parkHash(park.id, 5);

  const seasideSpots = [
    '黃昏時分的海濱步道是黃金打卡位，背光剪影效果一流。',
    '日落前半小時到達，金黃漸變粉紫的天際線張張都是明信片。',
    '清晨人煙稀少，晨光灑在水面上的波光是最佳拍攝素材。',
    '入夜後對岸燈火倒映水面，長曝光拍光影軌跡效果出眾。',
    '海濱彎位和觀景台是天然構圖框，利用欄杆長椅作前景層次豐富。',
  ];

  const urbanSpots = [
    '涼亭、人工湖、大樹下都是熱門取景點，非繁忙時段前往更寧靜。',
    '筆直行人道、圓形花圃、方正草坪——極簡構圖的好素材。',
    '午後陽光穿過樹葉的光斑是天然濾鏡，隨手拍都有電影感。',
    '遊樂設施在傍晚色彩最濃，夕陽側光拍出來特別溫暖。',
  ];

  const greenSpots = [
    '大片草地配遠山背景，野餐墊一鋪就是天然攝影棚。',
    '開闊感是市區無法複製的，廣角鏡將藍天綠地一次收入畫面。',
    '陰天反而是最佳拍攝天氣，光線均勻柔和，綠色更飽和。',
  ];

  const gardenSpots = [
    '對稱設計和幾何花圃極具構圖感，每個季節花卉主題都不同。',
    '透過圓形月門或漏窗框景拍攝，畫面自帶古典詩意。',
    '水景倒影是最被低估的打卡位，湖面如鏡上下對稱令人驚艷。',
    '留意腳下鵝卵石鋪地和頭頂飛檐翹角，細節藏在意想不到的角度。',
  ];

  const pocketSpots = [
    '鬧市中的小綠洲，長椅或樹蔭下隨手拍都有城市與自然的對比感。',
    '斑駁樹影、古舊石凳、攀藤花架——拍出質感日常生活照。',
    '手機微距模式拍花卉葉脈，小公園的微觀世界同樣精彩。',
  ];

  const maps = { '海濱長廊': seasideSpots, '市區公園': urbanSpots, '郊野綠地': greenSpots, '主題園林': gardenSpots, '休憩花園': pocketSpots };
  const pool = maps[type];
  return pool ? pool[hi % pool.length] : '隨心漫步，每個角落都可以是你的打卡位。';
}

// ---- 智能生成：出行貼士（每公園最多 3 條，簡潔實用） ----
function buildParkTips(park) {
  const parts = [];
  const times = park.bestTime || [];
  const type = park.parkType || '';
  const acts = park.activityTypes || [];
  const hi = parkHash(park.id, 3);

  // 選一條時間貼士
  if (times.includes('清晨') && hi === 0) parts.push('清晨人流最少，穿輕便運動裝出發最舒服');
  else if (times.includes('中午') && hi === 0) parts.push('正午陽光猛烈，記得防曬及定時補水');
  else if (times.includes('傍晚') && hi === 0) parts.push('黃昏光線變化快，想影靚相記得把握日落前後 20 分鐘');
  else if (times.includes('夜晚') && hi === 0) parts.push('夜間燈光較暗，注意腳下安全');

  // 選一條場地貼士
  if (type === '郊野綠地') parts.push('草地蚊蟲較多，出發前噴定防蚊液');
  else if (type === '海濱長廊') parts.push('海風較大，建議穿防風衣物，避免戴易吹走的帽');
  else if (type === '主題園林') parts.push('不妨先了解公園的歷史背景，遊覽時更有共鳴');

  // 選一條活動貼士（只取第一個匹配的）
  if (acts.includes('寵物出行')) {
    parts.push('記得帶寵物飲用水及垃圾袋，保持公園清潔');
  } else if (acts.includes('運動出汗')) {
    parts.push('運動前做好熱身，穿速乾衣物，公園飲水機可補水');
  } else if (acts.includes('親子放電')) {
    parts.push('帶小朋友記得備妥零食和水，玩得盡興又安心');
  }

  // 最多 3 條
  if (parts.length === 0) parts.push('放鬆心情，享受公園的綠意與寧靜');
  return parts.slice(0, 3).join('。') + '。';
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
