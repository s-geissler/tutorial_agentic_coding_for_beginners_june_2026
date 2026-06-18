/* ============================================================
   Use case 1: Code generation
   Builds the exercise cards into #exercise-grid-code. The
   shared exercise-grid widget (in template/widgets.js) wires
   up click handlers and the modal after this script runs.
   ============================================================ */
(function () {
  const grid = document.getElementById('exercise-grid-code');
  if (!grid) return;

  const exercises = [
    {
      skill: 'Plain prompt',
      title: '\u201cWrite a Python function to parse a CSV file.\u201d',
      teaser: 'Looks right, breaks on real input.',
      content: [
        '#### Prompt',
        '> Write a Python function to parse a CSV file.',
        '',
        '#### What you get',
        'A function that looks right. No tests, no discussion of edge cases &mdash; quoting, escaped newlines, BOM, empty fields, non-UTF-8. No error model. The agent is confident.',
        '',
        '#### Pitfall',
        'You adopt the first answer because it *looks* correct. Failure mode #1 &mdash; *the agent didn\u2019t do what I want* &mdash; is hidden behind a plausible surface.'
      ].join('\n')
    },
    {
      skill: '/grill-me',
      title: 'Interview me about the parser, then implement.',
      teaser: '20 minutes of questions, 5 minutes of code.',
      content: [
        '#### Prompt',
        '> Before writing any code, use /grill-me to interview me about the parser. Then implement.',
        '',
        '#### What changes',
        'The agent asks about encoding, delimiter, quoting, malformed rows, error policy, return shape, performance. The implementation is anchored to those answers.',
        '',
        '#### Fixes',
        'Failure mode #1 &mdash; *the agent didn\u2019t do what I want.* The grill surfaces the unstated assumptions you didn\u2019t know you were making.'
      ].join('\n')
    },
    {
      skill: '/tdd',
      title: 'Add the next behaviour with red-green-refactor.',
      teaser: 'Failing test first, minimum code to pass, repeat.',
      content: [
        '#### Prompt',
        '> Use /tdd to add the next behaviour: an empty input returns an empty list.',
        '',
        '#### What changes',
        'Failing test first (RED), minimum code to pass (GREEN), refactor (REFACTOR). One vertical slice at a time. Each cycle is seconds, not minutes.',
        '',
        '#### Fixes',
        'Failure mode #3 &mdash; *the code doesn\u2019t work.* The agent now *sees* the tests go red, which constrains its next guess. No more flying blind.'
      ].join('\n')
    },
    {
      skill: '/to-prd + /to-issues',
      title: 'Plan a streaming variant as a PRD, then break into issues.',
      teaser: 'Each issue is a tracer bullet &mdash; a complete path through every layer.',
      content: [
        '#### Prompt',
        '> We have a CSV parser. Now plan a streaming variant for files larger than memory. /to-prd first, then /to-issues.',
        '',
        '#### What changes',
        'The conversation becomes a PRD: problem, solution, user stories, implementation decisions, testing decisions, out of scope. The PRD is then sliced into independently-grabbable vertical issues on the tracker.',
        '',
        '#### Fixes',
        'Failure mode #4 &mdash; *we built a ball of mud.* Also dodges the most common agentic trap: shipping the whole feature in one unreviewable PR.'
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
