/* Section 1.9: conservation of probability, the probability current, and the
   continuity equation. Every current drawn on this page is computed from a
   wavefunction; no arrow is placed by hand. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------------------------------
     A free Gaussian wave packet, assembled as an explicit superposition of
     plane waves. In units where hbar = m = 1 each mode carries
     exp(i(kx - k^2 t / 2)), so psi, its x-derivative, P = |psi|^2 and
     J = Im(psi* dpsi/dx) are all exact up to the quadrature. Three scenes
     below share it, which is why it lives out here.
     --------------------------------------------------------------------- */

  var PK = (function () {
    var K0 = 3.0, DK = 0.75, NK = 40;
    var kLo = K0 - 4 * DK, kHi = K0 + 4 * DK;
    var ks = [], amp = [], i, k;
    for (i = 0; i <= NK; i++) {
      k = kLo + (kHi - kLo) * i / NK;
      ks.push(k);
      amp.push(Math.exp(-Math.pow((k - K0) / DK, 2) / 2));
    }

    function raw(x, t) {
      var re = 0, im = 0, dre = 0, dim = 0, j, kk, a, ph, c, s;
      for (j = 0; j <= NK; j++) {
        kk = ks[j]; a = amp[j];
        ph = kk * x - 0.5 * kk * kk * t;
        c = Math.cos(ph); s = Math.sin(ph);
        re += a * c; im += a * s;
        dre += -a * kk * s; dim += a * kk * c;
      }
      return [re, im, dre, dim];
    }

    /* One trapezoid pass fixes the overall scale, so every P printed later is
       a genuine probability density and not an arbitrary height. */
    var xL = -6, xR = 14, N = 1600, dx = (xR - xL) / N, tot = 0, w, q;
    for (i = 0; i <= N; i++) {
      w = (i === 0 || i === N) ? 0.5 : 1;
      q = raw(xL + i * dx, 0);
      tot += w * (q[0] * q[0] + q[1] * q[1]) * dx;
    }
    var SC = 1 / tot;
    var eps = 1e-3;

    function P(x, t) { var u = raw(x, t); return (u[0] * u[0] + u[1] * u[1]) * SC; }
    function J(x, t) { var u = raw(x, t); return (u[0] * u[3] - u[1] * u[2]) * SC; }

    return {
      k0: K0,
      P: P,
      J: J,
      dPdt: function (x, t) { return (P(x, t + eps) - P(x, t - eps)) / (2 * eps); },
      dJdx: function (x, t) { return (J(x + eps, t) - J(x - eps, t)) / (2 * eps); },
      total: function (t, x0, x1, n) {
        var s = 0, i2, ww, h = (x1 - x0) / n;
        for (i2 = 0; i2 <= n; i2++) {
          ww = (i2 === 0 || i2 === n) ? 0.5 : 1;
          s += ww * P(x0 + i2 * h, t) * h;
        }
        return s;
      }
    };
  })();

  /* Small formatting helper: 1.234e-6 printed as 1.23 × 10⁻⁶. */
  var SUPS = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
  };
  function sci(v, digits) {
    if (!isFinite(v)) return '∞';
    if (v === 0) return '0';
    var parts = v.toExponential(digits == null ? 2 : digits).split('e');
    var exp = parts[1].replace('+', ''), out = '', i;
    for (i = 0; i < exp.length; i++) out += SUPS[exp.charAt(i)] || exp.charAt(i);
    return parts[0].replace('-', '−') + ' × 10' + out;
  }

  function neg(v, digits) {
    return v.toFixed(digits).replace('-', '−');
  }

  /* Signed real part plus signed imaginary part, so a negative imaginary part
     does not print as "+ −0.053". */
  function cplx(re, im, digits) {
    var d = digits == null ? 6 : digits;
    return re.toFixed(d).replace('-', '−') + (im < 0 ? ' − ' : ' + ') +
      Math.abs(im).toFixed(d) + ' i';
  }

  /* --------------------------------------------- 1. the conjugate equation --- */

  A.scene('conjugate-pair', function (root) {
    var W = 1100, H = 680;
    var svg = S.root(W, H,
      'The Schrodinger equation beside its complex conjugate, term by term. Complex ' +
      'conjugation changes the sign of the i on the left and nothing else, and the ' +
      'potential term survives untouched only because the potential is real.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var head = S.text(W / 2, 44,
      'conjugating the Schrödinger equation flips exactly one sign', 's-lbl-b', 'middle');
    head.setAttribute('font-size', '15');
    svg.appendChild(head);

    var gHead = S.g({});
    svg.appendChild(gHead);
    gHead.appendChild(S.text(60, 94, '(1.9.1)  term by term', 's-lbl-q', 'start'));
    gHead.appendChild(S.text(380, 94, 'after conjugation', 's-lbl-q', 'start'));
    gHead.appendChild(S.text(700, 94, 'why', 's-lbl-q', 'start'));
    gHead.appendChild(S.line(60, 106, 1040, 106, 's-axis'));

    var ROWS = [
      { a: 'i ℏ ∂ψ/∂t', b: '− i ℏ ∂ψ*/∂t', flip: true,
        tag: 'sign flipped',
        why: 'i* = −i, and ℏ is real, and ∂/∂t commutes with *' },
      { a: '− (ℏ²/2m) ∇²ψ', b: '− (ℏ²/2m) ∇²ψ*', flip: false,
        tag: 'unchanged',
        why: 'ℏ, m real; ∇² has real coefficients throughout' },
      { a: '+ V(r,t) ψ', b: '+ V(r,t) ψ*', flip: false,
        tag: 'unchanged',
        why: 'V* = V — this is where reality of V first enters' }
    ];

    var rows = ROWS.map(function (r, i) {
      var y = 148 + i * 58;
      var g = S.g({});
      svg.appendChild(g);
      if (r.flip) {
        var hl = S.rect(370, y - 22, 210, 30, null);
        hl.setAttribute('fill', 'var(--fail)');
        hl.setAttribute('fill-opacity', '0.14');
        g.appendChild(hl);
      }
      var ta = S.text(60, y, r.a, 's-lbl-b', 'start');
      ta.setAttribute('font-size', '14');
      g.appendChild(ta);
      var tb = S.text(380, y, r.b, r.flip ? 's-lbl-f' : 's-lbl-w', 'start');
      tb.setAttribute('font-size', '14');
      g.appendChild(tb);
      g.appendChild(S.text(380, y + 20, r.tag, r.flip ? 's-lbl-f' : 's-lbl', 'start'));
      g.appendChild(S.text(700, y, r.why, 's-lbl', 'start'));
      g.appendChild(S.arrow(svg, 255, y - 5, 350, y - 5, 'm'));
      return g;
    });

    svg.appendChild(S.line(60, 320, 570, 320, 's-axis'));

    var gAsm = S.g({});
    svg.appendChild(gAsm);
    var e2 = S.text(60, 356, '(1.9.2)   − i ℏ ∂ψ*/∂t = − (ℏ²/2m) ∇²ψ* + V ψ*', 's-lbl-b', 'start');
    e2.setAttribute('font-size', '14');
    gAsm.appendChild(e2);

    var gMul = S.g({});
    svg.appendChild(gMul);
    gMul.appendChild(S.text(60, 390,
      'multiply every term by −1 so the left side matches (1.9.1):', 's-lbl', 'start'));

    var gPrime = S.g({});
    svg.appendChild(gPrime);
    var hlP = S.rect(50, 406, 530, 32, null);
    hlP.setAttribute('fill', 'var(--quantum)');
    hlP.setAttribute('fill-opacity', '0.12');
    gPrime.appendChild(hlP);
    var e2p = S.text(60, 428, '(1.9.2′)    i ℏ ∂ψ*/∂t = + (ℏ²/2m) ∇²ψ* − V ψ*', 's-lbl-q', 'start');
    e2p.setAttribute('font-size', '14');
    gPrime.appendChild(e2p);
    gPrime.appendChild(S.text(60, 456,
      'both right-hand signs flip here, and this is the form the next step needs',
      's-lbl', 'start'));
    gPrime.appendChild(S.text(60, 478,
      'using (1.9.2) instead makes the Laplacian terms add — no divergence',
      's-lbl-f', 'start'));

    /* If V were complex the potential terms would not cancel. How fast would
       probability leak? Half-life of the norm at a stated imaginary part. */
    var gBad = S.g({});
    svg.appendChild(gBad);
    var box = S.rect(600, 322, 450, 250, 's-ghost');
    box.setAttribute('fill', 'var(--surface)');
    box.setAttribute('rx', '3');
    gBad.appendChild(box);
    var bt = S.text(622, 352, 'and if V were not real?', 's-lbl-f', 'start');
    bt.setAttribute('font-size', '13');
    gBad.appendChild(bt);
    gBad.appendChild(S.text(622, 382, 'V = V_R + i V_I  gives  (Vψ)* = (V_R − i V_I) ψ*', 's-lbl', 'start'));
    gBad.appendChild(S.text(622, 406, 'the two potential terms then fail to cancel:', 's-lbl', 'start'));
    var bad = S.text(622, 436, '∂P/∂t + ∇·J = (2/ℏ) Im(V) P', 's-lbl-f', 'start');
    bad.setAttribute('font-size', '13');
    gBad.appendChild(bad);
    gBad.appendChild(S.text(622, 466, 'probability is then created or absorbed. For', 's-lbl', 'start'));
    gBad.appendChild(S.text(622, 488, 'an absorptive Im V = −0.050 eV the norm halves', 's-lbl', 'start'));
    var half = S.text(622, 516, '', 's-lbl-f', 'start');
    half.setAttribute('font-size', '13');
    gBad.appendChild(half);
    gBad.appendChild(S.text(622, 546, 'which is exactly how optical potentials work', 's-lbl', 'start'));

    /* Half-life of the norm, evaluated from SI constants on the page. */
    var ImV = 0.050 * M.C.e;
    var tHalf = M.C.hbar * Math.LN2 / (2 * ImV);
    half.textContent = 'every  t½ = ℏ ln2 / (2|Im V|) = ' + (tHalf * 1e15).toFixed(2) + ' fs';

    var note = S.text(W / 2, 640,
      'reality of V is used once here, and once again — decisively — a few lines later',
      's-lbl-b', 'middle');
    note.setAttribute('font-size', '12');
    svg.appendChild(note);

    return function (p) {
      S.op(head, M.beat(p, 0.0, 0.08));
      S.op(gHead, M.beat(p, 0.04, 0.12));
      rows.forEach(function (g, i) { S.op(g, M.beat(p, 0.10 + i * 0.10, 0.24 + i * 0.10)); });
      S.op(gAsm, M.beat(p, 0.42, 0.52));
      S.op(gMul, M.beat(p, 0.52, 0.60));
      S.op(gPrime, M.beat(p, 0.58, 0.70));
      S.op(gBad, M.beat(p, 0.74, 0.88));
      S.op(note, M.beat(p, 0.88, 0.98));
    };
  });

  /* ------------------------------------------------- 2. the chain of 1.9.3 --- */

  A.scene('current-algebra', function (root) {
    var W = 1060, H = 700;
    var svg = S.root(W, H,
      'The derivation of equation 1.9.3 line by line: the product rule, the substitution of ' +
      'the Schrodinger equation and its conjugate, the cancellation of the two potential ' +
      'terms, and the division by i h-bar that fixes the sign of the current.');
    root.appendChild(svg);

    var CHAIN = [
      ['P ≡ |ψ|² = ψ* ψ', 'the density the handout never defines'],
      ['i ℏ ∂P/∂t = i ℏ ∂/∂t ( ψ* ψ )', ''],
      ['= i ℏ [ (∂ψ*/∂t) ψ + ψ* (∂ψ/∂t) ]', 'product rule — a line the handout skips'],
      ['= ψ* ( i ℏ ∂ψ/∂t ) + ψ ( i ℏ ∂ψ*/∂t )', 'regroup; i ℏ is a constant'],
      ['= ψ* ( −(ℏ²/2m)∇²ψ + Vψ ) + ψ ( +(ℏ²/2m)∇²ψ* − Vψ* )', 'substitute (1.9.1) and (1.9.2′)']
    ];
    var chain = CHAIN.map(function (c, i) {
      var g = S.g({});
      svg.appendChild(g);
      var y = 62 + i * 34;
      var t = S.text(60, y, c[0], i === 0 ? 's-lbl-p' : 's-lbl-b', 'start');
      t.setAttribute('font-size', '12');
      g.appendChild(t);
      if (c[1]) g.appendChild(S.text(640, y, c[1], 's-lbl', 'start'));
      return g;
    });

    /* The four terms of the expansion, so the two that cancel can be struck. */
    var TERMS = [
      { s: '− (ℏ²/2m) ψ*∇²ψ', k: 'kinetic', keep: true },
      { s: '+ V ψ*ψ', k: 'potential', keep: false },
      { s: '+ (ℏ²/2m) ψ∇²ψ*', k: 'kinetic', keep: true },
      { s: '− V ψψ*', k: 'potential', keep: false }
    ];
    var boxes = TERMS.map(function (tm, i) {
      var g = S.g({});
      svg.appendChild(g);
      var x = 40 + i * 252, w = 240, y = 238, h = 54;
      var r = S.rect(x, y, w, h, 's-ghost');
      r.setAttribute('fill', 'var(--surface)');
      r.setAttribute('rx', '2');
      r.setAttribute('stroke', tm.keep ? 'var(--wave)' : 'var(--quantum)');
      g.appendChild(r);
      var t = S.text(x + w / 2, y + 26, tm.s, tm.keep ? 's-lbl-w' : 's-lbl-q', 'middle');
      t.setAttribute('font-size', '13');
      g.appendChild(t);
      g.appendChild(S.text(x + w / 2, y + 44, tm.k, 's-lbl', 'middle'));
      var strike = null;
      if (!tm.keep) {
        strike = S.path('M' + (x + 12) + ' ' + (y + 27) + 'L' + (x + w - 12) + ' ' + (y + 27), 's-fail');
        strike.setAttribute('stroke-width', '2');
        g.appendChild(strike);
      }
      return { g: g, strike: strike };
    });

    var gCancel = S.g({});
    svg.appendChild(gCancel);
    var cl = S.text(60, 336, 'V ψ*ψ − V ψψ* = V|ψ|² − V|ψ|² = 0', 's-lbl-f', 'start');
    cl.setAttribute('font-size', '13');
    gCancel.appendChild(cl);
    gCancel.appendChild(S.text(400, 336,
      'ordinary complex numbers commute, and the same real V multiplies both', 's-lbl', 'start'));

    var gKin = S.g({});
    svg.appendChild(gKin);
    var kt = S.text(60, 382, '= − (ℏ²/2m) ( ψ*∇²ψ − ψ∇²ψ* )', 's-lbl-w', 'start');
    kt.setAttribute('font-size', '13');
    gKin.appendChild(kt);
    gKin.appendChild(S.text(400, 382, 'only the kinetic terms are left', 's-lbl', 'start'));

    var gDiv = S.g({});
    svg.appendChild(gDiv);
    var dt = S.text(60, 422, '= − (ℏ²/2m) ∇·( ψ*∇ψ − ψ∇ψ* )        (1.9.3)', 's-lbl-b', 'start');
    dt.setAttribute('font-size', '13');
    gDiv.appendChild(dt);
    gDiv.appendChild(S.text(520, 422, 'by the identity proved in the next figure', 's-lbl', 'start'));

    svg.appendChild(S.line(60, 452, 1000, 452, 's-axis'));

    var gPre = S.g({});
    svg.appendChild(gPre);
    gPre.appendChild(S.text(60, 486,
      'divide by i ℏ. The whole sign of the current turns on 1/i = −i, not +i:', 's-lbl', 'start'));
    var pre = S.text(60, 518, '(1/iℏ)·(−ℏ²/2m) = −(ℏ/2m)·(1/i) = + i ℏ/2m', 's-lbl-q', 'start');
    pre.setAttribute('font-size', '13');
    gPre.appendChild(pre);
    var preNum = S.text(500, 518, '', 's-lbl-w', 'start');
    gPre.appendChild(preNum);

    /* Do the complex division rather than assert it: (-1/2) / i with h = m = 1. */
    function cdiv(ar, ai, br, bi) {
      var d = br * br + bi * bi;
      return [(ar * br + ai * bi) / d, (ai * br - ar * bi) / d];
    }
    var chk = cdiv(-0.5, 0, 0, 1);
    preNum.textContent = 'evaluated with ℏ = m = 1:  ' + chk[0].toFixed(3) + ' + ' +
      chk[1].toFixed(3) + ' i  =  i/2';

    var gRes = S.g({});
    svg.appendChild(gRes);
    var r1 = S.text(60, 562, '∂P/∂t = ∇·[ (iℏ/2m)( ψ*∇ψ − ψ∇ψ* ) ] = − ∇·J', 's-lbl-b', 'start');
    r1.setAttribute('font-size', '14');
    gRes.appendChild(r1);
    gRes.appendChild(S.text(560, 562, '(1.9.4)', 's-lbl', 'start'));

    var gJ = S.g({});
    svg.appendChild(gJ);
    var r2 = S.text(60, 600, 'J = − (iℏ/2m)( ψ*∇ψ − ψ∇ψ* ) = (ℏ/2mi)( ψ*∇ψ − ψ∇ψ* )', 's-lbl-p', 'start');
    r2.setAttribute('font-size', '14');
    gJ.appendChild(r2);
    gJ.appendChild(S.text(660, 600, '(1.9.5)', 's-lbl', 'start'));
    gJ.appendChild(S.text(60, 626,
      'the leading minus is not a slip: −i/2 = 1/(2i) exactly, so this is the textbook J',
      's-lbl', 'start'));

    var gCont = S.g({});
    svg.appendChild(gCont);
    var cont = S.text(60, 666, '∂P/∂t + ∇·J = 0        (1.9.6)', 's-lbl-b', 'start');
    cont.setAttribute('font-size', '14');
    gCont.appendChild(cont);
    gCont.appendChild(S.text(400, 666,
      'the continuity equation, and it holds at every single point', 's-lbl', 'start'));

    return function (p) {
      chain.forEach(function (g, i) { S.op(g, M.beat(p, 0.02 + i * 0.055, 0.10 + i * 0.055)); });
      boxes.forEach(function (b, i) {
        S.op(b.g, M.beat(p, 0.30 + i * 0.035, 0.40 + i * 0.035));
        if (b.strike) S.draw(b.strike, M.easeOut(M.beat(p, 0.44, 0.54)));
      });
      S.op(gCancel, M.beat(p, 0.48, 0.58));
      S.op(gKin, M.beat(p, 0.56, 0.65));
      S.op(gDiv, M.beat(p, 0.62, 0.71));
      S.op(gPre, M.beat(p, 0.70, 0.80));
      S.op(gRes, M.beat(p, 0.78, 0.86));
      S.op(gJ, M.beat(p, 0.84, 0.92));
      S.op(gCont, M.beat(p, 0.92, 0.99));
    };
  });

  /* ------------------------------------------------ 3. the divergence trick --- */

  A.scene('divergence-trick', function (root) {
    var W = 1080, H = 660;
    var svg = S.root(W, H,
      'Proof that psi-star times the Laplacian of psi minus psi times the Laplacian of ' +
      'psi-star is the divergence of psi-star grad psi minus psi grad psi-star. The two ' +
      'gradient-dot-gradient terms are the same number and cancel on subtraction.');
    root.appendChild(svg);

    var head = S.text(W / 2, 46, 'the step that makes a divergence appear', 's-lbl-b', 'middle');
    head.setAttribute('font-size', '14');
    svg.appendChild(head);

    var gA = S.g({});
    svg.appendChild(gA);
    var la = S.text(60, 104, '∇·( ψ* ∇ψ )  =  ∇ψ*·∇ψ  +  ψ* ∇²ψ', 's-lbl-b', 'start');
    la.setAttribute('font-size', '13');
    gA.appendChild(la);
    gA.appendChild(S.text(520, 104,
      'product rule for ∇·(scalar × vector), valid for complex scalars', 's-lbl', 'start'));

    var gB = S.g({});
    svg.appendChild(gB);
    var lb = S.text(60, 150, '∇·( ψ ∇ψ* )  =  ∇ψ·∇ψ*  +  ψ ∇²ψ*', 's-lbl-b', 'start');
    lb.setAttribute('font-size', '13');
    gB.appendChild(lb);
    gB.appendChild(S.text(520, 150, 'the same identity with ψ and ψ* swapped', 's-lbl', 'start'));

    var gSub = S.g({});
    svg.appendChild(gSub);
    gSub.appendChild(S.text(60, 198, 'subtract the second line from the first:', 's-lbl', 'start'));

    var crossBoxes = [
      { x: 120, s: '∇ψ*·∇ψ' },
      { x: 400, s: '∇ψ·∇ψ*' }
    ].map(function (c) {
      var g = S.g({});
      svg.appendChild(g);
      var r = S.rect(c.x, 220, 210, 46, 's-ghost');
      r.setAttribute('fill', 'var(--surface)');
      r.setAttribute('stroke', 'var(--quantum)');
      r.setAttribute('rx', '2');
      g.appendChild(r);
      var t = S.text(c.x + 105, 250, c.s, 's-lbl-q', 'middle');
      t.setAttribute('font-size', '14');
      g.appendChild(t);
      var st = S.path('M' + (c.x + 12) + ' ' + 243 + 'L' + (c.x + 198) + ' ' + 243, 's-fail');
      st.setAttribute('stroke-width', '2');
      g.appendChild(st);
      return { g: g, strike: st };
    });
    var minus = S.text(365, 250, '−', 's-lbl-b', 'middle');
    minus.setAttribute('font-size', '16');
    svg.appendChild(minus);
    var zero = S.text(650, 250, '=  0', 's-lbl-f', 'middle');
    zero.setAttribute('font-size', '16');
    svg.appendChild(zero);

    var gDot = S.g({});
    svg.appendChild(gDot);
    gDot.appendChild(S.text(60, 300,
      'the dot here is the symmetric Σᵢ aᵢbᵢ, with no conjugation inserted, so these two are ' +
      'the same number', 's-lbl', 'start'));

    var gRes = S.g({});
    svg.appendChild(gRes);
    var res = S.text(60, 340, '∇·( ψ*∇ψ − ψ∇ψ* )  =  ψ*∇²ψ − ψ∇²ψ*', 's-lbl-p', 'start');
    res.setAttribute('font-size', '14');
    gRes.appendChild(res);
    gRes.appendChild(S.text(500, 340,
      'true for any twice-differentiable ψ; no physics used', 's-lbl', 'start'));

    svg.appendChild(S.line(60, 372, 1020, 372, 's-axis'));

    /* Numerical verification, by finite differences, on a complex test function.
       Nothing about the Schrodinger equation goes into this. */
    var TP = [0.31, -0.42, 0.57], h = 1e-3;
    function psi(x, y, z) {
      var e = Math.exp(-(x * x + y * y + z * z));
      return [e * (1 + 0.5 * z), e * (0.3 * x - 0.2 * y * y + 0.4 * x * y)];
    }
    var UNIT = [[h, 0, 0], [0, h, 0], [0, 0, h]];
    function grad(x, y, z) {
      var g = [], i, a, b, d;
      for (i = 0; i < 3; i++) {
        d = UNIT[i];
        a = psi(x + d[0], y + d[1], z + d[2]);
        b = psi(x - d[0], y - d[1], z - d[2]);
        g.push([(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]);
      }
      return g;
    }
    function lap(x, y, z) {
      var c = psi(x, y, z), sr = 0, si = 0, i, a, b, d;
      for (i = 0; i < 3; i++) {
        d = UNIT[i];
        a = psi(x + d[0], y + d[1], z + d[2]);
        b = psi(x - d[0], y - d[1], z - d[2]);
        sr += (a[0] + b[0] - 2 * c[0]) / (h * h);
        si += (a[1] + b[1] - 2 * c[1]) / (h * h);
      }
      return [sr, si];
    }

    function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
    function cconj(a) { return [a[0], -a[1]]; }
    function csub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

    /* psi* (Laplacian psi) - psi (Laplacian psi*), as an honest subtraction of
       two complex products, so the vanishing real part is arithmetic and not
       an assertion. */
    function lhsAt(x, y, z) {
      var q = psi(x, y, z), L = lap(x, y, z);
      return csub(cmul(cconj(q), L), cmul(q, cconj(L)));
    }
    /* F_i = psi* d_i psi - psi d_i psi*, then take its divergence. */
    function Fcomp(i, x, y, z) {
      var g = grad(x, y, z)[i], q = psi(x, y, z);
      return csub(cmul(cconj(q), g), cmul(q, cconj(g)));
    }
    function rhsAt(x, y, z) {
      var sr = 0, si = 0, i, a, b, d;
      for (i = 0; i < 3; i++) {
        d = UNIT[i];
        a = Fcomp(i, x + d[0], y + d[1], z + d[2]);
        b = Fcomp(i, x - d[0], y - d[1], z - d[2]);
        sr += (a[0] - b[0]) / (2 * h);
        si += (a[1] - b[1]) / (2 * h);
      }
      return [sr, si];
    }
    var LHS = lhsAt(TP[0], TP[1], TP[2]);
    var RHS = rhsAt(TP[0], TP[1], TP[2]);
    var gp = grad(TP[0], TP[1], TP[2]);
    var cross = 0, i2;
    for (i2 = 0; i2 < 3; i2++) cross += gp[i2][0] * gp[i2][0] + gp[i2][1] * gp[i2][1];

    var gNum = S.g({});
    svg.appendChild(gNum);
    var nh = S.text(60, 404, 'checked numerically, by finite differences', 's-lbl-q', 'start');
    nh.setAttribute('font-size', '12');
    gNum.appendChild(nh);
    gNum.appendChild(S.text(60, 430,
      'ψ = e^(−r²) ( 1 + 0.3ix − 0.2iy² + 0.5z + 0.4ixy )', 's-lbl', 'start'));
    gNum.appendChild(S.text(60, 454, 'at  r = ( 0.31, −0.42, 0.57 )', 's-lbl', 'start'));
    var nA = S.text(60, 490, '', 's-lbl-b', 'start');
    nA.setAttribute('font-size', '12');
    gNum.appendChild(nA);
    var nB = S.text(60, 516, '', 's-lbl-b', 'start');
    nB.setAttribute('font-size', '12');
    gNum.appendChild(nB);
    var nC = S.text(60, 542, '', 's-lbl', 'start');
    gNum.appendChild(nC);

    nA.textContent = 'ψ*∇²ψ − ψ∇²ψ*      = ' + cplx(LHS[0], LHS[1]);
    nB.textContent = '∇·( ψ*∇ψ − ψ∇ψ* )  = ' + cplx(RHS[0], RHS[1]);
    nC.textContent = 'difference = ' + sci(Math.abs(LHS[1] - RHS[1]), 1) +
      ', the truncation error of the differencing';

    var gSide = S.g({});
    svg.appendChild(gSide);
    var sh = S.text(580, 404, 'the cross terms at that point', 's-lbl-q', 'start');
    sh.setAttribute('font-size', '12');
    gSide.appendChild(sh);
    var s1 = S.text(580, 434, '', 's-lbl', 'start');
    var s2 = S.text(580, 458, '', 's-lbl', 'start');
    var s3 = S.text(580, 482, '', 's-lbl-f', 'start');
    gSide.appendChild(s1); gSide.appendChild(s2); gSide.appendChild(s3);
    s1.textContent = '∇ψ*·∇ψ    =  ' + cross.toFixed(6);
    s2.textContent = '∇ψ·∇ψ*    =  ' + cross.toFixed(6);
    s3.textContent = 'difference =  ' + (cross - cross).toFixed(1);

    gSide.appendChild(S.text(580, 522, 'and in one dimension', 's-lbl-q', 'start'));
    gSide.appendChild(S.text(580, 550, 'd/dx( ψ*ψ′ − ψψ*′ ) = ψ*ψ″ − ψψ*″', 's-lbl', 'start'));
    gSide.appendChild(S.text(580, 574, 'ψ*ψ′ − ψψ*′ is the Wronskian of ψ* and ψ', 's-lbl', 'start'));

    var note = S.text(W / 2, 630,
      'this is the whole reason a current exists: an algebraic expression became a divergence',
      's-lbl-b', 'middle');
    note.setAttribute('font-size', '12');
    svg.appendChild(note);

    return function (p) {
      S.op(head, M.beat(p, 0.0, 0.08));
      S.op(gA, M.beat(p, 0.06, 0.18));
      S.op(gB, M.beat(p, 0.16, 0.28));
      S.op(gSub, M.beat(p, 0.26, 0.34));
      crossBoxes.forEach(function (c, i) {
        S.op(c.g, M.beat(p, 0.30 + i * 0.05, 0.42 + i * 0.05));
        S.draw(c.strike, M.easeOut(M.beat(p, 0.46, 0.56)));
      });
      S.op(minus, M.beat(p, 0.34, 0.44));
      S.op(zero, M.beat(p, 0.50, 0.60));
      S.op(gDot, M.beat(p, 0.54, 0.64));
      S.op(gRes, M.beat(p, 0.62, 0.72));
      S.op(gNum, M.beat(p, 0.72, 0.84));
      S.op(gSide, M.beat(p, 0.80, 0.90));
      S.op(note, M.beat(p, 0.90, 0.98));
    };
  });

  /* ---------------------------------------------- 4. continuity as a picture --- */

  A.scene('continuity-flow', function (root) {
    var W = 1080, H = 720;
    var svg = S.root(W, H,
      'A free wave packet evolving in time. The probability density is shaded red where it ' +
      'is falling and cyan where it is rising; the probability current is drawn underneath ' +
      'as arrows; and the two curves at the bottom, the rate of change of the density and ' +
      'minus the divergence of the current, lie on top of each other.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var x0 = 90, x1 = 1000, yT = 88, yB = 288;
    var xL = -3.5, xR = 9.5;
    var PMAX = 0.46;
    var PX = function (x) { return M.map(x, xL, xR, x0, x1); };
    var PY = function (v) { return M.map(v, 0, PMAX, yB, yT); };

    svg.appendChild(S.axes(x0, yT, x1, yB, 'x   (units where ℏ = m = 1)', null));
    svg.appendChild(S.text(90, 64,
      'P(x,t) = |ψ(x,t)|², from an exact superposition of plane waves', 's-lbl-p', 'start'));

    /* Sign-of-dP/dt shading, one thin bar per sample of the curve. */
    var NS = 160;
    var NB = NS, bars = [], ib;
    var gBars = S.g({});
    svg.appendChild(gBars);
    var bw = (x1 - x0) / NB;
    for (ib = 0; ib < NB; ib++) {
      var rb = S.rect(x0 + ib * bw, yB, bw + 0.8, 0, null);
      rb.setAttribute('fill', 'var(--fail)');
      rb.setAttribute('fill-opacity', '0');
      gBars.appendChild(rb);
      bars.push(rb);
    }

    var ghost = S.path('', 's-ghost');
    svg.appendChild(ghost);
    var curve = S.path('', 's-prob');
    svg.appendChild(curve);

    /* The current, as arrows on their own baseline. */
    var yJ = 348;
    var gArr = S.g({});
    svg.appendChild(gArr);
    gArr.appendChild(S.line(x0, yJ, x1, yJ, 's-axis s-dash'));
    var NA = 26, arrows = [], ia;
    for (ia = 0; ia < NA; ia++) {
      var ar = S.arrow(svg, 0, yJ, 10, yJ, 'w');
      gArr.appendChild(ar);
      arrows.push(ar);
    }
    svg.appendChild(S.text(90, 320,
      'J(x,t) = (ℏ/m) Im( ψ* ∂ψ/∂x ) — arrow length is |J|, arrow head is its sign',
      's-lbl-w', 'start'));

    /* The two sides of the continuity equation, drawn on one axis. */
    var yT2 = 424, yB2 = 560, yM2 = (yT2 + yB2) / 2, DMAX = 0.95;
    var DY = function (v) { return M.map(v, -DMAX, DMAX, yB2, yT2); };
    var gLow = S.g({});
    svg.appendChild(gLow);
    gLow.appendChild(S.line(x0, yM2, x1, yM2, 's-axis'));
    gLow.appendChild(S.text(90, 400,
      '∂P/∂t  (violet)   and   −∂J/∂x  (amber, dashed)   —   the same curve, which is (1.9.6)',
      's-lbl-b', 'start'));
    var dP = S.path('', 's-prob');
    var dJ = S.path('', 's-quantum');
    dJ.setAttribute('stroke-dasharray', '7 5');
    gLow.appendChild(dP); gLow.appendChild(dJ);

    var read1 = S.text(90, 604, '', 's-lbl-b', 'start');
    read1.setAttribute('font-size', '12');
    svg.appendChild(read1);
    var read2 = S.text(90, 630, '', 's-lbl-w', 'start');
    svg.appendChild(read2);
    var read3 = S.text(90, 656, '', 's-lbl', 'start');
    svg.appendChild(read3);

    var note = S.text(W / 2, 698,
      'probability drains where the arrows lengthen along x and gathers where they shorten',
      's-lbl-b', 'middle');
    note.setAttribute('font-size', '12');
    svg.appendChild(note);

    /* The t = 0 profile never changes, so it is built once. */
    S.setD(ghost, S.polyD(S.sample(200, xL, xR, function (x) {
      return [PX(x), PY(PK.P(x, 0))];
    })));

    return function (p) {
      var t = M.easeInOut(M.beat(p, 0.08, 0.94)) * 1.5;

      var xs = [], Ps = [], Js = [], Ds = [], Gs = [];
      var i, x, worst = 0, mxJ = 1e-9;
      for (i = 0; i <= NS; i++) {
        x = xL + (xR - xL) * i / NS;
        xs.push(x);
        Ps.push(PK.P(x, t));
        Js.push(PK.J(x, t));
        Ds.push(PK.dPdt(x, t));
        Gs.push(PK.dJdx(x, t));
        if (Math.abs(Js[i]) > mxJ) mxJ = Math.abs(Js[i]);
        if (Math.abs(Ds[i] + Gs[i]) > worst) worst = Math.abs(Ds[i] + Gs[i]);
      }

      var pts = [];
      for (i = 0; i <= NS; i++) pts.push([PX(xs[i]), PY(Ps[i])]);
      S.setD(curve, S.polyD(pts));

      /* Shade under the curve by the sign of dP/dt at that x, reusing the
         samples already taken rather than evaluating psi a second time. */
      for (ib = 0; ib < NB; ib++) {
        var db = Ds[ib], yb = PY(Ps[ib]);
        bars[ib].setAttribute('y', String(yb));
        bars[ib].setAttribute('height', String(Math.max(0, yB - yb)));
        bars[ib].setAttribute('fill', db < 0 ? 'var(--fail)' : 'var(--wave)');
        bars[ib].setAttribute('fill-opacity',
          String(0.06 + 0.34 * M.clamp(Math.abs(db) / 0.85, 0, 1)));
      }

      /* Arrows: half-length proportional to J, head on the downstream end. */
      for (ia = 0; ia < NA; ia++) {
        var xa = xL + (xR - xL) * (ia + 0.5) / NA;
        var ja = PK.J(xa, t);
        var half = (ja / mxJ) * 15;
        var cxa = PX(xa);
        if (Math.abs(half) < 0.8) half = half < 0 ? -0.8 : 0.8;
        arrows[ia].setAttribute('x1', String(cxa - half));
        arrows[ia].setAttribute('x2', String(cxa + half));
        arrows[ia].setAttribute('stroke-opacity',
          String(0.15 + 0.85 * M.clamp(Math.abs(ja) / mxJ, 0, 1)));
      }

      var dPpts = [], dJpts = [];
      for (i = 0; i <= NS; i++) {
        dPpts.push([PX(xs[i]), DY(Ds[i])]);
        dJpts.push([PX(xs[i]), DY(-Gs[i])]);
      }
      S.setD(dP, S.polyD(dPpts));
      S.setD(dJ, S.polyD(dJpts));

      var totalP = PK.total(t, xL - 2.5, xR + 2.5, 420);
      read1.textContent = 'time t = ' + t.toFixed(2) +
        '        ∫ P dx = ' + totalP.toFixed(6) +
        '        peak of P = ' + Math.max.apply(null, Ps).toFixed(4);
      read2.textContent = 'largest |∂P/∂t + ∂J/∂x| found anywhere on the axis:  ' + sci(worst, 1);
      read3.textContent = 'the packet spreads and moves, and the area under it never changes';

      S.op(curve, M.beat(p, 0.02, 0.12));
      S.op(ghost, M.beat(p, 0.10, 0.22) * 0.5);
      S.op(gBars, M.beat(p, 0.20, 0.34));
      S.op(gArr, M.beat(p, 0.32, 0.46));
      S.op(gLow, M.beat(p, 0.46, 0.60));
      S.op(read1, M.beat(p, 0.58, 0.68));
      S.op(read2, M.beat(p, 0.66, 0.76));
      S.op(read3, M.beat(p, 0.74, 0.84));
      S.op(note, M.beat(p, 0.84, 0.95));
    };
  });

  /* --------------------------------------------- 5. the plane wave, worked --- */

  A.scene('plane-wave-current', function (root, api) {
    var W = 1080, H = 700;
    var svg = S.root(W, H,
      'A plane wave travelling to the right. Its probability density is uniform, and its ' +
      'probability current is that density times the particle velocity h-bar k over m. ' +
      'Reversing the sign of k reverses the flow.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var C = M.C;
    var Are = 0.6, Aim = -1.1, A2 = Are * Are + Aim * Aim;

    var title = S.text(60, 48, 'ψ(x,t) = A e^( i(kx − ωt) )   with A complex, k and ω real',
      's-lbl-b', 'start');
    title.setAttribute('font-size', '13');
    svg.appendChild(title);

    var wx0 = 80, wx1 = 760, wcy = 152, wamp = 52;
    svg.appendChild(S.line(wx0, wcy, wx1, wcy, 's-axis'));
    var reW = S.path('', 's-wave');
    var imW = S.path('', 's-wave');
    imW.setAttribute('stroke-dasharray', '6 4');
    imW.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(reW); svg.appendChild(imW);
    svg.appendChild(S.text(wx0, 86, 'Re ψ (solid) and Im ψ (dashed) — never zero together',
      's-lbl-w', 'start'));

    var gP = S.g({});
    svg.appendChild(gP);
    gP.appendChild(S.text(80, 244,
      'P = ψ*ψ = |A|² e^(−i(kx−ωt)) e^(+i(kx−ωt)) = |A|² — flat in x and constant in t',
      's-lbl-p', 'start'));
    var pband = S.rect(wx0, 260, wx1 - wx0, 34, null);
    pband.setAttribute('fill', 'var(--probability)');
    pband.setAttribute('fill-opacity', '0.20');
    gP.appendChild(pband);
    gP.appendChild(S.line(wx0, 260, wx1, 260, 's-prob'));

    /* A drifting speckle band: the "fluid" reading of J = P v. */
    var gFlow = S.g({});
    svg.appendChild(gFlow);
    var dots = [], rnd = M.rng(90917), idot;
    for (idot = 0; idot < 120; idot++) {
      var dd = S.el('circle', {
        cx: 0, cy: 0, r: 2.2, fill: 'var(--probability)', 'fill-opacity': '0.7'
      });
      gFlow.appendChild(dd);
      dots.push({ el: dd, u: rnd(), y: 322 + rnd() * 40 });
    }
    var NJ = 14, jarr = [], ij;
    for (ij = 0; ij < NJ; ij++) {
      var ja = S.arrow(svg, 0, 392, 10, 392, 'w');
      gFlow.appendChild(ja);
      jarr.push(ja);
    }
    gFlow.appendChild(S.text(80, 420,
      'the markers drift at v = ℏk/m; the current is the density they carry past a point',
      's-lbl', 'start'));

    var gAlg = S.g({});
    svg.appendChild(gAlg);
    [
      '∂ψ/∂x = ik ψ          ∂ψ*/∂x = −ik ψ*',
      'ψ* ∂ψ/∂x − ψ ∂ψ*/∂x = ik|A|² − (−ik|A|²) = 2ik |A|²',
      'J = −(iℏ/2m)( 2ik|A|² ) = −(i²ℏk/m)|A|² = + (ℏk/m) |A|²',
      'ℏk/m = p/m = v        so        J = P v'
    ].forEach(function (s, i) {
      var t = S.text(80, 462 + i * 30, s, i === 3 ? 's-lbl-q' : 's-lbl-b', 'start');
      t.setAttribute('font-size', '12');
      gAlg.appendChild(t);
    });

    var gNum = S.g({});
    svg.appendChild(gNum);
    var nums = [];
    for (var iN = 0; iN < 7; iN++) {
      var tn = S.text(620, 462 + iN * 26, '', iN >= 3 && iN <= 5 ? 's-lbl-w' : 's-lbl', 'start');
      gNum.appendChild(tn);
      nums.push(tn);
    }

    var note = S.text(W / 2, 664,
      'density times velocity, exactly as for a fluid or a beam — reverse k and the flow reverses',
      's-lbl-b', 'middle');
    note.setAttribute('font-size', '12');
    svg.appendChild(note);

    /* Reader control: k, in units of 1e10 per metre. */
    var ui = document.createElement('div');
    ui.className = 'control';
    ui.innerHTML =
      '<label for="pw-k">wavenumber k</label>' +
      '<input id="pw-k" type="range" min="-200" max="200" value="100" step="1">' +
      '<output id="pw-out">1.00 × 10¹⁰ m⁻¹</output>';
    root.appendChild(ui);
    var slider = ui.querySelector('#pw-k');
    var out = ui.querySelector('#pw-out');
    var kUser = 1.0, touched = false;
    slider.addEventListener('input', function () {
      kUser = Number(slider.value) / 100;
      touched = true;
      out.textContent = kUser.toFixed(2) + ' × 10¹⁰ m⁻¹';
    });

    function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
    function cconj(a) { return [a[0], -a[1]]; }
    function csub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

    return function (p, tSec) {
      var kU = touched ? kUser : M.lerp(0.35, 1.6, M.easeInOut(M.beat(p, 0.10, 0.70)));
      if (!touched) {
        out.textContent = kU.toFixed(2) + ' × 10¹⁰ m⁻¹';
        slider.value = String(Math.round(kU * 100));
      }
      var k = kU * 1e10;
      var v = C.hbar * k / C.me;
      var lam = k === 0 ? Infinity : M.TAU / Math.abs(k);

      /* The three routes to J, all evaluated here rather than quoted. */
      var xEval = 3.7e-10, omega = C.hbar * k * k / (2 * C.me), tEval = 1.1e-15;
      var ph = k * xEval - omega * tEval;
      var psiV = cmul([Are, Aim], [Math.cos(ph), Math.sin(ph)]);
      var dpsi = cmul([0, k], psiV);
      var brack = csub(cmul(cconj(psiV), dpsi), cmul(psiV, cconj(dpsi)));
      var J1 = cmul([0, -C.hbar / (2 * C.me)], brack);
      var J2 = (C.hbar / C.me) * cmul(cconj(psiV), dpsi)[1];
      var J3 = C.hbar * k * A2 / C.me;

      nums[0].textContent = 'electron, k = ' + kU.toFixed(2) + ' × 10¹⁰ m⁻¹, λ = ' +
        (k === 0 ? '∞' : (lam * 1e9).toFixed(3) + ' nm');
      nums[1].textContent = 'v = ℏk/mₑ = ' + sci(v, 4) + ' m s⁻¹';
      nums[2].textContent = 'A = 0.6 − 1.1i,  |A|² = ' + A2.toFixed(4) + ' m⁻¹';
      nums[3].textContent = 'from (1.9.5):          J = ' + sci(J1[0], 6) + ' s⁻¹';
      nums[4].textContent = 'from (ℏ/m)Im(ψ*ψₓ):    J = ' + sci(J2, 6) + ' s⁻¹';
      nums[5].textContent = 'from ℏk|A|²/m:         J = ' + sci(J3, 6) + ' s⁻¹';
      nums[6].textContent = 'imaginary part of (1.9.5): ' + sci(J1[1], 1) + ' — J is real';

      /* Draw the wave with a fixed number of cycles per unit k so the picture
         stays legible; the physics is in the numbers above. */
      var time = api.reduced ? 0.0 : tSec;
      var cycles = kU * 5.5;
      var sgn = kU >= 0 ? 1 : -1;
      S.setD(reW, S.polyD(S.sample(320, 0, 1, function (u) {
        return [M.lerp(wx0, wx1, u), wcy - Math.cos(M.TAU * cycles * u - time * 1.6 * sgn) * wamp];
      })));
      S.setD(imW, S.polyD(S.sample(320, 0, 1, function (u) {
        return [M.lerp(wx0, wx1, u), wcy - Math.sin(M.TAU * cycles * u - time * 1.6 * sgn) * wamp];
      })));

      var drift = (api.reduced ? 0.25 : time * 0.09) * sgn * Math.min(2.5, Math.abs(kU) + 0.2);
      dots.forEach(function (d) {
        var u = ((d.u + drift) % 1 + 1) % 1;
        d.el.setAttribute('cx', M.lerp(wx0, wx1, u).toFixed(1));
        d.el.setAttribute('cy', d.y.toFixed(1));
      });

      var jhalf = M.clamp(kU / 1.6, -1, 1) * 22;
      if (Math.abs(jhalf) < 0.8) jhalf = jhalf < 0 ? -0.8 : 0.8;
      for (ij = 0; ij < NJ; ij++) {
        var cxj = M.lerp(wx0 + 24, wx1 - 24, ij / (NJ - 1));
        jarr[ij].setAttribute('x1', String(cxj - jhalf));
        jarr[ij].setAttribute('x2', String(cxj + jhalf));
      }

      S.op(reW, M.beat(p, 0.02, 0.12));
      S.op(imW, M.beat(p, 0.08, 0.20));
      S.op(gP, M.beat(p, 0.18, 0.32));
      S.op(gFlow, M.beat(p, 0.30, 0.44));
      S.op(gAlg, M.beat(p, 0.42, 0.60));
      S.op(gNum, M.beat(p, 0.58, 0.76));
      S.op(note, M.beat(p, 0.82, 0.95));
    };
  });

  /* ------------------------------------------ 6. the surface term at infinity --- */

  A.scene('total-probability', function (root) {
    var W = 1120, H = 680;
    var svg = S.root(W, H,
      'A normalised state carrying an outward current, with a sphere of growing radius drawn ' +
      'round it. The probability inside the sphere climbs to one while the flux of current ' +
      'through its surface rises, peaks and then dies away.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* A normalised, spherically symmetric state with a radial phase:
       psi = N exp(-r^2 / 2a^2) exp(i beta r), so |psi|^2 = N^2 exp(-r^2/a^2)
       and J_r = (hbar/m) |psi|^2 beta. Units a = hbar = m = beta = 1. */
    var N2 = 1 / (Math.pow(Math.PI, 1.5));
    function dens(r) { return N2 * Math.exp(-r * r); }
    function Jr(r) { return dens(r); }
    function flux(R) { return 4 * Math.PI * R * R * Jr(R); }
    function enclosed(R) {
      var n = 400, hh = R / n, s = 0, i, r, w;
      for (i = 0; i <= n; i++) {
        r = i * hh;
        w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
        s += w * 4 * Math.PI * r * r * dens(r);
      }
      return s * hh / 3;
    }
    var RMAX = 5, PXR = 34;
    var fluxMax = 0, jMax = Jr(0), ii;
    for (ii = 1; ii <= 500; ii++) fluxMax = Math.max(fluxMax, flux(RMAX * ii / 500));

    svg.appendChild(S.text(60, 62, 'a normalised state carrying an outward current',
      's-lbl-p', 'start'));

    /* The blob: nested translucent discs whose radii are the level sets of
       |psi|^2, so the accumulated alpha at radius r is proportional to the
       density there. Built with S.el rather than S.circle because S.circle
       defaults to a filled colour class, and a CSS class beats a presentation
       attribute. */
    var cx = 280, cy = 288;
    var gBlob = S.g({});
    svg.appendChild(gBlob);
    var NL = 40, il;
    for (il = 1; il < NL; il++) {
      var level = il / NL;                       /* density, as a fraction of the peak */
      var rl = Math.sqrt(-Math.log(level));      /* dens(rl) = level * dens(0) */
      gBlob.appendChild(S.el('circle', {
        cx: cx, cy: cy, r: (rl * PXR).toFixed(2),
        fill: 'var(--probability)', 'fill-opacity': '0.05', stroke: 'none'
      }));
    }

    var gSphere = S.g({});
    svg.appendChild(gSphere);
    var sph = S.el('circle', {
      cx: cx, cy: cy, r: PXR, fill: 'none',
      stroke: 'var(--quantum)', 'stroke-width': '1.4', 'stroke-dasharray': '6 5'
    });
    gSphere.appendChild(sph);
    var NR = 12, rays = [], iray;
    for (iray = 0; iray < NR; iray++) {
      var ra = S.arrow(svg, cx, cy, cx + 10, cy, 'q');
      gSphere.appendChild(ra);
      rays.push(ra);
    }
    var rlbl = S.text(cx, 508, '', 's-lbl-q', 'middle');
    gSphere.appendChild(rlbl);

    /* Two stacked plots on the right: what is inside, and what crosses out. */
    var px0 = 620, px1 = 1040;   /* kept clear of the stage's right-hand panel column */
    var eT = 108, eB = 232, fT = 300, fB = 440;
    var RX = function (R) { return M.map(R, 0, RMAX, px0, px1); };

    svg.appendChild(S.text(620, 62, 'push the boundary out and watch both numbers',
      's-lbl-q', 'start'));

    var gEnc = S.g({});
    svg.appendChild(gEnc);
    gEnc.appendChild(S.axes(px0, eT, px1, eB, 'R', null));
    gEnc.appendChild(S.text(620, 96, 'probability inside the sphere → 1', 's-lbl-p', 'start'));
    var encPath = S.path('', 's-prob');
    gEnc.appendChild(encPath);
    S.setD(encPath, S.polyD(S.sample(160, 0.001, RMAX, function (R) {
      return [RX(R), M.map(enclosed(R), 0, 1.05, eB, eT)];
    })));
    var encMark = S.circle(RX(1), eB, 4.5, 's-fill-i');
    gEnc.appendChild(encMark);

    var gFlx = S.g({});
    svg.appendChild(gFlx);
    gFlx.appendChild(S.axes(px0, fT, px1, fB, 'R', null));
    gFlx.appendChild(S.text(620, 288, 'flux out = 4πR² × J_r(R) → 0', 's-lbl-q', 'start'));
    var areaPath = S.path('', 's-ghost');
    areaPath.setAttribute('stroke-dasharray', '5 4');
    var jPath = S.path('', 's-fail');
    var flxPath = S.path('', 's-quantum');
    gFlx.appendChild(areaPath); gFlx.appendChild(jPath); gFlx.appendChild(flxPath);
    S.setD(areaPath, S.polyD(S.sample(120, 0, RMAX, function (R) {
      return [RX(R), M.map(R * R / (RMAX * RMAX), 0, 1.08, fB, fT)];
    })));
    S.setD(jPath, S.polyD(S.sample(160, 0, RMAX, function (R) {
      return [RX(R), M.map(Jr(R) / jMax, 0, 1.08, fB, fT)];
    })));
    S.setD(flxPath, S.polyD(S.sample(200, 0, RMAX, function (R) {
      return [RX(R), M.map(flux(R) / fluxMax, 0, 1.08, fB, fT)];
    })));
    gFlx.appendChild(S.text(px1, 482, 'area ∝ R² rising · |J_r| falling · product in amber',
      's-lbl', 'end'));
    var flxMark = S.circle(RX(1), fB, 4.5, 's-fill-q');
    gFlx.appendChild(flxMark);

    var reads = [];
    for (var irr = 0; irr < 5; irr++) {
      var tr = S.text(620, 500 + irr * 24, '', irr === 0 ? 's-lbl-b' : 's-lbl', 'start');
      svg.appendChild(tr);
      reads.push(tr);
    }

    var gConc = S.g({});
    svg.appendChild(gConc);
    gConc.appendChild(S.text(60, 552,
      'd/dt ∫_Ω P d³r = − ∮_∂Ω J·da     for any fixed region Ω', 's-lbl-b', 'start'));
    gConc.appendChild(S.text(60, 576,
      'the probability inside changes only through what crosses the boundary', 's-lbl', 'start'));
    var conc = S.text(60, 606, 'as R → ∞ the flux → 0, so   d/dt ∫ P d³r = 0        (1.9.7)',
      's-lbl-q', 'start');
    conc.setAttribute('font-size', '12');
    gConc.appendChild(conc);

    var note = S.text(W / 2, 656,
      'the area grows like R², so ψ → 0 is not enough: what has to die is R²|J|',
      's-lbl-f', 'middle');
    note.setAttribute('font-size', '12');
    svg.appendChild(note);

    return function (p) {
      var R = M.lerp(0.35, RMAX, M.easeInOut(M.beat(p, 0.16, 0.88)));
      sph.setAttribute('r', String(R * PXR));
      var enc = enclosed(R), fl = flux(R), area = 4 * Math.PI * R * R;

      var iA;
      for (iA = 0; iA < NR; iA++) {
        var th = M.TAU * iA / NR;
        var len = 6 + 44 * M.clamp(Jr(R) / jMax, 0, 1);
        var rx = cx + Math.cos(th) * R * PXR, ry = cy + Math.sin(th) * R * PXR;
        rays[iA].setAttribute('x1', rx.toFixed(1));
        rays[iA].setAttribute('y1', ry.toFixed(1));
        rays[iA].setAttribute('x2', (rx + Math.cos(th) * len).toFixed(1));
        rays[iA].setAttribute('y2', (ry + Math.sin(th) * len).toFixed(1));
        rays[iA].setAttribute('stroke-opacity',
          String(0.15 + 0.85 * M.clamp(Jr(R) / jMax, 0, 1)));
      }
      rlbl.textContent = 'sphere of radius R = ' + R.toFixed(2) + ' a';

      encMark.setAttribute('cx', String(RX(R)));
      encMark.setAttribute('cy', String(M.map(enc, 0, 1.05, eB, eT)));
      flxMark.setAttribute('cx', String(RX(R)));
      flxMark.setAttribute('cy', String(M.map(fl / fluxMax, 0, 1.08, fB, fT)));

      reads[0].textContent = 'R = ' + R.toFixed(2) + ' a';
      reads[1].textContent = 'probability inside     = ' + enc.toFixed(6);
      reads[2].textContent = 'surface area 4πR²      = ' + area.toFixed(2) + ' a²';
      reads[3].textContent = 'current |J_r| at R     = ' + sci(Jr(R), 3);
      reads[4].textContent = 'flux = area × |J_r|    = ' + sci(fl, 3);

      S.op(gBlob, M.beat(p, 0.02, 0.14));
      S.op(gSphere, M.beat(p, 0.12, 0.24));
      S.op(gEnc, M.beat(p, 0.24, 0.38));
      S.op(gFlx, M.beat(p, 0.36, 0.50));
      reads.forEach(function (r2, i) { S.op(r2, M.beat(p, 0.48 + i * 0.03, 0.60 + i * 0.03)); });
      S.op(gConc, M.beat(p, 0.72, 0.86));
      S.op(note, M.beat(p, 0.88, 0.98));
    };
  });

  /* ------------------------------------------------------- 7. Question 1.9.1 --- */

  A.scene('question-191', function (root) {
    var W = 1100, H = 700;
    var svg = S.root(W, H,
      'Figure 1.9.1 rebuilt. Two snapshots of the same packet, at t equals zero and at t ' +
      'equals delta t, with the point x equals zero marked. The density there has fallen, ' +
      'so the rate of change of the density is negative and the gradient of the current ' +
      'is positive.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* The packet is shifted so that x = 0 sits on the trailing flank of the
       t = 0 curve, which is what the handout's figure shows. */
    var X0 = 0.7, DT = 0.35;
    function P(X, t) { return PK.P(X - X0, t); }
    function J(X, t) { return PK.J(X - X0, t); }
    var e = 1e-3;
    function dPdt(X, t) { return (P(X, t + e) - P(X, t - e)) / (2 * e); }
    function dJdx(X, t) { return (J(X + e, t) - J(X - e, t)) / (2 * e); }

    var title = S.text(60, 46, 'Figure 1.9.1 rebuilt: the same packet at t = 0 and t = δt',
      's-lbl-b', 'start');
    title.setAttribute('font-size', '12');
    svg.appendChild(title);

    var x0 = 80, x1 = 740, yT = 92, yB = 300;
    var xL = -3, xR = 8, PMAX = 0.46;
    var PX = function (x) { return M.map(x, xL, xR, x0, x1); };
    var PY = function (v) { return M.map(v, 0, PMAX, yB, yT); };
    svg.appendChild(S.axes(x0, yT, x1, yB, 'x', null));
    svg.appendChild(S.text(80, 74, '|ψ(x,0)|² solid        |ψ(x,δt)|² dashed', 's-lbl-p', 'start'));

    var c0 = S.path('', 's-prob');
    var c1 = S.path('', 's-prob');
    c1.setAttribute('stroke-dasharray', '7 5');
    svg.appendChild(c0); svg.appendChild(c1);
    S.setD(c0, S.polyD(S.sample(240, xL, xR, function (x) { return [PX(x), PY(P(x, 0))]; })));
    S.setD(c1, S.polyD(S.sample(240, xL, xR, function (x) { return [PX(x), PY(P(x, DT))]; })));

    var gMark = S.g({});
    svg.appendChild(gMark);
    gMark.appendChild(S.line(PX(0), yT, PX(0), yB + 8, 's-axis s-dash'));
    gMark.appendChild(S.text(PX(0), yB + 26, 'x = 0', 's-lbl-b', 'middle'));
    var d0 = S.circle(PX(0), PY(P(0, 0)), 4.5, 's-fill-i');
    var d1 = S.circle(PX(0), PY(P(0, DT)), 4.5, 's-fill-f');
    gMark.appendChild(d0); gMark.appendChild(d1);
    gMark.appendChild(S.arrow(svg, PX(0) + 16, PY(P(0, 0)), PX(0) + 16, PY(P(0, DT)), 'f'));
    gMark.appendChild(S.text(PX(0) + 26, (PY(P(0, 0)) + PY(P(0, DT))) / 2,
      'the density at x = 0 has fallen', 's-lbl-f', 'start'));

    var gJ = S.g({});
    svg.appendChild(gJ);
    var yT2 = 386, yB2 = 526, JMAX = 1.45;
    var JY = function (v) { return M.map(v, 0, JMAX, yB2, yT2); };
    gJ.appendChild(S.axes(x0, yT2, x1, yB2, 'x', null));
    gJ.appendChild(S.text(80, 368,
      'J(x,0), computed from the same ψ. Its slope at x = 0 is what the question asks about',
      's-lbl-w', 'start'));
    var jc = S.path('', 's-wave');
    gJ.appendChild(jc);
    S.setD(jc, S.polyD(S.sample(240, xL, xR, function (x) { return [PX(x), JY(J(x, 0))]; })));

    var gTan = S.g({});
    svg.appendChild(gTan);
    var slope = dJdx(0, 0);
    var dxTan = 0.55;
    var tanD = 'M' + PX(-dxTan) + ' ' + JY(J(0, 0) - slope * dxTan) +
      'L' + PX(dxTan) + ' ' + JY(J(0, 0) + slope * dxTan);
    var tan = S.path(tanD, 's-quantum');
    tan.setAttribute('stroke-width', '2');
    gTan.appendChild(tan);
    gTan.appendChild(S.circle(PX(0), JY(J(0, 0)), 4.5, 's-fill-q'));
    gTan.appendChild(S.text(80, 560,
      'slope > 0: more current leaves to the right than arrives from the left',
      's-lbl-q', 'start'));

    /* Readouts, all differenced from the computed packet. */
    var gRead = S.g({});
    svg.appendChild(gRead);
    var rh = S.text(770, 100, 'read off the figure', 's-lbl-q', 'start');
    rh.setAttribute('font-size', '12');
    gRead.appendChild(rh);
    var rows = [];
    for (var ir = 0; ir < 4; ir++) {
      var tr = S.text(770, 128 + ir * 24, '', 's-lbl', 'start');
      gRead.appendChild(tr);
      rows.push(tr);
    }

    var gCont = S.g({});
    svg.appendChild(gCont);
    var ch = S.text(770, 244, 'now use continuity', 's-lbl-q', 'start');
    ch.setAttribute('font-size', '12');
    gCont.appendChild(ch);
    var crows = [];
    for (var ic = 0; ic < 3; ic++) {
      var tc = S.text(770, 272 + ic * 24, '', ic === 0 ? 's-lbl-b' : 's-lbl', 'start');
      gCont.appendChild(tc);
      crows.push(tc);
    }

    var gOpt = S.g({});
    svg.appendChild(gOpt);
    var oh = S.text(770, 372, 'the four options', 's-lbl-q', 'start');
    oh.setAttribute('font-size', '12');
    gOpt.appendChild(oh);
    var OPTS = [
      ['(A)  ∂P/∂t > 0', false],
      ['(B)  ∂P/∂t < 0', true],
      ['(C)  ∂J/∂x > 0', true],
      ['(D)  ∂J/∂x < 0', false]
    ];
    var optRows = OPTS.map(function (o, i) {
      var g = S.g({});
      gOpt.appendChild(g);
      var y = 402 + i * 26;
      g.appendChild(S.text(770, y, o[0], o[1] ? 's-lbl-b' : 's-lbl', 'start'));
      g.appendChild(S.text(960, y, o[1] ? 'true' : 'false', o[1] ? 's-lbl-w' : 's-lbl-f', 'start'));
      return g;
    });
    gOpt.appendChild(S.text(770, 522, 'A ⟺ D  and  B ⟺ C, always', 's-lbl-q', 'start'));
    gOpt.appendChild(S.text(770, 546, 'so {A,C} and {B,D} are impossible', 's-lbl', 'start'));

    var gTail = S.g({});
    svg.appendChild(gTail);
    gTail.appendChild(S.text(60, 592,
      'a plot of |ψ|² carries no phase information, so J itself cannot be read off the figure —',
      's-lbl', 'start'));
    gTail.appendChild(S.text(60, 616,
      'only ∂J/∂x, and only by invoking continuity. Replacing ψ by ψ* leaves both curves ' +
      'alone and flips J.', 's-lbl', 'start'));
    var caution = S.text(60, 650, '', 's-lbl-f', 'start');
    gTail.appendChild(caution);
    var caution2 = S.text(60, 674, '', 's-lbl-f', 'start');
    gTail.appendChild(caution2);

    /* Every number below is differenced from the packet, including the one that
       exposes the degenerate case the question does not guard against. */
    var p00 = P(0, 0), pdt = P(0, DT);
    var dpdt = dPdt(0, 0), djdx = dJdx(0, 0);
    var atPeak = dPdt(X0, 0);
    rows[0].textContent = 'P(0, 0)   = ' + p00.toFixed(6);
    rows[1].textContent = 'P(0, δt)  = ' + pdt.toFixed(6);
    rows[2].textContent = '(P(0,δt) − P(0,0))/δt = ' + neg((pdt - p00) / DT, 4);
    rows[3].textContent = '∂P/∂t at (0,0) = ' + neg(dpdt, 4);
    crows[0].textContent = '∂J/∂x = −∂P/∂t = ' + neg(-dpdt, 4);
    crows[1].textContent = 'straight from J:  ' + neg(djdx, 4);
    crows[2].textContent = 'residual = ' + sci(Math.abs(dpdt + djdx), 1);
    caution.textContent = 'one caution: at the peak of the t = 0 curve that derivative comes ' +
      'out ' + neg(atPeak, 1) + ' exactly,';
    caution2.textContent = 'so if x = 0 were drawn there, none of the four would be strictly true.';

    return function (p) {
      S.draw(c0, M.easeOut(M.beat(p, 0.02, 0.18)));
      S.op(c0, M.beat(p, 0.02, 0.10));
      S.draw(c1, M.easeOut(M.beat(p, 0.14, 0.30)));
      S.op(c1, M.beat(p, 0.14, 0.22));
      S.op(gMark, M.beat(p, 0.26, 0.38));
      S.op(gRead, M.beat(p, 0.34, 0.46));
      S.op(gJ, M.beat(p, 0.44, 0.56));
      S.op(gTan, M.beat(p, 0.54, 0.64));
      S.op(gCont, M.beat(p, 0.60, 0.72));
      S.op(gOpt, M.beat(p, 0.70, 0.82));
      optRows.forEach(function (g, i) { S.op(g, M.beat(p, 0.72 + i * 0.03, 0.84 + i * 0.03)); });
      S.op(gTail, M.beat(p, 0.86, 0.97));
    };
  });
})(window.A = window.A || {});
