// grade.js — the stylization pipeline. A raw photo goes in, a graded canvas
// comes out: luminance is posterized and gradient-mapped through the chosen
// palette, a halftone dot screen is pressed into the darker tones, and the
// result is cached so the editor only pays for the grade once per
// photo + palette + strength combination.

import { buildLut } from './palettes.js';

const MAX_GRADE_DIM = 1152; // graded copies are capped; panels sample from them
const cache = new Map();

export function gradeKey(photoId, paletteName, strength, halftoneOn) {
  return `${photoId}|${paletteName}|${strength.toFixed(2)}|${halftoneOn ? 1 : 0}`;
}

// gradePhoto(photo, paletteName, palette, strength, halftoneOn)
// photo: { id, img } with img a loaded HTMLImageElement.
// strength 0..1 scales the palette's own mix (how far the photo is pushed
// toward full duotone). Returns a canvas holding the graded photo.
export function gradePhoto(photo, paletteName, palette, strength, halftoneOn) {
  const key = gradeKey(photo.id, paletteName, strength, halftoneOn);
  const hit = cache.get(key);
  if (hit) return hit;

  const img = photo.img;
  const scale = Math.min(1, MAX_GRADE_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(2, Math.round(img.naturalWidth * scale));
  const h = Math.max(2, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;
  const lut = buildLut(palette);
  const mix = Math.min(1, palette.mix * (0.35 + 0.65 * strength));
  const keep = 1 - mix;
  const cell = palette.halftoneCell;
  const dotMax = cell * 0.66; // dot radius where the tone is fully dark
  const htStrength = halftoneOn ? palette.halftone : 0;

  for (let y = 0; y < h; y++) {
    const cellY = (y % cell) - cell / 2 + 0.5;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      const li = lum * 3;
      let nr = lut[li] * mix + r * keep;
      let ng = lut[li + 1] * mix + g * keep;
      let nb = lut[li + 2] * mix + b * keep;

      if (htStrength > 0) {
        // Halftone screen: dots grow as the tone darkens. A pixel inside its
        // cell's dot is pulled toward ink; outside it keeps the mapped tone.
        const t = lum / 255;
        const radius = (1 - t) * dotMax;
        const cellX = (x % cell) - cell / 2 + 0.5;
        const dist = Math.sqrt(cellX * cellX + cellY * cellY);
        if (dist < radius) {
          const ink = (1 - dist / Math.max(radius, 0.001)) * htStrength;
          nr *= 1 - ink * 0.55;
          ng *= 1 - ink * 0.55;
          nb *= 1 - ink * 0.45;
        }
      }
      px[i] = nr;
      px[i + 1] = ng;
      px[i + 2] = nb;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  cache.set(key, canvas);
  return canvas;
}

// A soft radial vignette, drawn once per panel size and reused: darkens the
// corners so the panel reads as one printed plate.
export function vignetteCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = canvas.getContext('2d');
  const radius = Math.sqrt(w * w + h * h) * 0.62;
  const grad = ctx.createRadialGradient(w / 2, h / 2, radius * 0.45, w / 2, h / 2, radius);
  grad.addColorStop(0, 'rgba(8,2,18,0)');
  grad.addColorStop(1, 'rgba(8,2,18,0.34)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

// Deterministic film grain: a small noise tile the cover renderer stamps
// over the finished art at low alpha, tiled, so exports keep a print feel.
let grainTile = null;
export function getGrainTile() {
  if (grainTile) return grainTile;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  let seed = 1234567;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  grainTile = canvas;
  return canvas;
}

export function clearGradeCache() {
  cache.clear();
}
