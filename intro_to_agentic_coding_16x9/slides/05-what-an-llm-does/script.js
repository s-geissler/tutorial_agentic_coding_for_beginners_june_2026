/* ============================================================
   Predict demo (slide 5)
   Cycles through a sequence of states that show the LLM
   predicting the next token one step at a time. Each
   predicted token is appended to the context for the next
   round, illustrating the autoregressive loop. Starts
   paused on the first state.
   ============================================================ */
(function () {
  const root = document.getElementById('predict-demo');
  if (!root) return;

  const STEP_MS = 1200;
  const lines = [
    document.getElementById('predict-line-0'),
    document.getElementById('predict-line-1'),
    document.getElementById('predict-line-2')
  ];
  const tokenEl  = document.getElementById('predict-token');
  const modelEl  = document.getElementById('predict-model');
  const iterEl   = document.getElementById('predict-iter');
  const phaseEl  = document.getElementById('predict-phase');
  const playBtn  = document.getElementById('predict-play');

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
