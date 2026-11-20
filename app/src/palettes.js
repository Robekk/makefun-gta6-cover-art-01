// palettes.js — colour grades for Marina Heat Cover Studio.
//
// Each palette is a gradient map: a photo's luminance is pushed through the
// stops (shadow -> highlight) after a posterize step, which is what gives the
// covers their printed-poster look. `mix` blends the mapped colour back with
// the original photo (1 = full duotone, lower = photo-real warmth), and the
// halftone fields drive the dot screen laid over the shadows and midtones.

export const PALETTES = {
  sunset: {
    label: 'Sunset',
    stops: [
      [0.0, '#22103f'],
      [0.34, '#7b2d8b'],
      [0.6, '#e84e7a'],
      [0.82, '#ff8c42'],
      [1.0, '#ffe9b8'],
    ],
    posterize: 6,
    mix: 0.92,
    halftone: 0.34,
    halftoneCell: 7,
    titleGradient: ['#ffd23e', '#ff7a3d', '#e8328a', '#7b2ff7'],
    sky: ['#2a1052', '#8e2a8c', '#e84e7a', '#ff9a3d'],
  },
  heatwave: {
    label: 'Heatwave',
    stops: [
      [0.0, '#150830'],
      [0.3, '#5b2ee5'],
      [0.55, '#d626c8'],
      [0.78, '#ff5e3a'],
      [1.0, '#fff3a0'],
    ],
    posterize: 5,
    mix: 1.0,
    halftone: 0.5,
    halftoneCell: 6,
    titleGradient: ['#fff3a0', '#ffb03a', '#ff2e9a', '#5b2ee5'],
    sky: ['#1a0533', '#5b2ee5', '#d626c8', '#ff5e3a'],
  },
  neon: {
    label: 'Neon Nights',
    stops: [
      [0.0, '#040714'],
      [0.32, '#0b3d91'],
      [0.58, '#00b8d9'],
      [0.8, '#ff2e9a'],
      [1.0, '#d8ffe8'],
    ],
    posterize: 6,
    mix: 0.95,
    halftone: 0.3,
    halftoneCell: 7,
    titleGradient: ['#a8fff0', '#00d9ff', '#2e7aff', '#ff2e9a'],
    sky: ['#040714', '#0b3d91', '#00b8d9', '#123a6d'],
  },
  golden: {
    label: 'Golden Hour',
    stops: [
      [0.0, '#2e1c0e'],
      [0.4, '#8a5a24'],
      [0.7, '#d99a3d'],
      [1.0, '#ffedb5'],
    ],
    posterize: 14,
    mix: 0.45,
    halftone: 0.14,
    halftoneCell: 8,
    titleGradient: ['#fff0b3', '#ffc93d', '#ff8c42', '#c2502e'],
    sky: ['#33200f', '#8a5a24', '#d99a3d', '#ffedb5'],
  },
  lagoon: {
    label: 'Lagoon',
    stops: [
      [0.0, '#062a33'],
      [0.38, '#0e7d86'],
      [0.66, '#39c2a5'],
      [0.85, '#ffd166'],
      [1.0, '#fff6d8'],
    ],
    posterize: 7,
    mix: 0.9,
    halftone: 0.3,
    halftoneCell: 7,
    titleGradient: ['#fff6d8', '#ffd166', '#39c2a5', '#0e7d86'],
    sky: ['#062a33', '#0e7d86', '#39c2a5', '#ffd166'],
  },
};

export const PALETTE_ORDER = ['heatwave', 'sunset', 'neon', 'golden', 'lagoon'];

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Builds a 256-entry lookup table for one palette: entry i is the mapped
// [r, g, b] for luminance i, with the posterize step already folded in.
export function buildLut(palette) {
  const stops = palette.stops.map(([pos, hex]) => [pos, hexToRgb(hex)]);
  const lut = new Uint8Array(256 * 3);
  const levels = Math.max(2, palette.posterize);
  for (let i = 0; i < 256; i++) {
    let t = i / 255;
    // Posterize: snap luminance to a small set of bands so flat areas of the
    // photo become flat ink, the way a screen-printed poster behaves.
    t = Math.round(t * (levels - 1)) / (levels - 1);
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    lut[i * 3] = Math.round(a[1][0] + (b[1][0] - a[1][0]) * f);
    lut[i * 3 + 1] = Math.round(a[1][1] + (b[1][1] - a[1][1]) * f);
    lut[i * 3 + 2] = Math.round(a[1][2] + (b[1][2] - a[1][2]) * f);
  }
  return lut;
}
