/* ============================================================================
   derive.js — animated derivations.

   A derivation is written as a list of equation states. As you scroll, the
   equation morphs from one state to the next: every term that survives slides
   from where it was to where it goes, terms that die fade out, new terms fade
   in. Nothing is a video and nothing is pre-baked — the motion is computed
   from the two rendered equations, so editing the LaTeX changes the animation.

   How it works, in one paragraph. Each step is rendered once by KaTeX into its
   own absolutely positioned layer. Every visible piece of a layer — a tagged
   term, a glyph, a fraction bar, a radical — is collected as a "unit" with its
   ink rectangle. Units in consecutive steps are matched: tagged ones by their
   \k{} key, the rest by a longest-common-subsequence over their text, read in
   reading order rather than DOM order (KaTeX lays fractions out denominator
   first). During a transition both real layers are hidden and an overlay of
   cloned units is shown instead, each clone translated and scaled from its old
   rectangle to its new one. At the ends of a transition the clones sit exactly
   on top of the real glyphs — within a pixel, asserted by verify-site.mjs —
   so the handover is invisible.

   Authoring grammar: see README.md.
   ========================================================================= */
(function (A) {
  'use strict';

  var M = A.math;
  var D = A.derive = {};
  var list = [];
  var seq = 0;
  var stats = { frames: 0, worstMs: 0, totalMs: 0 };

  /* Classes that draw a line rather than a glyph. KaTeX renamed most of its
     structural classes in 0.17, so detection below leans on text nodes, svg
     children and painted borders instead; this list is only a fast path. */
  var LINE_CLASSES = ['frac-line', 'overline-line', 'underline-line', 'katex-rule',
                      'katex-hline', 'katex-hdashline', 'sout', 'katex-sout', 'vertical-separator'];
  var FONT_CLASSES = ['mathnormal', 'mathrm', 'mathit', 'mathbf', 'boldsymbol', 'mathcal',
                      'mathbb', 'mathfrak', 'mathscr', 'mathsf', 'mathtt', 'amsrm',
                      'textrm', 'textit', 'textbf', 'textsf', 'texttt', 'mainrm'];

  /* ================================================================== parse */

  function parse(text, attrs) {
    var d = {
      id: attrs.id || ('derivation-' + (++seq)),
      title: attrs.title || '',
      steps: [],
      errors: []
    };
    var chunks = text.split(/^[ \t]*---[ \t]*$/m);
    chunks.forEach(function (chunk, i) {
      var tex = [], note = [], hl = [], arc = [], noarc = [], result = false;
      chunk.split('\n').forEach(function (raw) {
        var line = raw.replace(/\s+$/, '');
        if (!line.trim()) { if (note.length) note.push(''); return; }
        var t = line.trim();
        if (t.charAt(0) === '>') { note.push(t.slice(1).trim()); return; }
        if (t.charAt(0) === '!') {
          var m2 = t.slice(1).trim().match(/^(\w+)\s*(.*)$/);
          if (!m2) return;
          var arg = (m2[2] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          if (m2[1] === 'hl') hl = hl.concat(arg);
          else if (m2[1] === 'arc') arc = arc.concat(arg);
          else if (m2[1] === 'noarc') noarc = noarc.concat(arg);
          else if (m2[1] === 'result') result = true;
          else console.warn('[derive] ' + d.id + ': unknown directive "' + m2[1] + '"');
          return;
        }
        tex.push(line);
      });
      var src = tex.join('\n').trim();
      if (!src) {
        if (chunk.trim()) d.errors.push({ step: i, message: 'step has a note but no equation' });
        return;
      }
      var declared = [];
      var re = /\\k\{([^}]*)\}/g, mm;
      while ((mm = re.exec(src))) {
        var key = mm[1].trim();
        if (!/^[A-Za-z0-9_-]+$/.test(key)) {
          d.errors.push({ step: i, message: 'bad tag key ' + JSON.stringify(mm[1]) });
        } else if (declared.indexOf(key) === -1) declared.push(key);
      }
      d.steps.push({
        tex: src,
        noteHTML: note.join('\n').replace(/\n\n+/g, '</p><p>').replace(/\n/g, ' '),
        hl: hl, arc: arc, noarc: noarc, result: result,
        declared: declared, found: []
      });
    });
    if (d.steps.length < 2) d.errors.push({ step: -1, message: 'a derivation needs at least two steps' });
    return d;
  }

  /* ================================================================== build */

  function elt(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function ladder(d) {
    var wrap = elt('div', 'steps');
    wrap.appendChild(elt('div', 'steps__title', 'All ' + d.steps.length + ' steps at once'));
    d.steps.forEach(function (s) {
      var st = elt('div', 'step');
      var math = elt('div', 'step__math');
      if (window.katex) {
        try {
          window.katex.render(s.tex, math, A.katexOptions({ displayMode: true, output: 'html' }));
        } catch (err) { math.appendChild(elt('code', 'derive__tex', escapeHTML(s.tex))); }
      } else {
        math.appendChild(elt('code', 'derive__tex', escapeHTML(s.tex)));
      }
      st.appendChild(math);
      if (s.noteHTML) st.appendChild(elt('div', 'step__why', '<p>' + s.noteHTML + '</p>'));
      wrap.appendChild(st);
    });
    return wrap;
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* The fallback everybody eventually meets: reduced motion, or no KaTeX
     because the page was opened without a network. Show every step at once. */
  function buildStatic(d, scriptEl, why) {
    var host = elt('div', 'derive--static measure');
    if (d.title) host.appendChild(elt('div', 'kicker kicker--muted', escapeHTML(d.title)));
    if (why) host.appendChild(elt('p', 'derive__note', why));
    host.appendChild(ladder(d));
    scriptEl.parentNode.replaceChild(host, scriptEl);
    d.mode = 'static';
    d.el = { host: host };
  }

  function buildStage(d, scriptEl) {
    var stage = elt('section', 'stage stage--derive');
    stage.id = 'derive-' + d.id;
    stage.setAttribute('data-derive', d.id);

    var pin = elt('div', 'stage__pin');
    var canvas = elt('div', 'stage__canvas');
    var box = elt('div', 'derive');

    var hud = elt('div', 'derive__hud');
    hud.appendChild(elt('span', 'kicker', escapeHTML(d.title || 'Derivation')));
    var count = elt('span', 'derive__count', 'step 1 / ' + d.steps.length);
    count.setAttribute('aria-live', 'polite');
    hud.appendChild(count);
    var dots = elt('div', 'derive__dots');
    var dotEls = d.steps.map(function (s, i) {
      var b = elt('button', 'derive__dot');
      b.type = 'button';
      b.setAttribute('aria-label', 'Step ' + (i + 1));
      if (i === 0) b.setAttribute('aria-current', 'step');
      dots.appendChild(b);
      return b;
    });
    hud.appendChild(dots);

    var board = elt('div', 'derive__board');
    board.setAttribute('aria-hidden', 'true');
    var layers = d.steps.map(function (s, i) {
      var L = elt('div', 'derive__layer');
      L.setAttribute('data-step', String(i));
      if (s.result) L.setAttribute('data-result', '1');
      try {
        window.katex.render(s.tex, L, A.katexOptions({
          displayMode: true, output: 'html', throwOnError: true
        }));
      } catch (err) {
        d.errors.push({ step: i, message: err.message });
        console.error('[derive] ' + d.id + ' step ' + (i + 1) + ': ' + err.message);
        L.appendChild(elt('span', 'derive__error', escapeHTML('step ' + (i + 1) + ': ' + err.message)));
      }
      /* Record which declared tags actually made it into the DOM, and colour
         the ones this step asks to highlight. */
      var tags = [].slice.call(L.querySelectorAll('[data-k]'));
      s.found = tags.map(function (t) { return (t.getAttribute('data-k') || '').trim(); });
      if (s.hl.length) {
        tags.forEach(function (t) {
          if (s.hl.indexOf((t.getAttribute('data-k') || '').trim()) !== -1) t.setAttribute('data-hl', '1');
        });
      }
      if (i === 0) L.setAttribute('data-on', '1');
      board.appendChild(L);
      return { el: L, scale: 1, natW: 0, natH: 0, units: null };
    });
    var fx = elt('div', 'derive__fx katex');
    board.appendChild(fx);

    box.appendChild(hud);
    box.appendChild(board);
    canvas.appendChild(box);
    pin.appendChild(canvas);
    stage.appendChild(pin);

    var scroll = elt('div', 'stage__scroll');
    var panels = elt('div', 'stage__panels');
    var panelEls = d.steps.map(function (s, i) {
      var p = elt('div', 'stage__panel');
      p.setAttribute('data-step', String(i));
      p.appendChild(elt('span', 'kicker kicker--muted',
        'Step ' + (i + 1) + ' of ' + d.steps.length + (s.result ? ' · result' : '')));
      p.appendChild(elt('div', null, '<p>' + (s.noteHTML || '') + '</p>'));
      panels.appendChild(p);
      return p;
    });
    scroll.appendChild(panels);
    stage.appendChild(scroll);

    /* The same content as a plain ladder, for review, printing, and for
       anyone who would rather read than scroll. */
    var det = elt('details', 'derive__all answer measure');
    det.appendChild(elt('summary', null, 'All steps at once'));
    var body = elt('div', 'answer__body');
    det.appendChild(body);
    var filled = false;
    det.addEventListener('toggle', function () {
      if (det.open && !filled) { filled = true; body.appendChild(ladder(d)); }
    });

    var frag = document.createDocumentFragment();
    frag.appendChild(stage);
    frag.appendChild(det);
    scriptEl.parentNode.replaceChild(frag, scriptEl);

    d.mode = 'stage';
    d.el = { stage: stage, board: board, fx: fx, count: count, dots: dotEls, panels: panelEls };
    d.layers = layers;
    d.trans = new Array(d.steps.length - 1);
    d.smooth = 0; d.lastT = -1; d.shown = -1; d.maxStep = 0; d.dirty = true;
    d.hudStep = -1;
    d.mobile = window.matchMedia('(max-width: 59.999rem)').matches;

    dotEls.forEach(function (b, i) {
      b.addEventListener('click', function () {
        panelEls[i].scrollIntoView({
          block: 'center',
          behavior: A.reduced && A.reduced() ? 'auto' : 'smooth'
        });
      });
    });
  }

  /* ================================================================ layout */

  function layoutBoard(d) {
    var board = d.el.board;
    var avail = Math.max(80, board.clientWidth - 8);
    var maxH = 0;
    d.layers.forEach(function (L) {
      L.el.style.setProperty('--s', '1');
      L.natW = L.el.offsetWidth;
      L.natH = L.el.offsetHeight;
    });
    d.layers.forEach(function (L) {
      L.scale = L.natW > avail ? avail / L.natW : 1;
      L.el.style.setProperty('--s', String(L.scale));
      maxH = Math.max(maxH, L.natH * L.scale);
      L.units = null;
    });
    board.style.height = Math.ceil(maxH + 4) + 'px';
    /* Every cached rectangle is now stale, so throw the transitions away. */
    for (var i = 0; i < d.trans.length; i++) {
      if (d.trans[i]) { d.trans[i].el.remove(); d.trans[i] = null; }
    }
    d.applied = null;
  }

  /* ========================================================== unit finding */

  function ownText(el) {
    var s = '';
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) s += n.nodeValue;
    return s.replace(/[​\s]+/g, '');
  }
  function paints(el) {
    var c = getComputedStyle(el);
    return ['Top', 'Bottom', 'Left', 'Right'].some(function (s) {
      return parseFloat(c['border' + s + 'Width']) > 0 && c['border' + s + 'Style'] !== 'none';
    });
  }
  function fontSig(el) {
    for (var i = 0; i < FONT_CLASSES.length; i++) {
      if (el.classList.contains(FONT_CLASSES[i])) return FONT_CLASSES[i];
    }
    return '';
  }
  function visualRole(el) {
    var c = el.classList;
    for (var i = 0; i < LINE_CLASSES.length; i++) if (c.contains(LINE_CLASSES[i])) return LINE_CLASSES[i];
    if (el.closest('.sqrt')) return 'sqrt';
    if (el.closest('.katex-accent') || el.closest('.accent')) return 'accent';
    if (el.closest('.delimsizing') || el.closest('.katex-stretchy')) return 'delim';
    if (el.closest('.mfrac')) return 'frac-line';
    return 'mark';
  }

  /* Walk a rendered layer and pick out everything that puts ink on the page.
     Tagged terms stop the walk; everything else resolves to a glyph run, an
     svg (radical, big bracket, accent) or a painted rule. */
  function collectUnits(root, stopAtTags) {
    var out = [];
    (function walk(parent) {
      for (var el = parent.firstElementChild; el; el = el.nextElementSibling) {
        var cl = el.classList;
        if (cl.contains('katex-mathml')) continue;
        if (stopAtTags && el.hasAttribute('data-k')) {
          out.push({ el: el, kind: 'tag', key: (el.getAttribute('data-k') || '').trim(),
                     text: el.textContent.replace(/[​\s]+/g, ''), sig: '' });
          continue;
        }
        if (el.tagName.toLowerCase() === 'svg') continue;
        if (el.firstElementChild && el.firstElementChild.tagName.toLowerCase() === 'svg') {
          out.push({ el: el, kind: 'svg', key: 'svg:' + visualRole(el), text: '', sig: '' });
          continue;
        }
        var t = ownText(el);
        if (t) { out.push({ el: el, kind: 'text', key: t, text: t, sig: fontSig(el) }); continue; }
        if (!el.firstElementChild) {
          if (paints(el)) out.push({ el: el, kind: 'line', key: 'line:' + visualRole(el), text: '', sig: '' });
          continue;
        }
        walk(el);
      }
    })(root.querySelector('.katex-html') || root);
    return out;
  }

  /* A tagged term's own box includes the spacing KaTeX puts around it and
     misses tall inline-block children, so measure the ink instead. */
  function inkRect(u) {
    if (u.kind !== 'tag') return u.el.getBoundingClientRect();
    var leaves = collectUnits(u.el, false);
    if (!leaves.length) return u.el.getBoundingClientRect();
    var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    leaves.forEach(function (x) {
      var q = x.el.getBoundingClientRect();
      if (q.width <= 0 && q.height <= 0) return;
      l = Math.min(l, q.left); t = Math.min(t, q.top);
      r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    });
    if (!isFinite(l)) return u.el.getBoundingClientRect();
    return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
  }

  function rowOf(el, root) {
    /* Inside an aligned block KaTeX emits column by column, so DOM order is
       not reading order. Recover the row from the vertical list index. */
    var cell = el.closest('.vlist > span');
    if (!cell || !root.contains(cell)) return 0;
    var vlist = cell.parentNode;
    return [].indexOf.call(vlist.children, cell);
  }

  function measureLayer(d, idx) {
    var L = d.layers[idx];
    if (L.units) return L.units;
    var b = d.el.board.getBoundingClientRect();
    var raw = collectUnits(L.el, true);
    var units = [];
    raw.forEach(function (u) {
      var r = inkRect(u);
      if (r.width < 0.4 && r.height < 0.4) return;
      var ps = getComputedStyle(u.el.parentNode);
      u.rect = { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
      u.cx = u.rect.x + u.rect.w / 2;
      u.cy = u.rect.y + u.rect.h / 2;
      u.fontPx = parseFloat(ps.fontSize) * L.scale;
      u.lineHeight = parseFloat(ps.lineHeight) * L.scale;
      u.row = rowOf(u.el, L.el);
      units.push(u);
    });
    units.sort(function (p, q) { return (p.row - q.row) || (p.cx - q.cx) || (p.cy - q.cy); });
    units.forEach(function (u, i) { u.order = i; });
    L.units = units;
    return units;
  }

  /* ============================================================== matching */

  function lcs(as, bs) {
    var n = as.length, m = bs.length, i, j;
    var L = [];
    for (i = 0; i <= n; i++) L.push(new Uint16Array(m + 1));
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        L[i][j] = as[i].key === bs[j].key ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      }
    }
    var out = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (as[i].key === bs[j].key) { out.push([as[i], bs[j]]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    return out;
  }

  /* Expand a tagged unit that has no partner into the things inside it, so a
     term can be one unit in the step that builds it and several in the step
     that takes it apart. */
  function descend(u, boardRect) {
    var inner = collectUnits(u.el, true);
    var out = [];
    inner.forEach(function (v) {
      var r = inkRect(v);
      if (r.width < 0.4 && r.height < 0.4) return;
      var ps = getComputedStyle(v.el.parentNode);
      v.rect = { x: r.left - boardRect.left, y: r.top - boardRect.top, w: r.width, h: r.height };
      v.cx = v.rect.x + v.rect.w / 2;
      v.cy = v.rect.y + v.rect.h / 2;
      v.fontPx = parseFloat(ps.fontSize) * u.layerScale;
      v.lineHeight = parseFloat(ps.lineHeight) * u.layerScale;
      v.row = u.row;
      out.push(v);
    });
    return out.length ? out : [u];
  }

  function match(d, ka, kb) {
    var boardRect = d.el.board.getBoundingClientRect();
    var as = measureLayer(d, ka).slice();
    var bs = measureLayer(d, kb).slice();
    as.forEach(function (u) { u.layerScale = d.layers[ka].scale; });
    bs.forEach(function (u) { u.layerScale = d.layers[kb].scale; });

    var pairs = [], usedA = [], usedB = [];

    function group(arr) {
      var g = {};
      arr.forEach(function (u) {
        if (u.kind !== 'tag') return;
        (g[u.key] = g[u.key] || []).push(u);
      });
      return g;
    }
    var ga = group(as), gb = group(bs);

    /* Tagged terms first: they are the author's statement about what is the
       same thing before and after, so they are never dropped. */
    Object.keys(ga).forEach(function (key) {
      if (!gb[key]) return;
      var xs = ga[key], ys = gb[key];
      var n = Math.max(xs.length, ys.length);
      for (var i = 0; i < n; i++) {
        var a = xs[Math.min(i, xs.length - 1)], b = ys[Math.min(i, ys.length - 1)];
        pairs.push({ a: a, b: b, split: xs.length < ys.length, merge: xs.length > ys.length, tagged: true });
        usedA.push(a); usedB.push(b);
      }
    });

    /* A tag with no partner becomes its contents. */
    var leftA = [], leftB = [];
    as.forEach(function (u) {
      if (usedA.indexOf(u) !== -1) return;
      leftA = leftA.concat(u.kind === 'tag' ? descend(u, boardRect) : [u]);
    });
    bs.forEach(function (u) {
      if (usedB.indexOf(u) !== -1) return;
      leftB = leftB.concat(u.kind === 'tag' ? descend(u, boardRect) : [u]);
    });
    /* Tagged units nested inside a descended tag can still pair by key. */
    var na = {}, nb = {};
    leftA.forEach(function (u) { if (u.kind === 'tag') (na[u.key] = na[u.key] || []).push(u); });
    leftB.forEach(function (u) { if (u.kind === 'tag') (nb[u.key] = nb[u.key] || []).push(u); });
    Object.keys(na).forEach(function (key) {
      if (!nb[key]) return;
      var xs = na[key], ys = nb[key], n = Math.max(xs.length, ys.length);
      for (var i = 0; i < n; i++) {
        var a = xs[Math.min(i, xs.length - 1)], b = ys[Math.min(i, ys.length - 1)];
        pairs.push({ a: a, b: b, split: xs.length < ys.length, merge: xs.length > ys.length, tagged: true });
        usedA.push(a); usedB.push(b);
      }
    });

    var restA = leftA.filter(function (u) { return usedA.indexOf(u) === -1 && u.kind !== 'tag'; });
    var restB = leftB.filter(function (u) { return usedB.indexOf(u) === -1 && u.kind !== 'tag'; });
    restA.sort(function (p, q) { return (p.row - q.row) || (p.cx - q.cx); });
    restB.sort(function (p, q) { return (p.row - q.row) || (p.cx - q.cx); });

    var boardW = d.el.board.clientWidth || 800;
    lcs(restA, restB).forEach(function (p) {
      var a = p[0], b = p[1];
      var travel = Math.abs(b.cx - a.cx) + Math.abs(b.cy - a.cy);
      var cap = Math.max(boardW * 0.45, 6 * (a.fontPx || 16));
      /* A glyph that would have to fly across the whole board is more likely a
         coincidence of spelling than the same symbol; let it fade instead. */
      if (travel > cap) return;
      pairs.push({ a: a, b: b, tagged: false });
      usedA.push(a); usedB.push(b);
    });

    return {
      pairs: pairs,
      outs: leftA.filter(function (u) { return usedA.indexOf(u) === -1; }),
      ins: leftB.filter(function (u) { return usedB.indexOf(u) === -1; })
    };
  }

  /* ============================================================ transitions */

  function cloneUnit(u, scale, fx) {
    var src = u.el;
    var cs = getComputedStyle(src);
    var ps = getComputedStyle(src.parentNode);
    var w = document.createElement('span');
    w.className = 'derive__u';
    /* The clone leaves its context behind, so the size it would have inherited
       has to be restated: parent font size times the layer's own scale, after
       which the unit's own sizing classes apply exactly once, as they did. */
    w.style.fontSize = (parseFloat(ps.fontSize) * scale) + 'px';
    w.style.lineHeight = (parseFloat(ps.lineHeight) * scale) + 'px';
    w.style.fontFamily = ps.fontFamily;
    w.style.fontStyle = ps.fontStyle;
    w.style.fontWeight = ps.fontWeight;
    w.style.letterSpacing = ps.letterSpacing;
    w.style.color = cs.color;
    var c = src.cloneNode(true);
    if (u.kind === 'line' || u.kind === 'svg') {
      /* Rules and radicals are drawn by rules that reach them through their
         ancestors — a fraction bar is a border, a radical tail is clipped by
         its wrapper. Neither ancestor exists here, so freeze the box. */
      c.style.display = 'inline-block';
      c.style.boxSizing = 'border-box';
      c.style.verticalAlign = 'top';
      c.style.width = u.rect.w + 'px';
      c.style.height = u.rect.h + 'px';
      c.style.overflow = 'hidden';
      c.style.position = 'relative';
      ['Top', 'Bottom', 'Left', 'Right'].forEach(function (s) {
        c.style['border' + s + 'Style'] = cs['border' + s + 'Style'];
        c.style['border' + s + 'Width'] = (parseFloat(cs['border' + s + 'Width']) * scale) + 'px';
      });
      c.style.backgroundColor = cs.backgroundColor;
    }
    w.appendChild(c);
    fx.appendChild(w);
    return { w: w, c: c, kindTag: u.kind === 'tag' };
  }

  function buildTransition(d, k) {
    var m = match(d, k, k + 1);
    var tr = elt('div', 'derive__tr');
    d.el.fx.appendChild(tr);
    var sa = d.layers[k].scale, sb = d.layers[k + 1].scale;
    var items = [];

    function add(u, scale, home, from, to, kind, arc) {
      home.x = home.cx - home.w / 2;
      home.y = home.cy - home.h / 2;
      var cl = cloneUnit(u, scale, tr);
      items.push({
        w: cl.w, c: cl.c, tagUnit: cl.kindTag, unit: u,
        home: home, from: from, to: to, kind: kind, arc: arc || 0,
        s0: 1, s1: 1
      });
    }

    m.pairs.forEach(function (p) {
      var a = p.a, b = p.b;
      var same = a.text === b.text && a.sig === b.sig && a.kind === b.kind && a.text !== '';
      var sameVisual = a.kind !== 'text' && a.kind !== 'tag' && a.key === b.key;
      var from = { cx: a.cx, cy: a.cy }, to = { cx: b.cx, cy: b.cy };
      var dx = to.cx - from.cx, dy = to.cy - from.cy;
      var f = a.fontPx || 16;
      var arc = (Math.abs(dx) > 3 * f && Math.abs(dy) < 0.5 * f)
        ? Math.min(1.1 * f, 0.25 * Math.abs(dx)) : 0;
      if (same || sameVisual) {
        add(a, sa, { cx: a.cx, cy: a.cy, w: a.rect.w, h: a.rect.h }, from, to, p.merge ? 'mergeout' : 'move', arc);
        var it = items[items.length - 1];
        it.s1 = a.rect.h > 0.5 ? M.clamp(b.rect.h / a.rect.h, 0.4, 2.5) : 1;
      } else {
        /* The term changes as it travels: run both spellings along the same
           path and cross-fade between them. */
        add(a, sa, { cx: a.cx, cy: a.cy, w: a.rect.w, h: a.rect.h }, from, to, 'xout', arc);
        items[items.length - 1].s1 = a.rect.h > 0.5 ? M.clamp(b.rect.h / a.rect.h, 0.4, 2.5) : 1;
        add(b, sb, { cx: b.cx, cy: b.cy, w: b.rect.w, h: b.rect.h }, from, to, 'xin', arc);
        items[items.length - 1].s0 = b.rect.h > 0.5 ? M.clamp(a.rect.h / b.rect.h, 0.4, 2.5) : 1;
      }
    });
    m.outs.forEach(function (u) {
      add(u, sa, { cx: u.cx, cy: u.cy, w: u.rect.w, h: u.rect.h }, { cx: u.cx, cy: u.cy }, { cx: u.cx, cy: u.cy }, 'out', 0);
    });
    m.ins.forEach(function (u) {
      add(u, sb, { cx: u.cx, cy: u.cy, w: u.rect.w, h: u.rect.h }, { cx: u.cx, cy: u.cy }, { cx: u.cx, cy: u.cy }, 'in', 0);
    });

    /* Place every clone by measuring rather than by arithmetic. Each starts at
       the overlay's origin; we read where its ink actually landed and shift the
       wrapper by exactly that much, so the clone ends up sitting on top of the
       glyph it came from whatever the browser did with the line box. */
    var ob = d.el.fx.getBoundingClientRect();
    items.forEach(function (it) {
      var r = it.tagUnit ? inkRect({ el: it.c, kind: 'tag' }) : it.c.getBoundingClientRect();
      var ox = r.left - ob.left, oy = r.top - ob.top;
      it.w.style.left = (it.home.x - ox) + 'px';
      it.w.style.top = (it.home.y - oy) + 'px';
      /* Scale about the ink's own centre, not the wrapper's corner. */
      it.w.style.transformOrigin = (ox + r.width / 2) + 'px ' + (oy + r.height / 2) + 'px';
    });

    d.trans[k] = { k: k, el: tr, items: items, counts: { pairs: m.pairs.length, outs: m.outs.length, ins: m.ins.length } };
    return d.trans[k];
  }

  function applyMorph(tr, f) {
    for (var i = 0; i < tr.items.length; i++) {
      var it = tr.items[i];
      var op = 1, s = 1, e = f;
      switch (it.kind) {
        case 'move':     s = M.lerp(1, it.s1, e); break;
        case 'xout':     s = M.lerp(1, it.s1, e); op = 1 - M.beat(e, 0.15, 0.60); break;
        case 'xin':      s = M.lerp(it.s0, 1, e); op = M.beat(e, 0.40, 0.85); break;
        case 'mergeout': s = M.lerp(1, it.s1, e); op = 1 - M.beat(e, 0.55, 0.98); break;
        case 'out':      op = 1 - M.beat(e, 0, 0.45); s = M.lerp(1, 0.92, M.beat(e, 0, 0.45)); break;
        case 'in':       op = M.beat(e, 0.55, 1); s = M.lerp(0.92, 1, M.beat(e, 0.55, 1)); break;
      }
      var cx = M.lerp(it.from.cx, it.to.cx, e);
      var cy = M.lerp(it.from.cy, it.to.cy, e) - it.arc * Math.sin(Math.PI * e);
      it.w.style.transform = 'translate(' + (cx - it.home.cx).toFixed(2) + 'px,' +
                             (cy - it.home.cy).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
      it.w.style.opacity = op.toFixed(3);
    }
  }

  /* ============================================================== progress */

  function rawFromPanels(d) {
    var vh = window.innerHeight;
    var zoneTop = d.mobile ? Math.max(0, d.el.board.getBoundingClientRect().bottom) : 0;
    var yf = 0.5 * (zoneTop + vh) + 0.05 * vh;
    var c = [], i;
    for (i = 0; i < d.el.panels.length; i++) {
      var r = d.el.panels[i].getBoundingClientRect();
      c.push(r.top + r.height / 2);
    }
    if (!c.length) return 0;
    if (yf <= c[0]) return 0;
    if (yf >= c[c.length - 1]) return c.length - 1;
    for (i = 0; i < c.length - 1; i++) {
      if (yf < c[i + 1]) return i + (yf - c[i]) / Math.max(1, c[i + 1] - c[i]);
    }
    return c.length - 1;
  }

  /* Each unit interval holds, then eases through the morph, then holds again,
     so a step is readable before and after it changes. */
  function stepAt(raw, N) {
    var k = Math.floor(raw);
    if (k >= N - 1) return { k: N - 1, f: 0 };
    if (k < 0) return { k: 0, f: 0 };
    return { k: k, f: M.easeInOut(M.beat(raw - k, 0.40, 0.88)) };
  }

  function hold(d, k) {
    if (d.shown === k && d.el.fx.getAttribute('data-on') !== '1') return;
    d.el.fx.setAttribute('data-on', '0');
    for (var i = 0; i < d.layers.length; i++) {
      d.layers[i].el.setAttribute('data-on', i === k ? '1' : '0');
    }
    d.shown = k;
    d.applied = null;
  }

  function morph(d, k, f) {
    var tr = d.trans[k] || buildTransition(d, k);
    if (d.shown !== -2 || d.activeTr !== tr) {
      for (var i = 0; i < d.layers.length; i++) d.layers[i].el.setAttribute('data-on', '0');
      for (var j = 0; j < d.trans.length; j++) {
        if (d.trans[j]) d.trans[j].el.setAttribute('data-on', d.trans[j] === tr ? '1' : '0');
      }
      d.el.fx.setAttribute('data-on', '1');
      d.shown = -2;
      d.activeTr = tr;
    }
    if (d.applied && d.applied.k === k && Math.abs(d.applied.f - f) < 1e-4) return;
    applyMorph(tr, f);
    d.applied = { k: k, f: f };
  }

  function setHud(d, k) {
    if (d.hudStep === k) return;
    d.hudStep = k;
    d.el.count.textContent = 'step ' + (k + 1) + ' / ' + d.steps.length;
    d.el.dots.forEach(function (b, i) {
      if (i === k) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
  }

  function frameFor(d) {
    return function (p, t) {
      var t0 = performance.now();
      if (d.dirty) { layoutBoard(d); d.dirty = false; }
      var raw = rawFromPanels(d);
      var dt = d.lastT < 0 ? 1 : t - d.lastT;
      d.lastT = t;
      if (dt > 0.25) d.smooth = raw;
      else d.smooth += (raw - d.smooth) * (1 - Math.exp(-Math.min(dt, 0.1) / 0.085));
      if (Math.abs(raw - d.smooth) < 0.0015) d.smooth = raw;

      /* Progress for the record comes from the unsmoothed target, so a test
         that scrolls in jumps sees exactly the steps it scrolled through. */
      var tgt = stepAt(raw, d.steps.length);
      var reached = tgt.f >= 0.999 ? tgt.k + 1 : tgt.k;
      if (reached > d.maxStep) d.maxStep = Math.min(reached, d.steps.length - 1);

      var s = stepAt(d.smooth, d.steps.length);
      if (s.f <= 0.004) hold(d, s.k);
      else if (s.f >= 0.996) hold(d, Math.min(s.k + 1, d.steps.length - 1));
      else morph(d, s.k, s.f);
      setHud(d, s.f < 0.5 ? s.k : Math.min(s.k + 1, d.steps.length - 1));

      var ms = performance.now() - t0;
      stats.frames++; stats.totalMs += ms;
      if (ms > stats.worstMs) stats.worstMs = ms;
    };
  }

  /* ================================================================ install */

  D.install = function () {
    var blocks = [].slice.call(document.querySelectorAll('script[type="text/x-derive"]'));
    var reduced = A.reduced && A.reduced();
    blocks.forEach(function (sc) {
      if (sc.dataset.mounted === '1') return;
      sc.dataset.mounted = '1';
      var d = parse(sc.textContent, { id: sc.dataset.id, title: sc.dataset.title });
      list.push(d);
      d.errors.forEach(function (e) {
        console.error('[derive] ' + d.id + (e.step >= 0 ? ' step ' + (e.step + 1) : '') + ': ' + e.message);
      });
      if (!window.katex) { buildStatic(d, sc, 'Equations are shown as LaTeX source: KaTeX could not be loaded.'); return; }
      if (reduced || d.steps.length < 2) { buildStatic(d, sc, null); return; }
      buildStage(d, sc);
      /* One scene per derivation, so the page's single animation loop drives
         it and only while it is on screen. */
      A.scene('derive:' + d.id, function (node, api) {
        api.onResize = function () { d.dirty = true; };
        return frameFor(d);
      });
      var hostNode = document.createElement('div');
      hostNode.setAttribute('data-scene', 'derive:' + d.id);
      hostNode.style.display = 'none';
      d.el.stage.appendChild(hostNode);
    });

    /* Fonts arrive after first paint and change every width, so everything
       measured before they land has to be measured again. */
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(D.invalidate);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', D.invalidate);
    }
    window.__derive.ready = true;
  };

  D.invalidate = function () {
    list.forEach(function (d) { if (d.mode === 'stage') d.dirty = true; });
  };

  /* ------------------------------------------------------- diagnostics ---- */
  /* The alignment check is the invariant the whole effect rests on: at each
     end of a transition the moving clones must sit exactly where the real
     glyphs are, or the handover between overlay and layer would flicker. */
  window.__derive = {
    ready: false,
    get list() {
      return list.map(function (d) {
        return {
          id: d.id, mode: d.mode, N: d.steps.length,
          maxStep: d.maxStep || 0, shown: d.shown,
          reachedEnd: (d.maxStep || 0) >= d.steps.length - 1,
          errors: d.errors,
          steps: d.steps.map(function (s) {
            return { declared: s.declared, missing: s.declared.filter(function (t) { return s.found.indexOf(t) === -1; }) };
          })
        };
      });
    },
    get stats() { return { frames: stats.frames, worstMs: stats.worstMs, meanMs: stats.frames ? stats.totalMs / stats.frames : 0 }; },
    check: function () {
      var out = [];
      list.forEach(function (d) {
        if (d.mode !== 'stage') return;
        if (d.dirty) { layoutBoard(d); d.dirty = false; }
        for (var k = 0; k < d.steps.length - 1; k++) {
          var tr = d.trans[k] || buildTransition(d, k);
          var ob = d.el.fx.getBoundingClientRect();
          var worst = [0, 0], invisible = 0;
          [0, 1].forEach(function (end) {
            applyMorph(tr, end);
            tr.items.forEach(function (it) {
              var aSide = it.kind !== 'xin' && it.kind !== 'in';
              if ((end === 0) !== aSide) return;
              var r = it.tagUnit ? inkRect({ el: it.c, kind: 'tag' }) : it.c.getBoundingClientRect();
              if (r.width < 0.4 && r.height < 0.4) { invisible++; return; }
              var cx = r.left - ob.left + r.width / 2, cy = r.top - ob.top + r.height / 2;
              var want = end === 0 ? it.from : it.to;
              var dd = Math.max(Math.abs(cx - want.cx), Math.abs(cy - want.cy));
              if (dd > worst[end]) worst[end] = dd;
            });
          });
          out.push({ id: d.id, k: k, items: tr.items.length, counts: tr.counts,
                     worst0: +worst[0].toFixed(3), worst1: +worst[1].toFixed(3), invisible: invisible });
        }
        d.applied = null;
      });
      return out;
    }
  };
})(window.A = window.A || {});
