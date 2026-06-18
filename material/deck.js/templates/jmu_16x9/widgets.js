/* ============================================================
   Default template: widget behaviour
   ------------------------------------------------------------
   Initialises the interactive widgets:
     - lightbox (click any [data-lightbox] image to zoom)
     - tokenizer (click tokens to inspect)
     - context-window (toggle items, compaction logic)
     - skills-grid + skill-modal (click a card to open its modal)
     - ralph-loop (3-column issue tracker with play/pause)
     - loop-demo (animated orbit around stations)

   Each widget initialiser is a no-op on slides that don't
   include the corresponding HTML. Slides provide the content
   for widgets like skills-grid via the slide's own HTML.
   ============================================================ */
'use strict';

(function () {

  /* ==========================================================
     Shared helpers: tiny markdown renderer
     ========================================================== */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderMarkdown(md) {
    let body = md.replace(/^---[\s\S]*?---\n*/, '').trim();
    body = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    body = body.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return '<pre><code>' + code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim() + '</code></pre>';
    });
    // Blockquotes
    body = body.replace(/^&gt;\s?(.+)$/gm, '<blockquote><p>$1</p></blockquote>');
    // Headings
    body = body.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    body = body.replace(/^### (.+)$/gm,  '<h3>$1</h3>');
    body = body.replace(/^## (.+)$/gm,   '<h2>$1</h2>');
    body = body.replace(/^# (.+)$/gm,    '<h2>$1</h2>');
    // Horizontal rules
    body = body.replace(/^---$/gm, '<hr>');
    // Inline formatting
    body = body.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    body = body.replace(/\*(.+?)\*/g,     '<em>$1</em>');
    body = body.replace(/`([^`]+)`/g, (_, c) =>
      '<code>' + c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code>'
    );
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Ordered lists
    body = body.replace(/(?:^(?:\d+\.) .+$(?:\n|$))+/gm, (m) => {
      const items = m.trim().split('\n').map((l) => '<li>' + l.replace(/^\d+\.\s*/, '') + '</li>').join('\n');
      return '<ol>\n' + items + '\n</ol>\n';
    });
    // Unordered lists
    body = body.replace(/(?:^- .+$(?:\n|$))+/gm, (m) => {
      const items = m.trim().split('\n').map((l) => '<li>' + l.replace(/^-\s*/, '') + '</li>').join('\n');
      return '<ul>\n' + items + '\n</ul>\n';
    });
    body = '<p>' + body + '</p>';
    body = body.replace(/\n\n/g, '</p><p>');
    body = body.replace(/<p>\s*<\/p>/g, '');
    return body;
  }

  function renderAgentContent(md) {
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n*/);
    let html = '';
    if (fmMatch) {
      const fm = fmMatch[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<div class="agent-frontmatter"><strong>Configuration</strong><pre>' + fm + '</pre></div>';
      md = md.slice(fmMatch[0].length);
    }
    if (md.trim()) html += '<div class="agent-body">' + renderMarkdown(md) + '</div>';
    return html;
  }

  /* ==========================================================
     Lightbox: click any [data-lightbox] image to zoom
     ========================================================== */
  (function lightbox() {
    const images = document.querySelectorAll('[data-lightbox]');
    if (images.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<button class="lightbox-close" title="Close (Esc)">&times;</button><img class="lightbox-img" alt="">';
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('img.lightbox-img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    function open(src, alt) {
      imgEl.src = src;
      imgEl.alt = alt || '';
      overlay.classList.add('active');
    }
    function close() { overlay.classList.remove('active'); }

    images.forEach(img => {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        open(img.src, img.alt);
      });
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });
  })();

  /* ==========================================================
     Tokenizer widget
     Reads tokens from <span class="tokenizer" data-tokens="...">
     where data-tokens is a JSON array of {t, sub, parent}.
     ========================================================== */
  (function tokenizer() {
    const input = document.getElementById('tokenizer-input');
    if (!input) return;
    let tokens;
    try { tokens = JSON.parse(input.dataset.tokens || '[]'); }
    catch (e) { tokens = []; }

    input.innerHTML = tokens.map((tok, i) => {
      const display = tok.t.replace(/ /g, '\u00a0');
      const cls = 'token' + (tok.sub ? ' subword' : '');
      return `<span class="${cls}" data-idx="${i}" title="${tok.sub ? 'sub-word of \u201c' + tok.parent + '\u201d' : 'whole word'}">${display}</span>`;
    }).join('');

    const inspectEl = document.getElementById('tokenizer-inspect');
    const countEl   = document.getElementById('token-count');
    const charEl    = document.getElementById('char-count');
    const costEl    = document.getElementById('token-cost');

    if (countEl) {
      const subCount = tokens.filter((x) => x.sub).length;
      countEl.textContent = tokens.length + ' (' + subCount + ' sub-word)';
    }
    if (charEl) {
      charEl.textContent = tokens.reduce((s, t) => s + t.t.length, 0);
    }
    if (costEl) {
      // Approx cost: $3 per million input tokens.
      costEl.textContent = '$' + ((tokens.length * 3) / 1_000_000).toFixed(6);
    }

    function showInspect(idx) {
      const tok = tokens[idx];
      const displayText = tok.t.replace(/ /g, '\u00a0');
      inspectEl.classList.remove('empty');
      inspectEl.innerHTML = `
        <div class="k">token</div>
        <div class="v">#${idx + 1} \u00b7 "${displayText}"<span class="badge ${tok.sub ? 'subword' : 'whole'}">${tok.sub ? 'sub-word' : 'whole'}</span></div>
        <div class="k">length</div>
        <div class="v">${tok.t.length} char${tok.t.length === 1 ? '' : 's'}${tok.t.startsWith(' ') ? ' (including leading space)' : ''}</div>
        ${tok.sub
          ? `<div class="k">part of</div><div class="v">"${tok.parent}"</div>`
          : `<div class="k">part of</div><div class="v muted">\u2014 (whole word)</div>`}
        <div class="k">cumulative</div>
        <div class="v">${idx + 1} of ${tokens.length} tokens consumed by this sentence</div>
      `;
    }
    function clearInspect() {
      inspectEl.classList.add('empty');
      inspectEl.textContent = 'Pick a token above to inspect.';
    }

    input.addEventListener('click', (e) => {
      const t = e.target.closest('.token');
      if (!t) return;
      const idx = parseInt(t.dataset.idx, 10);
      input.querySelectorAll('.token').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      showInspect(idx);
    });

    if (tokens.length > 0) showInspect(0);
  })();

  /* ==========================================================
     Context window widget
     Reads items from <div class="context-window" data-items="...">
     where data-items is JSON: [{label, tokens, cls}].
     ========================================================== */
  (function contextWindow() {
    const bar = document.getElementById('context-bar');
    if (!bar) return;
    const MAX = parseInt(bar.dataset.max || '200000', 10);
    const COMPACTION_RATIO = parseFloat(bar.dataset.compaction || '0.2');
    let items;
    try { items = JSON.parse(bar.dataset.items || '[]'); }
    catch (e) { items = []; }

    const fillRaw      = document.getElementById('context-fill');
    const fillCompacted= document.getElementById('context-fill-compacted');
    const usedEl       = document.getElementById('context-used');
    const rawEl        = document.getElementById('context-raw');
    const compactedEl  = document.getElementById('context-compacted-total');
    const ratioEl      = document.getElementById('context-ratio');
    const notice       = document.getElementById('context-notice');
    const compactedList= document.getElementById('context-compacted-list');
    const legend       = document.getElementById('context-legend');

    const state = items.map(() => 'out');
    let rawTotal = 0, compactedTotal = 0;
    const noticeItems = new Set();

    const fmt = (n) => n.toLocaleString();
    const effectiveTokens = (i) => state[i] === 'compacted'
      ? Math.round(items[i].tokens * COMPACTION_RATIO)
      : items[i].tokens;

    function maybeCompact() {
      while (rawTotal > MAX) {
        let oldest = -1;
        for (let i = 0; i < items.length; i++) {
          if (state[i] === 'raw') { oldest = i; break; }
        }
        if (oldest === -1) break;
        state[oldest] = 'compacted';
        rawTotal -= items[oldest].tokens;
        compactedTotal += Math.round(items[oldest].tokens * COMPACTION_RATIO);
        noticeItems.add(oldest);
      }
      for (let i = items.length - 1; i >= 0 && rawTotal + compactedTotal <= MAX; i--) {
        if (state[i] === 'compacted') {
          if (rawTotal + items[i].tokens + compactedTotal - effectiveTokens(i) <= MAX) {
            state[i] = 'raw';
            rawTotal += items[i].tokens;
            compactedTotal -= Math.round(items[i].tokens * COMPACTION_RATIO);
            noticeItems.delete(i);
          } else break;
        }
      }
    }

    function render() {
      const total = rawTotal + compactedTotal;
      const rawPct = (rawTotal / MAX) * 100;
      const compactedPct = (compactedTotal / MAX) * 100;
      fillRaw.style.width       = Math.min(100, rawPct) + '%';
      fillCompacted.style.width = Math.min(100 - Math.min(100, rawPct), compactedPct) + '%';
      usedEl.textContent      = fmt(total);
      rawEl.textContent       = fmt(rawTotal);
      compactedEl.textContent = fmt(compactedTotal);
      const over = total > MAX;
      usedEl.classList.toggle('over', over);
      bar.classList.toggle('over', over);

      if (compactedTotal > 0) {
        const original = Array.from(noticeItems).reduce((s, i) => s + items[i].tokens, 0);
        const saved = original - compactedTotal;
        ratioEl.textContent = `(${fmt(saved)} tokens saved by summarising ${noticeItems.size} item${noticeItems.size === 1 ? '' : 's'})`;
      } else {
        ratioEl.textContent = '';
      }

      if (noticeItems.size > 0) {
        notice.classList.add('active');
        compactedList.innerHTML = Array.from(noticeItems).sort((a, b) => a - b)
          .map((i) => `<span>${items[i].label.replace(/^\+ /, '')}: ${fmt(items[i].tokens)} \u2192 ${fmt(Math.round(items[i].tokens * COMPACTION_RATIO))}</span>`)
          .join('');
      } else {
        notice.classList.remove('active');
        compactedList.innerHTML = '';
      }

      legend.querySelectorAll('button').forEach((btn, i) => {
        btn.classList.toggle('active', state[i] !== 'out');
        if (state[i] === 'compacted') {
          btn.style.borderColor = 'var(--compacted)';
          btn.style.color = 'var(--compacted)';
        } else {
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      });
    }

    items.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.textContent = `${item.label} (${fmt(item.tokens)})`;
      btn.addEventListener('click', () => {
        if (state[i] !== 'out') {
          if (state[i] === 'raw') rawTotal -= item.tokens;
          else { compactedTotal -= Math.round(item.tokens * COMPACTION_RATIO); noticeItems.delete(i); }
          state[i] = 'out';
        } else {
          state[i] = 'raw';
          rawTotal += item.tokens;
          maybeCompact();
        }
        render();
      });
      legend.appendChild(btn);
    });

    const resetBtn = document.getElementById('context-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      for (let i = 0; i < state.length; i++) state[i] = 'out';
      rawTotal = 0;
      compactedTotal = 0;
      noticeItems.clear();
      render();
    });
    render();
  })();

  /* ==========================================================
     Skills grid + modal
     Each card has data-name, data-content (markdown), and
     a child .desc for the teaser. Click opens the modal.
     ========================================================== */
  (function skillsGrid() {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;

    const overlay = document.createElement('div');
    overlay.className = 'skill-modal-overlay';
    overlay.innerHTML = `
      <div class="skill-modal">
        <button class="skill-modal-close" title="Close (Esc)">&times;</button>
        <div class="skill-modal-name"></div>
        <div class="skill-modal-desc"></div>
        <div class="skill-modal-content"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const modal       = overlay.querySelector('.skill-modal');
    const nameEl      = overlay.querySelector('.skill-modal-name');
    const descEl      = overlay.querySelector('.skill-modal-desc');
    const contentEl   = overlay.querySelector('.skill-modal-content');
    const closeBtn    = overlay.querySelector('.skill-modal-close');

    function open(card) {
      const name    = card.dataset.name || card.querySelector('.name')?.textContent || 'Skill';
      const desc    = card.querySelector('.desc')?.textContent || '';
      const content = card.dataset.content || '';
      nameEl.textContent = name;
      descEl.textContent = desc;
      // The content is an agent-style markdown blob (frontmatter + body)
      contentEl.innerHTML = renderAgentContent(content);
      overlay.classList.add('active');
    }
    function close() { overlay.classList.remove('active'); }

    grid.querySelectorAll('.skill-card').forEach((card) => {
      card.addEventListener('click', () => open(card));
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });
  })();

  /* ==========================================================
     Exercise grid + modal (hands-on use case slides)
     Finds ALL .exercise-grid containers. Each .exercise-card has
     data-skill and data-content (markdown). Click opens a shared
     modal with the detail rendered from the markdown.
     ========================================================== */
  (function exerciseGrid() {
    const grids = document.querySelectorAll('.exercise-grid');
    if (grids.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'exercise-modal-overlay';
    overlay.innerHTML = `
      <div class="exercise-modal">
        <button class="exercise-modal-close" title="Close (Esc)">&times;</button>
        <div class="exercise-modal-skill"></div>
        <div class="exercise-modal-title"></div>
        <div class="exercise-modal-content"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const skillEl   = overlay.querySelector('.exercise-modal-skill');
    const titleEl   = overlay.querySelector('.exercise-modal-title');
    const contentEl = overlay.querySelector('.exercise-modal-content');
    const closeBtn  = overlay.querySelector('.exercise-modal-close');

    function open(card) {
      const skill   = card.dataset.skill || '';
      const title   = card.querySelector('.exercise-title')?.textContent || '';
      const content = card.dataset.content || '';
      skillEl.textContent = skill;
      titleEl.textContent = title;
      contentEl.innerHTML = renderMarkdown(content);
      overlay.classList.add('active');
    }
    function close() { overlay.classList.remove('active'); }

    grids.forEach((grid) => {
      grid.querySelectorAll('.exercise-card').forEach((card) => {
        card.addEventListener('click', () => open(card));
      });
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });
  })();

  /* ==========================================================
     Ralph loop (3-column issue tracker)
     Reads issues from <div class="ralph-loop" data-issues="...">
     where data-issues is JSON: [{title, column: "todo"|"done"}].
     ========================================================== */
  (function ralphLoop() {
    const root = document.querySelector('.ralph-loop');
    if (!root) return;
    let issues;
    try { issues = JSON.parse(root.dataset.issues || '[]'); }
    catch (e) { issues = []; }

    const todoCol  = root.querySelector('.column.todo');
    const doneCol  = root.querySelector('.column.done');
    const arrowEl  = root.querySelector('.arrow');
    const ctrls    = root.querySelector('.controls');
    if (!todoCol || !doneCol) return;

    const state = issues.map(() => 'todo');
    let running = false;
    let timer = null;

    function render() {
      todoCol.querySelectorAll('.issue').forEach((n) => n.remove());
      doneCol.querySelectorAll('.issue').forEach((n) => n.remove());
      issues.forEach((iss, i) => {
        const el = document.createElement('div');
        el.className = 'issue' + (state[i] === 'done' ? ' done' : (state[i] === 'active' ? ' active' : ''));
        el.innerHTML = '<span class="dot"></span><span class="title"></span>';
        el.querySelector('.title').textContent = iss.title;
        el.addEventListener('click', () => {
          if (state[i] === 'todo')      state[i] = 'active';
          else if (state[i] === 'active') state[i] = 'done';
          else                          state[i] = 'todo';
          render();
        });
        (state[i] === 'done' ? doneCol : todoCol).appendChild(el);
      });
    }

    function tick() {
      // Promote the first todo to done, recursively
      for (let i = 0; i < state.length; i++) {
        if (state[i] === 'todo') { state[i] = 'done'; render(); return; }
      }
      // All done: reset to todo and stop
      for (let i = 0; i < state.length; i++) state[i] = 'todo';
      render();
      stop();
    }

    function start() {
      if (running) return;
      running = true;
      if (arrowEl) arrowEl.classList.add('pulsing');
      timer = setInterval(tick, 1500);
    }
    function stop() {
      running = false;
      if (arrowEl) arrowEl.classList.remove('pulsing');
      if (timer) { clearInterval(timer); timer = null; }
    }

    if (ctrls) {
      const playBtn  = document.createElement('button');
      playBtn.textContent = 'Play';
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset';
      resetBtn.className = 'secondary';
      ctrls.appendChild(playBtn);
      ctrls.appendChild(resetBtn);
      playBtn.addEventListener('click', () => { if (running) { stop(); playBtn.textContent = 'Play'; } else { start(); playBtn.textContent = 'Pause'; } });
      resetBtn.addEventListener('click', () => { stop(); for (let i = 0; i < state.length; i++) state[i] = 'todo'; render(); playBtn.textContent = 'Play'; });
    }
    render();
  })();

  /* ==========================================================
     Loop demo: animated orbit around stations
     Reads stations from <div class="loop-demo" data-stations="...">
     where data-stations is JSON: [{name, snippet, status}].
     ========================================================== */
  (function loopDemo() {
    const root = document.querySelector('.loop-demo');
    if (!root) return;
    let stations;
    try { stations = JSON.parse(root.dataset.stations || '[]'); }
    catch (e) { stations = []; }
    if (stations.length === 0) return;

    const ring = root.querySelector('.loop-ring');
    const statusName = root.querySelector('.station-name');
    const statusSnippet = root.querySelector('.snippet');
    const statusIter = root.querySelector('.iter');
    const pauseBtn = root.querySelector('.pause-btn');
    const packet = root.querySelector('.loop-packet');
    if (!ring || !statusName || !statusSnippet) return;

    // Render the ring as a simple SVG
    const n = stations.length;
    const r = 130;
    const svg = ['<svg viewBox="-160 -160 320 320">'];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      svg.push(`<g class="station" data-idx="${i}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">`);
      svg.push(`<rect x="-44" y="-18" width="88" height="36" rx="4" fill="#fff" stroke="#00549f" stroke-width="1.5"/>`);
      svg.push(`<text x="0" y="4" font-family="Arial" font-size="10" fill="#00549f" text-anchor="middle" font-weight="600">${stations[i].name}</text>`);
      svg.push('</g>');
    }
    svg.push('</svg>');
    ring.innerHTML = svg.join('');

    let current = 0;
    let iter = 0;
    function render() {
      const s = stations[current];
      statusName.textContent = s.name;
      statusSnippet.textContent = s.snippet || '';
      if (statusIter) statusIter.innerHTML = `iter <strong>${iter + 1}</strong> / ${n} &middot; station <strong>${current + 1}</strong> / ${n}`;
      ring.querySelectorAll('.station').forEach((el, i) => el.classList.toggle('active', i === current));
    }
    function next() {
      current = (current + 1) % n;
      if (current === 0) iter++;
      render();
    }
    let interval = setInterval(next, 2000);
    // The .loop-packet animation is defined as `paused` in CSS so that
    // authors can hit "play" themselves. Set it to running when the demo
    // starts so the orbiting dot is animated by default.
    if (packet) packet.style.animationPlayState = 'running';
    if (pauseBtn) {
      pauseBtn.textContent = 'Pause';
      pauseBtn.addEventListener('click', () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
          pauseBtn.textContent = 'Play';
          if (packet) packet.style.animationPlayState = 'paused';
        } else {
          interval = setInterval(next, 2000);
          pauseBtn.textContent = 'Pause';
          if (packet) packet.style.animationPlayState = 'running';
        }
      });
    }
    render();
  })();

})();
