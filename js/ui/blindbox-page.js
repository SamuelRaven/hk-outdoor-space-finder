/* ========================================
   Blind Box Page — 盲盒随机推荐
   localStorage 持久化：每 10 小时 10 次限额（独立计数）
   ======================================== */

import { navigate, register } from '../core/router.js';

const STORAGE_KEY = 'diceTiredUntil_park';
const COUNT_KEY = 'diceRollCount_park';
const COOLDOWN_MS = 10 * 60 * 60 * 1000;
const MAX_ROLLS = 10;

let parks = [];
let handlers = {};
let cachedPark = null;   // 从详情页返回时恢复

function init() {
  const section = document.getElementById('page-blindbox');
  const stageEl = document.getElementById('bb-stage');
  const resultEl = document.getElementById('bb-result');
  const retryBtn = document.getElementById('bb-retry');
  const diceEl = document.getElementById('dice-cube');

  // ---- 检查冷却期 ----
  const tiredUntil = localStorage.getItem(STORAGE_KEY);
  if (tiredUntil && Date.now() < Number(tiredUntil)) {
    navigate('#/dice-tired');
    return;
  }
  if (tiredUntil) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUNT_KEY);
  }

  // ---- 检查今日次数 ----
  const count = Number(localStorage.getItem(COUNT_KEY)) || 0;
  if (count >= MAX_ROLLS) {
    localStorage.setItem(STORAGE_KEY, Date.now() + COOLDOWN_MS);
    navigate('#/dice-tired');
    return;
  }

  // ---- 清理旧 listener ----
  if (handlers.onBack) {
    const backBtn = section.querySelector('[data-action="back"]');
    if (backBtn) backBtn.removeEventListener('click', handlers.onBack);
  }
  if (handlers.onRetry) {
    retryBtn.removeEventListener('click', handlers.onRetry);
  }
  if (handlers.onCardClick) {
    resultEl.removeEventListener('click', handlers.onCardClick);
  }

  // ★ 事件委托必须在缓存检查之前设置，否则从详情页返回时卡片不可点击
  handlers.onCardClick = (e) => {
    const card = e.target.closest('[data-park-id]');
    if (!card) return;
    sessionStorage.setItem('detailReferrer', '#/blindbox');
    navigate(`#/park/${card.dataset.parkId}`);
  };
  resultEl.addEventListener('click', handlers.onCardClick);

  // ---- 返回按钮 ----
  handlers.onBack = () => {
    cachedPark = null;
    navigate('#/filter');
  };
  section.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);

  // ---- 再投一次 ----
  handlers.onRetry = () => {
    const cur = Number(localStorage.getItem(COUNT_KEY)) || 0;
    if (cur >= MAX_ROLLS) {
      cachedPark = null;
      localStorage.setItem(STORAGE_KEY, Date.now() + COOLDOWN_MS);
      navigate('#/dice-tired');
      return;
    }

    cachedPark = null;
    resultEl.style.display = 'none';
    retryBtn.style.display = 'none';
    stageEl.style.display = '';
    diceEl.classList.remove('dice-cube--rolling');
    void diceEl.offsetWidth;
    roll(diceEl, stageEl, resultEl, retryBtn);
  };
  retryBtn.addEventListener('click', handlers.onRetry);

  // ---- 从详情页返回 → 恢复缓存结果，不重新投骰子 ----
  if (cachedPark) {
    stageEl.style.display = 'none';
    diceEl.classList.remove('dice-cube--rolling');
    resultEl.style.display = 'block';
    retryBtn.style.display = 'block';
    showResult(cachedPark, resultEl, retryBtn);
    return;
  }

  // ---- 重置 UI（首次进入） ----
  stageEl.style.display = 'flex';
  resultEl.style.display = 'none';
  resultEl.innerHTML = '';
  retryBtn.style.display = 'none';
  diceEl.classList.remove('dice-cube--rolling');
  void stageEl.offsetWidth;

  // ---- 首次加载 & 开投 ----
  if (parks.length === 0) {
    fetch('js/data/parks.json')
      .then(r => r.json())
      .then(data => {
        parks = data;
        roll(diceEl, stageEl, resultEl, retryBtn);
      });
  } else {
    roll(diceEl, stageEl, resultEl, retryBtn);
  }
}

function roll(diceEl, stageEl, resultEl, retryBtn) {
  const park = parks[Math.floor(Math.random() * parks.length)];

  requestAnimationFrame(() => {
    diceEl.classList.add('dice-cube--rolling');
  });

  setTimeout(() => {
    diceEl.classList.remove('dice-cube--rolling');
    stageEl.style.display = 'none';

    const cur = Number(localStorage.getItem(COUNT_KEY)) || 0;
    localStorage.setItem(COUNT_KEY, cur + 1);

    showResult(park, resultEl, retryBtn);
  }, 1300);
}

function buildDiceNote(park) {
  // 简单 hash 取 variant
  const h = park.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  if (park.parkType === '海濱長廊') {
    const p = ['海風吹拂的步道，黃昏時分最迷人～', '沿海散步總能讓人心情平靜下來～', '記得帶件薄外套，海邊風大但很舒服～'];
    return p[h % p.length];
  } else if (park.parkType === '市區公園') {
    const p = ['鬧市中的綠洲，放工過來行個圈剛剛好～', '交通超方便，隨時都可以來歇歇～', '城市裡的後花園，忙裡偷閒的最佳選擇～'];
    return p[h % p.length];
  } else if (park.parkType === '郊野綠地') {
    const p = ['遠離塵囂的好去處，預留半天慢慢探索～', '山林中的寧靜角落，記得帶水和小食～', '大自然的懷抱，深呼吸放鬆身心～'];
    return p[h % p.length];
  } else if (park.parkType === '主題園林') {
    const p = ['每個角落都有設計巧思，慢慢走用心看～', '園林一步一景，手機記得充滿電～', '精緻的景觀設計，像走進一幅山水畫～'];
    return p[h % p.length];
  }
  // 休憩花園
  const p = ['小巧安靜的角落，帶本書來坐坐很愜意～', '社區中的秘密花園，獨處放空的好地方～', '麻雀雖小五臟俱全，短暫休息剛剛好～'];
  return p[h % p.length];
}

function showResult(park, container, retryBtn) {
  cachedPark = park;  // ★ 缓存，供详情页返回时恢复

  let desc = park.description || '';
  if (park.activityDescriptions) {
    const descs = Object.values(park.activityDescriptions);
    if (descs.length > 0) {
      desc = descs[Math.floor(Math.random() * descs.length)];
    }
  }

  const diceNote = buildDiceNote(park);
  const diceNoteHtml = diceNote
    ? `<div class="park-card__dynamic-note">🎲 根據命運骰子的結果：${diceNote}</div>`
    : '';

  container.innerHTML = `
    <div class="park-card" data-region="${park.region}" data-park-id="${park.id}" style="cursor:pointer;">
      <div class="park-card__body">
        <div class="park-card__name">${park.nameZh}</div>
        <div class="park-card__hours">${park.openingHours}</div>
        <div class="park-card__desc">${desc}</div>
        ${diceNoteHtml}
      </div>
      <span class="park-card__region">${park.region}</span>
    </div>
  `;

  container.style.display = 'block';
  retryBtn.style.display = 'block';
}

function destroy() {
  const section = document.getElementById('page-blindbox');
  if (section && handlers.onBack) {
    const backBtn = section.querySelector('[data-action="back"]');
    if (backBtn) backBtn.removeEventListener('click', handlers.onBack);
  }
  const retryBtn = document.getElementById('bb-retry');
  if (retryBtn && handlers.onRetry) {
    retryBtn.removeEventListener('click', handlers.onRetry);
  }
  const resultEl = document.getElementById('bb-result');
  if (resultEl && handlers.onCardClick) {
    resultEl.removeEventListener('click', handlers.onCardClick);
  }
  handlers = {};
}

register('page-blindbox', init, destroy);
