/* Section 1.6: assembling the Schrodinger equation out of de Broglie and
   Planck, why it has to be complex, and what its derivative orders mean. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ---------------------------------------- the equation, assembled in place --- */

  A.scene('build-schrodinger', function (root) {
    var W = 940, H = 620;
    var svg = S.root(W, H,
      'The Schrodinger equation assembled term by term: each derivative acting on a plane ' +
      'wave pulls down the corresponding physical quantity, turning the classical energy ' +
      'relation into a differential equation.');
    S.defsArrows(svg);
    root.appendChild(svg);

    function card(x, y, w, h, top, mid, bot, tone) {
      var g = S.g({});
      svg.appendChild(g);
      var r = S.rect(x, y, w, h, 's-ghost');
      r.setAttribute('fill', 'var(--surface)');
      r.setAttribute('rx', '2');
      g.appendChild(r);
      g.appendChild(S.text(x + w / 2, y + 22, top, 's-lbl', 'middle'));
      var m = S.text(x + w / 2, y + h / 2 + 12, mid, tone === 'q' ? 's-lbl-q' : 's-lbl-w', 'middle');
      m.setAttribute('font-size', '15');
      g.appendChild(m);
      if (bot) g.appendChild(S.text(x + w / 2, y + h - 12, bot, 's-lbl', 'middle'));
      return g;
    }

    var start = S.g({});
    svg.appendChild(start);
    var s1 = S.text(W / 2, 50, 'try a plane wave:   ψ(x,t) = A e^{ i(kx − ωt) }', 's-lbl-b', 'middle');
    s1.setAttribute('font-size', '16');
    start.appendChild(s1);
    var s2 = S.text(W / 2, 78, 'with Planck   E = ℏω   and de Broglie   p = h/λ = ℏk', 's-lbl-q', 'middle');
    start.appendChild(s2);

    var c1 = card(70, 120, 380, 130,
      'one derivative in time pulls down −iω',
      '∂ψ/∂t = −iω ψ',
      'so   iℏ ∂ψ/∂t = ℏω ψ = E ψ', 'w');
    var c2 = card(490, 120, 380, 130,
      'two derivatives in space pull down −k²',
      '∂²ψ/∂x² = −k² ψ',
      'so   −(ℏ²/2m) ∂²ψ/∂x² = (p²/2m) ψ', 'w');

    var mid = card(230, 300, 480, 110,
      'and the classical energy relation (1.1.2) says',
      'E = p²/2m + V',
      'multiply it through by ψ', 'q');

    var arrows = [
      S.arrow(svg, 260, 250, 400, 296, 'm'),
      S.arrow(svg, 680, 250, 540, 296, 'm')
    ];
    arrows.forEach(function (a) { svg.appendChild(a); });

    var res = S.g({});
    svg.appendChild(res);
    var box = S.rect(150, 460, 640, 96, 's-ghost');
    box.setAttribute('fill', 'var(--surface)');
    box.setAttribute('stroke', 'var(--quantum)');
    box.setAttribute('rx', '3');
    res.appendChild(box);
    var eq = S.text(W / 2, 512, 'iℏ ∂ψ/∂t  =  −(ℏ²/2m) ∇²ψ  +  V ψ', 's-lbl-b', 'middle');
    eq.setAttribute('font-size', '19');
    res.appendChild(eq);
    res.appendChild(S.text(W / 2, 540, 'each term is the one above it, with ψ attached', 's-lbl', 'middle'));
    res.appendChild(S.arrow(svg, W / 2, 412, W / 2, 454, 'q'));

    var note = S.text(W / 2, H - 16,
      'nothing was derived: a plane wave was made to satisfy the classical energy relation, ' +
      'and the result was promoted to a law', 's-lbl-f', 'middle');
    svg.appendChild(note);

    return function (p) {
      S.op(start, M.beat(p, 0.02, 0.14));
      S.op(c1, M.beat(p, 0.14, 0.3));
      S.op(c2, M.beat(p, 0.26, 0.42));
      S.op(arrows[0], M.beat(p, 0.38, 0.5));
      S.op(arrows[1], M.beat(p, 0.38, 0.5));
      S.op(mid, M.beat(p, 0.44, 0.58));
      S.op(res, M.beat(p, 0.62, 0.78));
      S.op(note, M.beat(p, 0.84, 0.96));
    };
  });

  /* ------------------------------------------------- why it cannot be real --- */

  A.scene('why-complex', function (root) {
    var W = 940, H = 560;
    var svg = S.root(W, H,
      'Substituting a real cosine into the Schrodinger equation leaves a sine on one side and ' +
      'a cosine on the other, which cannot be equal. The complex exponential reproduces ' +
      'itself on both sides and works.');
    root.appendChild(svg);

    function column(x, title, tone, lines, verdict, vtone) {
      var g = S.g({});
      svg.appendChild(g);
      var t = S.text(x, 64, title, tone === 'f' ? 's-lbl-f' : 's-lbl-w', 'start');
      t.setAttribute('font-size', '14');
      g.appendChild(t);
      g.appendChild(S.line(x, 78, x + 380, 78, 's-axis'));
      var rows = lines.map(function (l, i) {
        var e = S.text(x, 112 + i * 40, l, 's-lbl', 'start');
        e.setAttribute('font-size', '12');
        g.appendChild(e);
        return e;
      });
      var v = S.text(x, 112 + lines.length * 40 + 24, verdict,
        vtone === 'f' ? 's-lbl-f' : 's-lbl-w', 'start');
      v.setAttribute('font-size', '13');
      g.appendChild(v);
      return { g: g, rows: rows, v: v };
    }

    var left = column(60, 'try  ψ = cos(kx − ωt)', 'f', [
      'left side:   iℏ ∂ψ/∂t  =  + i ℏω sin(kx − ωt)',
      'right side:  −(ℏ²/2m) ∂²ψ/∂x²  =  (ℏ²k²/2m) cos(kx − ωt)',
      'one side carries sin, the other cos',
      'and one side carries an explicit i, the other does not',
      'sin and cos are independent functions'
    ], 'no choice of ω and k makes these equal', 'f');

    var right = column(510, 'try  ψ = e^{ i(kx − ωt) }', 'w', [
      'left side:   iℏ(−iω) e^{i(kx−ωt)}  =  ℏω ψ',
      'right side:  −(ℏ²/2m)(−k²) e^{i(kx−ωt)}  =  (ℏ²k²/2m) ψ',
      'both sides are the same function times a number',
      'so the equation reduces to  ℏω = ℏ²k²/2m',
      'which is  E = p²/2m  —  exactly what we wanted'
    ], 'it works, and it fixes the dispersion relation', 'w');

    var punch = S.g({});
    svg.appendChild(punch);
    punch.appendChild(S.line(60, H - 96, W - 60, H - 96, 's-axis'));
    var p1 = S.text(W / 2, H - 66,
      'the wave equation had real coefficients, so its real part was also a solution',
      's-lbl', 'middle');
    var p2 = S.text(W / 2, H - 42,
      'the Schrödinger equation has an explicit i, so it does not', 's-lbl-b', 'middle');
    p2.setAttribute('font-size', '14');
    var p3 = S.text(W / 2, H - 18,
      'the wavefunction is complex, and not as a convenience', 's-lbl-q', 'middle');
    punch.appendChild(p1); punch.appendChild(p2); punch.appendChild(p3);

    return function (p) {
      S.op(left.g, M.beat(p, 0.02, 0.14));
      left.rows.forEach(function (r, i) { S.op(r, M.beat(p, 0.06 + i * 0.06, 0.2 + i * 0.06)); });
      S.op(left.v, M.beat(p, 0.36, 0.48));
      S.op(right.g, M.beat(p, 0.44, 0.56));
      right.rows.forEach(function (r, i) { S.op(r, M.beat(p, 0.48 + i * 0.06, 0.62 + i * 0.06)); });
      S.op(right.v, M.beat(p, 0.76, 0.86));
      S.op(punch, M.beat(p, 0.84, 0.96));
    };
  });

  /* ------------------------------------------ the wavefunction as a helix --- */

  A.scene('phase-helix', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    return function (p, t) {
      var f = S.fitCanvas(cv, 1.75);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var time = api.reduced ? 1.2 : t * 1.1;
      var cy = h * 0.40;
      var amp = Math.min(h * 0.20, 120);
      var k = 9 / w * M.TAU;
      var muted = S.cssVar('--muted') || '#78868F';
      var ink = S.cssVar('--ink-bright') || '#EAF1F6';

      /* Axis. */
      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(w - 40, cy); ctx.stroke();
      ctx.globalAlpha = 1;

      /* A Gaussian packet times a plane wave, drawn as a helix in the complex
         plane: real part vertical, imaginary part faked by depth shading. */
      var x0 = w * 0.5, sig = w * 0.16;
      var showIm = M.beat(p, 0.20, 0.40);
      var showMod = M.beat(p, 0.50, 0.70);

      ctx.lineWidth = 2;
      var prevR = null, prevI = null;
      for (var i = 0; i <= 400; i++) {
        var x = 40 + (i / 400) * (w - 80);
        var env = Math.exp(-Math.pow((x - x0) / sig, 2));
        var ph = k * (x - x0) - time * 2.2;
        var re = env * Math.cos(ph), im = env * Math.sin(ph);
        var yr = cy - re * amp;
        var yi = cy - im * amp * 0.55 + amp * 0.55;
        if (prevR !== null) {
          ctx.strokeStyle = M.phaseColor(ph, 0.95);
          ctx.beginPath(); ctx.moveTo(prevR[0], prevR[1]); ctx.lineTo(x, yr); ctx.stroke();
          if (showIm > 0.02) {
            ctx.globalAlpha = showIm * 0.55;
            ctx.strokeStyle = M.phaseColor(ph, 0.8);
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(prevI[0], prevI[1]); ctx.lineTo(x, yi); ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
          }
        }
        prevR = [x, yr]; prevI = [x, yi];
      }

      /* |psi|^2 underneath, which is the only part anyone measures. */
      if (showMod > 0.02) {
        ctx.globalAlpha = showMod;
        var baseY = h * 0.90;
        ctx.fillStyle = 'rgba(183,139,224,0.28)';
        ctx.strokeStyle = S.cssVar('--probability') || '#B78BE0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, baseY);
        for (i = 0; i <= 300; i++) {
          var xx = 40 + (i / 300) * (w - 80);
          var e2 = Math.exp(-2 * Math.pow((xx - x0) / sig, 2));
          ctx.lineTo(xx, baseY - e2 * amp * 0.85);
        }
        ctx.lineTo(w - 40, baseY);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.font = '12px ui-monospace, monospace';
      ctx.fillStyle = ink;
      ctx.fillText('Re ψ, coloured by the phase arg ψ', 40, 34);
      if (showIm > 0.4) { ctx.fillStyle = muted; ctx.fillText('Im ψ, dashed', 40, h * 0.66); }
      if (showMod > 0.4) {
        ctx.fillStyle = S.cssVar('--probability') || '#B78BE0';
        ctx.fillText('|ψ|² — the phase has vanished, and this is all a detector sees', 40, h * 0.96);
      }
    };
  });

  /* ---------------------------- first order in time versus second order --- */

  A.scene('order-compare', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    return function (p, t) {
      var f = S.fitCanvas(cv, 1.5);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var run = M.easeInOut(M.beat(p, 0.08, 0.92));
      var time = run * 5 + (api.reduced ? 0 : 0);
      var wave = S.cssVar('--wave') || '#4FD6E3';
      var prob = S.cssVar('--probability') || '#B78BE0';
      var muted = S.cssVar('--muted') || '#78868F';
      var ink = S.cssVar('--ink-bright') || '#EAF1F6';

      var rows = [
        { y: h * 0.30, color: wave, title: 'wave equation: two time derivatives' },
        { y: h * 0.72, color: prob, title: 'Schrödinger: one time derivative' }
      ];

      ctx.font = '12px ui-monospace, monospace';
      rows.forEach(function (r, ri) {
        ctx.strokeStyle = muted; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(40, r.y); ctx.lineTo(w - 40, r.y); ctx.stroke();
        ctx.globalAlpha = 1;

        var amp = Math.min(h * 0.16, 90);
        var sig0 = w * 0.055;
        /* Row 0 keeps its shape and slides; row 1 spreads as sqrt(1 + (t/tau)^2). */
        var spread = ri === 0 ? 1 : Math.sqrt(1 + Math.pow(time * 0.55, 2));
        var sig = sig0 * spread;
        var cx = ri === 0 ? w * 0.20 + time * w * 0.11 : w * 0.5;

        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (var i = 0; i <= 320; i++) {
          var x = 40 + (i / 320) * (w - 80);
          var env = Math.exp(-Math.pow((x - cx) / sig, 2)) / spread;
          var y = r.y - env * amp;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = ink;
        ctx.fillText(r.title, 40, r.y - amp - 24);
        ctx.fillStyle = muted;
        ctx.fillText(ri === 0
          ? 'a pulse keeps its shape and travels at one fixed speed'
          : 'a packet spreads: its parts move at different speeds, so it comes apart',
          40, r.y - amp - 6);
      });

      ctx.fillStyle = muted;
      ctx.fillText('ω = c k   — every component travels at c', 40, h * 0.44);
      ctx.fillText('ω = ℏk²/2m   — the speed depends on k, so the packet disperses', 40, h * 0.94);
    };
  });

  /* ------------------------------------ why it cannot be a relativistic law --- */

  A.scene('relativity-mismatch', function (root) {
    var W = 880, H = 380;
    var svg = S.root(W, H,
      'A Lorentz transformation mixes space and time. An equation that differentiates twice in ' +
      'space and once in time cannot keep its form when the two are mixed.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var rows = [
      { y: 96, name: 'wave equation (1.1.3)', space: '∂²/∂x²', time: '∂²/∂t²', ok: true,
        verdict: 'same order both sides — survives a Lorentz boost' },
      { y: 210, name: 'Schrödinger equation (1.6.1)', space: '∂²/∂x²', time: '∂/∂t', ok: false,
        verdict: 'different orders — the form changes under a boost' }
    ];
    var built = rows.map(function (r) {
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.text(70, r.y - 26, r.name, 's-lbl-b', 'start'));
      var b1 = S.rect(70, r.y - 8, 150, 44, 's-ghost');
      b1.setAttribute('fill', 'none'); b1.setAttribute('rx', '2');
      g.appendChild(b1);
      var t1 = S.text(145, r.y + 22, r.space, 's-lbl-w', 'middle');
      t1.setAttribute('font-size', '16'); g.appendChild(t1);
      var b2 = S.rect(260, r.y - 8, 150, 44, 's-ghost');
      b2.setAttribute('fill', 'none'); b2.setAttribute('rx', '2');
      g.appendChild(b2);
      var t2 = S.text(335, r.y + 22, r.time, r.ok ? 's-lbl-w' : 's-lbl-f', 'middle');
      t2.setAttribute('font-size', '16'); g.appendChild(t2);
      g.appendChild(S.text(450, r.y + 22, r.verdict, r.ok ? 's-lbl-w' : 's-lbl-f', 'start'));
      return g;
    });

    var extra = S.g({});
    svg.appendChild(extra);
    extra.appendChild(S.line(70, 300, W - 70, 300, 's-axis'));
    extra.appendChild(S.text(70, 326,
      'and there is a second reason, visible in the construction itself:', 's-lbl', 'start'));
    var e2 = S.text(70, 350,
      'we substituted E = p²/2m, which is the non-relativistic kinetic energy', 's-lbl-q', 'start');
    e2.setAttribute('font-size', '13');
    extra.appendChild(e2);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.05 + i * 0.18, 0.28 + i * 0.18)); });
      S.op(extra, M.beat(p, 0.55, 0.78));
    };
  });

  /* ------------------------------------------- Figure 1.6.1, with wavefunctions --- */

  A.scene('psi-double-slit', function (root) {
    var W = 960, H = 620;
    var svg = S.root(W, H,
      'Probability densities for a single electron with one slit open, the other slit open, ' +
      'and both. The third is not the sum of the first two.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var sx = 250, cy = 300, sep = 54, screenX = 620;

    svg.appendChild(S.rect(sx - 6, 60, 12, (cy - sep - 8) - 60, 's-fill-i'));
    svg.appendChild(S.rect(sx - 6, cy - sep + 8, 12, (cy + sep - 8) - (cy - sep + 8), 's-fill-i'));
    svg.appendChild(S.rect(sx - 6, cy + sep + 8, 12, 540 - (cy + sep + 8), 's-fill-i'));
    svg.appendChild(S.text(sx - 20, cy - sep + 4, '1', 's-lbl-b', 'end'));
    svg.appendChild(S.text(sx - 20, cy + sep + 4, '2', 's-lbl-b', 'end'));
    svg.appendChild(S.arrow(svg, 70, cy, sx - 16, cy, 'w'));
    svg.appendChild(S.text(70, cy - 14, 'one electron', 's-lbl-w', 'start'));

    var a = 0.95, d = 4.2;
    var cases = [
      { label: 'P₁ = |ψ₁|²', off: -160, fn: function (u) { return M.singleSlit(u - 0.35, a); }, cls: 's-prob' },
      { label: 'P₂ = |ψ₂|²', off: 0, fn: function (u) { return M.singleSlit(u + 0.35, a); }, cls: 's-prob' },
      { label: 'P = |ψ₁ + ψ₂|²', off: 170, fn: function (u) {
          return 4 * M.singleSlit(u, a) * Math.pow(Math.cos(Math.PI * d * u / 2), 2) / 4;
        }, cls: 's-wave' }
    ];

    var built = cases.map(function (c, i) {
      var g = S.g({});
      svg.appendChild(g);
      var bx = screenX + 110 + c.off * 0;
      var y0 = 90 + i * 170;
      g.appendChild(S.line(screenX + 20, y0 + 120, screenX + 300, y0 + 120, 's-axis'));
      var pth = S.path('', c.cls);
      g.appendChild(pth);
      S.setD(pth, S.polyD(S.sample(300, -2.4, 2.4, function (u) {
        return [M.map(u, -2.4, 2.4, screenX + 20, screenX + 300), y0 + 120 - c.fn(u) * 106];
      })));
      var l = S.text(screenX + 20, y0 + 16, c.label, i === 2 ? 's-lbl-w' : 's-lbl-p', 'start');
      l.setAttribute('font-size', '13');
      g.appendChild(l);
      var sub = S.text(screenX + 20, y0 + 140,
        i === 0 ? 'slit 1 open, 2 closed' : (i === 1 ? 'slit 1 closed, 2 open' : 'both open'),
        's-lbl', 'start');
      g.appendChild(sub);
      return { g: g, path: pth };
    });

    var sumNote = S.text(sx + 20, H - 40,
      'P ≠ P₁ + P₂', 's-lbl-f', 'start');
    sumNote.setAttribute('font-size', '17');
    svg.appendChild(sumNote);
    var sumNote2 = S.text(sx + 20, H - 16,
      'the amplitudes add, and only then is the square taken', 's-lbl-b', 'start');
    svg.appendChild(sumNote2);

    return function (p) {
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.06 + i * 0.16, 0.26 + i * 0.16));
        S.draw(b.path, M.easeOut(M.beat(p, 0.1 + i * 0.16, 0.42 + i * 0.16)));
      });
      S.op(sumNote, M.beat(p, 0.66, 0.82));
      S.op(sumNote2, M.beat(p, 0.76, 0.92));
    };
  });
})(window.A = window.A || {});
