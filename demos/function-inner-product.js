/* §1.3 — the dot product of two functions, drawn. The product is shaded, and the
   running integral is accumulated left to right by the trapezium rule, so the
   number at the end is computed rather than quoted: pi when the two functions
   match, zero otherwise. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('function-inner-product', function (root, api) {
    var W = 920, H = 500;
    var svg = S.root(W, H,
      'Two trigonometric functions, their product, and the running value of the integral of that product.');
    root.appendChild(svg);

    var x0 = 70, x1 = W - 210, yTop = 60, yMid = 190, yBot = 400;
    var TAU = M.TAU;
    var PX = function (x) { return M.map(x, 0, TAU, x0, x1); };
    var PY1 = function (y) { return M.map(y, -1.3, 1.3, yMid, yTop); };
    var PY2 = function (y) { return M.map(y, -1.15, 1.15, yBot, yMid + 40); };

    var n = 2, m = 3, kind = 'ss';

    svg.appendChild(S.line(x0, PY1(0), x1, PY1(0), 's-axis'));
    svg.appendChild(S.line(x0, PY2(0), x1, PY2(0), 's-axis'));
    svg.appendChild(S.text(x0 - 8, PY1(0) + 4, '0', 's-tick', 'end'));
    svg.appendChild(S.text(x0 - 8, PY2(0) + 4, '0', 's-tick', 'end'));
    [0, 0.5, 1, 1.5, 2].forEach(function (f) {
      var x = PX(f * Math.PI);
      svg.appendChild(S.line(x, yTop, x, yBot, 's-grid'));
      svg.appendChild(S.text(x, yBot + 18, f === 0 ? '0' : (f === 1 ? 'π' : (f + 'π')), 's-tick', 'middle'));
    });

    var fill = S.el('path', { fill: 'var(--wave)', 'fill-opacity': '0.22', stroke: 'none' });
    var fillNeg = S.el('path', { fill: 'var(--fail)', 'fill-opacity': '0.22', stroke: 'none' });
    svg.appendChild(fill); svg.appendChild(fillNeg);

    var curveA = S.path('', 's-wave');
    var curveB = S.path('', 's-quantum');
    var product = S.path('', 's-prob');
    var running = S.path('', 's-fail');
    running.setAttribute('stroke-dasharray', '5 4');
    svg.appendChild(curveA); svg.appendChild(curveB);
    svg.appendChild(product); svg.appendChild(running);

    svg.appendChild(S.text(x0, yTop - 18, 'the two functions', 's-lbl', 'start'));
    svg.appendChild(S.text(x0, yMid + 26, 'their product (shaded), and the running total (dashed)', 's-lbl', 'start'));
    var labA = S.text(0, 0, '', 's-lbl-w', 'start');
    var labB = S.text(0, 0, '', 's-lbl-q', 'start');
    svg.appendChild(labA); svg.appendChild(labB);

    var verdict = S.text(x1 + 20, 120, '', 's-lbl-b', 'start');
    verdict.setAttribute('font-size', '15');
    var verdict2 = S.text(x1 + 20, 148, '', 's-lbl', 'start');
    var verdict3 = S.text(x1 + 20, 176, '', 's-lbl', 'start');
    svg.appendChild(verdict); svg.appendChild(verdict2); svg.appendChild(verdict3);

    var host = api.controls || root;
    var sn = A.ui.slider(host, {
      label: 'n', name: 'n', min: 1, max: 6, step: 1, value: 2,
      fmt: function (x) { return x.toFixed(0); },
      onInput: function (x) { n = x; draw(); }
    });
    A.ui.slider(host, {
      label: 'm', name: 'm', min: 1, max: 6, step: 1, value: 3,
      fmt: function (x) { return x.toFixed(0); },
      onInput: function (x) { m = x; draw(); }
    });
    A.ui.buttons(host, [
      { label: 'sin · sin', name: 'ss', onClick: function () { kind = 'ss'; draw(); } },
      { label: 'sin · cos', name: 'sc', onClick: function () { kind = 'sc'; draw(); } },
      { label: 'cos · cos', name: 'cc', onClick: function () { kind = 'cc'; draw(); } }
    ], { label: 'pair', pressed: 0 });

    var out = A.ui.readouts(host, [
      { label: 'integral of the product', name: 'val' },
      { label: 'π, for comparison', name: 'pi' },
      { label: 'perpendicular?', name: 'perp' }
    ]);

    function fA(x) { return kind === 'cc' ? Math.cos(n * x) : Math.sin(n * x); }
    function fB(x) { return kind === 'ss' ? Math.sin(m * x) : Math.cos(m * x); }

    function draw() {
      var N = 720, i, x, pts = [], ptsB = [], prod = [], run = [], acc = 0, prev = fA(0) * fB(0);
      var dx = TAU / N;
      for (i = 0; i <= N; i++) {
        x = i * dx;
        var va = fA(x), vb = fB(x), vp = va * vb;
        if (i > 0) acc += (vp + prev) / 2 * dx;   /* trapezium rule, accumulated */
        prev = vp;
        pts.push([PX(x), PY1(va)]);
        ptsB.push([PX(x), PY1(vb)]);
        prod.push([PX(x), PY2(vp)]);
        run.push([PX(x), PY2(M.clamp(acc / Math.PI, -1.1, 1.1))]);
      }
      S.setD(curveA, S.polyD(pts));
      S.setD(curveB, S.polyD(ptsB));
      S.setD(product, S.polyD(prod));
      S.setD(running, S.polyD(run));

      /* Shade the positive and negative lobes separately: the cancellation is
         the whole point, so it should be visible rather than described. */
      var pos = [], neg = [];
      prod.forEach(function (p, i2) {
        var v = fA(i2 * dx) * fB(i2 * dx);
        pos.push([p[0], v > 0 ? p[1] : PY2(0)]);
        neg.push([p[0], v < 0 ? p[1] : PY2(0)]);
      });
      fill.setAttribute('d', S.areaD(pos, PY2(0)));
      fillNeg.setAttribute('d', S.areaD(neg, PY2(0)));

      labA.setAttribute('x', x1 + 8); labA.setAttribute('y', PY1(fA(TAU * 0.97)) + 4);
      labB.setAttribute('x', x1 + 8); labB.setAttribute('y', PY1(fB(TAU * 0.97)) + 4);
      labA.textContent = (kind === 'cc' ? 'cos ' : 'sin ') + n + 'x';
      labB.textContent = (kind === 'ss' ? 'sin ' : 'cos ') + m + 'x';

      var same = (kind !== 'sc') && n === m;
      out.set('val', acc.toFixed(4), Math.abs(acc) < 1e-3 ? 'is-zero' : 'is-pos');
      out.set('pi', Math.PI.toFixed(4));
      out.set('perp', Math.abs(acc) < 1e-3 ? 'yes' : 'no',
              Math.abs(acc) < 1e-3 ? 'is-pos' : 'is-neg');

      verdict.textContent = Math.abs(acc) < 1e-3 ? 'total: 0' : 'total: ' + acc.toFixed(3);
      verdict2.textContent = same ? 'the same function twice' :
        (kind === 'sc' ? 'a sine against a cosine' : 'different harmonics');
      verdict3.textContent = Math.abs(acc) < 1e-3
        ? 'every positive lobe is matched'
        : 'the product never goes negative';
      if (Math.abs(acc) < 1e-3) {
        verdict3.setAttribute('class', 's-lbl');
      } else {
        verdict3.setAttribute('class', 's-lbl-q');
      }
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sn.touched && !api.reduced) {
        /* Walk n up through the harmonics so the reader sees the cancellation
           happen for every one of them, then land on the matching case. */
        var k = 1 + Math.floor(M.beat(p, 0.1, 0.9) * 5.999);
        if (k !== n) { n = k; sn.set(k, true); draw(); }
      }
    };
  });
})(window.A = window.A || {});
