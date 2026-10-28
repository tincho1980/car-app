// Genera los íconos de la PWA: el Gauge de lucide (logo del frame 01) sobre el tile accent.
// Uso: npx tsx scripts/generate-icons.ts — los PNG resultantes se commitean.
import sharp from 'sharp';

const ACCENT = '#2F5BFF'; // --accent (claro)
const GAUGE = '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'; // lucide "gauge"

// glyph: fracción del lado que ocupa el ícono. radius: 0 = cuadrado (maskable, Apple).
function svg(size: number, glyph: number, radius: number): string {
  const g = size * glyph;
  const offset = (size - g) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${ACCENT}"/>
  <svg x="${offset}" y="${offset}" width="${g}" height="${g}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GAUGE}</svg>
</svg>`;
}

const icons = [
  { file: 'public/icons/icon-192.png', size: 192, glyph: 0.56, radius: 0.22 },
  { file: 'public/icons/icon-512.png', size: 512, glyph: 0.56, radius: 0.22 },
  // Maskable: fondo a sangre y el ícono dentro de la zona segura (80 %).
  { file: 'public/icons/maskable-512.png', size: 512, glyph: 0.46, radius: 0 },
  { file: 'src/app/apple-icon.png', size: 180, glyph: 0.56, radius: 0 },
  { file: 'src/app/icon.png', size: 64, glyph: 0.62, radius: 0.22 },
];

async function main() {
  for (const { file, size, glyph, radius } of icons) {
    await sharp(Buffer.from(svg(size, glyph, radius)))
      .png()
      .toFile(file);
    console.log(`✓ ${file}`);
  }
}

main();
