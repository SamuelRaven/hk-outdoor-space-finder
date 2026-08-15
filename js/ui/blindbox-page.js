/* ========================================
   Blind Box Page — 盲盒随机推荐
   localStorage 持久化：每 10 小时 10 次限额（独立计数）
   ======================================== */

import { navigate, register } from '../core/router.js';
import { calcDistance } from '../core/geo.js?v=4';
import { formatDistance } from '../core/format.js?v=4';
import { fitHeading } from '../core/fit-text.js?v=2';

const STORAGE_KEY = 'diceTiredUntil_park';
const COUNT_KEY = 'diceRollCount_park';
const COOLDOWN_MS = 10 * 60 * 60 * 1000;
const MAX_ROLLS = 10;

const PARK_TYPE_COLORS = { '海濱長廊': 'blue', '市區公園': 'purple', '郊野綠地': 'green', '主題園林': 'teal', '休憩花園': 'orange' };

let parks = [];
let handlers = {};
let cachedPark = null;   // 从详情页返回时恢复
let userCoords = null;

function init() {
  const section = document.getElementById('page-blindbox');
  const stageEl = document.getElementById('bb-stage');
  const resultEl = document.getElementById('bb-result');
  const retryBtn = document.getElementById('bb-retry');
  const diceEl = document.getElementById('dice-cube');

  // ---- 读取用户坐标（如有） ----
  if (!userCoords) {
    const stored = sessionStorage.getItem('userCoords');
    if (stored) { try { userCoords = JSON.parse(stored); } catch {} }
  }

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
    fetch('js/data/parks.json?v=7')
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
  const h = park.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  if (park.parkType === '海濱長廊') {
    const p = [
      '今天去聽聽海浪的聲音，把煩惱都沖走～',
      '讓海風替你整理今天的思緒～',
      '海不會問你為什麼累，它只會靜靜陪著你～',
    ];
    return p[h % p.length];
  } else if (park.parkType === '市區公園') {
    const p = [
      '即使身在城市中央，也值得為自己偷半小時的閒～',
      '鋼筋森林裡的一小片綠，提醒你生活不只是趕路～',
      '鬧市中的喘息片刻，今天你值得這份寧靜～',
    ];
    return p[h % p.length];
  } else if (park.parkType === '郊野綠地') {
    const p = [
      '把手機放下，讓眼睛被綠色好好治癒～',
      '是時候重新連接大自然了～',
      '城市給不了的平靜，山林會加倍補給你～',
    ];
    return p[h % p.length];
  } else if (park.parkType === '主題園林') {
    const p = [
      '美就藏在細節裡，今天放慢腳步去發現～',
      '別趕路，每一處都值得停留～',
      '園林的每一塊石頭都有故事，你只需要坐下來感受～',
    ];
    return p[h % p.length];
  }
  // 休憩花園
  const p = [
    '最好的時光是一個人坐著，什麼都不想～',
    '小地方往往有大滿足～',
    '不需要很大的地方，一個寧靜的角落就夠治癒一整天～',
  ];
  return p[h % p.length];
}

function showResult(park, container, retryBtn) {
  cachedPark = park;  // ★ 缓存，供详情页返回时恢复

  let desc = park.description || '';

  let distanceHtml = '';
  if (userCoords && park.lat != null && park.lng != null) {
    const km = calcDistance(userCoords.lat, userCoords.lng, park.lat, park.lng);
    distanceHtml = `  <span class="emoji">📍</span> ${formatDistance(km)}`;
  }

  const diceNote = buildDiceNote(park);
  const diceNoteHtml = diceNote
    ? `<div class="park-card__dynamic-note"><span class="emoji">🎲</span> 根據命運骰子的結果：${diceNote}</div>`
    : '';

  container.innerHTML = `
    <div class="park-card" data-region="${park.region}" data-park-id="${park.id}" style="cursor:pointer;">
      <div class="park-card__body">
        <div class="park-card__name">${park.nameZh}</div>
        <div class="park-card__hours">${park.openingHours}${distanceHtml}</div>
        <div class="park-card__desc">${desc}</div>
        ${diceNoteHtml}
      </div>
      <span class="park-card__type park-card__type--${PARK_TYPE_COLORS[park.parkType]}">${park.parkType}</span>
    </div>
  `;

  container.style.display = 'block';
  retryBtn.style.display = 'block';

  fitHeading(container.querySelector('.park-card__name'), {
    tagEl: container.querySelector('.park-card__type'),
  });
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
