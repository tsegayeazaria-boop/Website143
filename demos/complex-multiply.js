/* §1.1 — two complex numbers and their product. Both factors are dragged or set
   by sliders; the product is computed by ordinary multiplication of the real and
   imaginary parts, and its polar form is read off afterwards, so the claim that
   angles add is checked rather than assumed. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('complex-multiply', function (root, api) {
    var W = 900, H = 470;
    var svg = S.root(W, H, 'Two complex numbers drawn as arrows, together with their product.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 300, cy = H / 2, unit = 58;
    var PX = function (x) { return cx + x * unit; };
    var PY = function (y) { return cy - y * unit; };

    var r1 = 1.3, t1 = 0.5, r2 = 1.1, t2 = 0.9;

    svg.appendChild(S.line(PX(-4.5), PY(0), PX(4.5), PY(0), 's-axis'));
    svg.appendChild(S.line(PX(0), PY(3.4), PX(0), PY(-3.4), 's-axis'));
    svg.appendChild(S.text(PX(4.4), PY(0) - 8, 'real', 's-lbl', 'end'));
    svg.appendChild(S.text(PX(0) + 8, PY(3.3), 'imaginary', 's-lbl', 'start'));
    var unitCircle = S.el('circle', { cx: PX(0), cy: PY(0), r: unit, class: 's-ghost s-dash' });
    svg.appendChild(unitCircle);
    svg.appendChild(S.text(PX(0.72), PY(0.72), 'length 1', 's-tick', 'start'));

    var arcs = [S.path('', 's-wave'), S.path('', 's-quantum'), S.path('', 's-prob')];
    arcs.forEach(function (a) { a.setAttribute('stroke-opacity', '0.6'); svg.appendChild(a); });

    var z1 = S.arrow(svg, 0, 0, 0, 0, 'w'), z2 = S.arrow(svg, 0, 0, 0, 0, 'q'),
        zp = S.arrow(svg, 0, 0, 0, 0, 'p');
    [z1, z2, zp].forEach(function (a) { a.setAttribute('stroke-width', '3'); svg.appendChild(a); });
    var l1 = S.text(0, 0, 'z₁', 's-lbl-w', 'start'),
        l2 = S.text(0, 0, 'z₂', 's-lbl-q', 'start'),
        lp = S.text(0, 0, 'z₁z₂', 's-lbl-p', 'start');
    [l1, l2, lp].forEach(function (l) { svg.appendChild(l); });

    var rows = [0, 1, 2, 3, 4].map(function (i) {
      var t = S.text(620, 120 + i * 32, '', i === 4 ? 's-lbl-p' : 's-lbl', 'start');
      t.setAttribute('font-size', '13');
      svg.appendChild(t);
      return t;
    });
    svg.appendChild(S.line(612, 96, W - 30, 96, 's-axis'));
    svg.appendChild(S.text(612, 86, 'worked out in components', 's-lbl', 'start'));

    var host = api.controls || root;
    var sr1 = A.ui.slider(host, { label: '|z₁|', name: 'r1', min: 0.2, max: 2.2, step: 0.01, value: r1,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { r1 = v; draw(); } });
    A.ui.slider(host, { label: 'angle of z₁', name: 't1', min: -180, max: 180, step: 1,
      value: t1 * 180 / Math.PI, fmt: function (v) { return v.toFixed(0) + '°'; },
      onInput: function (v) { t1 = v * Math.PI / 180; draw(); } });
    A.ui.slider(host, { label: '|z₂|', name: 'r2', min: 0.2, max: 2.2, step: 0.01, value: r2,
      fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { r2 = v; draw(); } });
    A.ui.slider(host, { label: 'angle of z₂', name: 't2', min: -180, max: 180, step: 1,
      value: t2 * 180 / Math.PI, fmt: function (v) { return v.toFixed(0) + '°'; },
      onInput: function (v) { t2 = v * Math.PI / 180; draw(); } });

    var out = A.ui.readouts(host, [
      { label: 'lengths multiplied', name: 'len' },
      { label: 'angles added', name: 'ang' },
      { label: 'the product', name: 'prod' }
    ]);

    function arcD(r, a0, a1) {
      var big = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
      var sweep = a1 > a0 ? 0 : 1;
      return 'M' + PX(Math.cos(a0) * r) + ' ' + PY(Math.sin(a0) * r) +
             'A' + (r * unit) + ' ' + (r * unit) + ' 0 ' + big + ' ' + sweep + ' ' +
             PX(Math.cos(a1) * r) + ' ' + PY(Math.sin(a1) * r);
    }

    function draw() {
      var a = r1 * Math.cos(t1), b = r1 * Math.sin(t1);
      var c = r2 * Math.cos(t2), d = r2 * Math.sin(t2);
      /* The product, from the real and imaginary parts alone. */
      var pr = a * c - b * d, pi = a * d + b * c;

      S.setArrow(z1, PX(0), PY(0), PX(a), PY(b));
      S.setArrow(z2, PX(0), PY(0), PX(c), PY(d));
      S.setArrow(zp, PX(0), PY(0), PX(pr), PY(pi));
      l1.setAttribute('x', PX(a) + 10); l1.setAttribute('y', PY(b) - 6);
      l2.setAttribute('x', PX(c) + 10); l2.setAttribute('y', PY(d) - 6);
      lp.setAttribute('x', PX(pr) + 10); lp.setAttribute('y', PY(pi) - 6);

      S.setD(arcs[0], arcD(0.55, 0, t1));
      S.setD(arcs[1], arcD(0.72, 0, t2));
      S.setD(arcs[2], arcD(0.9, 0, Math.atan2(pi, pr)));

      rows[0].textContent = 'z₁ = ' + a.toFixed(2) + (b < 0 ? ' − ' : ' + ') + Math.abs(b).toFixed(2) + 'i';
      rows[1].textContent = 'z₂ = ' + c.toFixed(2) + (d < 0 ? ' − ' : ' + ') + Math.abs(d).toFixed(2) + 'i';
      rows[2].textContent = 'real:  (' + a.toFixed(2) + ')(' + c.toFixed(2) + ') − (' +
                            b.toFixed(2) + ')(' + d.toFixed(2) + ')';
      rows[3].textContent = 'imag: (' + a.toFixed(2) + ')(' + d.toFixed(2) + ') + (' +
                            b.toFixed(2) + ')(' + c.toFixed(2) + ')';
      rows[4].textContent = '= ' + pr.toFixed(2) + (pi < 0 ? ' − ' : ' + ') + Math.abs(pi).toFixed(2) + 'i';

      var deg = function (x) { return (x * 180 / Math.PI).toFixed(1) + '°'; };
      out.set('len', r1.toFixed(2) + ' × ' + r2.toFixed(2) + ' = ' + (r1 * r2).toFixed(3));
      out.set('ang', deg(t1) + ' + ' + deg(t2) + ' = ' + deg(t1 + t2));
      out.set('prod', 'length ' + M.hypot(pr, pi).toFixed(3) + ', angle ' + deg(Math.atan2(pi, pr)));
    }

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      if (!sr1.touched && !api.reduced) {
        t2 = M.lerp(0.2, 2.4, M.easeInOut(M.beat(p, 0.1, 0.9)));
        draw();
      }
    };
  });
})(window.A = window.A || {});
