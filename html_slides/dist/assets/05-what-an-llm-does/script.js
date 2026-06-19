/* ============================================================
   Predict demo (slide 5)
   Cycles through a sequence of states that show the LLM
   predicting the next token one step at a time. Each
   predicted token is appended to the context for the next
   round, illustrating the autoregressive loop. Starts
   paused on the first state.

   On predict steps, the matching probability distribution
   in the output box (.dist[data-dist="<n>"]) is shown; the
   highlighted row is the winner that gets sampled. On
   waiting/appended steps, all distributions are hidden.
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
  const modelEl         = document.getElementById('predict-model');
  const inputFeedTextEl = document.getElementById('input-feed-text');
  const inputValueEls   = [
    document.getElementById('input-value-0'),
    document.getElementById('input-value-1'),
    document.getElementById('input-value-2'),
    document.getElementById('input-value-3')
  ];
  const iterEl          = document.getElementById('predict-iter');
  const phaseEl         = document.getElementById('predict-phase');
  const playBtn         = document.getElementById('predict-play');
  const dists           = Array.from(root.querySelectorAll('.dist'));

  // One state = one snapshot of (input lines, input token, per-neuron
  // input values, llm active, which distribution to show in the
  // output box, phase label). distId 0 means "no distribution"
  // (waiting/appended states). The "|" at the end of a line marks
  // the cursor where the next token will be appended. The
  // inputToken is the last token before the cursor — the model is
  // computing the next token from this position. The inputValues
  // are the 4 activation values at layer 1: the embedding of the
  // current token projected onto 4 dimensions. They are arbitrary
  // but distinct per token, to convey "different input → different
  // output". The winning token in each distribution matches the
  // token that gets appended to the context on the next state.
  const states = [
    { lines: ['The cat sat', 'on the ___',  ''         ], inputToken: '',    inputValues: ['', '', '', ''],                       llmActive: false, distId: 0, phase: 'waiting for next token'         },
    { lines: ['The cat sat', 'on the ___',  ''         ], inputToken: 'the', inputValues: [' 0.42', '-0.18', ' 0.91', ' 0.07'], llmActive: true,  distId: 1, phase: 'predicting: " mat"'             },
    { lines: ['The cat sat', 'on the mat|', ''          ], inputToken: '',    inputValues: ['', '', '', ''],                       llmActive: false, distId: 0, phase: 'appended " mat" to context'     },
    { lines: ['The cat sat', 'on the mat|', ''          ], inputToken: 'mat', inputValues: [' 0.73', ' 0.25', '-0.42', ' 0.88'], llmActive: true,  distId: 2, phase: 'predicting: " ."'               },
    { lines: ['The cat sat', 'on the mat.|',''          ], inputToken: '',    inputValues: ['', '', '', ''],                       llmActive: false, distId: 0, phase: 'appended " ." to context'       },
    { lines: ['The cat sat', 'on the mat.|',''          ], inputToken: '.',   inputValues: [' 0.15', ' 0.67', ' 0.33', '-0.51'], llmActive: true,  distId: 3, phase: 'predicting: " The"'             },
    { lines: ['The cat sat', 'on the mat.', 'The |'     ], inputToken: '',    inputValues: ['', '', '', ''],                       llmActive: false, distId: 0, phase: 'appended " The" to context'     },
    { lines: ['The cat sat', 'on the mat.', 'The |'     ], inputToken: 'The', inputValues: [' 0.55', '-0.29', ' 0.84', ' 0.12'], llmActive: true,  distId: 4, phase: 'predicting: " dog"'             },
    { lines: ['The cat sat', 'on the mat.', 'The dog |' ], inputToken: '',    inputValues: ['', '', '', ''],                       llmActive: false, distId: 0, phase: 'appended " dog" to context'     },
    { lines: ['The cat sat', 'on the mat.', 'The dog |' ], inputToken: 'dog', inputValues: [' 0.68', ' 0.41', '-0.15', ' 0.79'], llmActive: true,  distId: 5, phase: 'predicting: " barked"'          },
    { lines: ['The cat sat', 'on the mat. The', 'dog barked|' ], inputToken: '', inputValues: ['', '', '', ''],                    llmActive: false, distId: 0, phase: 'appended " barked" to context' },
    { lines: ['The cat sat', 'on the mat. The', 'dog barked|' ], inputToken: '', inputValues: ['', '', '', ''],                    llmActive: false, distId: 0, phase: 'and again\u2026'                }
  ];

  let idx = 0;
  let iter = 1;
  let timer = null;

  function render() {
    const s = states[idx];
    for (let i = 0; i < lines.length; i++) lines[i].textContent = s.lines[i] || '';
    inputFeedTextEl.textContent = s.inputToken || '';
    const vals = s.inputValues || ['', '', '', ''];
    for (let i = 0; i < inputValueEls.length; i++) {
      inputValueEls[i].textContent = vals[i] || '';
    }
    modelEl.classList.toggle('active', s.llmActive);
    phaseEl.textContent = '\u2014 ' + s.phase;
    iterEl.textContent = iter;
    for (const d of dists) {
      d.classList.toggle('active', parseInt(d.dataset.dist, 10) === s.distId);
    }
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
