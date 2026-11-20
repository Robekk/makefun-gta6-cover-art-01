// layouts.js — the panel grids. Every template returns normalized panels
// (fractions of the cover's width and height) plus a title zone: either an
// overlay the title is printed across (over a scrim at the foot of the art)
// or a dedicated panel of its own, the way the classic multi-panel covers
// give the lettering a plate to itself. Gutters between panels stay white:
// the renderer paints the whole cover white first, so the gaps become the
// keylines that separate the plates.

const G = 0.014; // gutter, as a fraction of the cover width

function panel(x, y, w, h) {
  return { x, y, w, h };
}

export const LAYOUTS = {
  showcase: {
    label: 'Showcase',
    build(aspect) {
      // Big hero on the left, two plates stacked on the right, and a strip
      // of three thin plates along the foot. Title overlays the hero's foot.
      const heroW = aspect > 1.2 ? 0.56 : 0.58;
      const rightX = heroW + G;
      const rightW = 1 - rightX;
      const stackH = (0.72 - G) / 2;
      return {
        panels: [
          panel(0, 0, heroW, 0.72),
          panel(rightX, 0, rightW, stackH),
          panel(rightX, stackH + G, rightW, stackH),
          panel(0, 0.72 + G, 0.32, 1 - 0.72 - G),
          panel(0.32 + G, 0.72 + G, 0.32, 1 - 0.72 - G),
          panel(0.64 + G * 2, 0.72 + G, 1 - 0.64 - G * 2, 1 - 0.72 - G),
        ],
        title: { mode: 'overlay', x: 0.03, y: 0.4, w: heroW + 0.06, h: 0.58 },
      };
    },
  },

  mosaic: {
    label: 'Mosaic',
    build() {
      // A tall portrait plate on the left, a column of three small plates in
      // the middle, a big plate top-right, and the title on its own plate
      // bottom-right — the most poster-like of the grids.
      const midX = 0.34 + G;
      const midW = 0.26;
      const rightX = midX + midW + G;
      const rightW = 1 - rightX;
      const cellH = (1 - G * 2) / 3;
      return {
        panels: [
          panel(0, 0, 0.34, 1),
          panel(midX, 0, midW, cellH),
          panel(midX, cellH + G, midW, cellH),
          panel(midX, (cellH + G) * 2, midW, cellH),
          panel(rightX, 0, rightW, 0.6),
        ],
        title: { mode: 'panel', x: rightX, y: 0.6 + G, w: rightW, h: 1 - 0.6 - G },
      };
    },
  },

  strips: {
    label: 'Strips',
    build() {
      // Four full-height vertical strips, slightly uneven widths, with the
      // title printed across a scrim band at the foot.
      const widths = [0.27, 0.22, 0.24, 0.27];
      const panels = [];
      let x = 0;
      for (let i = 0; i < widths.length; i++) {
        const w = i === widths.length - 1 ? 1 - x : widths[i] - G;
        panels.push(panel(x, 0, w, 1));
        x += widths[i];
      }
      return {
        panels,
        title: { mode: 'overlay', x: 0.04, y: 0.52, w: 0.92, h: 0.46 },
      };
    },
  },

  duo: {
    label: 'Duo + Title Band',
    build() {
      // Two large plates side by side over a full-width title band: the
      // cleanest, fastest cover to read at thumbnail size.
      const halfW = (1 - G) / 2;
      return {
        panels: [panel(0, 0, halfW, 0.7), panel(halfW + G, 0, halfW, 0.7)],
        title: { mode: 'panel', x: 0, y: 0.7 + G, w: 1, h: 1 - 0.7 - G },
      };
    },
  },

  solo: {
    label: 'Solo Full-Bleed',
    build() {
      // One photograph edge to edge; the whole title system sits on a scrim
      // at the foot. Best for a single strong portrait.
      return {
        panels: [panel(0, 0, 1, 1)],
        title: { mode: 'overlay', x: 0.05, y: 0.44, w: 0.9, h: 0.54 },
      };
    },
  },
};

export const LAYOUT_ORDER = ['showcase', 'mosaic', 'strips', 'duo', 'solo'];

export function buildLayout(name, width, height) {
  const layout = LAYOUTS[name] ?? LAYOUTS.showcase;
  return layout.build(width / height);
}
