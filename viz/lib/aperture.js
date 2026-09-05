/* ============================================================================
   viz/lib/aperture.js — barrier, openings, rays, screen, pattern.

   The bench of §2.7 and §2.8. Light leaves one or two openings in a barrier,
   travels to a movable point on a distant screen, and the difference in the
   two path lengths decides whether the point is bright. Everything that
   argument needs is here: the perpendicular foot that isolates the extra path,
   the fan out to a chosen direction, the painted strip the reader is really
   looking at, and the curve underneath it.

   Coordinates: x runs 0 at the barrier to 1 at the screen; y is measured in
   half-screens, so a point at y = 1 is at the top of the screen.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.svg, V = A.viz, M = A.math;

  V.aperture = function (root, opts) {
    opts = opts || {};
    var W = opts.w || V.W, H = opts.h || V.H;
    var svg = V.frame(root, opts.label || 'A barrier, a screen, and the paths between them.', W, H);
    var padX = 18, padY = 14;
    /* The screen is pulled in from the right edge to leave a gutter: the
       painted strip and the intensity curve both live to the right of it, and
       without the room they run off the picture. */
    var bx = padX + 6, sx = W - padX - 46;
    var cy = H * 0.5, half = H * 0.5 - padY;
    function PX(x) { return bx + (sx - bx) * x; }
    function PY(y) { return cy - y * half; }

    var gBack = S.g({}); svg.appendChild(gBack);
    var gPaint = S.g({}); svg.appendChild(gPaint);
    var gRay = S.g({}); svg.appendChild(gRay);
    var gBar = S.g({}); svg.appendChild(gBar);
    var gMark = S.g({}); svg.appendChild(gMark);
    var gText = S.g({}); svg.appendChild(gText);

    /* The screen: a fixed line, because it is the thing everything else is
       measured against. */
    gBack.appendChild(S.line(sx, PY(1), sx, PY(-1), 's-axis'));

    var bars = V.pool(gBar, function () { return S.rect(0, 0, 0, 0, 's-fill-m'); });
    var paint = V.pool(gPaint, function () { return S.rect(0, 0, 0, 0, 's-shade'); });
    var rays = V.pool(gRay, function () { return S.line(0, 0, 0, 0, 's-wave'); });
    var fans = V.pool(gRay, function () { return S.path('', 's-shade'); });
    var marks = V.pool(gMark, function () { return S.path('', 's-ghost'); });
    var dots = V.pool(gMark, function () { return S.circle(0, 0, 3, 's-fill-i'); });
    var curves = V.pool(gMark, function () { return S.path('', 's-wave'); });
    var texts = V.pool(gText, function () { return S.text(0, 0, '', 's-lbl', 'middle'); });

    function set(st) {
      st = st || {};
      var slits = st.slits || [];

      /* The barrier is drawn as what is left of it: the solid stretches
         between the openings. */
      var edges = [1];
      slits.forEach(function (s) { edges.push(s.y + s.w / 2, s.y - s.w / 2); });
      edges.push(-1);
      for (var i = 0; i < edges.length; i += 2) {
        var el = bars.use('b' + i);
        var y0 = PY(edges[i]), y1 = PY(edges[i + 1]);
        el.setAttribute('x', String(bx - 3)); el.setAttribute('y', Math.min(y0, y1).toFixed(2));
        el.setAttribute('width', '6'); el.setAttribute('height', Math.abs(y1 - y0).toFixed(2));
        S.op(el, st.barrier == null ? 1 : st.barrier);
      }
      bars.sweep();

      (st.fan || []).forEach(function (f) {
        var el = fans.use('f' + f.key);
        el.setAttribute('class', V.fillClass(f.tone) + ' s-shade');
        S.setD(el, S.polyD([[PX(0), PY(f.from || 0)], [PX(1), PY(f.y0)], [PX(1), PY(f.y1)]]) + 'Z');
        S.op(el, (f.op == null ? 0.14 : f.op) * (f._in == null ? 1 : f._in));
      });
      fans.sweep();

      (st.rays || []).forEach(function (r) {
        var el = rays.use('r' + r.key);
        el.setAttribute('class', V.strokeClass(r.tone) + (r.dash ? ' s-dash' : ''));
        el.setAttribute('stroke-width', String(r.width || 1.6));
        S.setArrow(el, PX(r.x0 == null ? 0 : r.x0), PY(r.y0), PX(r.x1 == null ? 1 : r.x1), PY(r.y1));
        S.op(el, (r.op == null ? 1 : r.op) * (r._in == null ? 1 : r._in));
      });
      rays.sweep();

      /* The screen, painted with what a detector there would register. */
      (st.pattern || []).forEach(function (p, i) {
        var el = paint.use('p' + i);
        el.setAttribute('class', V.fillClass(p.tone || 'wave') + ' s-shade');
        el.setAttribute('x', (sx + 3).toFixed(2));
        el.setAttribute('y', PY(p.y1).toFixed(2));
        el.setAttribute('width', String(st.paintW || 9));
        el.setAttribute('height', Math.abs(PY(p.y0) - PY(p.y1)).toFixed(2));
        S.op(el, M.clamp(p.i, 0, 1) * (st.paintOp == null ? 1 : st.paintOp));
      });
      paint.sweep();

      /* The intensity itself, plotted sideways so it lies along the screen. */
      (st.curves || []).forEach(function (c) {
        var el = curves.use('c' + c.key);
        el.setAttribute('class', V.strokeClass(c.tone));
        el.setAttribute('stroke-width', String(c.width || 1.8));
        var n = c.pts.length - 1;
        el.setAttribute('d', S.polyD(c.pts.map(function (v, i2) {
          return [sx + 15 + v * (c.scale == null ? 26 : c.scale), PY(1 - 2 * i2 / n)];
        })));
        S.op(el, (c.op == null ? 1 : c.op) * (c._in == null ? 1 : c._in));
      });
      curves.sweep();

      (st.marks || []).forEach(function (m) {
        var el = marks.use('m' + m.key);
        el.setAttribute('class', V.strokeClass(m.tone) + (m.dash === false ? '' : ' s-dash'));
        if (m.kind === 'seg') {
          S.setD(el, 'M' + PX(m.x0).toFixed(2) + ' ' + PY(m.y0).toFixed(2) +
                     'L' + PX(m.x1).toFixed(2) + ' ' + PY(m.y1).toFixed(2));
        } else if (m.kind === 'arc') {
          S.setD(el, V.marks.arcD(PX(m.x || 0), PY(m.y || 0), m.r || 20, m.a0 || 0, m.a1 || 0));
        } else {
          S.setD(el, V.marks.vCaliperD(PY(m.y0), PY(m.y1), PX(m.x), m.tick));
        }
        S.op(el, (m.op == null ? 1 : m.op) * (m._in == null ? 1 : m._in));
      });
      marks.sweep();

      (st.dots || []).forEach(function (d) {
        var el = dots.use('d' + d.key);
        el.setAttribute('class', V.fillClass(d.tone));
        el.setAttribute('cx', PX(d.x).toFixed(2)); el.setAttribute('cy', PY(d.y).toFixed(2));
        el.setAttribute('r', String(d.r || 3));
        S.op(el, (d.op == null ? 1 : d.op) * (d._in == null ? 1 : d._in));
      });
      dots.sweep();

      (st.notes || []).forEach(function (t) {
        var el = texts.use('t' + t.key);
        el.setAttribute('class', V.labelClass(t.tone));
        el.setAttribute('text-anchor', t.cap ? 'end' : (t.anchor || 'middle'));
        el.setAttribute('x', (t.cap ? W - 6 : PX(t.x)).toFixed(2));
        el.setAttribute('y', (t.cap ? 13 : PY(t.y) + (t.dy || 0)).toFixed(2));
        if (el.textContent !== t.text) el.textContent = t.text;
        S.op(el, (t.op == null ? 1 : t.op) * (t._in == null ? 1 : t._in));
      });
      texts.sweep();
    }

    return { svg: svg, set: set, px: PX, py: PY, bx: bx, sx: sx };
  };
})(window.A = window.A || {});
