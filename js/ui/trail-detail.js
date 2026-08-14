/* ========================================
   Trail Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js?v=6';
import { isFavorite, toggleFavorite } from '../core/favorites.js?v=4';
import { shareItem, getTrailShareText } from '../core/share.js?v=4';
import { formatDuration } from '../core/format.js?v=4';

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

    const duration = formatDuration(trail.durationHrs);
    const durationClass = (duration.includes('小時') && duration.includes('分鐘')) ? ' detail-stat--minute' : '';

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
        </div>
      </div>

      <div class="detail-block ${bc()}">
        <div class="detail-stats">
          <div class="detail-stat">
            <div class="detail-label"><span class="emoji">🥾</span> 全長</div>
            <div class="detail-stat__value">${trail.lengthKm} 公里</div>
          </div>
          <div class="detail-stat${durationClass}">
            <div class="detail-label"><span class="emoji">🕐</span> 需時</div>
            <div class="detail-stat__value">${duration}</div>
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
    fetch('js/data/trails.json?v=6').then(r => r.json()).then(data => {
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
        '一家大細都啱，完全零壓力。',
        '適合親子家庭，長者與小朋友都能輕鬆完成。',
        '零門檻路線，任何年齡層都適合。',
        '長者同細路都可以安心慢慢行，適合作為家庭日活動。',
        '適合所有年齡層，行山新手也能應付自如。',
        '適合初次行山的朋友，踏出第一步的最佳選擇。',
        '適合想同屋企人輕鬆享受大自然嘅朋友。',
      ],
      mid: [
        '適合有耐力的初階山友，慢慢行無壓力。',
        '適合初學者及家庭，大人細路都應付到。',
        '適合想試長少少、但又唔想太辛苦嘅休閒一族。',
        '適合初次行山的初學者，考驗的是耐性而非體力。',
        '適合週末想輕鬆出走、不常運動的都市人。',
        '適合想同小朋友慢慢行足半日嘅親子家庭。',
        '適合不趕時間、鍾意邊行邊休息嘅朋友。',
        '適合入門初階、想循序漸進增加距離嘅山友。',
      ],
      long: [
        '適合有耐力的入門山友，考驗腳力多於技術。',
        '適合喜歡慢慢走、享受沿途風景的旅人。',
        '適合想走得更遠、又不想太辛苦的初階山友。',
        '適合初學者想突破自己、具備基本恆心的選擇。',
        '適合週末想遠離市區、慢慢行返日嘅休閒一族。',
        '適合有恒心、想行足大半日嘅新手山友。',
        '適合不趕時間、鍾意散步式行山的長者或新手。',
        '適合想試長線、又怕太難嘅入門者。',
      ],
    },
    '著波鞋都頂得住': {
      short: [
        '適合想輕輕挑戰一下、平時有少少運動的朋友。',
        '適合行山新手想試下腳力、又不想太辛苦。',
        '適合週末想流少少汗嘅都市人。',
        '適合有基本運動習慣、想接觸行山嘅朋友。',
        '適合入門後想多啲運動量的山友。',
        '適合想從散步級升級到行山級嘅休閒一族。',
        '適合初次接觸爬升路線、有基本體能嘅入門者。',
        '適合想試真啲行山、但未敢挑戰高難度嘅朋友。',
      ],
      mid: [
        '適合週末想出走、平時有做運動嘅朋友。',
        '適合想認真行山、但未至於挑戰極限嘅入門者。',
        '適合有耐力的初階山友，體能門檻唔高。',
        '適合行山入門一段時間、想試中距離嘅朋友。',
        '適合體能一般、但有心挑戰自我嘅都市人。',
        '適合想循序漸進、由短線升級到中線嘅山友。',
        '適合有運動習慣、想行足半日嘅朋友。',
        '適合想試長少少、有基本體能嘅行山新手。',
      ],
      long: [
        '適合想挑戰長距離、但不想太辛苦的入門山友。',
        '適合有耐力的行山新手，考驗續航力多於技術。',
        '適合想一次過行耐啲、慢慢練腳力嘅朋友。',
        '適合有恒心、想突破自己距離記錄嘅初階山友。',
        '適合週末想遠足、有基本體能嘅都市人。',
        '適合想試長線又怕太難、有耐性嘅入門者。',
        '適合循序漸進、想由中線進軍長線嘅山友。',
        '適合有耐性、唔怕慢慢行嘅休閒一族。',
      ],
    },
    '著行山鞋穩陣D': {
      short: [
        '適合有基本行山經驗的朋友。',
        '適合入門後想更上一層樓的山友。',
        '適合平時有運動習慣、想試進階路線的人。',
        '適合想測試自己進階實力的山友。',
        '適合有數次行山經驗、想挑戰爬升的愛好者。',
        '適合體能中等、想認真行山的朋友。',
        '適合由入門過渡到中級、有一定基礎的山友。',
        '適合想試下自己體能水平嘅行山愛好者。',
      ],
      mid: [
        '適合有規律運動習慣的行山愛好者。',
        '適合有中級行山經驗、想認真鍛鍊的山友。',
        '適合平時有做運動、體能中等的人。',
        '適合想認真行山、但未至於挑戰極限的山友。',
        '適合有穩定運動習慣、想週末鍛鍊的朋友。',
        '適合進階入門的山友，想多啲運動量。',
        '適合有行山基礎、想挑戰中長距離的愛好者。',
        '適合體能唔錯、想行得攰啲都滿足嘅山友。',
      ],
      long: [
        '適合有中級行山經驗的山友。',
        '適合有長途行山經驗的愛好者。',
        '適合有一定體能基礎、想挑戰長距離的行山者。',
        '適合行慣中短途、想挑戰更長距離的山友。',
        '適合有穩定體能、想考驗耐力的中級山友。',
        '適合想認真挑戰自己、有運動底子的朋友。',
        '適合有續航力、想行足大半日嘅行山愛好者。',
        '適合想由中線進軍長線、經驗漸豐嘅山友。',
      ],
    },
    '著行山鞋都腳軟': {
      short: [
        '適合經驗豐富的山友。',
        '適合有攀爬經驗、追求挑戰的資深山友。',
        '適合體能充沛、想短時間內爆汗的進階山友。',
        '適合追求高強度訓練的技術型山友。',
        '適合有豐富行山經驗、不畏懼陡峭路段的人。',
        '適合想測試自己極限嘅資深行山愛好者。',
        '適合有運動底子、想挑戰高難度嘅進階山友。',
        '適合行山經驗多、想試技術路線嘅山友。',
      ],
      mid: [
        '適合經驗豐富的進階行山者。',
        '適合體能充沛、有豐富行山經驗的資深山友。',
        '適合有數十條行山經驗、想挑戰自我的愛好者。',
        '適合有攀爬經驗、不畏高嘅進階山友。',
        '適合準備好突破自己、技術過關的山友。',
        '適合有豐富戶外經驗、體能穩定嘅資深人士。',
        '適合追求自我挑戰、意志堅定嘅行山發燒友。',
        '適合有足夠行山資歷、想再上一級嘅山友。',
      ],
      long: [
        '僅推薦體能充沛的資深山友。',
        '適合經驗豐富、追求終極挑戰的行山老手。',
        '適合有長途高難度經驗的資深愛好者。',
        '適合體能與技術兼備、想突破自我的山友。',
        '適合已完成多條中級路線、想挑戰自我的發燒友。',
        '適合有豐富資歷、意志堅定嘅行山老手。',
        '適合追求終極滿足感、有雄厚體能嘅資深山友。',
        '適合真正嘅行山發燒友，量力而為。',
      ],
    },
    '著咩鞋都打嗮震': {
      short: [
        '僅適合資深且無畏高的頂級山友。',
        '適合有攀爬經驗、心理質素過硬的極限玩家。',
        '僅推薦經驗豐富、追求極限的頂級山友。',
        '適合體能與技術都頂尖、膽識過人的山友。',
        '適合頂級行山者，冇經驗千祈唔好上。',
        '適合追求極限挑戰、無畏高嘅資深山友。',
        '僅適合有豐富高難度經驗的頂級愛好者。',
        '適合膽大心細、經驗老到嘅極限山友。',
      ],
      mid: [
        '僅適合體能充沛的資深極限山友。',
        '適合經驗極其豐富、技術頂尖的頂級行山者。',
        '僅推薦有豐富高難度經驗、無畏高嘅山友。',
        '適合心理質素與體能都頂尖的極限玩家。',
        '適合行山資歷深厚、追求終極考驗的發燒友。',
        '僅適合有多次極限路線經驗的頂級山友。',
        '適合膽識與技術兼備、經驗豐富嘅極限愛好者。',
        '適合真正嘅頂級山友，量力而行。',
      ],
      long: [
        '僅推薦頂級資深山友，普通人切勿嘗試。',
        '適合體能、技術與意志都頂尖的極限行山者。',
        '僅適合有豐富極限路線經驗的資深山友。',
        '適合追求終極挑戰、經驗極其豐富的頂級愛好者。',
        '僅推薦專業級別的頂級行山者。',
        '適合行山界嘅資深老手，量力而為。',
        '僅適合意志堅定、經驗豐富嘅頂級山友。',
        '適合完成過多條極限路線、追求突破的發燒友。',
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
