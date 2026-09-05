/* §1.3 — drag a vector and watch where the matrix sends it. The eigen-lines are
   computed from the matrix by the same characteristic equation the page derives,
   not hard-coded, so the dashed lines are the answer rather than an illustration. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('eigen-directions', function (root, api) {
    var W = 900, H = 480;
    var svg = S.root(W, H,
      'A vector and its image under a matrix, with the matrix eigenvector directions marked.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 330, cy = H / 2, unit = 54;
    var PX = function (x) { return cx + x * unit; };
    var PY = function (y) { return cy - y * unit; };

    var a = 2, b = 1, c = 1, d = 2;
    var ang = 0.9;            /* the test vector's direction; length is fixed */
    var r0 = 1.9;

    svg.appendChild(S.line(PX(-5), PY(0), PX(5), PY(0), 's-axis'));
    svg.appendChild(S.line(PX(0), PY(4), PX(0), PY(-4), 's-axis'));

    var circle = S.el('circle', { cx: PX(0), cy: PY(0), r: r0 * unit, class: 's-ghost s-dash' });
    svg.appendChild(circle);

    var eigLines = [S.line(0, 0, 0, 0, 's-quantum s-dash'), S.line(0, 0, 0, 0, 's-quantum s-dash')];
    eigLines.forEach(function (l) { svg.appendChild(l); });
    var eigLbl = [S.text(0, 0, '', 's-lbl-q', 'start'), S.text(0, 0, '', 's-lbl-q', 'start')];
    eigLbl.forEach(function (l) { svg.appendChild(l); });

    var vArrow = S.arrow(svg, 0, 0, 0, 0, 'm');
    vArrow.setAttribute('stroke-width', '2.5');
    var avArrow = S.arrow(svg, 0, 0, 0, 0, 'p');
    avArrow.setAttribute('stroke-width', '3');
    svg.appendChild(vArrow); svg.appendChild(avArrow);
    var handle = S.circle(0, 0, 9, 's-fill-i s-grab');
    svg.appendChild(handle);
    var vL = S.text(0, 0, 'v', 's-lbl-b', 'start');
    var avL = S.text(0, 0, 'A v', 's-lbl-p', 'start');
    svg.appendChild(vL); svg.appendChild(avL);

    /* The angle between v and Av, drawn as an arc: zero exactly on an eigenline. */
    var arc = S.path('', 's-fail');
    arc.setAttribute('stroke-width', '2');
    svg.appendChild(arc);
    var arcL = S.text(0, 0, '', 's-lbl-f', 'start');
    svg.appendChild(arcL);

    var host = api.controls || root;
    var sliders = {};
    [['a', 'a', 2], ['b', 'b', 1], ['c', 'c', 1], ['d', 'd', 2]].forEach(function (row) {
      sliders[row[0]] = A.ui.slider(host, {
        label: row[1], name: row[0], min: -3, max: 3, step: 0.05, value: row[2],
        fmt: function (x) { return x.toFixed(2); },
        onInput: function (x) {
          if (row[0] === 'a') a = x; else if (row[0] === 'b') b = x;
          else if (row[0] === 'c') c = x; else d = x;
          if (symLock && (row[0] === 'b' || row[0] === 'c')) {
            b = c = x; sliders.b.set(x, true); sliders.c.set(x, true);
          }
          draw();
        }
      });
    });
    var sAng = A.ui.slider(host, {
      label: 'turn v', name: 'ang', min: 0, max: 360, step: 1, value: ang * 180 / Math.PI,
      fmt: function (x) { return x.toFixed(0) + '°'; },
      onInput: function (x) { ang = x * Math.PI / 180; draw(); }
    });

    var symLock = true;
    A.ui.buttons(host, [
      { label: 'symmetric', name: 'sym', onClick: function () {
        symLock = true; c = b; sliders.c.set(b, true); draw(); } },
      { label: 'shear', name: 'shear', onClick: function () {
        symLock = false; a = 1; b = 1; c = 0; d = 1; sync(); } },
      { label: 'rotation', name: 'rot', onClick: function () {
        symLock = false; a = 0.7071; b = -0.7071; c = 0.7071; d = 0.7071; sync(); } },
      { label: 'stretch x', name: 'stretch', onClick: function () {
        symLock = false; a = 2; b = 0; c = 0; d = 1; sync(); } }
    ], { label: 'matrix', pressed: 0 });

    function sync() {
      sliders.a.set(a, true); sliders.b.set(b, true);
      sliders.c.set(c, true); sliders.d.set(d, true);
      sliders.a.touched = true;
      draw();
    }

    var out = A.ui.readouts(host, [
      { label: 'eigenvalues', name: 'lam' },
      { label: 'angle v turned by', name: 'turn' },
      { label: 'length ratio |Av|/|v|', name: 'ratio' },
      { label: 'is v an eigenvector?', name: 'is' }
    ]);

    function draw() {
      var v = [Math.cos(ang) * r0, Math.sin(ang) * r0];
      var av = P.matVec(a, b, c, d, v);
      var e = P.eig2(a, b, c, d);

      circle.setAttribute('r', r0 * unit);
      S.setArrow(vArrow, PX(0), PY(0), PX(v[0]), PY(v[1]));
      S.setArrow(avArrow, PX(0), PY(0), PX(av[0]), PY(av[1]));
      handle.setAttribute('cx', PX(v[0])); handle.setAttribute('cy', PY(v[1]));
      vL.setAttribute('x', PX(v[0]) + 12); vL.setAttribute('y', PY(v[1]) + 4);
      avL.setAttribute('x', PX(av[0]) + 12); avL.setAttribute('y', PY(av[1]) + 4);

      if (e.real) {
        e.vec.forEach(function (w, i) {
          eigLines[i].setAttribute('x1', PX(-w[0] * 4.6)); eigLines[i].setAttribute('y1', PY(-w[1] * 4.6));
          eigLines[i].setAttribute('x2', PX(w[0] * 4.6)); eigLines[i].setAttribute('y2', PY(w[1] * 4.6));
          S.op(eigLines[i], 0.85);
          eigLbl[i].setAttribute('x', PX(w[0] * 3.1) + 6);
          eigLbl[i].setAttribute('y', PY(w[1] * 3.1) - 6);
          eigLbl[i].textContent = 'λ = ' + e.lambda[i].toFixed(2);
          S.op(eigLbl[i], 1);
        });
        out.set('lam', e.lambda[0].toFixed(3) + ',  ' + e.lambda[1].toFixed(3));
      } else {
        eigLines.forEach(function (l) { S.op(l, 0); });
        eigLbl.forEach(function (l) { S.op(l, 0); });
        out.set('lam', 'none that are real', 'is-neg');
      }

      /* The turn angle, from the definition of the dot product. */
      var lv = M.hypot(v[0], v[1]), la = M.hypot(av[0], av[1]);
      var cosT = la < 1e-9 ? 1 : (v[0] * av[0] + v[1] * av[1]) / (lv * la);
      var turn = Math.acos(M.clamp(cosT, -1, 1)) * 180 / Math.PI;
      var onLine = turn < 0.6 || turn > 179.4;

      var R = 46;
      var a0 = Math.atan2(-v[1], v[0]), a1 = Math.atan2(-av[1], av[0]);
      var sweep = ((a1 - a0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      var large = sweep > Math.PI ? 1 : 0;
      S.setD(arc, la < 1e-6 ? '' :
        'M' + (PX(0) + Math.cos(a0) * R) + ' ' + (PY(0) + Math.sin(a0) * R) +
        'A' + R + ' ' + R + ' 0 ' + large + ' 1 ' +
        (PX(0) + Math.cos(a1) * R) + ' ' + (PY(0) + Math.sin(a1) * R));
      S.op(arc, onLine ? 0 : 0.9);
      arcL.setAttribute('x', PX(0) + Math.cos((a0 + a1) / 2) * (R + 14));
      arcL.setAttribute('y', PY(0) + Math.sin((a0 + a1) / 2) * (R + 14));
      arcL.textContent = turn.toFixed(1) + '°';
      S.op(arcL, onLine ? 0 : 0.9);

      out.set('turn', turn.toFixed(1) + '°', onLine ? 'is-pos' : 'is-neg');
      out.set('ratio', (la / lv).toFixed(3));
      out.set('is', onLine ? 'yes — it only stretched' : 'no — it turned',
              onLine ? 'is-pos' : 'is-zero');
    }

    var dragging = false;
    function grab(ev) {
      var p = S.pointerIn(svg, ev);
      if (ev.type === 'pointerdown') {
        var v = [Math.cos(ang) * r0, Math.sin(ang) * r0];
        if (M.hypot(p[0] - PX(v[0]), p[1] - PY(v[1])) > 60) return;
        dragging = true;
        svg.setPointerCapture(ev.pointerId);
      }
      if (!dragging) return;
      ang = Math.atan2(cy - p[1], p[0] - cx);
      sAng.set(((ang * 180 / Math.PI) % 360 + 360) % 360, true);
      sAng.touched = true;
      ev.preventDefault();
      draw();
    }
    svg.addEventListener('pointerdown', grab);
    svg.addEventListener('pointermove', grab);
    svg.addEventListener('pointerup', function () { dragging = false; });

    svg.appendChild(S.text(16, 22, 'drag the pale arrow around the circle', 's-lbl', 'start'));

    root.__demo = { read: function () { return out.read(); } };

    draw();
    return function (p) {
      /* Left alone, the test vector sweeps once round so both eigen-directions
         are passed through, which is the moment worth catching. */
      if (!sAng.touched && !api.reduced) {
        ang = M.beat(p, 0.05, 0.95) * M.TAU;
        sAng.set(((ang * 180 / Math.PI) % 360 + 360) % 360, true);
        draw();
      }
    };
  });
})(window.A = window.A || {});
