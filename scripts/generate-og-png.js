/* ========================================
   Generate Bauhaus PNG for OG image (WeChat compatible)
   ======================================== */
const fs = require('fs');
const zlib = require('zlib');

const W = 600, H = 600;
const data = Buffer.alloc(W * H * 4); // RGBA

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = a;
}

function blendPixel(x, y, r, g, b, alpha) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  const a = alpha / 255;
  data[i]   = Math.round(data[i]   * (1-a) + r * a);
  data[i+1] = Math.round(data[i+1] * (1-a) + g * a);
  data[i+2] = Math.round(data[i+2] * (1-a) + b * a);
}

// Fill cream background
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    setPixel(x, y, 245, 240, 232);

// Black border
for (let x = 10; x < W-10; x++) { setPixel(x,10,17,17,17); setPixel(x,H-11,17,17,17); }
for (let y = 10; y < H-10; y++) { setPixel(10,y,17,17,17); setPixel(W-11,y,17,17,17); }
// 2px thickness
for (let x = 10; x < W-10; x++) { setPixel(x,11,17,17,17); setPixel(x,H-12,17,17,17); }
for (let y = 10; y < H-10; y++) { setPixel(11,y,17,17,17); setPixel(W-12,y,17,17,17); }

// Anti-aliased circle (red, centered around 160, 158, radius 70)
function drawCircleAA(cx, cy, radius, rr, gg, bb) {
  for (let y = Math.max(0, Math.floor(cy-radius-2)); y < Math.min(H, Math.ceil(cy+radius+2)); y++) {
    for (let x = Math.max(0, Math.floor(cx-radius-2)); x < Math.min(W, Math.ceil(cx+radius+2)); x++) {
      const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
      if (d < radius - 1) {
        setPixel(x, y, rr, gg, bb);
      } else if (d < radius + 1) {
        const alpha = Math.max(0, Math.min(255, Math.round((radius + 1 - d) / 2 * 255)));
        blendPixel(x, y, rr, gg, bb, alpha);
      }
    }
  }
}

// Anti-aliased filled rect
function fillRectAA(x1, y1, x2, y2, rr, gg, bb) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      setPixel(x, y, rr, gg, bb);
}

// Anti-aliased circle outline (for black stroke)
function strokeCircleAA(cx, cy, radius, strokeW, rr, gg, bb) {
  for (let y = Math.max(0, Math.floor(cy-radius-strokeW-2)); y < Math.min(H, Math.ceil(cy+radius+strokeW+2)); y++) {
    for (let x = Math.max(0, Math.floor(cx-radius-strokeW-2)); x < Math.min(W, Math.ceil(cx+radius+strokeW+2)); x++) {
      const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
      const inner = radius - strokeW/2;
      const outer = radius + strokeW/2;
      if (d >= inner && d <= outer) {
        const edgeDist = Math.min(d - inner, outer - d);
        if (edgeDist > 1) {
          setPixel(x, y, rr, gg, bb);
        } else if (edgeDist > -1) {
          const alpha = Math.max(0, Math.min(255, Math.round((edgeDist + 1) / 2 * 255)));
          blendPixel(x, y, rr, gg, bb, alpha);
        }
      }
    }
  }
}

// Stroked rect
function strokeRectAA(x1, y1, x2, y2, strokeW, rr, gg, bb) {
  fillRectAA(x1, y1, x2, y1+strokeW-1, rr, gg, bb);
  fillRectAA(x1, y2-strokeW+1, y1, x2, rr, gg, bb);
  fillRectAA(x1, y1, x1+strokeW-1, y2, rr, gg, bb);
  fillRectAA(x2-strokeW+1, y1, x2, y2, rr, gg, bb);
}

// Triangle fill (barycentric)
function fillTriangleAA(x1,y1, x2,y2, x3,y3, rr, gg, bb) {
  const minX = Math.max(0, Math.floor(Math.min(x1,x2,x3)-2));
  const maxX = Math.min(W-1, Math.ceil(Math.max(x1,x2,x3)+2));
  const minY = Math.max(0, Math.floor(Math.min(y1,y2,y3)-2));
  const maxY = Math.min(H-1, Math.ceil(Math.max(y1,y2,y3)+2));
  const area = Math.abs((x2-x1)*(y3-y1) - (x3-x1)*(y2-y1));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = Math.abs((x2-x)*(y3-y) - (x3-x)*(y2-y)) / area;
      const b = Math.abs((x3-x)*(y1-y) - (x1-x)*(y3-y)) / area;
      const c = 1 - a - b;
      if (a >= -0.02 && b >= -0.02 && c >= -0.02) {
        const edgeDist = Math.min(a, b, c);
        if (edgeDist > 0.05) {
          setPixel(x, y, rr, gg, bb);
        } else if (edgeDist > -0.05) {
          const alpha = Math.max(0, Math.min(255, Math.round((edgeDist + 0.05) / 0.1 * 255)));
          blendPixel(x, y, rr, gg, bb, alpha);
        }
      }
    }
  }
}

// Triangle stroke (outline only)
function strokeTriangleAA(x1,y1, x2,y2, x3,y3, strokeW, rr, gg, bb) {
  // simplified: draw lines
  drawLineAA(x1,y1, x2,y2, strokeW, rr, gg, bb);
  drawLineAA(x2,y2, x3,y3, strokeW, rr, gg, bb);
  drawLineAA(x3,y3, x1,y1, strokeW, rr, gg, bb);
}

function drawLineAA(x1,y1,x2,y2,w,rr,gg,bb) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  const ux = -dy/len, uy = dx/len;
  const minX = Math.max(0, Math.floor(Math.min(x1,x2)-w));
  const maxX = Math.min(W-1, Math.ceil(Math.max(x1,x2)+w));
  const minY = Math.max(0, Math.floor(Math.min(y1,y2)-w));
  const maxY = Math.min(H-1, Math.ceil(Math.max(y1,y2)+w));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const proj = ((x-x1)*dx + (y-y1)*dy) / (len*len);
      const cp = Math.abs((x-x1)*ux + (y-y1)*uy);
      if (proj >= -0.02 && proj <= 1.02 && cp < w/2) {
        const edgeDist = w/2 - cp;
        if (edgeDist > 1) setPixel(x,y,rr,gg,bb);
        else if (edgeDist > -1) {
          const alpha = Math.max(0, Math.min(255, Math.round((edgeDist+1)/2*255)));
          blendPixel(x,y,rr,gg,bb,alpha);
        }
      }
    }
  }
}

// === Draw shapes (square 600×600, vibe-hub Bauhaus composition) ===

// Red circle — left side, lower-mid. Center ~(170, 360), radius ~110
drawCircleAA(170, 360, 110, 212, 61, 46);
strokeCircleAA(170, 360, 110, 3, 17, 17, 17);

// Black horizontal bar below the red circle
fillRectAA(70, 480, 530, 498, 17, 17, 17);

// Blue square — upper-right of the red circle
fillRectAA(350, 100, 500, 250, 26, 58, 143);
strokeRectAA(350, 100, 500, 250, 3, 17, 17, 17);

// Yellow triangle — lower-right corner
const tx1=420, ty1=510, tx2=540, ty2=340, tx3=320, ty3=510;
fillTriangleAA(tx1, ty1, tx2, ty2, tx3, ty3, 242, 200, 32);
strokeTriangleAA(tx1, ty1, tx2, ty2, tx3, ty3, 3, 17, 17, 17);

// === Write PNG ===
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, payload) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB = Buffer.alloc(4);
  lenB.writeUInt32BE(payload.length);
  const crcIn = Buffer.concat([typeB, payload]);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(crcIn));
  return Buffer.concat([lenB, typeB, payload, crcB]);
}

// Build raw scanlines (filter byte 0 + RGBA pixels)
const rawLines = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0; // filter: none
  data.copy(row, 1, y * W * 4, (y + 1) * W * 4);
  rawLines.push(row);
}
const raw = Buffer.concat(rawLines);
const compressed = zlib.deflateSync(raw);

const signature = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync('img/og-image.png', png);
console.log('og-image.png created (' + png.length + ' bytes)');
