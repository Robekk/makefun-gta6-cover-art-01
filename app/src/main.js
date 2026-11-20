// Marina Heat — Cast Cover Studio: the editor.
// Wires the studio UI to the renderer in cover.js: panel selection, photo
// assignment (samples or the reader's own upload), drag/wheel reframing,
// every cover word, layout and palette switching, and PNG export at the
// exact layout sizes. Everything is local: no requests leave the page.

(function () {
  'use strict';

  var MH = window.MH;
  var state = MH.defaultState();
  var params = new URLSearchParams(window.location.search);

  if (params.get('layout') && MH.LAYOUTS[params.get('layout')]) state.layout = params.get('layout');
  if (params.get('palette') && MH.PALETTES[params.get('palette')]) state.palette = params.get('palette');
  var selected = MH.CAST[0].key;
  if (params.get('panel') && state.panels[params.get('panel')]) selected = params.get('panel');
  if (params.get('shot') === 'cover') document.body.classList.add('shot-cover');

  var canvas = document.getElementById('cover');
  var ctx = canvas.getContext('2d');

  // Preload every sample photo; each load repaints so panels fill in as
  // their pictures arrive.
  var images = {};
  MH.SAMPLE_PHOTOS.forEach(function (photo) {
    var img = new Image();
    img.onload = redraw;
    img.src = photo.src;
    images[photo.id] = img;
  });

  function redraw() {
    var layout = MH.LAYOUTS[state.layout];
    if (canvas.width !== layout.w) canvas.width = layout.w;
    if (canvas.height !== layout.h) canvas.height = layout.h;
    MH.drawCover(ctx, layout.w, layout.h, state, { images: images });
    syncPanelControls();
  }

  // ---------------------------------------------------------- panel picking
  var chipsEl = document.getElementById('chips');
  MH.CAST.forEach(function (member) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = member.role.replace(/^THE /, '');
    b.dataset.panel = member.key;
    if (member.key === selected) b.classList.add('active');
    b.addEventListener('click', function () { selectPanel(member.key); });
    chipsEl.appendChild(b);
  });

  var gridEl = document.getElementById('photoGrid');
  MH.SAMPLE_PHOTOS.forEach(function (photo) {
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.photo = photo.id;
    var img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    var span = document.createElement('span');
    span.textContent = photo.label;
    b.appendChild(img);
    b.appendChild(span);
    b.addEventListener('click', function () {
      state.panels[selected].photoId = photo.id;
      redraw();
    });
    gridEl.appendChild(b);
  });

  function selectPanel(key) {
    selected = key;
    chipsEl.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.panel === key);
    });
    syncPanelControls(true);
  }

  // ------------------------------------------------------- selected panel UI
  var roleInput = document.getElementById('roleInput');
  var nameInput = document.getElementById('nameInput');
  var zoomRange = document.getElementById('zoomRange');
  var zoomVal = document.getElementById('zoomVal');
  var cropRead = document.getElementById('cropRead');

  function syncPanelControls(force) {
    var panel = state.panels[selected];
    if (force || document.activeElement !== roleInput) roleInput.value = panel.role;
    if (force || document.activeElement !== nameInput) nameInput.value = panel.name;
    zoomRange.value = String(panel.zoom);
    zoomVal.textContent = '×' + Number(panel.zoom).toFixed(2);
    cropRead.textContent =
      'offset x ' + panel.ox.toFixed(2) + ' · y ' + panel.oy.toFixed(2);
    gridEl.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.photo === panel.photoId);
    });
  }

  roleInput.addEventListener('input', function () {
    state.panels[selected].role = roleInput.value;
    redraw();
  });
  nameInput.addEventListener('input', function () {
    state.panels[selected].name = nameInput.value;
    redraw();
  });
  zoomRange.addEventListener('input', function () {
    state.panels[selected].zoom = Number(zoomRange.value);
    redraw();
  });
  document.getElementById('resetCrop').addEventListener('click', function () {
    var fresh = MH.defaultState().panels[selected];
    var panel = state.panels[selected];
    panel.zoom = fresh.zoom;
    panel.ox = fresh.ox;
    panel.oy = fresh.oy;
    redraw();
  });

  // The reader's own photo, read locally and never sent anywhere.
  document.getElementById('ownPhoto').addEventListener('change', function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var key = 'own-' + selected;
      var img = new Image();
      img.onload = function () {
        images[key] = img;
        state.panels[selected].photoId = key;
        redraw();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  // ------------------------------------------------------------- drag & zoom
  var drag = null;
  function canvasPoint(ev) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height)
    };
  }
  canvas.addEventListener('pointerdown', function (ev) {
    var p = canvasPoint(ev);
    drag = { x: p.x, y: p.y };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var p = canvasPoint(ev);
    var dx = p.x - drag.x;
    var dy = p.y - drag.y;
    drag = { x: p.x, y: p.y };
    var panel = state.panels[selected];
    var rects = MH.panelRects(state.layout, canvas.width, canvas.height);
    var img = images[panel.photoId];
    if (!rects[selected] || !img) return;
    var cr = MH.coverRect(img, rects[selected], panel);
    // Move the crop opposite the pointer so the photo follows the hand.
    if (cr.fx > 0.5) panel.ox = clamp(panel.ox - (2 * dx) / cr.fx);
    if (cr.fy > 0.5) panel.oy = clamp(panel.oy - (2 * dy) / cr.fy);
    redraw();
  });
  ['pointerup', 'pointercancel'].forEach(function (type) {
    canvas.addEventListener(type, function () { drag = null; });
  });
  canvas.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var panel = state.panels[selected];
    var factor = ev.deltaY < 0 ? 1.08 : 1 / 1.08;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * factor));
    redraw();
  }, { passive: false });

  function clamp(v) { return Math.min(1, Math.max(-1, v)); }

  // ------------------------------------------------------------------- words
  document.querySelectorAll('[data-word]').forEach(function (input) {
    var key = input.getAttribute('data-word');
    input.value = state.words[key] || '';
    input.addEventListener('input', function () {
      state.words[key] = input.value;
      redraw();
    });
  });

  // --------------------------------------------------------- layout & palette
  document.querySelectorAll('[data-layout]').forEach(function (b) {
    b.classList.toggle('active', b.dataset.layout === state.layout);
    b.addEventListener('click', function () {
      state.layout = b.dataset.layout;
      document.querySelectorAll('[data-layout]').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      redraw();
    });
  });

  var paletteSelect = document.getElementById('paletteSelect');
  Object.keys(MH.PALETTES).forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    paletteSelect.appendChild(opt);
  });
  paletteSelect.value = state.palette;
  paletteSelect.addEventListener('change', function () {
    state.palette = paletteSelect.value;
    redraw();
  });

  // ------------------------------------------------------------------ export
  document.querySelectorAll('[data-export]').forEach(function (b) {
    b.addEventListener('click', function () {
      exportPng(b.dataset.export);
    });
  });

  function exportPng(layoutKey) {
    var layout = MH.LAYOUTS[layoutKey];
    if (!layout) return;
    var render = function () {
      var off = document.createElement('canvas');
      off.width = layout.w;
      off.height = layout.h;
      var offCtx = off.getContext('2d');
      var snapshot = {
        layout: layoutKey,
        palette: state.palette,
        panels: state.panels,
        words: state.words
      };
      MH.drawCover(offCtx, layout.w, layout.h, snapshot, { images: images });
      off.toBlob(function (blob) {
        if (!blob) return;
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'marina-heat-' + layoutKey + '.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      }, 'image/png');
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(render);
    } else {
      render();
    }
  }

  // ------------------------------------------------------------------- start
  selectPanel(selected);
  redraw();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('40px Anton').then(redraw).catch(function () {});
    document.fonts.load('40px Yellowtail').then(redraw).catch(function () {});
  }
  if (params.get('section') === 'words') {
    setTimeout(function () {
      var el = document.getElementById('words');
      if (el) el.scrollIntoView({ block: 'start' });
    }, 350);
  }
})();
