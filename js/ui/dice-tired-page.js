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

}

function destroy() {
  // 清理
}

register('page-dice-tired', init, destroy);
