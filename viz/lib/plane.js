/* ============================================================================
   viz/lib/plane.js — arrows in a plane.

   The workhorse of Part 1: an arrow is a vector, a complex number, a phasor,
   an amplitude, depending only on what the axes are called. It draws arrows
   from a shared tail or chained tip-to-tail, the angle arcs between them, the
   dashed legs that read off components, shaded triangles and parallelograms,
   and a basis grid that can be turned.

   Merged from demos/vector-pictures.js, which owned the turnable basis and
   the components-computed-by-projection, and demos/complex-multiply.js, which
   owned the arcs and the unit circle. Both now draw through this.
   ========================================================================= */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, V = A.viz;

  V.plane = function (root, opts) {
    opts = opts || {};
    var W = opts.w || V.W, H = opts.h || V.H;
    var svg = V.frame(root, opts.label || 'A plane with arrows.', W, H);
    var unit = opts.unit || Math.min(W, H) / 6.4;
    var cx = opts.cx == null ? W * 0.5 : opts.cx;
    var cy = opts.cy == null ? H * 0.5 : opts.cy;
    var PX = function (x) { return cx + x * unit; };
    var PY = function (y) { return cy - y * unit; };

    /* Painting order is the reading order: grid, shading, legs, arrows, marks,
       labels. Anything that names a thing sits above the thing it names. */
    var gGrid = S.g({}); svg.appendChild(gGrid);
    var gShade = S.g({}); svg.appendChild(gShade);
    var gArc = S.g({}); svg.appendChild(gArc);
    var gLeg = S.g({}); svg.appendChild(gLeg);
    var gArrow = S.g({}); svg.appendChild(gArrow);
    var gMark = S.g({}); svg.appendChild(gMark);
    var gDot = S.g({}); svg.appendChild(gDot);
    var gText = S.g({}); svg.appendChild(gText);

    var axisH = S.line(0, 0, 0, 0, 's-axis'), axisV = S.line(0, 0, 0, 0, 's-axis');
    gGrid.appendChild(axisH); gGrid.appendChild(axisV);
    var ring = S.el('circle', { cx: PX(0), cy: PY(0), r: unit, class: 's-ghost s-dash' });
    gGrid.appendChild(ring);
    var xLab = S.text(0, 0, opts.xLabel || '', 's-lbl', 'end');
    var yLab = S.text(0, 0, opts.yLabel || '', 's-lbl', 'start');
    gText.appendChild(xLab); gText.appendChild(yLab);

    /* Enough lines to read the deformation, not so many that the grid competes
       with the arrows: these pictures are 300px wide, not 900. */
    var span = Math.min(6, Math.ceil(Math.max(W, H) / unit) + 1);
    function gridFamily(cls) {
      var out = [];
      for (var i = -span; i <= span; i++) {
        var a = S.line(0, 0, 0, 0, cls), b = S.line(0, 0, 0, 0, cls);
        gGrid.appendChild(a); gGrid.appendChild(b);
        out.push([i, a, b]);
      }
      return out;
    }
    /* Two grids: where the plane started, drawn faintly, and where the matrix
       has put it. Seeing both at once is the whole content of "a matrix is a
       function" — the same lines, somewhere else. */
    var ghostLines = gridFamily('s-grid s-ghost-grid');
    var gridLines = gridFamily('s-grid');

    var shades = V.pool(gShade, function () { return S.path('', 's-grid'); });
    var arcs = V.pool(gArc, function () { return S.path('', 's-ghost'); });
    var legs = V.pool(gLeg, function () { return S.line(0, 0, 0, 0, 's-ghost s-dash'); });
    var arrows = V.pool(gArrow, function () { return S.arrow(svg, 0, 0, 0, 0, 'i'); });
    var marks = V.pool(gMark, function () { return S.path('', 's-ghost'); });
    var dots = V.pool(gDot, function () { return S.circle(0, 0, 3.2, 's-fill-i'); });
    var texts = V.pool(gText, function () { return S.text(0, 0, '', 's-lbl', 'middle'); });

    /* The grid is carried by a 2x2 map, whose columns are where the two basis
       arrows land. The identity gives ordinary graph paper; a rotation turns
       it; a singular map flattens it onto a line, which is what "the plane
       gets crushed" looks like. */
    function setGrid(lines, map, op) {
      var c1 = [map[0], map[2]], c2 = [map[1], map[3]];
      var L = span + 1;
      lines.forEach(function (g) {
        var n = g[0];
        if (op <= 0.002) { S.op(g[1], 0); S.op(g[2], 0); return; }
        S.op(g[1], op); S.op(g[2], op);
        S.setArrow(g[1], PX(c1[0] * n - c2[0] * L), PY(c1[1] * n - c2[1] * L),
                         PX(c1[0] * n + c2[0] * L), PY(c1[1] * n + c2[1] * L));
        S.setArrow(g[2], PX(c2[0] * n - c1[0] * L), PY(c2[1] * n - c1[1] * L),
                         PX(c2[0] * n + c1[0] * L), PY(c2[1] * n + c1[1] * L));
      });
    }
    var I = [1, 0, 0, 1];

    /* Axes stay put whatever the basis does: they are the room, not the frame
       being used to describe it. A picture that is a bare dissection of shapes
       has no axes to speak of and turns them off. */
    S.setArrow(axisH, 8, PY(0), W - 8, PY(0));
    S.setArrow(axisV, PX(0), 8, PX(0), H - 8);
    if (opts.axes === false) { S.op(axisH, 0); S.op(axisV, 0); }
    xLab.setAttribute('x', W - 10); xLab.setAttribute('y', PY(0) - 6);
    yLab.setAttribute('x', PX(0) + 6); yLab.setAttribute('y', 16);

    function set(st) {
      st = st || {};
      setGrid(ghostLines, st.ghost || I, st.ghostOp == null ? (st.ghost ? 1 : 0) : st.ghostOp);
      setGrid(gridLines, st.map || I, st.grid ? (st.gridOp == null ? 1 : st.gridOp) : 0);
      S.op(ring, st.circle ? (st.circleOp == null ? 1 : st.circleOp) : 0);
      if (st.circle) ring.setAttribute('r', (st.circle * unit).toFixed(2));

      (st.shade || []).forEach(function (s) {
        var el = shades.use('s' + s.key);
        el.setAttribute('class', V.fillClass(s.tone) + ' s-shade');
        S.setD(el, S.polyD((s.pts || []).map(function (p) { return [PX(p[0]), PY(p[1])]; })) + 'Z');
        S.op(el, (s.op == null ? 0.16 : s.op) * (s._in == null ? 1 : s._in));
      });
      shades.sweep();

      (st.arcs || []).forEach(function (a) {
        var el = arcs.use('a' + a.key);
        el.setAttribute('class', V.strokeClass(a.tone));
        el.setAttribute('stroke-opacity', '0.75');
        S.setD(el, V.marks.arcD(PX(a.ox || 0), PY(a.oy || 0), (a.r || 0.6) * unit, a.a0 || 0, a.a1 || 0));
        S.op(el, (a.op == null ? 1 : a.op) * (a._in == null ? 1 : a._in));
      });
      arcs.sweep();

      /* A direction rather than a vector: the whole line through the origin,
         which is what an eigenvector really names. */
      (st.rays || []).forEach(function (r) {
        var el = legs.use('r' + r.key);
        var n = M.hypot(r.x || 0, r.y || 0) || 1;
        var L = span + 1;
        el.setAttribute('class', V.strokeClass(r.tone) + ' s-dash');
        S.setArrow(el, PX(-r.x / n * L), PY(-r.y / n * L), PX(r.x / n * L), PY(r.y / n * L));
        S.op(el, (r.op == null ? 0.7 : r.op) * (r._in == null ? 1 : r._in));
      });

      (st.legs || []).forEach(function (g) {
        var el = legs.use('g' + g.key);
        el.setAttribute('class', V.strokeClass(g.tone) + ' s-dash');
        S.setArrow(el, PX(g.x0 || 0), PY(g.y0 || 0), PX(g.x1 || 0), PY(g.y1 || 0));
        S.op(el, (g.op == null ? 0.85 : g.op) * (g._in == null ? 1 : g._in));
      });
      legs.sweep();

      (st.arrows || []).forEach(function (v) {
        var el = arrows.use('v' + v.key);
        var tone = V.tone(v.tone);
        var uid = svg.dataset.arrows;
        el.setAttribute('marker-end', 'url(#' + uid + '-' + tone + ')');
        el.setAttribute('class', V.strokeClass(v.tone) + (v.dash ? ' s-dash' : ''));
        el.setAttribute('stroke-width', String(v.width || 2.4));
        S.setArrow(el, PX(v.ox || 0), PY(v.oy || 0), PX(v.x || 0), PY(v.y || 0));
        S.op(el, (v.op == null ? 1 : v.op) * (v._in == null ? 1 : v._in));
      });
      arrows.sweep();

      (st.marks || []).forEach(function (m) {
        var el = marks.use('m' + m.key);
        el.setAttribute('class', V.strokeClass(m.tone));
        S.setD(el, m.kind === 'right'
          ? V.marks.rightAngleD(PX(m.x || 0), PY(m.y || 0), m.a0 || 0, m.a1 || Math.PI / 2, m.s || 9)
          : V.marks.caliperD(PX(m.x0 || 0), PX(m.x1 || 0), PY(m.y || 0), m.tick || 4));
        S.op(el, (m.op == null ? 1 : m.op) * (m._in == null ? 1 : m._in));
      });
      marks.sweep();

      (st.dots || []).forEach(function (p) {
        var el = dots.use('d' + p.key);
        el.setAttribute('class', V.fillClass(p.tone));
        el.setAttribute('cx', PX(p.x || 0).toFixed(2));
        el.setAttribute('cy', PY(p.y || 0).toFixed(2));
        el.setAttribute('r', String(p.r || 3.2));
        S.op(el, (p.op == null ? 1 : p.op) * (p._in == null ? 1 : p._in));
      });
      dots.sweep();

      (st.notes || []).forEach(function (t) {
        var el = texts.use('t' + t.key);
        el.setAttribute('class', V.labelClass(t.tone));
        el.setAttribute('text-anchor', t.anchor || 'middle');
        /* A caption belongs at a fixed corner of the picture, not at a place in
           the plane that the drawing may later cover. */
        el.setAttribute('x', (t.px != null ? t.px : PX(t.x || 0)).toFixed(2));
        el.setAttribute('y', (t.py != null ? t.py : PY(t.y || 0) + (t.dy || 0)).toFixed(2));
        if (el.textContent !== t.text) el.textContent = t.text;
        S.op(el, (t.op == null ? 1 : t.op) * (t._in == null ? 1 : t._in));
      });
      texts.sweep();
    }

    return { svg: svg, set: set, px: PX, py: PY, unit: unit, cx: cx, cy: cy };
  };
})(window.A = window.A || {});
