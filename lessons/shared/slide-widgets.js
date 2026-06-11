/* ============================================================
   slide-widgets.js
   ------------------------------------------------------------
   Initialises the interactive widgets (tokenizer, context
   window, skills grid, Ralph loop, loop demo). Each widget
   is a no-op on slides that don't include it.

   In the source layout, this file is loaded by every slide
   in slides/0001/. In the build output, the contents of
   this file are inlined into the central deck file, which
   is the only HTML the user opens at runtime.
   ============================================================ */
'use strict';

(function () {

  /* ======================================================
     Widget: Tokenizer (slide 5)
     Illustrative BPE-style tokenization. The exact splits
     depend on the model and its vocabulary; this example
     is a faithful shape, not a specific tokenizer's output.
     ====================================================== */
  (function () {
    const input = document.getElementById('tokenizer-input');
    if (!input) return;

    // A sentence that produces both whole-word and sub-word tokens.
    const text = "The agent tokenizes Anthropic's documentation carefully.";

    // Each token: the raw text the model sees (leading space included
    // where BPE would carry it), whether it is a sub-word piece, and
    // (for sub-words) the original word it was split off of.
    const tokens = [
      { t: "The",     sub: false, parent: null },
      { t: " agent",  sub: false, parent: null },
      { t: " token",  sub: false, parent: null },
      { t: "izes",    sub: true,  parent: "tokenize" },
      { t: " Anth",   sub: true,  parent: "Anthropic" },
      { t: "rop",     sub: true,  parent: "Anthropic" },
      { t: "ic",      sub: true,  parent: "Anthropic" },
      { t: "'s",      sub: false, parent: null },
      { t: " doc",    sub: false, parent: null },
      { t: "ument",   sub: true,  parent: "documentation" },
      { t: "ation",   sub: true,  parent: "documentation" },
      { t: " care",   sub: false, parent: null },
      { t: "fully",   sub: true,  parent: "carefully" },
      { t: ".",       sub: false, parent: null }
    ];

    input.innerHTML = tokens.map((tok, i) => {
      const display = tok.t.replace(/ /g, '\u00a0');
      const cls = 'token' + (tok.sub ? ' subword' : '');
      return `<span class="${cls}" data-idx="${i}" title="${tok.sub ? 'sub-word of \u201c' + tok.parent + '\u201d' : 'whole word'}">${display}</span>`;
    }).join('');

    const countEl = document.getElementById('token-count');
    const charEl = document.getElementById('char-count');
    const costEl = document.getElementById('token-cost');
    const inspectEl = document.getElementById('tokenizer-inspect');

    const subCount = tokens.filter(x => x.sub).length;
    countEl.textContent = tokens.length + ' (' + subCount + ' sub-word)';
    charEl.textContent = text.length;
    // Approx cost: $3 per million input tokens (Anthropic Sonnet-class).
    costEl.textContent = '$' + ((tokens.length * 3) / 1_000_000).toFixed(6);

    function tokenLength(t) { return t.length; }

    function showInspect(idx) {
      const tok = tokens[idx];
      const displayText = tok.t.replace(/ /g, '\u00a0');
      const cumulative = idx + 1;
      inspectEl.classList.remove('empty');
      inspectEl.innerHTML = `
        <div class="k">token</div>
        <div class="v">#${idx + 1} \u00b7 "${displayText}"<span class="badge ${tok.sub ? 'subword' : 'whole'}">${tok.sub ? 'sub-word' : 'whole'}</span></div>
        <div class="k">length</div>
        <div class="v">${tokenLength(tok.t)} char${tokenLength(tok.t) === 1 ? '' : 's'}${tok.t.startsWith(' ') ? ' (including leading space)' : ''}</div>
        ${tok.sub ? `<div class="k">part of</div><div class="v">"${tok.parent}"</div>` : `<div class="k">part of</div><div class="v muted">\u2014 (whole word)</div>`}
        <div class="k">cumulative</div>
        <div class="v">${cumulative} of ${tokens.length} tokens consumed by this sentence</div>
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
      input.querySelectorAll('.token').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      showInspect(idx);
    });
  })();

  /* ======================================================
     Widget: Context window (slide 6)
     Each item has a state: 'out' (not added), 'raw'
     (added, full size), or 'compacted' (added but
     summarised down to COMPACTION_RATIO of its size).
     When the raw total exceeds MAX, the oldest raw
     items flip to 'compacted' until raw fits again.
     ====================================================== */
  (function () {
    const MAX = 200_000;
    const COMPACTION_RATIO = 0.2;

    const bar = document.getElementById('context-bar');
    const fillRaw = document.getElementById('context-fill');
    const fillCompacted = document.getElementById('context-fill-compacted');
    const usedEl = document.getElementById('context-used');
    const rawEl = document.getElementById('context-raw');
    const compactedEl = document.getElementById('context-compacted-total');
    const ratioEl = document.getElementById('context-ratio');
    const notice = document.getElementById('context-notice');
    const compactedList = document.getElementById('context-compacted-list');
    const legend = document.getElementById('context-legend');
    if (!bar) return;

    const items = [
      { label: '+ System prompt',         tokens: 3_000,   cls: 'system' },
      { label: '+ Tool schemas',          tokens: 4_000,   cls: 'tools'  },
      { label: '+ @README.md',            tokens: 1_500,   cls: 'files'  },
      { label: '+ @app/main.py',          tokens: 1_800,   cls: 'files'  },
      { label: '+ Past 10 turns',         tokens: 12_000,  cls: 'history'},
      { label: '+ Skill: /tdd',           tokens: 2_000,   cls: 'system' },
      { label: '+ 50 most-recent errors', tokens: 8_000,   cls: 'history'},
      { label: '+ @src/ (whole module)',  tokens: 45_000,  cls: 'files'  },
      { label: '+ Past 200 turns',        tokens: 80_000,  cls: 'history'},
      { label: '+ Vendor dependency tree',tokens: 95_000,  cls: 'files'  }
    ];

    const state = items.map(() => 'out');
    let rawTotal = 0;
    let compactedTotal = 0;
    let noticeItems = new Set();

    function fmt(n) { return n.toLocaleString(); }

    function effectiveTokens(i) {
      const it = items[i];
      return state[i] === 'compacted'
        ? Math.round(it.tokens * COMPACTION_RATIO)
        : it.tokens;
    }

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
          } else {
            break;
          }
        }
      }
    }

    function totalUsed() { return rawTotal + compactedTotal; }

    function render() {
      const total = totalUsed();
      const rawPct = (rawTotal / MAX) * 100;
      const compactedPct = (compactedTotal / MAX) * 100;
      fillRaw.style.width = Math.min(100, rawPct) + '%';
      fillCompacted.style.width = Math.min(100 - Math.min(100, rawPct), compactedPct) + '%';
      usedEl.textContent = fmt(total);
      rawEl.textContent = fmt(rawTotal);
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
        compactedList.innerHTML = Array.from(noticeItems).sort((a,b) => a-b)
          .map(i => `<span>${items[i].label.replace(/^\+ /, '')}: ${fmt(items[i].tokens)} \u2192 ${fmt(Math.round(items[i].tokens * COMPACTION_RATIO))}</span>`)
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
          if (state[i] === 'raw') {
            rawTotal -= item.tokens;
          } else {
            compactedTotal -= Math.round(item.tokens * COMPACTION_RATIO);
            noticeItems.delete(i);
          }
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

    document.getElementById('context-reset').addEventListener('click', () => {
      for (let i = 0; i < state.length; i++) state[i] = 'out';
      rawTotal = 0;
      compactedTotal = 0;
      noticeItems.clear();
      render();
    });
    render();
  })();

  /* ======================================================
     Widget: Skills grid (slide 10)
     ====================================================== */
  (function () {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;
    const skills = [
      { name: 'grill-me', desc: 'Interview me relentlessly about a plan until every branch is resolved.', action: 'Use this BEFORE asking the agent to build. One question at a time, recommended answer included.' },
      { name: 'tdd', desc: 'Red-green-refactor loop. The agent writes a failing test, then the minimum code to pass.', action: 'Use this whenever you want the agent to add behaviour with a real feedback loop.' },
      { name: 'to-prd', desc: 'Synthesise the current conversation into a PRD and write it to docs/.', action: 'Use this AFTER /grill-me, when the spec is sharp and you want a written deliverable.' },
      { name: 'to-issues', desc: 'Decompose a PRD into independently-grabbable vertical slices, each as an issue.', action: 'Use this AFTER /to-prd, when you want to parallelise the work or hand it to a Ralph loop.' },
      { name: 'diagnose', desc: 'Reproduce \u2192 minimise \u2192 hypothesise \u2192 instrument \u2192 fix \u2192 regression-test.', action: 'Use this for hard bugs and performance regressions. Never guess before reproducing.' },
      { name: 'zoom-out', desc: 'Explain a section of code in the context of the whole system.', action: 'Use this when you are staring at an unfamiliar file and need a frame.' },
      { name: 'setup-matt-pocock-skills', desc: 'One-time per-repo config. Asks about your issue tracker, labels, doc location.', action: 'Run this once per repo before using the other engineering skills.' },
      { name: 'caveman', desc: 'Ultra-compressed communication mode. ~75% fewer tokens, full technical accuracy.', action: 'Use this when token budget is tight or you want a terse reply style.' }
    ];
    grid.innerHTML = skills.map(s => `
      <div class="skill-card" data-name="${s.name}">
        <div class="name">/${s.name}</div>
        <div class="desc">${s.desc}</div>
        <div class="action">${s.action}</div>
      </div>
    `).join('');
    grid.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('active');
      });
    });
  })();

  /* ======================================================
     Widget: Ralph loop (slide 24)
     ====================================================== */
  (function () {
    const issuesEl = document.getElementById('ralph-issues');
    const arrow = document.getElementById('ralph-arrow');
    const log = document.getElementById('ralph-log');
    const status = document.getElementById('ralph-status');
    const meta = document.getElementById('ralph-meta');
    const runBtn = document.getElementById('ralph-run');
    const stepBtn = document.getElementById('ralph-step');
    const resetBtn = document.getElementById('ralph-reset');
    if (!issuesEl) return;

    const initialIssues = [
      { id: 1, title: 'Add custom 400 handler for empty title', tokens: 1800 },
      { id: 2, title: 'Add overdue-highlighting in frontend for deadline field', tokens: 2400 },
      { id: 3, title: 'Add deadline field to Pydantic TodoCreate model', tokens: 1200 },
      { id: 4, title: 'Migration: add deadline column to existing todos.json', tokens: 900 }
    ];

    let state = [];
    let running = false;
    let timer = null;

    function render() {
      issuesEl.innerHTML = '';
      state.forEach(iss => {
        const div = document.createElement('div');
        div.className = 'issue' + (iss.done ? ' done' : '') + (iss.active ? ' active' : '');
        div.innerHTML = `<span class="dot"></span><span class="title">#${iss.id} \u00b7 ${iss.title}</span>`;
        issuesEl.appendChild(div);
      });
      const done = state.filter(s => s.done).length;
      meta.textContent = `${done} / ${state.length} done`;
      runBtn.textContent = running ? 'Pause' : (done === state.length ? 'Done' : 'Run');
      if (done === state.length && state.length > 0) runBtn.disabled = true; else runBtn.disabled = false;
    }

    function appendLog(msg) {
      const line = document.createElement('div');
      line.textContent = msg;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }

    function reset() {
      if (timer) { clearTimeout(timer); timer = null; }
      running = false;
      state = initialIssues.map(i => ({ ...i, done: false, active: false }));
      log.innerHTML = '';
      status.innerHTML = 'Idle. Press <em>Run</em>.';
      arrow.classList.remove('pulsing');
      render();
    }

    function step() {
      const next = state.find(s => !s.done);
      if (!next) { running = false; status.textContent = 'Queue empty. Loop terminates.'; arrow.classList.remove('pulsing'); render(); return false; }
      state.forEach(s => s.active = false);
      next.active = true;
      appendLog(`\u2192 picking up #${next.id}: ${next.title}`);
      appendLog(`  agent reads relevant files, edits, runs tests\u2026`);
      setTimeout(() => {
        next.done = true;
        next.active = false;
        appendLog(`\u2713 #${next.id} merged`);
        render();
      }, 600);
      render();
      return true;
    }

    function tick() {
      if (!running) return;
      const ok = step();
      if (ok) {
        timer = setTimeout(tick, 1400);
      } else {
        running = false;
      }
    }

    runBtn.addEventListener('click', () => {
      if (state.every(s => s.done)) return;
      running = !running;
      if (running) {
        status.textContent = 'Outer loop running. Inner agent solves one issue at a time.';
        arrow.classList.add('pulsing');
        tick();
      } else {
        status.textContent = 'Paused.';
        arrow.classList.remove('pulsing');
        if (timer) { clearTimeout(timer); timer = null; }
      }
      render();
    });

    stepBtn.addEventListener('click', () => {
      if (timer) { clearTimeout(timer); timer = null; }
      running = false;
      arrow.classList.remove('pulsing');
      step();
      render();
    });

    resetBtn.addEventListener('click', reset);
    reset();
  })();

  /* ======================================================
     Widget: Loop demo (slide 8)
     The packet's circular motion is driven by CSS (16s
     per loop, 4s per station). The text/highlight are
     driven by a setInterval that is started/stopped by
     the same play/pause button, so all three freeze and
     resume together. Starts paused.
     ====================================================== */
  (function () {
    const root = document.getElementById('loop-demo');
    if (!root) return;

    const PERIOD_MS = 4000;

    const snippets = [
      { name: 'CONTEXT', color: 'var(--accent)',
        text: 'user: "fix the failing test in @tests/test_api.py"\n\u2192 prompt lands at the start of the context window',
        detail: 'first turn' },
      { name: 'MODEL',   color: 'var(--code-fn)',
        text: 'thinking\u2026\n\u2192 tool call: read_file("tests/test_api.py")\noutput: text + tool_use block',
        detail: 'model produces output' },
      { name: 'TOOLS',   color: 'var(--warning)',
        text: 'harness reads @tests/test_api.py from disk\n\u2192 14 lines returned',
        detail: 'tool executes' },
      { name: 'RESULT',  color: 'var(--success)',
        text: 'tool result appended to context\n\u2192 loop back to MODEL with new info',
        detail: 'context grows' }
    ];

    let idx = 0;
    let iter = 1;
    let timer = null;
    const stationEl = document.getElementById('loop-station');
    const snippetEl = document.getElementById('loop-snippet');
    const iterEl = document.getElementById('loop-iter');
    const iterDetailEl = document.getElementById('loop-iter-detail');
    const stations = root.querySelectorAll('.station');
    const packet = root.querySelector('.loop-packet');
    const pauseBtn = document.getElementById('loop-pause');

    function render() {
      const s = snippets[idx];
      stations.forEach((st, i) => st.classList.toggle('active', i === idx));
      stationEl.textContent = s.name;
      stationEl.style.color = s.color;
      snippetEl.textContent = s.text;
      iterDetailEl.textContent = s.detail;
    }

    function advance() {
      idx = (idx + 1) % snippets.length;
      if (idx === 0) {
        iter++;
        iterEl.textContent = iter;
      }
      render();
    }

    function play() {
      if (timer) return;
      packet.style.animationPlayState = 'running';
      pauseBtn.textContent = 'pause';
      timer = setInterval(advance, PERIOD_MS);
    }

    function pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      packet.style.animationPlayState = 'paused';
      pauseBtn.textContent = 'play';
    }

    pauseBtn.addEventListener('click', () => {
      if (timer) pause(); else play();
    });

    render();
  })();

  /* ======================================================
     Widget: Predict demo (slide 5)
     Cycles through a sequence of states that show the LLM
     predicting the next token one step at a time. Each
     predicted token is appended to the context for the next
     round, illustrating the autoregressive loop. Starts
     paused on the first state.
     ====================================================== */
  (function () {
    const root = document.getElementById('predict-demo');
    if (!root) return;

    const STEP_MS = 1200;
    const lines = [
      document.getElementById('predict-line-0'),
      document.getElementById('predict-line-1'),
      document.getElementById('predict-line-2')
    ];
    const tokenEl = document.getElementById('predict-token');
    const modelEl = document.getElementById('predict-model');
    const iterEl  = document.getElementById('predict-iter');
    const phaseEl = document.getElementById('predict-phase');
    const playBtn = document.getElementById('predict-play');

    // One state = one snapshot of (input lines, output token, llm
    // active, phase label). "|" at the end of a line marks the
    // cursor where the next token will be appended. We start blank
    // (waiting), predict, then consume and repeat.
    const states = [
      { lines: ['The cat sat', 'on the ___',  ''         ], token: '',        llmActive: false, phase: 'waiting for next token'    },
      { lines: ['The cat sat', 'on the ___',  ''         ], token: 'mat',     llmActive: true,  phase: 'predicting: "mat"'         },
      { lines: ['The cat sat', 'on the mat|', ''          ], token: '',        llmActive: false, phase: 'appended "mat" to context' },
      { lines: ['The cat sat', 'on the mat|', ''          ], token: '.',       llmActive: true,  phase: 'predicting: "."'           },
      { lines: ['The cat sat', 'on the mat.|',''          ], token: '',        llmActive: false, phase: 'appended "." to context'   },
      { lines: ['The cat sat', 'on the mat.|',''          ], token: ' The',    llmActive: true,  phase: 'predicting: " The"'        },
      { lines: ['The cat sat', 'on the mat.', 'The |'     ], token: '',        llmActive: false, phase: 'appended " The" to context' },
      { lines: ['The cat sat', 'on the mat.', 'The |'     ], token: ' dog',    llmActive: true,  phase: 'predicting: " dog"'        },
      { lines: ['The cat sat', 'on the mat.', 'The dog |' ], token: '',        llmActive: false, phase: 'appended " dog" to context' },
      { lines: ['The cat sat', 'on the mat.', 'The dog |' ], token: ' barked', llmActive: true,  phase: 'predicting: " barked"'     },
      { lines: ['The cat sat', 'on the mat. The', 'dog barked|' ], token: '',   llmActive: false, phase: 'appended " barked" to context' },
      { lines: ['The cat sat', 'on the mat. The', 'dog barked|' ], token: '',   llmActive: false, phase: 'and again\u2026'           }
    ];

    let idx = 0;
    let iter = 1;
    let timer = null;

    function render() {
      const s = states[idx];
      for (let i = 0; i < lines.length; i++) lines[i].textContent = s.lines[i] || '';
      tokenEl.textContent = s.token;
      tokenEl.style.opacity = s.token ? '1' : '0.15';
      modelEl.classList.toggle('active', s.llmActive);
      phaseEl.textContent = '\u2014 ' + s.phase;
      iterEl.textContent = iter;
    }

    function advance() {
      idx++;
      if (idx >= states.length) {
        idx = 0;
        iter++;
      }
      render();
    }

    function play() {
      if (timer) return;
      playBtn.textContent = 'pause';
      timer = setInterval(advance, STEP_MS);
    }

    function pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      playBtn.textContent = 'play';
    }

    playBtn.addEventListener('click', () => {
      if (timer) pause(); else play();
    });

    render();
  })();

})();
