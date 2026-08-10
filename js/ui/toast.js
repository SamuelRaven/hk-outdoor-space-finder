/* ========================================
   Toast 提示组件
   ======================================== */

let toastTimer = null;

/**
 * 显示 toast 提示
 * @param {string} message - 提示文字
 * @param {number} [duration=2000] - 显示时长（毫秒）
 */
export function showToast(message, duration = 2000) {
  // 移除已有的 toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  // 创建新 toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  document.body.appendChild(toast);

  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  // 定时消失
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
