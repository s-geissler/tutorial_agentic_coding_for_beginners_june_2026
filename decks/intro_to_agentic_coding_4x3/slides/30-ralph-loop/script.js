/* ============================================================
   Ralph loop (slide 30)
   Issue queue on the left, inner agent log on the right.
   Run / Step / Reset controls. Mirrors the legacy widget.
   ============================================================ */
(function () {
  const issuesEl = document.getElementById('ralph-issues');
  const arrow    = document.getElementById('ralph-arrow');
  const log      = document.getElementById('ralph-log');
  const status   = document.getElementById('ralph-status');
  const meta     = document.getElementById('ralph-meta');
  const runBtn   = document.getElementById('ralph-run');
  const stepBtn  = document.getElementById('ralph-step');
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
    state.forEach((iss) => {
      const div = document.createElement('div');
      div.className = 'issue' + (iss.done ? ' done' : '') + (iss.active ? ' active' : '');
      div.innerHTML = `<span class="dot"></span><span class="title">#${iss.id} \u00b7 ${iss.title}</span>`;
      issuesEl.appendChild(div);
    });
    const done = state.filter((s) => s.done).length;
    meta.textContent = `${done} / ${state.length} done`;
    runBtn.textContent = running ? 'Pause' : (done === state.length ? 'Done' : 'Run');
    runBtn.disabled = done === state.length && state.length > 0;
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
    state = initialIssues.map((i) => Object.assign({}, i, { done: false, active: false }));
    log.innerHTML = '';
    status.innerHTML = 'Idle. Press <em>Run</em>.';
    arrow.classList.remove('pulsing');
    render();
  }

  function step() {
    const next = state.find((s) => !s.done);
    if (!next) {
      running = false;
      status.textContent = 'Queue empty. Loop terminates.';
      arrow.classList.remove('pulsing');
      render();
      return false;
    }
    state.forEach((s) => { s.active = false; });
    next.active = true;
    appendLog(`\u2192 picking up #${next.id}: ${next.title}`);
    appendLog('  agent reads relevant files, edits, runs tests\u2026');
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
    if (state.every((s) => s.done)) return;
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
