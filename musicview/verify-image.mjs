import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xD8 || marker === 0xD9) continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (marker >= 0xC0 && marker <= 0xC3) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    offset += length;
  }
  throw new Error('Could not determine JPEG dimensions.');
}

const assets = [
  { file: 'background-desktop-16x9.jpg', width: 1920, height: 1080 },
  { file: 'background-mobile-9x19_5.jpg', width: 1080, height: 2340 }
];

console.log(`Project: ${root}`);
for (const asset of assets) {
  const imagePath = join(root, 'public', asset.file);
  if (!existsSync(imagePath)) throw new Error(`Missing background: ${imagePath}`);
  const dims = jpegSize(await readFile(imagePath));
  console.log(`${asset.file}: ${dims.width}×${dims.height}`);
  if (dims.width !== asset.width || dims.height !== asset.height) {
    throw new Error(`Wrong dimensions for ${asset.file}; expected ${asset.width}×${asset.height}`);
  }
}
console.log('BACKGROUND ASSETS VERIFIED.');
