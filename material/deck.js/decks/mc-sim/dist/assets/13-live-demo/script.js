/* Slide 13 — live Monte Carlo pi estimator.
   Drops random points onto a unit square, colours those inside the
   inscribed quarter circle, and reports the running estimate 4*hits/N.
   Auto-plays only while the slide is active; pauses when navigated away. */
(function () {
  'use strict';

  const canvas = document.getElementById('mc13-canvas');
  if (!canvas) return;
  const slide = canvas.closest('.slide');
  const ctx = canvas.getContext('2d');

  // Offscreen canvas that accumulates drawn points so each frame only
  // renders the new batch (cheap) instead of every point so far.
  const pointsCanvas = document.createElement('canvas');
  const pctx = pointsCanvas.getContext('2d');

  const piEl    = document.getElementById('mc13-pi');
  const nEl     = document.getElementById('mc13-n');
  const hitsEl  = document.getElementById('mc13-hits');
  const errEl   = document.getElementById('mc13-err');
  const barEl   = document.getElementById('mc13-bar');
  const playBtn = document.getElementById('mc13-play');
  const resetBtn = document.getElementById('mc13-reset');
  const speedBtns = slide ? slide.querySelectorAll('[data-mc13-speed]') : [];

  const TRUE_PI = Math.PI;
  const MAX_N = 1000000;           // hard cap so memory stays bounded (1M)
  const xs = new Float32Array(MAX_N);
  const ys = new Float32Array(MAX_N);

  let count = 0;
  let hits = 0;
  let running = false;
  let rafId = null;
  let speed = 25;                  // points added per animation frame (may be fractional)
  let pending = 0;                 // fractional accumulator for sub-frame speeds
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let W = 0, H = 0, PAD = 0, SQ = 0, PR = 2; // geometry in device px
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- colours (re-read on theme change) ---------------------------------
  let COL_BG, COL_BORDER, COL_BLUE, COL_BLUE_SOFT, COL_ORANGE;
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n, f) => (cs.getPropertyValue(n).trim() || f);
    COL_BG        = v('--bg-elevated', '#f7f9fb');
    COL_BORDER    = v('--border-strong', '#b8c8d8');
    COL_BLUE      = v('--jmu-blue', '#00549f');
    COL_BLUE_SOFT = v('--accent-soft', '#e9f1f8');
    COL_ORANGE    = v('--warning', '#c77c02');
  }
  readColors();

  // --- sizing ------------------------------------------------------------
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssSize = Math.max(1, Math.floor(Math.min(rect.width, rect.height || rect.width)));
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const dev = Math.round(cssSize * dpr);
    canvas.width = dev;
    canvas.height = dev;
    pointsCanvas.width = dev;
    pointsCanvas.height = dev;
    W = dev; H = dev;
    PAD = Math.round(dev * 0.06);
    SQ = W - 2 * PAD;
    PR = Math.max(1.2, W / 280);   // point radius in device px
    redrawAllPoints();
    drawFrame();
  }

  // map unit point (x,y) -> device px (origin bottom-left)
  function px(x) { return PAD + x * SQ; }
  function py(y) { return H - PAD - y * SQ; }

  function drawGeometry() {
    ctx.clearRect(0, 0, W, H);
    // quarter-circle fill (centre at bottom-left corner)
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(0), py(1));
    ctx.arc(px(0), py(0), SQ, -Math.PI / 2, 0, false);
    ctx.closePath();
    ctx.fillStyle = COL_BLUE_SOFT;
    ctx.fill();
    // arc stroke
    ctx.beginPath();
    ctx.arc(px(0), py(0), SQ, -Math.PI / 2, 0, false);
    ctx.strokeStyle = COL_BLUE;
    ctx.lineWidth = Math.max(1.5, dpr * 1.5);
    ctx.stroke();
    // square outline
    ctx.strokeStyle = COL_BORDER;
    ctx.lineWidth = Math.max(1, dpr);
    ctx.strokeRect(PAD, PAD, SQ, SQ);
  }

  function drawPointToCache(x, y, inside) {
    pctx.globalAlpha = 0.85;
    pctx.fillStyle = inside ? COL_BLUE : COL_ORANGE;
    pctx.beginPath();
    pctx.arc(px(x), py(y), PR, 0, Math.PI * 2);
    pctx.fill();
  }

  function redrawAllPoints() {
    pctx.clearRect(0, 0, W, H);
    for (let i = 0; i < count; i++) {
      const x = xs[i], y = ys[i];
      drawPointToCache(x, y, x * x + y * y <= 1);
    }
  }

  function drawFrame() {
    drawGeometry();
    ctx.drawImage(pointsCanvas, 0, 0);
  }

  // --- simulation step ---------------------------------------------------
  // `speed` is points-per-frame and may be fractional. A fractional speed
  // (e.g. 0.1) accumulates `pending` until a whole point is due, so on
  // "slow" you can watch individual points land (~6 per second).
  function step() {
    if (count >= MAX_N) { stop(); return; }
    pending += speed;
    let batch = Math.floor(pending);
    pending -= batch;
    if (batch <= 0) return;          // no new point this frame
    batch = Math.min(batch, MAX_N - count);
    for (let i = 0; i < batch; i++) {
      const x = Math.random();
      const y = Math.random();
      const inside = x * x + y * y <= 1;
      xs[count] = x; ys[count] = y;
      if (inside) hits++;
      count++;
      drawPointToCache(x, y, inside);
    }
    drawFrame();
    updateStats();
    if (count >= MAX_N) stop();
  }

  function updateStats() {
    const piHat = count > 0 ? (4 * hits) / count : 0;
    if (count > 0) {
      piEl.textContent = piHat.toFixed(4);
      const err = Math.abs(piHat - TRUE_PI);
      errEl.textContent = err.toFixed(4);
      // bar over [3.0, 3.3], clamped
      const pct = Math.max(0, Math.min(100, ((piHat - 3.0) / 0.3) * 100));
      barEl.style.width = pct + '%';
    } else {
      piEl.textContent = '\u2014';
      errEl.textContent = '\u2014';
      barEl.style.width = '0%';
    }
    nEl.textContent = count.toLocaleString();
    hitsEl.textContent = hits.toLocaleString();
  }

  // --- run control -------------------------------------------------------
  function loop() {
    step();
    if (running) rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running || count >= MAX_N) return;
    running = true;
    playBtn.textContent = 'Pause';
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    playBtn.textContent = 'Play';
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function reset() {
    stop();
    count = 0; hits = 0; pending = 0;
    pctx.clearRect(0, 0, W, H);
    drawFrame();
    updateStats();
  }

  if (playBtn) playBtn.addEventListener('click', () => { running ? stop() : start(); });
  if (resetBtn) resetBtn.addEventListener('click', reset);
  speedBtns.forEach((b) => {
    b.addEventListener('click', () => {
      speed = parseFloat(b.getAttribute('data-mc13-speed')) || 25;
      speedBtns.forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    });
  });

  // --- start/stop with slide visibility ----------------------------------
  function syncActive() {
    const active = slide && slide.classList.contains('active');
    if (active && !running && count < MAX_N && !reduceMotion) start();
    else if (!active && running) stop();
  }
  if (slide) {
    new MutationObserver(syncActive).observe(slide, { attributes: true, attributeFilter: ['class'] });
  }

  // --- re-colour on theme toggle -----------------------------------------
  new MutationObserver(() => { readColors(); redrawAllPoints(); drawFrame(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // --- resize ------------------------------------------------------------
  if (window.ResizeObserver) {
    new ResizeObserver(() => resize()).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  // --- boot --------------------------------------------------------------
  resize();
  updateStats();
  syncActive();
})();
