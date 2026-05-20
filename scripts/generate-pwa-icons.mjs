import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const avatarPath = join(root, 'public/dr-pap-avatar.png');
const publicDir = join(root, 'public');

async function roundedAvatar(size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );

  return sharp(avatarPath)
    .resize(size, size, { fit: 'cover', position: 'top' })
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

function gradientBackground(size) {
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9dccff"/>
          <stop offset="48%" stop-color="#eaf4ff"/>
          <stop offset="100%" stop-color="#f7fbff"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
    </svg>
  `);
}

function ringPlate(diameter, border) {
  const r = diameter / 2;
  return Buffer.from(`
    <svg width="${diameter}" height="${diameter}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${r}" cy="${r}" r="${r - border / 2}" fill="#ffffff" stroke="#ffffff" stroke-width="${border}"/>
    </svg>
  `);
}

async function buildAppIcon(size, { avatarScale, filename }) {
  const avatarDiameter = Math.round(size * avatarScale);
  const border = Math.max(4, Math.round(size * 0.014));
  const ringDiameter = avatarDiameter + border * 4;
  const offset = Math.round((size - ringDiameter) / 2);
  const avatarOffset = Math.round((size - avatarDiameter) / 2);

  const [bg, ring, avatar] = await Promise.all([
    sharp(gradientBackground(size)).png().toBuffer(),
    sharp(ringPlate(ringDiameter, border)).png().toBuffer(),
    roundedAvatar(avatarDiameter),
  ]);

  await sharp(bg)
    .composite([
      { input: ring, left: offset, top: offset },
      { input: avatar, left: avatarOffset, top: avatarOffset },
    ])
    .png()
    .toFile(join(publicDir, filename));

  console.log(`Generated ${filename}`);
}

async function buildMaskableIcon(size, filename) {
  const avatarDiameter = Math.round(size * 0.52);
  const border = Math.max(4, Math.round(size * 0.012));
  const ringDiameter = avatarDiameter + border * 4;
  const offset = Math.round((size - ringDiameter) / 2);
  const avatarOffset = Math.round((size - avatarDiameter) / 2);

  const solidBg = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#dceaf8"/>
    </svg>
  `);

  const [bg, ring, avatar] = await Promise.all([
    sharp(solidBg).png().toBuffer(),
    sharp(ringPlate(ringDiameter, border)).png().toBuffer(),
    roundedAvatar(avatarDiameter),
  ]);

  await sharp(bg)
    .composite([
      { input: ring, left: offset, top: offset },
      { input: avatar, left: avatarOffset, top: avatarOffset },
    ])
    .png()
    .toFile(join(publicDir, filename));

  console.log(`Generated ${filename}`);
}

await buildAppIcon(512, { avatarScale: 0.72, filename: 'icon-512.png' });
await buildAppIcon(192, { avatarScale: 0.72, filename: 'icon-192.png' });
await buildAppIcon(180, { avatarScale: 0.72, filename: 'apple-touch-icon.png' });
await buildMaskableIcon(512, 'icon-512-maskable.png');
