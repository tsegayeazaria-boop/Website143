/* ============================================================================
   verify-artifact.mjs — drives dist/artifact.html the way a reader will.

   The one thing this proves that verify-site.mjs cannot: the page is opened with
   EVERY network request blocked, so anything still being fetched shows up as a
   failure rather than as a font that silently does not arrive.

   Then it walks all fourteen views, because in the artifact a view is only
   typeset, built and mounted when it is first opened — a code path the
   multi-page site does not have.

     node verify-artifact.mjs           all views, three widths, both themes
     node verify-artifact.mjs --quick   the initial view only
   ========================================================================= */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
/* The preview copy: the published file plus the wrapper the publisher supplies.
   Testing the bare file would test it in quirks mode, which is not what a reader
   ever sees — and KaTeX refuses to run there. */
const PAGE = 'file://' + join(ROOT, 'dist', 'artifact.preview.html');
const SHOTS = join(ROOT, '.verify', 'artifact');
const EXEC = '/opt/pw-browsers/chromium';
const quick = process.argv.includes('--quick');

if (!existsSync(join(ROOT, 'dist', 'artifact.preview.html'))) {
  console.error('dist/artifact.html not found — run `node bundle-artifact.mjs` first.');
  process.exit(1);
}

const failures = [];
const fail = (m) => { failures.push(m); console.log('  FAIL  ' + m); };
const pass = (m) => console.log('  ok    ' + m);
const note = (m) => console.log('  note  ' + m);

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const size = statSync(join(ROOT, 'dist', 'artifact.html')).size;
console.log(`\nartifact  ${(size / 1024 / 1024).toFixed(2)} MB`);
if (size > 16 * 1024 * 1024) fail(`over the 16MB artifact limit`);

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });

/* Open with the network cut off entirely. Anything the page still wants shows
   up in `blocked`, which is the whole point of this harness. */
async function open(opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === 'light' ? 'light' : 'dark',
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference'
  });
  const blocked = new Set();
  const fonts = new Set();
  await ctx.route('**/*', (route, req) => {
    const u = req.url();
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    /* Google Fonts is the only host the artifact policy admits, and the only
       thing this page asks for. Blocking it here is deliberate: everything must
       still be right when the typefaces do not arrive. */
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) fonts.add(u.slice(0, 60));
    else blocked.add(u.slice(0, 90));
    return route.abort();
  });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  ctx.__fonts = fonts;
  page.on('console', (m) => {
    const t = m.text();
    /* The blocked typeface request above is this harness's own doing, and the
       sandbox could not reach that host anyway. */
    if (m.type() === 'error') { if (!/Failed to load resource/i.test(t)) errors.push(t); }
    else if (m.type() === 'warning' && /katex|latex/i.test(t)) warnings.push(t);
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(PAGE + (opts.hash || ''), { waitUntil: 'load' });
  await page.waitForSelector('html[data-site-ready="1"]', { timeout: 30000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return { ctx, page, errors, warnings, blocked, fonts };
}

async function sweep(page, vh) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(vh * 0.45);
  let worst = 0;
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(26);
    const ov = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > worst) worst = ov;
  }
  return worst;
}

/* ------------------------------------------- 1. loads with no network --- */

console.log('\nself-containment');
{
  const { ctx, page, errors, blocked, fonts } = await open();
  if (blocked.size) fail(`the page reached for something other than its typefaces: ${[...blocked].join(', ')}`);
  else pass(`the only thing requested is the typefaces (${fonts.size} request(s)), and they were blocked here`);

  const r = await page.evaluate(() => ({
    katex: typeof window.katex === 'object',
    auto: typeof window.renderMathInElement === 'function',
    state: document.documentElement.getAttribute('data-katex'),
    rendered: document.querySelectorAll('.katex').length,
    errs: document.querySelectorAll('.katex-error').length,
    /* Are the embedded faces actually in use, or is this a fallback rendering? */
    faces: [...document.fonts].filter((f) => /KaTeX/.test(f.family)).length,
    loaded: [...document.fonts].filter((f) => /KaTeX/.test(f.family) && f.status === 'loaded').length,
    views: document.querySelectorAll('.view').length,
    shown: [...document.querySelectorAll('.view')].filter((v) => !v.hidden).length
  }));
  if (!r.katex || !r.auto) fail('KaTeX is not present — it should be inlined');
  else pass('the typesetting engine is inlined and running');
  if (r.state !== 'ready') fail(`KaTeX reported "${r.state}"`);
  if (r.errs) fail(`${r.errs} equation(s) failed to typeset`);
  if (!r.faces) fail('no KaTeX font faces are declared');
  else if (!r.loaded) fail(`${r.faces} KaTeX faces declared but none loaded — the data URIs are wrong`);
  else pass(`${r.loaded} of ${r.faces} embedded font faces loaded from data URIs`);
  if (r.views !== 14) fail(`${r.views} views, expected 14`);
  if (r.shown !== 1) fail(`${r.shown} views visible at once, expected 1`);
  else pass('fourteen views, one of them showing');
  if (errors.length) fail('console errors:\n        ' + errors.slice(0, 6).join('\n        '));
  else pass('no console errors on load');
  await page.screenshot({ path: join(SHOTS, 'load.png') });
  await ctx.close();
}

/* --------------------------------------------------- 2. every view ----- */

const VIEWS = ['index', '1-1', '1-2', '1-3', '1-4', '2-1', '2-2',
               '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', 'ref'];
const report = [];

if (!quick) {
  const { ctx, page, errors, warnings, blocked } = await open();

  for (const v of VIEWS) {
    const before = failures.length;
    /* Navigate the way a reader does: click the sidebar entry. */
    await page.evaluate((id) => { location.hash = '#' + id; }, v);
    await page.waitForTimeout(260);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    const st = await page.evaluate((id) => {
      const el = document.querySelector(`.view[data-view="${id}"]`);
      return {
        visible: el && !el.hidden,
        others: [...document.querySelectorAll('.view')].filter((x) => !x.hidden).length,
        katex: el ? el.querySelectorAll('.katex').length : 0,
        katexErr: el ? el.querySelectorAll('.katex-error').length : 0,
        stages: el ? el.querySelectorAll('.stage--derive').length : 0,
        scenes: el ? el.querySelectorAll('[data-scene]').length : 0,
        mounted: el ? el.querySelectorAll('[data-scene][data-mounted="1"]').length : 0,
        current: (document.querySelector('.sidebar__link[aria-current="page"]') || {}).textContent || '',
        subs: document.querySelectorAll('.sidebar__sub a').length,
        heads: el ? el.querySelectorAll('h2[id]').length : 0,
        pagers: el ? el.querySelectorAll('.pager a').length : 0
      };
    }, v);

    if (!st.visible) fail(`[${v}] the view did not open`);
    if (st.others !== 1) fail(`[${v}] ${st.others} views visible at once`);
    if (st.katexErr) fail(`[${v}] ${st.katexErr} equation(s) failed to typeset`);
    if (v !== 'index' && st.katex < 5) fail(`[${v}] only ${st.katex} equations typeset`);
    if (st.scenes !== st.mounted) fail(`[${v}] ${st.mounted} of ${st.scenes} demos mounted`);
    if (st.subs !== st.heads) fail(`[${v}] ${st.subs} sub-navigation links for ${st.heads} headings`);
    const wantPager = (v === 'index' || v === 'ref') ? 1 : 2;
    if (st.pagers !== wantPager) fail(`[${v}] ${st.pagers} pager links, expected ${wantPager}`);

    /* Unrendered maths left as source in the prose. */
    const left = await page.evaluate((id) => {
      const el = document.querySelector(`.view[data-view="${id}"]`);
      const out = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const p = n.parentElement;
        if (!p || p.closest('.katex, script, style, code, pre, .derive__tex')) continue;
        if (/\$|\\frac|\\sqrt|\\begin\{/.test(n.nodeValue)) out.push(n.nodeValue.trim().slice(0, 50));
      }
      return out.slice(0, 4);
    }, v);
    if (left.length) fail(`[${v}] unrendered maths: ${JSON.stringify(left)}`);

    const overflow = await sweep(page, 900);
    if (overflow > 1) fail(`[${v}] ${overflow}px of horizontal overflow`);

    /* Derivations: every one must run to its last step, with the moving clones
       landing on the glyphs they replace. */
    let der = null;
    if (st.stages) {
      der = await page.evaluate((id) => {
        const D = window.__derive;
        const mine = D.list.filter((d) => {
          const el = document.getElementById('derive-' + d.id);
          return el && el.closest(`.view[data-view="${id}"]`);
        });
        const align = D.check().filter((a) => mine.some((m) => m.id === a.id));
        const sweepViz = D.vizSweep().filter((x) => mine.some((m) => m.id === x.id));
        return { list: mine, align, viz: sweepViz };
      }, v);
      const stalled = der.list.filter((d) => d.mode === 'stage' && !d.reachedEnd);
      if (stalled.length) {
        fail(`[${v}] derivations that never reached their last step: ` +
             stalled.map((d) => `${d.id} (${d.maxStep}/${d.N - 1})`).join(', '));
      }
      const bad = der.align.filter((a) =>
        a.skipped || a.items === 0 || a.worst0 > 0.3 || a.worst1 > 0.3 || a.invisible > 0);
      if (bad.length) {
        fail(`[${v}] moving terms out of place: ` + bad.slice(0, 3).map((a) =>
          `${a.id} ${a.k} off by ${Math.max(a.worst0, a.worst1)}px on "${a.culprit0 || a.culprit1}"`).join('; '));
      } else if (der.align.length) {
        const worst = Math.max(...der.align.map((a) => Math.max(a.worst0, a.worst1)));
        pass(`[${v}] ${der.align.length} transitions align within ${worst.toFixed(2)}px`);
      }

      /* The companion pictures, asked directly rather than inferred from a
         scroll: a view is built only when it is first opened, so a picture
         that fails to build here would otherwise go unnoticed until a reader
         opened that view. */
      const withViz = der.list.filter((d) => d.viz);
      if (withViz.length) {
        const unbuilt = withViz.filter((d) => !d.vizBuilt);
        if (unbuilt.length) fail(`[${v}] pictures that never built: ${unbuilt.map((d) => d.id).join(', ')}`);
        const threw = der.viz.filter((x) => x.error);
        if (threw.length) fail(`[${v}] pictures that failed a step: ` + threw.map((x) => `${x.id} ${x.error}`).join('; '));
        const blank = der.viz.filter((x) => x.built && x.empty);
        if (blank.length) fail(`[${v}] pictures that drew nothing: ` + blank.map((x) => x.id).join(', '));
        const frozen = der.viz.filter((x) => x.built && x.N > 1 && x.distinct < 2);
        if (frozen.length) fail(`[${v}] pictures that never changed: ` + frozen.map((x) => x.id).join(', '));
        pass(`[${v}] ${withViz.length} pictures drew ${der.viz.reduce((n, x) => n + x.states.length, 0)} states`);
      }
    }

    /* Demonstrations: each must draw, and react to its first control. */
    const figs = await page.$$(`.view[data-view="${v}"] .fig--demo`);
    const demos = [];
    for (const fig of figs) {
      const id = await fig.$eval('[data-scene]', (e) => e.getAttribute('data-scene')).catch(() => '?');
      await fig.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const drew = await fig.evaluate((f) => {
        const cv = f.querySelector('canvas');
        if (cv) {
          const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let on = 0;
          for (let i = 3; i < d.length; i += 4 * 37) if (d[i] > 8) on++;
          return on > 20;
        }
        const sv = f.querySelector('svg');
        if (!sv) return false;
        let b; try { b = sv.getBBox(); } catch (e) { return false; }
        return sv.querySelectorAll('*').length > 4 && b.width > 1 && b.height > 1;
      });
      if (!drew) fail(`[${v}] demo "${id}" drew nothing`);
      const snap = () => fig.evaluate((f) => {
        const cv = f.querySelector('canvas');
        if (cv) {
          const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let h = 0;
          for (let i = 0; i < d.length; i += 4 * 17) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 3] * 7) | 0;
          return 'c' + h;
        }
        const sv = f.querySelector('svg');
        if (!sv) return 'none';
        /* Hash the drawing itself, not its length: two different pictures can
           easily serialise to the same number of characters. */
        let h = 0;
        /* Sample the whole drawing, not its first hundred nodes: a shaded pattern
           puts hundreds of identical bands before the curve that actually moves.
           Include fill-opacity, which is the only thing a band changes. */
        const all = [...sv.querySelectorAll('path, line, circle, rect, text')];
        const step = Math.max(1, Math.floor(all.length / 160));
        const s = all.filter((_, i) => i % step === 0)
          .map((e) => (e.getAttribute('d') || '') + (e.getAttribute('x1') || '') +
                      (e.getAttribute('cx') || '') + (e.getAttribute('width') || '') +
                      (e.getAttribute('fill-opacity') || '') + (e.getAttribute('fill') || '') +
                      (e.textContent || '')).join('|');
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
        return 's' + h;
      });
      const b0 = await snap();
      await page.waitForTimeout(140);
      const b1 = await snap();
      const animating = b1 !== b0;
      const range = await fig.$('input[type=range]');
      let reacted = null;
      if (range && !animating) {
        await range.evaluate((el) => {
          const mn = Number(el.min), mx = Number(el.max), cur = Number(el.value);
          el.value = String(Math.abs(cur - mx) > Math.abs(cur - mn) ? mx : mn);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(280);
        reacted = (await snap()) !== b1;
        if (!reacted) fail(`[${v}] demo "${id}" ignored its first slider`);
      } else if (range && animating) {
        /* A demo that animates on its own cannot be told apart this way; check
           instead that moving the control changes what it reports. */
        const before = await fig.evaluate((f) => {
          const h = f.querySelector('[data-scene]');
          return h && h.__demo && h.__demo.read ? JSON.stringify(h.__demo.read()) : null;
        });
        await range.evaluate((el) => {
          const mn = Number(el.min), mx = Number(el.max), cur = Number(el.value);
          el.value = String(Math.abs(cur - mx) > Math.abs(cur - mn) ? mx : mn);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForTimeout(280);
        const after = await fig.evaluate((f) => {
          const h = f.querySelector('[data-scene]');
          return h && h.__demo && h.__demo.read ? JSON.stringify(h.__demo.read()) : null;
        });
        reacted = before === null ? null : after !== before;
        if (reacted === false) fail(`[${v}] demo "${id}" ignored its first slider`);
      }
      for (const b of await fig.$$('.btn')) { await b.click(); await page.waitForTimeout(50); }
      demos.push({ id, drew, reacted });
    }

    /* The page scrolls smoothly by default, so ask for instant and then check we
       actually arrived — a screenshot taken mid-glide shows empty background and
       looks like a rendering failure. */
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(160);
    const restY = await page.evaluate(() => Math.round(window.scrollY));
    if (restY > 2) fail(`[${v}] the view would not scroll back to the top (stuck at ${restY}px)`);
    await page.screenshot({ path: join(SHOTS, `view-${v}.png`) });

    const clean = failures.length === before;
    if (clean) pass(`[${v}] ${st.katex} equations, ${st.stages} derivations, ${demos.length} demos`);
    report.push({ v, ok: clean, katex: st.katex, stages: st.stages, demos,
                  align: der ? der.align.length : 0 });
  }

  if (blocked.size) fail(`the page reached for something other than its typefaces: ${[...blocked].join(', ')}`);
  else pass('across all fourteen views, nothing but the typefaces is ever requested');
  if (errors.length) fail('console errors while navigating:\n        ' + errors.slice(0, 8).join('\n        '));
  else pass('no console errors across all fourteen views');
  if (warnings.length) fail('KaTeX warnings: ' + warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ----------------------------------- 3. cross-view links, themes, sizes -- */

if (!quick) {
  console.log('\nnavigation and layout');

  /* A link from one page to an equation on another must land on that equation. */
  {
    const { ctx, page, errors } = await open();
    /* The reference page is where the cross-view links live: every equation in
       its table points back at the page that derives it. */
    await page.evaluate(() => { location.hash = '#ref'; });
    await page.waitForTimeout(400);
    const landed = await page.evaluate(async () => {
      const links = [...document.querySelectorAll('.view:not([hidden]) a[href^="#"]')]
        .filter((a) => {
          const h = a.getAttribute('href').slice(1);
          return h.includes('/') && !h.startsWith(document.querySelector('.view:not([hidden])').dataset.view + '/');
        });
      const link = links[0];
      if (!link) return { found: false };
      const target = link.getAttribute('href').slice(1);
      link.click();
      /* The chase converges as the stages below take their heights; wait for it
         rather than judging the first frame. */
      await new Promise((r) => setTimeout(r, 2200));
      const [v, a] = target.split('/');
      const el = document.getElementById(v + '--' + a);
      const view = document.querySelector(`.view[data-view="${v}"]`);
      const r = el ? el.getBoundingClientRect() : null;
      return {
        found: true, target,
        viewOpen: view && !view.hidden,
        anchorExists: !!el,
        onScreen: r ? r.top > -200 && r.top < window.innerHeight : false
      };
    });
    if (!landed.found) fail('the reference page has no working cross-view links');
    else if (!landed.viewOpen) fail(`a cross-view link did not open its view (${landed.target})`);
    else if (!landed.anchorExists) fail(`a cross-view link points at a missing anchor (${landed.target})`);
    else if (!landed.onScreen) fail(`a cross-view link opened the view but did not reach the equation`);
    else pass(`cross-view links land on their equation (${landed.target})`);
    if (errors.length) fail('console errors following a cross-view link: ' + errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  /* Themes. */
  for (const theme of ['dark', 'light']) {
    const { ctx, page, errors } = await open({ theme, hash: '#1-3' });
    const ok = await page.evaluate(() => {
      const b = document.querySelector('.theme-toggle');
      const before = getComputedStyle(document.body).backgroundColor;
      b.click();
      const mid = document.documentElement.getAttribute('data-theme');
      b.click();
      return { flipped: !!mid, after: getComputedStyle(document.body).backgroundColor, before };
    });
    if (!ok.flipped) fail(`[${theme}] the theme switch did nothing`);
    else pass(`[${theme}] theme switch works, body painted ${ok.before}`);
    if (errors.length) fail(`[${theme}] console errors: ${errors.slice(0, 3).join(' | ')}`);
    await page.screenshot({ path: join(SHOTS, `theme-${theme}.png`) });
    await ctx.close();
  }

  /* Narrow viewports, and the drawer. */
  for (const width of [390, 768]) {
    const { ctx, page, errors } = await open({ viewport: { width, height: 780 }, hash: '#1-3' });
    const worst = await sweep(page, 780);
    if (worst > 1) fail(`[${width}px] ${worst}px of horizontal overflow`);
    else pass(`[${width}px] no horizontal overflow`);
    if (width === 390) {
      const hidden = await page.evaluate(() =>
        document.querySelector('.sidebar').getBoundingClientRect().right <= 1);
      await page.click('.nav-toggle');
      await page.waitForTimeout(420);
      const opened = await page.evaluate(() =>
        document.querySelector('.sidebar').getBoundingClientRect().right > 40);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(420);
      const closed = await page.evaluate(() => document.body.dataset.nav !== 'open');
      if (!hidden || !opened || !closed) fail('[390px] the contents drawer does not open and close');
      else pass('[390px] the contents drawer opens and closes');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(120);
      await page.screenshot({ path: join(SHOTS, 'narrow-390.png') });
    }
    if (errors.length) fail(`[${width}px] console errors: ${errors.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }

  /* Reduced motion: the derivations must fall back to a readable list. */
  {
    const { ctx, page, errors } = await open({ reduced: true, hash: '#2-2' });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const el = document.querySelector('.view[data-view="2-2"]');
      let faded = 0;
      el.querySelectorAll('[data-reveal]').forEach((n) => {
        const b = n.getBoundingClientRect();
        if (b.top < innerHeight && b.bottom > 0 && parseFloat(getComputedStyle(n).opacity) < 0.9) faded++;
      });
      return { faded, stages: el.querySelectorAll('.stage--derive').length,
               ladders: el.querySelectorAll('.derive--static').length };
    });
    if (r.faded) fail(`[reduced motion] ${r.faded} things on screen are still faded out`);
    if (r.stages) fail('[reduced motion] derivations still animate');
    if (!r.ladders) fail('[reduced motion] no static ladder replaced the animation');
    else pass(`[reduced motion] ${r.ladders} derivations shown as static lists`);
    if (errors.length) fail(`[reduced motion] console errors: ${errors.slice(0, 3).join(' | ')}`);
    await page.screenshot({ path: join(SHOTS, 'reduced-motion.png') });
    await ctx.close();
  }
}

await browser.close();

/* -------------------------------------------------------------- report -- */

if (report.length) {
  const tick = (b) => (b ? '✅' : '❌');
  console.log('\n' + '-'.repeat(74));
  console.log('view    opens  equations  derivations  demos');
  console.log('-'.repeat(74));
  for (const r of report) {
    console.log(
      r.v.padEnd(7) + ' ' + tick(r.ok).padEnd(6) + ' ' +
      String(r.katex).padStart(6) + '     ' +
      (r.stages ? `${r.stages} ${tick(true)}` : '—').padEnd(12) +
      (r.demos.length ? r.demos.map((d) => `${d.id} ${tick(d.drew && d.reacted !== false)}`).join('  ') : '—')
    );
  }
  console.log('-'.repeat(74));
}
console.log(`screenshots in .verify/artifact/`);
if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nall checks passed.');
