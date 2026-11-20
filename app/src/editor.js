// editor.js — Marina Heat Cover Studio's editor. Loads the bundled sample
// photos (and any the maker adds — read locally, never uploaded), keeps the
// cover state, paints the live preview through cover.js, and wires every
// control: photo assignment per panel, drag/zoom cropping, layout and
// palette pickers, the lettering fields, and the one-click PNG export at
// the three common post sizes.

import { PALETTES, PALETTE_ORDER } from './palettes.js';
import { LAYOUTS, LAYOUT_ORDER, buildLayout } from './layouts.js';
import { renderCover, exportCoverPNG } from './cover.js';

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'The Pier', src: 'samples/pier.jpg' },
  { name: 'Convertible', src: 'samples/convertible.jpg' },
];

export const state = {
  layout: 'showcase',
  paletteName: 'heatwave',
  strength: 1,
  halftoneOn: true,
  size: 'wide',
  panels: [],
  selectedPanel: 0,
  title: {
    kicker: 'Palm Coast · Summer 2026',
    line1: 'MARINA',
    line2: 'HEAT',
    script: 'one last summer',
    tagline: 'Every legend starts at the shoreline',
    badge: true,
    badgeTop: 'NEW',
    badgeBottom: 'SUMMER 2026',
  },
};

export const photos = new Map();
let photoSeq = 0;
let renderQueued = false;

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

function palette() {
  return PALETTES[state.paletteName];
}

function currentSize() {
  return EXPORT_SIZES[state.size];
}

// The preview is painted at a screen-friendly size that keeps the export's
// aspect: what the maker sees is the export, scaled.
function previewDims() {
  const { w, h } = currentSize();
  const scale = Math.min(940 / w, 740 / h);
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

function panelRects() {
  const { w, h } = previewDims();
  return buildLayout(state.layout, w, h).panels.map((p) => ({
    x: p.x * w,
    y: p.y * h,
    w: p.w * w,
    h: p.h * h,
  }));
}

function drawPreview() {
  renderQueued = false;
  const { w, h } = previewDims();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(ctx, w, h, state, photos, palette());
  // Selection outline over the chosen panel, preview only — never exported.
  const rects = panelRects();
  const rect = rects[state.selectedPanel];
  if (rect) {
    ctx.save();
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd23e';
    const tag = `PANEL ${state.selectedPanel + 1}`;
    ctx.font = "600 12px 'Segoe UI', sans-serif";
    const tagW = ctx.measureText(tag).width + 12;
    ctx.fillRect(rect.x + 6, rect.y + 6, tagW, 20);
    ctx.fillStyle = '#160a2a';
    ctx.fillText(tag, rect.x + 12, rect.y + 20);
    ctx.restore();
  }
  updatePanelStatus();
}

function requestRender() {
  if (!renderQueued) {
    renderQueued = true;
    requestAnimationFrame(drawPreview);
  }
}

// Picks photos for a fresh set of panels: the photo whose own aspect sits
// closest to each plate's aspect wins it, with a small penalty per reuse so
// the plates vary.
function autoAssign(count) {
  const list = [...photos.values()];
  const { panels } = buildLayout(state.layout, currentSize().w, currentSize().h);
  const usage = new Map(list.map((p) => [p.id, 0]));
  const next = [];
  for (let i = 0; i < count; i++) {
    const rect = panels[i];
    const panelAspect = rect ? rect.w / rect.h : 1;
    let best = list[0];
    let bestScore = Infinity;
    for (const photo of list) {
      const photoAspect = photo.img.naturalWidth / photo.img.naturalHeight;
      const score = Math.abs(Math.log(panelAspect / photoAspect)) + usage.get(photo.id) * 0.9;
      if (score < bestScore) {
        bestScore = score;
        best = photo;
      }
    }
    usage.set(best.id, usage.get(best.id) + 1);
    const kept = state.panels[i];
    next.push({
      photoId: best.id,
      zoom: kept?.photoId === best.id ? kept.zoom : 1,
      offX: kept?.photoId === best.id ? kept.offX : 0,
      offY: kept?.photoId === best.id ? kept.offY : 0,
    });
  }
  state.panels = next;
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

function syncLayout() {
  const { panels } = buildLayout(state.layout, currentSize().w, currentSize().h);
  autoAssign(panels.length);
  buildPhotoStrip();
  requestRender();
}

function addPhoto(name, src) {
  const id = `photo-${++photoSeq}`;
  const img = new Image();
  img.onload = () => {
    photos.set(id, { id, name, img, url: src });
    if (state.panels.length === 0) syncLayout();
    else {
      buildPhotoStrip();
      requestRender();
    }
  };
  img.src = src;
  return id;
}

function buildPhotoStrip() {
  const strip = document.getElementById('photo-strip');
  strip.innerHTML = '';
  const selected = state.panels[state.selectedPanel];
  for (const photo of photos.values()) {
    const button = document.createElement('button');
    button.className = 'photo-thumb' + (selected?.photoId === photo.id ? ' active' : '');
    const thumb = document.createElement('img');
    thumb.src = photo.url;
    thumb.alt = photo.name;
    const caption = document.createElement('span');
    caption.textContent = photo.name;
    button.append(thumb, caption);
    button.title = `Put ${photo.name} in panel ${state.selectedPanel + 1}`;
    button.addEventListener('click', () => {
      const assignment = state.panels[state.selectedPanel];
      if (assignment) {
        assignment.photoId = photo.id;
        assignment.zoom = 1;
        assignment.offX = 0;
        assignment.offY = 0;
      }
      buildPhotoStrip();
      requestRender();
    });
    strip.append(button);
  }
}

function updatePanelStatus() {
  const status = document.getElementById('panel-status');
  const assignment = state.panels[state.selectedPanel];
  const photo = assignment ? photos.get(assignment.photoId) : null;
  status.textContent = assignment
    ? `Panel ${state.selectedPanel + 1} of ${state.panels.length} — ${photo ? photo.name : 'empty'} · zoom ${(assignment.zoom * 100).toFixed(0)}%`
    : 'Loading photos…';
  const zoom = document.getElementById('zoom');
  if (assignment) zoom.value = Math.round(assignment.zoom * 100);
}

// Pointer work on the preview: click selects a panel, drag slides its crop,
// the wheel zooms it.
let drag = null;
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const rects = panelRects();
  const hit = rects.findIndex((r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
  if (hit >= 0) {
    state.selectedPanel = hit;
    buildPhotoStrip();
  }
  drag = { x: point.x, y: point.y, rect: rects[state.selectedPanel] };
  canvas.setPointerCapture(event.pointerId);
  requestRender();
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const assignment = state.panels[state.selectedPanel];
  if (assignment && drag.rect) {
    assignment.offX = clamp(assignment.offX + ((point.x - drag.x) / drag.rect.w) * 1.7, -1, 1);
    assignment.offY = clamp(assignment.offY + ((point.y - drag.y) / drag.rect.h) * 1.7, -1, 1);
  }
  drag.x = point.x;
  drag.y = point.y;
  requestRender();
});

canvas.addEventListener('pointerup', () => {
  drag = null;
});

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const assignment = state.panels[state.selectedPanel];
    if (!assignment) return;
    assignment.zoom = clamp(assignment.zoom * Math.exp(-event.deltaY * 0.0012), 1, 4);
    requestRender();
  },
  { passive: false },
);

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

function buildPickers() {
  const layoutGroup = document.getElementById('layout-group');
  for (const name of LAYOUT_ORDER) {
    const button = document.createElement('button');
    button.textContent = LAYOUTS[name].label;
    button.className = 'pick-btn' + (state.layout === name ? ' active' : '');
    button.addEventListener('click', () => {
      state.layout = name;
      layoutGroup.querySelectorAll('.pick-btn').forEach((b) => b.classList.toggle('active', b === button));
      syncLayout();
    });
    layoutGroup.append(button);
  }

  const paletteGroup = document.getElementById('palette-group');
  for (const name of PALETTE_ORDER) {
    const p = PALETTES[name];
    const button = document.createElement('button');
    button.className = 'pick-btn palette-btn' + (state.paletteName === name ? ' active' : '');
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = `linear-gradient(90deg, ${p.stops.map((s) => s[1]).join(', ')})`;
    const label = document.createElement('span');
    label.textContent = p.label;
    button.append(swatch, label);
    button.addEventListener('click', () => {
      state.paletteName = name;
      paletteGroup.querySelectorAll('.pick-btn').forEach((b) => b.classList.toggle('active', b === button));
      requestRender();
    });
    paletteGroup.append(button);
  }
}

function wireControls() {
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.addEventListener('click', () => {
      state.size = button.dataset.size;
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === button));
      syncLayout();
    });
  });

  document.getElementById('export-btn').addEventListener('click', async () => {
    const { w, h } = currentSize();
    const blob = await exportCoverPNG(state, photos, palette(), w, h);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marina-heat-cover-${w}x${h}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  document.getElementById('photo-input').addEventListener('change', (event) => {
    for (const file of event.target.files) {
      addPhoto(file.name.replace(/\.[^.]+$/, ''), URL.createObjectURL(file));
    }
    event.target.value = '';
  });

  document.getElementById('strength').addEventListener('input', (event) => {
    state.strength = Number(event.target.value) / 100;
    requestRender();
  });

  document.getElementById('halftone').addEventListener('change', (event) => {
    state.halftoneOn = event.target.checked;
    requestRender();
  });

  document.getElementById('zoom').addEventListener('input', (event) => {
    const assignment = state.panels[state.selectedPanel];
    if (assignment) {
      assignment.zoom = Number(event.target.value) / 100;
      requestRender();
    }
  });

  document.getElementById('reset-crop').addEventListener('click', () => {
    const assignment = state.panels[state.selectedPanel];
    if (assignment) {
      assignment.zoom = 1;
      assignment.offX = 0;
      assignment.offY = 0;
      requestRender();
    }
  });

  const titleFields = [
    ['title-kicker', 'kicker'],
    ['title-line1', 'line1'],
    ['title-line2', 'line2'],
    ['title-script', 'script'],
    ['title-tagline', 'tagline'],
    ['badge-top', 'badgeTop'],
    ['badge-bottom', 'badgeBottom'],
  ];
  for (const [id, key] of titleFields) {
    const input = document.getElementById(id);
    input.value = state.title[key];
    input.addEventListener('input', () => {
      state.title[key] = input.value;
      requestRender();
    });
  }
  const badgeToggle = document.getElementById('badge-on');
  badgeToggle.checked = state.title.badge;
  badgeToggle.addEventListener('change', () => {
    state.title.badge = badgeToggle.checked;
    requestRender();
  });
}

async function loadFonts() {
  const faces = [
    new FontFace('Anton', "url('fonts/Anton-Regular.ttf')"),
    new FontFace('Yellowtail', "url('fonts/Yellowtail-Regular.ttf')"),
  ];
  for (const face of faces) {
    try {
      await face.load();
      document.fonts.add(face);
    } catch {
      // A missing display font falls back to the system stacks in the
      // lettering code; the studio still works.
    }
  }
}

async function boot() {
  buildPickers();
  wireControls();
  await loadFonts();
  for (const sample of SAMPLES) addPhoto(sample.name, sample.src);
  // Samples race their loads; the layout syncs when the first one lands and
  // re-renders as the rest arrive (addPhoto handles both).
  setTimeout(() => {
    if (state.panels.length) {
      syncLayout();
    }
  }, 600);
}

boot();

// A small handle for the studio's own screenshot runs and for embedders:
// the same calls the buttons make, nothing more.
window.coverStudio = {
  state,
  photos,
  setLayout(name) {
    state.layout = name;
    syncLayout();
  },
  setPalette(name) {
    state.paletteName = name;
    requestRender();
  },
  setSize(name) {
    state.size = name;
    syncLayout();
  },
  exportPNG() {
    document.getElementById('export-btn').click();
  },
};
