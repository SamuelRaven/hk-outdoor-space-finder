/* ========================================
   生成公园/山径分享落地页
   每个页面只有 OG 标签 + 自动跳转
   ======================================== */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://samuelraven.github.io/hk-outdoor-space-finder';

const parks = JSON.parse(fs.readFileSync('js/data/parks.json', 'utf-8'));
const trails = JSON.parse(fs.readFileSync('js/data/trails.json', 'utf-8'));

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildParkOG(park) {
  const sub = park.features || (park.description || '').slice(0, 40);
  const desc = [`${park.region} · ${park.district}`, sub].filter(Boolean).join(' — ');
  return {
    title: `🌿 ${park.nameZh}`,
    description: desc,
    url: `${BASE_URL}/share/park/${park.id}.html`,
    redirect: `${BASE_URL}/#/park/${park.id}`,
  };
}

function buildTrailOG(trail) {
  const desc = (trail.description || '').slice(0, 50);
  const parts = [
    `${trail.region} · ${trail.district}`,
    `${trail.difficulty} · ${trail.lengthKm}km`,
    desc,
  ].filter(Boolean);
  return {
    title: `🥾 ${trail.nameZh}`,
    description: parts.join(' — '),
    url: `${BASE_URL}/share/trail/${trail.id}.html`,
    redirect: `${BASE_URL}/#/trail/${trail.id}`,
  };
}

function buildPage(og) {
  return `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${og.title}</title>
<meta property="og:title" content="${og.title}">
<meta property="og:description" content="${og.description}">
<meta property="og:url" content="${og.url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="香港戶外空間推薦">
<script>window.location.replace('${og.redirect}');</script>
</head>
<body>
<a href="${og.redirect}">${og.title}</a>
</body>
</html>`;
}

// 生成公园页面
ensureDir('share/park');
let parkCount = 0;
for (const park of parks) {
  const html = buildPage(buildParkOG(park));
  fs.writeFileSync(`share/park/${park.id}.html`, html, 'utf-8');
  parkCount++;
}
console.log(`✓ ${parkCount} 公园分享页已生成 → share/park/`);

// 生成山径页面
ensureDir('share/trail');
let trailCount = 0;
for (const trail of trails) {
  const html = buildPage(buildTrailOG(trail));
  fs.writeFileSync(`share/trail/${trail.id}.html`, html, 'utf-8');
  trailCount++;
}
console.log(`✓ ${trailCount} 山径分享页已生成 → share/trail/`);
console.log(`✓ 总计 ${parkCount + trailCount} 个分享落地页`);
