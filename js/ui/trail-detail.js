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

// ---- 简单哈希 ----
function trailHash(id, poolSize) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % poolSize;
}

// ---- 智能生成：適合人群（簡潔一句話） ----
function buildCrowd(trail) {
  const d = trail.difficulty;
  const km = trail.lengthKm || 0;
  const hi = trailHash(trail.id, 3);

  if (d === '著波鞋就得') {
    const tips = ['親子家庭、長者散步、情侶拍拖皆宜，新手入門首選。', '一家大細輕鬆出遊，推嬰兒車也無壓力。', '老少咸宜，無需特別體能，慢慢行最舒服。'];
    let base = tips[hi % tips.length];
    if (km > 8) base += ' 路程較長但平坦，預留半天即可。';
    return base;
  }
  if (d === '著行山鞋穩陣D') {
    const tips = ['適合有基本行山經驗的朋友，不建議完全新手。', '平時有運動習慣就能應付，建議結伴同行。', '中等挑戰，是從入門進階的最佳試煉。'];
    let base = tips[hi % tips.length];
    if (km > 8) base += ' 路程偏長，帶足補給提早出發。';
    return base;
  }
  // 著咩鞋都腳軟
  const tips = ['適合經驗豐富的進階山友，新手切勿獨自挑戰。', '體能要求高，出發前務必檢查天氣並做足準備。', '挑戰級路線，適合追求突破的行山老手。'];
  let base = tips[hi % tips.length];
  if (km > 10) base += ' 長途加高難度，務必帶足糧水預留全日。';
  return base;
}

// ---- 智能生成：裝備建議（精簡必需項） ----
function buildGear(trail) {
  const parts = [];
  const d = trail.difficulty;
  const s = trail.surface || '';
  const km = trail.lengthKm || 0;

  // 水量
  parts.push(km > 10 ? '水 2L+' : km > 5 ? '水 1.5L' : '水 1L');

  // 鞋子
  if (d === '著咩鞋都腳軟') parts.push('高幫防滑行山鞋');
  else if (d === '著行山鞋穩陣D') parts.push('防滑行山鞋');
  else parts.push('輕便波鞋');

  // 輔助
  if (s.includes('山徑') || d === '著咩鞋都腳軟') parts.push('行山杖');
  if (s.includes('樓梯')) parts.push('護膝');
  if (d === '著咩鞋都腳軟') parts.push('頭燈及急救包');
  if (km > 8 || d === '著咩鞋都腳軟') parts.push('高熱量補給食物');

  // 通用（精簡）
  parts.push('防曬及防蚊用品');

  return parts.join('、');
}

// ---- 智能生成：沿途看點（精簡一句，每種風景 × 3 變體） ----
function buildHighlights(trail) {
  const sceneries = trail.scenery || [];
  const hi = trailHash(trail.id, 3);
  const lines = [];

  const sceneryPool = {
    '山海之間': [
      '山巒與大海交織，海風伴行，每一步都是風景。',
      '翠綠山脊線配無垠藍海，是香港最經典的徒步景觀。',
      '居高望海，船隻劃過海面的白浪令人心曠神怡。',
    ],
    '深山林蔭': [
      '綠蔭蔽日如天然冷氣走廊，夏日行走也不覺熱。',
      '樹冠交織成綠色穹頂，鳥鳴與溪澗水聲相伴。',
      '密林深處空氣清甜，深吸一口滿是草木香。',
    ],
    '水庫平湖': [
      '湖面如鏡倒映山色，絕佳打卡位，值得駐足。',
      '水塘波光粼粼，隨光線變換不同色調。',
      '秋冬水位稍降，湖岸線別有蕭瑟之美。',
    ],
    '登頂大景': [
      '360 度無死角大景，山頂風大記得帶風衣。',
      '攻頂後的滿足感無可比擬，天地之大盡收眼底。',
      '一覽眾山小的感覺，所有汗水在這一刻都值了。',
    ],
    '瀑布溪澗': [
      '水聲潺潺，夏季最壯觀，注意石面濕滑。',
      '溪澗是炎夏的天然冷氣，脫鞋泡腳疲勞全消。',
      '清澈溪水在陽光下閃爍，偶見小魚穿梭。',
    ],
    '歷史遺跡': [
      '古道村落砲台遺址，感受香港百年印記。',
      '行山也是穿越時光的旅行，每處遺跡都有故事。',
      '老石碑古橋配黑白濾鏡，文青打卡必到。',
    ],
  };

  sceneries.forEach(s => {
    if (sceneryPool[s]) {
      lines.push(sceneryPool[s][hi % sceneryPool[s].length]);
    }
  });

  if (lines.length === 0) {
    lines.push('放慢腳步細心欣賞，每個轉角都有意想不到的風景。');
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
