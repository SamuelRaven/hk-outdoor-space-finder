/* ========================================
   Landing Page — 首页
   ======================================== */

import { navigate, register } from '../core/router.js';
import { showToast } from './toast.js';

function init() {
  const section = document.getElementById('page-landing');

  // 按钮1：户外公共空间/公园 → 跳转筛选页
  const btnParks = section.querySelector('[data-action="parks"]');
  btnParks.addEventListener('click', () => {
    navigate('#/filter');
  });

  // 按钮2：大自然徒步登山 → 弹 toast
  const btnHiking = section.querySelector('[data-action="hiking"]');
  btnHiking.addEventListener('click', () => {
    showToast('此房間還在裝修中哦~');
  });
}

function destroy() {
  // 清理工作（如有需要）
}

// 注册到路由
register('page-landing', init, destroy);
