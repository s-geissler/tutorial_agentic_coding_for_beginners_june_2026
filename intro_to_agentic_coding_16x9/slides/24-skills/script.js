/* ============================================================
   Skills grid (slide 24)
   Build the .skill-card elements into #skills-grid. The
   shared skills-grid widget (in template/widgets.js) wires
   up click handlers and the modal after this script runs
   (defer order: per-slide script.js first, then template.js).
   ============================================================ */
(function () {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  const GRILL_ME_CONTENT = `Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.`;

  const TDD_CONTENT = `# Test-Driven Development

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

  const TO_PRD_CONTENT = `This skill takes the current conversation context and codebase understanding and produces a PRD. Do NOT interview the user \u2014 just synthesize what you already know.

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

  const TO_ISSUES_CONTENT = `# To Issues

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

  const DIAGNOSE_CONTENT = `# Diagnose

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

## Phase 2 \u2014 Reproduce & minimise

Make the failure repeatable, then make the input that triggers it as small as possible. Bisect inputs, fixtures, seeds, request sizes \u2014 anything that narrows the search space. Don't reason about the bug until you can trigger it on demand.

## Phase 3 \u2014 Hypothesise

Write down 2\u20133 candidate root causes as **falsifiable** statements.

Each hypothesis must predict what you'd observe if it were true: a specific log line, an off-by-one in some boundary, a state that should or shouldn't be present at a specific point.

Each hypothesis must be **falsifiable**: state the prediction it makes.

If you cannot state the prediction, the hypothesis is a vibe \u2014 discard or sharpen it.

## Phase 4 \u2014 Probe

Design probes that distinguish the hypotheses. Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Good probes: print a value at the boundary, add an assertion that fails under one hypothesis, swap two inputs and observe, add a counter that should not increment under one hypothesis.

## Phase 5 \u2014 Fix &amp; regression-test

Apply the minimum change that the evidence supports. The first time the failing-loop now passes, you're done. Stop.

Then **lock it in**: add a regression test that exercises this exact failure mode, so the same bug can't come back unnoticed. The regression test goes through the same feedback loop you built in Phase 1 \u2014 it should fail on the pre-fix code and pass on the post-fix code.`;

  const ZOOM_OUT_CONTENT = `I don't know this area of code well. Go up a layer of abstraction. Give me a map of all the relevant modules and callers, using the project's domain glossary vocabulary.`;

  const SETUP_SKILLS_CONTENT = `# Setup Matt Pocock's Skills

This skill configures the engineering skills for a specific repository. Run it once per repo. It writes a small block to \`AGENTS.md\` (or equivalent) that the other skills read to know where to put things.

## What it configures

- The **issue tracker** (GitHub Issues / Linear / local markdown / none)
- The **triage label vocabulary** (e.g. \`bug\`, \`enhancement\`, \`chore\`)
- The **domain docs** location (e.g. \`docs/\`)

## Process

### 1. Ask the three questions

Ask the user, one at a time:

- Which issue tracker do you use?
- Which triage labels do you want to standardise on?
- Where should domain docs live?

### 2. Write the configuration

Append a short \`## Agent skills\` block to \`AGENTS.md\` (or \`CLAUDE.md\` if that's the convention) with the answers. The other skills read this block to know where to publish issues, what labels to apply, and where to write \`CONTEXT.md\` / ADRs.

\`\`\`markdown
## Agent skills

- **Issue tracker**: github | linear | local | none
- **Triage labels**: bug, enhancement, chore
- **Domain docs**: docs/
\`\`\`

### 3. Confirm

Show the user the appended block and confirm it's correct. They can edit the labels / paths later in \`AGENTS.md\` without re-running this skill.`;

  const CAVEMAN_CONTENT = `Respond terse like smart caveman. All technical substance stay. Only fluff die.

Drop filler, articles, pleasantries. Keep full technical accuracy. Use when token cost matter or user want fast answer.

## Rules

- Cut: "the", "a", "an" when grammar survive.
- Cut: "I think", "I would say", "perhaps", "just", "really", "very", "quite", "actually", "basically", "essentially", "in order to", "due to the fact that", "at this point in time".
- Cut: apologies, hedging, throat-clearing, "Let me...", "Sure!", "Great question!"
- Keep: code, numbers, file paths, error messages, commands, technical terms, named concepts.
- Keep: markdown structure (headings, lists, code blocks) when it aid scanning.
- Compress: \`in order to\` \u2192 \`to\`, \`due to the fact that\` \u2192 \`because\`, \`a large number of\` \u2192 \`many\`.
- Don't mangle: variable names, file paths, error text, code blocks. Those are load-bearing.

## Example

Input: "I think that perhaps we should probably just go ahead and try to refactor this function so that it's a little bit more readable."

Output: "Refactor function for readability."

## Token savings

Typically ~75% fewer tokens for prose-heavy responses. Code-heavy responses save less because code itself is dense.`;

  const TEACH_CONTENT = `The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.

## Core principles

You are a teacher, not just an answerer. The goal is the user's long-term understanding, not just answering the current question.

- **Build on what they already know.** Ask about background before launching in.
- **Prefer the smallest accurate model over the most complete one.** A 70%-accurate sketch the user can refine beats a 100%-accurate model they can't hold in their head.
- **Test understanding with a small task at the end of each session.** Don't move on until they can do something concrete with what was just covered.
- **Track the curriculum across sessions.** A \`NOTES.md\` (in the workspace root or wherever the user prefers) records what they've covered, what they're shaky on, and what's next.

## Structure of a teaching session

1. **Frame the lesson** \u2014 one or two sentences on what they'll be able to do after this session.
2. **Anchor in prior knowledge** \u2014 connect to something they already know.
3. **Introduce the smallest model that works** \u2014 the simplest accurate picture.
4. **Walk through an example** \u2014 a worked problem, not a finished answer.
5. **Test with a small task** \u2014 something they can do in 5\u201315 minutes.
6. **Update \`NOTES.md\`** \u2014 what was covered, what's shaky, what to cover next.

## Skills

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

  const GRILL_WITH_DOCS_CONTENT = `<what-to-do>

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

  grid.className = 'skills-grid';
  grid.innerHTML = skills.map((s) =>
    `<div class="skill-card" data-name="${s.name}" data-content="${s.content.replace(/"/g, '&quot;')}">` +
      `<div class="name">/${s.name}</div>` +
      `<div class="desc">${s.desc}</div>` +
    `</div>`
  ).join('');
})();
