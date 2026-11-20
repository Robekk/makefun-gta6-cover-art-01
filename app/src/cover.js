// Marina Heat — Cast Cover Studio: the cover renderer.
// drawCover(ctx, W, H, state, opts) paints the whole poster: slanted cast
// panels with gold keylines, then the furniture (quote bar, chrome title,
// script subtitle, ribbon, billing, COMING SOON, seal and barcode).
// The editor's live preview and the PNG exports share this one function, so
// what you see on screen is byte-for-byte what the export renders.
// opts.images maps a photo id to a loaded Image (or canvas) to draw from.

(function () {
  'use strict';

  var SLANT = 20; // parallelogram lean of every panel, at scale 1

  function scaleFor(layoutKey, W, H) {
    return layoutKey === 'landscape' ? W / 1920 : Math.min(W, H) / 1080;
  }

  // Panel rectangles per layout. labelAt: 'top' | 'bottom' | 'lifted' |
  // 'lookout' (right aligned, lifted clear of the seal).
  function panelRects(layoutKey, W, H) {
    if (layoutKey === 'landscape') {
      var bw = W * 0.32;
      var bx = (W - bw) / 2;
      var side = W - bx - bw; // width of each side column
      return {
        boss: { x: bx, y: 0, w: bw, h: H, labelAt: 'top' },
        driver: { x: 0, y: 0, w: side, h: H / 2, labelAt: 'bottom' },
        fixer: { x: 0, y: H / 2, w: side, h: H / 2, labelAt: 'bottom' },
        insider: { x: bx + bw, y: 0, w: side, h: H / 2, labelAt: 'top' },
        lookout: { x: bx + bw, y: H / 2, w: side, h: H / 2, labelAt: 'lookout' }
      };
    }
    var bossH = layoutKey === 'portrait' ? H * 0.60 : H * 0.62;
    var half = bossH / 2;
    var colW = W * 0.28;
    var bossW = W * 0.44;
    return {
      boss: { x: colW, y: 0, w: bossW, h: bossH, labelAt: 'top' },
      driver: { x: 0, y: 0, w: colW, h: half, labelAt: 'bottom' },
      fixer: { x: 0, y: half, w: colW, h: half, labelAt: 'bottom' },
      insider: { x: W - colW, y: 0, w: colW, h: half, labelAt: 'top' },
      lookout: { x: W - colW, y: half, w: colW, h: half, labelAt: 'bottom' },
      captain: { x: 0, y: bossH, w: W / 2, h: H - bossH, labelAt: 'lifted' },
      getaway: { x: W / 2, y: bossH, w: W / 2, h: H - bossH, labelAt: 'lifted' }
    };
  }

  function panelPolygon(r, s) {
    var d = SLANT * s;
    return [
      [r.x + d, r.y],
      [r.x + r.w, r.y],
      [r.x + r.w - d, r.y + r.h],
      [r.x, r.y + r.h]
    ];
  }

  function tracePath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // Cover-fit one photo into a panel rect. Returns the drawn image rect,
  // which the editor reuses to map drag gestures back into offsets.
  function coverRect(img, r, panel) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var base = Math.max(r.w / iw, r.h / ih);
    var zoom = Math.max(1, panel.zoom || 1);
    var dw = iw * base * zoom;
    var dh = ih * base * zoom;
    var fx = Math.max(0, dw - r.w);
    var fy = Math.max(0, dh - r.h);
    var dx = r.x - fx * ((panel.ox || 0) + 1) / 2;
    var dy = r.y - fy * ((panel.oy || 0) + 1) / 2;
    return { dx: dx, dy: dy, dw: dw, dh: dh, fx: fx, fy: fy };
  }

  function drawPanel(ctx, key, r, panel, img, pal, s) {
    var pts = panelPolygon(r, s);
    ctx.save();
    tracePath(ctx, pts);
    ctx.clip();
    if (img) {
      var cr = coverRect(img, r, panel);
      ctx.filter = pal.filter;
      ctx.drawImage(img, cr.dx, cr.dy, cr.dw, cr.dh);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#241a10';
      ctx.fillRect(r.x - SLANT * s, r.y, r.w + SLANT * s * 2, r.h);
    }
    ctx.fillStyle = pal.wash;
    ctx.fillRect(r.x - SLANT * s, r.y, r.w + SLANT * s * 2, r.h);
    // Scrims go down before any label text so the words stay bright.
    var bottom = ctx.createLinearGradient(0, r.y + r.h * 0.52, 0, r.y + r.h);
    bottom.addColorStop(0, 'rgba(0,0,0,0)');
    bottom.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = bottom;
    ctx.fillRect(r.x - SLANT * s, r.y, r.w + SLANT * s * 2, r.h);
    if (r.labelAt === 'top') {
      var top = ctx.createLinearGradient(0, r.y, 0, r.y + r.h * 0.42);
      top.addColorStop(0, 'rgba(0,0,0,0.55)');
      top.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = top;
      ctx.fillRect(r.x - SLANT * s, r.y, r.w + SLANT * s * 2, r.h);
    }
    ctx.restore();
    // Gold keyline around the slanted panel.
    tracePath(ctx, pts);
    ctx.strokeStyle = pal.gold;
    ctx.lineWidth = 3 * s;
    ctx.stroke();
  }

  function setSpacing(ctx, px) {
    try { ctx.letterSpacing = px + 'px'; } catch (e) { /* older engines */ }
  }

  function drawLabel(ctx, key, r, panel, pal, s, quoteBarH, layoutKey) {
    var nameSize = (key === 'boss' ? 47 : 40) * s;
    var roleSize = 20 * s;
    var inset = 20 * s;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6 * s;
    ctx.shadowOffsetY = 2 * s;
    // Role tag above the name.
    ctx.font = roleSize + 'px Anton, sans-serif';
    setSpacing(ctx, 4 * s);
    ctx.fillStyle = pal.goldSoft;
    var role = (panel.role || '').toUpperCase();
    var name = panel.name || '';
    ctx.font = nameSize + 'px Anton, sans-serif';
    setSpacing(ctx, 0);
    var nameW = ctx.measureText(name).width;
    var right = r.labelAt === 'lookout';
    var nameBase;
    if (r.labelAt === 'top') {
      nameBase = r.y + quoteBarH + 16 * s + roleSize + 10 * s + nameSize;
    } else if (r.labelAt === 'lookout') {
      nameBase = r.y + r.h - 190 * s;
    } else if (r.labelAt === 'lifted') {
      nameBase = r.y + r.h - 128 * s;
    } else if (layoutKey === 'landscape' && key === 'fixer') {
      // The COMING SOON block owns the bottom-left corner of the landscape
      // cover, so the fixer's bottom label rides up clear of it.
      nameBase = r.y + r.h - 118 * s;
    } else {
      nameBase = r.y + r.h - 20 * s;
    }
    var roleBase = nameBase - nameSize - 8 * s;
    var x = right ? r.x + r.w - inset : r.x + inset + SLANT * s * 0.4;
    ctx.textAlign = right ? 'right' : 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = roleSize + 'px Anton, sans-serif';
    setSpacing(ctx, 4 * s);
    ctx.fillStyle = pal.goldSoft;
    ctx.fillText(role, x, roleBase);
    ctx.font = nameSize + 'px Anton, sans-serif';
    setSpacing(ctx, 0);
    ctx.fillStyle = '#ffffff';
    // Keep long names inside their panel.
    if (nameW > r.w - inset * 2) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.scale((r.w - inset * 2) / nameW, 1);
      ctx.fillText(name, 0, nameBase);
      ctx.restore();
    } else {
      ctx.fillText(name, x, nameBase);
    }
    ctx.restore();
    setSpacing(ctx, 0);
  }

  function fitFont(ctx, text, fontName, targetW, startSize, spacing) {
    var size = startSize;
    while (size > 8) {
      ctx.font = size + 'px ' + fontName;
      setSpacing(ctx, spacing || 0);
      if (ctx.measureText(text).width <= targetW) break;
      size -= 2;
    }
    return size;
  }

  function drawQuoteBar(ctx, W, words, pal, s) {
    var h = 62 * s;
    ctx.save();
    ctx.fillStyle = 'rgba(8, 6, 4, 0.86)';
    ctx.fillRect(0, 0, W, h);
    ctx.fillStyle = pal.gold;
    ctx.fillRect(0, h - 3 * s, W, 3 * s);
    ctx.textBaseline = 'middle';
    // Publisher left, volume right.
    ctx.font = 23 * s + 'px Anton, sans-serif';
    setSpacing(ctx, 3 * s);
    ctx.fillStyle = pal.paper;
    ctx.textAlign = 'left';
    var pubText = (words.publisher || '').toUpperCase();
    ctx.fillText(pubText, 22 * s, h / 2 + 1 * s);
    var pubW = ctx.measureText(pubText).width;
    ctx.textAlign = 'right';
    var volText = (words.volume || '').toUpperCase();
    ctx.fillText(volText, W - 22 * s, h / 2 + 1 * s);
    var volW = ctx.measureText(volText).width;
    // Five gold stars and the quote, centered as one group in the clear
    // middle zone between the publisher and the volume, shrunk to fit it.
    var quote = (words.quote || '').toUpperCase();
    ctx.font = 22 * s + 'px Anton, sans-serif';
    setSpacing(ctx, 0);
    var stars = '★★★★★';
    var starsW = ctx.measureText(stars).width;
    var gap = 16 * s;
    var zoneX = 22 * s + pubW + 20 * s;
    var zoneW = W - 22 * s - volW - 20 * s - zoneX;
    var qSize = fitFont(ctx, quote, 'Anton, sans-serif', Math.max(60 * s, zoneW - starsW - gap), 25 * s, 2 * s);
    ctx.font = qSize + 'px Anton, sans-serif';
    setSpacing(ctx, 2 * s);
    var quoteW = ctx.measureText(quote).width;
    var total = starsW + gap + quoteW;
    var x = zoneX + Math.max(0, (zoneW - total) / 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = pal.gold;
    ctx.fillText(stars, x, h / 2 + 1 * s);
    ctx.font = qSize + 'px Anton, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(quote, x + starsW + gap, h / 2 + 1 * s);
    ctx.restore();
    setSpacing(ctx, 0);
    return h;
  }

  function drawTitleBlock(ctx, W, H, layoutKey, words, pal, s) {
    var targetW = W * (layoutKey === 'landscape' ? 0.52 : 0.78);
    var topRatio = layoutKey === 'landscape' ? 0.45 : layoutKey === 'square' ? 0.35 : 0.29;
    var top = H * topRatio;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var title = (words.title || '').toUpperCase();
    var size = fitFont(ctx, title, 'Anton, sans-serif', targetW, 190 * s, 0);
    ctx.font = size + 'px Anton, sans-serif';
    var grad = ctx.createLinearGradient(0, top, 0, top + size);
    grad.addColorStop(0, '#fbe9b7');
    grad.addColorStop(0.42, '#e7c558');
    grad.addColorStop(0.58, '#8a6420');
    grad.addColorStop(1, '#f3d27a');
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.strokeStyle = '#1a1206';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, W / 2, top);
    ctx.fillStyle = grad;
    ctx.fillText(title, W / 2, top);
    var titleBottom = top + size * 1.02;

    // Script subtitle directly under the title.
    var sub = words.subtitle || '';
    var subSize = fitFont(ctx, sub, 'Yellowtail, cursive', W * 0.6, 58 * s, 0);
    ctx.font = subSize + 'px Yellowtail, cursive';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8 * s;
    ctx.shadowOffsetY = 2 * s;
    ctx.fillStyle = pal.goldSoft;
    ctx.fillText(sub, W / 2, titleBottom + 2 * s);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    var subBottom = titleBottom + subSize * 1.05;

    // Ribbon: a dark band with gold edges, letter-spaced text.
    var ribbon = (words.ribbon || '').toUpperCase();
    var bandCap = W * (layoutKey === 'landscape' ? 0.72 : 0.60);
    var rSize = fitFont(ctx, ribbon, 'Anton, sans-serif', bandCap - 56 * s, (layoutKey === 'landscape' ? 23 : 20) * s, 5 * s);
    ctx.font = rSize + 'px Anton, sans-serif';
    setSpacing(ctx, 5 * s);
    var ribbonTextW = ctx.measureText(ribbon).width;
    var bandW = Math.min(bandCap, ribbonTextW + 56 * s);
    var bandH = 42 * s;
    var bandY = subBottom + 14 * s;
    var bandX = (W - bandW) / 2;
    ctx.fillStyle = 'rgba(10, 8, 5, 0.88)';
    ctx.fillRect(bandX, bandY, bandW, bandH);
    ctx.fillStyle = pal.gold;
    ctx.fillRect(bandX, bandY, bandW, 3 * s);
    ctx.fillRect(bandX, bandY + bandH - 3 * s, bandW, 3 * s);
    ctx.fillStyle = pal.paper;
    ctx.textBaseline = 'middle';
    ctx.fillText(ribbon, W / 2, bandY + bandH / 2 + 1 * s);
    ctx.restore();
    setSpacing(ctx, 0);
    return bandY + bandH;
  }

  function drawSeal(ctx, W, H, words, pal, s) {
    var r = 82 * s;
    var cx = W - 108 * s;
    var cy = H - 108 * s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 11, 4, 0.72)';
    ctx.fill();
    ctx.lineWidth = 3.5 * s;
    ctx.strokeStyle = pal.gold;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 11 * s, 0, Math.PI * 2);
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var seal = (words.seal || '').toUpperCase();
    var wordsArr = seal.split(/\s+/).filter(Boolean);
    var last = wordsArr.length > 1 ? wordsArr.pop() : '';
    var head = wordsArr.join(' ');
    ctx.fillStyle = pal.goldSoft;
    ctx.font = 15 * s + 'px Anton, sans-serif';
    setSpacing(ctx, 1.5 * s);
    if (head) ctx.fillText(head, cx, cy - 40 * s);
    ctx.font = 42 * s + 'px Anton, sans-serif';
    ctx.fillStyle = pal.gold;
    ctx.fillText('★', cx, cy + 2 * s);
    ctx.font = 15 * s + 'px Anton, sans-serif';
    setSpacing(ctx, 1.5 * s);
    ctx.fillStyle = pal.goldSoft;
    if (last) ctx.fillText(last, cx, cy + 44 * s);
    ctx.restore();
    setSpacing(ctx, 0);
    return { cx: cx, cy: cy, r: r };
  }

  function drawBarcode(ctx, W, H, seal, words, pal, s) {
    var bw = 118 * s;
    var bh = 80 * s;
    var x = seal.cx - seal.r - bw - 26 * s;
    var y = H - 118 * s;
    ctx.save();
    ctx.fillStyle = '#f6f1e6';
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(x, y, bw, bh);
    // Bar widths derive deterministically from the title's characters.
    var title = words.title || '';
    var bx = x + 10 * s;
    var barTop = y + 8 * s;
    var barH = bh - 30 * s;
    var i = 0;
    ctx.fillStyle = '#14100a';
    while (bx < x + bw - 12 * s && title.length > 0) {
      var code = title.charCodeAt(i % title.length);
      var wdt = ((code % 3) + 1) * 1.6 * s;
      if ((code + i) % 4 !== 0) ctx.fillRect(bx, barTop, wdt, barH);
      bx += wdt + 1.7 * s;
      i++;
    }
    ctx.font = 10.5 * s + 'px Anton, sans-serif';
    setSpacing(ctx, 2 * s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title.toUpperCase(), x + bw / 2, y + bh - 7 * s);
    ctx.restore();
    setSpacing(ctx, 0);
  }

  // COMING SOON is drawn first and its rendered width measured, so the
  // billing line can be fitted into the clear zone to its right and never
  // strike through it (or through the seal and barcode at the right edge).
  function drawBilling(ctx, W, H, layoutKey, words, pal, s) {
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    var cs = (words.comingSoon || '').toUpperCase();
    var csSize = 33 * s;
    ctx.font = csSize + 'px Anton, sans-serif';
    setSpacing(ctx, 3 * s);
    var csW = ctx.measureText(cs).width;
    var csX = 26 * s;
    var base = H - 22 * s;
    ctx.fillStyle = pal.gold;
    ctx.fillRect(csX, base - csSize - 12 * s, csW, 3 * s);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6 * s;
    ctx.fillText(cs, csX, base);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    var zoneX = csX + csW + 30 * s;
    // Landscape's line runs below the seal's ink; in square/portrait the
    // zone also stops short of the seal so the microtext never grazes it.
    var zoneEnd = layoutKey === 'landscape' ? W * 0.95 : W - 204 * s;
    var zoneW = zoneEnd - zoneX;
    var billing = words.billing || '';
    ctx.fillStyle = '#c9bb9c';
    if (layoutKey === 'landscape') {
      var size = fitFont(ctx, billing, 'Anton, sans-serif', zoneW, 17.5 * s, 1.2 * s);
      ctx.font = size + 'px Anton, sans-serif';
      setSpacing(ctx, 1.2 * s);
      ctx.textAlign = 'center';
      ctx.fillText(billing, zoneX + zoneW / 2, H - 24 * s);
    } else {
      // Two fitted lines in the same clear zone, dropped below the ink of
      // the barcode card and the seal so nothing overlaps them either.
      var parts = billing.split('·').map(function (p) { return p.trim(); }).filter(Boolean);
      var mid = Math.ceil(parts.length / 2);
      var lines = [parts.slice(0, mid).join(' · '), parts.slice(mid).join(' · ')];
      var size2 = 13.5 * s;
      ctx.font = size2 + 'px Anton, sans-serif';
      setSpacing(ctx, 1 * s);
      lines.forEach(function (line, idx) {
        if (!line) return;
        var sz = fitFont(ctx, line, 'Anton, sans-serif', zoneW, size2, 1 * s);
        ctx.font = sz + 'px Anton, sans-serif';
        setSpacing(ctx, 1 * s);
        ctx.textAlign = 'center';
        ctx.fillText(line, zoneX + zoneW / 2, H - (idx === 0 ? 27 : 11) * s);
      });
    }
    ctx.restore();
    setSpacing(ctx, 0);
  }

  function drawCover(ctx, W, H, state, opts) {
    var MH = window.MH;
    var layoutKey = state.layout || 'landscape';
    var pal = MH.PALETTES[state.palette] || MH.PALETTES['Sunset Cinema'];
    var images = (opts && opts.images) || {};
    var s = scaleFor(layoutKey, W, H);
    ctx.save();
    ctx.fillStyle = pal.ink;
    ctx.fillRect(0, 0, W, H);
    var rects = panelRects(layoutKey, W, H);
    var order = ['driver', 'fixer', 'insider', 'lookout', 'captain', 'getaway', 'boss'];
    order.forEach(function (key) {
      var r = rects[key];
      var panel = state.panels[key];
      if (!r || !panel) return;
      drawPanel(ctx, key, r, panel, images[panel.photoId], pal, s);
    });
    var quoteBarH = 62 * s;
    order.forEach(function (key) {
      var r = rects[key];
      var panel = state.panels[key];
      if (!r || !panel) return;
      drawLabel(ctx, key, r, panel, pal, s, quoteBarH, layoutKey);
    });
    drawQuoteBar(ctx, W, state.words, pal, s);
    drawTitleBlock(ctx, W, H, layoutKey, state.words, pal, s);
    var seal = drawSeal(ctx, W, H, state.words, pal, s);
    drawBarcode(ctx, W, H, seal, state.words, pal, s);
    drawBilling(ctx, W, H, layoutKey, state.words, pal, s);
    ctx.restore();
  }

  window.MH.drawCover = drawCover;
  window.MH.panelRects = panelRects;
  window.MH.coverRect = coverRect;
  window.MH.scaleFor = scaleFor;
})();
