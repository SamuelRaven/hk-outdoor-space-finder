/* ========================================
   Blind Box Page — 盲盒随机推荐
   localStorage 持久化冷却期（10 小时）
   ======================================== */

import { navigate, register } from '../core/router.js';

const STORAGE_KEY = 'diceTiredUntil';
const COOLDOWN_MS = 10 * 60 * 60 * 1000; // 10 小时
const MAX_ROLLS = 5;

let parks = [];
let rollCount = 0;

// 存储事件 handler 引用，用于 destroy 时清理
let handlers = {};

function init() {
  const section = document.getElementById('page-blindbox');
  const stageEl = document.getElementById('bb-stage');
  const resultEl = document.getElementById('bb-result');
  const retryBtn = document.getElementById('bb-retry');
  const diceEl = document.getElementById('dice-cube');

  // ---- 检查冷却期 ----
  const tiredUntil = localStorage.getItem(STORAGE_KEY);
  if (tiredUntil && Date.now() < Number(tiredUntil)) {
    // 还在冷却中 → 直接跳转累了页面
    navigate('#/dice-tired');
    return;
  }
  // 冷却期已过 → 清除记录
  if (tiredUntil) {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---- 重置状态 ----
  rollCount = 0;

  // ---- 清理旧 listener（防止堆积） ----
  if (handlers.onBack) {
    section.querySelector('[data-action="back"]').removeEventListener('click', handlers.onBack);
  }
  if (handlers.onRetry) {
    retryBtn.removeEventListener('click', handlers.onRetry);
  }

  // ---- 返回按钮 ----
  handlers.onBack = () => navigate('#/filter');
  section.querySelector('[data-action="back"]').addEventListener('click', handlers.onBack);

  // ---- 再投一次 ----
  handlers.onRetry = () => {
    if (rollCount >= MAX_ROLLS) {
      // 写入冷却期，跳转累了页面
      localStorage.setItem(STORAGE_KEY, Date.now() + COOLDOWN_MS);
      navigate('#/dice-tired');
      return;
    }

    resultEl.style.display = 'none';
    retryBtn.style.display = 'none';
    stageEl.style.display = '';
    diceEl.classList.remove('dice-cube--rolling');
    void diceEl.offsetWidth;
    roll(diceEl, stageEl, resultEl, retryBtn);
  };
  retryBtn.addEventListener('click', handlers.onRetry);

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
    rollCount++;
    showResult(park, resultEl, retryBtn);
  }, 1300);
}

function showResult(park, container, retryBtn) {
  // 随机选一个活动类型的描述
  let desc = park.description || '';
  if (park.activityDescriptions) {
    const descs = Object.values(park.activityDescriptions);
    if (descs.length > 0) {
      desc = descs[Math.floor(Math.random() * descs.length)];
    }
  }

  container.innerHTML = `
    <div class="park-card" data-region="${park.region}">
      <div class="park-card__body">
        <div class="park-card__name">${park.nameZh}</div>
        <div class="park-card__hours">${park.openingHours}</div>
        <div class="park-card__desc">${desc}</div>
      </div>
      <span class="park-card__region">${park.region}</span>
    </div>
  `;

  container.style.display = 'block';
  retryBtn.style.display = 'block';
}

function destroy() {
  // 移除事件监听
  const section = document.getElementById('page-blindbox');
  if (section && handlers.onBack) {
    const backBtn = section.querySelector('[data-action="back"]');
    if (backBtn) backBtn.removeEventListener('click', handlers.onBack);
  }
  const retryBtn = document.getElementById('bb-retry');
  if (retryBtn && handlers.onRetry) {
    retryBtn.removeEventListener('click', handlers.onRetry);
  }
  handlers = {};
}

register('page-blindbox', init, destroy);
