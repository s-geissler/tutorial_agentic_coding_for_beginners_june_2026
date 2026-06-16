/* ============================================================
   Subagent tree (slide 15)
   Wires click handlers onto the .agent-node SVG groups and
   opens a modal with the agent's full instructions. The
   modal pattern is borrowed from the shared skills-grid
   widget (created lazily on first click).
   ============================================================ */
(function () {
  const nodes = document.querySelectorAll('.agent-node');
  if (!nodes.length) return;

  // Tiny markdown renderer (matches the legacy / shared widget).
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function renderAgentContent(md) {
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n*/);
    let html = '';
    if (fmMatch) {
      const fm = fmMatch[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<div class="agent-frontmatter"><strong>Configuration</strong><pre>' + fm + '</pre></div>';
      md = md.slice(fmMatch[0].length);
    }
    if (md.trim()) {
      let body = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) =>
          '<pre><code>' + code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim() + '</code></pre>'
        )
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
        .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
        .replace(/^# (.+)$/gm,    '<h2>$1</h2>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>')
        .replace(/`([^`]+)`/g, (_, c) =>
          '<code>' + c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code>'
        )
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/(?:^(?:\d+\.) .+$(?:\n|$))+/gm, (m) => {
          const items = m.trim().split('\n').map((l) => '<li>' + l.replace(/^\d+\.\s*/, '') + '</li>').join('\n');
          return '<ol>\n' + items + '\n</ol>\n';
        })
        .replace(/(?:^- .+$(?:\n|$))+/gm, (m) => {
          const items = m.trim().split('\n').map((l) => '<li>' + l.replace(/^-\s*/, '') + '</li>').join('\n');
          return '<ul>\n' + items + '\n</ul>\n';
        });
      body = '<p>' + body + '</p>'.replace(/\n\n/g, '</p><p>').replace(/<p>\s*<\/p>/g, '');
      html += '<div class="agent-body">' + body + '</div>';
    }
    return html;
  }

  const DEV_CONTENT = `---
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
4. **Verify** \u2014 Run the project's existing test suite, linter, or type checker to confirm nothing is broken. If you're unsure what commands to run, check package.json, Makefile, Cargo.toml, or equivalent.
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

  const DEEPSEEK_REVIEW_CONTENT = `---
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

  const KIMI_REVIEW_CONTENT = `---
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

  const MINIMAX_REVIEW_CONTENT = `---
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

  const subagents = [
    { name: 'Dev', desc: 'Full-stack development agent with full tool access. Delegates to subagents for code review.', content: DEV_CONTENT },
    { name: 'deepseek-review', desc: 'Review using deepseek-v4-pro. Edit: deny. Strict PASS/FAIL verdict.', content: DEEPSEEK_REVIEW_CONTENT },
    { name: 'kimi-review', desc: 'Review using kimi-k2.6. Edit: deny. Strict PASS/FAIL verdict.', content: KIMI_REVIEW_CONTENT },
    { name: 'minimax-review', desc: 'Review using minimax-m2.7. Edit: deny. Strict PASS/FAIL verdict.', content: MINIMAX_REVIEW_CONTENT }
  ];

  // Build the modal lazily on first click
  let overlay = null;
  function ensureModal() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'skill-modal-overlay';
    overlay.innerHTML =
      '<div class="skill-modal">' +
        '<button class="skill-modal-close" aria-label="Close">&times;</button>' +
        '<div class="skill-modal-name"></div>' +
        '<div class="skill-modal-desc"></div>' +
        '<div class="skill-modal-content"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    const modal       = overlay.querySelector('.skill-modal');
    const nameEl      = overlay.querySelector('.skill-modal-name');
    const descEl      = overlay.querySelector('.skill-modal-desc');
    const contentEl   = overlay.querySelector('.skill-modal-content');
    const closeBtn    = overlay.querySelector('.skill-modal-close');
    overlay._refs = { modal, nameEl, descEl, contentEl, closeBtn };

    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) hideModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideModal();
    });
    return overlay;
  }

  function showModal(agent) {
    const ov = ensureModal();
    const { nameEl, descEl, contentEl } = ov._refs;
    nameEl.textContent = agent.name;
    descEl.textContent = agent.desc;
    contentEl.innerHTML = renderAgentContent(agent.content);
    ov.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function hideModal() {
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  nodes.forEach((g) => {
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = g.getAttribute('data-agent');
      const agent = subagents.find((a) => a.name === name);
      if (agent) showModal(agent);
    });
  });
})();
