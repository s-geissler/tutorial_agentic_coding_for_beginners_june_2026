/* ============================================================
   Default template: navigation script
   ------------------------------------------------------------
   Owns everything that's not a widget:
     - tracks the current slide
     - updates the counter, section label, and progress bar
     - keyboard navigation (arrows, page up/down, home/end, ?)
     - click-to-advance on the slide background
     - builds and toggles the TOC overlay
     - theme toggle with localStorage persistence
   ============================================================ */
'use strict';

(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (slides.length === 0) return;

  const total = slides.length;
  const counter  = document.getElementById('nav-counter');
  const section  = document.getElementById('nav-section');
  const progress = document.getElementById('progress');
  const prevBtn  = document.getElementById('prev');
  const nextBtn  = document.getElementById('next');
  const toc      = document.getElementById('toc');
  const tocList  = document.getElementById('toc-list');
  const tocBtn   = document.getElementById('toc-button');
  const themeBtn = document.getElementById('theme-toggle');
  let current = 0;

  function pad(n) { return String(n).padStart(2, '0'); }

  // Derive the visible section label from the slide's data attrs.
  function sectionLabelFor(slide) {
    const num   = slide.dataset.section || '';
    const label = slide.dataset.sectionLabel || '';
    return num ? '\u00a7 ' + num + ' \u00b7 ' + label : label;
  }

  function go(i) {
    if (i < 0 || i >= total) return;
    slides[current].classList.remove('active');
    current = i;
    slides[current].classList.add('active');
    if (counter) counter.innerHTML = `${current + 1} / ${total} \u00b7 <kbd>?</kbd> for TOC`;
    if (section) section.innerHTML = `<span class="accent">${sectionLabelFor(slides[current])}</span>`;
    if (progress) progress.style.width = `${((current + 1) / total) * 100}%`;
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
    try { history.replaceState(null, '', '#' + (current + 1)); } catch (e) { /* ignore */ }
  }

  function next() { go(Math.min(current + 1, total - 1)); }
  function prev() { go(Math.max(current - 1, 0)); }

  // Wire buttons
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  if (tocBtn) tocBtn.addEventListener('click', openToc);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (toc.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeToc(); }
      return;
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home':
        e.preventDefault(); go(0); break;
      case 'End':
        e.preventDefault(); go(total - 1); break;
      case 'Escape':
      case '?':
        e.preventDefault(); openToc(); break;
      case 't':
      case 'T':
        e.preventDefault(); toggleTheme(); break;
    }
  });

  // Click on left/right side of the slide background advances
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, code, pre, input, textarea, .toc, .skill-modal-overlay, .lightbox-overlay, .tui-shot img, [data-lightbox]')) return;
    const x = e.clientX / window.innerWidth;
    if (x > 0.6) next();
    else if (x < 0.4) prev();
  });

  /* ==========================================================
     Table of contents
     ========================================================== */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildToc() {
    if (!tocList) return;
    const html = slides.map((s, i) => {
      const num   = pad(i + 1);
      const title = s.dataset.toc || s.dataset.title || `Slide ${num}`;
      return `<li><a href="#${i + 1}" data-idx="${i}"><span class="num">${num}</span><span>${escapeHtml(title)}</span></a></li>`;
    }).join('');
    tocList.innerHTML = html;
    tocList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        go(parseInt(a.dataset.idx, 10));
        closeToc();
      });
    });
  }

  function openToc()  { if (toc) toc.classList.add('open'); }
  function closeToc() { if (toc) toc.classList.remove('open'); }
  if (toc) toc.addEventListener('click', (e) => { if (e.target === toc) closeToc(); });

  /* ==========================================================
     Theme toggle
     ========================================================== */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    if (themeBtn) themeBtn.textContent = t === 'dark' ? '\u263e' : '\u2600';
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
  }
  function toggleTheme() {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }

  // Restore theme preference
  try {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  } catch (e) { /* ignore */ }

  /* ==========================================================
     Boot
     ========================================================== */
  // Pre-fill each slide's header section + number from data attrs
  slides.forEach((s, i) => {
    const headerSection = s.querySelector('.slide-header .section');
    if (headerSection) headerSection.textContent = sectionLabelFor(s);
    const headerNumber = s.querySelector('.slide-header .number');
    if (headerNumber) headerNumber.textContent = `${pad(i + 1)} / ${pad(total)}`;
  });

  buildToc();

  // Initial slide from URL hash if present
  const m = (location.hash || '').match(/^#(\d+)$/);
  if (m) {
    const i = parseInt(m[1], 10) - 1;
    if (i >= 0 && i < total) current = i;
  }

  // Render initial state
  slides.forEach((s, i) => { if (i !== current) s.classList.remove('active'); });
  slides[current].classList.add('active');
  if (counter) counter.innerHTML = `${current + 1} / ${total} \u00b7 <kbd>?</kbd> for TOC`;
  if (section) section.innerHTML = `<span class="accent">${sectionLabelFor(slides[current])}</span>`;
  if (progress) progress.style.width = `${((current + 1) / total) * 100}%`;
  if (prevBtn) prevBtn.disabled = current === 0;
  if (nextBtn) nextBtn.disabled = current === total - 1;
  try { history.replaceState(null, '', '#' + (current + 1)); } catch (e) { /* ignore */ }
})();
