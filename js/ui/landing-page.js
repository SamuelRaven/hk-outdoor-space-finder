/* ========================================
   Landing Page — 首页
   ======================================== */

import { navigate, register } from '../core/router.js';

function init() {
  const section = document.getElementById('page-landing');

  // 按钮1：户外公共空间/公园 → 跳转筛选页
  const btnParks = section.querySelector('[data-action="parks"]');
  btnParks.addEventListener('click', () => {
    navigate('#/filter');
  });

  // 按钮2：大自然徒步登山 → 跳转徒步筛选页
  const btnHiking = section.querySelector('[data-action="hiking"]');
  btnHiking.addEventListener('click', () => {
    navigate('#/hiking-filter');
  });
}

function destroy() {
  // 清理工作（如有需要）
}

// 注册到路由
register('page-landing', init, destroy);
