/* Section 1.5, first half: the chain from Planck and Einstein to lambda = h/p,
   the scale comparison that says which objects diffract, and the geometry of
   the 2012 electron experiment. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------- the relativistic energy shell, m0 -> 0 --- */

  A.scene('energy-shell', function (root) {
    var W = 880, H = 486;
    var svg = S.root(W, H,
      'Energy against momentum for a massive particle is a hyperbola that starts at the rest ' +
      'energy. As the rest mass goes to zero the hyperbola collapses onto the straight line ' +
      'E equals p c.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 90, x1 = 720, yB = 360, yT = 60;
    var pMax = 3.2, eMax = 3.4;
    var PX = function (v) { return M.map(v, 0, pMax, x0, x1); };
    var PY = function (v) { return M.map(v, 0, eMax, yB, yT); };
    svg.appendChild(S.gridLines(x0, yT, x1, yB, 8, 5));
    svg.appendChild(S.axes(x0, yT, x1, yB, 'momentum  p c', null));
    svg.appendChild(S.text(x0 - 8, yT - 8, 'energy E', 's-lbl', 'end'));

    var light = S.poly([[PX(0), PY(0)], [PX(pMax), PY(pMax)]], 's-wave');
    light.setAttribute('stroke-dasharray', '6 5');
    svg.appendChild(light);
    svg.appendChild(S.text(PX(2.7), PY(2.55), 'E = p c', 's-lbl-w', 'start'));

    var curves = [], labels = [];
    [2.0, 1.2, 0.6, 0.2, 0.0].forEach(function (m0, i) {
      var pth = S.path('', i === 4 ? 's-wave' : 's-quantum');
      svg.appendChild(pth);
      S.setD(pth, S.polyD(S.sample(140, 0, pMax, function (pc) {
        return [PX(pc), PY(Math.sqrt(pc * pc + m0 * m0))];
      })));
      curves.push(pth);
      var l = S.text(PX(0) - 8, PY(m0) + 4, m0 === 0 ? '0' : 'm₀c² = ' + m0.toFixed(1), 's-lbl-q', 'end');
      svg.appendChild(l);
      labels.push(l);
    });

    var chain = [
      'E² = p²c² + m₀²c⁴          (Einstein)',
      'light travels at c in free space, so a photon has no rest frame',
      'and E = m₀c² / √(1 − v²/c²) would be infinite at v = c unless m₀ = 0',
      'set m₀ = 0:        E = p c'
    ].map(function (s, i) {
      var t = S.text(W / 2, 396 + i * 22, s, i === 3 ? 's-lbl-w' : 's-lbl', 'middle');
      t.setAttribute('font-size', i === 3 ? '13' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      curves.forEach(function (cv, i) {
        var f = M.beat(p, 0.04 + i * 0.09, 0.24 + i * 0.09);
        S.op(cv, i === 4 ? f : f * 0.55);
        S.op(labels[i], f * 0.9);
      });
      S.op(light, M.beat(p, 0.05, 0.2));
      chain.forEach(function (l, i) { S.op(l, M.beat(p, 0.4 + i * 0.12, 0.56 + i * 0.12)); });
    };
  });

  /* ------------------------------------ which objects have a useful wavelength --- */

  A.scene('debroglie-scale', function (root) {
    var W = 1060, H = 340;
    var svg = S.root(W, H,
      'De Broglie wavelengths on a logarithmic ruler, against the sizes of the things that ' +
      'would have to act as slits. Only where the two are comparable does wave behaviour show.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 80, x1 = 990, yAx = 210;
    var lo = -35, hi = -6;    /* log10 of metres */
    var PX = function (lg) { return M.map(lg, lo, hi, x0, x1); };

    var gAx = S.g({});
    svg.appendChild(gAx);
    gAx.appendChild(S.line(x0, yAx, x1, yAx, 's-axis'));
    for (var lg = lo; lg <= hi; lg += 3) {
      gAx.appendChild(S.line(PX(lg), yAx, PX(lg), yAx + 7, 's-axis'));
      gAx.appendChild(S.text(PX(lg), yAx + 24, '10' + String(lg).replace('-', '⁻')
        .replace(/[0-9]/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }), 's-tick', 'middle'));
    }
    gAx.appendChild(S.text(x1, yAx + 48, 'metres', 's-lbl', 'end'));

    var C = M.C;
    var items = [
      { lg: Math.log10(C.h / 1), name: 'a 1 kg object at 1 m/s', val: '6.6 × 10⁻³⁴ m', tone: 'f', up: 1 },
      { lg: Math.log10(C.h / Math.sqrt(2 * C.me * 600 * C.e)), name: 'an electron at 600 eV', val: '0.050 nm', tone: 'w', up: 1 },
      { lg: Math.log10(2 * Math.PI * C.a0), name: 'an electron in hydrogen, n = 1', val: '0.33 nm', tone: 'w', up: 0 },
      { lg: Math.log10(62e-9), name: 'the slit in the 2012 experiment', val: '62 nm', tone: 'q', up: 0 },
      { lg: Math.log10(1e-10), name: 'the size of an atom', val: '0.1 nm', tone: 'q', up: 1 }
    ];

    var marks = items.map(function (it, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = it.up ? yAx - 40 - (i % 3) * 44 : yAx + 66 + (i % 2) * 40;
      var cls = { f: 's-lbl-f', w: 's-lbl-w', q: 's-lbl-q' }[it.tone];
      g.appendChild(S.line(PX(it.lg), yAx, PX(it.lg), y + (it.up ? 8 : -12), 's-axis s-dash'));
      g.appendChild(S.circle(PX(it.lg), yAx, 4, { f: 's-fill-f', w: 's-fill-w', q: 's-fill-q' }[it.tone]));
      var anchor = PX(it.lg) > W * 0.7 ? 'end' : 'start';
      var dx = anchor === 'end' ? -8 : 8;
      g.appendChild(S.text(PX(it.lg) + dx, y, it.name, cls, anchor));
      g.appendChild(S.text(PX(it.lg) + dx, y + 17, it.val, 's-lbl', anchor));
      return g;
    });

    var verdict = S.text(W / 2, H - 16,
      'wave behaviour needs an obstacle the size of the wavelength; for the 1 kg object no ' +
      'such obstacle exists, or could', 's-lbl-b', 'middle');
    svg.appendChild(verdict);

    return function (p) {
      S.op(gAx, M.beat(p, 0.03, 0.2));
      marks.forEach(function (g, i) { S.op(g, M.beat(p, 0.18 + i * 0.1, 0.36 + i * 0.1)); });
      S.op(verdict, M.beat(p, 0.78, 0.94));
    };
  });

  /* ------------------------------- the geometry of the 2012 electron experiment --- */

  A.scene('electron-geometry', function (root) {
    var W = 940, H = 560;
    var svg = S.root(W, H,
      'The double-slit geometry of the 2013 experiment, with the diffraction envelope set by ' +
      'the slit width and the fine fringe spacing set by the slit separation.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var sx = 210, cy = 250, screenX = 830;

    var gGun = S.g({});
    svg.appendChild(gGun);
    gGun.appendChild(S.rect(50, cy - 26, 66, 52, 's-ghost'));
    gGun.appendChild(S.text(83, cy + 46, 'electron gun', 's-lbl', 'middle'));
    gGun.appendChild(S.text(83, cy + 66, 'Δφ = 600 V', 's-lbl-q', 'middle'));
    gGun.appendChild(S.arrow(svg, 120, cy, sx - 12, cy, 'w'));

    var gBar = S.g({});
    svg.appendChild(gBar);
    var slitHalf = 5, sep = 26;
    gBar.appendChild(S.rect(sx - 6, 60, 12, (cy - sep - slitHalf) - 60, 's-fill-i'));
    gBar.appendChild(S.rect(sx - 6, cy - sep + slitHalf, 12, (cy + sep - slitHalf) - (cy - sep + slitHalf), 's-fill-i'));
    gBar.appendChild(S.rect(sx - 6, cy + sep + slitHalf, 12, 440 - (cy + sep + slitHalf), 's-fill-i'));
    gBar.appendChild(S.text(sx - 20, cy - sep - 16, 'a = 62 nm', 's-lbl-q', 'end'));
    gBar.appendChild(S.text(sx - 20, cy + sep + 26, 'd = 272 nm', 's-lbl-q', 'end'));

    var gFan = S.g({});
    svg.appendChild(gFan);
    /* The real half-angle is 8 x 10^-4 rad; drawn much larger so it is visible. */
    var drawn = 0.30;
    var fan = S.el('polygon', {
      points: [sx, cy - sep, screenX, cy - Math.tan(drawn) * (screenX - sx),
               screenX, cy + Math.tan(drawn) * (screenX - sx), sx, cy + sep].join(' '),
      fill: 'var(--wave)', 'fill-opacity': '0.07', stroke: 'none'
    });
    gFan.appendChild(fan);
    gFan.appendChild(S.line(sx, cy, screenX, cy, 's-axis s-dash'));
    gFan.appendChild(S.text((sx + screenX) / 2, cy + 18, 'D = 30.5 cm', 's-lbl', 'middle'));
    gFan.appendChild(S.text(sx + 40, cy - 40, '2θ = 2λ/a  (drawn far larger than life)', 's-lbl', 'start'));

    var gScreen = S.g({});
    svg.appendChild(gScreen);
    gScreen.appendChild(S.line(screenX, 70, screenX, 430, 's-axis'));
    var prof = S.path('', 's-wave');
    gScreen.appendChild(prof);
    S.setD(prof, S.polyD(S.sample(400, -2.4, 2.4, function (u) {
      var I = M.singleSlit(u, 1.0) * Math.pow(Math.cos(Math.PI * 4.4 * u / 2), 2);
      return [screenX + I * 78, cy + u * 74];
    })));
    gScreen.appendChild(S.text(screenX + 8, 60, 'detector', 's-lbl', 'start'));

    var numbers = [
      'E = eΔφ = 9.6 × 10⁻¹⁷ J',
      'p = √(2mE) = 1.3 × 10⁻²³ kg·m/s',
      'λ = h/p = 5.0 × 10⁻¹¹ m = 0.050 nm',
      'λ/a = 0.050/62 = 8.1 × 10⁻⁴  →  2θ = 1.6 × 10⁻³ rad',
      'Δy = 2θD = 1.6 × 10⁻³ × 0.305 m = 0.49 mm',
      'fringe angle λ/d = 0.050/272 = 1.8 × 10⁻⁴ rad'
    ].map(function (s, i) {
      var t = S.text(60, 470 + i * 15, s, 's-lbl', 'start');
      t.setAttribute('font-size', '11');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      S.op(gGun, M.beat(p, 0.02, 0.16));
      S.op(gBar, M.beat(p, 0.14, 0.3));
      S.op(gFan, M.beat(p, 0.28, 0.46));
      S.op(gScreen, M.beat(p, 0.42, 0.6));
      S.draw(prof, M.easeOut(M.beat(p, 0.44, 0.72)));
      numbers.forEach(function (n, i) { S.op(n, M.beat(p, 0.5 + i * 0.07, 0.64 + i * 0.07)); });
    };
  });
})(window.A = window.A || {});
