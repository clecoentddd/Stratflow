const fs = require('fs');
const path = require('path');

const SIZE = 32;
const CENTER = (SIZE - 1) / 2;
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'radar.ico');

const rgba = new Uint8Array(SIZE * SIZE * 4);

const setPixel = (x, y, r, g, b, a = 255) => {
  const index = (y * SIZE + x) * 4;
  rgba[index] = r;
  rgba[index + 1] = g;
  rgba[index + 2] = b;
  rgba[index + 3] = a;
};

for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    let r = 6;
    let g = 18;
    let b = 32;
    let a = 255;

    const dx = x + 0.5 - CENTER;
    const dy = y + 0.5 - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (dist <= 15.2) {
      const t = Math.min(dist / 15.2, 1);
      r = Math.round(18 + (40 - 18) * (1 - t));
      g = Math.round(48 + (190 - 48) * (1 - t));
      b = Math.round(70 + (170 - 70) * (1 - t));
    }

    const ring = (target, thickness, color) => {
      if (Math.abs(dist - target) < thickness) {
        r = color[0];
        g = color[1];
        b = color[2];
      }
    };

    ring(13.8, 0.65, [61, 218, 215]);
    ring(9.8, 0.5, [45, 170, 160]);
    ring(5.6, 0.45, [28, 120, 110]);

    const sweepAngle = -Math.PI / 5;
    const sweepWidth = Math.PI / 18;
    const sweepActive = dist < 15 && Math.abs(angle - sweepAngle) < sweepWidth;
    if (sweepActive) {
      r = Math.max(r, 105);
      g = Math.max(g, 230);
      b = Math.max(b, 224);
    }

    if (dist < 2.2) {
      r = 240;
      g = 255;
      b = 255;
    }

    if (dist < 2.6 && dist > 2.1) {
      r = 150;
      g = 240;
      b = 236;
    }

    if (dist > 15.2) {
      r = 4;
      g = 12;
      b = 24;
    }

    const gridLine = Math.abs(angle - Math.PI / 2) < 0.02 || Math.abs(angle) < 0.02;
    if (gridLine && dist < 15) {
      r = 70;
      g = 180;
      b = 170;
      a = 220;
    }

    setPixel(x, y, r, g, b, a);
  }
}

const xor = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    const src = (y * SIZE + x) * 4;
    const dst = ((SIZE - 1 - y) * SIZE + x) * 4;
    xor[dst] = rgba[src + 2];
    xor[dst + 1] = rgba[src + 1];
    xor[dst + 2] = rgba[src];
    xor[dst + 3] = rgba[src + 3];
  }
}

const maskRowSize = Math.ceil(SIZE / 32) * 4;
const mask = Buffer.alloc(maskRowSize * SIZE, 0x00);

const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0);
dib.writeInt32LE(SIZE, 4);
dib.writeInt32LE(SIZE * 2, 8);
dib.writeUInt16LE(1, 12);
dib.writeUInt16LE(32, 14);
dib.writeUInt32LE(0, 16);
dib.writeUInt32LE(xor.length, 20);
dib.writeInt32LE(0, 24);
dib.writeInt32LE(0, 28);
dib.writeUInt32LE(0, 32);
dib.writeUInt32LE(0, 36);

const imageSize = dib.length + xor.length + mask.length;

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry[0] = SIZE === 256 ? 0 : SIZE;
entry[1] = SIZE === 256 ? 0 : SIZE;
entry[2] = 0;
entry[3] = 0;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(imageSize, 8);
entry.writeUInt32LE(header.length + entry.length, 12);

const ico = Buffer.concat([header, entry, dib, xor, mask]);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, ico);

console.log(`Generated ${OUTPUT_PATH}`);
