/* ========================================
   Hiking Blind Box Page — 徒步盲盒随机推荐
   localStorage 持久化：每 10 小时 10 次限额（独立计数）
   ======================================== */

import { navigate, register } from '../core/router.js';

const STORAGE_KEY = 'diceTiredUntil_hike';
const COUNT_KEY = 'diceRollCount_hike';
const COOLDOWN_MS = 10 * 60 * 60 * 1000;
const MAX_ROLLS = 10;

let trails = [];
let handlers = {};
let cachedTrail = null;  // 从详情页返回时恢复

function init() {
  const section = document.getElementById('page-hiking-blindbox');
  const stageEl = document.getElementById('hiking-bb-stage');
  const resultEl = document.getElementById('hiking-bb-result');
  const retryBtn = document.getElementById('hiking-bb-retry');
  const diceEl = document.getElementById('hiking-dice-cube');

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

  // ---- 检查次数 ----
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

  // ★ 事件委托必须在缓存检查之前设置
  handlers.onCardClick = (e) => {
    const card = e.target.closest('[data-trail-id]');
    if (!card) return;
    sessionStorage.setItem('detailReferrer', '#/hiking-blindbox');
    navigate(`#/trail/${card.dataset.trailId}`);
  };
  resultEl.addEventListener('click', handlers.onCardClick);

  // ---- 返回按钮 ----
  handlers.onBack = () => {
    cachedTrail = null;
    navigate('#/hiking-filter');
  };
  section.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);

  // ---- 再投一次 ----
  handlers.onRetry = () => {
    const cur = Number(localStorage.getItem(COUNT_KEY)) || 0;
    if (cur >= MAX_ROLLS) {
      cachedTrail = null;
      localStorage.setItem(STORAGE_KEY, Date.now() + COOLDOWN_MS);
      navigate('#/dice-tired');
      return;
    }

    cachedTrail = null;
    resultEl.style.display = 'none';
    retryBtn.style.display = 'none';
    stageEl.style.display = '';
    diceEl.classList.remove('dice-cube--rolling');
    void diceEl.offsetWidth;
    roll(diceEl, stageEl, resultEl, retryBtn);
  };
  retryBtn.addEventListener('click', handlers.onRetry);

  // ---- 从详情页返回 → 恢复缓存结果 ----
  if (cachedTrail) {
    stageEl.style.display = 'none';
    diceEl.classList.remove('dice-cube--rolling');
    resultEl.style.display = 'block';
    retryBtn.style.display = 'block';
    showResult(cachedTrail, resultEl, retryBtn);
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
  if (trails.length === 0) {
    fetch('js/data/trails.json')
      .then(r => r.json())
      .then(data => {
        trails = data;
        roll(diceEl, stageEl, resultEl, retryBtn);
      });
  } else {
    roll(diceEl, stageEl, resultEl, retryBtn);
  }
}

function roll(diceEl, stageEl, resultEl, retryBtn) {
  const trail = trails[Math.floor(Math.random() * trails.length)];

  requestAnimationFrame(() => {
    diceEl.classList.add('dice-cube--rolling');
  });

  setTimeout(() => {
    diceEl.classList.remove('dice-cube--rolling');
    stageEl.style.display = 'none';

    const cur = Number(localStorage.getItem(COUNT_KEY)) || 0;
    localStorage.setItem(COUNT_KEY, cur + 1);

    showResult(trail, resultEl, retryBtn);
  }, 1300);
}

function showResult(trail, container, retryBtn) {
  cachedTrail = trail;  // ★ 缓存，供详情页返回时恢复

  const sectionText = trail.trailName
    ? `${trail.trailName} — ${trail.section}`
    : trail.section;

  let tipsHtml = '';
  if (trail.tips) {
    tipsHtml += `<div class="trail-card__tips">💡 ${trail.tips}</div>`;
  }

  const diceNote = buildDiceNote(trail);
  const diceNoteHtml = diceNote
    ? `<div class="trail-card__dynamic-note">🎲 根據命運骰子的結果：${diceNote}</div>`
    : '';

  container.innerHTML = `
    <div class="trail-card" data-difficulty="${trail.difficulty}" data-trail-id="${trail.id}" style="cursor:pointer;">
      <div class="trail-card__body">
        <div class="trail-card__name">${trail.nameZh}</div>
        <div class="trail-card__section">${sectionText}</div>
        <div class="trail-card__meta">
          <span class="trail-card__stat">🕐 ${trail.durationHrs} 小時</span>
          <span class="trail-card__stat">🥾 ${trail.lengthKm} 公里</span>
        </div>
        <div class="trail-card__desc">${trail.description}</div>
        ${tipsHtml}
        ${diceNoteHtml}
      </div>
      <span class="trail-card__difficulty">${trail.difficulty}</span>
    </div>
  `;

  container.style.display = 'block';
  retryBtn.style.display = 'block';
}

function buildDiceNote(trail) {
  if (trail.difficulty === '著咩鞋都腳軟') {
    return '高難度路線！務必結伴同行及做好充足準備';
  } else if (trail.difficulty === '著行山鞋穩陣D') {
    return '中等難度路線，出發前記得查看天氣預報～';
  }
  return '輕鬆路線，放心享受大自然吧！';
}

function destroy() {
  const section = document.getElementById('page-hiking-blindbox');
  if (section && handlers.onBack) {
    const backBtn = section.querySelector('[data-action="back"]');
    if (backBtn) backBtn.removeEventListener('click', handlers.onBack);
  }
  const retryBtn = document.getElementById('hiking-bb-retry');
  if (retryBtn && handlers.onRetry) {
    retryBtn.removeEventListener('click', handlers.onRetry);
  }
  const resultEl = document.getElementById('hiking-bb-result');
  if (resultEl && handlers.onCardClick) {
    resultEl.removeEventListener('click', handlers.onCardClick);
  }
  handlers = {};
}

register('page-hiking-blindbox', init, destroy);
