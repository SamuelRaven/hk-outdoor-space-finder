/* ========================================
   Share — 分享工具 (Web Share API + clipboard fallback)
   ======================================== */

/**
 * 分享内容（优先 Web Share API，失败则复制链接）
 * @param {{ title: string, text: string, url: string }} opts
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
export async function shareItem({ title, text, url }) {
  // Web Share API — 移动端原生分享面板
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      // 用户取消不算错误，继续走 fallback
      if (err.name === 'AbortError') return 'cancelled';
    }
  }

  // Fallback: 复制链接到剪贴板
  try {
    await navigator.clipboard.writeText(text + '\n' + url);
    return 'copied';
  } catch {
    // 最后的保底 — 选中文本让用户手动复制
    return 'failed';
  }
}

/**
 * 构建公园分享文案
 */
export function getParkShareText(park) {
  const featureText = park.features || '';
  const desc = park.description || '';
  const sub = featureText || desc.slice(0, 40);

  return {
    title: `🌿 ${park.nameZh}`,
    text: [`${park.region} · ${park.district}`, sub].filter(Boolean).join('\n'),
    url: buildShareUrl(`#/park/${park.id}`),
  };
}

/**
 * 构建山径分享文案
 */
export function getTrailShareText(trail) {
  const desc = (trail.description || '').slice(0, 50);

  return {
    title: `🥾 ${trail.nameZh}`,
    text: [
      `${trail.region} · ${trail.district}`,
      `${trail.difficulty} · ${trail.lengthKm}km`,
      desc,
    ].filter(Boolean).join('\n'),
    url: buildShareUrl(`#/trail/${trail.id}`),
  };
}

function buildShareUrl(hash) {
  return window.location.origin + window.location.pathname + hash;
}
