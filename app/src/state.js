// Marina Heat — Cast Cover Studio: shared state, cast, palettes and layouts.
// Plain classic script: everything lives on window.MH, no modules, no build step.

(function () {
  'use strict';

  var SAMPLE_PHOTOS = [
    { id: 'cast-boss', src: 'samples/cast-boss.jpg', label: 'The Boss' },
    { id: 'cast-driver', src: 'samples/cast-driver.jpg', label: 'The Driver' },
    { id: 'cast-fixer', src: 'samples/cast-fixer.jpg', label: 'The Fixer' },
    { id: 'cast-insider', src: 'samples/cast-insider.jpg', label: 'The Insider' },
    { id: 'cast-captain', src: 'samples/cast-captain.jpg', label: 'The Captain' },
    { id: 'cast-rider', src: 'samples/cast-rider.jpg', label: 'The Rider' },
    { id: 'convertible', src: 'samples/convertible.jpg', label: 'Convertible' },
    { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard' },
    { id: 'pier', src: 'samples/pier.jpg', label: 'Pier' }
  ];

  // Each palette: a canvas filter applied to the photos, a translucent wash
  // laid over them, and the furniture colors the cover chrome is drawn with.
  var PALETTES = {
    'Sunset Cinema': {
      filter: 'saturate(1.12) contrast(1.05) brightness(1.0)',
      wash: 'rgba(255, 122, 26, 0.10)',
      ink: '#171006',
      paper: '#f7ead2',
      gold: '#d9a441',
      goldSoft: '#f3d27a'
    },
    'Neon Nights': {
      filter: 'saturate(1.3) contrast(1.12) hue-rotate(-12deg) brightness(0.96)',
      wash: 'rgba(255, 43, 214, 0.10)',
      ink: '#0d0616',
      paper: '#f3e9ff',
      gold: '#e8b4ff',
      goldSoft: '#ffd7fb'
    },
    'Vice Pastel': {
      filter: 'saturate(0.92) contrast(0.96) brightness(1.1)',
      wash: 'rgba(120, 220, 255, 0.12)',
      ink: '#20303a',
      paper: '#fff6ec',
      gold: '#e58bb1',
      goldSoft: '#ffd9a8'
    },
    'Noir Gold': {
      filter: 'saturate(0.55) contrast(1.18) brightness(0.94)',
      wash: 'rgba(30, 22, 8, 0.16)',
      ink: '#0a0805',
      paper: '#efe6d0',
      gold: '#c9a227',
      goldSoft: '#e9cf7f'
    }
  };

  var LAYOUTS = {
    landscape: { key: 'landscape', label: 'Landscape 1920×1080', w: 1920, h: 1080 },
    square: { key: 'square', label: 'Square 1080×1080', w: 1080, h: 1080 },
    portrait: { key: 'portrait', label: 'Portrait 1080×1350', w: 1080, h: 1350 }
  };

  // The default cast: panel key, role tag, name and starting photo.
  var CAST = [
    { key: 'boss', role: 'THE BOSS', name: 'Don Aurelio Marino', photo: 'cast-boss' },
    { key: 'driver', role: 'THE DRIVER', name: 'Roxy Delmar', photo: 'cast-driver' },
    { key: 'fixer', role: 'THE FIXER', name: 'Piper Voss', photo: 'cast-fixer' },
    { key: 'insider', role: 'THE INSIDER', name: 'Madame Guile', photo: 'cast-insider' },
    { key: 'lookout', role: 'THE LOOKOUT', name: 'Rio Ferraro', photo: 'cast-rider' },
    { key: 'captain', role: 'THE CAPTAIN', name: 'Elias Crowe', photo: 'cast-captain' },
    { key: 'getaway', role: 'THE GETAWAY', name: 'Scarlet Convertible', photo: 'convertible' }
  ];

  var DEFAULT_WORDS = {
    title: 'MARINA SYNDICATE',
    subtitle: 'everybody pays at sundown',
    ribbon: 'ONE CITY · FIVE PLAYERS · NO SECOND TAKES',
    quote: 'THE HOTTEST CREW ON THE COAST',
    publisher: 'MARINA GAZETTE',
    volume: 'VOL. 1',
    billing: 'MARINA HEAT PICTURES PRESENTS A SUNSET CITY PRODUCTION · DON AURELIO MARINO · ROXY DELMAR · PIPER VOSS · MADAME GUILE · RIO FERRARO · ELIAS CROWE · DIRECTED BY V. MARLOWE · MUSIC BY THE HARBOR LIGHTS',
    comingSoon: 'COMING SOON',
    seal: 'ORIGINAL CAST COVER'
  };

  // Crop defaults per panel: offsets in [-1, 1], -1 anchors top/left,
  // 0 centers, 1 anchors bottom/right. The boss photo is a tall portrait
  // whose face sits in its top third, so he is anchored hard to the top.
  var CROP_DEFAULTS = {
    boss: { zoom: 1, ox: 0, oy: -1 },
    driver: { zoom: 1, ox: 0, oy: 0 },
    fixer: { zoom: 1, ox: 0, oy: 0 },
    insider: { zoom: 1, ox: 0, oy: 0 },
    lookout: { zoom: 1, ox: 0, oy: -0.35 },
    captain: { zoom: 1, ox: 0, oy: -0.7 },
    getaway: { zoom: 1, ox: 0, oy: 0 }
  };

  function defaultState() {
    var panels = {};
    CAST.forEach(function (member) {
      var crop = CROP_DEFAULTS[member.key] || { zoom: 1, ox: 0, oy: 0 };
      panels[member.key] = {
        photoId: member.photo,
        role: member.role,
        name: member.name,
        zoom: crop.zoom,
        ox: crop.ox,
        oy: crop.oy
      };
    });
    var words = {};
    Object.keys(DEFAULT_WORDS).forEach(function (k) { words[k] = DEFAULT_WORDS[k]; });
    return {
      layout: 'landscape',
      palette: 'Sunset Cinema',
      panels: panels,
      words: words
    };
  }

  window.MH = {
    SAMPLE_PHOTOS: SAMPLE_PHOTOS,
    PALETTES: PALETTES,
    LAYOUTS: LAYOUTS,
    CAST: CAST,
    DEFAULT_WORDS: DEFAULT_WORDS,
    defaultState: defaultState
  };
})();
