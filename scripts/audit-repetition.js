/* 审计 parks.json 重复度 */
const parks = require('../js/data/parks.json');

// 1. Features 高频词
const featWords = {};
parks.forEach(p => {
  if (!p.features) return;
  p.features.split(' · ').forEach(w => {
    const t = w.trim();
    featWords[t] = (featWords[t] || 0) + 1;
  });
});
console.log('=== Features 高频词 (>2) ===');
Object.entries(featWords).sort((a,b) => b[1]-a[1])
  .filter(([,c]) => c>2)
  .forEach(([w,c]) => console.log(`  ${c}x — ${w}`));

// 2. Description 高频用词
const descPhrases = ['環境清幽', '花木扶疏', '園景優美', '綠樹成蔭', '翠綠山景環繞',
  '海景開揚', '海景迷人', '繁囂', '寧靜', '遠離塵囂'];
const descCounts = {};
parks.forEach(p => {
  if (!p.description) return;
  descPhrases.forEach(ph => {
    if (p.description.includes(ph)) descCounts[ph] = (descCounts[ph]||0)+1;
  });
});
console.log('\n=== Description 高频词 (>3) ===');
Object.entries(descCounts).sort((a,b)=>b[1]-a[1])
  .filter(([,c]) => c>3)
  .forEach(([w,c]) => console.log(`  ${c}x — ${w}`));

// 3. ActivityDescriptions 高频重复
const adPhrases = ['花木扶疏，園景優美', '綠樹成蔭', '翠綠山景環繞', '海景開揚',
  '環境清幽宜人', '拍照打卡位', '時間彷彿靜止', '找個角落坐下', '簡單而寫意',
  '彷彿時間也放慢了腳步', '一個人看海發呆', '都市運動首選', '是街坊的日常運動基地',
  '不知不覺就過了一個下午', '和自己好好相處', '來就對了', '海旁是毛孩的開心天地',
  '讓小朋友安全放電', '兒童遊樂設施齊全', '設備實用', '區內的', '設有兒童遊樂設施',
  '在繁囂中尋得一片綠意', '發呆不需要理由', '是鬧市中的寧靜角落',
  '找一個.*的安靜角落', '每一步都是風景', '海景.*散步賞景兩相宜',
  '吹著海風', '煩惱也隨風而去', '海風是最佳拍檔'];
const adCounts = {};
parks.forEach(p => {
  if (!p.activityDescriptions) return;
  Object.values(p.activityDescriptions).forEach(d => {
    adPhrases.forEach(ph => {
      if (d.includes(ph)) adCounts[ph] = (adCounts[ph]||0)+1;
    });
  });
});
console.log('\n=== ActivityDescriptions 高频重复 (>3) ===');
Object.entries(adCounts).sort((a,b)=>b[1]-a[1])
  .filter(([,c]) => c>3)
  .forEach(([w,c]) => console.log(`  ${c}x — ${w}`));

// 4. 完全相同 description 数量
const descDup = {};
parks.forEach(p => {
  const d = (p.description || '').trim();
  if (d) descDup[d] = (descDup[d] || 0) + 1;
});
const dupDescs = Object.entries(descDup).filter(([,c]) => c > 1);
console.log(`\n=== 完全相同的 description (${dupDescs.length} 组) ===`);
dupDescs.forEach(([d, c]) => console.log(`  ${c}x — "${d.slice(0,80)}"`));
