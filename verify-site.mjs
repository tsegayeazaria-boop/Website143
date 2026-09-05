/* ============================================================================
   verify-site.mjs — proves the site works before anyone reads it.

   Three layers:
     1. the physics, in Node: every formula the demos draw with is checked
        against the closed form the pages derive;
     2. the files, as text: structure the pages promise each other — script
        order, demos that exist, check-yourself boxes, takeaways, working links;
     3. the pages, in a real browser: KaTeX renders, every derivation reaches
        its last step with its moving clones landing within a pixel of the real
        glyphs, every demo draws something and reacts to its controls, nothing
        overflows sideways, and reduced motion degrades to a readable list.

   KaTeX is served to the browser from node_modules rather than the CDN, so the
   run is hermetic and pinned to exactly the version the pages ask for.

     node verify-site.mjs                 all pages
     node verify-site.mjs --page 2-2      one page
     node verify-site.mjs --quick         dark theme only, fewer screenshots
   ========================================================================= */

import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const EXEC = '/opt/pw-browsers/chromium';
const SHOTS = join(ROOT, '.verify', 'site');

const argv = process.argv.slice(2);
const only = (() => { const i = argv.indexOf('--page'); return i >= 0 ? argv[i + 1] : null; })();
const quick = argv.includes('--quick');

const failures = [];
const notes = [];
const fail = (m) => { failures.push(m); console.log('  FAIL  ' + m); };
const pass = (m) => console.log('  ok    ' + m);
const note = (m) => { notes.push(m); console.log('  note  ' + m); };

/* Expected number of animated derivations per page. A page that loses one has
   quietly stopped deriving something it used to derive. */
const EXPECTED_DERIVES = {
  '1-1': 8, '1-2': 8, '1-3': 22, '1-4': 12, '2-1': 6, '2-2': 13,
  '2-3': 6, '2-4': 11, '2-5': 4, '2-6': 6, '2-7': 6, '2-8': 7, 'ref': 0, 'index': 0
};

/* ------------------------------------------------------ 1. the physics --- */

function loadSite() {
  const src = readFileSync(join(ROOT, 'site.js'), 'utf8');
  const g = {};
  new Function('window', 'document', 'globalThis', src)(undefined, undefined, g);
  return g.A;
}

function assertPhysMath() {
  const A = loadSite();
  const P = A.phys, M = A.math;
  let n = 0;
  const near = (got, want, tol, what) => {
    n++;
    if (!(Math.abs(got - want) <= (tol ?? 1e-6))) fail(`physics: ${what} — expected ${want}, got ${got}`);
  };

  /* Eigenvalues of a symmetric matrix: real, and its eigenvectors perpendicular. */
  const e = P.eig2(2, 1, 1, 2);
  near(e.lambda[0], 3, 1e-12, 'eig2([[2,1],[1,2]]) first eigenvalue');
  near(e.lambda[1], 1, 1e-12, 'eig2([[2,1],[1,2]]) second eigenvalue');
  near(e.vec[0][0] * e.vec[1][0] + e.vec[0][1] * e.vec[1][1], 0, 1e-12,
       'symmetric matrix has perpendicular eigenvectors');
  const e2 = P.eig2(4, 2, 1, 3);
  near(e2.lambda[0], 5, 1e-12, 'eig2([[4,2],[1,3]]) first eigenvalue');
  near(e2.lambda[1], 2, 1e-12, 'eig2([[4,2],[1,3]]) second eigenvalue');
  /* An eigenvector really is only stretched. */
  const v = e2.vec[0], Av = P.matVec(4, 2, 1, 3, v);
  near(Av[0] - 5 * v[0], 0, 1e-12, 'A v = lambda v, x component');
  near(Av[1] - 5 * v[1], 0, 1e-12, 'A v = lambda v, y component');
  /* A rotation has no real eigenvector. */
  if (P.eig2(0, -1, 1, 0).real) fail('physics: a quarter-turn should have no real eigenvalues');
  n++;

  /* Normal modes of two masses and three springs. */
  const cm = P.coupledModes(1, 4, 1);
  near(cm.omegaSq[0], 4, 1e-12, 'in-phase mode frequency squared is k/m');
  near(cm.omegaSq[1], 6, 1e-12, 'out-of-phase mode frequency squared is (k+2kappa)/m');
  near(cm.eig.lambda[0], 6, 1e-12, 'the stiffness matrix eigenvalues are the mode frequencies');
  near(cm.eig.lambda[1], 4, 1e-12, 'the stiffness matrix eigenvalues are the mode frequencies');
  /* Started in a pure mode, the shape never changes. */
  const st = P.coupledState(0.937, { x1: 0.03, x2: 0.03, v1: 0, v2: 0 }, { m: 1, k: 4, kappa: 1 });
  near(st.x1 - st.x2, 0, 1e-12, 'a pure in-phase start stays in phase');
  near(st.x1, 0.03 * Math.cos(2 * 0.937), 1e-12, 'the in-phase mode oscillates at omega_1');
  /* Started with one mass held aside, the equations of motion are obeyed. */
  const prm = { m: 0.5, k: 10, kappa: 5 }, ic = { x1: 0.02, x2: 0, v1: 0, v2: 0 };
  const h = 1e-4, t0 = 0.3;
  const s0 = P.coupledState(t0, ic, prm), sp = P.coupledState(t0 + h, ic, prm), sm = P.coupledState(t0 - h, ic, prm);
  const a1 = (sp.x1 - 2 * s0.x1 + sm.x1) / (h * h);
  near(a1, (-(prm.k + prm.kappa) * s0.x1 + prm.kappa * s0.x2) / prm.m, 1e-4,
       'the closed-form motion satisfies the equation of motion for mass 1');

  /* Reflection and transmission at a join between two strings. */
  const rt = P.stringRT(1, 4, 1);
  near(rt.R, -1 / 3, 1e-12, 'R for a fourfold heavier string');
  near(rt.T, 2 / 3, 1e-12, 'T for a fourfold heavier string');
  near(1 + rt.R, rt.T, 1e-12, 'the displacement condition 1 + R = T');
  near(rt.powerR + rt.powerT, 1, 1e-12, 'reflected and transmitted power add to the incident power');
  near(P.stringRT(1, 1, 1).R, 0, 1e-12, 'no reflection from an identical string');
  near(P.stringRT(1, 1e12, 1).R, -1, 1e-5, 'a fixed end inverts the pulse completely');
  near(P.stringRT(1, 1e-12, 1).R, 1, 1e-5, 'a free end reflects upright');
  near(P.stringRT(4, 1, 1).v2 / P.stringRT(4, 1, 1).v1, 2, 1e-12, 'the wave speeds off as one over root mu');

  /* Fourier coefficients, integrated numerically, against the closed forms. */
  for (const nn of [1, 2, 3, 5]) {
    const b = P.fourierCoeffs((t) => P.squareWave(t), nn).b[nn];
    near(b, P.squareCoeff(nn), 2e-3, `square wave b_${nn}`);
  }
  near(P.squareCoeff(1), 4 / Math.PI, 1e-12, 'b_1 of the square wave is 4/pi');
  near(P.squareCoeff(2), 0, 1e-12, 'the square wave has no even harmonics');
  /* A quarter-duty pulse: a constant term appears and even harmonics return. */
  const pc = P.fourierCoeffs((t) => P.pulseTrain(t, 0.25, 0), 4);
  near(pc.a[0], P.pulseCoeff(0, 0.25, 0), 2e-3, 'quarter-duty pulse average');
  near(pc.a[2], P.pulseCoeff(2, 0.25, 0), 2e-3, 'quarter-duty pulse second harmonic');
  near(pc.a[4], 0, 2e-3, 'quarter-duty pulse fourth harmonic vanishes');
  if (!(Math.abs(pc.a[2]) > 0.2)) fail('physics: the quarter-duty pulse must keep its even harmonics');
  n++;

  /* A Gaussian transforms to a Gaussian, and the widths trade off exactly. */
  for (const sg of [0.5, 2, 7]) {
    const w = P.gaussianWidths(sg);
    near(w.dx * w.dk, 0.5, 1e-12, `width product for sigma = ${sg}`);
    /* The transform, integrated straight from the definition. */
    const k = 0.37;
    const num = M.integrate((x) => P.gaussian(x, sg) * Math.cos(k * x), -12 * sg, 12 * sg, 6000);
    near(num, P.gaussianFT(k, sg), 1e-6 + 1e-4 * Math.abs(P.gaussianFT(k, sg)),
         `the transform of a Gaussian of width ${sg}`);
  }

  /* Diffraction and interference. */
  near(P.singleSlit(0.0000001, 5), 1, 1e-6, 'the single slit is brightest straight ahead');
  near(P.singleSlit(1, 1), 0, 1e-12, 'the first single-slit minimum is at a sin(theta) = lambda');
  near(P.singleSlit(0.5, 2), 0, 1e-12, 'and again when a sin(theta) = lambda');
  near(P.fringeSpacing(633e-9, 2, 0.25e-3), 5.064e-3, 1e-6, 'double-slit fringe spacing');
  /* A quarter-wavelength of path difference is a phase difference of pi/2, and
     cos^2(pi/4) is one half. */
  near(P.doubleSlit(0.0625, 1e-6, 4), P.singleSlit(0.0625, 1e-6) * 0.5, 1e-9,
       'a quarter-wavelength path difference gives half the peak brightness');
  near(P.doubleSlit(0.125, 1e-6, 4), 0, 1e-9, 'a half-wavelength path difference is dark');

  /* Group velocity from the dispersion relation. */
  near(P.groupVelocity((k) => 3 * k, 2), 3, 1e-6, 'no dispersion: group velocity equals phase velocity');
  near(P.groupVelocity((k) => 3 * k * k, 2), 12, 1e-4, 'for omega proportional to k squared, v_g = 2 v_p');
  near(P.phaseVelocity((k) => 3 * k * k, 2), 6, 1e-12, 'phase velocity of the same relation');
  near(P.groupVelocity((k) => Math.sqrt(9.81 * k), 4) / P.phaseVelocity((k) => Math.sqrt(9.81 * k), 4),
       0.5, 1e-5, 'deep-water waves: the envelope travels at half the crest speed');

  /* Standing waves. */
  const sw = P.standing(3, 0.65, 426);
  near(sw.lambda, 2 * 0.65 / 3, 1e-12, 'the third harmonic wavelength on a fixed string');
  near(sw.f, 3 * 426 / (2 * 0.65), 1e-9, 'the third harmonic frequency');
  near(P.standing(1, 0.5, 100, true).lambda, 2, 1e-12, 'a free end gives a quarter wavelength');

  /* Simple harmonic motion. */
  const s = P.sho(0.05, -1, 20);
  near(s.A, Math.sqrt(0.05 * 0.05 + 0.05 * 0.05), 1e-12, 'amplitude from both initial conditions');
  near(s.x(0), 0.05, 1e-12, 'the solution matches the initial position');
  near(s.v(0), -1, 1e-9, 'the solution matches the initial velocity');

  /* A wave packet made of plane waves really is a packet: big in the middle,
     small far away, and it travels at the group velocity. */
  const om = (k) => 2 * k + 0.5 * k * k;
  const vg = P.groupVelocity(om, 6);
  const at = (x, t) => P.packet(x, t, 6, 0.6, om).env;
  if (!(at(0, 0) > 0.9 && at(6, 0) < 0.2)) fail('physics: the wave packet is not localised');
  n++;
  const T = 1.5, peak = (t) => {
    let best = -1, bx = 0;
    for (let x = -4; x <= 20; x += 0.02) { const e2 = at(x, t); if (e2 > best) { best = e2; bx = x; } }
    return bx;
  };
  near((peak(T) - peak(0)) / T, vg, 0.25, 'the packet envelope travels at the group velocity');

  pass(`physics: ${n} numerical identities hold`);
  return A;
}

/* --------------------------------------------------- 2. the files ------- */

/* Every inline maths span in a file: the text between the 1st and 2nd dollar,
   the 3rd and 4th, and so on, skipping escaped dollars and $$ display maths. */
function mathSpans(html) {
  const out = [];
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
  let open = -1;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '\\') { i++; continue; }
    if (c !== '$') continue;
    if (body[i + 1] === '$') { i++; continue; }
    if (open < 0) open = i;
    else { out.push(body.slice(open + 1, i)); open = -1; }
  }
  return out;
}

function pageFiles(A) {
  return A.toc.pages
    .filter((p) => !only || p.id === only)
    .map((p) => {
      const path = join(ROOT, p.file);
      const stub = existsSync(path) && /data-stub="1"/.test(readFileSync(path, 'utf8'));
      return { ...p, path, stub };
    });
}

function staticChecks(A) {
  const katexVersion = JSON.parse(readFileSync(join(ROOT, 'node_modules/katex/package.json'), 'utf8')).version;
  let checked = 0;

  for (const p of pageFiles(A)) {
    if (!existsSync(p.path)) { fail(`missing page file ${p.file}`); continue; }
    const html = readFileSync(p.path, 'utf8');
    const where = p.file;
    checked++;

    /* The CDN the page asks for must be the version the harness serves. */
    const cdn = [...html.matchAll(/cdn\.jsdelivr\.net\/npm\/katex@([\d.]+)\//g)].map((m) => m[1]);
    if (!cdn.length) fail(`${where}: no KaTeX stylesheet or script`);
    else if (cdn.some((v) => v !== katexVersion)) {
      fail(`${where}: asks for KaTeX ${[...new Set(cdn)].join(', ')} but node_modules has ${katexVersion}`);
    }

    /* Scripts must load in an order that lets each one see the last. */
    const order = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
    const idx = (frag) => order.findIndex((s) => s.includes(frag));
    if (idx('katex.min.js') < 0 || idx('auto-render') < 0 || idx('site.js') < 0) {
      fail(`${where}: missing one of katex, auto-render, site.js`);
    } else if (!(idx('katex.min.js') < idx('auto-render') && idx('auto-render') < idx('site.js'))) {
      fail(`${where}: KaTeX must be loaded before site.js`);
    }
    if (idx('derive.js') >= 0 && idx('derive.js') < idx('site.js')) {
      fail(`${where}: derive.js must come after site.js`);
    }

    /* Every demo the page hosts must exist and be included by the page. */
    const wanted = [...html.matchAll(/data-scene="([^"]+)"/g)].map((m) => m[1])
      .filter((s) => !s.startsWith('derive:'));
    const included = order.filter((s) => s.includes('demos/')).map((s) => basename(s));
    for (const id of wanted) {
      const hit = readdirSync(join(ROOT, 'demos')).find((f) => {
        const src = readFileSync(join(ROOT, 'demos', f), 'utf8');
        return src.includes(`A.scene('${id}'`) || src.includes(`A.scene("${id}"`);
      });
      if (!hit) fail(`${where}: no demo file registers "${id}"`);
      else if (!included.includes(hit)) fail(`${where}: hosts "${id}" but never loads demos/${hit}`);
    }

    /* Raw angle brackets inside mathematics silently eat the rest of the line.
       Dollars are paired in order, the way the renderer pairs them, so prose
       between two separate maths spans is not mistaken for maths. */
    for (const m of mathSpans(html)) {
      if (/[<>]/.test(m)) fail(`${where}: raw < or > inside maths — write \\lt or \\gt: $${m.slice(0, 50)}$`);
    }

    /* No leftovers from the other site in this repository. */
    if (/MathJax|mjx-container/.test(html)) fail(`${where}: MathJax markup left in the page`);

    if (/data-stub="1"/.test(html)) { note(`${where}: not written yet`); continue; }
    if (p.id === 'index' || p.id === 'ref') continue;

    /* Every section page owes the reader the same furniture. */
    const derives = (html.match(/type="text\/x-derive"/g) || []).length;
    const wantD = EXPECTED_DERIVES[p.id] ?? 0;
    if (derives < wantD) fail(`${where}: ${derives} animated derivations, expected at least ${wantD}`);

    for (const m of html.matchAll(/<script type="text\/x-derive"[^>]*>([\s\S]*?)<\/script>/g)) {
      const steps = m[1].split(/^[ \t]*---[ \t]*$/m).filter((s) => s.replace(/^\s*[>!].*$/gm, '').trim());
      if (steps.length < 2) fail(`${where}: a derivation has fewer than two steps`);
    }

    const checks = (html.match(/callout--check/g) || []).length;
    if (checks !== 1) fail(`${where}: expected exactly one check-yourself box, found ${checks}`);
    const qs = (html.match(/<details class="answer"/g) || []).length;
    if (qs < 3 || qs > 6) fail(`${where}: expected 3 to 5 check-yourself answers, found ${qs}`);
    if (!/class="takeaway"/.test(html)) fail(`${where}: no takeaway sentence anywhere on the page`);
    for (const m of html.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g)) {
      if (!/^\s*(<[^>]+>\s*)*Notice\b/.test(m[1])) {
        fail(`${where}: a demo caption does not start with "Notice": ${m[1].trim().slice(0, 40)}`);
      }
    }
  }

  /* Links have to go somewhere. */
  for (const p of pageFiles(A)) {
    if (!existsSync(p.path)) continue;
    const html = readFileSync(p.path, 'utf8');
    for (const m of html.matchAll(/href="([^"#][^"]*?)(#[^"]*)?"/g)) {
      const href = m[1];
      if (/^(https?:|mailto:|data:)/.test(href)) continue;
      const target = join(dirname(p.path), href);
      if (!existsSync(target)) fail(`${p.file}: link to ${href} does not exist`);
    }
  }

  if (!failures.length) pass(`files: ${checked} page(s) structurally sound`);
}

/* ------------------------------------------------- 3. the real browser --- */

const MIME = { '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2',
               '.woff': 'font/woff', '.ttf': 'font/ttf', '.map': 'application/json' };

async function routeKatex(ctx) {
  await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/katex@[^/]+\/dist\/(.+)$/, (route, req) => {
    const rel = req.url().match(/\/dist\/([^?]+)/)[1];
    const file = join(ROOT, 'node_modules', 'katex', 'dist', rel);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({
      status: 200,
      body: readFileSync(file),
      headers: { 'content-type': MIME[extname(file)] || 'application/octet-stream',
                 'access-control-allow-origin': '*' }
    });
  });
  /* The sandbox cannot reach Google Fonts; the page falls back to Georgia,
     which changes the screenshots and nothing else. */
  await ctx.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
}

async function openPage(browser, p, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === 'light' ? 'light' : 'dark',
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1
  });
  await routeKatex(ctx);
  const page = await ctx.newPage();
  const errors = [], warnings = [], external = new Set();
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') { if (!/Failed to load resource/i.test(t)) errors.push(t); }
    else if (m.type() === 'warning' && /katex|latex/i.test(t)) warnings.push(t);
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('request', (r) => {
    const u = r.url();
    if (!/^(file:|data:|blob:|https:\/\/cdn\.jsdelivr\.net\/npm\/katex@|https:\/\/fonts\.)/.test(u)) external.add(u);
  });
  await page.goto('file://' + p.path, { waitUntil: 'load' });
  await page.waitForSelector('html[data-site-ready="1"]', { timeout: 20000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return { ctx, page, errors, warnings, external };
}

async function sweep(page, height, vh) {
  const step = Math.round(vh * 0.45);
  let worstOverflow = 0;
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(26);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > worstOverflow) worstOverflow = ov;
  }
  return worstOverflow;
}

async function checkPage(browser, p, theme) {
  const tag = `[${p.id}/${theme}]`;
  const { ctx, page, errors, warnings, external } = await openPage(browser, p, { theme });
  const dir = join(SHOTS, p.id);
  mkdirSync(dir, { recursive: true });

  const hasDerive = await page.evaluate(() => !!document.querySelector('.stage--derive, .derive--static'));
  if (hasDerive) await page.waitForFunction(() => window.__derive && window.__derive.ready, { timeout: 15000 });

  /* KaTeX did its job. */
  const math = await page.evaluate(() => ({
    katex: typeof window.katex === 'object',
    auto: typeof window.renderMathInElement === 'function',
    rendered: document.querySelectorAll('.katex').length,
    errs: document.querySelectorAll('.katex-error').length,
    /* An untrusted \htmlData renders as literal red text rather than an error,
       so the only way to catch it is to look for the command in the output. */
    literalHtml: [...document.querySelectorAll('.derive__layer, .katex')]
      .filter((el) => /\\html(Data|Class|Id|Style)/.test(el.textContent)).length
  }));
  if (!math.katex || !math.auto) fail(`${tag} KaTeX did not load`);
  if (math.errs) fail(`${tag} ${math.errs} equation(s) failed to typeset`);
  if (math.literalHtml) fail(`${tag} ${math.literalHtml} tagged term(s) rendered as literal \\htmlData`);
  if (p.id !== 'index' && !p.stub && math.rendered < 5) fail(`${tag} only ${math.rendered} equations rendered`);

  /* Maths that never made it through the renderer, left as source in the page. */
  const leftovers = await page.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const el = n.parentElement;
      if (!el || el.closest('.katex, script, style, code, pre, textarea, .derive__tex')) continue;
      const t = n.nodeValue;
      if (!t.trim()) continue;
      if (/\$|\\frac|\\sqrt|\\begin\{/.test(t) || /\b[a-zA-Z]\^\d/.test(t)) {
        out.push(t.trim().slice(0, 60));
      }
    }
    return out.slice(0, 6);
  });
  if (leftovers.length) fail(`${tag} unrendered maths in the prose: ${JSON.stringify(leftovers)}`);

  /* Navigation. */
  const nav = await page.evaluate(() => ({
    links: document.querySelectorAll('.sidebar__link').length,
    current: document.querySelectorAll('.sidebar__link[aria-current="page"]').length,
    currentHref: (document.querySelector('.sidebar__link[aria-current="page"]') || {}).getAttribute
      ? document.querySelector('.sidebar__link[aria-current="page"]').getAttribute('href') : null,
    pager: document.querySelectorAll('.pager a').length,
    subs: document.querySelectorAll('.sidebar__sub a').length,
    heads: document.querySelectorAll('main h2[id]').length
  }));
  if (nav.links !== 14) fail(`${tag} sidebar has ${nav.links} sections, expected 14`);
  if (nav.current !== 1) fail(`${tag} ${nav.current} sidebar entries marked as the current page`);
  else if (!nav.currentHref.endsWith(basename(p.file))) fail(`${tag} the wrong sidebar entry is current`);
  if (nav.subs !== nav.heads) fail(`${tag} ${nav.subs} sub-navigation links for ${nav.heads} headings`);
  const wantPager = (p.id === 'index' || p.id === 'ref') ? 1 : 2;
  if (nav.pager !== wantPager) fail(`${tag} pager has ${nav.pager} links, expected ${wantPager}`);

  /* Scroll the whole page, then ask what happened. */
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const overflow = await sweep(page, height, 900);
  if (overflow > 1) fail(`${tag} ${overflow}px of horizontal overflow at 1440`);

  const scenes = await page.evaluate(() => {
    const l = window.__scenes || [];
    return {
      hosts: document.querySelectorAll('[data-scene]').length,
      mounted: l.length,
      errored: l.filter((m) => m.errored).map((m) => m.id),
      unreached: l.filter((m) => m.maxP < 0.98).map((m) => m.id + ' (' + m.maxP.toFixed(2) + ')')
    };
  });
  if (scenes.mounted !== scenes.hosts) fail(`${tag} ${scenes.mounted} of ${scenes.hosts} demos mounted`);
  if (scenes.errored.length) fail(`${tag} demos threw while drawing: ${scenes.errored.join(', ')}`);
  if (scenes.unreached.length) fail(`${tag} demos never reached the end of their range: ${scenes.unreached.join(', ')}`);

  /* The derivations: did every one run to its last step, and do the moving
     clones land exactly on the real glyphs at both ends of every transition? */
  let derive = null;
  if (hasDerive) {
    derive = await page.evaluate(() => {
      const D = window.__derive;
      return { list: D.list, stats: D.stats, align: D.check() };
    });
    const stalled = derive.list.filter((d) => d.mode === 'stage' && !d.reachedEnd);
    if (stalled.length) {
      fail(`${tag} derivations that never reached their last step: ` +
           stalled.map((d) => `${d.id} (${d.maxStep}/${d.N - 1})`).join(', '));
    }
    const derrs = derive.list.filter((d) => d.errors.length);
    if (derrs.length) fail(`${tag} derivation errors: ` + derrs.map((d) => d.id + ': ' + d.errors[0].message).join('; '));
    const missing = [];
    derive.list.forEach((d) => d.steps.forEach((s, i) => {
      if (s.missing.length) missing.push(`${d.id} step ${i + 1}: ${s.missing.join(', ')}`);
    }));
    if (missing.length) fail(`${tag} tagged terms that never reached the page: ${missing.slice(0, 4).join(' | ')}`);
    /* Resting clones are placed by measurement and then corrected, so this
       should be a small fraction of a pixel. Anything approaching a whole pixel
       means a clone has lost styling its original got from an ancestor. */
    const bad = derive.align.filter((a) => a.worst0 > 0.3 || a.worst1 > 0.3 || a.invisible > 0);
    if (bad.length) {
      fail(`${tag} moving terms do not line up with the glyphs they replace: ` +
           bad.slice(0, 4).map((a) => `${a.id} step ${a.k + 1}→${a.k + 2} off by ${Math.max(a.worst0, a.worst1)}px ` +
             `on "${a.culprit0 || a.culprit1}"` + (a.invisible ? `, ${a.invisible} invisible` : '')).join('; '));
    } else if (derive.align.length) {
      const worst = Math.max(...derive.align.map((a) => Math.max(a.worst0, a.worst1)));
      pass(`${tag} ${derive.align.length} transitions align within ${worst.toFixed(2)}px`);
    }
    if (derive.stats.worstMs > 20) note(`${tag} slowest derivation frame ${derive.stats.worstMs.toFixed(1)}ms`);

    /* The "all steps at once" panels render lazily when first opened, so open
       them all and check they actually filled with typeset steps. */
    const ladders = await page.evaluate(async () => {
      const ds = [...document.querySelectorAll('details.derive__all')];
      ds.forEach((d) => { d.open = true; });
      await new Promise((r) => setTimeout(r, 350));
      const out = { panels: ds.length, empty: 0, untypeset: 0 };
      ds.forEach((d) => {
        const steps = d.querySelectorAll('.step');
        if (steps.length < 2) out.empty++;
        if (d.querySelectorAll('.katex').length < steps.length) out.untypeset++;
      });
      ds.forEach((d) => { d.open = false; });
      return out;
    });
    if (ladders.empty) fail(`${tag} ${ladders.empty} "all steps at once" panel(s) did not fill`);
    if (ladders.untypeset) fail(`${tag} ${ladders.untypeset} "all steps at once" panel(s) left maths untypeset`);
  }

  /* Demos: each must draw something, and react when its first control moves. */
  const figs = await page.$$('.fig--demo');
  let demoReport = [];
  for (const fig of figs) {
    const id = await fig.$eval('[data-scene]', (e) => e.getAttribute('data-scene')).catch(() => '?');
    await fig.scrollIntoViewIfNeeded();
    await page.waitForTimeout(320);
    const drew = await fig.evaluate((f) => {
      const cv = f.querySelector('canvas');
      if (cv) {
        const g = cv.getContext('2d');
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        let on = 0;
        for (let i = 3; i < d.length; i += 4 * 37) if (d[i] > 8) on++;
        return on > 20;
      }
      const sv = f.querySelector('svg');
      if (!sv) return false;
      let box;
      try { box = sv.getBBox(); } catch (e) { return false; }
      return sv.querySelectorAll('*').length > 4 && box.width > 1 && box.height > 1;
    });
    if (!drew) fail(`${tag} demo "${id}" drew nothing`);

    const snap = async () => fig.evaluate((f) => {
      const cv = f.querySelector('canvas');
      if (cv) {
        const g = cv.getContext('2d');
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        let h = 0;
        for (let i = 0; i < d.length; i += 4 * 17) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 3] * 7) | 0;
        return 'c' + h;
      }
      const sv = f.querySelector('svg');
      if (!sv) return 'none';
      return 's' + sv.innerHTML.length + ':' +
        [...f.querySelectorAll('svg path, svg line, svg circle, svg text')]
          .slice(0, 60).map((e) => (e.getAttribute('d') || '') + (e.getAttribute('x1') || '') +
            (e.getAttribute('cx') || '') + (e.textContent || '')).join('|').length;
    });

    const before = await snap();
    const range = await fig.$('input[type=range]');
    let reacted = null;
    if (range) {
      await range.evaluate((el) => {
        const min = Number(el.min), max = Number(el.max), cur = Number(el.value);
        el.value = String(Math.abs(cur - max) > Math.abs(cur - min) ? max : min);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForTimeout(260);
      reacted = (await snap()) !== before;
      if (!reacted) fail(`${tag} demo "${id}" ignored its first slider`);
    }
    /* Buttons must at least not throw. */
    for (const b of await fig.$$('.btn')) { await b.click(); await page.waitForTimeout(60); }
    demoReport.push({ id, drew, reacted });
  }

  /* The theme switch. */
  const themeOk = await page.evaluate(() => {
    const b = document.querySelector('.theme-toggle');
    if (!b) return false;
    b.click();
    const first = document.documentElement.getAttribute('data-theme');
    b.click();
    const second = document.documentElement.getAttribute('data-theme');
    return !!first && !!second && first !== second;
  });
  if (!themeOk) fail(`${tag} the theme switch did not change the theme`);

  if (errors.length) fail(`${tag} console errors:\n        ` + errors.slice(0, 6).join('\n        '));
  if (warnings.length) fail(`${tag} KaTeX warnings:\n        ` + warnings.slice(0, 4).join('\n        '));
  if (external.size) fail(`${tag} unexpected network requests: ${[...external].slice(0, 3).join(', ')}`);

  /* Screenshots, for looking at rather than counting. */
  const shots = quick ? 5 : 14;
  for (let i = 0; i <= shots; i++) {
    const y = Math.round((i / shots) * Math.max(0, height - 900));
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(110);
    await page.screenshot({ path: join(dir, `${theme}-${String(i).padStart(2, '0')}.png`) });
  }

  await ctx.close();
  return { math, scenes, derive, demos: demoReport, overflow };
}

async function checkNarrow(browser, p, width) {
  const { ctx, page, errors } = await openPage(browser, p, { viewport: { width, height: 780 } });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const worst = await sweep(page, height, 780);
  if (worst > 1) fail(`[${p.id}/${width}px] ${worst}px of horizontal overflow`);
  if (width === 390) {
    /* The drawer slides, so each step has to be given time to finish before
       its position means anything. */
    const hidden = await page.evaluate(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 1);
    await page.click('.nav-toggle');
    await page.waitForTimeout(420);
    const open = await page.evaluate(() => ({
      onScreen: document.querySelector('.sidebar').getBoundingClientRect().right > 40,
      expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'true'
    }));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(420);
    const closed = await page.evaluate(() =>
      document.body.dataset.nav !== 'open' && document.querySelector('.sidebar').getBoundingClientRect().right <= 1);
    if (!hidden) fail(`[${p.id}/390px] the contents drawer is not tucked away`);
    if (!open.onScreen || !open.expanded) fail(`[${p.id}/390px] the contents button does not open the drawer`);
    if (!closed) fail(`[${p.id}/390px] Escape does not close the drawer`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: join(SHOTS, p.id, 'narrow-390.png') });
  }
  if (errors.length) fail(`[${p.id}/${width}px] console errors: ${errors.slice(0, 3).join(' | ')}`);
  await ctx.close();
}

async function checkReduced(browser, p) {
  const { ctx, page, errors } = await openPage(browser, p, { viewport: { width: 1280, height: 860 }, reduced: true });
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.35, behavior: 'instant' }));
  await page.waitForTimeout(380);
  const r = await page.evaluate(() => {
    let faded = 0;
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.top < window.innerHeight && b.bottom > 0 && parseFloat(getComputedStyle(el).opacity) < 0.9) faded++;
    });
    return {
      faded,
      stages: document.querySelectorAll('.stage--derive').length,
      ladders: document.querySelectorAll('.derive--static').length,
      overlays: document.querySelectorAll('.derive__fx').length
    };
  });
  if (r.faded) fail(`[${p.id}/reduced] ${r.faded} things on screen are still faded out`);
  if (r.stages || r.overlays) fail(`[${p.id}/reduced] derivations still animate`);
  if (errors.length) fail(`[${p.id}/reduced] console errors: ${errors.slice(0, 3).join(' | ')}`);
  await page.screenshot({ path: join(SHOTS, p.id, 'reduced-motion.png') });
  await ctx.close();
  return r;
}

/* Opened with no network at all: the pages must still be readable. */
async function checkOffline(browser, p) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark' });
  await ctx.route(/^https:\/\//, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + p.path, { waitUntil: 'load' });
  await page.waitForSelector('html[data-site-ready="1"]', { timeout: 20000 });
  const r = await page.evaluate(() => ({
    katex: document.documentElement.getAttribute('data-katex'),
    ladders: document.querySelectorAll('.derive--static').length,
    source: document.querySelectorAll('.derive__tex').length,
    scenes: (window.__scenes || []).length
  }));
  if (r.katex !== 'missing') fail(`[${p.id}/offline] the page did not notice KaTeX was unavailable`);
  if (errors.length) fail(`[${p.id}/offline] page errors: ${errors.slice(0, 3).join(' | ')}`);
  await page.screenshot({ path: join(SHOTS, p.id, 'offline.png') });
  await ctx.close();
  return r;
}

/* ------------------------------------------------------------- run it --- */

console.log('\nphysics');
const A = assertPhysMath();
console.log('\nfiles');
staticChecks(A);

const pages = pageFiles(A).filter((p) => existsSync(p.path));
if (!pages.length) {
  console.log('\nno pages to open yet.');
  process.exit(failures.length ? 1 : 0);
}

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
const report = [];
for (const p of pages) {
  console.log(`\n${p.file}`);
  const before = failures.length;
  const dark = await checkPage(browser, p, 'dark');
  if (!quick) {
    await checkPage(browser, p, 'light');
    await checkNarrow(browser, p, 390);
    await checkNarrow(browser, p, 768);
    await checkReduced(browser, p);
    await checkOffline(browser, p);
  }
  const clean = failures.length === before;
  if (clean) pass(`${p.file} passed`);
  report.push({
    id: p.id, file: p.file, ok: clean, stub: p.stub,
    equations: dark.math.rendered,
    demos: dark.demos,
    derives: dark.derive ? dark.derive.list.filter((d) => d.mode === 'stage').length : 0,
    derivesOk: dark.derive ? dark.derive.list.every((d) => d.mode !== 'stage' || d.reachedEnd) : true
  });
}
await browser.close();

/* ------------------------------------------------------------- report --- */

const tick = (b) => (b ? '✅' : '❌');
console.log('\n' + '-'.repeat(80));
console.log('page                              renders  demos                     derivations');
console.log('-'.repeat(80));
for (const r of report) {
  const demos = r.demos.length
    ? r.demos.map((d) => `${d.id} ${tick(d.drew && d.reacted !== false)}`).join('  ')
    : '—';
  console.log(
    r.file.padEnd(33) + ' ' +
    (r.stub ? 'to do  ' : tick(r.ok) + '     ') + '  ' +
    demos.padEnd(25) + ' ' +
    (r.derives ? `${r.derives} ${tick(r.derivesOk)}` : (r.stub ? '' : '—'))
  );
}
console.log('-'.repeat(80));
console.log(`screenshots in .verify/site/`);
if (notes.length) console.log(`${notes.length} note(s)`);
if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nall checks passed.');
