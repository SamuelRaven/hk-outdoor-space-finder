/* ========================================
   Trail Detail Page
   ======================================== */

import { navigate, register, getHashParam, getHashQuery, getHashCoords, getSearchCoords } from '../core/router.js?v=6';
import { isFavorite, toggleFavorite } from '../core/favorites.js?v=4';
import { shareItem, getTrailShareText } from '../core/share.js?v=4';
import { formatDistance, formatDuration } from '../core/format.js?v=4';
import { calcDistance } from '../core/geo.js?v=4';

let trails = [];
let handlers = {};
let userCoords = null;

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

  // 坐标：search > hash @ > hash ? > sessionStorage（优先级从高到低）
  if (!userCoords) {
    userCoords = getSearchCoords() || getHashCoords();
    if (!userCoords) {
      const q = getHashQuery();
      if (q.lat && q.lng) {
        userCoords = { lat: parseFloat(q.lat), lng: parseFloat(q.lng) };
      } else {
        const stored = sessionStorage.getItem('userCoords');
        if (stored) { try { userCoords = JSON.parse(stored); } catch {} }
      }
    }
  }

  function render(trail) {
    if (!trail) {
      container.innerHTML = '<p class="detail-empty">找不到這條山徑 😢</p>';
      return;
    }

    const sectionText = trail.trailName
      ? `${trail.trailName}${trail.section ? ' — ' + trail.section : ''}`
      : (trail.section || '');

    const SCENERY_COLORS = { '山海之間': 'blue', '深山林蔭': 'green', '水庫平湖': 'orange', '登頂大景': 'yellow', '瀑布溪澗': 'teal', '歷史遺跡': 'purple', '奇岩怪石': 'black' };
    const sceneryTags = (trail.scenery || [])
      .map(s => `<span class="detail-tag detail-tag--${SCENERY_COLORS[s] || 'yellow'}">${s}</span>`)
      .join('');

    const BLOCK_COLORS = ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'teal'];
    let bi = 0;
    const bc = () => 'detail-block--' + BLOCK_COLORS[bi++ % 7];

    const REGION_COLORS = { '港島': 'blue', '九龍': 'red', '新界': 'yellow' };

    const diffClass = {
      '著波鞋就得': 'detail-badge--easy',
      '著波鞋都頂得住': 'detail-badge--easy-medium',
      '著行山鞋穩陣D': 'detail-badge--medium',
      '著行山鞋都腳軟': 'detail-badge--hard',
      '著咩鞋都打嗮震': 'detail-badge--extreme',
    }[trail.difficulty] || '';

    const regionColor = REGION_COLORS[trail.region];
    const regionBadge = `<span class="detail-badge detail-badge--region${regionColor ? ' detail-badge--region-' + regionColor : ''}">${trail.region} · ${trail.district}</span>`;

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
          ${regionBadge}
          <span class="detail-badge ${diffClass}">${trail.difficulty}</span>
          ${userCoords && trail.lat != null && trail.lng != null ? `<span class="detail-badge detail-badge--distance">${formatDistance(calcDistance(userCoords.lat, userCoords.lng, trail.lat, trail.lng))}</span>` : ''}
        </div>
      </div>

      <div class="detail-block ${bc()}">
        <div class="detail-stats">
          <div class="detail-stat">
            <div class="detail-label"><span class="emoji">🥾</span> 全長</div>
            <div class="detail-stat__value">${trail.lengthKm} 公里</div>
          </div>
          <div class="detail-stat">
            <div class="detail-label"><span class="emoji">🕐</span> 需時</div>
            <div class="detail-stat__value">${formatDuration(trail.durationHrs)}</div>
          </div>
          <div class="detail-stat">
            <div class="detail-label"><span class="emoji">⛰️</span> 海拔</div>
            <div class="detail-stat__value">${trail.highestPointM != null ? trail.highestPointM + ' 米' : '—'}</div>
          </div>
        </div>
      </div>

      ${sceneryTags ? `
      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">🏞</span> 風景</div>
        <div class="detail-tags">${sceneryTags}</div>
      </div>` : ''}

      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">🛤</span> 路況</div>
        <div class="detail-value">${trail.surface}</div>
      </div>

      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">📝</span> 簡介</div>
        <div class="detail-descs">
          <div class="detail-desc-item">${trail.description || '暫無簡介'}</div>
        </div>
      </div>

      ${trail.tips ? `
      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">💡</span> 實用貼士</div>
        <div class="detail-desc-item">${trail.tips}</div>
      </div>` : ''}

      <div class="detail-row">
        <div class="detail-block detail-block--half ${bc()}">
          <div class="detail-label"><span class="emoji">👥</span> 適合人群</div>
          <div class="detail-value">${buildCrowd(trail)}</div>
        </div>
        <div class="detail-block detail-block--half ${bc()}">
          <div class="detail-label"><span class="emoji">🎒</span> 裝備建議</div>
          <div class="detail-value">${buildGear(trail)}</div>
        </div>
      </div>
      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">👀</span> 沿途看點</div>
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
    fetch('js/data/trails.json?v=5').then(r => r.json()).then(data => {
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

// ---- 適合人群 (難度 × 長度推導，每組合 8 種同義表達) ----
function buildCrowd(trail) {
  const d = trail.difficulty;
  const km = trail.lengthKm || 0;

  // 長度分檔
  let range;
  if (km <= 5) range = 'short';
  else if (km <= 10) range = 'mid';
  else range = 'long';

  // seed=1, 每組合 8 變體（>>8 取高位元，避免低 3 位偏置）
  const hi = (bh(trail.id, 1) >> 8) % 8;

    const pool = {
    '著波鞋就得': {
      short: [
        '老少咸宜，新手入門首選，親子家庭皆適合。',
        '一家大細輕鬆行，完全無壓力。',
        '平坦易行，推嬰兒車也無問題。',
        '零門檻路線，任何人穿上波鞋就能出發。',
        '長者同細路都可以安心慢慢行，適合作為家庭日活動。',
        '適合所有年齡層，是一條不用做功課就能出發的輕鬆路線。',
        '路程短到好似散步咁，著住波鞋行一陣就到終點。',
        '行山新手的第一站，零壓力起步，走完仲有心力去食個 tea。',
      ],
      mid: [
        '難度低但路程稍長，適合有耐力的初階山友。',
        '適合初學者及家庭，平緩好行、大人細路都應付到。',
        '全程平路為主，只要不趕時間慢慢行都應付到。',
        '初階中的長線，適合想挑戰距離但不想爬坡的朋友。',
        '大人細路都啱，路程雖長但坡度平緩，帶小朋友慢慢行也無問題。',
        '適合週末想輕鬆出走的行山入門者，路線平易近人。',
        '平緩好行，唯一要求係預留足夠時間慢慢行。',
        '適合想試長少少、但又唔想太辛苦嘅休閒一族。',
      ],
      long: [
        '平路為主但距離長，適合有耐力的入門山友。',
        '難度不高但路程不短，考驗的是腳力而非技術。',
        '全程平坦好行，是訓練耐力的好選擇。',
        '入門級長線，適合喜歡慢慢走、享受沿途風景的旅人。',
        '適合想挑戰長距離但不想爬坡的初階山友，路線友善景色優美。',
        '初學者想突破自己的好選擇——技術門檻低，只需準備好腳力與心情。',
        '全程冇乜坡度，只要腳力夠、慢慢行就掂。',
        '一條考驗耐性多過體力嘅長線，慢慢行最舒服。',
      ],
    },
    '著波鞋都頂得住': {
      short: [
        '短程有少少上落，穿波鞋都應付到。',
        '路段有幾段小坡，但波鞋都頂得住，適合想輕輕挑戰一下的朋友。',
        '有少少爬升但距離短，日常著波鞋就能完成。',
        '路線帶點坡度，仍屬輕鬆範圍，著波鞋慢慢行無問題。',
        '比散步級稍多一點爬升，是從輕鬆到有運動量的過渡選擇。',
        '短小但有坡度，適合想試下腳力又不想帶太多裝備的新手。',
        '有啲上落但轉眼就完，適合想流少少汗嘅朋友。',
        '波鞋搞掂嘅入門級，行完會想再試長啲。',
      ],
      mid: [
        '中等長度加上少許爬升，著波鞋都頂得住，帶支水就出發。',
        '路程適中，坡度平緩，波鞋足以應付，適合週末出遊。',
        '有幾段上落但不算辛苦，日常運動鞋都夠用。',
        '距離中長，好在坡度不大，著波鞋慢慢走也能走完。',
        '需要少許體能，但路況友善，波鞋就足夠應付。',
        '比輕鬆線稍長一點，有幾個緩坡，整體仍在波鞋範圍內。',
        '坡度溫柔、距離適中，係行山入門嘅最佳試煉。',
        '有少少運動量，但又未至於要專業裝備，波鞋一族最愛。',
      ],
      long: [
        '路程長但坡度平緩，考驗耐力多於技術，著波鞋都頂得住。',
        '長距離但路況平坦，波鞋加充足補給就能應付。',
        '路長坡緩，是訓練耐力的好路線，無需專業裝備。',
        '距離不短但少有陡坡，著波鞋慢慢行也能完成全程。',
        '適合想挑戰長距離、但不想爬坡的入門山友。',
        '長線入門之選，坡度友善，只需備足水和一點耐力。',
        '長距離但路況友善，最緊要係補給同腳力。',
        '想試長線又怕太難？呢條就係你嘅起步之選。',
      ],
    },
    '著行山鞋穩陣D': {
      short: [
        '適合有基本行山經驗的朋友，中等體能可應付。',
        '短程但有坡度，是從入門進階的理想試煉。',
        '路段有些爬升但距離短，初階想挑戰的首選。',
        '中等難度入門，適合想試試自己體能水平的人。',
        '適合入門後想更上一層樓的山友，短程有坡是絕佳的進階練習。',
        '平時有運動習慣就能享受，是從散步級升級到登山級的最佳過渡。',
        '短而有力，適合想測試自己進階實力嘅山友。',
        '有爬升但唔長，係入門同中級之間嘅最佳踏板。',
      ],
      mid: [
        '適合有規律運動習慣的行山愛好者。',
        '中等體能要求，平時有做運動就能享受。',
        '進階入門的好選擇，有挑戰但不至於太辛苦。',
        '難度與距離均衡，是週末鍛鍊的絕佳路線。',
        '適合想認真行山但未至於挑戰極限的山友，汗水與風景比例剛剛好。',
        '中等難度的黃金區間——有足夠爬升滿足運動量，又不至於透支體力。',
        '運動量同風景並重，係週末鍛鍊嘅理想路線。',
        '有規律運動嘅朋友會行得好舒服，攰但滿足。',
      ],
      long: [
        '中等難度但路程長，需穩定體能及一定行山經驗。',
        '適合有中級經驗的山友，考驗續航力多於技術。',
        '路線長且有些爬升，適合有一定體能基礎的行山者。',
        '需要一定體能基礎，但技術門檻不高。',
        '適合有長途行山經驗的愛好者，是考驗耐力與配速的好路線。',
        '給行慣中短途、想挑戰更長距離的山友。',
        '需要穩定體能輸出，考驗你配速同補給嘅功力。',
        '中級山友嘅進階長線，行完會對自己更有信心。',
      ],
    },
    '著行山鞋都腳軟': {
      short: [
        '短程但技術要求高，適合經驗豐富的山友。',
        '距離雖短但路段陡峭，適合有攀爬經驗的山友。',
        '體能消耗大，是高難度的短途衝刺路線。',
        '路短但絕不輕鬆，適合追求挑戰的資深山友。',
        '短小精悍的高難度路線，適合想在三小時內體驗極限爬升的進階山友。',
        '濃縮的精華——短距離內集齊陡坡碎石與攀爬，是技術型山友的訓練場。',
        '短途版嘅體能測試，一上嚟就係連續爬升。',
        '距離短但強度高，係進階山友嘅高效訓練場。',
      ],
      mid: [
        '體能要求高，適合有豐富經驗的進階行山者。',
        '挑戰級路線，適合有豐富經驗的進階行山者。',
        '需要一定攀爬技巧，不適合畏高或體能一般者。',
        '給準備好突破自己的山友——爬升多、路段 technical。',
        '適合行山經驗豐富且體能充沛的資深山友，是自我挑戰的標誌性路線。',
        '需要穩定的體能輸出與良好的路線判斷力，適合有數十條行山經驗的愛好者。',
        '全程考驗腳力同意志，行完真係會腳軟。',
        '爬升集中、路段 technical，需要一定攀爬經驗。',
      ],
      long: [
        '高難度長途，僅推薦體能充沛的資深山友。',
        '技術與體能的雙重考驗，適合經驗豐富的資深山友。',
        '是給行山老手的終極試煉，完成後會有極大滿足感。',
        '整段路對體能和意志都是考驗，適合追求自我突破的山友。',
        '香港最具挑戰性的路線之一，適合已完成多條中級路線想挑戰自我的行山發燒友。',
        '給追求終極滿足感的你——完成這條路線，你已經站在香港行山者的前列。',
        '高強度長線，體能、技術、意志缺一不可。',
        '只有真正嘅行山發燒友先會挑戰，務必量力而為。',
      ],
    },
    '著咩鞋都打嗮震': {
      short: [
        '極高難度的短程衝刺，路段陡峭暴露，僅適合資深且無畏高的山友。',
        '距離雖短但極陡，部分路段需手腳並用，務必量力而為。',
        '濃縮的極限路線，短距離內爬升巨大，是頂級山友的試煉場。',
        '短小但絕非易事，碎石陡坡與暴露山脊並存，僅推薦經驗豐富者。',
        '給追求極限的山友——短途卻步步驚心，天雨或大風切勿前往。',
        '短程高強度，體能與心理質素缺一不可，切勿單獨出發。',
        '短但極陡，暴露感十足，冇經驗千祈唔好上。',
        '距離唔長，但每一步都係考驗，適合頂級山友。',
      ],
      mid: [
        '極高難度路線，陡峭爬升加上技術路段，僅適合體能充沛的資深山友。',
        '全程考驗體能與意志，暴露路段多，畏高者切勿嘗試。',
        '香港最艱苦的路線之一，需有豐富行山經驗及充足裝備。',
        '坡度極陡且部分路段需攀爬，非一般行山者可駕馭。',
        '每一步都在挑戰極限，務必結伴同行並預先研究路線。',
        '給準備好突破極限的你——這條路線會讓你全身肌肉都在抗議。',
        '全程高強度，暴露路段連連，心臟唔夠大粒都唔敢行。',
        '香港最惡嘅路線之一，裝備同心理都要準備充足。',
      ],
      long: [
        '極高難度長途，連續陡坡與長距離暴露，僅推薦頂級資深山友。',
        '體能、技術與意志的三重極限考驗，完成者寥寥。',
        '香港數一數二的艱苦路線，長途加上極陡爬升，切勿輕視。',
        '整段路對體能和意志都是終極試煉，需謹慎評估自身能力。',
        '給行山老手的終極挑戰——長距離、高強度、大爬升一次過滿足。',
        '非專業級別請勿嘗試，這條路線考驗的是你能否堅持到底。',
        '長距離加極陡爬升，係名副其實嘅極限挑戰。',
        '完成佢，你就係行山界嘅傳說，但前提係你要夠料。',
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

  if (d === '著咩鞋都打嗮震' || d === '著行山鞋都腳軟') parts.push('高幫防滑行山鞋');
  else if (d === '著行山鞋穩陣D') parts.push('防滑行山鞋');
  else if (d === '著波鞋都頂得住') parts.push('防滑運動鞋');
  else parts.push('輕便波鞋');

  if (s.includes('山徑') || d === '著咩鞋都打嗮震' || d === '著行山鞋都腳軟') parts.push('行山杖');
  if (s.includes('樓梯')) parts.push('護膝');
  if (d === '著咩鞋都打嗮震' || d === '著行山鞋都腳軟') parts.push('頭燈及急救包');
  if (km > 8 || d === '著咩鞋都打嗮震' || d === '著行山鞋都腳軟') parts.push('高熱量補給食物');

  parts.push('防曬及防蚊用品');
  return parts.join('、');
}

// ---- 沿途看點 (每類風景 12 種定義表述 + seed+tagIndex 確保每 tag 不同) ----
function buildHighlights(trail) {
  const sceneries = trail.scenery || [];

  // 風景標籤 → 多種定義表述（同義改寫，非編造）
    const defs = {
    '山海之間': [
      '路段沿海岸山脊而行，可同時欣賞山景與海景',
      '山與海交織的路段，一邊是翠綠山巒，一邊是蔚藍大海',
      '沿途山脊線與海岸線並行，視野極其開闊',
      '穿梭於山海交界處，同時擁有山的沉穩與海的遼闊',
      '依山傍海的經典路段，山海景觀不斷交替變換',
      '海風與山風交匯的路線，同時感受兩種截然不同的自然氣息',
      '海岸線在腳下蜿蜒，浪濤聲伴隨整段路程，海天一色令人心曠神怡',
      '走在山腰小徑上，左邊是蔥鬱山坡，右邊是無盡大海，每個轉彎都是驚喜',
      '居高臨下俯瞰島嶼與海灣，海面在陽光下閃爍如碎銀般的光澤',
      '山海在此交會，蜿蜒的海岸線與起伏的山脊構成香港最具代表性的地貌畫卷',
      '海天一色之間，山風送來鹹鹹嘅海水味，混和著草木清香',
      '每走一段路，山與海的比例都在變換，形成一幅流動的風景畫',
    ],
    '深山林蔭': [
      '穿梭於樹木茂密的林間，綠蔭蔽日涼爽舒適',
      '密林覆蓋的路段，樹冠交織成天然遮陽棚',
      '走在林蔭小徑上，陽光透過樹葉灑落斑駁光影',
      '被林木包圍的路段，空氣清新生機盎然',
      '古木參天的林徑，蕨類與苔蘚覆蓋兩旁，充滿原始森林感',
      '樹林密度恰到好處，既能遮陽又不遮擋遠處山景',
      '穿行於亞熱帶次生林中，耳邊此起彼落的鳥鳴與樹葉沙沙聲交織成自然交響曲',
      '林間小道蜿蜒向前，兩旁藤蔓與灌木交織，每一步都像走進綠色隧道',
      '樹冠層層疊疊過濾了烈日，地面上光影斑駁如印象派畫作般柔和',
      '竹林與喬木混生的路段，不同樹種的氣息在空氣中混合成獨特的山林味道',
      '樹影婆娑，陽光從葉縫間漏下，整條路都沐浴在柔和綠光中',
      '林間空氣清甜，深呼吸一啖，城市嘅煩囂彷彿被隔絕在外',
    ],
    '水庫平湖': [
      '途經水塘或湖泊，平靜水面倒映周邊山色',
      '水庫路段湖面如鏡，山影倒映其中格外寧靜',
      '沿水塘而行，波光粼粼的湖面隨光線變換色調',
      '傍水路段，開闊水面與周邊山景構成絕佳景觀',
      '水壩路段視野最開闊，雨後水量充沛時景觀更震撼',
      '環湖而行，不同角度觀賞湖水顏色由淺藍到深藍的漸變',
      '水塘邊微風輕拂，湖面泛起細碎漣漪，偶有飛鳥掠過水面激起一圈圈波紋',
      '平靜的水庫像一面巨大的鏡子，完美倒映著天空的雲彩與環抱的群山',
      '沿湖岸漫步，陽光在水面鋪開一條閃爍的金色光帶，隨步伐移動而變幻',
      '水壩上回望，滿溢的水面與翠綠山谷構成一幅靜謐的山水畫',
      '湖面平靜如鏡，倒映著藍天白雲，偶有白鷺掠過打破寧靜',
      '沿水塘慢慢行，看水面隨光線由翡翠綠變作深藍，療癒感十足',
    ],
    '登頂大景': [
      '路段包含高點或山頂，視野開闊可遠眺周邊',
      '攀上制高點後擁有 360 度全景視野',
      '登上山頂俯瞰四周，天地遼闊盡收眼底',
      '高點路段視野無遮擋，是遠眺周邊地貌的最佳位置',
      '山頂風大但景色值回票價，晴天時能見度可達數十公里',
      '登頂一刻豁然開朗，四周山巒如波浪般向天邊延伸',
      '站在山巔，腳下是連綿起伏的丘陵與錯落有致的城市天際線，壯闊得令人屏息',
      '最高點的風景是給堅持到最後的人最好的獎勵，極目遠眺，遠山近海一覽無遺',
      '攻頂後回望來時路，才發現自己已經走了那麼遠，天地之大盡在眼前',
      '山頂的風吹散了所有疲憊，俯瞰腳下萬物皆小的感覺讓一切辛苦都化為滿足',
      '站上高處，城市與山巒在腳下鋪展，一覽無遺的滿足感油然而生',
      '山頂是最佳觀景台，天氣好時連遠方海島都清晰可見',
    ],
    '瀑布溪澗': [
      '沿途有瀑布或溪流，夏季水量充沛時最為壯觀',
      '溪澗相伴的路段，水聲潺潺帶來清涼感受',
      '路經瀑布溪流，水霧撲面是炎夏的最佳降溫',
      '依水而行，溪水清澈見底，是夏日行山的首選',
      '雨後兩三天水量最豐沛，瀑布聲勢浩大震懾人心',
      '沿澗道而行，清涼水氣撲面，是夏季避暑的絕佳路線',
      '瀑布從高處傾瀉而下，水花四濺中形成一道若隱若現的彩虹，涼意撲面而來',
      '溪水在岩石間跳躍奔流，清澈得可以看見水底的每一顆鵝卵石',
      '坐在溪邊大石上，把腳浸入冰涼的溪水中，聽著淙淙水聲，暑氣全消',
      '瀑布下方的水潭碧綠如翡翠，四周蕨類茂密，彷彿走進了熱帶雨林的秘境',
      '潺潺水聲伴你行完全程，是夏日最清涼的自然背景音樂',
      '雨後水量充足，瀑布氣勢最盛，但記得留意濕滑石面',
    ],
    '歷史遺跡': [
      '途經古道、村落或戰時遺址等歷史地標',
      '路段散落著歷史建築與遺址，充滿人文氣息',
      '走過百年古道與舊村落，每處遺跡都有沉澱的故事',
      '行山同時穿越歷史，沿途可見歲月留下的印記',
      '古道石階被歲月磨得光滑，每級都在訴說過往旅人的故事',
      '途經的村落廢墟與舊建築，是了解本地歷史的活教材',
      '石砌古道蜿蜒山中，百年前村民就是踏著這些石級往來墟市，歷史在腳下延續',
      '廢棄的學校與祠堂靜立在林間，斑駁的牆面上爬滿藤蔓，無聲地訴說著昔日繁華',
      '碉堡與戰壕隱沒在草叢中，戰時的硝煙早已散盡，只留下混凝土遺構供人追憶',
      '客家村落的白牆灰瓦在竹林後若隱若現，推開半掩的木門，時光彷彿倒流百年',
      '沿途的古蹟見證咗香港嘅變遷，每一步都踏在歷史之上',
      '舊建築與自然融為一體，行山之餘也上了一堂生動的歷史課',
    ],
    '奇岩怪石': [
      '沿途可見奇特岩層與海蝕地貌，是地質愛好者的天堂',
      '岩柱節理與海蝕洞交錯，彷彿走進天然的地質博物館',
      '沉睡億萬年的岩層裸露眼前，紋理清晰如翻開的地球史書',
      '奇岩怪石隨處可見，每一塊都在訴說地殼變動的故事',
      '海岸岩壁被海浪雕琢成千奇百怪的形狀，鬼斧神工',
      '沿途的岩石形態各異，是了解香港地質歷史的活教材',
      '六角形岩柱排列整齊，宛如大自然的石頭管風琴',
      '風化與海蝕共同塑造的奇觀，一步一景令人驚嘆',
      '沉積岩的層層紋理清晰可辨，記錄著遠古海洋的痕跡',
      '岩石色彩斑斕、形狀奇特，打卡影相之餘更能認識地質奧秘',
      '岩石經過億萬年風化，形態千奇百怪，是大自然嘅鬼斧神工',
      '海蝕地貌壯觀，打卡影相之外，更是一本活生生的地質教科書',
    ],
  };
  const H = bh(trail.id, 2);

  const lines = sceneries
    .filter(s => defs[s])
    .map((s, i) => {
      const arr = defs[s];
      // 每 tag 取不同 bit 段，確保同一 trail 的不同 tag 取到不同 variant
      return arr[(H >> (i * 5)) % arr.length];
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
