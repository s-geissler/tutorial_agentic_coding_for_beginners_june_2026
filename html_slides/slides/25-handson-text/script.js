/* ============================================================
   Use case 2: Text generation for scientific papers
   Builds the exercise cards into #exercise-grid-text. The
   shared exercise-grid widget (in template/widgets.js) wires
   up click handlers and the modal after this script runs.
   ============================================================ */
(function () {
  const grid = document.getElementById('exercise-grid-text');
  if (!grid) return;

  const exercises = [
    {
      skill: 'Plain prompt',
      title: '\u201cOutline a measurement study on sustainability in data center networks.\u201d',
      teaser: 'A plausible structure built on fiction.',
      content: [
        '#### Prompt',
        '> Write me a paper outline for a measurement study on sustainability aspects in data center networks.',
        '',
        '#### What you get',
        'A generic outline with invented datasets, plausible-sounding but non-existent measurement setups, and inconsistent terminology &mdash; \u201cenergy efficiency\u201d, \u201cpower consumption\u201d, and \u201ccarbon footprint\u201d used interchangeably across sections. The structure reads like a real paper plan; the substance is fiction.',
        '',
        '#### Pitfall',
        'Agents optimise for fluent structure, not for what\u2019s actually measurable. This is the most dangerous mode in scientific work &mdash; the outline *reads* like a real study, so it gets trusted.'
      ].join('\n')
    },
    {
      skill: '/grill-me',
      title: 'Interview me about the measurement target. Don\u2019t outline yet.',
      teaser: 'A measurement study without a sharp target is a survey.',
      content: [
        '#### Prompt',
        '> Use /grill-me to plan this measurement study. Don\u2019t write the outline yet.',
        '',
        '#### What changes',
        'The agent interviews you about: what exactly is being measured (power? cooling? traffic-induced load?), at what granularity (switch port? rack? pod?), what\u2019s the novelty vs prior measurement studies, what datasets or testbeds you actually have access to, and what is *not* in scope.',
        '',
        '#### Fixes',
        'Failure mode #1 &mdash; *the agent didn\u2019t do what I want.* A measurement study without a sharp measurement target is a survey, not a study. The grill forces you to commit.'
      ].join('\n')
    },
    {
      skill: '/grill-with-docs',
      title: 'Build the paper\u2019s domain model before drafting the outline.',
      teaser: 'CONTEXT.md locks in terminology; ADRs capture methodology choices.',
      content: [
        '#### Prompt',
        '> Use /grill-with-docs to set up the paper\u2019s domain model before we draft the outline.',
        '',
        '#### What changes',
        'The agent creates `CONTEXT.md` &mdash; a glossary locking in terms (*data center network*, *leaf-spine*, *PUE*, *DVFS*, *energy-proportional computing*, *hot/cold aisle*). It files ADRs for methodology decisions (\u201cwhy we measure at the switch port level, not the rack level\u201d). It challenges you whenever a section uses a fuzzy term. \u201cSustainability\u201d stops meaning three different things in three sections.',
        '',
        '#### Fixes',
        'Failure mode #2 &mdash; *the agent is way too verbose* &mdash; and terminological drift. The outline becomes internally consistent; every section speaks the same language.'
      ].join('\n')
    },
    {
      skill: '/to-prd + /to-issues',
      title: 'Break the outline into per-section issues, in dependency order.',
      teaser: 'Draft sections in any order; hand one to a subagent.',
      content: [
        '#### Prompt',
        '> /to-prd for the paper, then /to-issues to break the outline into per-section tasks. Each issue is one section.',
        '',
        '#### What changes',
        'Introduction, related work, measurement methodology, results, discussion each become an independently-grabbable issue with explicit acceptance criteria (\u201cdefines metric X before using it\u201d, \u201creports sample size N\u201d, \u201ccites [Y]\u201d). You draft them in any order. You can hand a section to a subagent.',
        '',
        '#### Fixes',
        'Failure mode #4 &mdash; *we built a ball of mud.* No more single top-to-bottom outline that loses coherence after the methodology section.'
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
