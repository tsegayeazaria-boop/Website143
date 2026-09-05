/* ============================================================================
   viz/lib/curves.js — anything plotted against an axis.

   Functions on a shared axis with their sum drawn heavy; shaded areas with the
   positive and negative parts coloured apart, so a cancellation is drawn
   rather than described; bars, for a sampled sum on its way to becoming an
   integral or a spectrum; and the marks that measure them.

   Curves arrive as sampled y-values on a fixed grid, never as functions, for
   one reason: two arrays of the same length interpolate elementwise, so a
   curve morphs into any other curve as the derivation moves between steps,
   with no per-picture animation code at all.
   ========================================================================= */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, V = A.viz;

  V.N = 96;                     /* samples per curve — smooth at these widths */

  /* Sample a function onto the shared grid, ready to be tweened. */
  V.samp = function (fn, x0, x1, n) {
    var N = n || V.N, out = new Array(N + 1);
    for (var i = 0; i <= N; i++) out[i] = fn(x0 + (x1 - x0) * (i / N), i / N);
    return out;
  };

  V.curves = function (root, opts) {
    opts = opts || {};
    var W = opts.w || V.W, H = opts.h || V.H;
    var svg = V.frame(root, opts.label || 'A curve on an axis.', W, H);
    var rows = opts.rows || 1;
    var padL = opts.padL == null ? 26 : opts.padL;
    var padR = opts.padR == null ? 10 : opts.padR;
    var padT = opts.padT == null ? 12 : opts.padT;
    var padB = opts.padB == null ? 20 : opts.padB;
    var gapY = opts.gapY == null ? 16 : opts.gapY;
    var rowH = (H - padT - padB - gapY * (rows - 1)) / rows;
    var x0 = opts.x0 == null ? 0 : opts.x0, x1 = opts.x1 == null ? 1 : opts.x1;

    function rowTop(r) { return padT + r * (rowH + gapY); }
    function PX(x) { return padL + (x - x0) / (x1 - x0) * (W - padL - padR); }
    /* Each row carries its own vertical range, so a residual strip and the
       curves above it can be read on their own scales. */
    var yr = opts.ranges || [[-1, 1]];
    function PY(y, r) {
      var R = yr[r] || yr[0], t = rowTop(r);
      return t + rowH - (y - R[0]) / (R[1] - R[0]) * rowH;
    }

    var gAxis = S.g({}); svg.appendChild(gAxis);
    var gFill = S.g({}); svg.appendChild(gFill);
    var gBar = S.g({}); svg.appendChild(gBar);
    var gCurve = S.g({}); svg.appendChild(gCurve);
    var gMark = S.g({}); svg.appendChild(gMark);
    var gText = S.g({}); svg.appendChild(gText);

    for (var r = 0; r < rows; r++) {
      var zero = M.clamp(0, (yr[r] || yr[0])[0], (yr[r] || yr[0])[1]);
      gAxis.appendChild(S.line(PX(x0), PY(zero, r), PX(x1), PY(zero, r), 's-axis'));
      gAxis.appendChild(S.line(PX(x0), rowTop(r), PX(x0), rowTop(r) + rowH, 's-axis'));
    }
    if (opts.xLabel) gAxis.appendChild(S.text(W - padR, H - 6, opts.xLabel, 's-lbl', 'end'));

    var fills = V.pool(gFill, function () { return S.path('', 's-shade'); });
    var bars = V.pool(gBar, function () { return S.rect(0, 0, 0, 0, 's-shade'); });
    var paths = V.pool(gCurve, function () { return S.path('', 's-wave'); });
    var marks = V.pool(gMark, function () { return S.path('', 's-ghost'); });
    var dots = V.pool(gMark, function () { return S.circle(0, 0, 3.2, 's-fill-i'); });   /* keyed apart from marks */
    var texts = V.pool(gText, function () { return S.text(0, 0, '', 's-lbl', 'middle'); });

    function pts(ys, r) {
      var n = ys.length - 1, out = new Array(ys.length);
      for (var i = 0; i <= n; i++) out[i] = [PX(x0 + (x1 - x0) * i / n), PY(ys[i], r)];
      return out;
    }

    /* Split a sampled curve at its zero crossings so the part above the axis
       and the part below can be shaded in different colours. Interpolating the
       crossing matters: without it the shaded lobes overlap the axis and the
       cancellation stops being exact to the eye. */
    function lobes(ys, r) {
      var n = ys.length - 1, runs = [], cur = null, i;
      for (i = 0; i <= n; i++) {
        var x = x0 + (x1 - x0) * i / n, y = ys[i], sign = y >= 0 ? 1 : -1;
        if (!cur || cur.sign !== sign) {
          if (cur && i > 0) {
            var yp = ys[i - 1], xp = x0 + (x1 - x0) * (i - 1) / n;
            var t = Math.abs(yp) / (Math.abs(yp) + Math.abs(y) || 1);
            var xc = xp + (x - xp) * t;
            cur.pts.push([PX(xc), PY(0, r)]);
            runs.push(cur);
            cur = { sign: sign, pts: [[PX(xc), PY(0, r)]] };
          } else {
            cur = { sign: sign, pts: [] };
          }
        }
        cur.pts.push([PX(x), PY(y, r)]);
      }
      if (cur) runs.push(cur);
      return runs;
    }

    function set(st) {
      st = st || {};
      (st.fills || []).forEach(function (c) {
        var row = c.row || 0, base = PY(c.base == null ? 0 : c.base, row);
        if (c.split) {
          lobes(c.pts, row).forEach(function (run, j) {
            var el = fills.use('f' + c.key + '_' + j);
            el.setAttribute('class', V.fillClass(run.sign > 0 ? (c.tone || 'wave') : (c.negTone || 'fail')) + ' s-shade');
            S.setD(el, S.areaD(run.pts, base));
            S.op(el, (c.op == null ? 0.22 : c.op) * (c._in == null ? 1 : c._in));
          });
        } else {
          var el = fills.use('f' + c.key);
          el.setAttribute('class', V.fillClass(c.tone) + ' s-shade');
          S.setD(el, S.areaD(pts(c.pts, row), base));
          S.op(el, (c.op == null ? 0.2 : c.op) * (c._in == null ? 1 : c._in));
        }
      });
      fills.sweep();

      (st.bars || []).forEach(function (b) {
        var el = bars.use('b' + b.key);
        var row = b.row || 0, base = PY(b.base == null ? 0 : b.base, row);
        var top = PY(b.y, row);
        var half = Math.abs(PX(x0 + (b.w || 0)) - PX(x0)) / 2;
        el.setAttribute('class', V.fillClass(b.tone) + ' s-shade');
        el.setAttribute('x', (PX(b.x) - half).toFixed(2));
        el.setAttribute('y', Math.min(top, base).toFixed(2));
        el.setAttribute('width', Math.max(0.5, half * 2).toFixed(2));
        el.setAttribute('height', Math.abs(base - top).toFixed(2));
        S.op(el, (b.op == null ? 0.55 : b.op) * (b._in == null ? 1 : b._in));
      });
      bars.sweep();

      (st.curves || []).forEach(function (c) {
        var el = paths.use('c' + c.key);
        el.setAttribute('class', V.strokeClass(c.tone) + (c.dash ? ' s-dash' : ''));
        el.setAttribute('stroke-width', String(c.width || 2));
        S.setD(el, S.polyD(pts(c.pts, c.row || 0)));
        S.op(el, (c.op == null ? 1 : c.op) * (c._in == null ? 1 : c._in));
      });
      paths.sweep();

      (st.marks || []).forEach(function (m) {
        var row = m.row || 0, el, d;
        if (m.kind === 'dot') {
          el = dots.use('p' + m.key);
          el.setAttribute('class', V.fillClass(m.tone));
          el.setAttribute('cx', PX(m.x).toFixed(2));
          el.setAttribute('cy', PY(m.y || 0, row).toFixed(2));
          el.setAttribute('r', String(m.r || 3.2));
        } else {
          el = marks.use('k' + m.key);
          el.setAttribute('class', V.strokeClass(m.tone) + (m.dash === false ? '' : ' s-dash'));
          if (m.kind === 'vline') {
            d = 'M' + PX(m.x).toFixed(2) + ' ' + rowTop(row) + 'L' + PX(m.x).toFixed(2) + ' ' + (rowTop(row) + rowH);
          } else if (m.kind === 'hline') {
            d = 'M' + PX(x0).toFixed(2) + ' ' + PY(m.y, row).toFixed(2) + 'L' + PX(x1).toFixed(2) + ' ' + PY(m.y, row).toFixed(2);
          } else if (m.kind === 'caliper') {
            d = V.marks.caliperD(PX(m.x0), PX(m.x1), PY(m.y || 0, row), m.tick);
          } else if (m.kind === 'seg') {
            /* A straight segment between two points in data coordinates — a
               tangent, a chord, a construction line. Sampling one as a curve
               would force it to span the whole axis. */
            d = 'M' + PX(m.x0).toFixed(2) + ' ' + PY(m.y0, row).toFixed(2) +
                'L' + PX(m.x1).toFixed(2) + ' ' + PY(m.y1, row).toFixed(2);
          } else if (m.kind === 'vcaliper') {
            d = V.marks.vCaliperD(PY(m.y0, row), PY(m.y1, row), PX(m.x), m.tick);
          } else {
            d = V.marks.braceD(PX(m.x0), PX(m.x1), PY(m.y || 0, row), m.depth);
          }
          S.setD(el, d);
        }
        S.op(el, (m.op == null ? 1 : m.op) * (m._in == null ? 1 : m._in));
      });
      marks.sweep(); dots.sweep();

      (st.notes || []).forEach(function (t) {
        var el = texts.use('t' + t.key);
        el.setAttribute('class', V.labelClass(t.tone));
        /* A caption goes top-right, where no axis label ever is. Saying
           `cap: true` is how a picture asks for that, rather than every
           picture guessing at coordinates that depend on its own centring. */
        el.setAttribute('text-anchor', t.cap ? 'end' : (t.anchor || 'middle'));
        /* A caption belongs at a fixed corner of the picture, not at a place
           in the data that the data may later cover up. */
        el.setAttribute('x', (t.cap ? W - 8 : t.px != null ? t.px : PX(t.x)).toFixed(2));
        el.setAttribute('y', (t.cap ? 13 : t.py != null ? t.py : PY(t.y || 0, t.row || 0) + (t.dy || 0)).toFixed(2));
        if (el.textContent !== t.text) el.textContent = t.text;
        S.op(el, (t.op == null ? 1 : t.op) * (t._in == null ? 1 : t._in));
      });
      texts.sweep();
    }

    return { svg: svg, set: set, px: PX, py: PY, rowH: rowH, rowTop: rowTop, x0: x0, x1: x1 };
  };
})(window.A = window.A || {});
