/* ========================================
   Photon (Komoot) 地理编码脚本 v2
   公园: "nameZh, district, Hong Kong"
   山径: 提取 section 起点地名查询
   频率: ~1 req/s
   ======================================== */

const fs = require('fs');
const https = require('https');

const PHOTON = 'https://photon.komoot.io/api/';
const DELAY = 600;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function photon(query) {
  return new Promise((resolve, reject) => {
    const url = `${PHOTON}?q=${encodeURIComponent(query)}&limit=1`;
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const geojson = JSON.parse(data);
          const features = geojson.features || [];
          if (features.length > 0) {
            const f = features[0];
            const props = f.properties || {};
            resolve({
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              name: props.name || '',
              osmType: props.osm_key + '/' + props.osm_value,
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 从 section 字段提取起点地名
 * "第一段：北潭涌至浪茄" → "北潭涌"
 * "第三段：伯公坳至昂坪" → "伯公坳"
 * 没有 section 或无法解析时返回 null
 */
function extractStartPoint(trail) {
  if (!trail.section) return null;
  // 匹配 "：" 之后到 "至" 之前的内容
  const m = trail.section.match(/[：:]\s*(.+?)\s*至/);
  return m ? m[1] : null;
}

async function main() {
  console.log('=== Photon 地理编码 v2 ===\n');

  // ---- 公园 (和 v1 一样) ----
  const parks = JSON.parse(fs.readFileSync('js/data/parks.json', 'utf8'));
  const parkResults = {};
  let parkHit = 0;

  console.log(`公园: ${parks.length} 个\n`);
  for (let i = 0; i < parks.length; i++) {
    const p = parks[i];
    const query = `${p.nameZh}, ${p.district}, Hong Kong`;
    const result = await photon(query);
    const icon = result ? '✅' : '❌';
    if (result) parkHit++;

    parkResults[p.id] = result;
    const detail = result
      ? `  → lat=${result.lat.toFixed(6)} lng=${result.lng.toFixed(6)}  ${result.name}`
      : '  → 未命中';
    console.log(`[${String(i + 1).padStart(3, '0')}/${parks.length}] ${icon} ${p.id}${detail}`);

    if (i < parks.length - 1) await sleep(DELAY);
  }

  console.log(`\n公园命中: ${parkHit}/${parks.length} (${(parkHit / parks.length * 100).toFixed(1)}%)`);

  // ---- 山径 (用起点地名) ----
  const trails = JSON.parse(fs.readFileSync('js/data/trails.json', 'utf8'));
  const trailResults = {};
  let trailHit = 0;

  // 用于跟踪坐标唯一性
  const coordSeen = {};

  console.log(`\n山径: ${trails.length} 个\n`);
  for (let i = 0; i < trails.length; i++) {
    const t = trails[i];
    const startPoint = extractStartPoint(t);

    let query;
    if (startPoint) {
      // 有 section → 用起点地名
      query = `${startPoint}, ${t.district}, Hong Kong`;
    } else if (t.section) {
      // 有 section 但解析失败 → 用 section 原文
      query = `${t.section}, ${t.district}, Hong Kong`;
    } else {
      // 独立路线/郊遊徑 → 用 nameZh
      query = `${t.nameZh}, ${t.district}, Hong Kong`;
    }

    const result = await photon(query);
    const icon = result ? '✅' : '❌';
    if (result) trailHit++;

    // 检查坐标是否和之前重复
    let dupNote = '';
    if (result) {
      const key = result.lat.toFixed(4) + ',' + result.lng.toFixed(4);
      if (coordSeen[key]) {
        dupNote = ` ⚠ 坐标重复 (also: ${coordSeen[key]})`;
      } else {
        coordSeen[key] = t.id;
      }
    }

    trailResults[t.id] = {
      ...result,
      query,
      startPoint: startPoint || null,
    };
    const detail = result
      ? `  → lat=${result.lat.toFixed(6)} lng=${result.lng.toFixed(6)}  ${result.name}${dupNote}`
      : '  → 未命中';
    const src = startPoint ? `[起点:${startPoint}]` : '[nameZh]';
    console.log(`[${String(i + 1).padStart(3, '0')}/${trails.length}] ${icon} ${t.id} ${src}${detail}`);

    if (i < trails.length - 1) await sleep(DELAY);
  }

  // 统计坐标去重情况
  let uniqueCoords = 0;
  const seenKeys = {};
  for (const [, v] of Object.entries(trailResults)) {
    if (!v) continue;
    const key = v.lat.toFixed(5) + ',' + v.lng.toFixed(5);
    if (!seenKeys[key]) { seenKeys[key] = true; uniqueCoords++; }
  }

  console.log(`\n山径命中: ${trailHit}/${trails.length} (${(trailHit / trails.length * 100).toFixed(1)}%)`);
  console.log(`山径独立坐标数: ${uniqueCoords}/${trails.length}`);

  // ---- 保存 ----
  const output = {
    generatedAt: new Date().toISOString(),
    source: 'photon.komoot.io (OpenStreetMap)',
    parks: parkResults,
    trails: trailResults,
    summary: {
      parkHit, parkMiss: parks.length - parkHit, parkTotal: parks.length,
      trailHit, trailMiss: trails.length - trailHit, trailTotal: trails.length,
      trailUniqueCoords: uniqueCoords,
    }
  };

  fs.writeFileSync('scripts/photon-results.json', JSON.stringify(output, null, 2), 'utf8');
  console.log('\n✅ 结果已保存到 scripts/photon-results.json');

  const missedParks = Object.entries(parkResults).filter(([, v]) => !v).map(([k]) => k);
  const missedTrails = Object.entries(trailResults).filter(([, v]) => !v).map(([k]) => k);
  if (missedParks.length) console.log(`\n⚠ 未命中公园 (${missedParks.length}): ${missedParks.join(', ')}`);
  if (missedTrails.length) console.log(`\n⚠ 未命中山径 (${missedTrails.length}): ${missedTrails.join(', ')}`);
}

main().catch(console.error);
