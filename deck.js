#!/usr/bin/env node
/* ============================================================
   deck.js
   ------------------------------------------------------------
   A generic tool for building HTML/code-based presentations.

   Subcommands:
     add <NN-name> [--scaffold=<name>]   Create a new slide from a scaffold
     delete <NN-name> [--force]          Remove a slide folder (with confirm)
     clean-prefixes [--dry-run]          Normalize slide prefixes to 01-, 02-, ...
     build [--deck <path>] [--debug]     Build the deck to <output>/index.html
     new <deck-path>                     Create a new deck from the default template

   No npm dependencies. Uses Node built-ins only.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

/* ============================================================
   CLI dispatch
   ============================================================ */

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return;
  }

  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'add':            return cmdAdd(rest);
    case 'delete':         return cmdDelete(rest);
    case 'clean-prefixes': return cmdCleanPrefixes(rest);
    case 'build':          return cmdBuild(rest);
    case 'new':            return cmdNew(rest);
    case 'help':           return printHelp();
    default:
      throw new Error(`Unknown subcommand: ${sub}. Run \`node deck.js help\` for usage.`);
  }
}

function printHelp() {
  console.log(`Usage: node deck.js <subcommand> [args]

Subcommands:
  add <NN-name> [--scaffold=<name>]   Create a new slide from a scaffold
  delete <NN-name> [--force]          Remove a slide folder (with confirm)
  clean-prefixes [--dry-run]          Normalize slide prefixes to 01-, 02-, ...
  build [--deck <path>] [--debug]     Build the deck to <output>/index.html
  new <deck-path>                     Create a new deck from the default template

Run \`node deck.js <subcommand> --help\` for subcommand-specific help.
`);
}

/* ============================================================
   Subcommand: build
   ============================================================ */

// Module-level debug flag. Set by --debug on the build subcommand.
let DEBUG = !!process.env.DECK_DEBUG;

function cmdBuild(args) {
  const { flags, consumed } = parseFlags(args, {
    deck:   { type: 'string' },
    debug:  { type: 'bool' },
    help:   { type: 'bool',  short: 'h' },
  });
  if (flags.debug) DEBUG = true;

  if (flags.help) {
    console.log(`Usage: node deck.js build [--deck <path>] [--debug]

Build the deck to <deck>/<output>/index.html.

  --deck <path>   Deck root directory (defaults to current directory)
  --debug         Print verbose debug output during the build
`);
    return;
  }

  const deckPath = flags.deck
    ? path.resolve(flags.deck)
    : process.cwd();

  const deck = readDeckJson(deckPath);
  validateDeck(deck);

  const templatePath = path.resolve(deckPath, deck.template);
  const themePath    = path.resolve(deckPath, deck.theme);
  const outputPath   = path.resolve(deckPath, deck.output);
  checkOutputSafety(outputPath, deckPath, deck.output);

  assertTemplate(templatePath);
  assertTheme(themePath);

  const slidesDir = path.join(deckPath, 'slides');
  if (!fs.existsSync(slidesDir) || !fs.statSync(slidesDir).isDirectory()) {
    throw new Error(`slides/ directory not found in ${deckPath}`);
  }
  const slideFolders = discoverSlides(slidesDir);

  const sourceMap = buildSourceMap({
    deckPath, slideFolders, slidesDir, templatePath, themePath,
  });

  const processedSlides = slideFolders.map(slide => {
    const slidePath = path.join(slidesDir, slide);
    return processSlide(slidePath, slide, sourceMap);
  });

  const themeCss    = discoverCss(themePath);
  const templateCss = discoverCss(templatePath);
  const templateJs  = discoverJs(templatePath);

  const templateHtml = fs.readFileSync(path.join(templatePath, '_template.html'), 'utf8');
  const outputHtml = substitutePlaceholders(templateHtml, deck, {
    themeCss, templateCss, templateJs,
    slides: processedSlides.join('\n\n'),
  });

  wipeAndRecreate(outputPath);
  copyAllFromMap(sourceMap, outputPath);
  fs.writeFileSync(path.join(outputPath, 'index.html'), outputHtml);

  const sizeKb = (fs.statSync(path.join(outputPath, 'index.html')).size / 1024).toFixed(1);
  const outRel = path.relative(process.cwd(), path.join(outputPath, 'index.html'));
  console.log(`Built ${outRel} (${sizeKb} KB) with ${slideFolders.length} slide(s)`);
}

/* ============================================================
   Subcommand: add
   ============================================================ */

function cmdAdd(args) {
  const { flags, consumed } = parseFlags(args, {
    deck:     { type: 'string' },
    scaffold: { type: 'string', default: 'default' },
    help:     { type: 'bool',   short: 'h' },
  });
  if (flags.help) {
    console.log(`Usage: node deck.js add <NN-name> [--scaffold=<name>] [--deck <path>]

Create a new slide folder under the deck's slides/ directory,
copied from the named scaffold in the deck's template.

  --scaffold=<name>   Scaffold to copy (default: default)
  --deck <path>       Deck root directory (defaults to current directory)

The new slide folder is named <NN-name> (e.g. "03-foo"). Order is
controlled by the folder name's prefix; the build sorts slides
lexicographically. Use clean-prefixes to normalize the prefixes
back to clean 01-, 02-, 03- ordering.
`);
    return;
  }

  const positional = extractPositionals(args, consumed);
  if (positional.length === 0) {
    throw new Error('Missing slide name. Usage: node deck.js add <NN-name>');
  }
  if (positional.length > 1) {
    throw new Error(`Expected one slide name, got ${positional.length}: ${positional.join(', ')}`);
  }
  const slideName = positional[0];

  // Validate slide name: must start with a numeric prefix, and have
  // at least one character after the prefix (no degenerate "03-" names).
  const prefixMatch = slideName.match(/^(\d+(?:\.\d+)?)-(.+)$/);
  if (!prefixMatch) {
    throw new Error(
      `Slide name "${slideName}" must be of the form "NN-name" or "NN.N-name" (e.g. "03-foo" or "22.1-foo").\n` +
      `  The numeric prefix controls order; the rest is the slide's descriptive name.`
    );
  }

  const deckPath = flags.deck ? path.resolve(flags.deck) : process.cwd();
  const deck = readDeckJson(deckPath);
  validateDeck(deck);

  const templatePath = path.resolve(deckPath, deck.template);
  assertTemplate(templatePath);

  const scaffoldPath = path.join(templatePath, 'scaffolds', flags.scaffold);
  if (!fs.existsSync(scaffoldPath) || !fs.statSync(scaffoldPath).isDirectory()) {
    // Try to list available scaffolds in the error message.
    const scaffoldsDir = path.join(templatePath, 'scaffolds');
    let available = [];
    if (fs.existsSync(scaffoldsDir)) {
      available = fs.readdirSync(scaffoldsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    }
    const suffix = available.length > 0
      ? `\n  Available scaffolds: ${available.join(', ')}`
      : `\n  No scaffolds found in ${scaffoldsDir}`;
    throw new Error(`Scaffold "${flags.scaffold}" not found in ${scaffoldsDir}.${suffix}`);
  }

  const slidesDir = path.join(deckPath, 'slides');
  fs.mkdirSync(slidesDir, { recursive: true });

  const targetPath = path.join(slidesDir, slideName);
  if (fs.existsSync(targetPath)) {
    throw new Error(`Slide "${slideName}" already exists at ${targetPath}`);
  }

  copyDir(scaffoldPath, targetPath);
  console.log(`Created slides/${slideName}/ (from scaffold "${flags.scaffold}")`);
}

function cmdDelete(args) {
  const { flags, consumed } = parseFlags(args, {
    deck:  { type: 'string' },
    force: { type: 'bool' },
    help:  { type: 'bool', short: 'h' },
  });
  if (flags.help) {
    console.log(`Usage: node deck.js delete <NN-name> [--force] [--deck <path>]

Remove a slide folder from the deck. By default, prompts for
confirmation before deleting.

  --force           Skip the confirmation prompt
  --deck <path>     Deck root directory (defaults to current directory)
`);
    return;
  }

  const positional = extractPositionals(args, consumed);
  if (positional.length === 0) {
    throw new Error('Missing slide name. Usage: node deck.js delete <NN-name>');
  }
  if (positional.length > 1) {
    throw new Error(`Expected one slide name, got ${positional.length}: ${positional.join(', ')}`);
  }
  const slideName = positional[0];

  const deckPath = flags.deck ? path.resolve(flags.deck) : process.cwd();
  const slidesDir = path.join(deckPath, 'slides');
  const targetPath = path.join(slidesDir, slideName);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Slide "${slideName}" not found at ${targetPath}`);
  }
  if (!fs.statSync(targetPath).isDirectory()) {
    throw new Error(`${targetPath} is not a directory`);
  }

  if (!flags.force) {
    const ok = confirm(`Delete slides/${slideName}/? This cannot be undone. [y/N] `);
    if (!ok) {
      console.log('Cancelled.');
      return;
    }
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  console.log(`Deleted slides/${slideName}/`);
}

function cmdCleanPrefixes(args) {
  const { flags, consumed } = parseFlags(args, {
    deck:   { type: 'string' },
    'dry-run': { type: 'bool' },
    help:  { type: 'bool', short: 'h' },
  });
  if (flags.help) {
    console.log(`Usage: node deck.js clean-prefixes [--dry-run] [--deck <path>]

Normalize the slide folder prefixes to clean 01-, 02-, 03- ...
ordering, in current sort order. Fractional prefixes like
"22.1-foo" become "03-foo" (third in the deck).

By default, renames immediately. Pass --dry-run to print the
proposed renames without applying them.

  --dry-run         Print proposed renames without applying
  --deck <path>     Deck root directory (defaults to current directory)
`);
    return;
  }

  const deckPath = flags.deck ? path.resolve(flags.deck) : process.cwd();
  const slidesDir = path.join(deckPath, 'slides');
  if (!fs.existsSync(slidesDir) || !fs.statSync(slidesDir).isDirectory()) {
    throw new Error(`slides/ directory not found in ${deckPath}`);
  }

  // Only consider directories that look like slides (have an index.html).
  // This prevents accidentally renaming .git, scratch folders, etc.
  const slideFolders = fs.readdirSync(slidesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(slidesDir, e.name, 'index.html')))
    .map((e) => e.name)
    .sort();

  if (slideFolders.length === 0) {
    console.log('No slides to clean.');
    return;
  }

  // Clean up stale .tmp-* dirs from a previous crashed run, so the
  // two-pass rename below doesn't collide with them.
  for (const entry of fs.readdirSync(slidesDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('.tmp-')) {
      try { fs.rmSync(path.join(slidesDir, entry.name), { recursive: true, force: true }); }
      catch (e) { /* ignore */ }
    }
  }

  // Compute the proposed renames: strip existing prefix, assign new
  // sequential prefix based on current sort order.
  const renames = [];
  for (let i = 0; i < slideFolders.length; i++) {
    const oldName = slideFolders[i];
    const stripped = stripPrefix(oldName);
    const newName = pad(i + 1) + '-' + stripped;
    if (newName !== oldName) {
      renames.push({ from: oldName, to: newName });
    }
  }

  if (renames.length === 0) {
    console.log('All prefixes are already clean.');
    return;
  }

  console.log('Proposed renames:');
  for (const r of renames) {
    console.log(`  ${r.from} -> ${r.to}`);
  }

  if (flags['dry-run']) {
    console.log('(--dry-run: no changes applied)');
    return;
  }

  if (!confirm('Apply these renames? [y/N] ')) {
    console.log('Cancelled.');
    return;
  }

  // Apply renames. Use a two-pass approach to avoid name collisions:
  // first rename each folder to a unique temp name, then to the final name.
  const tempNames = renames.map((r, i) => `.tmp-${process.pid}-${i}-${r.from}`);
  for (let i = 0; i < renames.length; i++) {
    const oldPath = path.join(slidesDir, renames[i].from);
    const tempPath = path.join(slidesDir, tempNames[i]);
    fs.renameSync(oldPath, tempPath);
  }
  for (let i = 0; i < renames.length; i++) {
    const tempPath = path.join(slidesDir, tempNames[i]);
    const finalPath = path.join(slidesDir, renames[i].to);
    fs.renameSync(tempPath, finalPath);
  }
  console.log(`Renamed ${renames.length} slide folder(s).`);
}

function cmdNew(args) {
  const { flags, consumed } = parseFlags(args, {
    template: { type: 'string' },
    theme:    { type: 'string' },
    help:     { type: 'bool', short: 'h' },
  });
  if (flags.help) {
    console.log(`Usage: node deck.js new <deck-path> [--template=<path>] [--theme=<path>]

Create a new deck directory. Vendors the default template and
theme into the new deck and writes a starter deck.json.

The default template and theme are read from
  <tool-dir>/templates/default/   and
  <tool-dir>/themes/default/

Override with --template and --theme to vendor a different pair.
`);
    return;
  }

  const positional = extractPositionals(args, consumed);
  if (positional.length === 0) {
    throw new Error('Missing deck path. Usage: node deck.js new <deck-path>');
  }
  if (positional.length > 1) {
    throw new Error(`Expected one deck path, got ${positional.length}: ${positional.join(', ')}`);
  }
  const deckPath = path.resolve(positional[0]);

  if (fs.existsSync(deckPath)) {
    throw new Error(`Deck path ${deckPath} already exists`);
  }

  // Resolve template and theme sources. Defaults are the tool's
  // built-in templates/default/ and themes/default/, located next
  // to deck.js itself.
  const toolDir = __dirname;
  const templateSrc = flags.template
    ? path.resolve(flags.template)
    : path.join(toolDir, 'templates', 'default');
  const themeSrc = flags.theme
    ? path.resolve(flags.theme)
    : path.join(toolDir, 'themes', 'default');

  if (!fs.existsSync(templateSrc) || !fs.statSync(templateSrc).isDirectory()) {
    throw new Error(`Template not found: ${templateSrc}`);
  }
  if (!fs.existsSync(themeSrc) || !fs.statSync(themeSrc).isDirectory()) {
    throw new Error(`Theme not found: ${themeSrc}`);
  }

  fs.mkdirSync(deckPath, { recursive: true });

  // Copy template and theme
  const templateDest = path.join(deckPath, 'template');
  const themeDest    = path.join(deckPath, 'theme');
  copyDir(templateSrc, templateDest);
  copyDir(themeSrc,    themeDest);

  // Empty slides/ and assets/ directories
  fs.mkdirSync(path.join(deckPath, 'slides'), { recursive: true });
  fs.mkdirSync(path.join(deckPath, 'assets'), { recursive: true });

  // Add a .gitkeep to assets/ so the directory survives a fresh checkout
  fs.writeFileSync(path.join(deckPath, 'assets', '.gitkeep'), '');

  // Add a .gitignore so the dist/ build output is never accidentally
  // committed. The author can opt back in by removing the line.
  fs.writeFileSync(
    path.join(deckPath, '.gitignore'),
    [
      '# Build output (uncomment if you want to commit it)',
      'dist/',
      '',
      '# OS / editor cruft',
      '.DS_Store',
      '*.swp',
      '',
    ].join('\n')
  );

  // Compute relative paths from the deck root to the vendored template/theme
  const templateRel = path.relative(deckPath, templateDest);
  const themeRel    = path.relative(deckPath, themeDest);

  // Write deck.json with placeholder values the author can edit
  const deckName = path.basename(deckPath);
  const deckJson = {
    title: deckName,
    author: '',
    description: '',
    template: templateRel || './template',
    theme: themeRel || './theme',
    output: './dist',
  };
  fs.writeFileSync(
    path.join(deckPath, 'deck.json'),
    JSON.stringify(deckJson, null, 2) + '\n'
  );

  console.log(`Created ${deckPath}/`);
  console.log(`  deck.json, slides/, assets/, template/, theme/`);
  // Suggest the next commands. Use the absolute path to deck.js so the
  // hint works whether the tool is invoked by path or on PATH.
  const deckJsPath = process.argv[1] && process.argv[1].endsWith('deck.js')
    ? process.argv[1]
    : path.join(toolDir, 'deck.js');
  console.log(`Next:`);
  console.log(`  cd ${deckPath}`);
  console.log(`  Edit deck.json (title, author, etc.)`);
  console.log(`  node ${deckJsPath} add 01-intro --scaffold=default`);
  console.log(`  node ${deckJsPath} add 02-welcome --scaffold=title`);
  console.log(`  node ${deckJsPath} build`);
}

/* ============================================================
   Lifecycle helpers
   ============================================================ */

function copyDir(src, dest, _visited) {
  // Guard against symlink loops: track real paths we've already entered.
  const visited = _visited || new Set();
  const realSrc = fs.realpathSync(src);
  if (visited.has(realSrc)) return;
  visited.add(realSrc);

  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      // Resolve the symlink to decide whether to recurse or skip.
      const real = fs.realpathSync(s);
      if (visited.has(real)) continue;  // would loop
      if (fs.statSync(real).isDirectory()) {
        copyDir(real, d, visited);
      } else {
        fs.copyFileSync(real, d);
      }
    } else if (entry.isDirectory()) {
      copyDir(s, d, visited);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function pad(n) { return String(n).padStart(2, '0'); }

// Strip the leading "NN-" or "NN.N-" prefix from a slide folder name.
function stripPrefix(name) {
  const m = name.match(/^\d+(?:\.\d+)?-/);
  return m ? name.slice(m[0].length) : name;
}

// Prompt the user for y/n confirmation on a TTY. Returns true if the
// user typed 'y' or 'Y'. Skips the prompt (and returns false) on
// non-interactive stdin so the tool is scriptable. We use a sub-process
// for the actual readline interaction so the parent tool stays sync.
function confirm(question) {
  if (!process.stdin.isTTY) return false;
  try {
    require('child_process').execFileSync(
      process.execPath,
      ['-e', `
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        rl.question(${JSON.stringify(question)}, (answer) => {
          rl.close();
          process.exit(/^[Yy]/.test(answer) ? 0 : 1);
        });
      `],
      { stdio: 'inherit' }
    );
    return true;
  } catch (e) {
    // Non-zero exit (user said no) returns false. Any other error gets
    // logged so the user understands why the prompt didn't appear.
    if (e.status === 1 || e.status === null) {
      // status 1 = user said no; status null = no status, e.g. signal
      return false;
    }
    console.error('[deck.js] confirm() failed: ' + (e.message || e));
    return false;
  }
}

/* ============================================================
   Helpers: flags & manifest
   ============================================================ */

function parseFlags(argv, spec) {
  const out = {};
  const consumed = [];  // indices of argv consumed as flag values
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') break;  // end of options; rest is positional
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const key = eq === -1 ? a.slice(2) : a.slice(2, eq);
      const value = eq === -1 ? null : a.slice(eq + 1);
      const def = spec[key];
      if (!def) throw new Error(`unknown flag --${key}`);
      if (def.type === 'bool') {
        out[key] = true;
        if (value !== null) {
          if (value !== 'true' && value !== 'false') {
            throw new Error(`--${key} does not take a value`);
          }
          out[key] = value === 'true';
        }
      } else {
        if (value !== null) {
          out[key] = value;
        } else {
          if (i + 1 >= argv.length) throw new Error(`--${key} requires a value`);
          out[key] = argv[++i];
          consumed.push(i);
        }
      }
    } else if (a.startsWith('-') && a.length > 1) {
      const short = a.slice(1);
      const longKey = Object.entries(spec).find(([, v]) => v.short === short)?.[0];
      if (!longKey) throw new Error(`unknown flag -${short}`);
      const def = spec[longKey];
      if (def.type === 'bool') {
        out[longKey] = true;
      } else {
        if (i + 1 >= argv.length) throw new Error(`-${short} requires a value`);
        out[longKey] = argv[++i];
        consumed.push(i);
      }
    }
  }
  // Apply defaults from the spec.
  for (const key of Object.keys(spec)) {
    if (!(key in out) && 'default' in spec[key]) {
      out[key] = spec[key].default;
    }
  }
  return { flags: out, consumed };
}

// Pick out the positional (non-flag) args from a command's argv.
// If `--` appears in argv, everything after it is treated as positional
// (per POSIX convention), even if some of those args look like flags.
// Args that were consumed as flag values by parseFlags are excluded.
function extractPositionals(argv, consumed) {
  const dashDash = argv.indexOf('--');
  const consumedSet = consumed ? new Set(consumed) : null;
  const isPositional = (a, i) =>
       !a.startsWith('-')
    && (consumedSet === null || !consumedSet.has(i));
  if (dashDash !== -1) {
    return argv.slice(dashDash + 1);
  }
  return argv.filter(isPositional);
}

function readDeckJson(deckPath) {
  const p = path.join(deckPath, 'deck.json');
  if (!fs.existsSync(p)) {
    throw new Error(`No deck.json found in ${deckPath}. Run \`node deck.js new\` to scaffold a deck.`);
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error(`Failed to parse ${p}: ${e.message}`);
  }
}

function validateDeck(deck) {
  if (typeof deck !== 'object' || deck === null) {
    throw new Error('deck.json must be a JSON object');
  }
  const required = ['title', 'template', 'theme', 'output'];
  for (const f of required) {
    if (typeof deck[f] !== 'string' || !deck[f]) {
      throw new Error(`deck.json: missing or empty required field "${f}"`);
    }
  }
  for (const f of ['author', 'description']) {
    if (f in deck && typeof deck[f] !== 'string') {
      throw new Error(`deck.json: field "${f}" must be a string`);
    }
  }
}

function checkOutputSafety(outputPath, deckPath, rawOutput) {
  // Refuse to build to a filesystem root or to the deck root, or to a
  // directory outside the deck root. The last check matters because the
  // build's first step is `rm -rf` on the output dir -- if the user sets
  // output: "../some-other-project", we'd happily wipe that project.
  const root = path.parse(outputPath).root;
  if (outputPath === root) {
    throw new Error(`Refusing to build: output "${rawOutput}" resolves to filesystem root "${outputPath}". Pick a subdirectory like "./dist".`);
  }
  if (outputPath === deckPath) {
    throw new Error(`Refusing to build: output "${rawOutput}" resolves to the deck root. Pick a subdirectory like "./dist".`);
  }
  // Require the output to be INSIDE the deck root.
  const rel = path.relative(deckPath, outputPath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Refusing to build: output "${rawOutput}" is outside the deck root "${deckPath}". The output must be a subdirectory of the deck.`);
  }
}

function assertTemplate(templatePath) {
  const tpl = path.join(templatePath, '_template.html');
  if (!fs.existsSync(tpl)) {
    throw new Error(`Template _template.html not found in ${templatePath}`);
  }
}
function assertTheme(themePath) {
  if (!fs.existsSync(themePath) || !fs.statSync(themePath).isDirectory()) {
    throw new Error(`Theme directory not found: ${themePath}`);
  }
}

function discoverSlides(slidesDir) {
  return fs.readdirSync(slidesDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(slidesDir, e.name, 'index.html')))
    .map(e => e.name)
    .sort();
}

/* ============================================================
   Source-to-output map
   ============================================================ */

function buildSourceMap({ deckPath, slideFolders, slidesDir, templatePath, themePath }) {
  const map = new Map();

  // Per-slide: copy everything in the slide folder EXCEPT index.html
  // (index.html is the slide's source, not an output) and the usual
  // dotfile / underscore-prefixed excludes that apply to template/theme.
  for (const slide of slideFolders) {
    const slidePath = path.join(slidesDir, slide);
    addDirContents(map, slidePath, '.', posix('assets', slide), {
      excludeNames: ['index.html'],
      excludePrefix: '_',
      excludeDotfiles: true,
    });
  }

  addDirContents(map, templatePath, '.', 'assets/template', {
    excludeNames: ['_template.html', 'scaffolds'],
    excludePrefix: '_',
    excludeDotfiles: true,
  });
  addDirContents(map, themePath, '.', 'assets/theme', {
    excludePrefix: '_',
    excludeDotfiles: true,
  });
  addDirContents(map, deckPath, 'assets', 'assets/brand', {
    excludeDotfiles: true,
  });

  return map;
}

function posix(...parts) {
  return parts.join('/');
}

function addDirContents(map, base, subdir, outputSubdir, opts = {}) {
  const dir = path.join(base, subdir);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (opts.excludeDotfiles && entry.name.startsWith('.')) continue;
    if (opts.excludePrefix && entry.name.startsWith(opts.excludePrefix)) continue;
    if (opts.excludeNames && opts.excludeNames.includes(entry.name)) continue;
    if (opts.excludeDirs && opts.excludeDirs.includes(entry.name)) continue;

    if (entry.isFile()) {
      const src = path.join(dir, entry.name);
      const outputRel = outputSubdir + '/' + entry.name;
      map.set(src, outputRel);
    } else if (entry.isDirectory()) {
      addDirContents(map, dir, entry.name, outputSubdir + '/' + entry.name, opts);
    }
  }
}

/* ============================================================
   CSS / JS discovery for theme and template
   ============================================================ */

function discoverCss(dir) {
  return discoverFilesByExt(dir, '.css', cssSort);
}

function discoverJs(dir) {
  return discoverFilesByExt(dir, '.js', (a, b) => a.localeCompare(b));
}

// Common file discovery: walk `dir` (no recursion) for files matching
// `ext`, filtering out dotfiles and `_`-prefixed files. Sort with the
// given comparator. Returns basenames.
function discoverFilesByExt(dir, ext, comparator) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith(ext))
    .filter(e => !e.name.startsWith('.') && !e.name.startsWith('_'))
    .map(e => e.name)
    .sort(comparator);
}

function cssSort(a, b) {
  if (a === b) return 0;
  if (a === 'tokens.css') return -1;
  if (b === 'tokens.css') return  1;
  if (a === 'print.css')  return  1;
  if (b === 'print.css')  return -1;
  return a.localeCompare(b);
}

/* ============================================================
   Slide processing: extract, rewrite, inject CSS/JS refs
   ============================================================ */

function dbg(...args) {
  if (DEBUG) console.error('[debug]', ...args);
}

function processSlide(slidePath, slideFolder, sourceMap) {
  const html = fs.readFileSync(path.join(slidePath, 'index.html'), 'utf8');
  dbg('processSlide', slideFolder, 'len:', html.length);
  const extracted = extractSection(html);
  if (!extracted) {
    throw new Error(`No <section class="slide"> found in ${slidePath}/index.html`);
  }
  let { section, openEnd, closeStart } = extracted;
  section = rewriteSectionPaths(section, slidePath, slideFolder, sourceMap);
  // After the rewrite, the section's length may have changed (paths
  // get longer). Recalculate closeStart so it points at the actual
  // closing </section> in the rewritten section. The rewrite never
  // introduces new </section> tags, so the last </section> in the
  // rewritten section is the same closing tag from extraction.
  closeStart = section.length - '</section>'.length;
  // openEnd is unaffected: the opening <section ...> tag is unchanged
  // by the rewrite (the rewrite only touches attribute values), so the
  // position right after the opening tag is the same in the rewritten
  // section as in the original.

  // Inject per-slide style.css <link> right after the opening <section ...> tag.
  // Inject per-slide script.js <script> right before the closing </section> tag.
  // The closing position comes from extractSection's depth-counting, so
  // the injection is correct even if the slide body contains the literal
  // string </section> in a <code> or <pre> block.
  // Both insertions are done in a single transformation so the offsets
  // openEnd / closeStart (from the original section) remain valid.
  const hasStyle  = sourceMap.has(path.join(slidePath, 'style.css'));
  const hasScript = sourceMap.has(path.join(slidePath, 'script.js'));
  const linkRef   = hasStyle  ? `\n  <link rel="stylesheet" href="assets/${slideFolder}/style.css">` : '';
  const scriptRef = hasScript ? `\n  <script src="assets/${slideFolder}/script.js" defer></script>` : '';

  return section.slice(0, openEnd)
       + linkRef
       + section.slice(openEnd, closeStart)
       + scriptRef
       + section.slice(closeStart);
}

/* extractSection: find the <section class="slide" ...> block.
   Counts opening and closing <section> tags so nested sections
   don't truncate the result. Returns the section string plus
   the offsets of the opening and closing tags within it, so
   the caller can inject content at the right positions even
   when the body contains literal </section> in text. */
function extractSection(html) {
  const openTagRe = /<section\b[^>]*\bclass\s*=\s*["'][^"']*\bslide\b[^"']*["'][^>]*>/;
  const openMatch = openTagRe.exec(html);
  if (!openMatch) return null;

  const startIdx = openMatch.index;
  const openTagEndInHtml = startIdx + openMatch[0].length;
  let pos = openTagEndInHtml;
  let depth = 1;

  // Match <section followed by space or > (opening), or </section> (closing).
  // Reject false matches like <sectionery> by requiring the char after <section.
  const tagRe = /<section(\s|>)|<\/section>/g;
  tagRe.lastIndex = pos;

  while (depth > 0) {
    const m = tagRe.exec(html);
    if (!m) return null; // unclosed section
    if (m[1] !== undefined) {
      depth++;
    } else {
      depth--;
    }
    pos = tagRe.lastIndex;
  }
  const section = html.slice(startIdx, pos);
  // Offsets within the section string. openEnd is the position just after
  // the opening tag's '>'. closeStart is the position of the closing
  // </section> (so a string slice to closeStart excludes the closing tag).
  return {
    section,
    openEnd: openTagEndInHtml - startIdx,
    closeStart: section.length - '</section>'.length,
  };
}

/* rewriteSectionPaths: rewrite href/src/poster/srcset in the slide's
   section so that every relative path points at the new output location.
   External URLs and data: URIs pass through. */
function rewriteSectionPaths(section, slidePath, slideFolder, sourceMap) {
  // Pattern 1: standard href / src / poster on resource tags.
  // Use (?<=\s) to require whitespace before the attribute name so
  // we don't match data-src / data-href / xlink:href etc.
  // The alternation MUST be wrapped in (?:...) so the \b and the
  // rest of the pattern apply to whatever the alternation matches.
  // Without the non-capturing group, alternation's low precedence
  // would make \b only apply to the LAST alternative, and the
  // earlier alternatives would match just bare literal strings
  // (e.g. `script` would match the word "script" anywhere in the
  // section, even inside a <code> block).
  const ATTRS = 'href|src|poster';
  const TAG   = 'link|script|img|source|video|audio|iframe|embed|object|track|use';
  const re = new RegExp(
    `(<(?:${TAG})\\b[^>]*?(?<=\\s)(?:${ATTRS})\\s*=\\s*["'])([^"']+)(["'])`,
    'gi'
  );
  let result = section.replace(re, (match, prefix, value, suffix) => {
    dbg('href/src/poster match in slide', slideFolder, 'value=', JSON.stringify(value));
    if (isExternalPath(value)) return match;
    return prefix + rewriteValue(value, slidePath, slideFolder, sourceMap) + suffix;
  });

  // Pattern 2: srcset on <img> or <source>. Format is
  // "url1 desc1, url2 desc2, ..." with optional descriptors per URL.
  // NOTE: every \s in the template literal must be \\s so the backslash
  // is preserved (otherwise it gets dropped and the regex matches the
  // literal letter 's' instead of a whitespace class).
  const srcsetRe = new RegExp(
    `(<(?:img|source)\\b[^>]*?(?<=\\s)srcset\\s*=\\s*["'])([^"']+)(["'])`,
    'gi'
  );
  dbg('srcset regex source:', srcsetRe.source);
  dbg('running srcset regex on slide', slideFolder, 'result length:', result.length);
  dbg('result has srcset?', result.includes('srcset'));
  result = result.replace(srcsetRe, (match, prefix, value, suffix) => {
    dbg('srcset matched:', JSON.stringify(value));
    if (value.startsWith('data:')) return match;
    const rewritten = rewriteSrcset(value, slidePath, slideFolder, sourceMap);
    dbg('srcset rewritten:', JSON.stringify(rewritten));
    return prefix + rewritten + suffix;
  });

  return result;
}

function rewriteSrcset(srcset, slidePath, slideFolder, sourceMap) {
  return srcset.split(',').map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    const wsIdx = trimmed.search(/\s/);
    if (wsIdx === -1) {
      // Just a URL, no descriptors.
      if (isExternalPath(trimmed)) return part.trim();
      return rewriteValue(trimmed, slidePath, slideFolder, sourceMap);
    }
    const url = trimmed.slice(0, wsIdx);
    const descriptors = trimmed.slice(wsIdx);
    if (isExternalPath(url)) return part.trim();
    const newUrl = rewriteValue(url, slidePath, slideFolder, sourceMap);
    return newUrl + descriptors;
  }).filter(Boolean).join(', ');
}

function rewriteValue(value, slidePath, slideFolder, sourceMap) {
  // Strip query string and fragment for path resolution, then re-attach.
  const suffixIdx = value.search(/[?#]/);
  const pathPart = suffixIdx === -1 ? value : value.slice(0, suffixIdx);
  const suffix   = suffixIdx === -1 ? ''    : value.slice(suffixIdx);

  if (pathPart === '' || isExternalPath(pathPart)) return value;

  const abs = path.resolve(slidePath, pathPart);
  const outputRel = sourceMap.get(abs);
  if (!outputRel) {
    throw new Error(
      `In slide "${slideFolder}": referenced file not part of deck: ${value}\n` +
      `  Resolved to: ${abs}\n` +
      `  Make sure the file exists and is under slides/<NN>/, template/, theme/, or assets/.`
    );
  }
  return outputRel + suffix;
}

function isExternalPath(p) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(p)) return true; // http:, https:, mailto:, //, etc.
  if (p.startsWith('data:')) return true;
  if (p.startsWith('#')) return true; // in-page anchor
  return false;
}

/* ============================================================
   Template placeholder substitution
   ============================================================ */

function substitutePlaceholders(html, deck, blocks) {
  const registry = {
    'deck.title':       () => escapeHtml(deck.title || ''),
    'deck.author':      () => escapeHtml(deck.author || ''),
    'deck.description': () => escapeHtml(deck.description || ''),
    'theme.css':        () => blocks.themeCss.map(f => `  <link rel="stylesheet" href="assets/theme/${f}">`).join('\n'),
    'template.css':     () => blocks.templateCss.map(f => `  <link rel="stylesheet" href="assets/template/${f}">`).join('\n'),
    'template.js':      () => blocks.templateJs.map(f => `  <script src="assets/template/${f}" defer></script>`).join('\n'),
    'slides':           () => blocks.slides,
  };
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    if (!(key in registry)) {
      throw new Error(`Unknown placeholder in template: {{ ${key} }}`);
    }
    return registry[key]();
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   File ops
   ============================================================ */

function wipeAndRecreate(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyAllFromMap(sourceMap, outputPath) {
  for (const [src, rel] of sourceMap) {
    const dest = path.join(outputPath, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

/* ============================================================
   Run
   ============================================================ */

try {
  main();
} catch (e) {
  console.error('Error: ' + e.message);
  if (process.env.DECK_DEBUG) console.error(e.stack);
  process.exit(1);
}
