/* ========================================
   Share — 分享工具 (Web Share API)
   ======================================== */

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

/**
 * 分享内容
 * @param {{ title: string, text: string, url: string }} opts
 * @returns {Promise<'shared'|'cancelled'|'wechat'|'failed'>}
 */
export async function shareItem({ title, text, url }) {
  // 微信环境不支持
  if (isWeChat()) return 'wechat';

  // Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
    }
  }

  return 'failed';
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
