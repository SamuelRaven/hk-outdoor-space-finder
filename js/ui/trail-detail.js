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

// ---- 智能生成：適合人群（難度 × 長度 × 風景 → 豐富組合） ----
function buildCrowd(trail) {
  const d = trail.difficulty;
  const km = trail.lengthKm || 0;
  const scenery = trail.scenery || [];
  const hi = trailHash(trail.id, 4);

  // 按難度分級
  if (d === '著波鞋就得') {
    const easyTemplates = [
      '適合任何年齡層——親子同行、長者散步、情侶拍拖皆宜。路面平坦易行，新手入門首選，無需特別體能要求。',
      '老少咸宜的輕鬆路線，一家大細出遊最適合。推嬰兒車也無壓力，沿途休息點充足。',
    ];
    let base = easyTemplates[hi % easyTemplates.length];
    if (km > 8) base += ' 全程超過 8 公里距離較長，雖無難度但建議預留充足時間慢慢行。';
    if (scenery.includes('山海之間')) base += ' 海景相伴一路涼風習習，是週末放鬆身心的理想選擇。';
    if (scenery.includes('水庫平湖')) base += ' 湖畔路段景色寧靜，非常適合帶上相機慢行拍攝。';
    return base;
  }

  if (d === '著行山鞋穩陣D') {
    const midTemplates = [
      '適合有一定體能基礎的行山愛好者。建議有基本戶外經驗，不適合完全新手或行動不便人士。',
      '中等難度路線，適合平時有運動習慣的朋友。部分路段需手腳並用，建議結伴同行互相照應。',
    ];
    let base = midTemplates[hi % midTemplates.length];
    if (km > 8) base += ' 路程超過 8 公里，建議帶足補給並提早出發。';
    if (km <= 5) base += ' 路程不算長，是從入門級進階到中級的最佳試煉場。';
    if (scenery.includes('登頂大景')) base += ' 登頂後的壯麗全景是對汗水最好的回報。';
    if (scenery.includes('歷史遺跡')) base += ' 沿途的歷史痕跡為這條路線增添了一份獨特韻味。';
    return base;
  }

  // 著咩鞋都腳軟
  const hardTemplates = [
    '適合體能較好、經驗豐富的行山者。路線涉及長距離或大幅爬升，不建議新手或體能一般人士挑戰。出發前務必檢查天氣預報。',
    '挑戰級路線，適合追求突破的老手。需要良好的體能基礎和充足準備，新手切勿獨自嘗試。',
  ];
  let base = hardTemplates[hi % hardTemplates.length];
  if (km > 10) base += ' 長距離加上高難度地形，務必帶備充足糧水，預留一整天的時間。';
  if (scenery.includes('山海之間')) base += ' 雖然辛苦，但山海交織的絕美景觀絕對值回票價。';
  if (scenery.includes('瀑布溪澗')) base += ' 沿途溪澗是炎夏的天然降溫站，但雨天後水位上漲需格外小心。';
  return base;
}

// ---- 智能生成：裝備建議（按難度和路況動態組合） ----
function buildGear(trail) {
  const parts = [];
  const d = trail.difficulty;
  const s = trail.surface || '';
  const km = trail.lengthKm || 0;

  // 水量根據長度調整
  if (km > 10) parts.push('充足飲用水（最少 2L，夏天建議 3L）');
  else if (km > 5) parts.push('充足飲用水（最少 1.5L）');
  else parts.push('飲用水（最少 1L）');

  // 鞋子建議
  if (d === '著咩鞋都腳軟') {
    parts.push('高幫防滑行山鞋（必備！路況崎嶇）');
  } else if (d === '著行山鞋穩陣D') {
    parts.push('防滑行山鞋');
  } else if (s.includes('山徑') || s.includes('混合')) {
    parts.push('舒適運動鞋或行山鞋');
  } else {
    parts.push('輕便波鞋即可');
  }

  // 輔助裝備
  if (s.includes('山徑') || s.includes('泥') || d === '著咩鞋都腳軟') {
    parts.push('行山杖（上落坡減輕膝蓋負擔）');
  }
  if (s.includes('樓梯')) {
    parts.push('護膝（大量石級對膝蓋負荷大）');
  }

  // 進階裝備
  if (d === '著咩鞋都腳軟') {
    parts.push('急救包及頭燈（以備不時之需）');
    parts.push('高熱量補給食物（能量棒、朱古力、堅果）');
  }
  if (km > 8) {
    parts.push('後備糧食及電解質飲品（長途必備）');
  }

  // 通用
  parts.push('防曬用品（帽、太陽眼鏡、防曬霜）');
  parts.push('防蚊措施（蚊怕水或防蚊貼）');

  return parts.join('、');
}

// ---- 智能生成：沿途看點（6 種風景 × 多變體 = 豐富不重複） ----
function buildHighlights(trail) {
  const sceneries = trail.scenery || [];
  const hi = trailHash(trail.id, 4);
  const lines = [];

  // 每種風景類型提供 4 個變體
  const sceneryPool = {
    '山海之間': [
      '沿途飽覽山巒與大海交織的壯麗景觀，天氣晴朗時視野極佳，海天一色的畫面令人屏息。',
      '一邊是翠綠山巒一邊是蔚藍大海，海風陣陣吹來帶著鹹味，是這條路線最獨特的享受。',
      '山海並存的景色在香港並不多見——左邊是起伏的山脊線，右邊是無垠的藍色大海，步步皆景。',
      '居高臨下俯瞰大海，看著船隻在海面劃出白浪，城市的煩囂在這一刻變得遙遠。',
    ],
    '深山林蔭': [
      '全程穿梭於茂密樹林之中，綠蔭蔽日，夏日行走亦不覺酷熱。可聆聽鳥鳴與溪澗流水聲。',
      '林蔭夾道的路段是天然的冷氣走廊，樹葉過濾後的陽光溫柔灑落，走起來格外舒服。',
      '置身參天古樹之間，抬頭只見樹冠交織成綠色穹頂，彷彿走進了一座森林教堂。',
      '密林深處的空氣格外清新，深吸一口滿是草木清香——這是都市裡花錢也買不到的奢侈。',
    ],
    '水庫平湖': [
      '途經水塘或蓄水湖，平靜水面倒映山色，是絕佳的打卡位。建議在湖畔稍作停留。',
      '水塘的湖面如鏡，將藍天白雲和四周山色完整複製一份，上下對稱的畫面美得如同畫作。',
      '秋冬時節水位稍降，露出的湖岸線和枯樹別有蕭瑟之美，是攝影愛好者的私房取景地。',
      '沿水塘而行，水面隨光線變化呈現不同色調——清晨的銀灰、正午的湛藍、黃昏的金橙各具韻味。',
    ],
    '登頂大景': [
      '登上高點可俯瞰整片區域的天際線，山頂風大建議帶備風衣，360 度無死角大景等你來。',
      '攻頂後的滿足感無可比擬，腳下是連綿山脈，遠處是城市輪廓，天地之大盡收眼底。',
      '山頂是整條路線的高潮——站在制高點環顧四周，所有上坡的汗水在這一刻都值了。',
      '山頂視野開闊，天氣好時甚至可以看到深圳——那種一覽眾山小的感覺，只有親身體會才懂。',
    ],
    '瀑布溪澗': [
      '路線經過瀑布或溪澗，水聲潺潺，夏季水量充沛時最為壯觀。注意石面濕滑。',
      '溪澗的流水聲是行山途中最動聽的背景音樂。脫下鞋子坐在大石上泡腳，疲勞瞬間消散。',
      '瀑布從高處傾瀉而下，水花四濺帶來陣陣涼意——炎炎夏日裡的天然冷氣，是這條路線的最大彩蛋。',
      '沿溪而行，清澈見底的溪水在陽光下閃爍，偶爾還能看到小魚小蝦在水中穿梭。',
    ],
    '歷史遺跡': [
      '沿途可見古舊村落、砲台或廟宇遺址，感受香港百年歷史印記。不妨查查背後的故事再出發。',
      '石砌古道和頹垣敗瓦默默訴說著昔日的故事——行山不只是運動，更是穿越時光的旅行。',
      '每一處遺跡都是一個時代的見證：戰時炮台、客家圍村、百年古道……讓這條路線多了一份歷史厚度。',
      '路上的老石碑和古橋是拍照好題材，配上黑白濾鏡效果一流，文青打卡必到。',
    ],
  };

  sceneries.forEach(s => {
    if (sceneryPool[s]) {
      const variants = sceneryPool[s];
      lines.push(variants[hi % variants.length]);
    }
  });

  if (lines.length === 0) {
    const defaults = [
      '沿途自然風光優美，放慢腳步細心欣賞，每個轉角都可能藏著意想不到的風景。',
      '這條路線的魅力在於細節——路邊的野花、頭頂的飛鳥、腳下的卵石，都值得你駐足欣賞。',
    ];
    lines.push(defaults[hi % defaults.length]);
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
