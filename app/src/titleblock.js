// titleblock.js — the lettering system. Kicker, two lines of gradient block
// type with a heavy dark outline, a script subtitle tucked under the second
// line, a tagline bar, and a starburst badge. All of it is drawn fresh on
// the canvas for every cover — no logo, no borrowed artwork, just type and
// shapes the studio owns.

const INK = '#160a2a';
const CREAM = '#fff6df';

function spaced(text, gap = '  ') {
  return text.split('').join(gap);
}

// Fits a font size for `text` so it fits `maxWidth`, starting from `start`.
function fitFont(ctx, text, fontFamily, start, maxWidth, weight = '') {
  let size = start;
  while (size > 8) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size *= 0.94;
  }
  return size;
}

// One line of block lettering: gradient fill, thick ink outline, and a hard
// offset shadow so the letters sit printed-on, not pasted-on.
function blockLine(ctx, text, cx, y, size, gradientStops) {
  ctx.save();
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, y - size * 0.55, 0, y + size * 0.55);
  gradientStops.forEach((stop, i) => {
    grad.addColorStop(i / (gradientStops.length - 1), stop);
  });
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,3,22,0.55)';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, cx + size * 0.045, y + size * 0.06);
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.11;
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y);
  ctx.restore();
}

// A starburst seal: alternating-radius star polygon, gold gradient, ink
// outline, and up to two short lines of type in the middle.
export function drawStarburst(ctx, cx, cy, radius, topText, bottomText) {
  const points = 16;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.8;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  grad.addColorStop(0, '#ffe066');
  grad.addColorStop(0.55, '#ffb03a');
  grad.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = radius * 0.07;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const topSize = fitFont(ctx, topText, 'Anton, sans-serif', radius * 0.42, radius * 1.25);
  ctx.fillText(topText, cx, cy - radius * 0.24);
  if (bottomText) {
    const botSize = fitFont(ctx, bottomText, 'Anton, sans-serif', radius * 0.3, radius * 1.2);
    ctx.fillText(bottomText, cx, cy + radius * 0.28);
  }
  ctx.restore();
}

// A simple palm silhouette: a curved trunk and six fronds, drawn as strokes.
// Stands at (x, baseY) and leans toward `lean` (signed, -1..1).
export function drawPalm(ctx, x, baseY, height, lean, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  const topX = x + lean * height * 0.22;
  const topY = baseY - height;
  ctx.lineWidth = height * 0.045;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * height * 0.05, baseY - height * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = height * 0.03;
  const fronds = [
    [-0.95, -0.34],
    [-0.6, -0.52],
    [-0.18, -0.62],
    [0.28, -0.58],
    [0.66, -0.44],
    [0.98, -0.2],
  ];
  for (const [dx, dy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + dx * height * 0.28,
      topY + dy * height * 0.3,
      topX + dx * height * 0.52,
      topY + (dy + 0.38) * height * 0.42,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// The shared lettering stack, drawn inside rect (pixels). `align` is
// 'center' for title panels and 'left' for overlays on a hero plate.
// `titleFrac` caps the block lines' width as a share of the zone, so a
// badge in the corner never has to share its space with the lettering.
function drawLettering(ctx, rect, palette, title, align, titleFrac = 0.94) {
  const cx = align === 'left' ? rect.x + rect.w * 0.04 : rect.x + rect.w / 2;
  const textAlign = align === 'left' ? 'left' : 'center';
  const anchorX = align === 'left' ? rect.x + rect.w * 0.04 : cx;
  let y = rect.y + rect.h * 0.06;

  // Kicker: small, letterspaced, cream with an ink shadow, fitted to the
  // zone so a narrow title plate never clips it at the edges.
  ctx.save();
  const kicker = spaced(title.kicker.toUpperCase());
  const kickerMax = title.badge && align === 'center' ? rect.w * 0.76 : rect.w * 0.92;
  const kickerSize = fitFont(ctx, kicker, "Anton, 'Arial Black', sans-serif", Math.max(10, rect.h * 0.075), kickerMax);
  ctx.font = `${kickerSize}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(10,3,22,0.6)';
  ctx.fillText(kicker, anchorX + kickerSize * 0.08, y + kickerSize * 0.09);
  ctx.fillStyle = CREAM;
  ctx.fillText(kicker, anchorX, y);
  ctx.restore();
  y += kickerSize * 1.7;

  // The two block lines. Each is sized to the zone, and the pair shares one
  // scale so the stack reads as a single lockup.
  const lines = [title.line1, title.line2].filter((line) => line && line.trim());
  if (lines.length) {
    const startSize = rect.h * (lines.length > 1 ? 0.26 : 0.4);
    ctx.save();
    ctx.font = `${startSize}px Anton, 'Arial Black', sans-serif`;
    let size = startSize;
    for (const line of lines) {
      size = Math.min(size, fitFont(ctx, line.toUpperCase(), "Anton, 'Arial Black', sans-serif", startSize, rect.w * titleFrac));
    }
    ctx.restore();
    const lineStep = size * 1.04;
    for (const line of lines) {
      const centreX = align === 'left' ? anchorX + fitWidth(ctx, line, size) / 2 : cx;
      blockLine(ctx, line.toUpperCase(), centreX, y + size * 0.5, size, palette.titleGradient);
      y += lineStep;
    }
    y -= size * 0.18;
  }

  // Script subtitle, tucked up under the block lines and tipped a few
  // degrees, in Yellowtail with a thin ink outline.
  if (title.script && title.script.trim()) {
    ctx.save();
    const scriptSize = Math.max(12, rect.h * 0.145);
    ctx.translate(anchorX + (align === 'left' ? rect.w * 0.3 : 0), y + scriptSize * 0.42);
    ctx.rotate(-0.045);
    ctx.font = `${scriptSize}px Yellowtail, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = scriptSize * 0.1;
    const scriptText = title.script;
    ctx.strokeText(scriptText, 0, 0);
    ctx.fillStyle = CREAM;
    ctx.fillText(scriptText, 0, 0);
    ctx.restore();
    y += scriptSize * 0.9;
  }

  // Tagline bar along the foot of the zone.
  if (title.tagline && title.tagline.trim()) {
    const barH = Math.max(14, rect.h * 0.11);
    const barY = rect.y + rect.h - barH * 1.15;
    ctx.save();
    ctx.fillStyle = 'rgba(12,4,26,0.78)';
    ctx.fillRect(rect.x + rect.w * 0.02, barY, rect.w * 0.96, barH);
    const tagSize = fitFont(ctx, spaced(title.tagline.toUpperCase()), 'Anton, sans-serif', barH * 0.52, rect.w * 0.9);
    ctx.font = `${tagSize}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CREAM;
    ctx.fillText(spaced(title.tagline.toUpperCase()), rect.x + rect.w / 2, barY + barH * 0.54);
    ctx.restore();
  }
  return y;
}

function fitWidth(ctx, text, size) {
  ctx.save();
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  const w = ctx.measureText(text.toUpperCase()).width;
  ctx.restore();
  return w;
}

// Title on its own plate: a dusk sky gradient in the palette's colours, a
// halftone dot field, palm silhouettes at the edges, then the lettering.
export function drawTitlePanel(ctx, rect, palette, title) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  palette.sky.forEach((stop, i) => {
    grad.addColorStop(i / (palette.sky.length - 1), stop);
  });
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Halftone dots, denser toward the foot of the sky.
  ctx.fillStyle = 'rgba(10,3,22,0.18)';
  const cell = Math.max(7, rect.h * 0.045);
  for (let row = 0, yy = rect.y + cell / 2; yy < rect.y + rect.h; row++, yy += cell) {
    const density = 0.3 + 0.7 * ((yy - rect.y) / rect.h);
    for (let xx = rect.x + cell / 2 + (row % 2 ? cell / 2 : 0); xx < rect.x + rect.w; xx += cell) {
      ctx.beginPath();
      ctx.arc(xx, yy, cell * 0.2 * density, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPalm(ctx, rect.x + rect.w * 0.05, rect.y + rect.h, rect.h * 0.92, 0.5, 'rgba(12,4,26,0.85)');
  drawPalm(ctx, rect.x + rect.w * 0.97, rect.y + rect.h, rect.h * 0.78, -0.55, 'rgba(12,4,26,0.8)');

  drawLettering(ctx, rect, palette, title, 'center', title.badge ? 0.82 : 0.94);
  if (title.badge) {
    drawStarburst(ctx, rect.x + rect.w * 0.89, rect.y + rect.h * 0.15, Math.min(rect.w, rect.h) * 0.125, title.badgeTop, title.badgeBottom);
  }
  ctx.restore();
}

// Title over the art: a scrim that rises from the foot of the zone, then the
// lettering left-aligned over the hero plate.
export function drawTitleOverlay(ctx, rect, palette, title) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y - rect.h * 0.25, rect.w, rect.h * 1.25);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, rect.y - rect.h * 0.25, 0, rect.y + rect.h);
  grad.addColorStop(0, 'rgba(10,3,22,0)');
  grad.addColorStop(0.45, 'rgba(10,3,22,0.38)');
  grad.addColorStop(1, 'rgba(10,3,22,0.86)');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y - rect.h * 0.25, rect.w, rect.h * 1.25);
  drawLettering(ctx, rect, palette, title, 'left');
  if (title.badge) {
    drawStarburst(ctx, rect.x + rect.w * 0.88, rect.y + rect.h * 0.18, Math.min(rect.w, rect.h) * 0.17, title.badgeTop, title.badgeBottom);
  }
  ctx.restore();
}
