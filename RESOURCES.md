# Agentic Coding Resources

## Knowledge

- [OpenCode docs — Intro](https://opencode.ai/docs)
  The canonical opencode user guide. Use for: install commands, `/init`,
  `/undo`, plan mode (Tab key), `@`-fuzzy file search, `/share`. Most of
  the hands-on commands in the lesson come straight from here.

- [OpenCode — Agent Skills](https://opencode.ai/docs/skills/)
  How opencode discovers and loads skill manifests. Use for: the
  file-naming convention (`SKILL.md`), the `~/.config/opencode/skills/`
  and `.opencode/skills/` locations, and the YAML frontmatter format
  (`name`, `description`).

- [OpenCode — Agents](https://opencode.ai/docs/agents/)
  How to configure subagents in `opencode.json` / `opencode.jsonc`. Use
  for: the difference between the primary agent and a subagent, the
  `mode: primary | subagent` field, and the system-prompt override
  pattern.

- [OpenCode — TUI](https://opencode.ai/docs/tui/)
  Terminal UI keybinds and visual reference. Use for: Tab (plan ↔ build),
  Shift+Tab (cycle agents), `@` (file fuzzy search), `/` (command
  palette), `?` (help).

- [mattpocock/skills — repository README](https://github.com/mattpocock/skills)
  The canonical Matt Pocock skills collection (engineering + productivity
  + misc). Use for: the four-failure-mode framing, the skill list, the
  `npx skills@latest add mattpocock/skills` installer, and the
  `/setup-matt-pocock-skills` first-run flow.

- [mattpocock/skills — grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md)
  The non-code grilling skill. Use for: how a "grill me" loop is
  structured (one question at a time, recommended answer, accept/reject),
  and the underlying assumption that "no-one knows exactly what they
  want."

- [mattpocock/skills — tdd](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md)
  The TDD red-green-refactor skill. Use for: the exact red-green-refactor
  loop the agent must follow, what "good test" guidance is given to the
  model, and the stop condition.

- [mattpocock/skills — to-prd](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-prd/SKILL.md)
  The PRD-from-context skill. Use for: the quiz about which modules are
  touched, the shared-language update to `CONTEXT.md`, and the ADR
  capture for hard-to-explain decisions.

- [mattpocock/skills — to-issues](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md)
  The plan-into-issues skill. Use for: vertical-slice decomposition
  (tracer-bullet slices), per-issue acceptance criteria, and the
  dependency ordering.

- [Skills directory — mattpocock/skills on skills.sh](https://skills.sh/mattpocock/skills)
  The aggregator view: install counts, last-updated, and discovery of
  related skills from other authors. Use for: the broader ecosystem
  context, and to show students where to look next.

- [skills.sh — install guide](https://skills.sh)
  The "single command to install" pattern. Use for: the universal
  `npx skills@latest add <owner/repo>` syntax, and the 20+ supported
  agents (opencode, Claude Code, Codex, Cursor, Copilot, Windsurf, …).

- Anthropic — [Building effective agents](https://www.anthropic.com/research/building-effective-agents)
  The original "workflows vs agents" framing. Use for: defining what
  "agentic" actually means (the model dynamically directs its own
  process and tool use), and the difference between a workflow
  (predefined code path) and an agent (model-controlled loop).

- OpenAI — [A practical guide to building agents](https://cdn.openai.com/business-guides-and-tools/a-practical-guide-to-building-agents.pdf)
  The companion guide from the other end of the industry. Use for: the
  "context engineering" framing, and the four core design patterns
  (reflection, tool use, planning, multi-agent).

- [The Pragmatic Programmer — David Thomas & Andrew Hunt](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)
  Quoted by mattpocock/skills as the philosophical bedrock. Use for:
  "no-one knows exactly what they want" (the misalignment problem) and
  "the rate of feedback is your speed limit" (the TDD rationale).

- [Domain-Driven Design — Eric Evans](https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
  Quoted by mattpocock/skills for the "ubiquitous language" rationale.
  Use for: the `CONTEXT.md` pattern (shared language between humans and
  agent reduces verbosity and token use).

- [A Philosophy of Software Design — John Ousterhout](https://www.amazon.co.uk/Philosophy-Software-Design-2nd/dp/173210221X)
  Quoted by mattpocock/skills for the "deep modules" argument. Use for:
  why agent-generated codebases rot fast without deliberate design
  investment.

## Wisdom (Communities)

- [OpenCode Discord](https://opencode.ai/discord)
  Project's own community. Use for: troubleshooting, feature requests,
  talking to the opencode maintainers.

- [mattpocock/skills — Discussions](https://github.com/mattpocock/skills/discussions)
  Where the skills authors and consumers talk. Use for: asking "why does
  this skill exist," sharing forks, proposing new skills.

- [AI Hero newsletter — Matt Pocock](https://www.aihero.dev)
  The newsletter linked from the skills repo. Use for: tracking
  upstream changes to the skill collection and the broader "real
  engineering with agents" argument.

- [r/LocalLLaMA](https://reddit.com/r/LocalLLaMA)
  The high-signal subreddit for self-hosted models. Use for: the model
  side of the model-vs-harness distinction (when you want to swap which
  brain your opencode talks to).

## Gaps

- No canonical, up-to-date reference for the "Ralph loop" pattern as
  implemented against opencode. The pattern is well-known in
  Claude-Code circles (an outer loop picks the next open issue, an
  inner agent solves it, repeat until empty) but the canonical repo
  (`ghuntley/ralph`) targets Claude Code specifically. The lesson
  describes the pattern abstractly and lets students adapt it.
