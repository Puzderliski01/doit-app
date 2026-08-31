const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function createPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // no filter
    for (let x = 0; x < size; x++) {
      // Gradient from center
      const dx = (x - size/2) / (size/2);
      const dy = (y - size/2) / (size/2);
      const dist = Math.min(1, Math.sqrt(dx*dx + dy*dy));
      const brightness = 1 - dist * 0.3;
      row.push(Math.floor(r * brightness), Math.floor(g * brightness), Math.floor(b * brightness));
    }
    rows.push(Buffer.from(row));
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

const dir = path.join(__dirname, 'public');
const files = [
  ['icon-192.png', 192, 245, 158, 11],
  ['icon-512.png', 512, 245, 158, 11],
  ['favicon-32x32.png', 32, 245, 158, 11],
  ['favicon-16x16.png', 16, 245, 158, 11],
  ['apple-touch-icon.png', 180, 245, 158, 11],
  ['og-image.png', 512, 245, 158, 11],
];
files.forEach(([name, size, r, g, b]) => {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, createPNG(size, r, g, b));
    console.log('Created ' + name);
  } else {
    console.log(name + ' exists, skipping');
  }
});
console.log('Done!');
