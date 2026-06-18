/* ============================================================
   Use case 3: Slide generation with deck.js
   Builds the exercise cards into #exercise-grid-slides. The
   shared exercise-grid widget (in template/widgets.js) wires
   up click handlers and the modal after this script runs.
   ============================================================ */
(function () {
  const grid = document.getElementById('exercise-grid-slides');
  if (!grid) return;

  const exercises = [
    {
      skill: 'Plain prompt',
      title: '\u201cMake me a 10-slide deck explaining Monte Carlo simulations.\u201d',
      teaser: 'One HTML file, inline CSS, no claims, no navigation.',
      content: [
        '#### Prompt',
        '> Make me a 10-slide deck explaining Monte Carlo simulations.',
        '',
        '#### What you get',
        'A single HTML file. Inline CSS. Default browser fonts. No claim-style titles, no design tokens, no section dividers, no TOC, no navigation. Generic content. Probably 600 lines of inline styles.',
        '',
        '#### Pitfall',
        'The agent has no idea deck.js exists, has never read `DESIGN.md`, doesn\u2019t know about the `slides/<NN-name>/` convention or the `node deck.js add --scaffold=...` workflow. You get a one-shot artifact you cannot incrementally edit, rebuild, or version-control.'
      ].join('\n')
    },
    {
      skill: '/grill-me',
      title: 'Plan the arc before any slide is written. Don\u2019t write HTML yet.',
      teaser: 'Every title is a claim, not a label.',
      content: [
        '#### Prompt',
        '> Use /grill-me to plan the deck. Don\u2019t write HTML yet.',
        '',
        '#### What changes',
        'The agent questions the order (which claim comes first?), the title-as-claim rule (no \u201cIntroduction\u201d or \u201cResults\u201d &mdash; every title is a sentence), the one-idea-per-slide rule, the assumption that the audience varies in expertise. You end up with an outline of N claims, each defensible, each ownable.',
        '',
        '#### Fixes',
        'Failure mode #1 &mdash; *the agent didn\u2019t do what I want.* Slide decks fail the same way papers do: vague arc, doc-dump, not a talk.'
      ].join('\n')
    },
    {
      skill: 'Read DESIGN.md + /grill-with-docs',
      title: 'Learn the visual language, then build a deck CONTEXT.md.',
      teaser: 'The agent stops inventing new CSS and uses the scaffolds.',
      content: [
        '#### Prompt',
        '> Read DESIGN.md and the three most recent slides in slides/. Then use /grill-with-docs to add the deck\u2019s domain to its CONTEXT.md &mdash; scaffolds, claim-title rule, theme tokens.',
        '',
        '#### What changes',
        'The agent uses the existing scaffold (`node deck.js add --scaffold=default|section|title|picture`), the theme tokens (`--jmu-blue`, `--fg-muted`), the claim-title convention, the section-label convention. It writes a small `CONTEXT.md` for the deck that future agents read on the next pass. Output: individual slide folders, each buildable, each replaceable.',
        '',
        '#### Fixes',
        'Failure mode #2 &mdash; *the agent is way too verbose* (and way too design-noisy). Also dodges the \u201cevery agent invents its own visual language\u201d trap.'
      ].join('\n')
    },
    {
      skill: '/to-prd + /to-issues',
      title: 'Break the deck into per-slide issues, in dependency order.',
      teaser: 'Each slide is a vertical slice &mdash; build them in any order.',
      content: [
        '#### Prompt',
        '> /to-prd for the deck. /to-issues to break it into per-slide slices, one per folder, in dependency order.',
        '',
        '#### What changes',
        'Each slide is an issue with explicit acceptance criteria (claim title present, `data-section` set, build passes, no tiny fonts). You or subagents build them in any order, each in its own folder, each rebuildable. The deck is an *aggregate*, not a monolith. You can swap slide 14 without touching the rest.',
        '',
        '#### Fixes',
        'Failure mode #4 &mdash; *we built a ball of mud.* A monolithic HTML file is the slide-deck equivalent of `src/index.js` containing all your business logic.'
      ].join('\n')
    }
  ];

  grid.innerHTML = exercises.map((e, i) =>
    '<div class="exercise-card" data-skill="' + e.skill + '" data-content="' + e.content.replace(/"/g, '&quot;') + '">' +
      '<div class="exercise-num">' + (i + 1) + '</div>' +
      '<div class="exercise-info">' +
        '<div class="exercise-skill">' + e.skill + '</div>' +
        '<div class="exercise-title">' + e.title + '</div>' +
        '<div class="exercise-teaser">' + e.teaser + '</div>' +
      '</div>' +
      '<div class="exercise-arrow">&rarr;</div>' +
    '</div>'
  ).join('');
})();
