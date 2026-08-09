/* ========================================
   Trail Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js';
import { isFavorite, toggleFavorite } from '../core/favorites.js';

let trails = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-trail-detail');
  const trailId = getHashParam();
  const container = document.getElementById('trail-detail-content');
  const header = section.querySelector('.detail-page__header');

  // ---- 收藏星星按钮 ----
  let favBtn = header.querySelector('.fav-star');
  if (!favBtn) {
    favBtn = document.createElement('button');
    favBtn.className = 'fav-star';
    favBtn.setAttribute('aria-label', '收藏');
    header.appendChild(favBtn);
  }
  updateStar(favBtn, isFavorite('trail', trailId));

  handlers.onFav = async () => {
    const nowFav = toggleFavorite('trail', trailId);
    updateStar(favBtn, nowFav);
    const msg = nowFav ? '★ 已收藏' : '☆ 已取消收藏';
    const toast = await import('./toast.js');
    toast.showToast(msg);
  };
  favBtn.addEventListener('click', handlers.onFav);

  // ---- 返回 ----
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
      <!-- 包豪斯色条装饰 -->
      <div class="detail-color-bar">
        <span class="detail-color-bar__seg detail-color-bar__seg--red"></span>
        <span class="detail-color-bar__seg detail-color-bar__seg--blue"></span>
        <span class="detail-color-bar__seg detail-color-bar__seg--yellow"></span>
      </div>

      <div class="detail-hero">
        <div class="detail-hero__name">${trail.nameZh}</div>
        <div class="detail-hero__section">${sectionText}</div>
        <div class="detail-hero__meta">
          <span class="detail-badge detail-badge--region">${trail.region} · ${trail.district}</span>
          <span class="detail-badge ${diffClass}">${trail.difficulty}</span>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-block detail-block--half detail-block--length">
          <div class="detail-label">🥾 全長</div>
          <div class="detail-value detail-value--big">${trail.lengthKm} 公里</div>
        </div>
        <div class="detail-block detail-block--half detail-block--duration">
          <div class="detail-label">🕐 需時</div>
          <div class="detail-value detail-value--big">${trail.durationHrs} 小時</div>
        </div>
      </div>

      ${sceneryTags ? `
      <div class="detail-block detail-block--scenery">
        <div class="detail-label">🏞 風景</div>
        <div class="detail-tags">${sceneryTags}</div>
      </div>` : ''}

      <div class="detail-block detail-block--surface">
        <div class="detail-label">🛤 路況</div>
        <div class="detail-value">${trail.surface}</div>
      </div>

      <div class="detail-block detail-block--desc">
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

      <!-- 智能生成內容 -->
      <div class="detail-row">
        <div class="detail-block detail-block--half detail-block--extra-a">
          <div class="detail-label">👥 適合人群</div>
          <div class="detail-value">${buildCrowd(trail)}</div>
        </div>
        <div class="detail-block detail-block--half detail-block--extra-b">
          <div class="detail-label">🎒 裝備建議</div>
          <div class="detail-value">${buildGear(trail)}</div>
        </div>
      </div>
      <div class="detail-block detail-block--extra-c">
        <div class="detail-label">👀 沿途看點</div>
        <div class="detail-descs"><div class="detail-desc-item">${buildHighlights(trail)}</div></div>
      </div>

      <!-- 包豪斯底部装饰 -->
      <div class="detail-footer-accent">
        <span class="detail-footer-accent__dot"></span>
        <span class="detail-footer-accent__dot"></span>
        <span class="detail-footer-accent__dot"></span>
      </div>
    `;
  }

  if (trails.length === 0) {
    fetch('js/data/trails.json').then(r => r.json()).then(data => {
      trails = data;
      render(trails.find(t => t.id === trailId));
    });
  } else {
    render(trails.find(t => t.id === trailId));
  }
}

function updateStar(btn, isFav) {
  btn.innerHTML = isFav ? '★' : '☆';
  btn.dataset.active = isFav ? 'true' : '';
}

// ---- 智能生成：適合人群 ----
function buildCrowd(trail) {
  const d = trail.difficulty;
  if (d === '著波鞋就得') {
    return '適合任何年齡層，親子同行、長者散步、情侶拍拖皆宜。新手入門首選，無需特別體能要求。';
  } else if (d === '著行山鞋穩陣D') {
    return '適合有一定體能基礎的行山愛好者。建議有基本行山經驗，不適合完全新手或行動不便人士。';
  }
  return '適合體能較好、經驗豐富的行山者。路線涉及長距離或大幅爬升，不建議新手或體能一般人士挑戰。';
}

// ---- 智能生成：裝備建議 ----
function buildGear(trail) {
  const parts = [];
  const d = trail.difficulty;
  const s = trail.surface || '';

  parts.push('充足飲用水（最少 1.5L）');

  if (d === '著行山鞋穩陣D' || d === '著咩鞋都腳軟') {
    parts.push('防滑行山鞋');
  }
  if (s.includes('山徑') || s.includes('泥')) {
    parts.push('行山杖');
  }
  if (d === '著咩鞋都腳軟') {
    parts.push('急救包及頭燈');
    parts.push('高熱量補給食物');
  }
  if (s.includes('樓梯')) {
    parts.push('護膝');
  }
  parts.push('防曬及防蚊用品');
  return parts.join('、');
}

// ---- 智能生成：沿途看點 ----
function buildHighlights(trail) {
  const sceneries = trail.scenery || [];
  const lines = [];

  const sceneryMap = {
    '山海之間': '沿途飽覽山巒與大海交織的壯麗景觀，天氣晴朗時視野極佳，是拍攝日落的熱門位置。',
    '深山林蔭': '全程穿梭於茂密樹林之中，綠蔭蔽日，夏日行走亦不覺酷熱。可聆聽鳥鳴與溪澗流水聲。',
    '水庫平湖': '途經水塘或蓄水湖，平靜水面倒映山色，是絕佳的打卡位。建議在湖畔稍作停留。',
    '登頂大景': '登上高點可俯瞰整片區域的天際線，山頂風大建議帶備風衣，360 度無死角大景等你來。',
    '瀑布溪澗': '路線經過瀑布或溪澗，水聲潺潺，夏季水量充沛時最為壯觀。注意石面濕滑。',
    '歷史遺跡': '沿途可見古舊村落、砲台或廟宇遺址，感受香港百年歷史印記。不妨查查背後的故事再出發。',
  };

  sceneries.forEach(s => {
    if (sceneryMap[s]) lines.push(sceneryMap[s]);
  });

  if (lines.length === 0) {
    return '沿途自然風光優美，放慢腳步細心欣賞，每個轉角都可能藏著意想不到的風景。';
  }
  return lines.join(' ');
}

function destroy() {
  const section = document.getElementById('page-trail-detail');
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

register('page-trail-detail', init, destroy);
