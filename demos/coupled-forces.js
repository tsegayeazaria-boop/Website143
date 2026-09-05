/* §2.2 — the free-body picture. Drag either mass and watch the springs and the
   force arrows respond; every arrow is Hooke's law evaluated at the current
   displacements, so the signs on the page and the signs here are the same signs. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('coupled-forces', function (root, api) {
    var W = 900, H = 430;
    var svg = S.root(W, H,
      'Two masses on three springs, with the force on each mass drawn from Hooke’s law.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var wallL = 90, wallR = W - 90, yM = 175;
    var rest1 = 330, rest2 = 570, box = 54;
    var scale = 900;                    /* pixels per metre of displacement */
    var x1 = 0.02, x2 = -0.01;
    var k = 10, kap = 5;

    /* Walls and floor. */
    [wallL, wallR].forEach(function (x) {
      var w = S.rect(x - (x === wallL ? 14 : 0), yM - 62, 14, 124, 's-ghost');
      w.setAttribute('fill', 'var(--hairline)');
      svg.appendChild(w);
    });
    svg.appendChild(S.line(wallL, yM + 62, wallR, yM + 62, 's-axis'));

    function springPath(xa, xb, y, coils, amp) {
      var pts = [[xa, y]], n = coils * 2, i;
      for (i = 1; i < n; i++) {
        pts.push([xa + (xb - xa) * i / n, y + (i % 2 ? -amp : amp)]);
      }
      pts.push([xb, y]);
      return S.polyD(pts);
    }
    var sp1 = S.path('', 's-ghost'), sp2 = S.path('', 's-quantum'), sp3 = S.path('', 's-ghost');
    sp2.setAttribute('stroke-width', '2');
    [sp1, sp2, sp3].forEach(function (s) { svg.appendChild(s); });

    var m1 = S.rect(0, 0, box, box, 's-ghost');
    var m2 = S.rect(0, 0, box, box, 's-ghost');
    [m1, m2].forEach(function (b) {
      b.setAttribute('fill', 'var(--surface-2)');
      b.setAttribute('stroke', 'var(--ink-bright)');
      b.setAttribute('rx', '3');
      b.setAttribute('class', 's-grab');
      svg.appendChild(b);
    });
    var l1 = S.text(0, 0, 'm₁', 's-lbl-b', 'middle');
    var l2 = S.text(0, 0, 'm₂', 's-lbl-b', 'middle');
    svg.appendChild(l1); svg.appendChild(l2);

    var f1 = S.arrow(svg, 0, 0, 0, 0, 'f'), f2 = S.arrow(svg, 0, 0, 0, 0, 'f');
    [f1, f2].forEach(function (a) { a.setAttribute('stroke-width', '3'); svg.appendChild(a); });
    var f1L = S.text(0, 0, '', 's-lbl-f', 'middle'), f2L = S.text(0, 0, '', 's-lbl-f', 'middle');
    svg.appendChild(f1L); svg.appendChild(f2L);

    /* Dashed marks at the equilibrium positions: displacement is measured here. */
    [rest1, rest2].forEach(function (x) {
      var l = S.line(x, yM - 78, x, yM + 62, 's-axis s-dash');
      l.setAttribute('stroke-opacity', '0.5');
      svg.appendChild(l);
    });
    svg.appendChild(S.text(rest1, yM - 86, 'x₁ = 0', 's-tick', 'middle'));
    svg.appendChild(S.text(rest2, yM - 86, 'x₂ = 0', 's-tick', 'middle'));

    var mid = S.text(W / 2, 300, '', 's-lbl-q', 'middle');
    mid.setAttribute('font-size', '13');
    svg.appendChild(mid);
    var hint = S.text(W / 2, 330, 'drag either mass', 's-lbl', 'middle');
    svg.appendChild(hint);

    var host = api.controls || root;
    var s1 = A.ui.slider(host, {
      label: 'x₁ (cm)', name: 'x1', min: -4, max: 4, step: 0.1, value: 2,
      fmt: function (v) { return v.toFixed(1); },
      onInput: function (v) { x1 = v / 100; draw(); }
    });
    A.ui.slider(host, {
      label: 'x₂ (cm)', name: 'x2', min: -4, max: 4, step: 0.1, value: -1,
      fmt: function (v) { return v.toFixed(1); },
      onInput: function (v) { x2 = v / 100; draw(); }
    });
    var out = A.ui.readouts(host, [
      { label: 'middle spring extension', name: 'ext' },
      { label: 'its force on m₁', name: 'fm' },
      { label: 'total force on m₁', name: 'f1' },
      { label: 'total force on m₂', name: 'f2' }
    ]);

    function draw() {
      var p1 = rest1 + x1 * scale, p2 = rest2 + x2 * scale;
      S.setD(sp1, springPath(wallL, p1 - box / 2, yM, 7, 11));
      S.setD(sp2, springPath(p1 + box / 2, p2 - box / 2, yM, 7, 11));
      S.setD(sp3, springPath(p2 + box / 2, wallR - 14, yM, 7, 11));

      m1.setAttribute('x', p1 - box / 2); m1.setAttribute('y', yM - box / 2);
      m2.setAttribute('x', p2 - box / 2); m2.setAttribute('y', yM - box / 2);
      l1.setAttribute('x', p1); l1.setAttribute('y', yM + 5);
      l2.setAttribute('x', p2); l2.setAttribute('y', yM + 5);

      /* Exactly the force law the page derives, evaluated here. */
      var ext = x2 - x1;
      var Fmid = kap * ext;
      var F1 = -(k + kap) * x1 + kap * x2;
      var F2 = kap * x1 - (k + kap) * x2;

      var fs = 150;   /* pixels per newton */
      S.setArrow(f1, p1, yM - box / 2 - 16, p1 + F1 * fs, yM - box / 2 - 16);
      S.setArrow(f2, p2, yM - box / 2 - 16, p2 + F2 * fs, yM - box / 2 - 16);
      S.op(f1, Math.abs(F1) > 1e-4 ? 1 : 0);
      S.op(f2, Math.abs(F2) > 1e-4 ? 1 : 0);
      f1L.setAttribute('x', p1 + F1 * fs / 2); f1L.setAttribute('y', yM - box / 2 - 26);
      f2L.setAttribute('x', p2 + F2 * fs / 2); f2L.setAttribute('y', yM - box / 2 - 26);
      f1L.textContent = F1.toFixed(2) + ' N';
      f2L.textContent = F2.toFixed(2) + ' N';

      mid.textContent = Math.abs(ext) < 1e-4
        ? 'the middle spring is at its natural length — it exerts no force'
        : (ext > 0 ? 'the middle spring is stretched, so it pulls the masses together'
                   : 'the middle spring is compressed, so it pushes the masses apart');

      out.set('ext', (ext * 100).toFixed(2) + ' cm',
              Math.abs(ext) < 1e-4 ? 'is-zero' : (ext > 0 ? 'is-pos' : 'is-neg'));
      out.set('fm', Fmid.toFixed(3) + ' N', Fmid > 0 ? 'is-pos' : (Fmid < 0 ? 'is-neg' : 'is-zero'));
      out.set('f1', F1.toFixed(3) + ' N', F1 > 0 ? 'is-pos' : (F1 < 0 ? 'is-neg' : 'is-zero'));
      out.set('f2', F2.toFixed(3) + ' N', F2 > 0 ? 'is-pos' : (F2 < 0 ? 'is-neg' : 'is-zero'));
    }

    var drag = 0;
    function grab(ev) {
      var p = S.pointerIn(svg, ev);
      if (ev.type === 'pointerdown') {
        var p1 = rest1 + x1 * scale, p2 = rest2 + x2 * scale;
        if (Math.abs(p[0] - p1) < box && Math.abs(p[1] - yM) < box) drag = 1;
        else if (Math.abs(p[0] - p2) < box && Math.abs(p[1] - yM) < box) drag = 2;
        else return;
        svg.setPointerCapture(ev.pointerId);
        S.op(hint, 0);
      }
      if (!drag) return;
      var v = M.clamp((p[0] - (drag === 1 ? rest1 : rest2)) / scale, -0.04, 0.04);
      if (drag === 1) { x1 = v; s1.set(v * 100, true); } else { x2 = v; }
      s1.touched = true;
      ev.preventDefault();
      draw();
    }
    svg.addEventListener('pointerdown', grab);
    svg.addEventListener('pointermove', grab);
    svg.addEventListener('pointerup', function () { drag = 0; });

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      /* Left alone, slide both masses together to make the point in the caption:
         the middle spring stays quiet however far they go. */
      if (!s1.touched && !api.reduced) {
        var t = M.beat(p, 0.1, 0.9);
        var both = Math.sin(t * M.TAU) * 0.025;
        x1 = both; x2 = both + (t > 0.55 ? Math.sin(t * M.TAU * 3) * 0.012 : 0);
        s1.set(x1 * 100, true);
        draw();
      }
    };
  });
})(window.A = window.A || {});
