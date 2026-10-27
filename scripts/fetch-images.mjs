// Downloads every image listed in scripts/image-sources.json, converts it to
// responsive WebP renditions and writes a manifest the app imports.
//
//   npm run images            -> only processes images that are missing
//   npm run images -- --force -> re-processes everything
//
// To use your own photography instead, put a high-resolution file at
// scripts/originals/<key>.jpg (or .png/.webp). Local originals win over the URL.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/assets/images');
const originalsDir = path.join(root, 'scripts/originals');
const manifestPath = path.join(root, 'src/data/images.generated.json');
const WIDTHS = [640, 1280, 1920];
const force = process.argv.includes('--force');

const { images } = JSON.parse(await fs.readFile(path.join(root, 'scripts/image-sources.json'), 'utf8'));
await fs.mkdir(outDir, { recursive: true });

let manifest = {};
try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch { /* first run */ }

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function localOriginal(key) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const file = path.join(originalsDir, `${key}.${ext}`);
    if (await exists(file)) return fs.readFile(file);
  }
  return null;
}

async function processOne(key, source) {
  const done = await exists(path.join(outDir, `${key}-${WIDTHS.at(-1)}.webp`));
  if (done && manifest[key] && !force) return;

  let input = await localOriginal(key);
  if (!input) {
    const res = await fetch(`https://images.unsplash.com/${source.id}?w=2400&q=85&fm=jpg`);
    if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
    input = Buffer.from(await res.arrayBuffer());
  }

  const base = sharp(input).rotate();
  const meta = await base.metadata();
  for (const width of WIDTHS) {
    await base.clone()
      .resize({ width: Math.min(width, meta.width), withoutEnlargement: true })
      .webp({ quality: width > 1000 ? 74 : 78, effort: 5 })
      .toFile(path.join(outDir, `${key}-${width}.webp`));
  }
  const { dominant } = await base.clone().resize(64).stats();
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');

  manifest[key] = {
    width: meta.width,
    height: meta.height,
    color: hex,
    source: source.id ? `https://unsplash.com/photos/${source.id.replace(/^photo-/, '')}` : 'original',
    existing: Boolean(source.existing),
  };
  console.log(`✓ ${key} (${meta.width}×${meta.height})`);
}

const entries = Object.entries(images);
const queue = [...entries];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const [key, source] = queue.shift();
    try { await processOne(key, source); } catch (err) { console.error(`✗ ${err.message}`); process.exitCode = 1; }
  }
}));

const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
await fs.writeFile(manifestPath, JSON.stringify(sorted, null, 2) + '\n');
console.log(`Manifest: ${Object.keys(sorted).length} images -> ${path.relative(root, manifestPath)}`);
