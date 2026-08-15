/* ========================================
   Fit Text — 标题过长时自动缩小字号
   保持单行居中，不换行、不压到右上角角标
   ======================================== */

/**
 * 运行时测量标题实际宽度，若放不进「左右对称让开角标」的可用宽度，
 * 则逐级缩小字号（最多到 min），短名保持默认字号不变。
 *
 * @param {HTMLElement} el          要适配的标题元素（块级、text-align:center）
 * @param {object}      [opts]
 * @param {number}      [opts.max=18]   默认字号（px）
 * @param {number}      [opts.min=14]   最小字号（px），不低过它
 * @param {HTMLElement} [opts.tagEl=null] 右上角角标元素，用于计算需让开的宽度
 * @param {number}      [opts.gap=8]    标题与角标之间的最小间距（px）
 */
export function fitHeading(el, { max = 18, min = 14, tagEl = null, gap = 8 } = {}) {
  if (!el) return;

  const fullWidth = el.clientWidth;

  // 名称需让开的宽度：从名称右边缘到角标左边缘，再加一点间距（左右对称预留以保持居中）
  let reserve = 0;
  if (tagEl) {
    const elRight = el.getBoundingClientRect().right;
    const tagLeft = tagEl.getBoundingClientRect().left;
    reserve = elRight - tagLeft + gap;
  }
  const available = fullWidth - reserve * 2;
  if (available <= 0) return;

  el.style.whiteSpace = 'nowrap';
  el.style.width = 'max-content';          // 关键：收缩到文字宽度，让 scrollWidth 等于真实文字宽
  let size = max;
  el.style.fontSize = size + 'px';

  while (size > min && el.scrollWidth > available) {
    size -= 0.5;
    el.style.fontSize = size + 'px';
  }

  el.style.whiteSpace = '';
  el.style.width = '';
  el.style.fontSize = size >= max ? '' : size + 'px';
}
