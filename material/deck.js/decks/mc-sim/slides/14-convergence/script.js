/* Slide 14 — convergence of the Monte Carlo pi estimate.
   Precomputes one run, then lets the viewer reveal the error history
   via a slider. Plots |estimate - pi| against N on log-log axes next
   to the theoretical 1/sqrt(N) trend. */
(function () {
  'use strict';

  const svg = document.getElementById('mc14-svg');
  if (!svg) return;
  const slide = svg.closest('.slide');
  const curve = document.getElementById('mc14-curve');
  const marker = document.getElementById('mc14-marker');
  const nEl = document.getElementById('mc14-n');
  const errEl = document.getElementById('mc14-err');
  const refEl = document.getElementById('mc14-ref');
  const slider = document.getElementById('mc14-slider');
  const rerunBtn = document.getElementById('mc14-rerun');

  const TRUE_PI = Math.PI;
  const MAX = 100000;
  const NSAMP = 130;
  const C = 1.64;                  // 1-sigma typical error constant
  const cumHits = new Uint32Array(MAX);

  // log-log coordinate maps (must match the static SVG grid)
  const X0 = 60, X1 = 580, Y0 = 20, Y1 = 310;
  function xLog(N) { return X0 + (Math.log10(N) - 1) / 4 * (X1 - X0); }
  function yLog(err) {
    const e = Math.max(1e-4, Math.min(1, err));
    return Y1 - (Math.log10(e) + 4) / 4 * (Y1 - Y0);
  }

  let sampleN = new Float64Array(NSAMP);
  let sampleX = new Float64Array(NSAMP);
  let sampleY = new Float64Array(NSAMP);

  function errorAt(N) { return N >= 1 ? Math.abs((4 * cumHits[N - 1]) / N - TRUE_PI) : 0; }

  function simulate() {
    let h = 0;
    for (let i = 0; i < MAX; i++) {
      const x = Math.random(), y = Math.random();
      if (x * x + y * y <= 1) h++;
      cumHits[i] = h;
    }
  }

  function computeSamples() {
    for (let i = 0; i < NSAMP; i++) {
      const t = i / (NSAMP - 1);
      const N = Math.max(10, Math.min(MAX, Math.round(10 * Math.pow(10000, t))));
      sampleN[i] = N;
      sampleX[i] = xLog(N);
      sampleY[i] = yLog(errorAt(N));
    }
  }

  function fmtErr(v) {
    if (v >= 0.001) return v.toFixed(4);
    return v.toExponential(1);
  }

  function render(revealN) {
    // build path: all samples up to revealN, then the exact reveal point
    let d = '';
    let lastX = 0, lastY = 0;
    for (let i = 0; i < NSAMP; i++) {
      if (sampleN[i] > revealN) break;
      d += (d === '' ? 'M' : ' L') + sampleX[i].toFixed(1) + ' ' + sampleY[i].toFixed(1);
      lastX = sampleX[i]; lastY = sampleY[i];
    }
    // append exact reveal point so the curve ends at the marker
    const rx = xLog(revealN), ry = yLog(errorAt(revealN));
    d += (d === '' ? 'M' : ' L') + rx.toFixed(1) + ' ' + ry.toFixed(1);
    curve.setAttribute('d', d);
    marker.setAttribute('cx', rx.toFixed(1));
    marker.setAttribute('cy', ry.toFixed(1));

    nEl.textContent = revealN.toLocaleString();
    const err = errorAt(revealN);
    errEl.textContent = fmtErr(err);
    refEl.textContent = fmtErr(C / Math.sqrt(revealN));
  }

  function sliderToN(s) {
    const N = Math.round(10 * Math.pow(10000, s / 1000));
    return Math.max(10, Math.min(MAX, N));
  }

  function revealFromSlider() {
    render(sliderToN(parseInt(slider.value, 10)));
  }

  // --- auto-reveal animation on first slide entry ------------------------
  let autoRevealed = false;
  let autoRaf = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function autoReveal() {
    if (autoRevealed || reduceMotion) { revealFromSlider(); return; }
    autoRevealed = true;
    const duration = 2200;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
      slider.value = String(Math.round(eased * 1000));
      revealFromSlider();
      if (t < 1 && !cancelAuto) autoRaf = requestAnimationFrame(tick);
    }
    let cancelAuto = false;
    slider._cancelAuto = () => { cancelAuto = true; };
    autoRaf = requestAnimationFrame(tick);
  }

  // --- events ------------------------------------------------------------
  slider.addEventListener('input', () => {
    if (slider._cancelAuto) slider._cancelAuto();
    revealFromSlider();
  });
  if (rerunBtn) {
    rerunBtn.addEventListener('click', () => {
      if (slider._cancelAuto) slider._cancelAuto();
      simulate();
      computeSamples();
      revealFromSlider();
    });
  }

  // --- start with slide visibility ---------------------------------------
  function syncActive() {
    const active = slide && slide.classList.contains('active');
    if (active && !autoRevealed) autoReveal();
  }
  if (slide) {
    new MutationObserver(syncActive).observe(slide, { attributes: true, attributeFilter: ['class'] });
  }

  // --- boot --------------------------------------------------------------
  simulate();
  computeSamples();
  revealFromSlider();          // full curve as the static fallback
  syncActive();
})();
