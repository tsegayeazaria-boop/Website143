/* ============================================================================
   viz/lib/bench.js — masses on springs.

   The apparatus behind most of Part 2 and, quietly, behind a good deal of
   Part 1: §1.2's differential equations are a mass on a spring, and §1.3's
   eigenvectors are the two ways a pair of coupled masses can move. Where a
   derivation is secretly about this object, this draws it beside the algebra,
   moving in step.

   Drawn short and wide, because that is the shape of a bench, and because it
   has to sit above a graph without stealing its height.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.svg, V = A.viz, M = A.math;

  V.bench = function (root, opts) {
    opts = opts || {};
    var W = opts.w || V.W, H = opts.h || 84;
    var svg = V.frame(root, opts.label || 'Masses on springs.', W, H);
    var n = opts.n || 1;
    var pad = 16;
    var yM = H * (opts.yFrac == null ? 0.52 : opts.yFrac);
    var box = opts.box || Math.min(20, H * 0.3);
    var wallW = 7;
    /* Rest positions, evenly spread between the walls. */
    var x0 = pad + wallW, x1 = W - pad - wallW;
    var rest = [];
    for (var i = 0; i < n; i++) rest.push(x0 + (x1 - x0) * (i + 1) / (n + 1));
    var scale = opts.scale || (x1 - x0) / (n + 1) * 0.42;

    var gBack = S.g({}); svg.appendChild(gBack);
    var gSpring = S.g({}); svg.appendChild(gSpring);
    var gMass = S.g({}); svg.appendChild(gMass);
    var gArrow = S.g({}); svg.appendChild(gArrow);
    var gText = S.g({}); svg.appendChild(gText);

    /* The floor, and the two walls unless there is nothing to anchor to — a
       free particle has no spring and nothing to push against, and drawing
       walls it never touches would be a lie about the equation. */
    gBack.appendChild(S.line(pad, yM + box / 2 + 3, W - pad, yM + box / 2 + 3, 's-axis'));
    if (opts.walls !== false) {
      [[pad, 1], [W - pad, -1]].forEach(function (p) {
        gBack.appendChild(S.rect(p[1] > 0 ? p[0] : p[0] - wallW, yM - box, wallW, box * 2, 's-fill-i'));
      });
    }

    var springs = V.pool(gSpring, function () { return S.path('', 's-ghost'); });
    var masses = V.pool(gMass, function () { return S.rect(0, 0, 0, 0, 's-fill-w'); });
    var dashes = V.pool(gBack, function () { return S.line(0, 0, 0, 0, 's-grid s-dash'); });
    var arrows = V.pool(gArrow, function () { return S.arrow(svg, 0, 0, 0, 0, 'q'); });
    var marks = V.pool(gArrow, function () { return S.path('', 's-ghost'); });
    var texts = V.pool(gText, function () { return S.text(0, 0, '', 's-lbl', 'middle'); });

    function posOf(st, i) { return rest[i] + (st.x[i] || 0) * scale; }

    function set(st) {
      st = st || {};
      st.x = st.x || [];

      /* Springs: wall to first mass, mass to mass, last mass to wall. A spring
         whose length has not changed is drawn slack, which is how a cancelled
         term looks when it is a real object. */
      var ends = [x0];
      for (var i = 0; i < n; i++) ends.push(posOf(st, i));
      ends.push(x1);
      for (var j = 0; opts.springs !== false && j <= n; j++) {
        var el = springs.use('s' + j);
        var a = ends[j] + (j === 0 ? 0 : box / 2);
        var b = ends[j + 1] - (j === n ? 0 : box / 2);
        var natural = (j === 0 ? rest[0] - x0 : j === n ? x1 - rest[n - 1] : rest[j] - rest[j - 1]) - box;
        var stretched = Math.abs((b - a) - natural);
        var slackHere = st.slack && st.slack.indexOf(j) !== -1;
        el.setAttribute('class', (slackHere && stretched < 1.5 ? 's-grid' : 's-ghost'));
        S.setD(el, S.springD(a, b, yM, 7, Math.max(3, box * 0.28)));
        S.op(el, slackHere && stretched < 1.5 ? 0.4 : 1);
      }
      springs.sweep();

      for (var m = 0; m < n; m++) {
        var px = posOf(st, m);
        var mk = masses.use('m' + m);
        mk.setAttribute('class', V.fillClass((st.tone && st.tone[m]) || 'wave'));
        mk.setAttribute('x', (px - box / 2).toFixed(2));
        mk.setAttribute('y', (yM - box / 2).toFixed(2));
        mk.setAttribute('width', String(box)); mk.setAttribute('height', String(box));
        var dl = dashes.use('d' + m);
        S.setArrow(dl, rest[m], yM - box, rest[m], yM + box);
        S.op(dl, st.rest === false ? 0 : 0.8);
      }
      masses.sweep(); dashes.sweep();

      (st.arrows || []).forEach(function (a) {
        var el = arrows.use('a' + a.key);
        var uid = svg.dataset.arrows;
        el.setAttribute('marker-end', 'url(#' + uid + '-' + V.tone(a.tone) + ')');
        el.setAttribute('class', V.strokeClass(a.tone));
        el.setAttribute('stroke-width', '2.2');
        var px2 = posOf(st, a.on || 0);
        var y = yM + (a.above ? -box / 2 - 7 : box / 2 + 7);
        S.setArrow(el, px2, y, px2 + a.dx * scale, y);
        S.op(el, (a.op == null ? 1 : a.op) * (a._in == null ? 1 : a._in));
      });
      arrows.sweep();

      (st.calipers || []).forEach(function (c) {
        var el = marks.use('c' + c.key);
        el.setAttribute('class', V.strokeClass(c.tone));
        S.setD(el, V.marks.caliperD(posOf(st, c.from), posOf(st, c.to), yM - box / 2 - 12, 3.5));
        S.op(el, (c.op == null ? 1 : c.op) * (c._in == null ? 1 : c._in));
      });
      marks.sweep();

      (st.notes || []).forEach(function (t) {
        var el = texts.use('t' + t.key);
        el.setAttribute('class', V.labelClass(t.tone));
        el.setAttribute('text-anchor', t.cap ? 'end' : (t.anchor || 'middle'));
        el.setAttribute('x', (t.cap ? W - 6 : t.on != null ? posOf(st, t.on) : t.px).toFixed(2));
        el.setAttribute('y', (t.cap ? 12 : t.py != null ? t.py : yM + (t.dy || 0)).toFixed(2));
        if (el.textContent !== t.text) el.textContent = t.text;
        S.op(el, (t.op == null ? 1 : t.op) * (t._in == null ? 1 : t._in));
      });
      texts.sweep();
    }

    void M;
    return { svg: svg, set: set, rest: rest, scale: scale, yM: yM };
  };
})(window.A = window.A || {});
