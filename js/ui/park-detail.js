/* ========================================
   Park Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js?v=6';
import { isFavorite, toggleFavorite } from '../core/favorites.js?v=4';
import { shareItem, getParkShareText } from '../core/share.js?v=4';

let parks = [];
let handlers = {};

function init() {
  const section = document.getElementById('page-park-detail');
  const parkId = getHashParam();
  const container = document.getElementById('park-detail-content');
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
  updateStar(favBtn, isFavorite('park', parkId));

  let shareBtn = actions.querySelector('.share-btn');
  if (!shareBtn) {
    shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn';
    shareBtn.setAttribute('aria-label', '分享');
    shareBtn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M22,12 L1,4 L8,12 L1,20 Z"/><line x1="22" y1="12" x2="8" y2="12"/></svg>';
    actions.appendChild(shareBtn);
  }

  handlers.onFav = async () => {
    const nowFav = toggleFavorite('park', parkId);
    updateStar(favBtn, nowFav);
    const msg = nowFav ? '★ 已收藏' : '☆ 已取消收藏';
    const toast = await import('./toast.js?v=4');
    toast.showToast(msg);
  };
  favBtn.addEventListener('click', handlers.onFav);

  handlers.onShare = async () => {
    const park = parks.find(p => p.id === parkId);
    if (!park) return;
    const result = await shareItem(getParkShareText(park));
    const toast = await import('./toast.js?v=4');
    if (result === 'wechat') toast.showToast('暫不支持微信分享');
    else if (result === 'shared') setTimeout(() => toast.showToast('已分享', 4000), 300);
  };
  shareBtn.addEventListener('click', handlers.onShare);

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

    const PARK_TYPE_COLORS = { '海濱長廊': 'blue', '市區公園': 'purple', '郊野綠地': 'green', '主題園林': 'teal', '休憩花園': 'orange' };
    const TIME_TAG_COLORS = { '清晨': 'green', '上午': 'blue', '中午': 'orange', '下午': 'yellow', '傍晚': 'purple', '夜晚': 'black' };
    const REGION_COLORS = { '港島': 'blue', '九龍': 'red', '新界': 'yellow' };
    const bestTimeTags = (park.bestTime || [])
      .map(t => `<span class="detail-tag detail-tag--${TIME_TAG_COLORS[t] || 'yellow'}">${t}</span>`).join('');

    const typeColor = PARK_TYPE_COLORS[park.parkType];
    const typeBadge = `<span class="detail-badge detail-badge--type${typeColor ? ' detail-badge--type-' + typeColor : ''}">${park.parkType || ''}</span>`;

    const regionColor = REGION_COLORS[park.region];
    const regionBadge = `<span class="detail-badge detail-badge--region${regionColor ? ' detail-badge--region-' + regionColor : ''}">${park.region} · ${park.district}</span>`;

    const DESC_COLORS = ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'teal'];
    const BLOCK_COLORS = ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'teal'];
    let bi = 0;
    const bc = () => 'detail-block--' + BLOCK_COLORS[bi++ % 7];

    const descBlocks = park.activityDescriptions
      ? Object.entries(park.activityDescriptions)
          .map(([act, desc], i) => `
            <div class="detail-desc-card detail-desc-card--${DESC_COLORS[i % 7]}">
              <div class="detail-desc-card__act">${act}</div>
              <div class="detail-desc-card__text">${desc}</div>
            </div>`)
          .join('')
      : `<div class="detail-desc-card"><div class="detail-desc-card__text">${park.description || '暫無簡介'}</div></div>`;

    const hours = splitHours(park.openingHours);

    container.innerHTML = `
      <div class="detail-color-bar">
        <span class="detail-color-bar__seg detail-color-bar__seg--red"></span>
        <span class="detail-color-bar__seg detail-color-bar__seg--blue"></span>
        <span class="detail-color-bar__seg detail-color-bar__seg--yellow"></span>
      </div>

      <div class="detail-hero">
        <div class="detail-hero__name">${park.nameZh}</div>
        <div class="detail-hero__meta">
          ${regionBadge}
          ${typeBadge}
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-block detail-block--half ${bc()}">
          <div class="detail-label"><span class="emoji">🕐</span> 開放時間</div>
          <div class="detail-value detail-value--big">${hours.main}</div>
          ${hours.note ? `<div class="detail-value detail-value--note">${hours.note}</div>` : ''}
        </div>
        ${bestTimeTags ? `
        <div class="detail-block detail-block--half ${bc()}">
          <div class="detail-label"><span class="emoji">☀️</span> 最佳時段</div>
          <div class="detail-tags">${bestTimeTags}</div>
        </div>` : ''}
      </div>

      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">📖</span> 簡介</div>
        <div class="detail-descs">
          <div class="detail-desc-item">${park.description || '暫無簡介'}</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-label"><span class="emoji">📝</span> 做咩好</div>
        <div class="detail-descs">${descBlocks}</div>
      </div>

      <div class="detail-row">
        <div class="detail-block detail-block--half ${bc()}">
          <div class="detail-label"><span class="emoji">👥</span> 適合人群</div>
          <div class="detail-value">${buildParkCrowd(park)}</div>
        </div>
        <div class="detail-block detail-block--half ${bc()}">
          <div class="detail-label"><span class="emoji">🏞</span> 公園特色</div>
          <div class="detail-value">${buildParkFeatures(park)}</div>
        </div>
      </div>
      <div class="detail-block ${bc()}">
        <div class="detail-label"><span class="emoji">💡</span> 出行貼士</div>
        <div class="detail-descs"><div class="detail-desc-item">${buildParkTips(park)}</div></div>
      </div>

      <p class="detail-ai-note">部分內容由 AI 輔助生成，僅供參考</p>

      <div class="detail-footer-accent">
        <span class="detail-footer-accent__dot"></span>
        <span class="detail-footer-accent__dot"></span>
        <span class="detail-footer-accent__dot"></span>
      </div>
    `;
  }

  if (parks.length === 0) {
    fetch('js/data/parks.json?v=6')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        parks = data;
        render(parks.find(p => p.id === parkId));
      })
      .catch(() => {
        container.innerHTML = '<p class="detail-empty">載入失敗，請檢查網絡後重新整理頁面 😢</p>';
      });
  } else {
    render(parks.find(p => p.id === parkId));
  }
}

function updateStar(btn, isFav) {
  btn.innerHTML = isFav ? '★' : '☆';
  btn.dataset.active = isFav ? 'true' : '';
}

// ---- hash (單次大 hash + bit 段提取 → 不同 seed 完全獨立) ----
function ph(id, seed, n) {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

// ---- 開放時間 (主時段 + 括號註釋拆兩行，如「24小時（回歸塔 07:00-19:00）」) ----
function splitHours(hours) {
  if (!hours) return { main: '-', note: '' };
  const m = hours.match(/^([^（(]*)[（(]([^）)]*)[）)]/);
  if (m) return { main: m[1].trim(), note: m[2].trim() };
  return { main: hours, note: '' };
}

// ---- 適合人群 (從 activityTypes 推導，本身已有足夠變化) ----
function buildParkCrowd(park) {
  const acts = park.activityTypes || [];
  const groups = [];
  if (acts.includes('親子放電')) groups.push('親子家庭');
  if (acts.includes('寵物出行')) groups.push('養寵物人士');
  if (acts.includes('運動出汗')) groups.push('運動愛好者');
  if (acts.includes('開爐野餐')) groups.push('親友聚會');
  if (acts.includes('散步看景')) groups.push('情侶及長者');
  if (acts.includes('安靜發呆')) groups.push('需要獨處充電的人');
  return groups.length > 0 ? groups.join('、') : '各類人士';
}

// ---- 公園特色 (優先使用真實數據，無則同義改寫池推導) ----
function buildParkFeatures(park) {
  return park.features || '';
}

// ---- 出行貼士 (同義改寫 + seed 分流 → 保真 + 不重複) ----
function buildParkTips(park) {
  const parts = [];
  const hours = park.openingHours || '';
  const times = park.bestTime || [];
  const type = park.parkType || '';

  // 開放時間 → 6 種說法
  if (hours.includes('24') || hours.includes('全天')) {
    const p = [
      '全天開放，隨時可前往', '24 小時開放，夜遊也方便', '全日無休，什麼時候去都行',
      '通宵開放，夜貓子的城市綠洲', '全日開放，凌晨時分最安靜', '24 小時的都市後花園，隨時需要喘息就來',
    ];
    parts.push(p[ph(park.id, 2, p.length)]);
  } else if (hours.includes('-')) {
    const match = hours.match(/(\d{2}):(\d{2})/g);
    if (match && match.length >= 2) {
      const close = match[1];
      const closeH = parseInt(close);
      if (closeH < 24) {
        const p = [
          '關門時間 ' + close + '，建議提前半小時離開',
          close + ' 關閉，記得預留時間離場',
          '注意 ' + close + ' 關門，別待太晚',
          '最遲 ' + close + ' 離場，保安會提前巡邏提醒',
          close + ' 關門，建議預留 15 分鐘走到出口',
          '公園 ' + close + ' 落閘，唔好等到最後一刻先走',
        ];
        parts.push(p[ph(park.id, 3, p.length)]);
      }
    }
  }

  // 最佳時段 → 每時段 6 種說法
  const timeVariants = {
    '清晨': [
      '清晨人少涼爽，晨運好時機', '清晨光線柔和、人流稀少', '早鳥福利，清晨安靜愜意',
      '清晨空氣清新，公園人最少，晨運後嘆個早餐', '日出前後光線最美，帶杯咖啡來享受寧靜時刻',
      '晨光初現，雀鳥最活躍的時段，觀鳥愛好者不要錯過',
    ],
    '上午': [
      '上午陽光和煦不刺眼，行公園最寫意',
      '朝早人流偏少，返工前來行一轉正好',
      '上午光線充足，影相最靚，記得帶相機',
      '早上十點前太陽較柔和，晨運散步都舒服',
      '上午公園最寧靜，適合安靜發呆或睇書',
      '朝早草地清爽，野餐墊一鋪就可以開餐',
    ],
    '中午': [
      '中午陽光猛烈，注意防曬補水', '正午太陽直射，找遮蔭處休息', '午間陽光強烈，做好防曬措施',
      '中午紫外線最強，搽防曬之外記得定時補塗', '正午時段建議縮短戶外逗留，找樹蔭或涼亭避一避',
      '午間高溫，帶備充足飲用水以防中暑',
    ],
    '下午': [
      '下午光線柔和，影相散步皆宜', '午後陽光溫暖，是戶外活動的黃金時段', '下午是最愜意的時光，帶本書來坐坐',
      '午後光線適合拍照，草地野餐的黃金時間', '下午三點後氣溫開始回落，是最舒適的戶外時段',
      '午後陽光穿過樹葉，光斑灑落草地，景色特別美',
    ],
    '傍晚': [
      '黃昏 magic hour，夕陽景色最美', '傍晚光線變化迷人，日落時分尤其精彩', '黃昏時段景色最佳，把握日落前後',
      '日落前半小時是 magic hour，金光灑滿整個公園', '黃昏時分蚊蟲開始活躍，記得先噴防蚊液',
      '夕陽餘暉配夜景，傍晚到入夜交接的景色雙重享受',
    ],
    '夜晚': [
      '夜間注意照明及安全，穿淺色衣物', '夜晚涼爽適合散步，注意腳下路況', '入夜後燈光較暗，建議結伴同行',
      '夜間公園燈光較暗，建議帶備小電筒或用手機照明', '入夜後氣溫下降，帶件薄外套免得著涼',
      '夜間人流較少，避免獨自前往偏僻角落',
    ],
  };
  for (const t of times) {
    if (timeVariants[t]) {
      const arr = timeVariants[t];
      parts.push(arr[ph(park.id, 4, arr.length)]);
      break;
    }
  }

  // 公園類型 → 實用提示（5 種全覆蓋，各 6 variant）
  if (type === '市區公園') {
    const p = [
      '地鐵站步行可達，交通方便，放工過來行個圈剛剛好',
      '設施完善，廁所飲水機齊全，無需特別準備',
      '週末人流較多，想清靜建議平日或一早來',
      '市中心地段，公園周邊餐廳商場多，行完順便食飯',
      '園內多硬地路面，推輪椅或嬰兒車都無障礙',
      '身處鬧市但入園即靜，是繁忙都市中的喘息空間',
    ];
    parts.push(p[ph(park.id, 5, p.length)]);
  }
  if (type === '休憩花園') {
    const p = [
      '小巧安靜，適合一個人來放空或看書',
      '遮蔭可能有限，夏天避開正午時段較舒服',
      '街坊的日常後花園，有種親切的社區氛圍',
      '面積不大但五臟俱全，短暫休息的理想選擇',
      '隱藏在街角的綠洲，知道的人不多，格外清靜',
      '長椅數量有限，繁忙時段可能要等一等',
    ];
    parts.push(p[ph(park.id, 6, p.length)]);
  }
  if (type === '主題園林') {
    const p = [
      '園林設計有心思，慢慢行細心欣賞每個造景細節',
      '不同季節有不同植物開花，每次來都有新發現',
      '亭台樓閣是絕佳拍照位，帶相機來不會後悔',
      '園內步道規劃有層次，適合靜心慢行沈浸其中',
      '池塘或有蚊蟲，逗留水邊記得做好防蚊措施',
      '園林維護需時，部分區域可能因保養暫時關閉',
    ];
    parts.push(p[ph(park.id, 7, p.length)]);
  }
  if (type === '郊野綠地') {
    const p = [
      '郊野蚊蟲較多，建議帶備防蚊用品', '建議自備飲用水及小食', '手機訊號可能較弱，預先查看地圖',
      '遠離市區，出發前 check 好交通班次以免錯過尾班車', '郊野天氣變化快，帶件輕便雨衣以備不時之需',
      '遇到野生動物保持距離，不要餵食也不要走近拍照',
    ];
    parts.push(p[ph(park.id, 8, p.length)]);
  }
  if (type === '海濱長廊') {
    const p = [
      '海邊風大，帶件薄外套以備不時之需', '海濱步道無遮擋，夏天做好防曬', '近水處注意安全，尤其帶小朋友時',
      '海風含鹽分，手機相機用完最好清潔一下', '潮漲時部分路段可能濺水，留意腳下路況',
      '海濱長廊是睇日落熱點，黃昏前來氣氛最好',
    ];
    parts.push(p[ph(park.id, 9, p.length)]);
  }

  // 活動 → 針對性貼士（開爐野餐：燒烤 vs 草坪野餐 分流 + 寵物出行）
  const acts = park.activityTypes || [];
  if (acts.includes('開爐野餐')) {
    const hasBBQ = /燒烤/.test(park.features || '');
    const p = hasBBQ
      ? [
          '燒烤爐假日人多，建議提早到場或避開正午高峰',
          '記得自備炭、燒烤叉同食材，公園只提供爐具',
          '燒烤後將炭火完全熄滅、清理乾淨才離開',
          '開爐前留意風向，海邊風大要小心炭火安全',
          '燒烤爐旁通常有野餐桌，早到先有靚位',
          '食完唔好即刻做劇烈運動，慢慢行下幫助消化',
        ]
      : [
          '假日大草坪人多，早到先霸到靚位',
          '野餐記得帶野餐墊同垃圾袋，走時帶走所有垃圾',
          '草坪風大，野餐墊記得用重物壓住四角',
          '樹蔭位有限，記得帶遮陽帽或小帳篷',
          '野餐後記得執返所有食物殘渣，避免招惹蚊蟲',
          '食完慢慢喺園內散步，睇吓風景幫助消化',
        ];
    parts.push(p[ph(park.id, 10, p.length)]);
  }
  if (acts.includes('寵物出行')) {
    const p = [
      '帶毛孩入園全程牽繩，妥善管束以免滋擾他人',
      '帶備狗糞袋，寵物排泄物要即時清理',
      '部分公園設狗廁所同洗手設施，可先查清位置',
      '避開假日人流高峰，平日或清晨遛狗更舒服',
      '記得幫毛孩帶水，公園未必有寵物飲水設施',
      '和其他使用者保持禮貌距離，讓毛孩玩得開心又唔失禮',
    ];
    parts.push(p[ph(park.id, 11, p.length)]);
  }

  if (parts.length === 0) parts.push('放鬆心情，享受公園的綠意與寧靜');
  return parts.join('；') + '。';
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
  if (section && handlers.onShare) {
    const shareBtn = section.querySelector('.share-btn');
    if (shareBtn) shareBtn.removeEventListener('click', handlers.onShare);
  }
  handlers = {};
}

register('page-park-detail', init, destroy);
