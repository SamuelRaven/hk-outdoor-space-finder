/* ========================================
   Trail Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js?v=4';
import { isFavorite, toggleFavorite } from '../core/favorites.js?v=4';
import { shareItem, getTrailShareText } from '../core/share.js?v=4';

let trails = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-trail-detail');
  const trailId = getHashParam();
  const container = document.getElementById('trail-detail-content');
  const header = section.querySelector('.detail-page__header');

  // 创建操作按钮容器（收藏 + 分享）
  let actions = header.querySelector('.detail-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'detail-actions';
    header.appendChild(actions);
  }

  let favBtn = actions.querySelector('.fav-star');
  if (!favBtn) {
    favBtn = document.createElement('button');
    favBtn.className = 'fav-star';
    favBtn.setAttribute('aria-label', '收藏');
    actions.appendChild(favBtn);
  }
  updateStar(favBtn, isFavorite('trail', trailId));

  let shareBtn = actions.querySelector('.share-btn');
  if (!shareBtn) {
    shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn';
    shareBtn.setAttribute('aria-label', '分享');
    shareBtn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M22,12 L1,4 L8,12 L1,20 Z"/><line x1="22" y1="12" x2="8" y2="12"/></svg>';
    actions.appendChild(shareBtn);
  }

  handlers.onFav = async () => {
    const nowFav = toggleFavorite('trail', trailId);
    updateStar(favBtn, nowFav);
    const msg = nowFav ? '★ 已收藏' : '☆ 已取消收藏';
    const toast = await import('./toast.js?v=4');
    toast.showToast(msg);
  };
  favBtn.addEventListener('click', handlers.onFav);

  handlers.onShare = async () => {
    const trail = trails.find(t => t.id === trailId);
    if (!trail) return;
    const result = await shareItem(getTrailShareText(trail));
    const toast = await import('./toast.js?v=4');
    if (result === 'wechat') toast.showToast('暫不支持微信分享');
    else if (result === 'shared') setTimeout(() => toast.showToast('已分享', 4000), 300);
  };
  shareBtn.addEventListener('click', handlers.onShare);

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

      <p class="detail-ai-note">部分內容由 AI 輔助生成，僅供參考</p>

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

// ---- hash (單次大 hash + bit 段提取 → 不同 tag 完全獨立) ----
function bh(id, seed) {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ---- 適合人群 (難度 × 長度推導，每組合 3-4 種同義表達) ----
function buildCrowd(trail) {
  const d = trail.difficulty;
  const km = trail.lengthKm || 0;

  // 長度分檔
  let range;
  if (km <= 5) range = 'short';
  else if (km <= 10) range = 'mid';
  else range = 'long';

  // seed=1, 每組合 3-4 變體
  const hi = bh(trail.id, 1) % 4;

  const pool = {
    '著波鞋就得': {
      short: [
        '老少咸宜，新手入門首選，親子家庭皆適合。',
        '一家大細輕鬆行，完全無壓力。',
        '平坦易行，推嬰兒車也無問題。',
        '零門檻路線，任何人穿上波鞋就能出發。',
      ],
      mid: [
        '難度低但路程稍長，適合有耐力的初階山友。',
        '適合初學者及家庭，平緩好行但預留半天。',
        '全程平路為主，只要不趕時間慢慢行都應付到。',
        '初階中的長線，適合想挑戰距離但不想爬坡的朋友。',
      ],
      long: [
        '平路為主但距離長，適合有耐力的入門山友。',
        '難度不高但路程不短，考驗的是腳力而非技術。',
        '全程平坦好行，是訓練耐力的好選擇。',
        '入門級長線，適合喜歡慢慢走、享受沿途風景的旅人。',
      ],
    },
    '著行山鞋穩陣D': {
      short: [
        '適合有基本行山經驗的朋友，中等體能可應付。',
        '短程但有坡度，是從入門進階的理想試煉。',
        '路段有些爬升但距離短，初階想挑戰的首選。',
        '中等難度入門，適合想試試自己體能水平的人。',
      ],
      mid: [
        '適合有規律運動習慣的行山愛好者，建議結伴。',
        '中等體能要求，平時有做運動就能享受。',
        '進階入門的好選擇，有挑戰但不至於太辛苦。',
        '難度與距離均衡，是週末鍛鍊的絕佳路線。',
      ],
      long: [
        '中等難度但路程長，需穩定體能，宜提早出發。',
        '適合有中級經驗的山友，考驗續航力多於技術。',
        '路線長且有些爬升，帶足補給預留全日。',
        '需要一定體能基礎，但技術門檻不高。',
      ],
    },
    '著咩鞋都腳軟': {
      short: [
        '短程但技術要求高，適合經驗豐富的山友。',
        '距離雖短但路段陡峭，新手切勿獨自挑戰。',
        '體能消耗大，是高難度的短途衝刺路線。',
        '路短但絕不輕鬆，適合追求挑戰的資深山友。',
      ],
      mid: [
        '體能要求高，適合有豐富經驗的進階行山者。',
        '挑戰級路線，出發前務必檢查天氣及裝備。',
        '需要一定攀爬技巧，不適合畏高或體能一般者。',
        '給準備好突破自己的山友——爬升多、路段 technical。',
      ],
      long: [
        '高難度長途，僅推薦體能充沛且裝備齊全的資深山友。',
        '技術與體能的雙重考驗，新手絕對不要越級挑戰。',
        '是給行山老手的終極試煉，帶足糧水預留全日。',
        '整段路對體能和意志都是考驗，做足準備再出發。',
      ],
    },
  };

  const arr = pool[d] && pool[d][range];
  return arr ? arr[hi] : '請按自身體能判斷是否適合前往。';
}

// ---- 裝備建議 (從難度 + 路況 + 長度推導，項目級變化已足夠) ----
function buildGear(trail) {
  const parts = [];
  const d = trail.difficulty;
  const s = trail.surface || '';
  const km = trail.lengthKm || 0;

  parts.push(km > 10 ? '水 2L+' : km > 5 ? '水 1.5L' : '水 1L');

  if (d === '著咩鞋都腳軟') parts.push('高幫防滑行山鞋');
  else if (d === '著行山鞋穩陣D') parts.push('防滑行山鞋');
  else parts.push('輕便波鞋');

  if (s.includes('山徑') || d === '著咩鞋都腳軟') parts.push('行山杖');
  if (s.includes('樓梯')) parts.push('護膝');
  if (d === '著咩鞋都腳軟') parts.push('頭燈及急救包');
  if (km > 8 || d === '著咩鞋都腳軟') parts.push('高熱量補給食物');

  parts.push('防曬及防蚊用品');
  return parts.join('、');
}

// ---- 沿途看點 (每類風景 3-4 種定義表述 + seed+tagIndex 確保每 tag 不同) ----
function buildHighlights(trail) {
  const sceneries = trail.scenery || [];

  // 風景標籤 → 多種定義表述（同義改寫，非編造）
  const defs = {
    '山海之間': [
      '路段沿海岸山脊而行，可同時欣賞山景與海景',
      '山與海交織的路段，一邊是翠綠山巒，一邊是蔚藍大海',
      '沿途山脊線與海岸線並行，視野極其開闊',
      '穿梭於山海交界處，同時擁有山的沉穩與海的遼闊',
    ],
    '深山林蔭': [
      '穿梭於樹木茂密的林間，綠蔭蔽日涼爽舒適',
      '密林覆蓋的路段，樹冠交織成天然遮陽棚',
      '走在林蔭小徑上，陽光透過樹葉灑落斑駁光影',
      '被林木包圍的路段，空氣清新生機盎然',
    ],
    '水庫平湖': [
      '途經水塘或湖泊，平靜水面倒映周邊山色',
      '水庫路段湖面如鏡，山影倒映其中格外寧靜',
      '沿水塘而行，波光粼粼的湖面隨光線變換色調',
      '傍水路段，開闊水面與周邊山景構成絕佳景觀',
    ],
    '登頂大景': [
      '路段包含高點或山頂，視野開闊可遠眺周邊',
      '攀上制高點後擁有 360 度全景視野',
      '登上山頂俯瞰四周，天地遼闊盡收眼底',
      '高點路段視野無遮擋，是遠眺周邊地貌的最佳位置',
    ],
    '瀑布溪澗': [
      '沿途有瀑布或溪流，夏季水量充沛時最為壯觀',
      '溪澗相伴的路段，水聲潺潺帶來清涼感受',
      '路經瀑布溪流，水霧撲面是炎夏的最佳降溫',
      '依水而行，溪水清澈見底，是夏日行山的首選',
    ],
    '歷史遺跡': [
      '途經古道、村落或戰時遺址等歷史地標',
      '路段散落著歷史建築與遺址，充滿人文氣息',
      '走過百年古道與舊村落，每處遺跡都有沉澱的故事',
      '行山同時穿越歷史，沿途可見歲月留下的印記',
    ],
  };

  const H = bh(trail.id, 2);

  const lines = sceneries
    .filter(s => defs[s])
    .map((s, i) => {
      const arr = defs[s];
      // 每 tag 取不同 bit 段，確保同一 trail 的不同 tag 取到不同 variant
      return arr[(H >> (i * 8)) & 3];
    });

  if (lines.length === 0) {
    lines.push('放慢腳步，每個轉角都有不同的風景等待發現。');
  }
  return lines.join('；') + '。';
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
  if (section && handlers.onShare) {
    const shareBtn = section.querySelector('.share-btn');
    if (shareBtn) shareBtn.removeEventListener('click', handlers.onShare);
  }
  handlers = {};
}

register('page-trail-detail', init, destroy);
