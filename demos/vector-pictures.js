/* §1.3 — the same arrow described in two different bases. Drag the arrow, or
   turn the axes; the arrow is drawn from its own length and direction, and the
   components are computed by projecting it onto whichever basis is current, so
   the picture cannot cheat. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('vector-pictures', function (root, api) {
    var W = 880, H = 460;
    var svg = S.root(W, H, 'An arrow in the plane, with its components in a basis you can turn.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 300, cy = H / 2, unit = 62;
    var PX = function (x) { return cx + x * unit; };
    var PY = function (y) { return cy - y * unit; };

    var gGrid = S.g({});
    svg.appendChild(gGrid);
    var gBasis = S.g({});
    svg.appendChild(gBasis);

    var comp1 = S.line(0, 0, 0, 0, 's-wave s-dash');
    var comp2 = S.line(0, 0, 0, 0, 's-quantum s-dash');
    svg.appendChild(comp1); svg.appendChild(comp2);

    var e1 = S.arrow(svg, 0, 0, 0, 0, 'w');
    var e2 = S.arrow(svg, 0, 0, 0, 0, 'q');
    e1.setAttribute('stroke-width', '2.5'); e2.setAttribute('stroke-width', '2.5');
    svg.appendChild(e1); svg.appendChild(e2);
    var e1L = S.text(0, 0, 'e₁', 's-lbl-w', 'middle');
    var e2L = S.text(0, 0, 'e₂', 's-lbl-q', 'middle');
    svg.appendChild(e1L); svg.appendChild(e2L);

    var vArrow = S.arrow(svg, 0, 0, 0, 0, 'i');
    vArrow.setAttribute('stroke-width', '3');
    svg.appendChild(vArrow);
    var handle = S.circle(0, 0, 9, 's-fill-i');
    handle.setAttribute('class', 's-fill-i s-grab');
    svg.appendChild(handle);
    var vLabel = S.text(0, 0, 'v', 's-lbl-b', 'middle');
    svg.appendChild(vLabel);

    var readout = S.g({});
    svg.appendChild(readout);
    var lines = ['', '', '', ''].map(function (_, i) {
      var t = S.text(620, 130 + i * 34, '', i === 0 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 0 ? '14' : '13');
      readout.appendChild(t);
      return t;
    });
    readout.appendChild(S.line(612, 96, 860, 96, 's-axis'));
    readout.appendChild(S.text(612, 86, 'in this basis', 's-lbl', 'start'));

    /* State: the arrow itself (never stored in components) and the basis angle. */
    var v = [1.7, 1.1];
    var theta = 0;

    var host = api.controls || root;
    var sTheta = A.ui.slider(host, {
      label: 'turn the axes', name: 'theta', min: -90, max: 90, step: 1, value: 0,
      fmt: function (x) { return x.toFixed(0) + '°'; },
      onInput: function (x) { theta = x * Math.PI / 180; draw(); }
    });
    A.ui.slider(host, {
      label: 'arrow length', name: 'len', min: 0.4, max: 2.6, step: 0.01, value: M.hypot(v[0], v[1]),
      fmt: function (x) { return x.toFixed(2); },
      onInput: function (x) {
        var n = M.hypot(v[0], v[1]) || 1;
        v = [v[0] / n * x, v[1] / n * x];
        draw();
      }
    });

    function basis() {
      return [[Math.cos(theta), Math.sin(theta)], [-Math.sin(theta), Math.cos(theta)]];
    }

    function draw() {
      var b = basis();
      /* Components are projections: how much of the arrow lies along each axis. */
      var c1 = v[0] * b[0][0] + v[1] * b[0][1];
      var c2 = v[0] * b[1][0] + v[1] * b[1][1];

      while (gGrid.firstChild) gGrid.removeChild(gGrid.firstChild);
      for (var i = -6; i <= 6; i++) {
        var p1 = [b[0][0] * i - b[1][0] * 9, b[0][1] * i - b[1][1] * 9];
        var p2 = [b[0][0] * i + b[1][0] * 9, b[0][1] * i + b[1][1] * 9];
        gGrid.appendChild(S.line(PX(p1[0]), PY(p1[1]), PX(p2[0]), PY(p2[1]), 's-grid'));
        var q1 = [b[1][0] * i - b[0][0] * 9, b[1][1] * i - b[0][1] * 9];
        var q2 = [b[1][0] * i + b[0][0] * 9, b[1][1] * i + b[0][1] * 9];
        gGrid.appendChild(S.line(PX(q1[0]), PY(q1[1]), PX(q2[0]), PY(q2[1]), 's-grid'));
      }

      S.setArrow(e1, PX(0), PY(0), PX(b[0][0]), PY(b[0][1]));
      S.setArrow(e2, PX(0), PY(0), PX(b[1][0]), PY(b[1][1]));
      e1L.setAttribute('x', PX(b[0][0] * 1.22)); e1L.setAttribute('y', PY(b[0][1] * 1.22) + 4);
      e2L.setAttribute('x', PX(b[1][0] * 1.22)); e2L.setAttribute('y', PY(b[1][1] * 1.22) + 4);

      /* The two dashed legs: c1 along the first axis, then c2 along the second. */
      var mid = [b[0][0] * c1, b[0][1] * c1];
      S.setArrow(comp1, PX(0), PY(0), PX(mid[0]), PY(mid[1]));
      S.setArrow(comp2, PX(mid[0]), PY(mid[1]), PX(v[0]), PY(v[1]));

      S.setArrow(vArrow, PX(0), PY(0), PX(v[0]), PY(v[1]));
      handle.setAttribute('cx', PX(v[0])); handle.setAttribute('cy', PY(v[1]));
      vLabel.setAttribute('x', PX(v[0]) + 18); vLabel.setAttribute('y', PY(v[1]) - 10);

      lines[0].textContent = 'v = (' + c1.toFixed(2) + ', ' + c2.toFixed(2) + ')';
      lines[1].textContent = 'v = ' + c1.toFixed(2) + ' e₁  +  ' + c2.toFixed(2) + ' e₂';
      lines[2].textContent = 'length = √(' + c1.toFixed(2) + '² + ' + c2.toFixed(2) + '²) = ' +
                             M.hypot(c1, c2).toFixed(3);
      lines[3].textContent = 'the arrow has not moved';
    }

    function grab(ev) {
      if (ev.buttons === 0 && ev.type === 'pointermove') return;
      var p = S.pointerIn(svg, ev);
      if (ev.type === 'pointerdown') {
        var d = M.hypot(p[0] - PX(v[0]), p[1] - PY(v[1]));
        if (d > 46) return;
        svg.setPointerCapture(ev.pointerId);
        dragging = true;
      }
      if (!dragging) return;
      v = [M.clamp((p[0] - cx) / unit, -3.4, 3.4), M.clamp((cy - p[1]) / unit, -3.2, 3.2)];
      ev.preventDefault();
      draw();
    }
    var dragging = false;
    svg.addEventListener('pointerdown', grab);
    svg.addEventListener('pointermove', grab);
    svg.addEventListener('pointerup', function () { dragging = false; });

    root.__demo = {
      set: function (n, x) { if (n === 'theta') sTheta.set(x); },
      read: function () { var b = basis(); return { c1: v[0] * b[0][0] + v[1] * b[0][1] }; }
    };

    draw();
    return function (p) {
      /* Until the reader touches it, the basis turns gently with the scroll —
         the point of the figure is that the arrow stays put while it does. */
      if (!sTheta.touched) {
        var deg = M.lerp(0, 40, M.easeInOut(M.beat(p, 0.15, 0.85)));
        if (Math.abs(deg * Math.PI / 180 - theta) > 1e-4) { sTheta.set(deg, true); theta = deg * Math.PI / 180; draw(); }
      }
    };
  });
})(window.A = window.A || {});
