/* §1.3 — a 2x2 matrix as a function you can watch. Four sliders set the matrix;
   the grid, the basis arrows and a draggable test vector are all transformed by
   the same multiplication the page derives, so the picture is the arithmetic. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('matrix-grid', function (root, api) {
    var W = 900, H = 470;
    var svg = S.root(W, H, 'A grid of the plane before and after a 2 by 2 matrix acts on it.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = W / 2, cy = H / 2 - 8, unit = 52;
    var PX = function (x) { return cx + x * unit; };
    var PY = function (y) { return cy - y * unit; };

    var a = 2, b = 1, c = 0, d = 1;
    var v = [1, 2];
    var showBefore = true;

    var gBefore = S.g({});
    var gAfter = S.g({});
    svg.appendChild(gBefore); svg.appendChild(gAfter);

    /* Grid lines are drawn as many sampled points so a curved-looking result
       would be visible if the transformation were not linear. It never is. */
    var N = 5;
    function gridPaths(mat) {
      var out = [], i, t, pts;
      for (i = -N; i <= N; i++) {
        pts = S.sample(24, -N, N, function (s) {
          var p = mat ? P.matVec(a, b, c, d, [s, i]) : [s, i];
          return [PX(p[0]), PY(p[1])];
        });
        out.push(pts);
        pts = S.sample(24, -N, N, function (s) {
          var p = mat ? P.matVec(a, b, c, d, [i, s]) : [i, s];
          return [PX(p[0]), PY(p[1])];
        });
        out.push(pts);
      }
      return out;
    }
    var beforeEls = gridPaths(false).map(function (pts) {
      var p = S.poly(pts, 's-grid');
      gBefore.appendChild(p);
      return p;
    });
    var afterEls = gridPaths(false).map(function () {
      var p = S.path('', 's-ghost');
      p.setAttribute('stroke-opacity', '0.5');
      gAfter.appendChild(p);
      return p;
    });

    var col1 = S.arrow(svg, 0, 0, 0, 0, 'w');
    var col2 = S.arrow(svg, 0, 0, 0, 0, 'q');
    col1.setAttribute('stroke-width', '3'); col2.setAttribute('stroke-width', '3');
    var e1g = S.arrow(svg, 0, 0, 0, 0, 'm');
    var e2g = S.arrow(svg, 0, 0, 0, 0, 'm');
    [e1g, e2g].forEach(function (e) { e.setAttribute('stroke-opacity', '0.45'); });
    svg.appendChild(e1g); svg.appendChild(e2g);
    svg.appendChild(col1); svg.appendChild(col2);

    var col1L = S.text(0, 0, '', 's-lbl-w', 'start');
    var col2L = S.text(0, 0, '', 's-lbl-q', 'start');
    svg.appendChild(col1L); svg.appendChild(col2L);

    var vBefore = S.arrow(svg, 0, 0, 0, 0, 'm');
    vBefore.setAttribute('stroke-dasharray', '4 4');
    var vAfter = S.arrow(svg, 0, 0, 0, 0, 'p');
    vAfter.setAttribute('stroke-width', '2.5');
    svg.appendChild(vBefore); svg.appendChild(vAfter);
    var vHandle = S.circle(0, 0, 8, 's-fill-p s-grab');
    svg.appendChild(vHandle);
    var vL = S.text(0, 0, '', 's-lbl-p', 'start');
    svg.appendChild(vL);

    var host = api.controls || root;
    var sliders = {};
    [['a', 'a  (top left)', 2], ['b', 'b  (top right)', 1],
     ['c', 'c  (bottom left)', 0], ['d', 'd  (bottom right)', 1]].forEach(function (row) {
      sliders[row[0]] = A.ui.slider(host, {
        label: row[1], name: row[0], min: -2.5, max: 2.5, step: 0.05, value: row[2],
        fmt: function (x) { return x.toFixed(2); },
        onInput: function (x) {
          if (row[0] === 'a') a = x; else if (row[0] === 'b') b = x;
          else if (row[0] === 'c') c = x; else d = x;
          draw();
        }
      });
    });

    var presets = [
      { label: 'identity', m: [1, 0, 0, 1] },
      { label: 'stretch ×2', m: [2, 0, 0, 1] },
      { label: 'rotate 45°', m: [0.7071, -0.7071, 0.7071, 0.7071] },
      { label: 'shear', m: [1, 1, 0, 1] },
      { label: 'squash flat', m: [2, 1, 4, 2] }
    ];
    A.ui.buttons(host, presets.map(function (p) {
      return { label: p.label, name: p.label, onClick: function () {
        a = p.m[0]; b = p.m[1]; c = p.m[2]; d = p.m[3];
        sliders.a.set(a, true); sliders.b.set(b, true); sliders.c.set(c, true); sliders.d.set(d, true);
        sliders.a.touched = true;
        draw();
      } };
    }), { label: 'try', pressed: -1 });

    var out = A.ui.readouts(host, [
      { label: 'first column', name: 'c1' },
      { label: 'second column', name: 'c2' },
      { label: 'determinant', name: 'det' },
      { label: 'A v', name: 'av' }
    ]);

    function draw() {
      var g1 = gridPaths(true);
      g1.forEach(function (pts, i) { S.setD(afterEls[i], S.polyD(pts)); });
      beforeEls.forEach(function (p, i) { S.op(p, showBefore ? 1 : 0); });

      S.setArrow(e1g, PX(0), PY(0), PX(1), PY(0));
      S.setArrow(e2g, PX(0), PY(0), PX(0), PY(1));
      S.setArrow(col1, PX(0), PY(0), PX(a), PY(c));
      S.setArrow(col2, PX(0), PY(0), PX(b), PY(d));
      col1L.setAttribute('x', PX(a) + 8); col1L.setAttribute('y', PY(c) - 6);
      col2L.setAttribute('x', PX(b) + 8); col2L.setAttribute('y', PY(d) - 6);
      col1L.textContent = 'where e₁ lands: (' + a.toFixed(2) + ', ' + c.toFixed(2) + ')';
      col2L.textContent = 'where e₂ lands: (' + b.toFixed(2) + ', ' + d.toFixed(2) + ')';

      var av = P.matVec(a, b, c, d, v);
      S.setArrow(vBefore, PX(0), PY(0), PX(v[0]), PY(v[1]));
      S.setArrow(vAfter, PX(0), PY(0), PX(av[0]), PY(av[1]));
      vHandle.setAttribute('cx', PX(v[0])); vHandle.setAttribute('cy', PY(v[1]));
      vL.setAttribute('x', PX(av[0]) + 10); vL.setAttribute('y', PY(av[1]) + 4);
      vL.textContent = 'A v';

      var det = P.det2(a, b, c, d);
      out.set('c1', '(' + a.toFixed(2) + ', ' + c.toFixed(2) + ')');
      out.set('c2', '(' + b.toFixed(2) + ', ' + d.toFixed(2) + ')');
      out.set('det', det.toFixed(3) + (Math.abs(det) < 0.02 ? '  — flat' : ''),
              Math.abs(det) < 0.02 ? 'is-zero' : (det > 0 ? 'is-pos' : 'is-neg'));
      out.set('av', '(' + av[0].toFixed(2) + ', ' + av[1].toFixed(2) + ')');
    }

    var dragging = false;
    function grab(ev) {
      var p = S.pointerIn(svg, ev);
      if (ev.type === 'pointerdown') {
        if (M.hypot(p[0] - PX(v[0]), p[1] - PY(v[1])) > 44) return;
        dragging = true;
        svg.setPointerCapture(ev.pointerId);
      }
      if (!dragging) return;
      v = [M.clamp((p[0] - cx) / unit, -4, 4), M.clamp((cy - p[1]) / unit, -3.6, 3.6)];
      ev.preventDefault();
      draw();
    }
    svg.addEventListener('pointerdown', grab);
    svg.addEventListener('pointermove', grab);
    svg.addEventListener('pointerup', function () { dragging = false; });

    svg.appendChild(S.text(16, 22, 'faint: the plane before   ·   bright: the same plane after', 's-lbl', 'start'));

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      /* Before it is touched, the matrix eases from the identity to the one in
         the worked example, so the transformation is seen happening. */
      if (!sliders.a.touched) {
        var t = M.easeInOut(M.beat(p, 0.1, 0.8));
        a = M.lerp(1, 2, t); b = M.lerp(0, 1, t); c = 0; d = 1;
        sliders.a.set(a, true); sliders.b.set(b, true);
        sliders.c.set(c, true); sliders.d.set(d, true);
        draw();
      }
    };
  });
})(window.A = window.A || {});
