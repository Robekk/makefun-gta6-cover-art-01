// cover.js — composes the finished cover: graded photo plates laid on a
// white ground (the gaps become keylines), a vignette inside each plate,
// the title system over or beside the art, and a whisper of film grain over
// everything. The same function paints the editor's live preview and the
// exported PNG, so what the maker sees is exactly what the app writes.

import { gradePhoto, vignetteCanvas, getGrainTile } from './grade.js';
import { buildLayout } from './layouts.js';
import { drawTitlePanel, drawTitleOverlay } from './titleblock.js';

// Draws one photo into a panel rect with a cover fit: the photo fills the
// plate, `zoom` scales past the fit, and offX/offY (-1..1) slide the crop.
export function drawPanelPhoto(ctx, graded, rect, crop) {
  const srcW = graded.width;
  const srcH = graded.height;
  const fit = Math.max(rect.w / srcW, rect.h / srcH);
  const scale = fit * (crop?.zoom ?? 1);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const maxOffX = Math.max(0, (drawW - rect.w) / 2);
  const maxOffY = Math.max(0, (drawH - rect.h) / 2);
  const dx = rect.x + (rect.w - drawW) / 2 + (crop?.offX ?? 0) * maxOffX;
  const dy = rect.y + (rect.h - drawH) / 2 + (crop?.offY ?? 0) * maxOffY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(graded, dx, dy, drawW, drawH);
  ctx.drawImage(vignetteCanvas(rect.w, rect.h), rect.x, rect.y);
  ctx.restore();
}

// renderCover(ctx, width, height, state, photos, palette)
// state: { layout, paletteName, strength, halftoneOn,
//          panels: [{ photoId, zoom, offX, offY }], title: {...} }
// photos: Map of photoId -> { id, img }.
export function renderCover(ctx, width, height, state, photos, palette) {
  const { panels, title } = buildLayout(state.layout, width, height);

  // White ground: every gap between plates shows as a keyline.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  panels.forEach((rectNorm, i) => {
    const rect = {
      x: rectNorm.x * width,
      y: rectNorm.y * height,
      w: rectNorm.w * width,
      h: rectNorm.h * height,
    };
    const assignment = state.panels[i];
    const photo = assignment ? photos.get(assignment.photoId) : null;
    if (photo && photo.img) {
      const graded = gradePhoto(photo, state.paletteName, palette, state.strength, state.halftoneOn);
      drawPanelPhoto(ctx, graded, rect, assignment);
    } else {
      // An unfilled plate shows a quiet dusk gradient rather than a hole.
      const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
      grad.addColorStop(0, '#3a2358');
      grad.addColorStop(1, '#170b2e');
      ctx.fillStyle = grad;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  const tz = {
    x: title.x * width,
    y: title.y * height,
    w: title.w * width,
    h: title.h * height,
  };
  if (title.mode === 'panel') {
    drawTitlePanel(ctx, tz, palette, state.title);
  } else {
    drawTitleOverlay(ctx, tz, palette, state.title);
  }

  // Film grain over the whole cover, stamped from the shared tile.
  const tile = getGrainTile();
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Renders the cover to a fresh canvas at an exact export size and hands
// back the PNG blob — the one-click export the editor buttons call.
export function exportCoverPNG(state, photos, palette, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, width, height, state, photos, palette);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
