/* ============================================================================
   build.mjs — compiles the content tree into one self-contained HTML file.

   Every equation is converted to inline SVG at build time by mathjax-full, so
   the published page makes no network requests for math: no CDN script, no web
   font, no flash of unstyled TeX. Fonts for prose come from Google Fonts (the
   one host the artifact CSP admits) with a real fallback stack.
   ========================================================================= */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const ROOT = dirname(fileURLToPath(import.meta.url));

/* This build emits more than one page from one engine and one design system.
   Each entry names its content entry point, its output file, and which scene
   files it needs, so neither page ships the other's scene code. */
const DOCS = {
  atlas: {
    content: './content/index.js',
    out: 'index.html',
    tag: 'Physics 143a &middot; Lecture 1',
    scenes: (f) => /^(00-hero|1[1-7])/.test(f)
  },
  math: {
    content: './content/math/index.js',
    out: 'math.html',
    tag: 'Physics 143a &middot; Math toolkit',
    scenes: (f) => /^m[0-9]/.test(f)
  },
  pre2: {
    content: './content/pre2/_probe.js',
    out: 'probe.html',
    tag: 'Physics 143a &middot; Pre-lecture notes 2',
    scenes: (f) => /^p[0-9]/.test(f)
  }
};

const DOC_NAME = process.argv[2] || 'atlas';
const DOC = DOCS[DOC_NAME];
if (!DOC) {
  console.error('\nUnknown document "' + DOC_NAME + '". Known: ' + Object.keys(DOCS).join(', ') + '\n');
  process.exit(1);
}

if (!existsSync(join(ROOT, ...DOC.content.replace('./', '').split('/')))) {
  console.error(
    '\nMissing ' + DOC.content + '\n\n' +
    'The prose, equation source, exercise statements and worked solutions for this\n' +
    'site are course material from a handout marked "Unauthorized posting or\n' +
    'distribution outside Harvard prohibited", so content/ is deliberately kept out\n' +
    'of this repository. This repo ships the build system, the scroll engine and the\n' +
    'scene code only. See README.md.\n'
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ math -- */

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const svgOut = new SVG({ fontCache: 'local', exFactor: 0.5 });
const texIn = new TeX({
  packages: AllPackages,
  macros: {
    unit: ['\\,\\mathrm{#1}', 1],
    dd: ['\\mathrm{d}'],
    half: ['\\tfrac{1}{2}']
  }
});
const mjDoc = mathjax.document('', { InputJax: texIn, OutputJax: svgOut });

let mathCount = 0;
const mathCache = new Map();

/* MathJax's local font cache names its glyph paths MJX-<n>-... where <n> is a
   per-conversion counter. Reusing a cached rendering verbatim would therefore
   put the same ids in the document twice, and a <use href="#id"> resolves to
   whichever came first -- glyphs would silently swap between equations. So every
   insertion gets its own id namespace, cached or not. */
let idSeq = 0;
function reNamespace(html) {
  const n = ++idSeq;
  return html.replace(/MJX-\d+-/g, 'MJX-' + n + 'i-');
}

function tex(src, display) {
  const key = (display ? 'D' : 'I') + ' ' + src;
  if (mathCache.has(key)) { mathCount++; return reNamespace(mathCache.get(key)); }
  let html;
  try {
    const node = mjDoc.convert(src, { display: !!display, em: 17, ex: 8.5, containerWidth: 800 });
    html = adaptor.outerHTML(node);
  } catch (err) {
    throw new Error('TeX failed for ' + (display ? 'display' : 'inline') + ' "' + src + '": ' + err.message);
  }
  if (/merror/.test(html)) {
    throw new Error('TeX error in ' + (display ? 'display' : 'inline') + ' "' + src + '"');
  }
  mathCount++;
  mathCache.set(key, html);
  return reNamespace(html);
}

/* Inline $...$ inside prose. A literal dollar is written \$. */
function inlineMath(str) {
  if (str.indexOf('$') === -1) return str;
  let out = '', i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '\\' && str[i + 1] === '$') { out += '$'; i += 2; continue; }
    if (ch === '$') {
      let j = i + 1, buf = '';
      while (j < str.length) {
        if (str[j] === '\\' && str[j + 1] === '$') { buf += '\\$'; j += 2; continue; }
        if (str[j] === '$') break;
        buf += str[j]; j++;
      }
      if (j >= str.length) throw new Error('Unclosed $ in: ' + str.slice(0, 90));
      out += tex(buf, false);
      i = j + 1;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

/* ---------------------------------------------------------------- render -- */

/* esc() is for fields that are plain text, not markup. An HTML entity written
   in one of those fields would be escaped and rendered literally ("&ouml;"), and
   in a rail label read back via textContent it would be visible to the reader,
   so refuse it at build time rather than shipping it. */
const esc = (s) => {
  const str = String(s);
  const ent = str.match(/&[a-zA-Z]+;|&#[0-9]+;/);
  if (ent) {
    console.error('\nHTML entity "' + ent[0] + '" in a plain-text field: ' +
                  JSON.stringify(str.slice(0, 80)) +
                  '\nUse the character itself here; entities only work in fields that take markup.\n');
    process.exit(1);
  }
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
const attr = (s) => esc(s).replace(/"/g, '&quot;');

const usedScenes = new Set();
let revealSeq = 0;

function reveal(delay) {
  revealSeq++;
  return ' data-reveal' + (delay ? ' style="--reveal-delay:' + delay + 'ms"' : '');
}

function blocks(list, ctx) {
  return list.map((b) => block(b, ctx)).join('\n');
}

function block(b, ctx = {}) {
  switch (b.t) {
    case 'p':
      return '<p class="' + (b.cls || '') + '"' + (b.reveal === false ? '' : reveal()) + '>' +
             inlineMath(b.html) + '</p>';

    case 'lede':
      return '<p class="lede"' + reveal() + '>' + inlineMath(b.html) + '</p>';

    case 'h':
      return '<h3' + reveal() + '>' + inlineMath(b.text) + '</h3>';

    case 'h4':
      return '<h4' + reveal() + '>' + inlineMath(b.text) + '</h4>';

    case 'kicker':
      return '<span class="kicker ' + (b.tone ? 'kicker--' + b.tone : '') + '"' + reveal() + '>' +
             esc(b.text) + '</span>';

    case 'rule':
      return '<hr class="rule">';

    case 'eq': {
      const cls = ['eq'];
      if (b.hero) cls.push('eq--hero');
      if (b.tone === 'quantum') cls.push('eq--quantum');
      const num = b.num
        ? '<div class="eq__num">(' + esc(b.num) + ')</div>'
        : '<div class="eq__num"></div>';
      const cap = b.caption ? '<div class="eq__caption">' + inlineMath(b.caption) + '</div>' : '';
      const id = b.num ? ' id="eq-' + attr(b.num) + '"' : '';
      return '<div class="' + cls.join(' ') + '"' + id + reveal() + '>' +
             '<div class="eq__body">' + tex(b.tex, true) + '</div>' + num + cap + '</div>';
    }

    case 'steps': {
      const title = b.title ? '<div class="steps__title">' + esc(b.title) + '</div>' : '';
      const items = b.items.map((s) => {
        const tone = s.tone ? ' data-tone="' + attr(s.tone) + '"' : '';
        const claim = '<div class="step__claim">' + inlineMath(s.claim) + '</div>';
        const math = s.tex ? '<div class="step__math">' + tex(s.tex, true) + '</div>' : '';
        const why = s.why ? '<div class="step__why">' + inlineMath(s.why) + '</div>' : '';
        return '<div class="step"' + tone + reveal() + '>' + claim + math + why + '</div>';
      }).join('');
      return '<div class="steps">' + title + items + '</div>';
    }

    case 'callout': {
      const kind = b.kind || 'question';
      const defaults = { question: 'Question', exercise: 'Exercise', remark: 'Remark', warning: 'Where this breaks' };
      const tag = b.tag || defaults[kind];
      const body = blocks(b.blocks, ctx);
      const ans = b.answer
        ? '<details class="answer"><summary>' + esc(b.answerLabel || 'Answer') + '</summary>' +
          '<div class="answer__body">' + blocks(b.answer, ctx) + '</div></details>'
        : '';
      return '<aside class="callout callout--' + attr(kind) + '"' + reveal() + '>' +
             '<span class="callout__tag">' + esc(tag) + '</span>' +
             '<div class="callout__body">' + body + ans + '</div></aside>';
    }

    case 'problem': {
      /* A problem with staged reveals: try it, then a nudge, then the method,
         then the whole thing. Each stage is its own <details> so nothing is
         spoiled by opening the one above it. */
      const tag = '<div class="problem__tag"><span>Problem ' + esc(b.n) + '</span>' +
        (b.unlocks ? '<span class="problem__unlocks">unlocks ' + esc(b.unlocks) + '</span>' : '') +
        '</div>';
      const ask = '<div class="problem__ask">' + blocks(b.ask, ctx) + '</div>';
      const stage = (label, list) => list && list.length
        ? '<details><summary>' + esc(label) + '</summary>' +
          '<div class="problem__body">' + blocks(list, ctx) + '</div></details>'
        : '';
      return '<div class="problem"' + reveal() + '>' + tag + ask +
             stage('Hint', b.hint) +
             stage('Method', b.method) +
             stage('Full solution', b.solution) + '</div>';
    }

    case 'fig': {
      usedScenes.add(b.scene);
      /* Width is set by the wrapper the section chooses, not by the figure, so a
         breakout figure can never be wider than the column that holds it. */
      const ar = b.ratio ? ' style="aspect-ratio:' + attr(b.ratio) + '"' : '';
      return '<figure class="fig"' + reveal() + '>' +
             '<div class="fig__frame"' + ar + '><div data-scene="' + attr(b.scene) + '" class="scene-host"></div></div>' +
             '<figcaption>' +
             (b.num ? '<span class="figcaption__num">Figure ' + esc(b.num) + '</span> &middot; ' : '') +
             inlineMath(b.caption) + '</figcaption></figure>';
    }

    case 'table': {
      const head = '<tr>' + b.head.map((h) => '<th>' + inlineMath(h) + '</th>').join('') + '</tr>';
      const rows = b.rows.map((r) =>
        '<tr>' + r.map((c, i) =>
          '<td class="' + (b.numeric && b.numeric.indexOf(i) !== -1 ? 'num' : '') + '">' +
          inlineMath(String(c)) + '</td>').join('') + '</tr>'
      ).join('');
      return '<div class="table-wrap"' + reveal() + '><table><thead>' + head +
             '</thead><tbody>' + rows + '</tbody></table></div>';
    }

    case 'raw':
      return b.html;

    default:
      throw new Error('Unknown block type: ' + JSON.stringify(b.t));
  }
}

/* A stage: sticky visual, prose panels riding past it. */
function stage(s) {
  usedScenes.add(s.scene);
  const panels = s.panels.map((p) =>
    '<div class="stage__panel"' + reveal() + '>' + blocks(p, {}) + '</div>'
  ).join('');
  const hud = s.hud ? '<div class="stage__hud">' + esc(s.hud) + '</div>' : '';
  return '<section class="stage ' + (s.split ? 'stage--split' : '') + '">' +
         '<div class="stage__pin"><div class="stage__canvas">' +
         '<div data-scene="' + attr(s.scene) + '" class="scene-host"></div></div>' + hud + '</div>' +
         '<div class="stage__scroll"><div class="stage__panels">' + panels + '</div></div>' +
         '</section>';
}

function section(sec) {
  const head =
    '<header class="section-head measure"' + reveal() + '>' +
    '<span class="kicker">' + esc(sec.kicker || ('§ ' + sec.number)) + '</span>' +
    '<h2>' + inlineMath(sec.title) + '</h2>' +
    (sec.standfirst ? '<p class="lede">' + inlineMath(sec.standfirst) + '</p>' : '') +
    '</header>';

  const body = sec.body.map((item) => {
    if (item.t === 'stage') return stage(item);
    if (item.t === 'wide') return '<div class="wide">' + blocks(item.blocks, {}) + '</div>';
    if (item.t === 'fig') {
      return '<div class="' + (item.wide ? 'wide' : 'breakout') + '">' + block(item, {}) + '</div>';
    }
    return '<div class="measure">' + block(item, {}) + '</div>';
  }).join('\n');

  return '<section class="band" id="' + attr(sec.id) + '" data-section="' +
         attr(sec.label || sec.number) + '">' + head + body + '</section>';
}

/* ------------------------------------------------------------- assemble -- */

const { default: doc } = await import(DOC.content);

const sceneFiles = readdirSync(join(ROOT, 'src', 'scenes'))
  .filter((f) => f.endsWith('.js'))
  .filter((f) => DOC.scenes(f))
  .sort();
/* Parse every scene file on its own before concatenating them. A syntax error
   in one file otherwise takes down the whole inlined bundle at runtime, and the
   only symptom is that no scene mounts. The classic cause is a block comment
   containing a "*" followed by a "/", as in a derivative written d(psi-star)/dx,
   which closes the comment early. */
for (const f of sceneFiles) {
  try {
    execFileSync(process.execPath, ['--check', join(ROOT, 'src', 'scenes', f)], { stdio: 'pipe' });
  } catch (err) {
    console.error('\nsrc/scenes/' + f + ' does not parse:\n' +
                  String(err.stderr || err.message).trim() + '\n');
    process.exit(1);
  }
}

const sceneSrc = sceneFiles
  .map((f) => '/* --- scenes/' + f + ' --- */\n' + readFileSync(join(ROOT, 'src', 'scenes', f), 'utf8'))
  .join('\n');

const engineSrc = ['math.js', 'svg.js', 'field.js', 'scroll.js']
  .map((f) => '/* --- engine/' + f + ' --- */\n' + readFileSync(join(ROOT, 'src', 'engine', f), 'utf8'))
  .join('\n');

/* ------------------------------------------------- assert the mathematics -- */
/* field.js computes divergence and curl by finite differences, and the sandbox
   prints those numbers to a reader learning what the operators mean. Check them
   against fields whose answers are known in closed form, so an error in the
   stencil fails the build instead of teaching the wrong thing. */

function assertFieldMath() {
  const sandbox = { window: {} };
  const src = readFileSync(join(ROOT, 'src', 'engine', 'field.js'), 'utf8');
  new Function('window', src)(sandbox.window);
  const F = sandbox.window.A.field;

  const near = (got, want, tol, what) => {
    if (!(Math.abs(got - want) < (tol || 1e-4))) {
      console.error('\nfield.js is wrong: ' + what +
                    '\n  expected ' + want + ', got ' + got + '\n');
      process.exit(1);
    }
  };

  const pts = [[0.7, -1.3], [-2.1, 0.4], [1.5, 2.2]];
  let checked = 0;
  for (const f of F.catalogue) {
    if (!f.known) continue;
    for (const [x, y] of pts) {
      near(F.div(f.fn, x, y), f.known.div, 1e-4, 'div of ' + f.id + ' at (' + x + ',' + y + ')');
      near(F.curlZ(f.fn, x, y), f.known.curl, 1e-4, 'curl of ' + f.id + ' at (' + x + ',' + y + ')');
      checked += 2;
    }
  }

  /* The free vortex circles the origin and yet has zero curl away from it —
     the single most counter-intuitive claim the page makes, so check it. */
  const fv = F.byId('freevortex').fn;
  for (const [x, y] of pts) {
    near(F.curlZ(fv, x, y), 0, 1e-5, 'curl of the free vortex at (' + x + ',' + y + ')');
    near(F.div(fv, x, y), 0, 1e-5, 'div of the free vortex at (' + x + ',' + y + ')');
    checked += 2;
  }

  /* curl of a gradient vanishes for any scalar field. */
  const g = (x, y) => Math.sin(1.3 * x) * Math.exp(-0.2 * y * y) + 0.4 * x * y;
  const gradOf = (x, y) => F.grad(g, x, y, 1e-3);
  for (const [x, y] of pts) {
    near(F.curlZ(gradOf, x, y, 1e-3), 0, 1e-3, 'curl of a gradient at (' + x + ',' + y + ')');
    checked += 1;
  }

  /* div of a plane wave polarised across its direction of travel is zero:
     the transversality step of §1.1. */
  const pw = F.byId('planewaveE').fn;
  for (const [x, y] of pts) {
    near(F.div(pw, x, y), 0, 1e-6, 'div of the transverse plane wave at (' + x + ',' + y + ')');
    checked += 1;
  }

  /* Circulation per unit area converges on the curl, and flux per unit area on
     the divergence — the definitions the pictures are built from. */
  const vor = F.byId('vortex').fn, rad = F.byId('radial').fn;
  for (const s of [0.2, 0.05]) {
    near(F.circulation(vor, 1.0, -0.5, s) / (4 * s * s), 2, 2e-2, 'circulation/area -> curl at s=' + s);
    near(F.flux(rad, 1.0, -0.5, s) / (4 * s * s), 2, 2e-2, 'flux/area -> div at s=' + s);
    checked += 2;
  }

  return checked;
}

const fieldChecks = assertFieldMath();

const css = readFileSync(join(ROOT, 'src', 'style.css'), 'utf8');
const mjCss = adaptor.textContent(svgOut.styleSheet(mjDoc));

const heroHTML = doc.hero();
const sectionsHTML = doc.sections.map(section).join('\n');
const colophonHTML = doc.colophon();

/* Guard: every scene referenced anywhere in the page must exist in src/scenes.
   Read the ids back out of the rendered markup so hand-written HTML (the hero)
   is covered too, not just content blocks. */
const registered = new Set([...sceneSrc.matchAll(/A\.scene\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
const pageHTML = heroHTML + sectionsHTML + colophonHTML;
[...pageHTML.matchAll(/data-scene="([^"]+)"/g)].forEach((m) => usedScenes.add(m[1]));
const missing = [...usedScenes].filter((id) => !registered.has(id));
const unused = [...registered].filter((id) => !usedScenes.has(id));
if (missing.length) {
  console.error('\nContent references scenes that are not implemented:\n  ' + missing.join('\n  ') + '\n');
  process.exit(1);
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;1,400' +
              '&family=IBM+Plex+Mono:wght@400;500&display=swap';

const html = '<title>' + esc(doc.title) + '</title>\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link rel="stylesheet" href="' + FONTS + '">\n' +
'<style>\n' + css + '\n/* MathJax SVG output stylesheet, emitted at build time. */\n' + mjCss + '\n</style>\n\n' +
'<div class="toolbar">\n' +
'  <span>' + DOC.tag + '</span>\n' +
'  <span class="toolbar__spacer"></span>\n' +
'  <span class="toolbar__now"></span>\n' +
'  <button class="theme-toggle" type="button">Light</button>\n' +
'</div>\n\n' +
'<nav class="rail" aria-hidden="true">\n' +
'  <span class="rail__label"></span>\n' +
'  <div class="rail__track"><div class="rail__fill"></div></div>\n' +
'  <span class="rail__pct">0%</span>\n' +
'</nav>\n\n' +
'<main class="page">\n' + heroHTML + '\n' + sectionsHTML + '\n</main>\n\n' +
colophonHTML + '\n\n' +
'<script>\n' + engineSrc + '\n' + sceneSrc + '\n<' + '/script>\n';

if (!existsSync(join(ROOT, 'dist'))) mkdirSync(join(ROOT, 'dist'));
writeFileSync(join(ROOT, 'dist', DOC.out), html);

/* Duplicate-id guard: MathJax's local font cache mints ids per conversion; if
   two equations ever shared one, glyphs would silently swap. */
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
if (dupes.length) {
  console.error('\nDuplicate element ids in output: ' + [...new Set(dupes)].slice(0, 8).join(', ') + '\n');
  process.exit(1);
}

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log('built dist/' + DOC.out + '  ' + kb + ' KB   (' + DOC_NAME + ', ' +
            sceneFiles.length + ' scene files)');
console.log('  field-math assertions passed: ' + fieldChecks);
console.log('  sections ' + doc.sections.length + '   scenes ' + usedScenes.size +
            '   equations ' + mathCount + '   reveals ' + revealSeq);
if (unused.length) console.log('  note: scenes implemented but unused: ' + unused.join(', '));
