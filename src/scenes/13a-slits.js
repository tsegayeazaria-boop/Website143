/* Section 1.3: a beam through a wide slit, a beam through a narrow one, the
   pairing argument that locates the first minimum, and the phasor sum that
   produces the whole pattern. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------ a slit much wider than λ --- */

  A.scene('wide-slit', function (root) {
    var W = 1010, H = 320;
    var svg = S.root(W, H,
      'A laser beam passing through a slit far wider than its wavelength travels straight ' +
      'through and lands as a bright patch the size of the slit.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var sx = 300, sy = 160, half = 58, screenX = 780;

    var gBar = S.g({});
    svg.appendChild(gBar);
    gBar.appendChild(S.rect(sx - 7, 30, 14, sy - half - 30, 's-fill-i'));
    gBar.appendChild(S.rect(sx - 7, sy + half, 14, H - 90 - (sy + half) + 40, 's-fill-i'));
    gBar.appendChild(S.text(sx, 22, 'slit width a ≫ λ', 's-lbl-b', 'middle'));

    var gBeam = S.g({});
    svg.appendChild(gBeam);
    for (var i = 0; i <= 10; i++) {
      var y = sy - half + (i / 10) * 2 * half;
      var l = S.line(60, y, screenX, y, 's-wave');
      l.setAttribute('stroke-opacity', '0.5');
      gBeam.appendChild(l);
    }
    gBeam.appendChild(S.text(70, sy - half - 14, 'λ', 's-lbl-w', 'start'));

    var gScreen = S.g({});
    svg.appendChild(gScreen);
    gScreen.appendChild(S.line(screenX, 40, screenX, H - 50, 's-axis'));
    gScreen.appendChild(S.text(screenX + 34, 36, 'viewing screen', 's-lbl', 'start'));
    var patch = S.rect(screenX + 2, sy - half, 26, 2 * half, 's-fill-w');
    patch.setAttribute('opacity', '0.8');
    gScreen.appendChild(patch);
    gScreen.appendChild(S.text(screenX + 36, sy + 4, 'a bright patch,', 's-lbl-w', 'start'));
    gScreen.appendChild(S.text(screenX + 36, sy + 22, 'the width of the slit', 's-lbl-w', 'start'));

    var caption = S.text(60, H - 24,
      'intensity  I = c ε₀ ⟨E²⟩  — geometry, no diffraction worth speaking of', 's-lbl', 'start');
    svg.appendChild(caption);

    return function (p) {
      S.op(gBar, M.beat(p, 0.02, 0.2));
      S.op(gBeam, M.beat(p, 0.18, 0.42));
      S.op(gScreen, M.beat(p, 0.4, 0.64));
      S.op(caption, M.beat(p, 0.66, 0.86));
    };
  });

  /* ------------------------------------------------------ Huygens wavelets --- */

  A.scene('huygens', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    return function (p, t) {
      var f = S.fitCanvas(cv, 1.5);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var wave = S.cssVar('--wave') || '#4FD6E3';
      var ink = S.cssVar('--muted') || '#78868F';
      var bright = S.cssVar('--ink-bright') || '#EAF1F6';

      var sx = w * 0.34, cy = h * 0.5;
      var halfWide = h * 0.30;
      /* The slit narrows as the reader scrolls: many wavelets become few. */
      var narrow = M.easeInOut(M.beat(p, 0.30, 0.72));
      var half = M.lerp(halfWide, h * 0.045, narrow);
      var lam = h * 0.055;
      var time = api.reduced ? 3 : t * 1.1;

      /* Incoming plane wave on the left. */
      ctx.strokeStyle = wave;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      for (var k = 0; k < 14; k++) {
        var x = ((time * lam * 0.6 + k * lam) % (sx - 20));
        ctx.beginPath();
        ctx.moveTo(x, cy - halfWide * 1.5);
        ctx.lineTo(x, cy + halfWide * 1.5);
        ctx.stroke();
      }

      /* The barrier. */
      ctx.globalAlpha = 1;
      ctx.fillStyle = bright;
      ctx.fillRect(sx - 4, 0, 8, cy - half);
      ctx.fillRect(sx - 4, cy + half, 8, h - (cy + half));

      /* Secondary sources across the opening, each radiating a circular wave. */
      var n = Math.max(2, Math.round(M.lerp(15, 3, narrow)));
      ctx.lineWidth = 1;
      for (var i = 0; i < n; i++) {
        var sy2 = cy - half + (n === 1 ? half : (i / (n - 1)) * 2 * half);
        ctx.strokeStyle = wave;
        for (var r = 0; r < 9; r++) {
          var rad = ((time * lam * 0.6 + r * lam) % (lam * 9));
          if (rad < 2) continue;
          ctx.globalAlpha = 0.30 * (1 - rad / (lam * 9));
          ctx.beginPath();
          ctx.arc(sx, sy2, rad * 3.2, -Math.PI / 2.05, Math.PI / 2.05);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = wave;
        ctx.beginPath();
        ctx.arc(sx, sy2, 2.4, 0, M.TAU);
        ctx.fill();
      }

      /* The envelope of the wavelets: what the beam looks like downstream. */
      ctx.globalAlpha = M.beat(p, 0.45, 0.7) * 0.85;
      ctx.strokeStyle = ink;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.4;
      var spread = Math.atan2(lam * 3.2, Math.max(1, half));
      ctx.beginPath();
      ctx.moveTo(sx, cy - half);
      ctx.lineTo(w, cy - half - Math.tan(spread) * (w - sx));
      ctx.moveTo(sx, cy + half);
      ctx.lineTo(w, cy + half + Math.tan(spread) * (w - sx));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText('every point of the opening is a new source of spherical waves', 24, 28);
      ctx.fillText(narrow > 0.5
        ? 'a narrow opening: few sources, and the wave spreads widely'
        : 'a wide opening: many sources, and their envelope is a straight beam',
        24, h - 22);
    };
  });

  /* --------------------------------------------- a slit comparable with λ --- */

  A.scene('narrow-slit', function (root) {
    var W = 1000, H = 380;
    var svg = S.root(W, H,
      'A slit comparable with the wavelength spreads the beam through an angle theta, and ' +
      'the intensity on the screen falls to zero at a definite first minimum.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var sx = 250, sy = 190, half = 16, screenX = 690;

    svg.appendChild(S.rect(sx - 7, 30, 14, sy - half - 30, 's-fill-i'));
    svg.appendChild(S.rect(sx - 7, sy + half, 14, H - 70 - (sy + half) + 40, 's-fill-i'));
    svg.appendChild(S.text(sx - 20, 22, 'slit width a ∼ λ', 's-lbl-b', 'end'));

    var gIn = S.g({});
    svg.appendChild(gIn);
    for (var i = 0; i < 5; i++) {
      gIn.appendChild(S.line(60 + i * 26, sy - 46, 60 + i * 26, sy + 46, 's-wave'));
    }
    gIn.appendChild(S.text(60, sy - 58, 'λ', 's-lbl-w', 'start'));

    var gSpread = S.g({});
    svg.appendChild(gSpread);
    var theta = 0.42;
    var fan = S.el('polygon', {
      points: [sx, sy - half, screenX, sy - Math.tan(theta) * (screenX - sx),
               screenX, sy + Math.tan(theta) * (screenX - sx), sx, sy + half].join(' '),
      fill: 'var(--wave)', 'fill-opacity': '0.08', stroke: 'none'
    });
    gSpread.appendChild(fan);
    gSpread.appendChild(S.line(sx, sy, screenX, sy, 's-axis s-dash'));
    var edge = S.line(sx, sy, screenX, sy - Math.tan(theta) * (screenX - sx), 's-wave');
    gSpread.appendChild(edge);
    var arc = S.el('path', {
      d: 'M' + (sx + 90) + ' ' + sy + 'A90 90 0 0 0 ' +
         (sx + 90 * Math.cos(theta)) + ' ' + (sy - 90 * Math.sin(theta)),
      class: 's-ghost'
    });
    arc.setAttribute('stroke', 'var(--quantum)');
    gSpread.appendChild(arc);
    gSpread.appendChild(S.text(sx + 104, sy - 22, 'θ', 's-lbl-q', 'start'));

    /* The intensity profile on the screen, from sinc squared. */
    var gProf = S.g({});
    svg.appendChild(gProf);
    gProf.appendChild(S.line(screenX, 40, screenX, H - 40, 's-axis'));
    var prof = S.path('', 's-wave');
    gProf.appendChild(prof);
    var span = H / 2 - 46;
    var pts = S.sample(200, -1, 1, function (u) {
      var st = u * 1.35;
      var I = M.singleSlit(st, 1.0);
      return [screenX + I * 96, sy + u * span];
    });
    S.setD(prof, S.polyD(pts));
    var minMark = S.circle(screenX, sy - span / 1.35, 4, 's-fill-f');
    gProf.appendChild(minMark);
    gProf.appendChild(S.text(screenX + 104, sy - span / 1.35 + 4, 'first minimum: sin θ = λ/a', 's-lbl-f', 'start'));
    gProf.appendChild(S.text(screenX + 104, sy + 4, 'I = c ε₀ ⟨E²⟩', 's-lbl-w', 'start'));

    var limit = S.text(60, H - 22,
      'and θ → 0 as λ/a → 0: make the slit wide and the diffraction goes away', 's-lbl', 'start');
    svg.appendChild(limit);

    return function (p) {
      S.op(gIn, M.beat(p, 0.03, 0.22));
      S.op(gSpread, M.beat(p, 0.2, 0.44));
      S.op(gProf, M.beat(p, 0.42, 0.66));
      S.draw(prof, M.easeOut(M.beat(p, 0.44, 0.74)));
      S.op(limit, M.beat(p, 0.74, 0.92));
    };
  });

  /* ------------------------------- the pairing argument for the first minimum --- */

  A.scene('pairing', function (root) {
    var W = 940, H = 620;
    var svg = S.root(W, H,
      'Rays leaving the top of the slit and the middle of the slit differ in path by half ' +
      'the slit width times sine theta. When that difference is half a wavelength the two ' +
      'cancel, and so does every other such pair.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var sx = 220, cy = 300, half = 150;
    var theta = 0.40;

    svg.appendChild(S.rect(sx - 8, 40, 16, cy - half - 40, 's-fill-i'));
    svg.appendChild(S.rect(sx - 8, cy + half, 16, H - 150 - (cy + half) + 110, 's-fill-i'));
    svg.appendChild(S.line(sx, cy - half, sx, cy + half, 's-ghost'));
    var aBrace = S.path(S.braceD(sx - 46, sx - 46, cy, 0), 's-ghost');
    svg.appendChild(S.line(sx - 34, cy - half, sx - 34, cy + half, 's-axis'));
    svg.appendChild(S.line(sx - 40, cy - half, sx - 28, cy - half, 's-axis'));
    svg.appendChild(S.line(sx - 40, cy + half, sx - 28, cy + half, 's-axis'));
    svg.appendChild(S.text(sx - 46, cy + 4, 'a', 's-lbl-b', 'end'));
    svg.appendChild(S.line(sx - 40, cy, sx - 28, cy, 's-axis'));
    svg.appendChild(S.text(sx - 46, cy - half / 2 + 4, 'a/2', 's-lbl-q', 'end'));

    /* Pair 1: the top of the slit and the middle. */
    var L = 560;
    var dirx = Math.cos(theta), diry = -Math.sin(theta);
    var gPair = S.g({});
    svg.appendChild(gPair);
    var pairs = [];
    for (var i = 0; i < 6; i++) {
      var frac = i / 5;
      var yTop = cy - half + frac * half;         /* upper half of the slit */
      var yMid = yTop + half;                     /* its partner, a/2 lower */
      var rT = S.line(sx, yTop, sx + dirx * L, yTop + diry * L, 's-wave');
      var rM = S.line(sx, yMid, sx + dirx * L, yMid + diry * L, 's-quantum');
      rT.setAttribute('stroke-opacity', '0.85');
      rM.setAttribute('stroke-opacity', '0.85');
      gPair.appendChild(rT); gPair.appendChild(rM);
      pairs.push({ t: rT, m: rM, yTop: yTop, yMid: yMid });
    }

    /* The wavefront perpendicular to the rays, from which the path difference reads off. */
    var gGeom = S.g({});
    svg.appendChild(gGeom);
    var fx = sx + dirx * 210, fy = cy - half + diry * 210;
    var front = S.line(fx - diry * 110, fy - dirx * 110, fx + diry * 110, fy + dirx * 110, 's-axis s-dash');
    gGeom.appendChild(front);
    gGeom.appendChild(S.text(fx + diry * 110 + 12, fy + dirx * 110 + 16, 'a common wavefront', 's-lbl', 'start'));

    var extra = S.line(sx, cy, sx + dirx * (half * Math.sin(theta)), cy + diry * (half * Math.sin(theta)), 's-fail');
    extra.setAttribute('stroke-width', '4');
    gGeom.appendChild(extra);
    var extraLbl = S.text(sx + 26, cy + 34, 'extra path  =  (a/2) sin θ', 's-lbl-f', 'start');
    gGeom.appendChild(extraLbl);

    var arc = S.el('path', {
      d: 'M' + (sx + 110) + ' ' + cy + 'A110 110 0 0 0 ' +
         (sx + 110 * Math.cos(theta)) + ' ' + (cy - 110 * Math.sin(theta)),
      class: 's-ghost'
    });
    gGeom.appendChild(arc);
    gGeom.appendChild(S.text(sx + 126, cy - 26, 'θ', 's-lbl-b', 'start'));

    var chain = [
      'pair every ray in the top half with the ray a/2 below it',
      'each pair differs in path by (a/2) sin θ',
      'set that equal to λ/2 and every pair cancels',
      '(a/2) sin θ = λ/2      ⟹      a sin θ = λ      ⟹      sin θ = λ/a'
    ].map(function (s, i) {
      var t = S.text(W / 2, 500 + i * 30, s, i === 3 ? 's-lbl-b' : 's-lbl', 'middle');
      t.setAttribute('font-size', i === 3 ? '14' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      pairs.forEach(function (pr, i) {
        var f = M.beat(p, 0.06 + i * 0.05, 0.24 + i * 0.05);
        S.op(pr.t, f * 0.85); S.op(pr.m, f * 0.85);
      });
      S.op(gGeom, M.beat(p, 0.32, 0.5));
      chain.forEach(function (c, i) { S.op(c, M.beat(p, 0.46 + i * 0.11, 0.62 + i * 0.11)); });
    };
  });

  /* ---------------------------------- the phasor chain and the sinc pattern --- */

  A.scene('phasor-chain', function (root) {
    var W = 960, H = 560;
    var svg = S.root(W, H,
      'Contributions from across the slit added as phasors. On axis they line up and the sum ' +
      'is largest; off axis the chain curls, and where it closes into a full circle the sum ' +
      'is exactly zero.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var cx = 250, cy = 250, N = 40, segLen = 4.6;

    var chain = S.path('', 's-wave');
    svg.appendChild(chain);
    var resultant = S.arrow(svg, cx, cy, cx, cy, 'i');
    resultant.setAttribute('stroke-width', '2.5');
    svg.appendChild(resultant);
    var resLbl = S.text(0, 0, '', 's-lbl-b', 'start');
    svg.appendChild(resLbl);
    svg.appendChild(S.text(60, 60, 'the phasor chain', 's-lbl', 'start'));
    svg.appendChild(S.text(60, 82, 'one arrow per strip of the slit', 's-lbl', 'start'));

    /* The intensity pattern, with a marker at the current angle. */
    var px0 = 560, px1 = 920, pyB = 460, pyT = 90;
    svg.appendChild(S.axes(px0, pyT, px1, pyB, 'sin θ  (units of λ/a)', null));
    svg.appendChild(S.text(px0 - 8, pyT - 6, 'I / I₀', 's-lbl', 'end'));
    var curve = S.path('', 's-wave');
    svg.appendChild(curve);
    S.setD(curve, S.polyD(S.sample(300, -3.1, 3.1, function (u) {
      return [M.map(u, -3.1, 3.1, px0, px1), M.map(M.singleSlit(u, 1), 0, 1.05, pyB, pyT)];
    })));
    for (var m = 1; m <= 3; m++) {
      [-1, 1].forEach(function (sgn) {
        var xx = M.map(sgn * m, -3.1, 3.1, px0, px1);
        svg.appendChild(S.line(xx, pyB, xx, pyB + 6, 's-axis'));
        svg.appendChild(S.text(xx, pyB + 20, (sgn < 0 ? '−' : '') + m, 's-tick', 'middle'));
      });
    }
    var marker = S.circle(0, 0, 5, 's-fill-q');
    svg.appendChild(marker);
    var mLine = S.line(0, 0, 0, 0, 's-axis s-dash');
    svg.appendChild(mLine);

    var readout = S.text(60, H - 40, '', 's-lbl-q', 'start');
    svg.appendChild(readout);
    var note = S.text(60, H - 18,
      'the chain closes exactly when the phase across the slit spans 2π', 's-lbl', 'start');
    svg.appendChild(note);

    return function (p) {
      /* Total phase across the slit, in units of 2 pi = one full curl. */
      var u = M.lerp(0, 2.2, M.easeInOut(M.beat(p, 0.08, 0.95)));
      var total = M.TAU * u;
      var dphi = total / N;

      var pts = [[cx, cy]], ang = -total / 2, x = cx, y = cy;
      for (var i = 0; i < N; i++) {
        x += Math.cos(ang) * segLen * 6;
        y -= Math.sin(ang) * segLen * 6;
        pts.push([x, y]);
        ang += dphi;
      }
      /* Re-centre so the chain does not wander off the frame as it curls. */
      var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
      pts.forEach(function (q) {
        if (q[0] < minx) minx = q[0]; if (q[0] > maxx) maxx = q[0];
        if (q[1] < miny) miny = q[1]; if (q[1] > maxy) maxy = q[1];
      });
      var ox = cx - (minx + maxx) / 2, oy = cy - (miny + maxy) / 2;
      var moved = pts.map(function (q) { return [q[0] + ox, q[1] + oy]; });
      S.setD(chain, S.polyD(moved));

      var a = moved[0], b = moved[moved.length - 1];
      resultant.setAttribute('x1', a[0]); resultant.setAttribute('y1', a[1]);
      resultant.setAttribute('x2', b[0]); resultant.setAttribute('y2', b[1]);
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      resLbl.setAttribute('x', (a[0] + b[0]) / 2 + 10);
      resLbl.setAttribute('y', (a[1] + b[1]) / 2 - 8);
      resLbl.textContent = len < 6 ? 'resultant = 0' : 'resultant';

      var mx = M.map(u, -3.1, 3.1, px0, px1);
      var I = M.singleSlit(u, 1);
      var my = M.map(I, 0, 1.05, pyB, pyT);
      marker.setAttribute('cx', mx); marker.setAttribute('cy', my);
      mLine.setAttribute('x1', mx); mLine.setAttribute('y1', my);
      mLine.setAttribute('x2', mx); mLine.setAttribute('y2', pyB);

      readout.textContent = 'a sin θ / λ = ' + u.toFixed(2) +
        '     I / I₀ = ' + I.toFixed(3);
      S.op(note, M.beat(p, 0.5, 0.7));
    };
  });

  /* ---------------------------------- intensity is a time-averaged square --- */

  A.scene('intensity-def', function (root) {
    var W = 880, H = 380;
    var svg = S.root(W, H,
      'The field oscillates far faster than any detector responds, so what is measured is ' +
      'the time average of its square, and the average of cosine squared is one half.');
    root.appendChild(svg);

    var x0 = 80, x1 = 800, cy = 140, amp = 62;
    svg.appendChild(S.line(x0, cy, x1, cy, 's-axis'));
    var E = S.path('', 's-wave');
    svg.appendChild(E);
    S.setD(E, S.polyD(S.sample(400, 0, 1, function (u) {
      return [M.lerp(x0, x1, u), cy - Math.cos(u * 8 * Math.PI) * amp];
    })));
    svg.appendChild(S.text(x0, cy - amp - 16, 'E(t) = E₀ cos(kx − ωt)', 's-lbl-w', 'start'));

    var cy2 = 290, amp2 = 62;
    svg.appendChild(S.line(x0, cy2, x1, cy2, 's-axis'));
    var E2 = S.path('', 's-quantum');
    svg.appendChild(E2);
    S.setD(E2, S.polyD(S.sample(400, 0, 1, function (u) {
      var c = Math.cos(u * 8 * Math.PI);
      return [M.lerp(x0, x1, u), cy2 - c * c * amp2];
    })));
    var avg = S.line(x0, cy2 - amp2 / 2, x1, cy2 - amp2 / 2, 's-axis s-dash');
    avg.setAttribute('stroke', 'var(--ink-bright)');
    svg.appendChild(avg);
    svg.appendChild(S.text(x0, cy2 - amp2 - 16, 'E²(t) = E₀² cos²(kx − ωt)', 's-lbl-q', 'start'));
    var avgLbl = S.text(x1 + 4, cy2 - amp2 / 2 + 4, '', 's-lbl-b', 'end');
    avgLbl.textContent = 'average = E₀²/2';
    svg.appendChild(avgLbl);

    var res = S.text(W / 2, H - 20, 'I = c ε₀ ⟨E²⟩ = ½ c ε₀ E₀²', 's-lbl-b', 'middle');
    res.setAttribute('font-size', '14');
    svg.appendChild(res);

    return function (p) {
      S.draw(E, M.easeOut(M.beat(p, 0.03, 0.32)));
      S.draw(E2, M.easeOut(M.beat(p, 0.28, 0.6)));
      S.op(avg, M.beat(p, 0.58, 0.74));
      S.op(avgLbl, M.beat(p, 0.58, 0.74));
      S.op(res, M.beat(p, 0.76, 0.94));
    };
  });
})(window.A = window.A || {});
