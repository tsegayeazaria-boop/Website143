/* Section 1.2, first half: what a black body actually is, why a small hole in a
   cavity is the blackest thing you own, and the mode count that classical
   physics multiplies by the equipartition energy. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* -------------------------------------------- the cavity, Figure 1.2.1 --- */

  A.scene('cavity', function (root, api) {
    var W = 900, H = 600;
    var svg = S.root(W, H,
      'A conducting body with a hollowed cavity, insulated on the outside, with a small ' +
      'aperture. A beam entering the aperture bounces off the interior wall many times, ' +
      'losing intensity at each bounce, and is absorbed. The body re-emits at the same rate.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var bx = 210, by = 110, bw = 480, bh = 380;

    /* Insulation: a hatched border outside the conductor. */
    var gBody = S.g({});
    svg.appendChild(gBody);
    var insul = S.rect(bx - 26, by - 26, bw + 52, bh + 52, 's-ghost');
    insul.setAttribute('fill', 'var(--surface-2)');
    insul.setAttribute('rx', '4');
    gBody.appendChild(insul);
    for (var i = 0; i < 46; i++) {
      var t = i / 45;
      var hx = bx - 26 + t * (bw + 52);
      var hl = S.line(hx, by - 26, hx - 14, by - 12, 's-grid');
      gBody.appendChild(hl);
      var hl2 = S.line(hx, by + bh + 12, hx - 14, by + bh + 26, 's-grid');
      gBody.appendChild(hl2);
    }
    var body = S.rect(bx, by, bw, bh, 's-ghost');
    body.setAttribute('fill', 'var(--ground-deep)');
    body.setAttribute('stroke', 'var(--hairline-2)');
    body.setAttribute('stroke-width', '3');
    body.setAttribute('rx', '3');
    gBody.appendChild(body);
    gBody.appendChild(S.text(bx + bw / 2, by - 44, 'insulating jacket', 's-lbl', 'middle'));
    gBody.appendChild(S.text(bx + 16, by + 24, 'conducting wall, temperature T', 's-lbl', 'start'));

    /* The aperture. */
    var apY = by + bh * 0.42;
    var aperture = S.rect(bx - 4, apY - 9, 8, 18, 's-ghost');
    aperture.setAttribute('fill', 'var(--ground)');
    aperture.setAttribute('stroke', 'var(--wave)');
    gBody.appendChild(aperture);
    gBody.appendChild(S.text(bx - 16, apY - 20, 'small aperture', 's-lbl-w', 'end'));

    /* The bouncing beam, precomputed so the path is identical every frame. */
    var pts = [[bx - 170, apY - 40], [bx, apY]];
    var rnd = M.rng(4711);
    var px = bx + 20, py = apY, dx = 1, dy = 0.42;
    for (i = 0; i < 11; i++) {
      var steps = 0;
      while (steps < 4000) {
        px += dx * 3; py += dy * 3; steps++;
        if (px > bx + bw - 8) { px = bx + bw - 8; dx = -Math.abs(dx) * (0.9 + rnd() * 0.2); break; }
        if (px < bx + 8) { px = bx + 8; dx = Math.abs(dx) * (0.9 + rnd() * 0.2); break; }
        if (py > by + bh - 8) { py = by + bh - 8; dy = -Math.abs(dy) * (0.9 + rnd() * 0.2); break; }
        if (py < by + 8) { py = by + 8; dy = Math.abs(dy) * (0.9 + rnd() * 0.2); break; }
      }
      dy += (rnd() - 0.5) * 0.5;
      pts.push([px, py]);
    }

    var gBeam = S.g({});
    svg.appendChild(gBeam);
    var legs = [];
    for (i = 1; i < pts.length; i++) {
      var seg = S.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 's-wave');
      seg.setAttribute('stroke-width', '2');
      gBeam.appendChild(seg);
      legs.push(seg);
    }
    var head = S.circle(pts[0][0], pts[0][1], 4.5, 's-fill-w');
    gBeam.appendChild(head);
    var srcLbl = S.text(bx - 176, apY - 52, 'incident beam, tungsten lamp', 's-lbl-w', 'start');
    gBeam.appendChild(srcLbl);

    var absorbed = S.text(bx + bw / 2, by + bh - 22, '', 's-lbl-f', 'middle');
    svg.appendChild(absorbed);

    /* Thermal emission back out through the same hole. */
    var gEmit = S.g({});
    svg.appendChild(gEmit);
    var rays = [];
    for (i = 0; i < 7; i++) {
      var ang = (-0.62 + i * 0.207);
      var r = S.arrow(svg, bx - 6, apY,
        bx - 6 - Math.cos(ang) * 128, apY + Math.sin(ang) * 128, 'q');
      r.setAttribute('stroke-width', '1.6');
      gEmit.appendChild(r);
      rays.push(r);
    }
    gEmit.appendChild(S.text(bx - 130, apY + 112, 'emitted radiation', 's-lbl-q', 'middle'));
    gEmit.appendChild(S.text(bx - 130, apY + 132, 'at temperature T', 's-lbl', 'middle'));

    var balance = S.text(W / 2, H - 26,
      'in equilibrium the body emits energy at exactly the rate it absorbs it', 's-lbl-b', 'middle');
    svg.appendChild(balance);

    return function (p, t) {
      S.op(gBody, M.beat(p, 0.02, 0.18));

      var travel = M.easeInOut(M.beat(p, 0.16, 0.66));
      var reach = travel * legs.length;
      for (var j = 0; j < legs.length; j++) {
        var f = M.clamp(reach - j, 0, 1);
        S.draw(legs[j], f);
        /* Each bounce leaves some energy behind: the wall is not a perfect mirror. */
        legs[j].setAttribute('stroke-opacity', (Math.pow(0.72, j) * 0.95 + 0.05).toFixed(3));
      }
      var seg2 = Math.min(legs.length - 1, Math.floor(reach));
      var loc = M.clamp(reach - seg2, 0, 1);
      var a2 = pts[seg2], b2 = pts[seg2 + 1] || pts[seg2];
      head.setAttribute('cx', M.lerp(a2[0], b2[0], loc).toFixed(1));
      head.setAttribute('cy', M.lerp(a2[1], b2[1], loc).toFixed(1));
      S.op(head, M.beat(p, 0.16, 0.22) * (1 - M.beat(p, 0.6, 0.7)));
      S.op(gBeam, M.beat(p, 0.12, 0.22));

      absorbed.textContent = travel > 0.85
        ? 'after 11 bounces, ' + (Math.pow(0.72, 11) * 100).toFixed(2) + ' % of the beam is left'
        : '';
      S.op(absorbed, M.beat(p, 0.6, 0.72));

      var emit = M.beat(p, 0.7, 0.9);
      rays.forEach(function (r, k) {
        var wob = api.reduced ? 1 : 0.55 + 0.45 * Math.sin(t * 2 + k * 0.9);
        S.op(r, emit * wob);
      });
      S.op(gEmit, emit);
      S.op(balance, M.beat(p, 0.85, 0.98));
    };
  });

  /* --------------------------------------------- why the hole looks black --- */

  A.scene('hole-black', function (root) {
    var W = 880, H = 300;
    var svg = S.root(W, H,
      'The fraction of an entering beam that survives each bounce off a wall that reflects ' +
      'thirty per cent. After eight bounces almost nothing is left to come back out.');
    root.appendChild(svg);

    var x0 = 80, y0 = 60, yB = 210, bw = 74, refl = 0.30;
    svg.appendChild(S.line(x0 - 12, yB, W - 40, yB, 's-axis'));
    svg.appendChild(S.text(x0 - 18, y0 + 4, '100%', 's-tick', 'end'));
    svg.appendChild(S.text(W - 40, yB + 34, 'number of bounces off the interior wall', 's-lbl', 'end'));

    var bars = [], labels = [];
    for (var i = 0; i < 9; i++) {
      var frac = Math.pow(refl, i);
      var x = x0 + i * (bw + 12);
      var r = S.rect(x, y0, bw - 14, (yB - y0) * frac, i === 0 ? 's-fill-w' : 's-fill-w');
      r.setAttribute('y', yB - (yB - y0) * frac);
      r.setAttribute('height', (yB - y0) * frac);
      r.setAttribute('opacity', '0.85');
      svg.appendChild(r);
      bars.push(r);
      var l = S.text(x + (bw - 14) / 2, yB + 18, String(i), 's-tick', 'middle');
      svg.appendChild(l);
      var v = S.text(x + (bw - 14) / 2, yB - (yB - y0) * frac - 8,
        (frac * 100 >= 0.01 ? (frac * 100).toPrecision(2) + '%' : '~0'), 's-lbl-w', 'middle');
      svg.appendChild(v);
      labels.push(v);
    }
    var concl = S.text(W / 2, H - 22,
      'light that goes in does not come back out: the hole is a near-perfect absorber',
      's-lbl-b', 'middle');
    svg.appendChild(concl);

    return function (p) {
      bars.forEach(function (b, i) {
        var f = M.beat(p, 0.05 + i * 0.055, 0.2 + i * 0.055);
        S.op(b, f * 0.85);
        S.op(labels[i], f);
      });
      S.op(concl, M.beat(p, 0.7, 0.9));
    };
  });

  /* ---------------------------------------------- why a shirt looks green --- */

  A.scene('color-selective', function (root) {
    var W = 880, H = 340;
    var svg = S.root(W, H,
      'The same white spectrum falling on two surfaces. One reflects only the middle of the ' +
      'visible band and looks green; the other reflects a little of everything and looks grey.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var bx = 70, bw = 300, bh = 34;

    function spectrum(x, y, w, h, weight) {
      var g = S.g({});
      for (var i = 0; i < 90; i++) {
        var nm = 390 + (i / 89) * 360;
        var seg = S.rect(x + (i / 90) * w, y, w / 90 + 1, h, null);
        seg.setAttribute('fill', M.wavelengthRGB(nm));
        seg.setAttribute('opacity', weight ? weight(nm).toFixed(3) : '1');
        g.appendChild(seg);
      }
      svg.appendChild(g);
      return g;
    }

    var rows = [
      { y: 90, label: 'a green shirt', out: function (nm) { return Math.exp(-Math.pow((nm - 535) / 42, 2)); },
        verdict: 'reflects only near 535 nm' },
      { y: 200, label: 'a grey wall', out: function () { return 0.34; },
        verdict: 'reflects about a third of everything' }
    ];

    var incoming = [], outgoing = [], arrows = [], texts = [];
    rows.forEach(function (r) {
      incoming.push(spectrum(bx, r.y, bw, bh, null));
      var a = S.arrow(svg, bx + bw + 14, r.y + bh / 2, bx + bw + 74, r.y + bh / 2, 'm');
      svg.appendChild(a); arrows.push(a);
      var t = S.text(bx + bw + 44, r.y - 8, r.label, 's-lbl-b', 'middle');
      svg.appendChild(t); texts.push(t);
      outgoing.push(spectrum(bx + bw + 88, r.y, bw, bh, r.out));
      var v = S.text(bx + bw + 88, r.y + bh + 20, r.verdict, 's-lbl', 'start');
      svg.appendChild(v); texts.push(v);
    });

    svg.appendChild(S.text(bx, 70, 'incident white light', 's-lbl', 'start'));
    svg.appendChild(S.text(bx + bw + 88, 70, 'what reaches your eye', 's-lbl', 'start'));

    var note = S.text(W / 2, H - 26,
      'colour is what a surface fails to absorb; a perfect absorber has no colour at all',
      's-lbl-b', 'middle');
    svg.appendChild(note);

    return function (p) {
      incoming.forEach(function (g, i) { S.op(g, M.beat(p, 0.03 + i * 0.08, 0.2 + i * 0.08)); });
      arrows.forEach(function (a, i) { S.op(a, M.beat(p, 0.25 + i * 0.08, 0.4 + i * 0.08)); });
      outgoing.forEach(function (g, i) { S.op(g, M.beat(p, 0.38 + i * 0.08, 0.56 + i * 0.08)); });
      texts.forEach(function (t, i) { S.op(t, M.beat(p, 0.3 + i * 0.03, 0.5 + i * 0.03)); });
      S.op(note, M.beat(p, 0.72, 0.9));
    };
  });

  /* ------------------------------------------ standing waves in a box --- */

  A.scene('box-modes', function (root) {
    var W = 880, H = 420;
    var svg = S.root(W, H,
      'The first five standing waves that fit between two walls. Each must vanish at both ' +
      'walls, so only whole numbers of half-wavelengths are allowed.');
    root.appendChild(svg);

    var x0 = 150, x1 = 730, amp = 26;
    var modes = [];
    for (var n = 1; n <= 5; n++) {
      var y = 70 + (n - 1) * 66;
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.line(x0, y - 40, x0, y + 40, 's-axis'));
      g.appendChild(S.line(x1, y - 40, x1, y + 40, 's-axis'));
      g.appendChild(S.line(x0, y, x1, y, 's-grid'));
      var path = S.path('', 's-wave');
      g.appendChild(path);
      g.appendChild(S.text(x0 - 16, y + 4, 'n = ' + n, 's-lbl', 'end'));
      g.appendChild(S.text(x1 + 16, y + 4, 'k = ' + n + 'π / L', 's-lbl-w', 'start'));
      modes.push({ g: g, path: path, n: n, y: y });
    }
    svg.appendChild(S.text((x0 + x1) / 2, 34, 'a cavity of side L', 's-lbl-b', 'middle'));
    var concl = S.text(W / 2, H - 26,
      'only k = nπ/L survives: the wall condition quantises the wavenumber',
      's-lbl-b', 'middle');
    svg.appendChild(concl);

    return function (p, t) {
      modes.forEach(function (m, i) {
        var f = M.beat(p, 0.04 + i * 0.09, 0.24 + i * 0.09);
        S.op(m.g, f);
        var wob = Math.cos(t * (1.1 + m.n * 0.25));
        var pts = S.sample(160, 0, 1, function (u) {
          return [M.lerp(x0, x1, u), m.y - Math.sin(m.n * Math.PI * u) * amp * wob];
        });
        S.setD(m.path, S.polyD(pts));
      });
      S.op(concl, M.beat(p, 0.72, 0.9));
    };
  });

  /* ---------------------------------------------------- counting in k space --- */

  A.scene('kspace', function (root) {
    var W = 900, H = 620;
    var svg = S.root(W, H,
      'Allowed wavevectors form a cubic lattice with spacing pi over L. Counting the modes ' +
      'with wavenumber between k and k plus dk means counting lattice points in a thin ' +
      'spherical shell, restricted to the positive octant.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var ox = 90, oy = 486, sp = 26, N = 14;
    var dots = [];
    var gLat = S.g({});
    svg.appendChild(gLat);
    for (var a = 0; a <= N; a++) {
      for (var b = 0; b <= N; b++) {
        var x = ox + a * sp, y = oy - b * sp;
        var d = S.circle(x, y, 2.4, 's-fill-i');
        d.setAttribute('opacity', '0.30');
        gLat.appendChild(d);
        dots.push({ el: d, r: Math.sqrt(a * a + b * b) });
      }
    }
    svg.appendChild(S.arrow(svg, ox, oy, ox + (N + 1.2) * sp, oy, 'i'));
    svg.appendChild(S.arrow(svg, ox, oy, ox, oy - (N + 1.2) * sp, 'i'));
    svg.appendChild(S.text(ox + (N + 1.4) * sp, oy + 4, 'kₓ', 's-lbl-b', 'start'));
    svg.appendChild(S.text(ox - 8, oy - (N + 1.4) * sp, 'kᵧ', 's-lbl-b', 'end'));

    var spacing = S.g({});
    svg.appendChild(spacing);
    spacing.appendChild(S.line(ox, oy + 22, ox + sp, oy + 22, 's-axis'));
    spacing.appendChild(S.line(ox, oy + 16, ox, oy + 28, 's-axis'));
    spacing.appendChild(S.line(ox + sp, oy + 16, ox + sp, oy + 28, 's-axis'));
    spacing.appendChild(S.text(ox + sp / 2, oy + 42, 'spacing π / L', 's-lbl-w', 'middle'));

    var shellIn = S.el('path', { class: 's-ghost', 'stroke-dasharray': '4 4' });
    var shellOut = S.el('path', { class: 's-ghost', 'stroke-dasharray': '4 4' });
    svg.appendChild(shellIn); svg.appendChild(shellOut);
    var shellLbl = S.text(W / 2, H / 2, 'shell of thickness dk', 's-lbl-q', 'start');
    svg.appendChild(shellLbl);

    var infoX = 520;
    var octant = S.text(infoX, 200,
      'only positive components are', 's-lbl', 'start');
    var octant2 = S.text(infoX, 222,
      'new modes: one octant of the sphere', 's-lbl', 'start');
    svg.appendChild(octant); svg.appendChild(octant2);
    var polar = S.text(infoX, 268,
      'and every wavevector carries two', 's-lbl-q', 'start');
    var polar2 = S.text(infoX, 290,
      'independent polarisations', 's-lbl-q', 'start');
    svg.appendChild(polar); svg.appendChild(polar2);
    var count = S.text(infoX, 336, '', 's-lbl-b', 'start');
    svg.appendChild(count);
    var count2 = S.text(infoX, 358, 'in this two-dimensional slice', 's-lbl', 'start');
    svg.appendChild(count2);

    return function (p) {
      S.op(gLat, M.beat(p, 0.02, 0.16));
      S.op(spacing, M.beat(p, 0.14, 0.3));

      var kr = M.lerp(2.0, 12.0, M.easeInOut(M.beat(p, 0.28, 0.85)));
      var dk = 1.1;
      var arc = function (r) {
        return 'M' + (ox + r * sp) + ' ' + oy +
               'A' + (r * sp) + ' ' + (r * sp) + ' 0 0 0 ' + ox + ' ' + (oy - r * sp);
      };
      S.setD(shellIn, arc(kr));
      S.setD(shellOut, arc(kr + dk));
      var band = M.beat(p, 0.26, 0.36);
      S.op(shellIn, band); S.op(shellOut, band);
      shellLbl.setAttribute('x', ox + (kr + dk) * sp * 0.74);
      shellLbl.setAttribute('y', oy - (kr + dk) * sp * 0.74);
      S.op(shellLbl, band);

      var n = 0;
      dots.forEach(function (d) {
        var inside = d.r >= kr && d.r <= kr + dk;
        if (inside) n++;
        d.el.setAttribute('opacity', inside ? '1' : '0.22');
        d.el.setAttribute('r', inside ? '3.6' : '2.4');
        d.el.setAttribute('class', inside ? 's-fill-q' : 's-fill-i');
      });

      var oc = M.beat(p, 0.4, 0.55), po = M.beat(p, 0.55, 0.7), cn = M.beat(p, 0.3, 0.42);
      S.op(octant, oc); S.op(octant2, oc);
      S.op(polar, po); S.op(polar2, po);
      count.textContent = 'lattice points highlighted: ' + n;
      S.op(count, cn); S.op(count2, cn);
    };
  });

  /* ------------------------------------- assembling the density of modes --- */

  A.scene('mode-count', function (root) {
    var W = 880, H = 400;
    var svg = S.root(W, H,
      'The density of modes assembled factor by factor: shell volume, divided by the volume ' +
      'per lattice point, restricted to one octant, doubled for polarisation, divided by the ' +
      'cavity volume, and converted from wavenumber to frequency.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var rows = [
      ['count lattice points in the shell', 'volume of the shell', '4πk² dk'],
      ['each mode occupies one cell', 'divide by (π/L)³', '4πk² dk · L³/π³'],
      ['negative components repeat modes', 'keep one octant, divide by 8', 'πk² dk · L³ / (2π³)'],
      ['two polarisations per wavevector', 'multiply by 2', 'k² dk · L³ / π²'],
      ['we want it per unit volume', 'divide by V = L³', 'k² dk / π²'],
      ['and per unit frequency, with k = ω/c', 'so dk = dω/c', 'ω² dω / (π²c³)']
    ];

    var built = rows.map(function (r, i) {
      var y = 56 + i * 54;
      var g = S.g({});
      svg.appendChild(g);
      g.appendChild(S.text(52, y, r[0], 's-lbl', 'start'));
      g.appendChild(S.text(470, y, r[1], 's-lbl-q', 'start'));
      var res = S.text(W - 52, y, r[2], 's-lbl-w', 'end');
      res.setAttribute('font-size', '13');
      g.appendChild(res);
      g.appendChild(S.line(52, y + 16, W - 52, y + 16, 's-grid'));
      return g;
    });

    var final = S.text(W / 2, H - 42,
      'n(ω)/V = ω² / (π²c³)   modes per unit volume per unit frequency',
      's-lbl-b', 'middle');
    final.setAttribute('font-size', '14');
    svg.appendChild(final);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.04 + i * 0.1, 0.22 + i * 0.1)); });
      S.op(final, M.beat(p, 0.76, 0.94));
    };
  });

  /* ------------------------------------------------------- equipartition --- */

  A.scene('equipartition', function (root) {
    var W = 880, H = 360;
    var svg = S.root(W, H,
      'A single cavity mode behaves as a harmonic oscillator with two quadratic terms in its ' +
      'energy. Classical statistical mechanics gives each of them an average of half k T.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var terms = [
      { x: 190, label: 'kinetic-like term', expr: '½ m v²', tone: 'w' },
      { x: 500, label: 'potential-like term', expr: '½ m ω² x²', tone: 'q' }
    ];
    var built = terms.map(function (tm) {
      var g = S.g({});
      svg.appendChild(g);
      var box = S.rect(tm.x - 110, 80, 220, 78, 's-ghost');
      box.setAttribute('fill', 'none');
      box.setAttribute('rx', '2');
      g.appendChild(box);
      var e = S.text(tm.x, 128, tm.expr, tm.tone === 'w' ? 's-lbl-w' : 's-lbl-q', 'middle');
      e.setAttribute('font-size', '18');
      g.appendChild(e);
      g.appendChild(S.text(tm.x, 68, tm.label, 's-lbl', 'middle'));
      var a = S.arrow(svg, tm.x, 166, tm.x, 214, 'm');
      g.appendChild(a);
      var got = S.text(tm.x, 240, '½ kᴮ T', 's-lbl-b', 'middle');
      got.setAttribute('font-size', '16');
      g.appendChild(got);
      return g;
    });

    var rule = S.text(W / 2, 296,
      'each quadratic term in the energy gets ½ kᴮ T on average, so this mode holds kᴮ T',
      's-lbl-b', 'middle');
    rule.setAttribute('font-size', '13');
    svg.appendChild(rule);
    var caveat = S.text(W / 2, 324,
      'note what this does not depend on: the frequency ω is nowhere in the answer',
      's-lbl-f', 'middle');
    svg.appendChild(caveat);

    return function (p) {
      built.forEach(function (g, i) { S.op(g, M.beat(p, 0.06 + i * 0.14, 0.3 + i * 0.14)); });
      S.op(rule, M.beat(p, 0.5, 0.7));
      S.op(caveat, M.beat(p, 0.72, 0.92));
    };
  });
})(window.A = window.A || {});
