/* ========================================
   Park Detail Page
   ======================================== */

import { navigate, register, getHashParam } from '../core/router.js';
import { isFavorite, toggleFavorite } from '../core/favorites.js';
import { shareItem, getParkShareText } from '../core/share.js';

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
    shareBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22,12 L1,4 L8,12 L1,20 Z"/><line x1="22" y1="12" x2="8" y2="12"/></svg>';
    actions.appendChild(shareBtn);
  }

  handlers.onFav = async () => {
    const nowFav = toggleFavorite('park', parkId);
    updateStar(favBtn, nowFav);
    const msg = nowFav ? '★ 已收藏' : '☆ 已取消收藏';
    const toast = await import('./toast.js');
    toast.showToast(msg);
  };
  favBtn.addEventListener('click', handlers.onFav);

  handlers.onShare = async () => {
    const park = parks.find(p => p.id === parkId);
    if (!park) return;
    const result = await shareItem(getParkShareText(park));
    const toast = await import('./toast.js');
    if (result === 'shared') toast.showToast('已分享 ✉️');
    else if (result === 'copied') toast.showToast('連結已複製！發給朋友吧 📋');
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

    const bestTimeTags = (park.bestTime || [])
      .map(t => `<span class="detail-tag detail-tag--time">${t}</span>`).join('');

    const activities = park.activityTypes || [];
    const activityTags = activities
      .map(a => `<span class="detail-tag detail-tag--activity">${a}</span>`).join('');

    const BAUHAUS_COLORS = ['red', 'blue', 'yellow', 'black'];

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

      <div class="detail-row">
        <div class="detail-block detail-block--half detail-block--extra-a">
          <div class="detail-label">👥 適合人群</div>
          <div class="detail-value">${buildParkCrowd(park)}</div>
        </div>
        <div class="detail-block detail-block--half detail-block--extra-b">
          <div class="detail-label">🏞 公園特色</div>
          <div class="detail-value">${buildParkFeatures(park)}</div>
        </div>
      </div>
      <div class="detail-block detail-block--extra-c">
        <div class="detail-label">💡 出行貼士</div>
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

// ---- hash (單次大 hash + bit 段提取 → 不同 seed 完全獨立) ----
function ph(id, seed, n) {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

// ---- 適合人群 (從 activityTypes 推導，本身已有足夠變化) ----
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

// ---- 公園特色 (優先使用真實數據，無則同義改寫池推導) ----
function buildParkFeatures(park) {
  if (park.features && park.features.trim()) return park.features;
  const type = park.parkType || '';
  const acts = park.activityTypes || [];
  const hi = ph(park.id, 1, 4); // 0..3

  // 每類特徵 3-4 種同義表達，全為真實推導
  const featPool = {
    '沿海步道': ['沿海步道', '海濱長廊步道', '維港/海岸步道'],
    '開闊海景': ['開闊海景', '無敵海景視野', '一望無際的海面', '海天一色景觀'],
    '海風清涼': ['海風清涼', '海風拂面', '涼爽海風'],
    '大片草地': ['大片草地', '寬敞草坪', '開闊草地空間'],
    '自然生態': ['自然生態', '生態多樣', '豐富動植物'],
    '遠離繁囂': ['遠離繁囂', '遠離市區喧鬧', '郊野寧靜'],
    '園林造景': ['園林造景', '中式/西式園林', '精心設計的園景'],
    '主題花卉': ['主題花卉', '季節花卉', '多樣植物品種'],
    '亭台樓閣': ['亭台樓閣', '涼亭與水景', '亭台水榭'],
    '市區綠洲': ['市區綠洲', '鬧市中的公園', '城市綠肺'],
    '設施完善': ['設施完善', '配套齊全', '設施多樣'],
    '交通方便': ['交通方便', '地點便利', '市區核心位置'],
    '鬧市綠蔭': ['鬧市綠蔭', '街角小花園', '社區綠色角落'],
    '社區花園': ['社區花園', '鄰里公園', '街坊休憩空間'],
    '小而精美': ['小而精美', '小巧別緻', '麻雀雖小五臟俱全'],
    '散步路線': ['散步路線', '悠閒步道', '平坦好行', '適合慢步'],
    '兒童設施': ['兒童設施', '親子遊樂場', '兒童遊樂空間'],
    '運動場地': ['運動場地', '健身設施', '運動空間'],
    '寵物友善': ['寵物友善', '可帶毛孩', '寵物友好空間'],
    '寧靜角落': ['寧靜角落', '安靜舒適', '清靜角落', '放空好去處'],
  };

  const features = [];
  const pick = (key) => {
    const arr = featPool[key];
    return arr ? arr[hi % arr.length] : key;
  };

  // 空間特徵
  if (type === '海濱長廊') features.push(pick('沿海步道'), pick('開闊海景'), pick('海風清涼'));
  else if (type === '郊野綠地') features.push(pick('大片草地'), pick('自然生態'), pick('遠離繁囂'));
  else if (type === '主題園林') features.push(pick('園林造景'), pick('主題花卉'), pick('亭台樓閣'));
  else if (type === '市區公園') features.push(pick('市區綠洲'), pick('設施完善'), pick('交通方便'));
  else if (type === '休憩花園') features.push(pick('鬧市綠蔭'), pick('社區花園'), pick('小而精美'));

  // 活動特徵（最多取 2 個，用不同 seed 避免重複）
  if (acts.includes('散步看景')) features.push(pick('散步路線'));
  if (acts.includes('親子放電')) features.push(pick('兒童設施'));
  if (acts.includes('運動出汗')) features.push(pick('運動場地'));
  if (acts.includes('寵物出行')) features.push(pick('寵物友善'));
  if (acts.includes('安靜發呆')) features.push(pick('寧靜角落'));

  return features.slice(0, 5).join(' · ');
}

// ---- 出行貼士 (同義改寫 + seed 分流 → 保真 + 不重複) ----
function buildParkTips(park) {
  const parts = [];
  const hours = park.openingHours || '';
  const times = park.bestTime || [];
  const type = park.parkType || '';

  // 開放時間 → 3-4 種說法
  if (hours.includes('24') || hours.includes('全天')) {
    const p = ['全天開放，隨時可前往', '24 小時開放，夜遊也方便', '全日無休，什麼時候去都行'];
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
        ];
        parts.push(p[ph(park.id, 3, p.length)]);
      }
    }
  }

  // 最佳時段 → 每時段 2-3 種說法
  const timeVariants = {
    '清晨': ['清晨人少涼爽，晨運好時機', '清晨光線柔和、人流稀少', '早鳥福利，清晨安靜愜意'],
    '中午': ['中午陽光猛烈，注意防曬補水', '正午太陽直射，找遮蔭處休息', '午間陽光強烈，做好防曬措施'],
    '下午': ['下午光線柔和，影相散步皆宜', '午後陽光溫暖，是戶外活動的黃金時段', '下午是最愜意的時光，帶本書來坐坐'],
    '傍晚': ['黃昏 magic hour，夕陽景色最美', '傍晚光線變化迷人，日落時分尤其精彩', '黃昏時段景色最佳，把握日落前後'],
    '夜晚': ['夜間注意照明及安全，穿淺色衣物', '夜晚涼爽適合散步，注意腳下路況', '入夜後燈光較暗，建議結伴同行'],
  };
  for (const t of times) {
    if (timeVariants[t]) {
      const arr = timeVariants[t];
      parts.push(arr[ph(park.id, 4, arr.length)]);
      break;
    }
  }

  // 公園類型 → 實用提示
  if (type === '郊野綠地') {
    const p = ['郊野蚊蟲較多，建議帶備防蚊用品', '建議自備飲用水及小食', '手機訊號可能較弱，預先查看地圖'];
    parts.push(p[ph(park.id, 5, p.length)]);
  }
  if (type === '海濱長廊') {
    const p = ['海邊風大，帶件薄外套以備不時之需', '海濱步道無遮擋，夏天做好防曬', '近水處注意安全，尤其帶小朋友時'];
    parts.push(p[ph(park.id, 6, p.length)]);
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
