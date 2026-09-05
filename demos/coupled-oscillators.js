/* §2.2 — the two masses, moving. Positions come from A.phys.coupledState, which
   is the closed-form solution the page derives, so what you watch is the
   solution rather than a simulation of it. The lower panel shows the same motion
   as its two normal coordinates, which are always plain sine waves. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg, P = A.phys;

  A.scene('coupled-oscillators', function (root, api) {
    var W = 940, H = 560;
    var svg = S.root(W, H,
      'Two masses on three springs in motion, with their displacements and normal coordinates traced.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var prm = { m: 0.5, k: 10, kappa: 5 };
    var ic = { x1: 0.03, x2: 0, v1: 0, v2: 0 };
    var t = 0, running = true;

    /* ---- the apparatus, along the top ---- */
    var wallL = 70, wallR = 470, yM = 90, box = 40, scale = 1500;
    var rest1 = 200, rest2 = 340;
    [[wallL - 12, 1], [wallR, 0]].forEach(function (p) {
      var w = S.rect(p[0], yM - 44, 12, 88, 's-ghost');
      w.setAttribute('fill', 'var(--hairline)');
      svg.appendChild(w);
    });
    function springPath(xa, xb, y, coils, amp) {
      var pts = [[xa, y]], n = coils * 2, i;
      for (i = 1; i < n; i++) pts.push([xa + (xb - xa) * i / n, y + (i % 2 ? -amp : amp)]);
      pts.push([xb, y]);
      return S.polyD(pts);
    }
    var sp = [S.path('', 's-ghost'), S.path('', 's-quantum'), S.path('', 's-ghost')];
    sp.forEach(function (s) { svg.appendChild(s); });
    var mb = [S.rect(0, 0, box, box, ''), S.rect(0, 0, box, box, '')];
    mb.forEach(function (b) {
      b.setAttribute('fill', 'var(--surface-2)');
      b.setAttribute('stroke', 'var(--wave)');
      b.setAttribute('rx', '3');
      svg.appendChild(b);
    });
    var mlbl = [S.text(0, 0, '1', 's-lbl-b', 'middle'), S.text(0, 0, '2', 's-lbl-b', 'middle')];
    mlbl.forEach(function (l) { svg.appendChild(l); });
    [rest1, rest2].forEach(function (x) {
      var l = S.line(x, yM - 52, x, yM + 52, 's-axis s-dash');
      l.setAttribute('stroke-opacity', '0.4');
      svg.appendChild(l);
    });

    /* ---- traces ---- */
    var tx0 = 540, tx1 = W - 30, span = 8;      /* seconds shown */
    function panel(yTop, yBot, title, labels) {
      var g = S.g({});
      svg.appendChild(g);
      var yc = (yTop + yBot) / 2;
      g.appendChild(S.line(tx0, yc, tx1, yc, 's-axis'));
      g.appendChild(S.text(tx0, yTop - 8, title, 's-lbl', 'start'));
      labels.forEach(function (l, i) {
        g.appendChild(S.text(tx1, yTop - 8 - i * 0, '', 's-lbl'));
      });
      return { g: g, yc: yc, amp: (yBot - yTop) / 2 };
    }
    var pTop = panel(40, 150, 'the two displacements', []);
    var pBot = panel(215, 325, 'the two normal coordinates', []);
    var trace = {
      x1: S.path('', 's-wave'), x2: S.path('', 's-quantum'),
      q1: S.path('', 's-prob'), q2: S.path('', 's-fail')
    };
    Object.keys(trace).forEach(function (k) { svg.appendChild(trace[k]); });
    var tl = {
      x1: S.text(tx1, 34, 'x₁', 's-lbl-w', 'end'), x2: S.text(tx1 - 24, 34, 'x₂', 's-lbl-q', 'end'),
      q1: S.text(tx1, 209, 'q₁', 's-lbl-p', 'end'), q2: S.text(tx1 - 24, 209, 'q₂', 's-lbl-f', 'end')
    };
    Object.keys(tl).forEach(function (k) { svg.appendChild(tl[k]); });
    var nowLine = S.line(0, 30, 0, 335, 's-axis');
    nowLine.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(nowLine);

    /* ---- how much of each mode is present ---- */
    var barY = 400;
    svg.appendChild(S.text(70, barY - 14, 'how much of each mode this motion contains', 's-lbl', 'start'));
    var bars = [0, 1].map(function (i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = barY + i * 40;
      g.appendChild(S.text(70, y + 12, i === 0 ? 'mode 1  (1, 1)' : 'mode 2  (1, −1)',
                           i === 0 ? 's-lbl-p' : 's-lbl-f', 'start'));
      var back = S.rect(230, y, 300, 16, 's-ghost');
      back.setAttribute('fill', 'var(--surface-2)');
      back.setAttribute('stroke', 'none');
      g.appendChild(back);
      var fill = S.rect(230, y, 0, 16, '');
      fill.setAttribute('fill', i === 0 ? 'var(--probability)' : 'var(--fail)');
      fill.setAttribute('fill-opacity', '0.7');
      g.appendChild(fill);
      var val = S.text(546, y + 12, '', 's-lbl-b', 'start');
      g.appendChild(val);
      return { fill: fill, val: val };
    });

    var note = S.text(70, 520, '', 's-lbl-q', 'start');
    note.setAttribute('font-size', '13');
    svg.appendChild(note);

    /* ---- controls ---- */
    var host = api.controls || root;
    var s1 = A.ui.slider(host, {
      label: 'x₁ at t = 0 (cm)', name: 'x1', min: -4, max: 4, step: 0.1, value: 3,
      fmt: function (v) { return v.toFixed(1); },
      onInput: function (v) { ic.x1 = v / 100; t = 0; }
    });
    var s2 = A.ui.slider(host, {
      label: 'x₂ at t = 0 (cm)', name: 'x2', min: -4, max: 4, step: 0.1, value: 0,
      fmt: function (v) { return v.toFixed(1); },
      onInput: function (v) { ic.x2 = v / 100; t = 0; }
    });
    A.ui.slider(host, {
      label: 'coupling κ (N/m)', name: 'kappa', min: 0, max: 12, step: 0.1, value: 5,
      fmt: function (v) { return v.toFixed(1); },
      onInput: function (v) { prm.kappa = v; t = 0; }
    });
    A.ui.buttons(host, [
      { label: 'mode 1: together', name: 'mode1', onClick: function () {
        ic = { x1: 0.03, x2: 0.03, v1: 0, v2: 0 }; s1.set(3, true); s2.set(3, true); t = 0; } },
      { label: 'mode 2: opposed', name: 'mode2', onClick: function () {
        ic = { x1: 0.03, x2: -0.03, v1: 0, v2: 0 }; s1.set(3, true); s2.set(-3, true); t = 0; } },
      { label: 'one mass only', name: 'mix', onClick: function () {
        ic = { x1: 0.03, x2: 0, v1: 0, v2: 0 }; s1.set(3, true); s2.set(0, true); t = 0; } },
      { label: 'pause', name: 'pause', onClick: function (on) { running = !on; } }
    ], { label: 'start', pressed: 2, radio: false });

    var out = A.ui.readouts(host, [
      { label: 'ω₁', name: 'w1' }, { label: 'ω₂', name: 'w2' },
      { label: 'beat period', name: 'beat' }, { label: 'time', name: 't' }
    ]);

    function draw() {
      var md = P.coupledModes(prm.m, prm.k, prm.kappa);
      var st = P.coupledState(t, ic, prm);

      var p1 = rest1 + st.x1 * scale, p2 = rest2 + st.x2 * scale;
      S.setD(sp[0], springPath(wallL, p1 - box / 2, yM, 6, 9));
      S.setD(sp[1], springPath(p1 + box / 2, p2 - box / 2, yM, 6, 9));
      S.setD(sp[2], springPath(p2 + box / 2, wallR, yM, 6, 9));
      mb[0].setAttribute('x', p1 - box / 2); mb[0].setAttribute('y', yM - box / 2);
      mb[1].setAttribute('x', p2 - box / 2); mb[1].setAttribute('y', yM - box / 2);
      mlbl[0].setAttribute('x', p1); mlbl[0].setAttribute('y', yM + 4);
      mlbl[1].setAttribute('x', p2); mlbl[1].setAttribute('y', yM + 4);

      /* Traces: the whole window is redrawn from the closed form each frame, so
         scrubbing back and forth shows the same curve. */
      var A0 = Math.max(0.008, Math.abs(ic.x1), Math.abs(ic.x2)) * 1.25;
      var t0 = Math.max(0, t - span * 0.75);
      function tr(fn, panel) {
        return S.polyD(S.sample(300, t0, t0 + span, function (tt) {
          return [M.map(tt, t0, t0 + span, tx0, tx1), panel.yc - fn(tt) / A0 * panel.amp];
        }));
      }
      S.setD(trace.x1, tr(function (tt) { return P.coupledState(tt, ic, prm).x1; }, pTop));
      S.setD(trace.x2, tr(function (tt) { return P.coupledState(tt, ic, prm).x2; }, pTop));
      S.setD(trace.q1, tr(function (tt) { return P.coupledState(tt, ic, prm).q1; }, pBot));
      S.setD(trace.q2, tr(function (tt) { return P.coupledState(tt, ic, prm).q2; }, pBot));
      var nx = M.map(t, t0, t0 + span, tx0, tx1);
      nowLine.setAttribute('x1', nx); nowLine.setAttribute('x2', nx);

      /* Mode content: the two normal coordinates at t = 0 are the amplitudes. */
      var a1 = Math.abs((ic.x1 + ic.x2) / 2), a2 = Math.abs((ic.x1 - ic.x2) / 2);
      var tot = Math.max(1e-9, a1 + a2);
      bars[0].fill.setAttribute('width', 300 * a1 / tot);
      bars[1].fill.setAttribute('width', 300 * a2 / tot);
      bars[0].val.textContent = (100 * a1 / tot).toFixed(0) + '%';
      bars[1].val.textContent = (100 * a2 / tot).toFixed(0) + '%';

      note.textContent = a2 < 1e-6 ? 'a pure first mode: the middle spring never stretches'
        : (a1 < 1e-6 ? 'a pure second mode: the middle spring is stretched twice as hard'
        : 'both modes at once — so the two masses trade the energy back and forth');

      out.set('w1', md.omega[0].toFixed(3) + ' rad/s');
      out.set('w2', md.omega[1].toFixed(3) + ' rad/s');
      out.set('beat', isFinite(md.beatPeriod) ? md.beatPeriod.toFixed(2) + ' s' : 'never — equal modes');
      out.set('t', t.toFixed(2) + ' s');
    }

    root.__demo = {
      set: function (n, v) { if (n === 'x1') s1.set(v); if (n === 'x2') s2.set(v); },
      read: function () { return out.read(); }
    };

    var last = 0;
    return function (p, time) {
      var dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      if (api.reduced) { t = 1.2; }
      else if (running) t += dt;
      draw();
    };
  });
})(window.A = window.A || {});
