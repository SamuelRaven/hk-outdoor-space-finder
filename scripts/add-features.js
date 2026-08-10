/* 从 description 提取真实设施写入 features，不做编造 */
const fs = require('fs');

const parks = JSON.parse(fs.readFileSync('js/data/parks.json', 'utf-8'));

// 仅从 description 明确提及的设施提取，description 模糊的不做猜测
const map = {
  tamar:   '漂浮舞台 · 巨型草坪 · 維港全景',
  hrp:     '亭台樓閣 · 兒童遊樂場',
  chater:  '中央噴泉 · 開闊草坪',
  bbp:     '寵物公園 · 兒童遊樂場',
  vpg:     '歷史涼亭 · 大草坪',
  cwdpr:   '緩跑徑 · 休憩區',
  wcp:     '兒童遊樂場 · 長者健身設施',
  abp:     '開放式草坪 · 水景設施',
  aplc:    '兒童遊樂場 · 休憩區',
  wtp:     '10米觀景台 · 展覽廊',
  wfbp:    '天然瀑布',
  cyber:   '大草坪 · 寵物友善',
  chk:     '燒烤區 · 休憩亭',
  smhp:    '山林步道 · 花園',
  cherry:  '人造草足球場 · 籃球場 · 網球場 · 緩跑徑',
  sghill:  '愛德華時代訊號塔',
  tstep:   '觀景平台',
  uc:      '噴泉 · 花園',
  kpp:     '球類設施 · 兒童遊樂場',
  wkcd:    '大草坪 · 寵物友善',
  skmp:    '體育館 · 足球場 · 籃球場 · 網球場',
  tcs:     '球場 · 兒童遊樂場',
  fhp:     '大草坪 · 球場',
  kwt:     '清代江南園林 · 衙門遺跡 · 亭台樓閣',
  ktct:    '大草坪 · 維港景觀',
  ktrp:    '航空歷史主題 · 360度海景',
  cdap:    '工業歷史建築',
  crp:     '單車徑 · 兒童遊樂場 · 球場',
  hsp:     '海心石 · 涼亭 · 海濱步道',
  hutp:    '池塘 · 涼亭 · 瀑布',
  ksrp:    '園景花園 · 兒童遊樂場 · 球場',
  pkvrp:   '單車場 · 滑板場 · 球類設施',
  lrp:     '燒烤區 · 步道',
  nl:      '唐代園林 · 山水盆景 · 錦鯉池 · 金色圓滿閣',
  ftp:     '園景花園 · 兒童遊樂場 · 球場',
  // hhp 描述僅"環境清幽"，不做編造
  jvp:     '遙控模型車場 · 兒童遊樂場 · 緩跑徑 · 大草坪',
  ktp:     '感官花園 · 兒童遊樂場 · 特色燈光裝置',
  ntkp:    '兒童遊樂場 · 長者健身區',
  laguna:  '兒童遊樂場 · 休憩區',
  klbp:    '運動場 · 單車場 · 兒童遊樂場',
  cklwp:   '兒童遊樂場 · 寵物公園',
  mosprom: '單車徑 · 緩跑徑 · 九重葛花園',
  yckp:    '步道 · 休憩區',
  hkvelo:  '園景花園 · 兒童遊樂場',
  ptp:     '園景花園 · 兒童遊樂場 · 球場',
  hmklp:   '涼亭 · 花園',
  tkowp:   '單車徑 · 緩跑徑 · 寵物公園',
  tmsp:    '花園 · 兒童遊樂場 · 休憩區',
  tpkp:    '園景花園 · 休憩區 · 寵物友善',
  twrp:    '兒童遊樂場 · 海濱步道',
  jctw:    '歷史建築 · 涼亭 · 池塘',
  typrom:  '步道 · 單車徑',
  kcp:     '步道 · 兒童遊樂場',
  sylmp:   '水中涼亭 · 中日合璧園林',
  tmprom:  '步道 · 休憩區',
  hkwt:    '展覽廊 · 觀鳥屋 · 紅樹林步道',
  mtrp:    '兒童遊樂場',
  ccp:     '兒童遊樂場 · 球場',
  pswc:    '海濱步道 · 吐露港景觀',
  flrp:    '蓄水池塘 · 水榭樓閣 · 假山 · 七彩花圃',
  bfp:     '燒烤場 · 露營區 · 迷宮 · 海濱長廊',
  tcnp:    '籃球場 · 排球場 · 足球場 · 中藥園',
  yzcp:    '三面環海 · 吐露港景觀',
  wsp:     '草地 · 兒童遊樂場 · 緩跑徑',
};

let added = 0;
for (const park of parks) {
  if (map[park.id]) {
    park.features = map[park.id];
    added++;
  }
}

fs.writeFileSync('js/data/parks.json', JSON.stringify(parks, null, 2), 'utf-8');
console.log(`✓ 已為 ${added} 個公園添加 features`);
const remaining = parks.filter(p => !p.features || !p.features.trim());
console.log(`✗ 仍有 ${remaining.length} 個公園無 features（description 模糊，不做編造）`);
remaining.forEach(p => console.log(`  ${p.id} | ${p.nameZh} | ${p.parkType}`));
