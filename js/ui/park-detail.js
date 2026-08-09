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

// ---- 智能生成：打卡建議（5 類 × 多變體 = 豐富不重複） ----
function buildParkSpot(park) {
  const type = park.parkType || '';
  const hi = parkHash(park.id, 5);

  const seasideSpots = [
    '黃昏時分的海濱步道是黃金打卡位，背光剪影效果一流。沿著海岸線走，每個彎位都有不同景緻。',
    '建議在日落前半小時到達，天空從金黃漸變粉紫的背景配上維港天際線，張張都是明信片級別。',
    '清晨的海濱人煙稀少，晨光灑在水面上的波光粼粼是最佳拍攝素材。帶杯咖啡慢慢行，享受城市未甦醒前的寧靜。',
    '入夜後的海濱長廊別有風情，對岸燈火倒映水面，用長曝光拍攝光影軌跡效果出眾。',
    '海濱長廊的彎位和觀景台是天然構圖框，利用欄杆、長椅作前景，拍出層次感豐富的畫面。',
  ];

  const urbanSpots = [
    '公園內的涼亭、人工湖、大樹下都是熱門取景點。建議在非繁忙時段前往，獨享靜謐氛圍。',
    '市區公園的幾何線條豐富——筆直的行人道、圓形花圃、方正草坪，都是極簡構圖的好素材。',
    '午後陽光穿過樹葉形成的光斑是天然濾鏡，找一片草地躺下仰望天空，隨手拍都有電影感。',
    '公園內的遊樂設施在傍晚時分色彩飽和度最高，配合夕陽側光拍出來的效果特別溫暖。',
  ];

  const greenSpots = [
    '大片草地配上遠山背景，野餐墊一鋪就是天然攝影棚。清晨或雨後光線最柔和。',
    '郊野綠地的開闊感是市區無法複製的，建議帶上廣角鏡頭，將藍天綠地一次收入畫面。',
    '陰天反而是拍攝郊野的最佳天氣——光線均勻柔和，綠色飽和度更高，人像膚色也更自然。',
  ];

  const gardenSpots = [
    '園內的對稱設計和幾何花圃極具構圖感，帶上廣角鏡頭吧。每個季節的花卉主題都不同。',
    '中式園林的借景手法非常講究——透過圓形月門或漏窗框景拍攝，畫面自帶古典詩意。',
    '園林中的水景倒影是最被低估的打卡位，風平浪靜時湖面如鏡，上下對稱的畫面令人驚艷。',
    '不妨留意腳下的鵝卵石鋪地紋樣和頭上的飛檐翹角，細節之美往往藏在意想不到的角度。',
  ];

  const pocketSpots = [
    '鬧市中的小綠洲，找個長椅或樹蔭下的角落，隨手拍都有城市與自然交融的對比感。',
    '休憩花園雖小但處處是景——斑駁的樹影、古舊的石凳、攀滿藤蔓的花架，拍出具質感的日常生活照。',
    '建議以微距鏡頭或手機微距模式拍攝花卉和葉脈紋理，小公園裡的微觀世界同樣精彩。',
  ];

  const maps = {
    '海濱長廊': seasideSpots,
    '市區公園': urbanSpots,
    '郊野綠地': greenSpots,
    '主題園林': gardenSpots,
    '休憩花園': pocketSpots,
  };

  const pool = maps[type];
  return pool ? pool[hi % pool.length] : '隨心漫步，每個角落都可以是你的打卡位。找個自己喜歡的角度按下快門，那就是最好的風景。';
}

// ---- 智能生成：出行貼士（多維度交叉組合，豐富多變） ----
function buildParkTips(park) {
  const parts = [];
  const times = park.bestTime || [];
  const type = park.parkType || '';
  const acts = park.activityTypes || [];
  const hi = parkHash(park.id, 4) + 1; // 1-4 用於選取變體語句

  // 時間相關貼士
  if (times.includes('清晨')) {
    const morningTips = [
      '清晨公園人流最少，空氣清新，是晨運最佳時段，建議穿輕便運動裝',
      '早晨露水未乾，草地可能較濕滑，穿防滑鞋更安心',
    ];
    parts.push(morningTips[hi % morningTips.length]);
  }
  if (times.includes('中午')) {
    parts.push('正午陽光猛烈，記得塗防曬、戴太陽眼鏡，定時補充水分');
  }
  if (times.includes('下午')) {
    const afternoonTips = [
      '下午陽光柔和，是拍照和散步的黃金時段，帶件薄外套以備不時之需',
      '下午茶時間來公園最寫意，不妨帶本書或帶份小食，享受慢活時光',
    ];
    parts.push(afternoonTips[hi % afternoonTips.length]);
  }
  if (times.includes('傍晚')) {
    const duskTips = [
      '傍晚是欣賞日落的絕佳時機，建議提前 15 分鐘到達搵個好位',
      '黃昏光線變化最快，想影靚相記得把握日落前後那 20 分鐘',
    ];
    parts.push(duskTips[hi % duskTips.length]);
  }
  if (times.includes('夜晚')) {
    parts.push('夜間公園燈光較暗，注意腳下安全，建議穿著淺色或反光衣物');
  }

  // 公園類型相關貼士
  if (type === '郊野綠地') {
    const greenTips = [
      '草地蚊蟲較多，出發前噴定防蚊液，著長褲更穩陣',
      '郊野區域手機訊號可能較弱，建議預先下載離線地圖',
    ];
    parts.push(greenTips[hi % greenTips.length]);
  }
  if (type === '海濱長廊') {
    const seasideTips = [
      '海風較大，建議穿著防風衣物，避免戴易吹走的帽子',
      '海濱步道無遮擋，夏天記得做足防曬措施，帶備充足飲用水',
    ];
    parts.push(seasideTips[hi % seasideTips.length]);
  }
  if (type === '主題園林') {
    parts.push('不妨先了解一下公園的歷史背景和設計理念，遊覽時更有共鳴');
  }

  // 活動相關貼士
  if (acts.includes('寵物出行')) {
    const petTips = [
      '記得帶備寵物飲用水及垃圾袋，做個負責任的主人，保持公園清潔',
      '建議帶寵物在非繁忙時段前往，避開人多擠迫，毛孩玩得更開心',
    ];
    parts.push(petTips[hi % petTips.length]);
  }
  if (acts.includes('運動出汗')) {
    const sportTips = [
      '運動前做好熱身拉筋，避免受傷。公園飲水機可補充水分',
      '建議穿著透氣速乾衣物，帶條毛巾，運動後抹乾以免吹風著涼',
    ];
    parts.push(sportTips[hi % sportTips.length]);
  }
  if (acts.includes('親子放電')) {
    parts.push('帶小朋友出遊記得備妥零食、飲用水和替換衣物，玩得盡興又安心');
  }
  if (acts.includes('安靜發呆')) {
    parts.push('找個樹蔭下的長椅，帶上耳機和一本書，這裡就是你的城市避風港');
  }

  // 確保至少有一條貼士
  if (parts.length === 0) {
    const defaults = [
      '放鬆心情，享受在公園的每一刻，讓綠意療癒你的身心',
      '隨心而行，不必趕行程，公園就是城市裡最慷慨的喘息空間',
    ];
    parts.push(defaults[hi % defaults.length]);
  }

  // 去重後拼接（避免恰好選到相同內容）
  const unique = [...new Set(parts)];
  return unique.join('。') + '。';
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
