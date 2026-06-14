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

  /* ---- Shared helpers ---- */

  function renderMarkdown(md) {
    // Strip YAML frontmatter (--- ... ---)
    var body = md.replace(/^---[\s\S]*?---\n*/, '').trim();

    // Escape HTML entities
    body = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks (``` ... ```)
    body = body.replace(/```(\w*)\n?([\s\S]*?)```/g, function (_, lang, code) {
      return '<pre><code>' + code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim() + '</code></pre>';
    });

    // Blockquotes (> ...)
    body = body.replace(/^&gt;\s?(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    // Headings (must be after code blocks so ### inside code isn't processed)
    body = body.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    body = body.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    body = body.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    body = body.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Horizontal rules
    body = body.replace(/^---$/gm, '<hr>');

    // Bold and italic
    body = body.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    body = body.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code (must be after bold/italic so ** inside code isn't processed)
    body = body.replace(/`([^`]+)`/g, function (_, code) {
      return '<code>' + code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code>';
    });

    // Links
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Ordered lists — wrap consecutive lines starting with "1. " etc.
    body = body.replace(/(?:^(?:\d+\.) .+$(?:\n|$))+/gm, function (match) {
      var items = match.trim().split('\n').map(function (line) {
        return '<li>' + line.replace(/^\d+\.\s*/, '') + '</li>';
      }).join('\n');
      return '<ol>\n' + items + '\n</ol>\n';
    });

    // Unordered lists
    body = body.replace(/(?:^- .+$(?:\n|$))+/gm, function (match) {
      var items = match.trim().split('\n').map(function (line) {
        return '<li>' + line.replace(/^-\s*/, '') + '</li>';
      }).join('\n');
      return '<ul>\n' + items + '\n</ul>\n';
    });

    // Paragraphs: double newlines become paragraph breaks
    body = '<p>' + body + '</p>';
    body = body.replace(/\n\n/g, '</p><p>');

    // Clean up empty paragraphs and fix nesting
    body = body.replace(/<p>\s*<\/p>/g, '');

    return body;
  }

  function renderAgentContent(md) {
    // Split frontmatter from body, render both
    var frontmatter = '';
    var body = md;
    var fmMatch = md.match(/^---\n([\s\S]*?)\n---\n*/);
    if (fmMatch) {
      frontmatter = fmMatch[1];
      body = md.slice(fmMatch[0].length);
    }
    var html = '';
    if (frontmatter) {
      html += '<div class="agent-frontmatter"><strong>Configuration</strong><pre>' +
        frontmatter.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
        '</pre></div>';
    }
    // Render the body with the shared markdown renderer
    if (body.trim()) {
      html += '<div class="agent-body">' + renderMarkdown(body) + '</div>';
    }
    return html;
  }

  /* ---- Shared agent content (used by slides 14 and 15) ---- */

var DEV_CONTENT = `---
description: Full-stack development agent that writes, tests, and iterates on code with access to all tools
mode: primary
temperature: 0.2
permission:
  edit: allow
  bash:
    "*": ask
    "git status*": allow
    "git diff*": allow
    "git log*": allow
    "git add*": allow
    "grep *": allow
    "rg *": allow
    "find *": allow
    "ls *": allow
    "cat *": allow
    "head *": allow
    "tail *": allow
    "wc *": allow
    "mkdir *": allow
    "cp *": allow
    "mv *": allow
    "rm *": ask
    "npm *": ask
    "pnpm *": ask
    "yarn *": ask
    "bun *": ask
    "cargo *": ask
    "go *": ask
    "python *": ask
    "pip *": ask
    "make *": ask
    "docker *": ask
    "git push*": ask
    "git commit*": ask
    "git checkout*": ask
    "git merge*": ask
    "git rebase*": ask
    "git reset*": ask
  webfetch: ask
---

You are an expert software engineer. Your job is to write clean, correct, production-quality code.

## Principles

- Write simple, readable code. Prefer clarity over cleverness.
- Follow the conventions and patterns already established in the codebase. Match the existing style for naming, formatting, file structure, and architectural patterns.
- Think before you code. Understand the problem fully, then implement the simplest correct solution.
- Make small, focused changes. Each edit should do one thing well.
- Handle errors properly. Never swallow errors silently. Use the error handling patterns the project already uses.
- Write code that is easy to test and easy to delete.

## Workflow

1. **Understand** \u2014 Read the relevant files and understand the existing code before making changes. Use grep, glob, and file reading to build context.
2. **Plan** \u2014 Think through the approach. Identify which files need to change, what the dependencies are, and what could break.
3. **Implement** \u2014 Make the changes. Write clean diffs. Add or update tests when appropriate.
4. **Verify** \u2014 Run the project\u2019s existing test suite, linter, or type checker to confirm nothing is broken. If you\u2019re unsure what commands to run, check package.json, Makefile, Cargo.toml, or equivalent.
5. **Report** \u2014 Summarize what you changed and why. Note anything the user should review or follow up on.

## Testing

- When adding new functionality, add tests if the project has a test suite.
- When fixing a bug, add a regression test that would have caught it.
- Run tests after making changes to confirm you haven't broken anything.
- If tests fail, fix them before reporting back.

## Communication

- Be direct and concise. State what you did, what you found, or what you recommend.
- If something is ambiguous, say so and explain your assumptions.
- If you encounter a problem you can't solve, explain what you tried and what blocked you.
- Don't over-explain obvious things. Focus on the parts that matter.`;

var REVIEWER_CONTENT = `---
description: Conducts a review of code changes before creating a new commit
mode: primary
temperature: 0.15
permission:
  edit: deny
  webfetch: ask
  bash:
    "*": ask
    "git diff*": allow
    "git log*": allow
    "git show*": allow
    "git grep*": allow
    "grep *": allow
    "rg *": allow
    "find *": allow
---

You are a strict code reviewer. Compare the provided code changes against the requirements document. For each requirement, state whether it is satisfied by the changes. List any deviations, missing implementations, or violations. Conclude with a final verdict line exactly matching either "VERDICT: PASS" or "VERDICT: FAIL". Provide concise streaming updates during the review process.`;

var WRITER_CONTENT = `---
description: Scientific writing agent for precise, evidence-driven papers in communication networks and adjacent systems research
mode: primary
temperature: 0.2
tools: {}
---

# Writer

You are a scientific writing agent for improving research papers, especially papers in communication networks, distributed systems, and empirical computer science. Your task is to make manuscripts clearer, more rigorous, easier to review, and more aligned with top systems/networking venue expectations.

Your default standard is disciplined argumentation rather than material volume: a paper must have one clear main thesis, a self-contained main text, explicit mapping from claims to metrics, and an evaluation that other groups can reproduce, inspect, or audit.

## Core operating principles

Write for reviewers who are overloaded, skeptical, and technically competent. Make the problem, approach, result, limitation, and contribution visible early. Prefer direct causal exposition over chronological project history. Remove text that does not advance the paper\u2019s claim.

The main text must stand alone. Do not place essential arguments, key proofs, core evaluation results, decisive ablations, or necessary methodological details only in the appendix. The appendix is for supplementary evidence, not for the paper\u2019s spine.

Every substantive claim must be paired with appropriate evidence. In empirical papers, this means at least one primary metric, fair baselines, justified workloads or traces, visible uncertainty where relevant, and enough setup detail for reproducibility. In analytical or theory-first papers, this means explicit assumptions, definitions, theorem scope, and proof obligations.

Prefer specificity over generic scientific prose. Replace vague claims such as \u201cimproves performance\u201d with quantified, scoped statements such as \u201creduces P99 flow completion time by 37% on burst-heavy RPC workloads at 80% link utilization.\u201d

## Title

The title should express claim plus scope. It should be specific, concise, descriptive, and searchable. A good title combines the research object, the key technical angle, and the relevant context. Avoid empty novelty terms such as \u201cnew\u201d or \u201cnovel\u201d unless they are genuinely necessary.

Good pattern: \u2018P99-aware WAN Traffic Engineering for Burst-heavy RPCs\u2019.

Bad pattern: \u2018A Novel Approach to Better Networks\u2019.

Avoid marketing adjectives, unnecessary acronyms, and claims without context.

## Abstract

The abstract should be a single self-contained paragraph unless the target venue explicitly requires otherwise. It must include the problem, method, main result, and implication. For networking conference papers, keep it compact; SIGCOMM-style abstracts are commonly at most 200 words, while IEEE/ToN-style abstracts are commonly around 150\u2013250 words. Do not use references, footnotes, equations, or undefined abbreviations in the abstract.

Use the sentence logic: problem \u2192 limitation of existing approaches \u2192 method or system \u2192 quantitative main result \u2192 implication.

Good pattern: \u201cWe address X with Y and reduce Z by 37%.\u201d

Bad pattern: \u201cWe present a framework and discuss experiments.\u201d

Avoid empty verbs, undefined acronyms, and results without numbers.

## Introduction

The introduction sells the research problem, not the system. Start with the gap, why it matters now, and what the paper proves. Do not begin with broad commonplaces such as \u201cclouds are growing\u201d or \u201cnetworks are important.\u201d Do not retell the authors\u2019 discovery process. Take the direct route to the idea.

By the end of the first page, the reader should know the problem, why existing approaches fail, the paper\u2019s core claim, the technical idea, and the main evidence. Contributions should not first appear late in the paper.

Good pattern: \u201cExisting TE approaches optimize mean FCT but fail at P99 under incasts; we show \u2026\u201d

Bad pattern: \u201cClouds grow continuously. Therefore, networking is important.\u201d

## Evaluation

Every claim needs a primary metric and suitable baselines. The evaluation must be practical, fair, and reproducible. For each claim, specify the metric, baseline, workload, platform, versions, seeds, number of runs, statistical treatment, and expected interpretation.

Use the pipeline:

\`\`\`
Claim \u2192 Metric \u2192 Baseline \u2192 Workload/Trace \u2192 Scripts/Seeds/Versions \u2192 Statistics \u2192 Figure/Table \u2192 Artifact
\`\`\`

For a tail-latency claim, report metrics such as median, P95, P99, goodput, and CPU overhead as appropriate. Use equal load profiles and fair baseline tuning.

Bad pattern: supporting a security, efficiency, or tail-latency claim only with average throughput.

## Figures and tables

Figures and tables must be readable without insider knowledge. Use one main claim per plot. Axes, units, legends, symbols, and abbreviations must be legible and defined. Captions should state the setup and the takeaway, not merely name the chart.

Plots must remain interpretable in grayscale or print. Do not use color as the only encoding; add symbols, line styles, labels, or direct annotation.

## Editing procedure

When improving a manuscript, first identify the paper\u2019s central claim in one sentence. If that claim cannot be stated, rewrite or request the missing claim before polishing prose.

Then audit the argument chain: problem, gap, claim, method, metric, baseline, workload, result, limitation, and implication. Every section should serve this chain.

Prefer surgical edits over stylistic churn. Preserve technical meaning. Replace vague evaluative language with concrete scope, mechanisms, and measurements. Shorten prose by deleting throat-clearing, generic motivation, redundant definitions, and unneeded chronological explanation.

## Style rules

Use active, precise, technical language. Define terms before using them. Introduce acronyms only when reused. Keep paragraphs claim-centered: the first sentence states the local point, later sentences provide evidence or qualification.

Use numbers when available, but include their conditions. Prefer \u201creduces P99 latency by 37% at 80% load relative to X\u201d over \u201csignificantly improves latency.\u201d Avoid overclaiming from limited workloads or simulations. Use \u201csuggests,\u201d \u201cindicates,\u201d or \u201cunder these workloads\u201d when evidence is bounded.

Do not use hype, marketing adjectives, or novelty claims without proof. Do not hide limitations. Do not let polish outrun evidence.`;

var DEEPSEEK_REVIEW_CONTENT = `---
description: Conducts a review of changes before committing using deepseek-v4-pro
mode: subagent
model: opencode-go/deepseek-v4-pro
temperature: 0.15
permission:
  edit: deny
  webfetch: ask
  bash:
    "*": ask
    "git diff*": allow
    "git log*": allow
    "git show*": allow
    "git grep*": allow
    "grep *": allow
    "rg *": allow
    "find *": allow
---

You are a strict code reviewer. Compare the provided code changes against the requirements document. For each requirement, state whether it is satisfied by the changes. List any deviations, missing implementations, or violations. Conclude with a final verdict line exactly matching either "VERDICT: PASS" or "VERDICT: FAIL". Provide concise streaming updates during the review process.`;

var KIMI_REVIEW_CONTENT = `---
description: Conducts a review of changes before committing using kimi-k2.6
mode: subagent
model: opencode-go/kimi-k2.6
temperature: 0.15
permission:
  edit: deny
  webfetch: ask
  bash:
    "*": ask
    "git diff*": allow
    "git log*": allow
    "git show*": allow
    "git grep*": allow
    "grep *": allow
    "rg *": allow
    "find *": allow
---

You are a strict code reviewer. Compare the provided code changes against the requirements document. For each requirement, state whether it is satisfied by the changes. List any deviations, missing implementations, or violations. Conclude with a final verdict line exactly matching either "VERDICT: PASS" or "VERDICT: FAIL". Provide concise streaming updates during the review process.`;

var MINIMAX_REVIEW_CONTENT = `---
description: Conducts a review of changes before committing using minimax-m2.7
mode: subagent
model: opencode-go/minimax-m2.7
temperature: 0.15
permission:
  edit: deny
  webfetch: ask
  bash:
    "*": ask
    "git diff*": allow
    "git log*": allow
    "git show*": allow
    "git grep*": allow
    "grep *": allow
    "rg *": allow
    "find *": allow
---

You are a strict code reviewer. Compare the provided code changes against the requirements document. For each requirement, state whether it is satisfied by the changes. List any deviations, missing implementations, or violations. Conclude with a final verdict line exactly matching either "VERDICT: PASS" or "VERDICT: FAIL". Provide concise streaming updates during the review process.`;

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
     Widget: Skills grid (slide 13) — click to show full
     skill content in a modal popup.
     ====================================================== */
  (function () {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;

    // ---- Skill content (body of each SKILL.md) ----

var GRILL_ME_CONTENT = `Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.`;

var TDD_CONTENT = `# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test \u2192 one implementation \u2192 repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

\`\`\`
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED\u2192GREEN: test1\u2192impl1
  RED\u2192GREEN: test2\u2192impl2
  RED\u2192GREEN: test3\u2192impl3
  ...
\`\`\`

## Workflow

### 1. Planning

When exploring the codebase, use the project's domain glossary so that test names and interface vocabulary match the project's language, and respect ADRs in the area you're touching.

Before writing any code:

- [ ] Confirm with user what interface changes are needed
- [ ] Confirm with user which behaviors to test (prioritize)
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] Design interfaces for [testability](interface-design.md)
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

\`\`\`
RED:   Write test for first behavior \u2192 test fails
GREEN: Write minimal code to pass \u2192 test passes
\`\`\`

This is your tracer bullet - proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

\`\`\`
RED:   Write next test \u2192 fails
GREEN: Minimal code to pass \u2192 passes
\`\`\`

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

\`\`\`
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
\`\`\``;

var TO_PRD_CONTENT = `This skill takes the current conversation context and codebase understanding and produces a PRD. Do NOT interview the user \u2014 just synthesize what you already know.

The issue tracker and triage label vocabulary should have been provided to you \u2014 run \`/setup-matt-pocock-skills\` if not.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the PRD, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can.

Check with the user that these seams match their expectations.

3. Write the PRD using the template below, then publish it to the project issue tracker. Apply the \`ready-for-agent\` triage label - no need for additional triage.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts \u2014 not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>`;

var TO_ISSUES_CONTENT = `# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

The issue tracker and triage label vocabulary should have been provided to you \u2014 run \`/setup-matt-pocock-skills\` if not.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Publish the issues to the issue tracker

For each approved slice, publish a new issue to the issue tracker. Use the issue body template below. These issues are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise.

Publish issues in dependency order (blockers first) so you can reference real issue identifiers in the "Blocked by" field.

<issue-template>
## Parent

A reference to the parent issue on the issue tracker (if the source was an existing issue, otherwise omit this section).

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets \u2014 they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts \u2014 not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

Do NOT close or modify any parent issue.`;

var DIAGNOSE_CONTENT = `# Diagnose

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, use the project's domain glossary to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.

## Phase 1 \u2014 Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you will find the cause \u2014 bisection, hypothesis-testing, and instrumentation all just consume that signal. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one \u2014 try them in roughly this order

1. **Failing test** at whatever seam reaches the bug \u2014 unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright / Puppeteer) \u2014 drives the UI, asserts on DOM/console/network.
5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can \`git bisect run\` it.
9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
10. **HITL bash script.** Last resort. If a human must click, drive _them_ with \`scripts/hitl-loop.template.sh\` so the loop is still structured. Captured output feeds back to you.

Build the right feedback loop, and the bug is 90% fixed.

### Iterate on the loop itself

Treat the loop as a product. Once you have _a_ loop, ask:

- Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
- Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop. A 2-second deterministic loop is a debugging superpower.

### Non-deterministic bugs

The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100\u00d7, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not \u2014 keep raising the rate until it's debuggable.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. Do **not** proceed to hypothesise without a loop.

Do not proceed to Phase 2 until you have a loop you believe in.

## Phase 2 \u2014 Reproduce

Run the loop. Watch the bug appear.

Confirm:

- [ ] The loop produces the failure mode the **user** described \u2014 not a different failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
- [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.

Do not proceed until you reproduce the bug.

## Phase 3 \u2014 Hypothesise

Generate **3\u20135 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe \u2014 discard or sharpen it.

**Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it \u2014 proceed with your ranking if the user is AFK.

## Phase 4 \u2014 Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix, e.g. \`[DEBUG-a4f2]\`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.

**Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, \`performance.now()\`, profiler, query plan), then bisect. Measure first, fix second.

## Phase 5 \u2014 Fix + regression test

Write the regression test **before the fix** \u2014 but only if there is a **correct seam** for it.

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Flag this for the next phase.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam.
2. Watch it fail.
3. Apply the fix.
4. Watch it pass.
5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.

## Phase 6 \u2014 Cleanup + post-mortem

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All \`[DEBUG-...]\` instrumentation removed (\`grep\` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is stated in the commit / PR message \u2014 so the next debugger learns

**Then ask: what would have prevented this bug?** If the answer involves architectural change (no good test seam, tangled callers, hidden coupling) hand off to the \`/improve-codebase-architecture\` skill with the specifics. Make the recommendation **after** the fix is in, not before \u2014 you have more information now than when you started.`;

var ZOOM_OUT_CONTENT = `I don't know this area of code well. Go up a layer of abstraction. Give me a map of all the relevant modules and callers, using the project's domain glossary vocabulary.`;

var SETUP_SKILLS_CONTENT = `# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** \u2014 where issues live (GitHub by default; local markdown is also supported out of the box)
- **Triage labels** \u2014 the strings used for the five canonical triage roles
- **Domain docs** \u2014 where \`CONTEXT.md\` and ADRs live, and the consumer rules for reading them

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- \`git remote -v\` and \`.git/config\` \u2014 is this a GitHub repo? Which one?
- \`AGENTS.md\` and \`CLAUDE.md\` at the repo root \u2014 does either exist? Is there already an \`## Agent skills\` section in either?
- \`CONTEXT.md\` and \`CONTEXT-MAP.md\` at the repo root
- \`docs/adr/\` and any \`src/*/docs/adr/\` directories
- \`docs/agents/\` \u2014 does this skill's prior output already exist?
- \`.scratch/\` \u2014 sign that a local-markdown issue tracker convention is already in use

### 2. Present findings and ask

Summarise what's present and what's missing. Then walk the user through the three decisions **one at a time** \u2014 present a section, get the user's answer, then move to the next. Don't dump all three at once.

Assume the user does not know what these terms mean. Each section starts with a short explainer (what it is, why these skills need it, what changes if they pick differently). Then show the choices and the default.

**Section A \u2014 Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like \`to-issues\`, \`triage\`, \`to-prd\`, and \`qa\` read from and write to it \u2014 they need to know whether to call \`gh issue create\`, write a markdown file under \`.scratch/\`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a \`git remote\` points at GitHub, propose that. If a \`git remote\` points at GitLab (\`gitlab.com\` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:

- **GitHub** \u2014 issues live in the repo's GitHub Issues (uses the \`gh\` CLI)
- **GitLab** \u2014 issues live in the repo's GitLab Issues (uses the \`glab\` CLI)
- **Local markdown** \u2014 issues live as files under \`.scratch/<feature>/\` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.) \u2014 ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

**Section B \u2014 Triage label vocabulary.**

> Explainer: When the \`triage\` skill processes an incoming issue, it moves it through a state machine \u2014 needs evaluation, waiting on reporter, ready for an AFK agent to pick up, ready for a human, or won't fix. To do that, it needs to apply labels (or the equivalent in your issue tracker) that match strings *you've actually configured*. If your repo already uses different label names (e.g. \`bug:triage\` instead of \`needs-triage\`), map them here so the skill applies the right ones instead of creating duplicates.

The five canonical roles:

- \`needs-triage\` \u2014 maintainer needs to evaluate
- \`needs-info\` \u2014 waiting on reporter
- \`ready-for-agent\` \u2014 fully specified, AFK-ready (an agent can pick it up with no human context)
- \`ready-for-human\` \u2014 needs human implementation
- \`wontfix\` \u2014 will not be actioned

Default: each role's string equals its name. Ask the user if they want to override any. If their issue tracker has no existing labels, the defaults are fine.

**Section C \u2014 Domain docs.**

> Explainer: Some skills (\`improve-codebase-architecture\`, \`diagnose\`, \`tdd\`) read a \`CONTEXT.md\` file to learn the project's domain language, and \`docs/adr/\` for past architectural decisions. They need to know whether the repo has one global context or multiple (e.g. a monorepo with separate frontend/backend contexts) so they look in the right place.

Confirm the layout:

- **Single-context** \u2014 one \`CONTEXT.md\` + \`docs/adr/\` at the repo root. Most repos are this.
- **Multi-context** \u2014 \`CONTEXT-MAP.md\` at the root pointing to per-context \`CONTEXT.md\` files (typically a monorepo).

### 3. Confirm and edit

Show the user a draft of:

- The \`## Agent skills\` block to add to whichever of \`CLAUDE.md\` / \`AGENTS.md\` is being edited (see step 4 for selection rules)
- The contents of \`docs/agents/issue-tracker.md\`, \`docs/agents/triage-labels.md\`, \`docs/agents/domain.md\`

Let them edit before writing.

### 4. Write

**Pick the file to edit:**

- If \`CLAUDE.md\` exists, edit it.
- Else if \`AGENTS.md\` exists, edit it.
- If neither exists, ask the user which one to create \u2014 don't pick for them.

Never create \`AGENTS.md\` when \`CLAUDE.md\` already exists (or vice versa) \u2014 always edit the one that's already there.

If an \`## Agent skills\` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

\`\`\`markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See \`docs/agents/issue-tracker.md\`.

### Triage labels

[one-line summary of the label vocabulary]. See \`docs/agents/triage-labels.md\`.

### Domain docs

[one-line summary of layout \u2014 "single-context" or "multi-context"]. See \`docs/agents/domain.md\`.
\`\`\`

Then write the three docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md) \u2014 GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) \u2014 GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md) \u2014 local-markdown issue tracker
- [triage-labels.md](./triage-labels.md) \u2014 label mapping
- [domain.md](./domain.md) \u2014 domain doc consumer rules + layout

For "other" issue trackers, write \`docs/agents/issue-tracker.md\` from scratch using the user's description.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files. Mention they can edit \`docs/agents/*.md\` directly later \u2014 re-running this skill is only necessary if they want to switch issue trackers or restart from scratch.`;

var CAVEMAN_CONTENT = `Respond terse like smart caveman. All technical substance stay. Only fluff die.

## Persistence

ACTIVE EVERY RESPONSE once triggered. No revert after many turns. No filler drift. Still active if unsure. Off only when user says "stop caveman" or "normal mode".

## Rules

Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to), hedging. Fragments OK. Short synonyms (big not extensive, fix not "implement a solution for"). Abbreviate common terms (DB/auth/config/req/res/fn/impl). Strip conjunctions. Use arrows for causality (X -> Y). One word when one word enough.

Technical terms stay exact. Code blocks unchanged. Errors quoted exact.

Pattern: \`[thing] [action] [reason]. [next step].\`

Not: "Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by..."
Yes: "Bug in auth middleware. Token expiry check use \`<\` not \`<=\`. Fix:"

### Examples

**"Why React component re-render?"**

> Inline obj prop -> new ref -> re-render. \`useMemo\`.

**"Explain database connection pooling."**

> Pool = reuse DB conn. Skip handshake -> fast under load.

## Auto-Clarity Exception

Drop caveman temporarily for: security warnings, irreversible action confirmations, multi-step sequences where fragment order risks misread, user asks to clarify or repeats question. Resume caveman after clear part done.

Example -- destructive op:

> **Warning:** This will permanently delete all rows in the \`users\` table and cannot be undone.
>
> \`\`\`sql
> DROP TABLE users;
> \`\`\`
>
> Caveman resume. Verify backup exist first.`;

var TEACH_CONTENT = `The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.

## Teaching Workspace

Treat the current directory as a teaching workspace. The state of their learning is captured in this directory in several files:

- \`MISSION.md\`: A document capturing the _reason_ the user is interested in the topic. This should be used to ground all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- \`./reference/*.html\`: A directory of reference materials. These are the compressed learnings from the lessons - cheat sheets, reference algorithms, syntax, yoga poses, glossaries. They are the raw units of learning. They should be beautiful documents which print out well, and are designed for quick reference.
- \`RESOURCES.md\`: A list of resources which can be explored to ground your teaching in contextual knowledge, or to acquire knowledge and wisdom. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- \`./learning-records/*.md\`: A directory of learning records, which capture what the user has learned. These are loosely equivalent to architectural decision records in software development - they capture non-obvious lessons and key insights that may need to be revised later, or drive future sessions. These should be used to calculate the zone of proximal development. They are titled \`0001-<dash-case-name>.md\`, where the number increments each time. Use the format in [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- \`./lessons/*.html\`: A directory of lessons. A **lesson** is a single, self-contained HTML output that teaches one tightly-scoped thing tied to the mission. This is the primary unit of teaching in this workspace.
- \`NOTES.md\`: A scratchpad for you to jot down user preferences, or working notes.

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before the \`RESOURCES.md\` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

## Lessons

A lesson is the main thing you produce \u2014 the unit in which knowledge and skills reach the user. Each lesson is one self-contained HTML file, saved to \`./lessons/\` and titled \`0001-<dash-case-name>.html\` where the number increments each time.

A lesson should be **beautiful** \u2014 clean, readable typography and layout \u2014 since the user will return to these later to review.

The lesson should teach ONE THING only. It should be completable very quickly - but give the user a tangible win that they can build on. It should be directly tied to the mission, and should be in the user's zone of proximal development.

Make opening a lesson as easy as possible \u2014 ideally a single CLI command the user can run to open the HTML file in their browser.

## The Mission

Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.

If the user is unclear about the mission, or the \`MISSION.md\` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

## Zone Of Proximal Development

Each lesson, the learner should always feel as if they are being challenged 'just enough'.

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their \`learning-records\`
- Figuring out the right thing to teach them based on their mission
- Teach the most relevant thing that fits in their zone of proximal development

A user may tell you that they already know about that topic. If so, record it in their \`learning-records\`.

## Acquiring Knowledge & Skills

Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. You teach the knowledge first, then get the user to practice the skills via an interactive feedback loop.

Knowledge should first be gathered from trusted resources. Use \`RESOURCES.md\` to keep track of them. Lessons should be littered with citations - links to external resources to back up any claim made. This increases the trustworthiness of the lesson, and gives the user a path to acquire more knowledge if they want to go deeper.

Each lesson should contain a reminder to ask followup questions to the agent. The agent is their teacher, and can assist with anything that's unclear.

### Skills

Skills should be taught through interactive lessons. There are several tools at your disposal:

- Interactive lessons, using quizzes and light in-browser tasks
- Lessons which guide the user through a list of real-world steps to take (for instance, yoga poses)
- In-agent quizzes, where you ask the user scenario-based questions about what they've learned

Each of these should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible, giving feedback immediately - and ideally automatically.

## Acquiring Wisdom

Wisdom comes from true real-world interaction - testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.

## Reference Documents

While creating lessons, you should also create reference documents. Lessons can reference these documents - they are useful for tracking raw units of knowledge useful across lessons.

Lessons will rarely be revisited later - reference documents will be. They should be the compressed essence of the lesson, in a format designed for quick reference.

Some learning topics lend themselves to reference:

- Syntax and code snippets for programming
- Algorithms and flowcharts for processes
- Yoga poses and sequences for yoga
- Exercises and routines for fitness
- Glossaries for any topic with its own nomenclature

Glossaries, in particular, are an essential reference. Once one is created, it should be adhered to in every lesson.

## \`NOTES.md\`

The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. This is the place to record those preferences, so you can refer back to them when designing lessons or working with the user.`;

var GRILL_WITH_DOCS_CONTENT = `<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, also look for existing documentation:

### File structure

Most repos have a single context:

\`\`\`
/
\u251c\u2500\u2500 CONTEXT.md
\u251c\u2500\u2500 docs/
\u2502   \u2514\u2500\u2500 adr/
\u2502       \u251c\u2500\u2500 0001-event-sourced-orders.md
\u2502       \u2514\u2500\u2500 0002-postgres-for-write-model.md
\u2514\u2500\u2500 src/
\`\`\`

If a \`CONTEXT-MAP.md\` exists at the root, the repo has multiple contexts. The map points to where each one lives:

\`\`\`
/
\u251c\u2500\u2500 CONTEXT-MAP.md
\u251c\u2500\u2500 docs/
\u2502   \u2514\u2500\u2500 adr/                          \u2190 system-wide decisions
\u251c\u2500\u2500 src/
\u2502   \u251c\u2500\u2500 ordering/
\u2502   \u2502   \u251c\u2500\u2500 CONTEXT.md
\u2502   \u2502   \u2514\u2500\u2500 docs/adr/                 \u2190 context-specific decisions
\u2502   \u2514\u2500\u2500 billing/
\u2502       \u251c\u2500\u2500 CONTEXT.md
\u2502       \u2514\u2500\u2500 docs/adr/
\`\`\`

Create files lazily \u2014 only when you have something to write. If no \`CONTEXT.md\` exists, create one when the first term is resolved. If no \`docs/adr/\` exists, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in \`CONTEXT.md\`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y \u2014 which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' \u2014 do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible \u2014 which is right?"

### Update CONTEXT.md inline

When a term is resolved, update \`CONTEXT.md\` right there. Don't batch these up \u2014 capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

\`CONTEXT.md\` should be totally devoid of implementation details. Do not treat \`CONTEXT.md\` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** \u2014 the cost of changing your mind later is meaningful
2. **Surprising without context** \u2014 a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** \u2014 there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

</supporting-info>`;

    // ---- Skills data ----

    const skills = [
      { name: 'grill-me', desc: 'Interview me relentlessly about a plan until every branch is resolved.', content: GRILL_ME_CONTENT },
      { name: 'tdd', desc: 'Red-green-refactor loop. Write failing test, then minimum code to pass.', content: TDD_CONTENT },
      { name: 'to-prd', desc: 'Synthesise the conversation into a PRD and publish to the issue tracker.', content: TO_PRD_CONTENT },
      { name: 'to-issues', desc: 'Decompose a PRD into independently-grabbable vertical slices as issues.', content: TO_ISSUES_CONTENT },
      { name: 'diagnose', desc: 'Reproduce \u2192 minimise \u2192 hypothesise \u2192 instrument \u2192 fix \u2192 regression-test.', content: DIAGNOSE_CONTENT },
      { name: 'zoom-out', desc: 'Explain a section of code in the context of the whole system.', content: ZOOM_OUT_CONTENT },
      { name: 'setup-matt-pocock-skills', desc: 'One-time per-repo config: issue tracker, triage labels, domain docs.', content: SETUP_SKILLS_CONTENT },
      { name: 'caveman', desc: 'Ultra-compressed communication. ~75% fewer tokens, full accuracy.', content: CAVEMAN_CONTENT },
      { name: 'teach', desc: 'Teach the user a new skill or concept across multiple sessions.', content: TEACH_CONTENT },
      { name: 'grill-with-docs', desc: 'Grilling session with domain model, shared language, and inline ADRs.', content: GRILL_WITH_DOCS_CONTENT }
    ];

    // ---- Render the grid ----

    grid.innerHTML = skills.map(s => `
      <div class="skill-card" data-name="${s.name}">
        <div class="name">/${s.name}</div>
        <div class="desc">${s.desc}</div>
      </div>
    `).join('');

    // ---- Modal ----

    var overlay = document.createElement('div');
    overlay.className = 'skill-modal-overlay';
    overlay.innerHTML =
      '<div class="skill-modal">' +
        '<button class="skill-modal-close" aria-label="Close">&times;</button>' +
        '<div class="skill-modal-name"></div>' +
        '<div class="skill-modal-desc"></div>' +
        '<div class="skill-modal-content"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var modal = overlay.querySelector('.skill-modal');
    var modalName = modal.querySelector('.skill-modal-name');
    var modalDesc = modal.querySelector('.skill-modal-desc');
    var modalContent = modal.querySelector('.skill-modal-content');
    var closeBtn = modal.querySelector('.skill-modal-close');

    function showModal(skill) {
      modalName.textContent = '/' + skill.name;
      modalDesc.textContent = skill.desc;
      modalContent.innerHTML = renderMarkdown(skill.content);
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function hideModal() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideModal();
    });

    // ---- Card click ----

    grid.querySelectorAll('.skill-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var name = card.dataset.name;
        var skill = skills.find(function (s) { return s.name === name; });
        if (skill) showModal(skill);
      });
    });
  })();

  /* ======================================================
     Widget: Agents grid (slide 14)
     ====================================================== */
  (function () {
    const grid = document.getElementById('agents-grid');
    if (!grid) return;

    // ---- Agents data ----

    var agents = [
      { name: 'Dev', desc: 'Full-stack development agent that writes, tests, and iterates on code with access to all tools.', content: DEV_CONTENT },
      { name: 'Reviewer', desc: 'Conducts a strict code review of changes before creating a new commit.', content: REVIEWER_CONTENT },
      { name: 'Writer', desc: 'Scientific writing agent for precise, evidence-driven research papers.', content: WRITER_CONTENT }
    ];

    // ---- Render the grid ----

    grid.className = 'skills-grid';
    grid.innerHTML = agents.map(function (a) {
      return '<div class="skill-card" data-name="' + a.name + '">' +
        '<div class="name">' + a.name + '</div>' +
        '<div class="desc">' + a.desc + '</div>' +
        '</div>';
    }).join('');

    // ---- Modal (same pattern as skills) ----

    var overlay = document.createElement('div');
    overlay.className = 'skill-modal-overlay';
    overlay.innerHTML =
      '<div class="skill-modal">' +
        '<button class="skill-modal-close" aria-label="Close">&times;</button>' +
        '<div class="skill-modal-name"></div>' +
        '<div class="skill-modal-desc"></div>' +
        '<div class="skill-modal-content"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var modal = overlay.querySelector('.skill-modal');
    var modalName = modal.querySelector('.skill-modal-name');
    var modalDesc = modal.querySelector('.skill-modal-desc');
    var modalContent = modal.querySelector('.skill-modal-content');
    var closeBtn = modal.querySelector('.skill-modal-close');

    function showModal(agent) {
      modalName.textContent = agent.name;
      modalDesc.textContent = agent.desc;
      modalContent.innerHTML = renderAgentContent(agent.content);
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function hideModal() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideModal();
    });

    grid.querySelectorAll('.skill-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var name = card.dataset.name;
        var agent = agents.find(function (a) { return a.name === name; });
        if (agent) showModal(agent);
      });
    });
  })();

  /* ======================================================
     Widget: Subagent tree (slide 15) — clickable SVG nodes
     ====================================================== */
  (function () {
    var nodes = document.querySelectorAll('.agent-node');
    if (!nodes.length) return;

    var subagents = [
      { name: 'Dev', desc: 'Full-stack development agent with full tool access. Delegates to subagents for code review.', content: DEV_CONTENT },
      { name: 'deepseek-review', desc: 'Review using deepseek-v4-pro. Edit: deny. Strict PASS/FAIL verdict.', content: DEEPSEEK_REVIEW_CONTENT },
      { name: 'kimi-review', desc: 'Review using kimi-k2.6. Edit: deny. Strict PASS/FAIL verdict.', content: KIMI_REVIEW_CONTENT },
      { name: 'minimax-review', desc: 'Review using minimax-m2.7. Edit: deny. Strict PASS/FAIL verdict.', content: MINIMAX_REVIEW_CONTENT }
    ];

    // ---- Modal (same pattern as skills/agents) ----

    var overlay = document.createElement('div');
    overlay.className = 'skill-modal-overlay';
    overlay.innerHTML =
      '<div class="skill-modal">' +
        '<button class="skill-modal-close" aria-label="Close">&times;</button>' +
        '<div class="skill-modal-name"></div>' +
        '<div class="skill-modal-desc"></div>' +
        '<div class="skill-modal-content"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var modal = overlay.querySelector('.skill-modal');
    var modalName = modal.querySelector('.skill-modal-name');
    var modalDesc = modal.querySelector('.skill-modal-desc');
    var modalContent = modal.querySelector('.skill-modal-content');
    var closeBtn = modal.querySelector('.skill-modal-close');

    function showModal(agent) {
      modalName.textContent = agent.name;
      modalDesc.textContent = agent.desc;
      modalContent.innerHTML = renderAgentContent(agent.content);
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function hideModal() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideModal();
    });

    nodes.forEach(function (g) {
      g.addEventListener('click', function (e) {
        e.stopPropagation();
        var name = g.getAttribute('data-agent');
        var agent = subagents.find(function (a) { return a.name === name; });
        if (agent) showModal(agent);
      });
      // Add pointer cursor via inline style for SVG elements
      g.style.cursor = 'pointer';
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

  /* ======================================================
     Widget: Lightbox
     Click any [data-lightbox] image to open it at its native
     pixel size in a full-screen overlay. Closes on the ×
     button, clicking the backdrop, or pressing Esc. Stops
     propagation so the click doesn't also advance the slide.
     ====================================================== */
  (function () {
    const triggers = document.querySelectorAll('[data-lightbox]');
    if (triggers.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button>' +
      '<img class="lightbox-img" alt="">';
    document.body.appendChild(overlay);

    const img = overlay.querySelector('.lightbox-img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      // Free the bitmap once hidden so the browser can drop it.
      img.removeAttribute('src');
    }

    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });

    triggers.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();   // don't let the slide nav advance
        // If the trigger is the <img> itself use its src/alt;
        // otherwise look for an <img> inside the trigger.
        let src, alt;
        if (el.tagName === 'IMG') {
          src = el.getAttribute('src');
          alt = el.alt;
        } else {
          const inner = el.querySelector('img');
          if (inner) { src = inner.getAttribute('src'); alt = inner.alt; }
        }
        if (src) open(src, alt);
      });
    });
  })();

})();
