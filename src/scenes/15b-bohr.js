/* Section 1.5, second half: the Bohr atom built out of the de Broglie wave, the
   quantities that fall out of it, and the classical collapse it was invented to
   avoid. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;
  var C = M.C;

  /* ------------------------------------- Coulomb attraction and circular motion --- */

  A.scene('bohr-orbit', function (root, api) {
    var W = 1000, H = 420;
    var svg = S.root(W, H,
      'An electron in a circular orbit around a fixed proton. The Coulomb attraction supplies ' +
      'exactly the centripetal force the circular motion requires.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 280, cy = 210, Rr = 130;
    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: Rr, class: 's-ghost', 'stroke-dasharray': '4 5' }));
    var proton = S.circle(cx, cy, 9, 's-fill-q');
    svg.appendChild(proton);
    svg.appendChild(S.text(cx, cy + 26, 'proton, +e', 's-lbl-q', 'middle'));

    var elec = S.circle(cx + Rr, cy, 6.5, 's-fill-w');
    var fArrow = S.arrow(svg, 0, 0, 0, 0, 'f');
    fArrow.setAttribute('stroke-width', '2.5');
    var vArrow = S.arrow(svg, 0, 0, 0, 0, 'w');
    vArrow.setAttribute('stroke-width', '2.5');
    svg.appendChild(fArrow); svg.appendChild(vArrow); svg.appendChild(elec);
    var eLbl = S.text(0, 0, 'electron, −e', 's-lbl-w', 'start');
    var fLbl = S.text(0, 0, 'F', 's-lbl-f', 'middle');
    var vLbl = S.text(0, 0, 'v', 's-lbl-w', 'middle');
    svg.appendChild(eLbl); svg.appendChild(fLbl); svg.appendChild(vLbl);
    var rLine = S.line(cx, cy, cx + Rr, cy, 's-axis');
    svg.appendChild(rLine);
    var rLbl = S.text(cx + Rr / 2, cy - 8, 'r', 's-lbl-b', 'middle');
    svg.appendChild(rLbl);

    var chain = [
      'Coulomb force = centripetal force',
      'e² / 4πε₀r²  =  m v² / r',
      'so   m v²  =  e² / 4πε₀r      and      T = ½mv² = e² / 8πε₀r',
      'V = − e² / 4πε₀r        (attraction, so negative)',
      'E = T + V = e²/8πε₀r − e²/4πε₀r = − e² / 8πε₀r = − T = − p²/2mₑ'
    ].map(function (s, i) {
      var t = S.text(500, 96 + i * 40, s, i === 4 ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', i === 4 ? '12.5' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p, t) {
      var ang = api.reduced ? 0.5 : t * 0.55;
      var ex = cx + Math.cos(ang) * Rr, ey = cy - Math.sin(ang) * Rr;
      elec.setAttribute('cx', ex.toFixed(1)); elec.setAttribute('cy', ey.toFixed(1));
      rLine.setAttribute('x2', ex.toFixed(1)); rLine.setAttribute('y2', ey.toFixed(1));
      rLbl.setAttribute('x', (cx + ex) / 2); rLbl.setAttribute('y', (cy + ey) / 2 - 8);
      eLbl.setAttribute('x', ex + 12); eLbl.setAttribute('y', ey - 10);

      /* Force points inward; velocity is tangential. */
      fArrow.setAttribute('x1', ex); fArrow.setAttribute('y1', ey);
      fArrow.setAttribute('x2', ex + (cx - ex) * 0.35); fArrow.setAttribute('y2', ey + (cy - ey) * 0.35);
      fLbl.setAttribute('x', ex + (cx - ex) * 0.22 + 12); fLbl.setAttribute('y', ey + (cy - ey) * 0.22);

      var tx = -Math.sin(ang), ty = -Math.cos(ang);
      vArrow.setAttribute('x1', ex); vArrow.setAttribute('y1', ey);
      vArrow.setAttribute('x2', ex + tx * 52); vArrow.setAttribute('y2', ey + ty * 52);
      vLbl.setAttribute('x', ex + tx * 64); vLbl.setAttribute('y', ey + ty * 64);

      chain.forEach(function (c, i) { S.op(c, M.beat(p, 0.14 + i * 0.13, 0.3 + i * 0.13)); });
    };
  });

  /* ----------------------------- the standing wave that has to close on itself --- */

  A.scene('bohr-standing', function (root, api) {
    var W = 900, H = 620;
    var svg = S.root(W, H,
      'The electron wave wrapped around a circular orbit. Only when a whole number of ' +
      'wavelengths fits the circumference does the wave join up with itself; otherwise it ' +
      'cancels.');
    root.appendChild(svg);

    var cx = 420, cy = 290, Rr = 175, amp = 40;

    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: Rr, class: 's-ghost', 'stroke-dasharray': '3 6' }));
    svg.appendChild(S.circle(cx, cy, 7, 's-fill-q'));

    var wave = S.path('', 's-wave');
    var gap = S.path('', 's-fail');
    gap.setAttribute('stroke-width', '3');
    svg.appendChild(wave); svg.appendChild(gap);

    var nLbl = S.text(cx, 56, '', 's-lbl-b', 'middle');
    nLbl.setAttribute('font-size', '16');
    svg.appendChild(nLbl);
    var verdict = S.text(cx, H - 92, '', 's-lbl-w', 'middle');
    verdict.setAttribute('font-size', '14');
    svg.appendChild(verdict);
    var rule = S.text(cx, H - 60, 'n λ = 2π r      with      λ = h / p', 's-lbl-b', 'middle');
    rule.setAttribute('font-size', '15');
    svg.appendChild(rule);
    var rule2 = S.text(cx, H - 34, 'so   n h / p = 2π r   and   p r = n ℏ', 's-lbl-q', 'middle');
    svg.appendChild(rule2);

    return function (p, t) {
      /* Sweep n continuously so the reader sees the failures between integers. */
      var nRaw = M.lerp(0.6, 5.4, M.easeInOut(M.beat(p, 0.06, 0.94)));
      var integer = Math.abs(nRaw - Math.round(nRaw)) < 0.055 && Math.round(nRaw) >= 1;
      var nShow = integer ? Math.round(nRaw) : nRaw;
      var phase = api.reduced ? 0 : t * 0.8;

      var pts = [], i;
      for (i = 0; i <= 400; i++) {
        var th = (i / 400) * M.TAU;
        var r = Rr + Math.sin(nRaw * th + phase) * amp;
        pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
      }
      S.setD(wave, S.polyD(pts));
      wave.setAttribute('stroke', integer ? 'var(--wave)' : 'var(--hairline-2)');

      /* When n is not a whole number the wave fails to meet its own start. */
      var startR = Rr + Math.sin(phase) * amp;
      var endR = Rr + Math.sin(nRaw * M.TAU + phase) * amp;
      S.setD(gap, 'M' + (cx + startR) + ' ' + cy + 'L' + (cx + endR) + ' ' + cy);
      S.op(gap, integer ? 0 : 1);

      nLbl.textContent = 'n = ' + nShow.toFixed(integer ? 0 : 2);
      verdict.textContent = integer
        ? 'the wave closes on itself: this orbit is allowed'
        : 'the wave does not meet its own tail: it cancels, and this orbit does not exist';
      verdict.setAttribute('class', integer ? 's-lbl-w' : 's-lbl-f');
      S.op(rule, M.beat(p, 0.3, 0.5));
      S.op(rule2, M.beat(p, 0.5, 0.7));
    };
  });

  /* --------------------------------------------- the quantised radii and energies --- */

  A.scene('bohr-levels', function (root) {
    var W = 950, H = 460;
    var svg = S.root(W, H,
      'The allowed radii grow as n squared and the allowed energies rise towards zero as one ' +
      'over n squared, crowding together at the top.');
    root.appendChild(svg);

    /* Left: orbits to scale, r_n = n^2 a0. */
    var cx = 210, cy = 230, scale = 12;
    var gOrb = S.g({});
    svg.appendChild(gOrb);
    gOrb.appendChild(S.circle(cx, cy, 5, 's-fill-q'));
    var orbits = [];
    for (var n = 1; n <= 4; n++) {
      var c = S.el('circle', { cx: cx, cy: cy, r: n * n * scale, class: 's-ghost' });
      if (n === 1) c.setAttribute('stroke', 'var(--wave)');
      gOrb.appendChild(c);
      orbits.push(c);
      gOrb.appendChild(S.text(cx, cy - n * n * scale - 5, 'n=' + n, 's-tick', 'middle'));
    }
    gOrb.appendChild(S.text(cx, 420, 'rₙ = n² a₀,    a₀ = 5.29 × 10⁻¹¹ m', 's-lbl-w', 'middle'));

    /* Right: the energy level diagram. */
    var lx = 500, lw = 260, yTop = 70, yBot = 380;
    var gLev = S.g({});
    svg.appendChild(gLev);
    gLev.appendChild(S.line(lx - 20, yTop, lx - 20, yBot, 's-axis'));
    gLev.appendChild(S.text(lx - 28, yTop + 4, '0 eV', 's-tick', 'end'));
    var levels = [];
    for (n = 1; n <= 6; n++) {
      var E = -13.606 / (n * n);
      var y = M.map(E, -13.606, 0, yBot, yTop);
      var l = S.line(lx, y, lx + lw, y, 's-quantum');
      gLev.appendChild(l);
      var lab = S.text(lx + lw + 10, y + 4,
        'n = ' + n + '   E = ' + E.toFixed(2) + ' eV', 's-lbl-q', 'start');
      if (n > 4) lab.setAttribute('opacity', '0.6');
      gLev.appendChild(lab);
      levels.push(l);
    }
    gLev.appendChild(S.text(lx, yBot + 28, 'Eₙ = − 13.6 eV / n²', 's-lbl-b', 'start'));
    gLev.appendChild(S.text(lx, yBot + 50, 'the ground state sits 13.6 eV below freedom', 's-lbl', 'start'));

    return function (p) {
      S.op(gOrb, M.beat(p, 0.03, 0.2));
      orbits.forEach(function (o, i) { S.op(o, M.beat(p, 0.06 + i * 0.07, 0.24 + i * 0.07)); });
      S.op(gLev, M.beat(p, 0.34, 0.52));
      levels.forEach(function (l, i) { S.op(l, M.beat(p, 0.38 + i * 0.06, 0.56 + i * 0.06)); });
    };
  });

  /* --------------------------------- speed, angular momentum, and the fine structure --- */

  A.scene('bohr-speed', function (root) {
    var W = 880, H = 366;
    var svg = S.root(W, H,
      'The orbital speed as a fraction of the speed of light, and the angular momentum, both ' +
      'as functions of the quantum number.');
    root.appendChild(svg);

    var alpha = C.alpha;
    var rows = [];
    for (var n = 1; n <= 5; n++) {
      rows.push([n, (alpha / n).toExponential(2), (alpha / n * 100).toFixed(3) + ' %', n + ' ℏ']);
    }

    var x = [110, 300, 500, 700];
    var head = ['n', 'vₙ / c = α/n', 'as a percentage', 'angular momentum'];
    var gHead = S.g({});
    svg.appendChild(gHead);
    head.forEach(function (h, i) { gHead.appendChild(S.text(x[i], 84, h, 's-lbl-q', 'start')); });
    gHead.appendChild(S.line(90, 96, 830, 96, 's-axis'));

    var built = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      r.forEach(function (cell, j) {
        g.appendChild(S.text(x[j], 124 + i * 30, String(cell), j === 0 ? 's-lbl-b' : 's-lbl', 'start'));
      });
      return g;
    });

    var note = S.text(W / 2, H - 44,
      'α = e² / 4πε₀ℏc = 1/137.04 is the fine structure constant', 's-lbl-w', 'middle');
    svg.appendChild(note);
    var note2 = S.text(W / 2, H - 42,
      'at 0.7 % of light speed the relativistic correction is about 0.003 %:', 's-lbl', 'middle');
    var note3 = S.text(W / 2, H - 20,
      'small, but measurable, and it is the fine structure of the spectrum', 's-lbl', 'middle');
    svg.appendChild(note2); svg.appendChild(note3);

    return function (p) {
      S.op(gHead, M.beat(p, 0.04, 0.2));
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.14 + i * 0.09, 0.32 + i * 0.09)); });
      S.op(note, M.beat(p, 0.6, 0.78));
      S.op(note2, M.beat(p, 0.72, 0.9));
      S.op(note3, M.beat(p, 0.78, 0.94));
    };
  });

  /* ------------------------------ the classical atom falling in, by Larmor --- */

  A.scene('larmor-spiral', function (root) {
    var W = 1080, H = 600;
    var svg = S.root(W, H,
      'The path a classical electron would follow while radiating according to the Larmor ' +
      'formula: a spiral into the proton, complete in about sixteen picoseconds.');
    root.appendChild(svg);

    var cx = 300, cy = 300, R0 = 220;
    svg.appendChild(S.el('circle', { cx: cx, cy: cy, r: R0, class: 's-ghost', 'stroke-dasharray': '3 6' }));
    svg.appendChild(S.circle(cx, cy, 8, 's-fill-q'));
    svg.appendChild(S.text(cx, cy + 28, 'proton', 's-lbl-q', 'middle'));
    svg.appendChild(S.text(cx + R0 + 10, cy + 4, 'n = 1 orbit', 's-lbl', 'start'));

    var spiral = S.path('', 's-fail');
    svg.appendChild(spiral);
    var dot = S.circle(cx + R0, cy, 5, 's-fill-f');
    svg.appendChild(dot);

    /* r(t)^3 = a0^3 - 3 K t, from integrating dr/dt = -K / r^2. */
    var a0 = C.a0;
    var K = Math.pow(C.e, 4) / (12 * Math.PI * Math.PI * C.eps0 * C.eps0 * C.me * C.me * Math.pow(C.c, 3));
    var tFall = Math.pow(a0, 3) / (3 * K);

    var lines = [
      'Larmor:   dE/dt = − q² a² / 6πε₀c³',
      'centripetal acceleration   a = e² / 4πε₀mₑr²',
      'and from the orbit,   E(r) = − e² / 8πε₀r,   so  dE/dr = e²/8πε₀r²',
      'dr/dt = (dE/dt)/(dE/dr) = − e⁴ / 12π²ε₀²mₑ²c³ r²',
      'separate and integrate:   ∫₀^{a₀} r² dr = K t,   t = a₀³ / 3K'
    ].map(function (s, i) {
      var t = S.text(600, 120 + i * 34, s, 's-lbl', 'start');
      t.setAttribute('font-size', '11.5');
      svg.appendChild(t);
      return t;
    });

    var answer = S.text(600, 320, '', 's-lbl-f', 'start');
    answer.setAttribute('font-size', '15');
    svg.appendChild(answer);
    var moral = S.text(600, 360, '', 's-lbl-b', 'start');
    moral.setAttribute('font-size', '12');
    svg.appendChild(moral);
    var moral2 = S.text(600, 382, '', 's-lbl', 'start');
    moral2.setAttribute('font-size', '12');
    svg.appendChild(moral2);

    var clock = S.text(cx, H - 40, '', 's-lbl-f', 'middle');
    svg.appendChild(clock);

    return function (p) {
      var frac = M.easeInOut(M.beat(p, 0.12, 0.9));
      var tNow = frac * tFall;

      var pts = [], i, N = 900;
      for (i = 0; i <= N * frac; i++) {
        var tt = (i / N) * tFall;
        var r3 = Math.pow(a0, 3) - 3 * K * tt;
        if (r3 <= 0) break;
        var r = Math.pow(r3, 1 / 3);
        /* Angle accumulates faster as the orbit tightens; drawn compressed so
           the whole spiral is legible rather than a solid disc. */
        var th = 34 * (1 - Math.pow(r / a0, 1.5));
        pts.push([cx + Math.cos(th) * (r / a0) * R0, cy + Math.sin(th) * (r / a0) * R0]);
      }
      S.setD(spiral, S.polyD(pts));
      if (pts.length) {
        dot.setAttribute('cx', pts[pts.length - 1][0].toFixed(1));
        dot.setAttribute('cy', pts[pts.length - 1][1].toFixed(1));
      }

      lines.forEach(function (l, i2) { S.op(l, M.beat(p, 0.1 + i2 * 0.1, 0.26 + i2 * 0.1)); });
      answer.textContent = 't = ' + (tFall * 1e12).toFixed(2) + ' picoseconds';
      S.op(answer, M.beat(p, 0.62, 0.78));
      moral.textContent = 'a classical hydrogen atom lasts 16 trillionths of a second';
      moral2.textContent = 'matter exists, so this model of it is wrong';
      S.op(moral, M.beat(p, 0.72, 0.86));
      S.op(moral2, M.beat(p, 0.8, 0.94));

      clock.textContent = 't = ' + (tNow * 1e12).toFixed(2) + ' ps    r = ' +
        (Math.pow(Math.max(0, Math.pow(a0, 3) - 3 * K * tNow), 1 / 3) * 1e12).toFixed(2) + ' pm';
    };
  });

  /* ------------------------------------- what a world with hbar = 1 J s looks like --- */

  A.scene('hbar-one', function (root) {
    var W = 880, H = 360;
    var svg = S.root(W, H,
      'De Broglie wavelength of a walking person for the real Planck constant and for a ' +
      'hypothetical one of one joule second.');
    root.appendChild(svg);

    var rows = [
      ['ℏ = 1.05 × 10⁻³⁴ J·s', 'λ = h/p = 6.6 × 10⁻³⁴ m', 'smaller than a proton by 10¹⁹', 'f'],
      ['ℏ = 1 J·s', 'λ = h/p ≈ 6 m', 'wider than a doorway', 'q']
    ];
    var built = rows.map(function (r, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = 110 + i * 100;
      g.appendChild(S.rect(70, y - 44, 740, 78, 's-ghost'));
      g.appendChild(S.text(96, y - 16, r[0], r[3] === 'q' ? 's-lbl-q' : 's-lbl', 'start'));
      var e = S.text(96, y + 12, r[1], 's-lbl-b', 'start');
      e.setAttribute('font-size', '14');
      g.appendChild(e);
      g.appendChild(S.text(790, y + 4, r[2], r[3] === 'q' ? 's-lbl-q' : 's-lbl-f', 'end'));
      return g;
    });

    svg.appendChild(S.text(70, 66, 'a 70 kg person walking at 1.4 m/s', 's-lbl', 'start'));
    var moral = S.text(W / 2, H - 40,
      'you would diffract through doorways and interfere with yourself', 's-lbl-q', 'middle');
    moral.setAttribute('font-size', '13');
    svg.appendChild(moral);
    var moral2 = S.text(W / 2, H - 16,
      'the smallness of ℏ is the only reason the classical world looks classical',
      's-lbl-b', 'middle');
    svg.appendChild(moral2);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.08 + i * 0.2, 0.32 + i * 0.2)); });
      S.op(moral, M.beat(p, 0.56, 0.74));
      S.op(moral2, M.beat(p, 0.72, 0.9));
    };
  });
})(window.A = window.A || {});
