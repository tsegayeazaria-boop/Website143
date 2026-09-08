/* ============================================================================
   verify.mjs — drives the built page in a real browser and proves the claims
   the plan makes about it: no console errors, no external requests, every
   scene mounts and reaches the end of its scroll range, and nothing overflows
   sideways at any of three viewport widths.
   ========================================================================= */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

/* Which page to drive: `node verify.mjs` for the atlas, `node verify.mjs math`
   for the maths companion. Matches build.mjs's document names. */
const DOCS = { atlas: 'index.html', math: 'math.html', pre2: 'pre2.html' };
const DOC_NAME = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'atlas';
const OUT = DOCS[DOC_NAME];
if (!OUT) {
  console.error('Unknown document "' + DOC_NAME + '". Known: ' + Object.keys(DOCS).join(', '));
  process.exit(1);
}

const PAGE = 'file://' + join(ROOT, 'dist', OUT);
const SHOTS = join(ROOT, '.verify', DOC_NAME);
const EXEC = '/opt/pw-browsers/chromium';

/* Google Fonts is a legitimate external request and the only one allowed. */
const ALLOWED = [/^file:/, /^data:/, /^https:\/\/fonts\.googleapis\.com/, /^https:\/\/fonts\.gstatic\.com/];

const args = process.argv.slice(2);
const shotsOnly = args.includes('--shots');

if (!existsSync(join(ROOT, 'dist', OUT))) {
  console.error('dist/' + OUT + ' not found — run `node build.mjs ' + DOC_NAME + '` first.');
  process.exit(1);
}
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const failures = [];
const fail = (msg) => { failures.push(msg); console.log('  FAIL  ' + msg); };
const pass = (msg) => console.log('  ok    ' + msg);

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });

/* ------------------------------------------------- 1. main scroll sweep -- */

/* Runs inside the page. Returns one entry per label currently outside its
   viewBox, with a stable key so repeated sightings across the sweep collapse. */
function scanClipped() {
  const out = [];
  document.querySelectorAll('svg[viewBox]').forEach((sv) => {
    /* Only the hand-authored scene figures. MathJax lays out in ex-units against
       its own baseline, so its geometry is not comparable; missing glyphs are
       checked separately. */
    if (sv.closest('mjx-container')) return;
    const vb = sv.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    sv.querySelectorAll('text').forEach((el) => {
      let bb;
      try { bb = el.getBBox(); } catch (e) { return; }
      if (!bb.width) return;
      /* Still parked at its mount position, to be placed by the first update. */
      if (bb.y < 0 && bb.y > -14 && Math.abs(bb.y + bb.height) < 6) return;
      if (bb.x < -2 || bb.x + bb.width > vb[2] + 2 ||
          bb.y < -2 || bb.y + bb.height > vb[3] + 2) {
        const label = (sv.getAttribute('aria-label') || '?').slice(0, 20);
        const text = el.textContent.slice(0, 34);
        out.push({
          key: label + '|' + text,
          msg: label + ' | "' + text + '" | x ' + Math.round(bb.x) + '..' +
               Math.round(bb.x + bb.width) + '/' + vb[2] + ' y ' + Math.round(bb.y) +
               '..' + Math.round(bb.y + bb.height) + '/' + vb[3]
        });
      }
    });
  });
  return out;
}

async function sweep(theme) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: theme === 'light' ? 'light' : 'dark'
  });
  const page = await ctx.newPage();

  const errors = [];
  const external = new Set();
  const blocked = new Set();
  /* This sandbox cannot reach fonts.googleapis.com, so the stylesheet request
     fails here and the page falls back to Georgia / ui-monospace. That is a
     property of the sandbox, not of the page, so it is reported and not failed. */
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/i.test(m.text())) return;
    errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => blocked.add(r.url().slice(0, 60)));
  page.on('request', (r) => {
    const u = r.url();
    if (!ALLOWED.some((re) => re.test(u))) external.add(u);
  });

  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForSelector('[data-atlas-ready="1"]', { timeout: 20000 });

  const total = await page.evaluate(() => document.querySelectorAll('[data-scene]').length);
  console.log('\n[' + DOC_NAME + '/' + theme + '] ' + total + ' scenes, sweeping...');

  /* Step the whole document in viewport-sized increments, letting each frame
     settle so scroll-driven scenes actually run their update path. */
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = 900;
  const stepPx = Math.round(vh * 0.45);
  const steps = Math.ceil(height / stepPx);
  /* Scene labels are rebuilt on every frame, so a label can sit inside its
     viewBox at the end of the sweep and hang outside it halfway through. The
     scan therefore runs at every scroll step and unions what it finds, rather
     than taking one reading once the page has settled. */
  const clippedSeen = new Map();
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * stepPx);
    await page.waitForTimeout(28);
    for (const c of await page.evaluate(scanClipped)) {
      if (!clippedSeen.has(c.key)) clippedSeen.set(c.key, c.msg);
    }
  }

  const report = await page.evaluate(() => {
    const list = window.__atlasScenes || [];
    return {
      mounted: list.length,
      unreached: list.filter((m) => m.maxP < 0.98).map((m) => m.id + ' (' + m.maxP.toFixed(2) + ')'),
      errored: list.filter((m) => m.errored).map((m) => m.id),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (errors.length) fail('[' + theme + '] console errors:\n        ' + errors.slice(0, 12).join('\n        '));
  else pass('[' + theme + '] no console errors');

  if (external.size) fail('[' + theme + '] unexpected external requests: ' + [...external].join(', '));
  else pass('[' + theme + '] no unexpected external requests');

  if (report.mounted !== total) fail('[' + theme + '] mounted ' + report.mounted + ' of ' + total + ' scenes');
  else pass('[' + theme + '] all ' + total + ' scenes mounted');

  if (report.errored.length) fail('[' + theme + '] scenes threw during update: ' + report.errored.join(', '));
  else pass('[' + theme + '] no scene threw during update');

  if (report.unreached.length) fail('[' + theme + '] scenes never reached full progress: ' + report.unreached.join(', '));
  else pass('[' + theme + '] every scene reached the end of its range');

  if (report.overflow > 1) fail('[' + theme + '] horizontal overflow of ' + report.overflow + 'px at 1440');
  else pass('[' + theme + '] no horizontal overflow at 1440');

  /* Text that spills outside its own viewBox is silently clipped by the SVG
     viewport — no error, no visual cue, the label simply is not there. This scan
     caught thirteen real cases while the atlas was being built, so it runs every
     time, and it runs at every scroll step (see the sweep above) because a label
     can be inside the box at rest and outside it mid-animation. */
  const clipped = [...clippedSeen.values()];
  if (clipped.length) {
    fail('[' + theme + '] ' + clipped.length + ' SVG label(s) clipped by their viewBox:\n        ' +
         clipped.slice(0, 10).join('\n        '));
  } else {
    pass('[' + theme + '] no SVG labels clipped by their viewBox');
  }

  /* MathJax renders every glyph it knows as a <path> from its local font cache.
     A <text> element inside an mjx-container means it had no glyph and fell back
     to whatever font the reader's browser happens to supply, which on a page that
     deliberately ships no maths fonts is a missing character. \mathbb{1} is the
     usual culprit: blackboard bold exists for letters, not for digits. */
  const mjFallback = await page.evaluate(() => {
    const seen = new Map();
    document.querySelectorAll('mjx-container text').forEach((el) => {
      const ch = (el.textContent || '').trim();
      if (ch) seen.set(ch, (seen.get(ch) || 0) + 1);
    });
    return [...seen].map(([ch, n]) => '"' + ch + '" x' + n);
  });
  if (mjFallback.length) {
    fail('[' + theme + '] MathJax had no glyph for ' + mjFallback.length +
         ' character(s), so they fall back to a system font: ' + mjFallback.join(', '));
  } else {
    pass('[' + theme + '] every maths glyph came from the build-time font cache');
  }

  if (blocked.size) console.log('  note  sandbox blocked (fine in the browser): ' + [...blocked].join(', '));

  /* Screenshots: one per scene host, plus evenly spaced full frames. */
  const shots = Math.min(steps, 60);
  for (let i = 0; i <= shots; i++) {
    const y = Math.round((i / shots) * (height - vh));
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(120);
    await page.screenshot({
      path: join(SHOTS, theme + '-' + String(i).padStart(3, '0') + '.png')
    });
  }
  console.log('  ' + (shots + 1) + ' frames -> .verify/' + theme + '-*.png');

  await ctx.close();
}

/* --------------------------------------------- 2. narrow viewport check -- */

async function narrow(width) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForSelector('[data-atlas-ready="1"]', { timeout: 20000 });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  let worst = 0, worstAt = 0;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const y = Math.round((i / steps) * (height - 800));
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(30);
    const ov = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > worst) { worst = ov; worstAt = y; }
  }
  if (worst > 1) fail('[' + width + 'px] horizontal overflow of ' + worst + 'px near y=' + worstAt);
  else pass('[' + width + 'px] no horizontal overflow');
  if (errors.length) fail('[' + width + 'px] page errors: ' + errors.slice(0, 4).join(' | '));
  await page.screenshot({ path: join(SHOTS, 'narrow-' + width + '.png'), fullPage: false });
  await ctx.close();
}

/* ------------------------------------------------ 3. reduced motion pass -- */

async function reducedMotion() {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'dark',
    reducedMotion: 'reduce'
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForSelector('[data-atlas-ready="1"]', { timeout: 20000 });
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.35, behavior: 'instant' }));
  await page.waitForTimeout(400);
  const hidden = await page.evaluate(() => {
    let n = 0;
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(el).opacity) < 0.9) n++;
    });
    return n;
  });
  if (hidden > 0) fail('[reduced-motion] ' + hidden + ' on-screen elements still faded out');
  else pass('[reduced-motion] all on-screen content is visible');
  if (errors.length) fail('[reduced-motion] page errors: ' + errors.slice(0, 4).join(' | '));
  await page.screenshot({ path: join(SHOTS, 'reduced-motion.png') });
  await ctx.close();
}

/* --------------------------------------------------------------- run it -- */

await sweep('dark');
if (!shotsOnly) {
  await sweep('light');
  await narrow(390);
  await narrow(768);
  await reducedMotion();
}
await browser.close();

console.log('');
if (failures.length) {
  console.log(failures.length + ' check(s) failed.');
  process.exit(1);
}
console.log('all checks passed.');
