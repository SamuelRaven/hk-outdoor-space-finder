/* ========================================
   Dice Tired Page — 骰子累了（冷却中）
   ======================================== */

import { navigate, register } from '../core/router.js';

function init() {
  const section = document.getElementById('page-dice-tired');

  // 「請明日再來吧~」→ 回到首页
  section.querySelector('[data-action="tomorrow"]').addEventListener('click', () => {
    navigate('#/');
  });

  // 「重置骰子（測試用）」→ 清除 localStorage
  const resetBtn = section.querySelector('[data-action="reset-dice"]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('diceTiredUntil_park');
      localStorage.removeItem('diceRollCount_park');
      localStorage.removeItem('diceTiredUntil_hike');
      localStorage.removeItem('diceRollCount_hike');
      navigate('#/blindbox');
    });
  }
}

function destroy() {
  // 清理
}

register('page-dice-tired', init, destroy);
