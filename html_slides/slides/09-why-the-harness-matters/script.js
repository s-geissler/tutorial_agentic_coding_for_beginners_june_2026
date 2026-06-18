/* ============================================================
   Loop demo (slide 9)
   The packet's circular motion is driven by CSS (16s
   per loop, 4s per station). The text/highlight are
   driven by a setInterval that is started/stopped by
   the same play/pause button, so all three freeze and
   resume together. Starts paused.
   ============================================================ */
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
  const stationEl    = document.getElementById('loop-station');
  const snippetEl    = document.getElementById('loop-snippet');
  const iterEl       = document.getElementById('loop-iter');
  const iterDetailEl = document.getElementById('loop-iter-detail');
  const stations     = root.querySelectorAll('.station');
  const packet       = root.querySelector('.loop-packet');
  const pauseBtn     = document.getElementById('loop-pause');

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
