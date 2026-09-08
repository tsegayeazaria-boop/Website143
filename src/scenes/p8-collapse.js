/* Section 1.8: what the collapse postulate actually asserts, why the collapsed
   packet has a width the detector chooses, the two readings of the state before
   a measurement, the map of the interpretive debate, and the Bell experiment
   that turns one corner of that debate into a number. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  var SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

  /* Superscript digits, so a computed exponent can be printed without a font
     trick or a library. */
  function sup(v) {
    var s = String(v), o = '', i, ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      o += (ch === '-') ? '⁻' : ((ch >= '0' && ch <= '9') ? SUPS.charAt(Number(ch)) : ch);
    }
    return o;
  }

  function sci(v, d) {
    if (!v || !isFinite(v)) return '0';
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    var m = v / Math.pow(10, e);
    if (Math.abs(m) >= 9.9995) { m = m / 10; e = e + 1; }
    return m.toFixed(d == null ? 2 : d) + ' × 10' + sup(e);
  }

  /* Class rules set font-size, so a presentation attribute would be ignored;
     an inline style is the only way to change it. Widths are budgeted for it. */
  function size(node, px) { node.style.fontSize = px + 'px'; return node; }

  /* A bordered card with a title and a stack of body lines. */
  function card(x, y, w, h, stroke, titleCls, title, lines) {
    var g = S.g({}), i;
    var box = S.rect(x, y, w, h, null);
    box.setAttribute('fill', 'var(--surface)');
    box.setAttribute('stroke', stroke);
    box.setAttribute('stroke-opacity', '0.7');
    box.setAttribute('rx', '3');
    g.appendChild(box);
    g.appendChild(size(S.text(x + 16, y + 30, title, titleCls, 'start'), 13));
    for (i = 0; i < lines.length; i++) {
      g.appendChild(S.text(x + 16, y + 56 + i * 21, lines[i], 's-lbl', 'start'));
    }
    return g;
  }

  /* ============================================================ 1.8.1 rebuilt ===
     A broad prepared state, one detection, and the state the detection leaves.
     The collapsed packet is computed by applying a Gaussian detector operator to
     the prepared state and renormalising, which is the Lueders rule for a
     detector of finite resolution. Its width is then measured off the drawn
     curve rather than asserted. */

  A.scene('collapse-measure', function (root) {
    var W = 1080, H = 700;
    var svg = S.root(W, H,
      'A broad two-slit probability density spread across a detector; a single detection ' +
      'event at a point A; and the state left behind, a peak whose width is the resolution ' +
      'of the detector rather than zero. A second run of the same experiment lands ' +
      'somewhere else entirely.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 96, x1 = 1000, yT = 100, yB = 390;
    var HALF = 10;                     /* half-width of the detector, in mm     */
    var SIG = 0.25;                    /* detector resolution sigma, in mm      */
    var PITCH = 0.5;                   /* one detector pixel, in mm             */
    var PX = function (x) { return M.map(x, -HALF, HALF, x0, x1); };

    var N = 800, dx = 2 * HALF / N, i;
    var grid = [];
    for (i = 0; i <= N; i++) grid.push(-HALF + i * dx);

    function areaOf(v) {
      var s = 0, j;
      for (j = 1; j <= N; j++) s += 0.5 * (v[j - 1] + v[j]) * dx;
      return s;
    }
    function unitArea(v) {
      var a = areaOf(v), o = [], j;
      for (j = 0; j <= N; j++) o.push(v[j] / a);
      return o;
    }

    /* The prepared state: the two-slit pattern of section 1.3, normalised so the
       area under it is one probability. */
    var raw = [];
    for (i = 0; i <= N; i++) raw.push(M.doubleSlit(grid[i] / 20, 2.2, 9));
    var before = unitArea(raw);
    var peak0 = 0;
    for (i = 0; i <= N; i++) if (before[i] > peak0) peak0 = before[i];

    /* Landing points drawn from the state's own distribution, by inverting its
       cumulative integral. Fixed seed, so the same scroll draws the same run. */
    var cdf = [0];
    for (i = 1; i <= N; i++) cdf.push(cdf[i - 1] + 0.5 * (before[i - 1] + before[i]) * dx);
    function drawFrom(u) {
      var j;
      for (j = 1; j <= N; j++) {
        if (cdf[j] >= u) {
          return grid[j - 1] + dx * (u - cdf[j - 1]) / Math.max(1e-12, cdf[j] - cdf[j - 1]);
        }
      }
      return grid[N];
    }
    var rnd = M.rng(90119);
    var hits = [drawFrom(rnd() * cdf[N]), drawFrom(rnd() * cdf[N])];

    /* ---- frame ---- */
    svg.appendChild(size(S.text(W / 2, 42,
      'Figure 1.8.1 rebuilt: the click, and the state it leaves behind',
      's-lbl-b', 'middle'), 15));

    svg.appendChild(S.gridLines(x0, yT, x1, yB, 10, 4));
    svg.appendChild(S.axes(x0, yT, x1, yB, null, null));
    svg.appendChild(S.text(x0 - 10, yT + 4, '|ψ|²', 's-lbl-p', 'end'));
    for (i = -10; i <= 10; i += 2) {
      svg.appendChild(S.line(PX(i), yB, PX(i), yB + 6, 's-axis'));
      svg.appendChild(S.text(PX(i), yB + 20, String(i), 's-tick', 'middle'));
    }
    svg.appendChild(S.text((x0 + x1) / 2, yB + 42,
      'position along the detector   x  (mm)', 's-lbl', 'middle'));

    svg.appendChild(S.text(x0 + 12, yT + 20,
      'before the click: one state, spread over the whole pattern', 's-lbl', 'start'));
    var afterLbl = S.text(x0 + 12, yT + 40,
      'after: the same ψ, multiplied by the detector response, renormalised', 's-lbl-p', 'start');
    svg.appendChild(afterLbl);

    var ghost = S.path('', 's-ghost s-dash');
    var fill = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.16', stroke: 'none' });
    var live = S.path('', 's-prob');
    svg.appendChild(ghost); svg.appendChild(fill); svg.appendChild(live);

    /* ---- the detector ---- */
    var yBar = 462, hBar = 26;
    var gDet = S.g({});
    svg.appendChild(gDet);
    var bar = S.rect(x0, yBar, x1 - x0, hBar, null);
    bar.setAttribute('fill', 'var(--surface-2)');
    bar.setAttribute('stroke', 'var(--hairline-2)');
    gDet.appendChild(bar);
    var nPix = Math.round(2 * HALF / PITCH);
    for (i = 0; i <= nPix; i++) {
      gDet.appendChild(S.line(PX(-HALF + i * PITCH), yBar, PX(-HALF + i * PITCH), yBar + hBar, 's-grid'));
    }
    var pixHit = S.rect(0, yBar + 1, 1, hBar - 2, null);
    pixHit.setAttribute('fill', 'var(--quantum)');
    pixHit.setAttribute('fill-opacity', '0.5');
    gDet.appendChild(pixHit);
    gDet.appendChild(S.text(x0, yBar + hBar + 22,
      'the detector: pixels ' + PITCH.toFixed(2) + ' mm wide, Gaussian resolution σ = ' +
      SIG.toFixed(2) + ' mm', 's-lbl', 'start'));

    var dots = [];
    for (i = 0; i < 2; i++) {
      var d = S.circle(PX(hits[i]), yBar + hBar / 2, 5, 's-fill-q');
      gDet.appendChild(d);
      dots.push(d);
    }

    var hitLine = S.line(0, yT, 0, yBar + hBar, 's-quantum s-dash');
    svg.appendChild(hitLine);
    var hitLbl = S.text(0, yT - 14, 'A', 's-lbl-q', 'middle');
    svg.appendChild(hitLbl);
    var flash = S.circle(0, yBar + hBar / 2, 6, null);
    flash.setAttribute('fill', 'none');
    flash.setAttribute('stroke', 'var(--quantum)');
    svg.appendChild(flash);

    /* Bracket one pixel wide, drawn under the collapsed peak. */
    var brack = S.path('', 's-quantum');
    svg.appendChild(brack);

    /* ---- readouts ---- */
    var rowCls = ['s-lbl-q', 's-lbl-p', 's-lbl', 's-lbl', 's-lbl-f'];
    var rows = [];
    for (i = 0; i < 5; i++) {
      var r = S.text(x0, 540 + i * 24, '', rowCls[i], 'start');
      svg.appendChild(r);
      rows.push(r);
    }
    var note = S.text(W / 2, 668,
      'the state is updated; nothing is transported. Collapse is a rule for what to ' +
      'predict next, not a signal in space.', 's-lbl-b', 'middle');
    svg.appendChild(note);

    var C = M.C;

    return function (p) {
      var second = p >= 0.70;
      var u = second ? M.beat(p, 0.70, 0.985) : M.beat(p, 0.03, 0.66);
      var hit = hits[second ? 1 : 0];
      var clicked = M.beat(u, 0.20, 0.30);
      var c = M.easeInOut(M.beat(u, 0.30, 0.80));

      /* The Lueders update for a detector of resolution SIG: multiply by the
         detector response and renormalise. Widening the response back to the
         width of the whole screen recovers the prepared state, so the same line
         of code draws both ends of the collapse. */
      var w = Math.exp(M.lerp(Math.log(400), Math.log(SIG), c));
      var vals = [], k;
      for (k = 0; k <= N; k++) {
        vals.push(before[k] * Math.exp(-Math.pow((grid[k] - hit) / w, 2) / 2));
      }
      vals = unitArea(vals);

      var pk = 0, mean = 0, var2 = 0;
      for (k = 0; k <= N; k++) if (vals[k] > pk) pk = vals[k];
      for (k = 0; k <= N; k++) mean += grid[k] * vals[k] * dx;
      for (k = 0; k <= N; k++) var2 += Math.pow(grid[k] - mean, 2) * vals[k] * dx;
      var width = Math.sqrt(var2);

      /* One vertical scale for both curves, set by whichever is taller now, so
         the prepared state visibly flattens as the peak grows. */
      var top = Math.max(pk, peak0 * 0.02);
      var PY = function (v) { return yB - (v / top) * (yB - yT - 16); };

      var livePts = [], ghostPts = [];
      for (k = 0; k <= N; k += 2) {
        livePts.push([PX(grid[k]), PY(vals[k])]);
        ghostPts.push([PX(grid[k]), PY(before[k])]);
      }
      S.setD(live, S.polyD(livePts));
      S.setD(ghost, S.polyD(ghostPts));
      fill.setAttribute('d', S.areaD(livePts, yB));

      hitLine.setAttribute('x1', PX(hit)); hitLine.setAttribute('x2', PX(hit));
      hitLbl.setAttribute('x', M.clamp(PX(hit), x0 + 10, x1 - 10));
      var pixL = -HALF + Math.floor((hit + HALF) / PITCH) * PITCH;
      pixHit.setAttribute('x', PX(pixL));
      pixHit.setAttribute('width', Math.max(1, PX(pixL + PITCH) - PX(pixL)));

      flash.setAttribute('cx', PX(hit));
      flash.setAttribute('r', String(6 + 26 * clicked));
      S.op(flash, clicked * (1 - clicked) * 4);

      var bx1 = PX(hit - SIG), bx2 = PX(hit + SIG), by = yBar - 16;
      S.setD(brack, 'M' + bx1.toFixed(1) + ' ' + (by - 7) + 'L' + bx1.toFixed(1) + ' ' + by +
        'L' + bx2.toFixed(1) + ' ' + by + 'L' + bx2.toFixed(1) + ' ' + (by - 7));

      rows[0].textContent = 'run ' + (second ? 2 : 1) + ' · detection at A, x = ' +
        (hit >= 0 ? '+' : '') + hit.toFixed(2) + ' mm · the pixel that fired is marked below';
      rows[1].textContent = 'the state after the click, measured off the drawn curve: ' +
        'Δx = ' + width.toFixed(3) + ' mm, area = ' + areaOf(vals).toFixed(3) +
        ', peak taller by ×' + (pk / peak0).toFixed(1);
      rows[2].textContent = 'that width is the detector, not the electron: σ = ' + SIG.toFixed(3) +
        ' mm, and |ψ|² falling away across the pixel trims it a little';

      var dxm = Math.max(1e-9, width) * 1e-3;
      var dp = C.hbar / (2 * dxm);
      var Tmin = dp * dp / (2 * C.me) / C.e;
      rows[3].textContent = 'the price: Δp ≥ ħ/2Δx = ' + sci(dp) + ' kg m/s, so Δx Δp = ' +
        sci(dxm * dp) + ' J s = ħ/2, and T ≥ ' + sci(Tmin) + ' eV';
      rows[4].textContent = 'width zero is not merely hard, it is forbidden: ' +
        '∫|δ(x−A)|² dx = ∞, and ⟨p²⟩ = ∞ along with it';

      S.op(ghost, M.beat(p, 0.02, 0.10));
      S.op(live, M.beat(p, 0.02, 0.10));
      S.op(fill, M.beat(p, 0.02, 0.12));
      S.op(gDet, M.beat(p, 0.08, 0.20));
      S.op(dots[0], second ? 1 : clicked);
      S.op(dots[1], second ? clicked : 0);
      S.op(hitLine, clicked);
      S.op(hitLbl, clicked);
      S.op(brack, M.beat(c, 0.55, 1));
      S.op(afterLbl, M.beat(c, 0.1, 0.5));

      S.op(rows[0], clicked);
      S.op(rows[1], M.beat(c, 0.4, 0.9));
      S.op(rows[2], M.beat(p, 0.46, 0.58));
      S.op(rows[3], M.beat(p, 0.52, 0.64));
      S.op(rows[4], M.beat(p, 0.58, 0.68));
      S.op(note, M.beat(p, 0.88, 0.99));
    };
  });

  /* =========================================================== question 1.8.1 ===
     Two readings of the state before the detection, side by side, with what each
     one predicts. The first two rows are identical predictions; the third is
     where they part company, and the numbers in it are computed. */

  A.scene('before-after-question', function (root) {
    var W = 1240, H = 700;
    var svg = S.root(W, H,
      'Two competing answers to the question of whether the electron was at A before the ' +
      'measurement, set side by side with what each one predicts. They agree about single ' +
      'landings and about the two-slit fringes, and disagree only about correlations ' +
      'between two distant wings.');
    root.appendChild(svg);

    /* The two numbers in the last row, computed rather than quoted. The local
       bound is found by exhausting the sixteen ways of assigning plus or minus
       one to four settings; the quantum value by evaluating the singlet
       correlation at the settings that maximise the same combination. */
    var lhv = 0, sa, sap, sb, sbp, sv;
    for (sa = -1; sa <= 1; sa += 2) {
      for (sap = -1; sap <= 1; sap += 2) {
        for (sb = -1; sb <= 1; sb += 2) {
          for (sbp = -1; sbp <= 1; sbp += 2) {
            sv = Math.abs(sa * sb - sa * sbp + sap * sb + sap * sbp);
            if (sv > lhv) lhv = sv;
          }
        }
      }
    }
    function Sof(rad) { return -3 * Math.cos(rad) + Math.cos(3 * rad); }
    var qMax = 0, qAt = 0, i, td;
    for (i = 0; i <= 9000; i++) {
      td = i / 100;
      if (Math.abs(Sof(td * Math.PI / 180)) > qMax) { qMax = Math.abs(Sof(td * Math.PI / 180)); qAt = td; }
    }

    var c0 = 40, c1 = 360, c2 = 800, w1 = 420, w2 = 400;

    svg.appendChild(size(S.text(W / 2, 44,
      'Question 1.8.1: was the electron at A before the detector fired?',
      's-lbl-b', 'middle'), 15));
    svg.appendChild(S.text(W / 2, 70,
      'two claims that sound like one claim, and the single place they come apart',
      's-lbl', 'middle'));

    var heads = [
      { x: c1, w: w1, cls: 's-lbl-q',
        t: 'It was at A all along; we merely found out',
        s: 'hidden variables: ψ is our ignorance' },
      { x: c2, w: w2, cls: 's-lbl-p',
        t: 'There was no fact of the matter until then',
        s: 'Copenhagen: there is no value to reveal' }
    ];
    var gHeads = [];
    heads.forEach(function (h) {
      var g = S.g({});
      var box = S.rect(h.x, 92, h.w, 58, null);
      box.setAttribute('fill', 'var(--surface)');
      box.setAttribute('stroke', h.cls === 's-lbl-q' ? 'var(--quantum)' : 'var(--probability)');
      box.setAttribute('stroke-opacity', '0.7');
      box.setAttribute('rx', '3');
      g.appendChild(box);
      g.appendChild(size(S.text(h.x + h.w / 2, 118, h.t, h.cls, 'middle'), 13));
      g.appendChild(S.text(h.x + h.w / 2, 138, h.s, 's-lbl', 'middle'));
      svg.appendChild(g);
      gHeads.push(g);
    });

    /* The same |psi|^2 under both readings, drawn from the same formula. */
    function mini(x, w, withDot) {
      var g = S.g({});
      var yb = 252, ht = 74;
      g.appendChild(S.line(x + 10, yb, x + w - 10, yb, 's-axis'));
      var pts = S.sample(180, -10, 10, function (xx) {
        return [M.map(xx, -10, 10, x + 10, x + w - 10),
                yb - M.doubleSlit(xx / 20, 2.2, 9) * ht];
      });
      g.appendChild(S.poly(pts, 's-prob'));
      if (withDot) {
        var xa = M.map(4.27, -10, 10, x + 10, x + w - 10);
        g.appendChild(S.line(xa, yb, xa, yb - ht - 6, 's-quantum s-dash'));
        var dot = S.circle(xa, yb, 5.5, 's-fill-q');
        g.appendChild(dot);
        g.appendChild(S.text(x + w / 2, yb + 22,
          'λ carries a position; the wave only guides it', 's-lbl-q', 'middle'));
      } else {
        g.appendChild(S.text(x + w / 2, yb + 22,
          'amplitude only; no position waiting to be read', 's-lbl-p', 'middle'));
      }
      svg.appendChild(g);
      return g;
    }
    var gMini1 = mini(c1, w1, true);
    var gMini2 = mini(c2, w2, false);

    var ROWS = [
      { q: 'Where one electron lands', v: 'the same prediction', tone: 's-lbl',
        a: 'sampled from μ(λ) = |ψ(x)|², by assumption',
        b: 'sampled from |ψ(x)|², by the Born rule' },
      { q: 'The two-slit fringes', v: 'the same prediction', tone: 's-lbl',
        a: 'reproduced: the guiding wave passes both slits',
        b: 'reproduced: amplitudes add before squaring' },
      { q: 'Correlations, two distant wings', v: 'here they come apart', tone: 's-lbl-q',
        a: '|S| ≤ ' + lhv.toFixed(3) + ' if the values are local',
        b: '|S| = ' + qMax.toFixed(4) + ' at the best settings' }
    ];
    var gRows = ROWS.map(function (r, k) {
      var g = S.g({});
      var y = 306 + k * 70;
      g.appendChild(S.line(c0, y - 24, c2 + w2, y - 24, 's-grid'));
      g.appendChild(S.text(c0, y, r.q, 's-lbl-b', 'start'));
      g.appendChild(S.text(c0, y + 20, r.v, r.tone, 'start'));
      g.appendChild(S.text(c1 + 14, y + 10, r.a, k === 2 ? 's-lbl-q' : 's-lbl', 'start'));
      g.appendChild(S.text(c2 + 14, y + 10, r.b, k === 2 ? 's-lbl-p' : 's-lbl', 'start'));
      svg.appendChild(g);
      return g;
    });
    svg.appendChild(S.line(c0, 492, c2 + w2, 492, 's-grid'));

    var tail = [
      ['s-lbl-q', 'experiment decides the last row, and only the last row'],
      ['s-lbl', 'the detection at A settles nothing: λ = x with μ(x) = |ψ(x)|² returns every position statistic exactly'],
      ['s-lbl', 'the fringes settle nothing either: a non-local hidden-variable theory reproduces them in full'],
      ['s-lbl', 'what the correlation experiments rule out is narrower: pre-existing values that are local and setting-independent'],
      ['s-lbl-b', 'that is the whole of what the experiments decide. The rest is interpretation, and is worth labelling as such.']
    ].map(function (pair, k) {
      var t = S.text(c0, 528 + k * 26, pair[1], pair[0], 'start');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      gHeads.forEach(function (g, k) { S.op(g, M.beat(p, 0.03 + k * 0.07, 0.16 + k * 0.07)); });
      S.op(gMini1, M.beat(p, 0.14, 0.26));
      S.op(gMini2, M.beat(p, 0.20, 0.32));
      gRows.forEach(function (g, k) { S.op(g, M.beat(p, 0.32 + k * 0.11, 0.46 + k * 0.11)); });
      tail.forEach(function (t, k) { S.op(t, M.beat(p, 0.66 + k * 0.06, 0.78 + k * 0.06)); });
    };
  });

  /* ============================================================== the debate ===
     The four objections the handout lists, sharpened, and the two alternatives it
     names, each labelled with the assumption it gives up. */

  A.scene('interpretation-map', function (root) {
    var W = 1180, H = 800;
    var svg = S.root(W, H,
      'A map of the debate: the Copenhagen interpretation at the top, the four standing ' +
      'objections to it below, and the two alternative interpretations the handout names, ' +
      'each labelled with the assumption it gives up.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var spine = 590;

    svg.appendChild(size(S.text(W / 2, 40,
      'The debate, drawn as a map rather than a list', 's-lbl-b', 'middle'), 15));

    /* ---- the position under discussion ---- */
    var gTop = S.g({});
    var top = S.rect(250, 62, 680, 108, null);
    top.setAttribute('fill', 'var(--surface)');
    top.setAttribute('stroke', 'var(--probability)');
    top.setAttribute('rx', '3');
    gTop.appendChild(top);
    gTop.appendChild(size(S.text(spine, 92, 'The Copenhagen interpretation', 's-lbl-p', 'middle'), 14));
    gTop.appendChild(S.text(spine, 116,
      'smooth Schrödinger evolution, plus a collapse rule at a measurement', 's-lbl', 'middle'));
    gTop.appendChild(S.text(spine, 138,
      'the two laws contradict each other, and nothing says where the boundary lies',
      's-lbl', 'middle'));
    gTop.appendChild(S.text(spine, 160,
      'that undefined boundary is the whole of the measurement problem', 's-lbl-q', 'middle'));
    svg.appendChild(gTop);

    var seg1 = S.line(spine, 170, spine, 188, 's-axis');
    var seg2 = S.line(spine, 214, spine, 478, 's-axis');
    var seg3 = S.line(spine, 508, spine, 690, 's-axis');
    svg.appendChild(seg1); svg.appendChild(seg2); svg.appendChild(seg3);
    var lblObj = S.text(spine, 206, 'the objections', 's-lbl-b', 'middle');
    var lblAlt = S.text(spine, 500, 'the alternatives', 's-lbl-b', 'middle');
    svg.appendChild(lblObj); svg.appendChild(lblAlt);

    var OBJ = [
      { x: 30, y: 220, t: 'Probability, put in by hand', l: [
        'the Born rule is an extra postulate, not a theorem',
        'and nothing in the theory says why probability at all'] },
      { x: 660, y: 220, t: 'A discontinuous collapse', l: [
        'the Schrödinger equation is smooth and reversible',
        'the update is neither, and no law says when it runs'] },
      { x: 30, y: 356, t: 'The role of the observer', l: [
        'measurement and observer are undefined primitives',
        'in a theory that is meant to be the fundamental one'] },
      { x: 660, y: 356, t: 'The role of the measuring device', l: [
        'the same equation applies to the device as well',
        'and linearity then gives entanglement, not one outcome'] }
    ];
    var gObj = OBJ.map(function (o) {
      var g = card(o.x, o.y, 490, 116, 'var(--fail)', 's-lbl-f', o.t, o.l);
      svg.appendChild(g);
      var y = o.y + 58;
      var link = o.x < spine
        ? S.line(o.x + 490, y, spine, y, 's-axis')
        : S.line(spine, y, o.x, y, 's-axis');
      link.setAttribute('stroke-dasharray', '3 4');
      svg.appendChild(link);
      return g;
    });

    var ALT = [
      { x: 30, y: 520, t: 'Hidden variables  ·  de Broglie 1927, Bohm 1952',
        stroke: 'var(--quantum)', cls: 's-lbl-q', l: [
        'the particle has a definite position at every moment',
        'the wave passes both slits and steers it to the screen',
        'gives up: locality.   keeps: every quantum prediction',
        'the Bell experiments rule out only the local kind, so',
        'this one is untouched by them'] },
      { x: 660, y: 520, t: 'Many worlds  ·  Everett 1957',
        stroke: 'var(--wave)', cls: 's-lbl-w', l: [
        'the Schrödinger equation and nothing else, ever',
        'no collapse, no second law of motion, no cut',
        'gives up: a single outcome.   keeps: linearity',
        'owes an account of where the Born rule comes from,',
        'which is still argued over'] }
    ];
    var gAlt = ALT.map(function (a) {
      var g = card(a.x, a.y, 490, 170, a.stroke, a.cls, a.t, a.l);
      svg.appendChild(g);
      var y = a.y + 60;
      var link = a.x < spine
        ? S.line(a.x + 490, y, spine, y, 's-axis')
        : S.line(spine, y, a.x, y, 's-axis');
      link.setAttribute('stroke-dasharray', '3 4');
      svg.appendChild(link);
      return g;
    });

    var tail = [
      ['s-lbl-b', 'each alternative is defined by what it gives up, not by what it adds'],
      ['s-lbl', 'no experiment has selected among these three. What experiment rules out is one class of hidden variables: the local ones.'],
      ['s-lbl', 'the objections are not settled either; they are the reason the other two boxes were written at all']
    ].map(function (pair, k) {
      var t = S.text(W / 2, 722 + k * 26, pair[1], pair[0], 'middle');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      S.op(gTop, M.beat(p, 0.02, 0.14));
      S.op(seg1, M.beat(p, 0.12, 0.2));
      S.op(lblObj, M.beat(p, 0.14, 0.22));
      S.op(seg2, M.beat(p, 0.16, 0.4));
      gObj.forEach(function (g, k) { S.op(g, M.beat(p, 0.2 + k * 0.08, 0.34 + k * 0.08)); });
      S.op(lblAlt, M.beat(p, 0.54, 0.62));
      S.op(seg3, M.beat(p, 0.54, 0.7));
      gAlt.forEach(function (g, k) { S.op(g, M.beat(p, 0.58 + k * 0.09, 0.74 + k * 0.09)); });
      tail.forEach(function (t, k) { S.op(t, M.beat(p, 0.8 + k * 0.05, 0.9 + k * 0.05)); });
    };
  });

  /* =============================================================== Bell test ===
     A source, two separated analysers with settings that can be turned, and the
     one combination of correlations whose value separates every local
     pre-existing-value model from quantum mechanics. The local bound is found by
     exhausting the sixteen sign assignments; the quantum curve is evaluated from
     the singlet correlation; the maximum is found by scanning. */

  A.scene('bell-test', function (root) {
    var W = 1240, H = 870;
    var svg = S.root(W, H,
      'A source emitting one pair towards two distant analysers whose settings can be ' +
      'turned. Below, the combination of four correlations plotted against the setting ' +
      'step: it sits at or below two for every local model, and the quantum prediction ' +
      'rises above that line to a maximum of two root two.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var RAD = Math.PI / 180;

    /* The local bound, by exhaustion over the sixteen assignments. */
    var lhv = 0, alg = 0, sa, sap, sb, sbp, sv, av;
    for (sa = -1; sa <= 1; sa += 2) {
      for (sap = -1; sap <= 1; sap += 2) {
        for (sb = -1; sb <= 1; sb += 2) {
          for (sbp = -1; sbp <= 1; sbp += 2) {
            sv = Math.abs(sa * sb - sa * sbp + sap * sb + sap * sbp);
            if (sv > lhv) lhv = sv;
            av = Math.abs(sa * sb) + Math.abs(sa * sbp) + Math.abs(sap * sb) + Math.abs(sap * sbp);
            if (av > alg) alg = av;
          }
        }
      }
    }

    /* The singlet: E(a,b) = -cos(theta_a - theta_b). */
    function E(t1, t2) { return -Math.cos((t1 - t2) * RAD); }
    function Sat(th) { return E(0, th) - E(0, 3 * th) + E(2 * th, th) + E(2 * th, 3 * th); }
    var qMax = 0, qAt = 0, i, td;
    for (i = 0; i <= 9000; i++) {
      td = i / 100;
      if (Math.abs(Sat(td)) > qMax) { qMax = Math.abs(Sat(td)); qAt = td; }
    }

    svg.appendChild(size(S.text(W / 2, 42,
      'Bell 1964: the point where the argument becomes an experiment', 's-lbl-b', 'middle'), 15));

    /* ---- apparatus ---- */
    var gApp = S.g({});
    svg.appendChild(gApp);
    var src = S.circle(620, 150, 15, 's-fill-q');
    gApp.appendChild(src);
    gApp.appendChild(S.text(620, 198, 'source: one pair, total spin zero', 's-lbl-q', 'middle'));
    gApp.appendChild(S.arrow(svg, 596, 150, 372, 150, 'm'));
    gApp.appendChild(S.arrow(svg, 644, 150, 868, 150, 'm'));

    function dial(cx) {
      var g = S.g({});
      var ring = S.circle(cx, 150, 52, 's-axis');
      ring.setAttribute('fill', 'var(--surface)');
      g.appendChild(ring);
      var n1 = S.line(cx, 150, cx, 98, 's-quantum');
      var n2 = S.line(cx, 150, cx, 98, 's-wave');
      n2.setAttribute('stroke-dasharray', '5 4');
      g.appendChild(n1); g.appendChild(n2);
      svg.appendChild(g);
      return { g: g, n1: n1, n2: n2, cx: cx };
    }
    var dL = dial(320), dR = dial(920);
    function needle(ln, cx, ang) {
      var s = Math.sin(ang * RAD), c = Math.cos(ang * RAD);
      ln.setAttribute('x1', (cx - 52 * s).toFixed(1));
      ln.setAttribute('y1', (150 + 52 * c).toFixed(1));
      ln.setAttribute('x2', (cx + 52 * s).toFixed(1));
      ln.setAttribute('y2', (150 - 52 * c).toFixed(1));
    }

    var labL = S.text(320, 232, '', 's-lbl-q', 'middle');
    var labR = S.text(920, 232, '', 's-lbl-q', 'middle');
    gApp.appendChild(labL); gApp.appendChild(labR);
    gApp.appendChild(S.text(320, 252, 'solid: a    dashed: a′', 's-lbl', 'middle'));
    gApp.appendChild(S.text(920, 252, 'solid: b    dashed: b′', 's-lbl', 'middle'));

    var marg = S.text(W / 2, 288,
      'each wing alone reads +1 half the time and −1 half the time, whatever the far dial ' +
      'is set to', 's-lbl-w', 'middle');
    svg.appendChild(marg);

    /* ---- the four correlations, evaluated every frame ---- */
    var eRows = [];
    for (i = 0; i < 4; i++) {
      var t = S.text(i < 2 ? 300 : 760, 326 + (i % 2) * 22, '', 's-lbl', 'start');
      svg.appendChild(t);
      eRows.push(t);
    }
    var sRow = S.text(300, 384, '', 's-lbl-q', 'start');
    svg.appendChild(sRow);

    /* ---- the plot ---- */
    var px0 = 300, px1 = 1160, py0 = 700, py1 = 450, SMAX = 4.2;
    var PXt = function (th) { return M.map(th, 0, 90, px0, px1); };
    var PYs = function (s) { return M.map(s, 0, SMAX, py0, py1); };
    svg.appendChild(S.axes(px0, py1, px1, py0, null, null));
    for (i = 0; i <= 4; i++) {
      svg.appendChild(S.line(px0 - 5, PYs(i), px0, PYs(i), 's-axis'));
      svg.appendChild(S.text(px0 - 10, PYs(i) + 4, String(i), 's-tick', 'end'));
    }
    for (i = 0; i <= 90; i += 15) {
      svg.appendChild(S.line(PXt(i), py0, PXt(i), py0 + 5, 's-axis'));
      svg.appendChild(S.text(PXt(i), py0 + 19, String(i) + '°', 's-tick', 'middle'));
    }
    svg.appendChild(S.text(px0 - 10, py1 - 8, '|S|', 's-lbl', 'end'));
    svg.appendChild(S.text((px0 + px1) / 2, py0 + 42,
      'setting step θ, with a = 0, b = θ, a′ = 2θ, b′ = 3θ', 's-lbl', 'middle'));

    var lineL = S.line(px0, PYs(lhv), px1, PYs(lhv), 's-wave');
    var lineQ = S.line(px0, PYs(qMax), px1, PYs(qMax), 's-quantum s-dash');
    var lineA = S.line(px0, PYs(alg), px1, PYs(alg), 's-ghost s-dash');
    svg.appendChild(lineL); svg.appendChild(lineQ); svg.appendChild(lineA);
    var labLhv = S.text(px1 - 8, PYs(lhv) - 8,
      'every local model lives at or below |S| = ' + lhv.toFixed(3), 's-lbl-w', 'end');
    var labQ = S.text(px1 - 8, PYs(qMax) - 8,
      'quantum maximum ' + qMax.toFixed(4), 's-lbl-q', 'end');
    var labA = S.text(px1 - 8, PYs(alg) - 8,
      'algebraic maximum ' + alg.toFixed(3) + ', which nature does not use', 's-lbl', 'end');
    svg.appendChild(labLhv); svg.appendChild(labQ); svg.appendChild(labA);

    var band = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.16', stroke: 'none' });
    svg.appendChild(band);
    var curve = S.path('', 's-quantum');
    svg.appendChild(curve);
    var mark = S.circle(0, 0, 5, 's-fill-q');
    svg.appendChild(mark);
    var best = S.line(0, py1, 0, py0, 's-quantum s-dash');
    svg.appendChild(best);

    var tail = [
      ['s-lbl', 'the local bound is not a guess: over all sixteen ways of assigning ±1 to the four settings, the largest |S| is ' + lhv.toFixed(3)],
      ['s-lbl', 'the quantum maximum, scanned over θ, is ' + qMax.toFixed(4) + ' at θ = ' + qAt.toFixed(1) + '°, larger by a factor ' + (qMax / lhv).toFixed(4)],
      ['s-lbl', 'the gap between the two lines is what an experiment can see; above the cyan line no local pre-existing-value model can follow'],
      ['s-lbl-b', 'what that rules out: values that are local and independent of the setting choice. Not hidden variables as such, and not one interpretation over another.']
    ].map(function (pair, k) {
      var t = S.text(60, 764 + k * 26, pair[1], pair[0], 'start');
      svg.appendChild(t);
      return t;
    });

    return function (p) {
      var th = p < 0.58
        ? M.lerp(0, 90, M.easeInOut(M.beat(p, 0.24, 0.58)))
        : M.lerp(90, qAt, M.easeInOut(M.beat(p, 0.58, 0.68)));

      needle(dL.n1, 320, 0);
      needle(dL.n2, 320, 2 * th);
      needle(dR.n1, 920, th);
      needle(dR.n2, 920, 3 * th);
      labL.textContent = 'a = 0.0°    a′ = ' + (2 * th).toFixed(1) + '°';
      labR.textContent = 'b = ' + th.toFixed(1) + '°    b′ = ' + (3 * th).toFixed(1) + '°';

      var eab = E(0, th), eabp = E(0, 3 * th), eapb = E(2 * th, th), eapbp = E(2 * th, 3 * th);
      eRows[0].textContent = 'E(a, b)   = −cos ' + Math.abs(th).toFixed(1) + '° = ' + eab.toFixed(4);
      eRows[1].textContent = 'E(a, b′)  = −cos ' + Math.abs(3 * th).toFixed(1) + '° = ' + eabp.toFixed(4);
      eRows[2].textContent = 'E(a′, b)  = −cos ' + Math.abs(th).toFixed(1) + '° = ' + eapb.toFixed(4);
      eRows[3].textContent = 'E(a′, b′) = −cos ' + Math.abs(th).toFixed(1) + '° = ' + eapbp.toFixed(4);
      var Snow = eab - eabp + eapb + eapbp;
      sRow.textContent = 'S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′) = ' + Snow.toFixed(4) +
        '        |S| = ' + Math.abs(Snow).toFixed(4);

      var upto = p < 0.58 ? th : 90;
      var pts = [], k, tt;
      for (k = 0; k <= 220; k++) {
        tt = upto * k / 220;
        pts.push([PXt(tt), PYs(Math.min(SMAX, Math.abs(Sat(tt))))]);
      }
      S.setD(curve, S.polyD(pts));

      /* Shade only the stretch that a local model cannot reach. */
      var over = [];
      for (k = 0; k < pts.length; k++) {
        if (Math.abs(Sat(upto * k / 220)) >= lhv) over.push(pts[k]);
      }
      if (over.length > 1) {
        band.setAttribute('d', S.polyD(over) +
          'L' + over[over.length - 1][0].toFixed(2) + ' ' + PYs(lhv).toFixed(2) +
          'L' + over[0][0].toFixed(2) + ' ' + PYs(lhv).toFixed(2) + 'Z');
      } else {
        band.setAttribute('d', '');
      }

      mark.setAttribute('cx', PXt(th));
      mark.setAttribute('cy', PYs(Math.min(SMAX, Math.abs(Sat(th)))));
      best.setAttribute('x1', PXt(qAt)); best.setAttribute('x2', PXt(qAt));

      S.op(gApp, M.beat(p, 0.02, 0.14));
      S.op(dL.g, M.beat(p, 0.08, 0.2));
      S.op(dR.g, M.beat(p, 0.08, 0.2));
      S.op(marg, M.beat(p, 0.16, 0.26));
      eRows.forEach(function (t, j) { S.op(t, M.beat(p, 0.2 + j * 0.02, 0.3 + j * 0.02)); });
      S.op(sRow, M.beat(p, 0.28, 0.38));
      S.op(curve, M.beat(p, 0.24, 0.32));
      S.op(mark, M.beat(p, 0.24, 0.32));
      S.op(lineL, M.beat(p, 0.3, 0.4));
      S.op(labLhv, M.beat(p, 0.32, 0.42));
      S.op(band, M.beat(p, 0.42, 0.54));
      S.op(lineQ, M.beat(p, 0.62, 0.72));
      S.op(labQ, M.beat(p, 0.62, 0.72));
      S.op(best, M.beat(p, 0.62, 0.72));
      S.op(lineA, M.beat(p, 0.7, 0.8));
      S.op(labA, M.beat(p, 0.7, 0.8));
      tail.forEach(function (t, j) { S.op(t, M.beat(p, 0.76 + j * 0.05, 0.86 + j * 0.05)); });
    };
  });
})(window.A = window.A || {});
