/* Section 1.3 second half and section 1.4: two slits, the cross term that makes
   interference, the envelope-times-fringes decomposition, and the electron
   pattern that builds itself out of single hits. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------ the ripple tank, Figure 1.3.3 --- */

  A.scene('double-slit', function (root, api) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    /* A coarse field buffer scaled up: full-resolution per-pixel maths every
       frame is not worth the battery. */
    var GW = 260, GH = 170;
    var off = document.createElement('canvas');
    off.width = GW; off.height = GH;
    var octx = off.getContext('2d');
    var img = octx.createImageData(GW, GH);

    return function (p, t) {
      var f = S.fitCanvas(cv, 1.25);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var time = api.reduced ? 2.0 : t * 2.4;

      /* Which slits are open is driven by the scroll: 1 only, 2 only, then both. */
      var stage = M.beat(p, 0.05, 0.95) * 3;
      var open1 = stage < 1 ? 1 : (stage < 2 ? 0 : 1);
      var open2 = stage < 1 ? 0 : 1;
      var label = stage < 1 ? '1 open, 2 closed'
                : (stage < 2 ? '1 closed, 2 open' : 'both 1 and 2 open');

      var sxG = GW * 0.26;
      var y1 = GH * 0.38, y2 = GH * 0.62;
      var kk = 0.62;

      var d = img.data;
      for (var gy = 0; gy < GH; gy++) {
        for (var gx = 0; gx < GW; gx++) {
          var idx = (gy * GW + gx) * 4;
          var amp = 0;
          if (gx < sxG) {
            amp = Math.cos(kk * (sxG - gx) + time) * 0.7;
          } else {
            var r1 = Math.hypot(gx - sxG, gy - y1);
            var r2 = Math.hypot(gx - sxG, gy - y2);
            if (open1) amp += Math.cos(kk * r1 - time) / Math.sqrt(1 + r1 * 0.16);
            if (open2) amp += Math.cos(kk * r2 - time) / Math.sqrt(1 + r2 * 0.16);
          }
          var v = M.clamp(amp * 0.9, -1, 1);
          /* Positive crests cyan, troughs a deep blue: the sign is visible. */
          d[idx] = v > 0 ? 79 * v : 12;
          d[idx + 1] = v > 0 ? 214 * v : 40 * -v;
          d[idx + 2] = v > 0 ? 227 * v : 90 * -v;
          d[idx + 3] = 235;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(off, 0, 0, w, h * 0.78);
      ctx.globalAlpha = 1;

      var sx = w * 0.26;
      var Y1 = (y1 / GH) * h * 0.78, Y2 = (y2 / GH) * h * 0.78;
      var slitHalf = h * 0.016;

      /* The barrier, with the closed slit filled in. */
      ctx.fillStyle = S.cssVar('--ink-bright') || '#EAF1F6';
      ctx.fillRect(sx - 3, 0, 6, Y1 - slitHalf);
      ctx.fillRect(sx - 3, Y1 + slitHalf, 6, (Y2 - slitHalf) - (Y1 + slitHalf));
      ctx.fillRect(sx - 3, Y2 + slitHalf, 6, h * 0.78 - (Y2 + slitHalf));
      if (!open1) ctx.fillRect(sx - 3, Y1 - slitHalf, 6, slitHalf * 2);
      if (!open2) ctx.fillRect(sx - 3, Y2 - slitHalf, 6, slitHalf * 2);

      ctx.font = '12px ui-monospace, monospace';
      ctx.fillStyle = S.cssVar('--muted') || '#78868F';
      ctx.fillText('1', sx - 20, Y1 + 4);
      ctx.fillText('2', sx - 20, Y2 + 4);
      ctx.fillStyle = S.cssVar('--ink-bright') || '#EAF1F6';
      ctx.fillText(label, 24, 24);

      /* Intensity on the screen at the right, computed from the same field. */
      var screenX = w * 0.955;
      ctx.strokeStyle = S.cssVar('--quantum') || '#F2A65A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      var maxI = 0, vals = [];
      for (var yy = 0; yy < h * 0.78; yy += 2) {
        var gyy = yy / (h * 0.78) * GH;
        var R1 = Math.hypot(GW - sxG, gyy - y1), R2 = Math.hypot(GW - sxG, gyy - y2);
        var a1 = open1 / Math.sqrt(1 + R1 * 0.16), a2 = open2 / Math.sqrt(1 + R2 * 0.16);
        /* Time-averaged intensity of the superposition, including the cross term. */
        var I = 0.5 * (a1 * a1 + a2 * a2) + a1 * a2 * Math.cos(kk * (R1 - R2));
        vals.push([yy, I]);
        if (I > maxI) maxI = I;
      }
      vals.forEach(function (v, i) {
        var xx = screenX - (v[1] / (maxI || 1)) * w * 0.14;
        if (i === 0) ctx.moveTo(xx, v[0]); else ctx.lineTo(xx, v[0]);
      });
      ctx.stroke();
      ctx.fillStyle = S.cssVar('--quantum') || '#F2A65A';
      ctx.fillText(stage < 2 ? 'I on the screen' : 'I = c ε₀ ⟨|E₁ + E₂|²⟩', w * 0.60, h * 0.86);

      ctx.fillStyle = S.cssVar('--muted') || '#78868F';
      ctx.fillText(stage < 2
        ? 'one slit gives one broad diffraction blob'
        : 'two slits give fringes — and the fringes have dark bands where one slit alone gave light',
        24, h - 18);
    };
  });

  /* ------------------------------------------------------- the cross term --- */

  A.scene('cross-term', function (root) {
    var W = 880, H = 428;
    var svg = S.root(W, H,
      'Adding the two single-slit intensities gives a smooth hump. Adding the two fields ' +
      'first and squaring afterwards gives fringes. The difference between them is the ' +
      'cross term.');
    root.appendChild(svg);

    var x0 = 70, x1 = 810, yB = 300, yT = 70;
    svg.appendChild(S.axes(x0, yT, x1, yB, 'position on the screen', null));

    var a = 0.9, dOverL = 3.0;
    function I1(u) { return M.singleSlit(u, a); }
    function I2(u) { return M.singleSlit(u, a); }
    function Iboth(u) { return 4 * M.singleSlit(u, a) * Math.pow(Math.cos(Math.PI * dOverL * u / 2), 2) / 4 * 4; }

    var sum = S.path('', 's-fail');
    sum.setAttribute('stroke-dasharray', '6 4');
    var real = S.path('', 's-wave');
    svg.appendChild(sum); svg.appendChild(real);

    var maxB = 4;
    S.setD(sum, S.polyD(S.sample(300, -2.4, 2.4, function (u) {
      return [M.map(u, -2.4, 2.4, x0, x1), M.map(I1(u) + I2(u), 0, maxB, yB, yT)];
    })));
    S.setD(real, S.polyD(S.sample(400, -2.4, 2.4, function (u) {
      return [M.map(u, -2.4, 2.4, x0, x1), M.map(Iboth(u), 0, maxB, yB, yT)];
    })));

    svg.appendChild(S.text(x0 + 10, yT + 14, 'I₁ + I₂   what particles would do', 's-lbl-f', 'start'));
    svg.appendChild(S.text(x0 + 10, yT + 36, 'c ε₀ ⟨|E₁ + E₂|²⟩   what light does', 's-lbl-w', 'start'));

    var algebra = [
      '⟨|E₁ + E₂|²⟩  =  ⟨E₁²⟩ + ⟨E₂²⟩ + 2⟨E₁ · E₂⟩',
      'the first two terms are I₁ and I₂ over c ε₀',
      'the third is the cross term, and it can be negative',
      'where it is negative, two beams of light add up to darkness'
    ].map(function (s, i) {
      var t = S.text(W / 2, 340 + i * 22, s, i === 3 ? 's-lbl-w' : 's-lbl', 'middle');
      t.setAttribute('font-size', i === 0 ? '13' : '12');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      S.draw(sum, M.easeOut(M.beat(p, 0.03, 0.3)));
      S.draw(real, M.easeOut(M.beat(p, 0.22, 0.55)));
      algebra.forEach(function (l, i) { S.op(l, M.beat(p, 0.4 + i * 0.12, 0.56 + i * 0.12)); });
    };
  });

  /* --------------------------------- fringes under a single-slit envelope --- */

  A.scene('envelope-fringes', function (root) {
    var W = 880, H = 440;
    var svg = S.root(W, H,
      'The two-slit pattern is the product of two factors: the single-slit envelope from the ' +
      'width of each slit, and the fringe factor from the separation between them.');
    root.appendChild(svg);

    var x0 = 80, x1 = 800;
    var rows = [
      { y: 110, label: 'envelope, from the slit width a', fn: function (u) { return M.singleSlit(u, 1.0); }, cls: 's-quantum' },
      { y: 250, label: 'fringes, from the slit separation d', fn: function (u) { return Math.pow(Math.cos(Math.PI * 4 * u), 2); }, cls: 's-prob' },
      { y: 390, label: 'their product: what you actually see', fn: function (u) { return M.singleSlit(u, 1.0) * Math.pow(Math.cos(Math.PI * 4 * u), 2); }, cls: 's-wave' }
    ];
    var built = rows.map(function (r) {
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.line(x0, r.y, x1, r.y, 's-axis'));
      g.appendChild(S.text(x0, r.y - 84, r.label, 's-lbl', 'start'));
      var pth = S.path('', r.cls);
      g.appendChild(pth);
      S.setD(pth, S.polyD(S.sample(500, -2.6, 2.6, function (u) {
        return [M.map(u, -2.6, 2.6, x0, x1), r.y - r.fn(u) * 76];
      })));
      return { g: g, path: pth };
    });

    var times = S.text(W / 2, 180, '×', 's-lbl-b', 'middle');
    times.setAttribute('font-size', '20');
    var eq = S.text(W / 2, 320, '=', 's-lbl-b', 'middle');
    eq.setAttribute('font-size', '20');
    svg.appendChild(times); svg.appendChild(eq);

    return function (p) {
      built.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.04 + i * 0.16, 0.24 + i * 0.16));
        S.draw(b.path, M.easeOut(M.beat(p, 0.06 + i * 0.16, 0.42 + i * 0.16)));
      });
      S.op(times, M.beat(p, 0.3, 0.44));
      S.op(eq, M.beat(p, 0.48, 0.62));
    };
  });

  /* ------------------------------- electrons arriving one at a time (1.4) --- */

  A.scene('electron-buildup', function (root) {
    var cv = document.createElement('canvas');
    root.appendChild(cv);

    /* Sample landing points from the two-slit distribution by rejection, once,
       with a fixed seed, so the pattern is the same every time you scroll back. */
    var N = 40000;
    var hits = new Float32Array(N * 2);
    var rnd = M.rng(19270611);
    var aOverL = 0.85, dOverL = 4.0;
    var pdfMax = 1.0;
    for (var i = 0, got = 0; got < N && i < N * 40; i++) {
      var u = (rnd() * 2 - 1) * 2.6;
      var v = rnd() * pdfMax;
      var f = M.singleSlit(u, aOverL) * Math.pow(Math.cos(Math.PI * dOverL * u / 2), 2);
      if (v < f) {
        hits[got * 2] = u;
        hits[got * 2 + 1] = rnd();
        got++;
      }
    }

    return function (p) {
      var f = S.fitCanvas(cv, 1.25);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var top = 56, bot = h - 96;
      var ink = S.cssVar('--ink-bright') || '#EAF1F6';
      var wave = S.cssVar('--wave') || '#4FD6E3';
      var muted = S.cssVar('--muted') || '#78868F';

      /* How many electrons have landed, on a log-ish ramp so the early counts
         are readable and the late ones still get somewhere. */
      var prog = M.beat(p, 0.04, 0.96);
      var count = Math.round(Math.pow(10, M.lerp(0.7, Math.log10(N), M.easeInOut(prog))));

      ctx.fillStyle = wave;
      for (var i = 0; i < count; i++) {
        var x = w * 0.5 + hits[i * 2] * w * 0.17;
        var y = top + hits[i * 2 + 1] * (bot - top);
        ctx.globalAlpha = count > 4000 ? 0.30 : 0.85;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, top - 12); ctx.lineTo(w * 0.94, top - 12);
      ctx.moveTo(w * 0.06, bot + 12); ctx.lineTo(w * 0.94, bot + 12);
      ctx.stroke();

      ctx.font = '13px ui-monospace, monospace';
      ctx.fillStyle = ink;
      ctx.fillText(count.toLocaleString() + (count === 1 ? ' electron' : ' electrons'), w * 0.06, 30);
      ctx.fillStyle = muted;
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(
        count < 40 ? 'each one lands at a single point, apparently at random'
        : count < 800 ? 'still no pattern you would bet money on'
        : count < 8000 ? 'bands are starting to show'
        : 'the interference pattern was there all along, one electron at a time',
        w * 0.06, h - 54);
      ctx.fillText('fired one per second, never two at once', w * 0.06, h - 32);
    };
  });
})(window.A = window.A || {});
