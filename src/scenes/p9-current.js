/* Section 1.9: conservation of probability and the probability current —
   conjugating the Schrodinger equation, the algebra that turns the result into a
   divergence, the continuity equation as a picture, the plane-wave current, the
   surface term at infinity, and the multiple-choice question that closes the
   section. Everything numerical here is evaluated on the page from the same
   equations the prose derives: the wave packets are exact superpositions of free
   plane waves, and the identities are checked against them, not asserted. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  /* ------------------------------------------------------------ helpers --- */

  /* Signed fixed-point with a real minus sign, so columns line up. */
  function fmt(v, n) {
    var s = Math.abs(v).toFixed(n);
    return (v < 0 ? '−' : '+') + s;
  }
  function ex(v, n) {
    var s = v.toExponential(n);
    return s.replace('e+', ' × 10^').replace('e-', ' × 10^−');
  }

  /* ---- a free wave packet, built as a sum of exact plane-wave solutions ----
     Units hbar = m = 1. Each mode exp(i(k(x - xc) - k^2 t/2)) solves the free
     Schrodinger equation on its own, so any sum of them does too. Nothing below
     draws a curve that merely looks like a spreading packet: P and J are read
     off this sum. */
  function evalPacket(pk, x, t) {
    var pr = 0, pi = 0, qr = 0, qi = 0, n, m, th, c, s;
    for (n = 0; n < pk.modes.length; n++) {
      m = pk.modes[n];
      th = m.k * (x - pk.xc) - 0.5 * m.k * m.k * t;
      c = Math.cos(th); s = Math.sin(th);
      pr += m.a * c;
      pi += m.a * s;
      qr -= m.a * m.k * s;
      qi += m.a * m.k * c;
    }
    return [pr, pi, qr, qi];
  }
  function densityAt(pk, x, t) {
    var v = evalPacket(pk, x, t);
    return v[0] * v[0] + v[1] * v[1];
  }
  /* J = (hbar/m) Im(psi* dpsi/dx), with hbar = m = 1. */
  function currentAt(pk, x, t) {
    var v = evalPacket(pk, x, t);
    return v[0] * v[3] - v[1] * v[2];
  }
  function makePacket(k0, dk, nModes, xc, xa, xb) {
    var modes = [], n, k, w;
    for (n = 0; n < nModes; n++) {
      k = k0 + (n / (nModes - 1) - 0.5) * 8 * dk;
      w = Math.exp(-Math.pow((k - k0) / dk, 2) / 2);
      modes.push({ k: k, a: w });
    }
    var pk = { modes: modes, xc: xc };
    /* Normalise numerically over the window so the printed integral is 1.000
       because it was measured, not because it was declared. */
    var N = 800, sum = 0, i, wgt;
    for (i = 0; i <= N; i++) {
      wgt = (i === 0 || i === N) ? 0.5 : 1;
      sum += wgt * densityAt(pk, xa + (xb - xa) * i / N, 0);
    }
    sum *= (xb - xa) / N;
    var sc = 1 / Math.sqrt(sum);
    for (n = 0; n < modes.length; n++) modes[n].a *= sc;
    return pk;
  }

  /* ================================================================ (1) === */
  /* The Schrodinger equation and its complex conjugate, with every sign that
     flips called out, and the one place reality of V does the work. */

  A.scene('conjugate-pair', function (root) {
    var W = 1120, H = 690;
    var svg = S.root(W, H,
      'The Schrodinger equation above its complex conjugate, with the four signs that ' +
      'change marked, and a panel showing what would survive if the potential were not real.');
    root.appendChild(svg);

    svg.appendChild(S.text(70, 52,
      'conjugating the Schrodinger equation, one term at a time', 's-lbl', 'start'));

    var ROWS = [
      { tag: '(1.9.1)', lhs: 'iℏ ∂ψ/∂t',
        kin: '−(ℏ²/2m) ∇²ψ', sgn: '+', pot: 'V ψ',
        note: 'the equation we start from',
        flip: [null, null, null] },
      { tag: '(1.9.2)', lhs: '−iℏ ∂ψ*/∂t',
        kin: '−(ℏ²/2m) ∇²ψ*', sgn: '+', pot: 'V ψ*',
        note: 'conjugate every term',
        flip: ['flip 1', null, null] },
      { tag: 'or', lhs: 'iℏ ∂ψ*/∂t',
        kin: '+(ℏ²/2m) ∇²ψ*', sgn: '−', pot: 'V ψ*',
        note: 'multiply through by −1',
        flip: ['flip 2', 'flip 3', 'flip 4'] }
    ];

    var XT = 70, XL = 170, XE = 320, XK = 360, XS = 545, XP = 585, XN = 700;
    var rowY = [140, 262, 384];
    var built = [], flipCount = 0;

    ROWS.forEach(function (r, i) {
      var y = rowY[i];
      var g = S.g({});
      svg.appendChild(g);
      var tag = S.text(XT, y, r.tag, 's-lbl', 'start');
      g.appendChild(tag);

      var parts = [];
      var mk = function (x, str, flipped) {
        var t = S.text(x, y, str, flipped ? 's-lbl-q' : 's-lbl-b', 'start');
        t.setAttribute('font-size', '16');
        g.appendChild(t);
        return t;
      };
      parts.push(mk(XL, r.lhs, !!r.flip[0]));
      var eqs = S.text(XE, y, '=', 's-lbl', 'start');
      eqs.setAttribute('font-size', '16');
      g.appendChild(eqs);
      parts.push(mk(XK, r.kin, !!r.flip[1]));
      var sg = S.text(XS, y, r.sgn, r.flip[2] ? 's-lbl-q' : 's-lbl-b', 'start');
      sg.setAttribute('font-size', '16');
      g.appendChild(sg);
      parts.push(mk(XP, r.pot, !!r.flip[2]));

      /* Badges above each sign that actually changed. Counted, not asserted. */
      [XL, XK, XP].forEach(function (x, j) {
        if (!r.flip[j]) return;
        flipCount++;
        var b = S.text(x, y - 26, r.flip[j], 's-lbl-q', 'start');
        b.setAttribute('font-size', '10');
        g.appendChild(b);
      });

      g.appendChild(S.text(XN, y, r.note, 's-lbl', 'start'));
      built.push(g);
    });

    var step1 = S.text(XL, 200,
      'apply * :  (iℏ)* = −iℏ,  (∇²ψ)* = ∇²ψ*,  (Vψ)* = V* ψ*',
      's-lbl-q', 'start');
    step1.setAttribute('font-size', '12');
    svg.appendChild(step1);

    var step2 = S.text(XL, 322,
      '× (−1) on every term, to put it back in “iℏ ∂/∂t” form',
      's-lbl-q', 'start');
    step2.setAttribute('font-size', '12');
    svg.appendChild(step2);

    svg.appendChild(S.line(70, 440, W - 70, 440, 's-axis s-dash'));

    /* The two panels: V real, and V not real. Both numbers below are computed. */
    var psiR = 0.6, psiI = 0.8;
    var P0 = psiR * psiR + psiI * psiI;
    var Vre = 2.5;
    /* V psi* psi - V psi psi* with a real V: identically zero, evaluated. */
    var cancel = Vre * (psiR * psiR + psiI * psiI) - Vre * (psiR * psiR + psiI * psiI);
    var Vim = -0.4;
    /* With a complex V the two terms leave (V - V*)|psi|^2 = 2i Im(V) P,
       so dP/dt + div J = (2/hbar) Im(V) P.  hbar = 1 here. */
    var leak = 2 * Vim * P0;

    var gL = S.g({});
    svg.appendChild(gL);
    gL.appendChild(S.text(70, 476, 'where V being real is used', 's-lbl-w', 'start'));
    [
      'V* = V,  so  (Vψ)* = V ψ*  and no i appears',
      'the conjugated equation carries the same real V',
      'so in the next step  V ψ*ψ − V ψψ* = 0  exactly',
      'checked with ψ = ' + psiR.toFixed(3) + ' + ' + psiI.toFixed(3) +
        'i, V = ' + Vre.toFixed(3) + ' :  ' + cancel.toFixed(6)
    ].forEach(function (s, i) {
      var t = S.text(70, 506 + i * 26, s, i === 3 ? 's-lbl-w' : 's-lbl', 'start');
      gL.appendChild(t);
    });

    var gR = S.g({});
    svg.appendChild(gR);
    gR.appendChild(S.text(620, 476, 'and what survives if it is not', 's-lbl-f', 'start'));
    [
      'V = Vᵣ + i Vᵢ   →   V* = Vᵣ − i Vᵢ  ≠  V',
      'the two potential terms leave (V − V*)|ψ|²',
      '∂P/∂t + ∇·J = (2/ℏ) Im(V) P',
      'with Vᵢ = ' + Vim.toFixed(3) + ', P = ' + P0.toFixed(3) +
        ' :  ' + leak.toFixed(3) + ' per unit time',
      'probability is absorbed — a deliberate modelling trick'
    ].forEach(function (s, i) {
      var t = S.text(620, 506 + i * 26, s, i === 3 ? 's-lbl-f' : 's-lbl', 'start');
      gR.appendChild(t);
    });

    var verdict = S.text(W / 2, 656, '', 's-lbl-b', 'middle');
    verdict.setAttribute('font-size', '14');
    svg.appendChild(verdict);
    verdict.textContent = flipCount + ' sign changes in all: one from (iℏ)* = −iℏ, ' +
      'three from multiplying by −1';

    return function (p) {
      S.op(built[0], M.beat(p, 0.03, 0.14));
      S.op(step1, M.beat(p, 0.16, 0.26));
      S.op(built[1], M.beat(p, 0.26, 0.40));
      S.op(step2, M.beat(p, 0.42, 0.50));
      S.op(built[2], M.beat(p, 0.50, 0.62));
      S.op(gL, M.beat(p, 0.64, 0.76));
      S.op(gR, M.beat(p, 0.76, 0.88));
      S.op(verdict, M.beat(p, 0.88, 0.97));
    };
  });

  /* ================================================================ (2) === */
  /* The chain of (1.9.3), one line per beat, with the V terms cancelling and
     the division by i-hbar the handout leaves out. */

  A.scene('current-algebra', function (root) {
    var W = 1080, H = 720;
    var svg = S.root(W, H,
      'The derivation of equation 1.9.3 line by line: the product rule, the substitution ' +
      'of the Schrodinger equation and its conjugate, the cancellation of the potential ' +
      'terms, and the division by i h-bar that produces the probability current.');
    root.appendChild(svg);

    svg.appendChild(S.text(80, 52,
      'from ∂P/∂t to a divergence, with nothing skipped', 's-lbl', 'start'));

    var X = 80, Y0 = 100, DY = 46;
    var LINES = [
      { s: 'iℏ ∂P/∂t  =  iℏ ∂/∂t ( ψ* ψ )',
        why: 'P is defined as the modulus squared, and the modulus squared is ψ* times ψ.' },
      { s: '=  ψ* ( iℏ ∂ψ/∂t )  +  ψ ( iℏ ∂ψ*/∂t )',
        why: 'The product rule. Both factors are differentiable in t, and iℏ is a constant that slides inside.' },
      { s: '=  ψ* ( −ℏ²/2m ∇²ψ + Vψ )  +  ψ ( +ℏ²/2m ∇²ψ* − Vψ* )',
        why: 'Substituting (1.9.1) in the first bracket and the conjugated equation in the second.' },
      { s: null,
        why: 'Multiplying out. The two potential terms are now sitting next to each other.' },
      { s: '=  −ℏ²/2m ( ψ* ∇²ψ  −  ψ ∇²ψ* )',
        why: 'ψ and ψ* are numbers at each point, so they commute and Vψ*ψ − Vψψ* vanishes.' },
      { s: '=  −ℏ²/2m ∇·( ψ* ∇ψ − ψ ∇ψ* )                (1.9.3)',
        why: 'The bracket is a divergence. That identity is proved on its own in the next figure.' },
      { s: 'divide both sides by iℏ, and use  1/i = −i',
        why: 'The step the handout omits. It is where −ℏ²/2m turns into +iℏ/2m.' },
      { s: '∂P/∂t  =  +iℏ/2m ∇·( ψ* ∇ψ − ψ ∇ψ* )  =  −∇·J     (1.9.4)',
        why: 'Name the bracket, with its sign, and the continuity equation is already written.' }
    ];

    var nodes = [];
    LINES.forEach(function (L, i) {
      if (L.s === null) { nodes.push(null); return; }
      var t = S.text(X, Y0 + i * DY, L.s, i === 7 ? 's-lbl-q' : 's-lbl-b', 'start');
      t.setAttribute('font-size', '13');
      svg.appendChild(t);
      nodes.push(t);
    });

    /* Line 3 is split so the two potential terms can be struck out on their own. */
    var y3 = Y0 + 3 * DY;
    var g3 = S.g({});
    svg.appendChild(g3);
    var seg = [
      { x: 80,  s: '=  −ℏ²/2m ψ*∇²ψ', cls: 's-lbl-b' },
      { x: 260, s: '+  V ψ*ψ', cls: 's-lbl-f' },
      { x: 380, s: '+  ℏ²/2m ψ∇²ψ*', cls: 's-lbl-b' },
      { x: 560, s: '−  V ψψ*', cls: 's-lbl-f' }
    ];
    seg.forEach(function (sg) {
      var t = S.text(sg.x, y3, sg.s, sg.cls, 'start');
      t.setAttribute('font-size', '13');
      g3.appendChild(t);
    });
    var strike1 = S.line(255, y3 - 5, 350, y3 - 5, 's-fail');
    var strike2 = S.line(555, y3 - 5, 650, y3 - 5, 's-fail');
    g3.appendChild(strike1); g3.appendChild(strike2);

    /* Three numbers, all evaluated here rather than quoted. */
    var pr = 0.6, pi = 0.8, Vre = 2.5;
    var vCancel = Vre * (pr * pr + pi * pi) - Vre * (pi * pi + pr * pr);
    /* 1/i by complex division: 1/(0 + 1i) = (0 - 1i)/(0^2 + 1^2). */
    var den = 0 * 0 + 1 * 1;
    var invIre = 0 / den, invIim = -1 / den;
    /* (1/i hbar)(-hbar^2/2m) with hbar = m = 1: multiply -0.5 by (0 - 1i). */
    var coefRe = -0.5 * invIre, coefIim = -0.5 * invIim;

    var checks = [
      'check  V ψ*ψ − V ψψ*  with ψ = ' + pr.toFixed(2) + ' + ' + pi.toFixed(2) +
        'i, V = ' + Vre.toFixed(2) + '  →  ' + vCancel.toFixed(6),
      'check  1/i  →  ' + invIre.toFixed(3) + ' ' + fmt(invIim, 3) + 'i',
      'check  (1/iℏ)(−ℏ²/2m) with ℏ = m = 1  →  ' + coefRe.toFixed(3) + ' ' +
        fmt(coefIim, 3) + 'i   =  +iℏ/2m'
    ].map(function (s, i) {
      var t = S.text(80, 512 + i * 24, s, 's-lbl-w', 'start');
      svg.appendChild(t);
      return t;
    });

    svg.appendChild(S.line(80, 600, W - 80, 600, 's-axis s-dash'));
    var cap = S.text(W / 2, 634, '', 's-lbl-b', 'middle');
    cap.setAttribute('font-size', '13');
    svg.appendChild(cap);
    var cap2 = S.text(W / 2, 682,
      'the handout jumps from (1.9.3) to (1.9.4) in one line; the two middle steps above ' +
      'are what happens there', 's-lbl', 'middle');
    svg.appendChild(cap2);

    return function (p) {
      var lit = M.beat(p, 0.04, 0.80) * LINES.length;
      var shown = -1, i;
      for (i = 0; i < LINES.length; i++) {
        var on = M.clamp(lit - i, 0, 1);
        if (i === 3) S.op(g3, on); else S.op(nodes[i], on);
        if (on > 0.45) shown = i;
      }
      /* The struck-out potential terms fade as the cancellation is announced. */
      var kill = M.clamp(lit - 4.2, 0, 1);
      S.op(strike1, kill); S.op(strike2, kill);
      cap.textContent = shown >= 0 ? LINES[shown].why : '';
      S.op(cap, shown >= 0 ? 1 : 0);
      checks.forEach(function (c, j) { S.op(c, M.beat(p, 0.62 + j * 0.07, 0.74 + j * 0.07)); });
      S.op(cap2, M.beat(p, 0.86, 0.97));
    };
  });

  /* ================================================================ (3) === */
  /* The identity that makes J exist: the antisymmetric combination is a
     divergence. Proved by the product rule and then checked numerically on a
     wavefunction with no symmetry to help it. */

  A.scene('divergence-trick', function (root) {
    var W = 1120, H = 720;
    var svg = S.root(W, H,
      'The identity psi-star Laplacian psi minus psi Laplacian psi-star equals the ' +
      'divergence of psi-star grad psi minus psi grad psi-star, proved by the product rule ' +
      'and checked numerically at four points of a complex two-dimensional wavefunction.');
    root.appendChild(svg);

    /* A test wavefunction with no special structure: three plane waves with
       complex amplitudes. Its derivatives are exact, term by term. */
    var MODES = [
      { ar: 0.70, ai: 0.20, kx: 1.10, ky: -0.40 },
      { ar: -0.30, ai: 0.50, kx: -0.60, ky: 0.90 },
      { ar: 0.40, ai: -0.80, kx: 0.25, ky: 1.40 }
    ];
    function psi2(x, y) {
      var re = 0, im = 0, n, m, th, c, s;
      for (n = 0; n < MODES.length; n++) {
        m = MODES[n]; th = m.kx * x + m.ky * y;
        c = Math.cos(th); s = Math.sin(th);
        re += m.ar * c - m.ai * s;
        im += m.ar * s + m.ai * c;
      }
      return [re, im];
    }
    function dpsi2(x, y, ax) {
      var re = 0, im = 0, n, m, th, c, s, k, er, ei;
      for (n = 0; n < MODES.length; n++) {
        m = MODES[n]; k = ax ? m.ky : m.kx;
        th = m.kx * x + m.ky * y;
        c = Math.cos(th); s = Math.sin(th);
        er = m.ar * c - m.ai * s;
        ei = m.ar * s + m.ai * c;
        re += -k * ei; im += k * er;
      }
      return [re, im];
    }
    function lap2(x, y) {
      var re = 0, im = 0, n, m, th, c, s, k2, er, ei;
      for (n = 0; n < MODES.length; n++) {
        m = MODES[n]; k2 = m.kx * m.kx + m.ky * m.ky;
        th = m.kx * x + m.ky * y;
        c = Math.cos(th); s = Math.sin(th);
        er = m.ar * c - m.ai * s;
        ei = m.ar * s + m.ai * c;
        re += -k2 * er; im += -k2 * ei;
      }
      return [re, im];
    }
    /* Both sides are purely imaginary; everything below is the value over i. */
    function lhsOverI(x, y) {
      var q = psi2(x, y), L = lap2(x, y);
      return 2 * (q[0] * L[1] - q[1] * L[0]);
    }
    function gOverI(x, y, ax) {
      var q = psi2(x, y), d = dpsi2(x, y, ax);
      return 2 * (q[0] * d[1] - q[1] * d[0]);
    }
    function rhsOverI(x, y) {
      var h = 1e-4;
      return (gOverI(x + h, y, 0) - gOverI(x - h, y, 0)) / (2 * h) +
             (gOverI(x, y + h, 1) - gOverI(x, y - h, 1)) / (2 * h);
    }
    /* The symmetric combination, for contrast. */
    function hReal(x, y, ax) {
      var q = psi2(x, y), d = dpsi2(x, y, ax);
      return 2 * (q[0] * d[0] + q[1] * d[1]);
    }
    function sumDiv(x, y) {
      var h = 1e-4;
      return (hReal(x + h, y, 0) - hReal(x - h, y, 0)) / (2 * h) +
             (hReal(x, y + h, 1) - hReal(x, y - h, 1)) / (2 * h);
    }
    function sumLap(x, y) {
      var q = psi2(x, y), L = lap2(x, y);
      return 2 * (q[0] * L[0] + q[1] * L[1]);
    }
    function gradSq(x, y) {
      var a = dpsi2(x, y, 0), b = dpsi2(x, y, 1);
      return a[0] * a[0] + a[1] * a[1] + b[0] * b[0] + b[1] * b[1];
    }

    svg.appendChild(S.text(70, 48,
      'why the antisymmetric combination is a divergence', 's-lbl', 'start'));

    /* ---- the two product-rule lines, with the cross terms struck out ---- */
    var gA = S.g({});
    svg.appendChild(gA);
    var lineA = [
      { x: 70,  s: '∇·( ψ* ∇ψ )  =', cls: 's-lbl-b' },
      { x: 260, s: '∇ψ*·∇ψ', cls: 's-lbl-f' },
      { x: 400, s: '+  ψ* ∇²ψ', cls: 's-lbl-b' }
    ];
    lineA.forEach(function (sg) {
      var t = S.text(sg.x, 108, sg.s, sg.cls, 'start');
      t.setAttribute('font-size', '14');
      gA.appendChild(t);
    });
    var gB = S.g({});
    svg.appendChild(gB);
    var lineB = [
      { x: 70,  s: '∇·( ψ ∇ψ* )  =', cls: 's-lbl-b' },
      { x: 260, s: '∇ψ·∇ψ*', cls: 's-lbl-f' },
      { x: 400, s: '+  ψ ∇²ψ*', cls: 's-lbl-b' }
    ];
    lineB.forEach(function (sg) {
      var t = S.text(sg.x, 156, sg.s, sg.cls, 'start');
      t.setAttribute('font-size', '14');
      gB.appendChild(t);
    });
    var sA = S.line(255, 103, 375, 103, 's-fail');
    var sB = S.line(255, 151, 375, 151, 's-fail');
    svg.appendChild(sA); svg.appendChild(sB);

    var why = S.text(70, 202,
      'subtract: the dot product is symmetric, so ∇ψ*·∇ψ − ∇ψ·∇ψ* = 0',
      's-lbl-q', 'start');
    why.setAttribute('font-size', '12');
    svg.appendChild(why);

    var idn = S.text(70, 248,
      '∇·( ψ* ∇ψ − ψ ∇ψ* )  =  ψ* ∇²ψ − ψ ∇²ψ*',
      's-lbl-q', 'start');
    idn.setAttribute('font-size', '15');
    svg.appendChild(idn);

    svg.appendChild(S.line(70, 286, W - 70, 286, 's-axis s-dash'));

    /* ---- and the same identity, evaluated ---- */
    var gT = S.g({});
    svg.appendChild(gT);
    gT.appendChild(S.text(70, 322,
      'the same statement, evaluated on ψ = Σ Aₙ exp( i kₙ·r ) with complex Aₙ',
      's-lbl-w', 'start'));

    var CX = [100, 330, 610, 880];
    var head = ['point  ( x , y )', '( ψ*∇²ψ − ψ∇²ψ* ) / i',
                '∇·( ψ*∇ψ − ψ∇ψ* ) / i', 'difference'];
    head.forEach(function (h, j) {
      gT.appendChild(S.text(CX[j], 360, h, 's-lbl-q', 'start'));
    });
    gT.appendChild(S.line(90, 372, W - 90, 372, 's-axis'));

    var PTS = [[0.30, -0.70], [-1.20, 0.50], [0.90, 1.10], [2.00, -1.60]];
    var rows = PTS.map(function (pt, i) {
      var g = S.g({});
      gT.appendChild(g);
      var y = 400 + i * 30;
      var lv = lhsOverI(pt[0], pt[1]);
      var rv = rhsOverI(pt[0], pt[1]);
      var cells = [
        '( ' + fmt(pt[0], 2) + ' , ' + fmt(pt[1], 2) + ' )',
        fmt(lv, 7),
        fmt(rv, 7),
        ex(Math.abs(lv - rv), 1)
      ];
      cells.forEach(function (c, j) {
        g.appendChild(S.text(CX[j], y, c, j === 3 ? 's-lbl-w' : 's-lbl', 'start'));
      });
      return g;
    });

    var tnote = S.text(100, 538,
      'both sides are purely imaginary; the column shows the value divided by i',
      's-lbl', 'start');
    svg.appendChild(tnote);

    /* ---- the contrast: the symmetric combination is not a divergence ---- */
    var gC = S.g({});
    svg.appendChild(gC);
    gC.appendChild(S.text(70, 586,
      'and the same for the sum, which is not a divergence at all', 's-lbl-f', 'start'));
    var cx = PTS[0][0], cy = PTS[0][1];
    var sl = sumLap(cx, cy), sd = sumDiv(cx, cy), gs = gradSq(cx, cy);
    [
      'ψ*∇²ψ + ψ∇²ψ* = ' + fmt(sl, 5) +
        '     ∇·( ψ*∇ψ + ψ∇ψ* ) = ' + fmt(sd, 5),
      'they differ by ' + fmt(sl - sd, 5) + ', which is −2|∇ψ|² = ' + fmt(-2 * gs, 5),
      'a leftover that is not the divergence of anything — so no conservation law'
    ].forEach(function (s, i) {
      gC.appendChild(S.text(70, 616 + i * 26, s, i === 2 ? 's-lbl-f' : 's-lbl', 'start'));
    });

    var verdict = S.text(W / 2, 700,
      'the minus sign is the whole trick: it is what lets J exist',
      's-lbl-b', 'middle');
    verdict.setAttribute('font-size', '14');
    svg.appendChild(verdict);

    return function (p) {
      S.op(gA, M.beat(p, 0.03, 0.14));
      S.op(gB, M.beat(p, 0.14, 0.24));
      var kill = M.beat(p, 0.26, 0.36);
      S.op(sA, kill); S.op(sB, kill);
      S.op(why, M.beat(p, 0.28, 0.38));
      S.op(idn, M.beat(p, 0.38, 0.48));
      S.op(gT, M.beat(p, 0.48, 0.56));
      rows.forEach(function (g, i) { S.op(g, M.beat(p, 0.52 + i * 0.05, 0.62 + i * 0.05)); });
      S.op(tnote, M.beat(p, 0.70, 0.78));
      S.op(gC, M.beat(p, 0.78, 0.90));
      S.op(verdict, M.beat(p, 0.90, 0.98));
    };
  });

  /* ================================================================ (4) === */
  /* The continuity equation as a picture: an evolving packet, the current
     computed from it, and the residual of dP/dt + dJ/dx printed. */

  A.scene('continuity-flow', function (root) {
    var W = 1080, H = 740;
    var svg = S.root(W, H,
      'A one-dimensional probability density evolving in time, with the probability current ' +
      'computed from the same wavefunction drawn underneath as arrows. Where the density ' +
      'falls, the arrows carry probability away.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var X0 = -9, X1 = 9, NX = 120, TMAX = 5.0;
    var PK = makePacket(1.2, 0.5, 21, -4.5, X0, X1);

    var px0 = 90, px1 = 1000;
    var pyT = 100, pyB = 300;
    var jy0 = 430, jhalf = 62;
    var ay = 528;

    var PXf = function (x) { return M.map(x, X0, X1, px0, px1); };

    /* Fix the vertical scale once, from the largest density the packet ever
       reaches, so nothing clips and nothing is rescaled mid-animation. */
    var pMax = 0, jMax = 1e-9, i, tt, xx, vP, vJ;
    for (tt = 0; tt <= TMAX + 1e-9; tt += TMAX / 12) {
      for (i = 0; i <= 60; i++) {
        xx = X0 + (X1 - X0) * i / 60;
        vP = densityAt(PK, xx, tt); if (vP > pMax) pMax = vP;
        vJ = Math.abs(currentAt(PK, xx, tt)); if (vJ > jMax) jMax = vJ;
      }
    }
    var PY = function (v) { return M.map(v, 0, pMax * 1.12, pyB, pyT); };
    var JY = function (v) { return jy0 - (v / (jMax * 1.15)) * jhalf; };

    svg.appendChild(S.axes(px0, pyT - 20, px1, pyB, 'x', null));
    svg.appendChild(S.text(px0 - 8, pyT - 24, 'P = |ψ|²', 's-lbl-p', 'end'));
    svg.appendChild(S.line(px0, jy0, px1, jy0, 's-axis'));
    svg.appendChild(S.text(px0 - 8, jy0 + 4, 'J', 's-lbl-q', 'end'));
    svg.appendChild(S.text(px1, jy0 + 20, 'x', 's-lbl', 'end'));

    var ghost = S.path('', 's-ghost');
    svg.appendChild(ghost);
    var fillP = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.18', stroke: 'none' });
    svg.appendChild(fillP);
    var curveP = S.path('', 's-prob');
    svg.appendChild(curveP);

    var fillJ = S.el('path', { fill: 'var(--quantum)', 'fill-opacity': '0.14', stroke: 'none' });
    svg.appendChild(fillJ);
    var curveJ = S.path('', 's-quantum');
    svg.appendChild(curveJ);

    var gArrows = S.g({});
    svg.appendChild(gArrows);
    var NA = 24, arrows = [];
    for (i = 0; i < NA; i++) {
      var ax = px0 + 20 + (px1 - px0 - 40) * i / (NA - 1);
      var a = S.arrow(svg, ax, ay, ax + 12, ay, 'q');
      gArrows.appendChild(a);
      arrows.push({ el: a, x: X0 + (X1 - X0) * (20 + (px1 - px0 - 40) * i / (NA - 1)) / (px1 - px0), px: ax });
    }
    /* Recompute the physical x of each arrow properly. */
    for (i = 0; i < NA; i++) {
      arrows[i].x = M.map(arrows[i].px, px0, px1, X0, X1);
    }
    gArrows.appendChild(S.text(px0, ay + 40,
      'arrow length and direction = J at that point', 's-lbl-q', 'start'));

    var labLeave = S.text(px0 + 40, 336, '∂P/∂t < 0 here', 's-lbl-f', 'middle');
    var labEnter = S.text(px0 + 400, 336, '∂P/∂t > 0 here', 's-lbl-w', 'middle');
    svg.appendChild(labLeave); svg.appendChild(labEnter);

    var readY = 588;
    var rows = [];
    for (i = 0; i < 3; i++) {
      var t = S.text(90, readY + i * 24, '', 's-lbl', 'start');
      svg.appendChild(t);
      rows.push(t);
    }
    var totRead = S.text(90, readY + 84, '', 's-lbl-p', 'start');
    totRead.setAttribute('font-size', '13');
    svg.appendChild(totRead);

    var moral = S.text(W / 2, 712,
      'the packet moves and spreads, and the total underneath it never changes',
      's-lbl-b', 'middle');
    moral.setAttribute('font-size', '14');
    svg.appendChild(moral);

    var SAMPLE = [-3.0, 0.0, 3.0];

    return function (p) {
      var T = M.easeInOut(M.beat(p, 0.06, 0.94)) * TMAX;
      var dt = 0.04, k, x, Pv, Jv, dP;
      var ptsP = [], ptsJ = [], ptsG = [];
      var worstDown = 0, worstUp = 0, xDown = -3, xUp = 3, area = 0;
      var Tg = Math.max(0, T - 1.1);

      for (k = 0; k <= NX; k++) {
        x = X0 + (X1 - X0) * k / NX;
        Pv = densityAt(PK, x, T);
        Jv = currentAt(PK, x, T);
        dP = (densityAt(PK, x, T + dt) - densityAt(PK, x, T - dt)) / (2 * dt);
        ptsP.push([PXf(x), PY(Pv)]);
        ptsJ.push([PXf(x), JY(Jv)]);
        ptsG.push([PXf(x), PY(densityAt(PK, x, Tg))]);
        area += Pv * ((k === 0 || k === NX) ? 0.5 : 1);
        if (dP < worstDown) { worstDown = dP; xDown = x; }
        if (dP > worstUp) { worstUp = dP; xUp = x; }
      }
      area *= (X1 - X0) / NX;

      S.setD(curveP, S.polyD(ptsP));
      fillP.setAttribute('d', S.areaD(ptsP, pyB));
      S.setD(ghost, S.polyD(ptsG));
      S.setD(curveJ, S.polyD(ptsJ));
      fillJ.setAttribute('d', S.areaD(ptsJ, jy0));

      for (k = 0; k < arrows.length; k++) {
        var jv = currentAt(PK, arrows[k].x, T);
        var len = (jv / (jMax * 1.15)) * 30;
        if (Math.abs(len) < 1.2) len = len < 0 ? -1.2 : 1.2;
        arrows[k].el.setAttribute('x1', arrows[k].px.toFixed(1));
        arrows[k].el.setAttribute('x2', (arrows[k].px + len).toFixed(1));
        arrows[k].el.setAttribute('stroke-opacity',
          (0.25 + 0.75 * Math.min(1, Math.abs(jv) / (jMax * 0.6))).toFixed(2));
      }

      labLeave.setAttribute('x', M.clamp(PXf(xDown), px0 + 60, px1 - 60).toFixed(1));
      labEnter.setAttribute('x', M.clamp(PXf(xUp), px0 + 60, px1 - 60).toFixed(1));

      /* The continuity equation, checked at three points from the drawn field. */
      for (k = 0; k < 3; k++) {
        var xs = SAMPLE[k];
        var dPdt = (densityAt(PK, xs, T + dt) - densityAt(PK, xs, T - dt)) / (2 * dt);
        var hx = 0.02;
        var dJdx = (currentAt(PK, xs + hx, T) - currentAt(PK, xs - hx, T)) / (2 * hx);
        rows[k].textContent = 'x = ' + fmt(xs, 1) + '    ∂P/∂t = ' + fmt(dPdt, 5) +
          '    ∂J/∂x = ' + fmt(dJdx, 5) + '    sum = ' + ex(Math.abs(dPdt + dJdx), 1);
      }
      totRead.textContent = 't = ' + T.toFixed(2) + '      ∫ P dx measured across the frame = ' +
        area.toFixed(4);

      S.op(fillP, M.beat(p, 0.02, 0.12));
      S.op(curveP, M.beat(p, 0.02, 0.12));
      S.op(ghost, M.beat(p, 0.18, 0.30) * 0.7);
      S.op(curveJ, M.beat(p, 0.24, 0.36));
      S.op(fillJ, M.beat(p, 0.24, 0.36));
      S.op(gArrows, M.beat(p, 0.32, 0.44));
      S.op(labLeave, M.beat(p, 0.44, 0.54));
      S.op(labEnter, M.beat(p, 0.48, 0.58));
      rows.forEach(function (r, j) { S.op(r, M.beat(p, 0.56 + j * 0.05, 0.68 + j * 0.05)); });
      S.op(totRead, M.beat(p, 0.72, 0.82));
      S.op(moral, M.beat(p, 0.86, 0.96));
    };
  });

  /* ================================================================ (5) === */
  /* The plane wave: J worked out from (1.9.5), and the same J read off the
     field, so the two agree in front of the reader. */

  A.scene('plane-wave-current', function (root, api) {
    var W = 1080, H = 700;
    var svg = S.root(W, H,
      'A travelling plane wave with its real and imaginary parts, its flat probability ' +
      'density, and the current computed two ways: from the formula and from the field.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var px0 = 90, px1 = 830;
    var wyC = 155, wamp = 62;
    var pyC = 300, pyB = 348;
    var ay = 420;

    svg.appendChild(S.line(px0, wyC, px1, wyC, 's-axis'));
    svg.appendChild(S.text(px0, wyC - wamp - 22,
      'Re ψ (solid) and Im ψ (dashed), for ψ = A e^{i(kx − ωt)}',
      's-lbl-w', 'start'));

    var reP = S.path('', 's-wave');
    var imP = S.path('', 's-wave');
    imP.setAttribute('stroke-dasharray', '6 4');
    imP.setAttribute('stroke-opacity', '0.55');
    svg.appendChild(reP); svg.appendChild(imP);

    var pFill = S.el('path', { fill: 'var(--probability)', 'fill-opacity': '0.18', stroke: 'none' });
    var pLine = S.path('', 's-prob');
    svg.appendChild(pFill); svg.appendChild(pLine);
    var pLbl = S.text(px1 + 12, pyC + 4, '', 's-lbl-p', 'start');
    svg.appendChild(pLbl);

    var gA = S.g({});
    svg.appendChild(gA);
    var NA = 16, arrows = [];
    for (var i = 0; i < NA; i++) {
      var axp = px0 + 24 + (px1 - px0 - 48) * i / (NA - 1);
      var a = S.arrow(svg, axp, ay, axp + 20, ay, 'q');
      gA.appendChild(a);
      arrows.push({ el: a, px: axp });
    }
    var aLbl = S.text(px0, ay + 34, '', 's-lbl-q', 'start');
    gA.appendChild(aLbl);

    var alg = [
      '∂ψ/∂x = ikψ,    ∂ψ*/∂x = −ikψ*',
      'ψ* ∂ψ/∂x − ψ ∂ψ*/∂x  =  ik|A|² − ( −ik|A|² )  =  2ik|A|²',
      'J = −(iℏ/2m)( 2ik|A|² )  =  (ℏk/m)|A|²  =  P v,   with  v = ℏk/m'
    ].map(function (s, j) {
      var t = S.text(90, 494 + j * 30, s, j === 2 ? 's-lbl-q' : 's-lbl-b', 'start');
      t.setAttribute('font-size', '13');
      svg.appendChild(t);
      return t;
    });

    var readout = [];
    for (i = 0; i < 3; i++) {
      var t = S.text(90, 604 + i * 22, '', 's-lbl', 'start');
      svg.appendChild(t);
      readout.push(t);
    }

    /* One concrete electron, in SI, from the same formula. */
    var C = M.C;
    var lam = 0.5e-9;
    var kSI = M.TAU / lam;
    var vSI = C.hbar * kSI / C.me;
    var siLine = S.text(560, 670,
      'electron at λ = 0.50 nm :  k = ' + ex(kSI, 3) + ' m⁻¹,  v = ℏk/m = ' +
      ex(vSI, 3) + ' m/s', 's-lbl-w', 'start');
    svg.appendChild(siLine);

    var Amp = 1.2;                 /* |A|^2 = 1.44 */
    var xPhys = function (pxv) { return M.map(pxv, px0, px1, 0, 12); };

    return function (p, tt) {
      /* k rides the scroll: positive first, then down through zero, so the
         current reverses in front of the reader. */
      var k = p < 0.55 ? 1.8 : M.lerp(1.8, -1.2, M.easeInOut(M.beat(p, 0.55, 0.95)));
      var w = 0.5 * k * k;          /* hbar = m = 1, so omega = k^2 / 2 */
      var time = api.reduced ? 1.2 : tt;

      var pts1 = S.sample(300, px0, px1, function (pxv) {
        var ph = k * xPhys(pxv) - w * time;
        return [pxv, wyC - Amp * Math.cos(ph) * wamp / 1.4];
      });
      var pts2 = S.sample(300, px0, px1, function (pxv) {
        var ph = k * xPhys(pxv) - w * time;
        return [pxv, wyC - Amp * Math.sin(ph) * wamp / 1.4];
      });
      S.setD(reP, S.polyD(pts1));
      S.setD(imP, S.polyD(pts2));

      var Pconst = Amp * Amp;
      var yP = pyC - 30;
      var flat = [[px0, yP], [px1, yP]];
      S.setD(pLine, S.polyD(flat));
      pFill.setAttribute('d', S.areaD(flat, pyB));
      pLbl.textContent = 'P = |A|² = ' + Pconst.toFixed(3);

      /* J from the formula, and J read off the field at a sample point. */
      var Jform = k * Pconst;
      var xs = 3.2;
      var ph = k * xs - w * time;
      var pr = Amp * Math.cos(ph), pi = Amp * Math.sin(ph);
      var qr = -Amp * k * Math.sin(ph), qi = Amp * k * Math.cos(ph);
      var Jfield = pr * qi - pi * qr;      /* Im(psi* dpsi/dx), hbar = m = 1 */

      var scale = 34 / 1.8;
      for (i = 0; i < arrows.length; i++) {
        var len = k * scale;
        if (Math.abs(len) < 1.5) len = len < 0 ? -1.5 : 1.5;
        arrows[i].el.setAttribute('x1', arrows[i].px.toFixed(1));
        arrows[i].el.setAttribute('x2', (arrows[i].px + len).toFixed(1));
      }
      aLbl.textContent = k >= 0
        ? 'J > 0 : the flux points the way the wave travels'
        : 'k < 0 : the wave runs left, and so does the probability';
      aLbl.setAttribute('class', k >= 0 ? 's-lbl-q' : 's-lbl-f');

      readout[0].textContent = 'k = ' + fmt(k, 3) + '     |A|² = ' + Pconst.toFixed(3) +
        '     v = ℏk/m = ' + fmt(k, 3);
      readout[1].textContent = 'from (1.9.5):  J = ℏk|A|²/m = ' + fmt(Jform, 4) +
        '        from the field at x = ' + xs.toFixed(1) + ':  J = ' + fmt(Jfield, 4);
      readout[2].textContent = 'J / P = ' + fmt(Jform / Pconst, 3) +
        ' = v      flux per unit density is exactly the velocity';

      S.op(reP, M.beat(p, 0.03, 0.16));
      S.op(imP, M.beat(p, 0.08, 0.22));
      S.op(pFill, M.beat(p, 0.20, 0.32));
      S.op(pLine, M.beat(p, 0.20, 0.32));
      S.op(pLbl, M.beat(p, 0.22, 0.34));
      alg.forEach(function (l, j) { S.op(l, M.beat(p, 0.30 + j * 0.08, 0.42 + j * 0.08)); });
      S.op(gA, M.beat(p, 0.46, 0.58));
      readout.forEach(function (l, j) { S.op(l, M.beat(p, 0.54 + j * 0.06, 0.66 + j * 0.06)); });
      S.op(siLine, M.beat(p, 0.76, 0.88));
    };
  });

  /* ================================================================ (6) === */
  /* The surface term. A sphere whose radius grows, the flux through it, and the
     reason "P goes to zero" is not on its own enough to kill it. */

  A.scene('total-probability', function (root) {
    var W = 1120, H = 720;
    var svg = S.root(W, H,
      'A sphere of growing radius with the probability current crossing it. For a ' +
      'normalisable state the flux through the sphere dies away; for a wavefunction ' +
      'falling off like one over r it does not, even though the density still goes to zero.');
    S.defsArrows(svg);
    root.appendChild(svg);

    /* Two radial states with the same outgoing phase exp(i kappa r):
         psi1 = N exp(-r^2 / 4 sigma^2) e^{i kappa r}   normalisable
         psi2 = (C / r) e^{i kappa r}                   not normalisable
       For both, J_r = (hbar/m) kappa |psi|^2 with hbar = m = 1. */
    var sig = 1.0, kap = 0.8, Cc = 0.5;
    var RMAX = 6.5 * sig;

    function P1raw(r) { return Math.exp(-r * r / (2 * sig * sig)); }
    /* Normalise by integrating 4 pi r^2 |psi|^2 numerically. */
    var NR = 1200, dr = (RMAX * 2.2) / NR, acc = 0, i, rr;
    for (i = 1; i <= NR; i++) {
      rr = i * dr;
      acc += 2 * Math.PI * 2 * rr * rr * P1raw(rr) * dr;
    }
    var Nsq = 1 / acc;
    function P1(r) { return Nsq * P1raw(r); }
    function J1(r) { return kap * P1(r); }
    function Flux1(R) { return 4 * Math.PI * R * R * J1(R); }
    function P2(r) { return Cc * Cc / (r * r); }
    function J2(r) { return kap * P2(r); }
    function Flux2(R) { return 4 * Math.PI * R * R * J2(R); }
    function Enclosed(R) {
      var n = 400, h = R / n, s = 0, j, r2;
      for (j = 1; j <= n; j++) { r2 = j * h; s += 4 * Math.PI * r2 * r2 * P1(r2) * h; }
      return s;
    }

    var fMax = 0, eMax = 1.02;
    for (i = 1; i <= 200; i++) { var f = Flux1(RMAX * i / 200); if (f > fMax) fMax = f; }
    var f2const = Flux2(1.0);
    var fTop = Math.max(fMax, f2const) * 1.15;

    /* ---- left: the sphere ---- */
    var cx = 300, cy = 300, RPX = 215;
    var gSphere = S.g({});
    svg.appendChild(gSphere);
    for (i = 1; i <= 4; i++) {
      var c = S.circle(cx, cy, RPX * i / 5, 's-grid');
      c.setAttribute('fill', 'none');
      gSphere.appendChild(c);
    }
    var shell = S.circle(cx, cy, 60, 's-prob');
    shell.setAttribute('fill', 'var(--probability)');
    shell.setAttribute('fill-opacity', '0.06');
    gSphere.appendChild(shell);
    var core = S.circle(cx, cy, 26, 's-fill-i');
    core.setAttribute('opacity', '0.35');
    gSphere.appendChild(core);

    var NARR = 12, sArr = [];
    for (i = 0; i < NARR; i++) {
      var th = M.TAU * i / NARR;
      var ar = S.arrow(svg, cx, cy, cx + 10, cy, 'q');
      gSphere.appendChild(ar);
      sArr.push({ el: ar, th: th });
    }
    gSphere.appendChild(S.text(70, 62,
      'the sphere bounding the volume, pushed outwards', 's-lbl', 'start'));
    var rLbl = S.text(70, 552, '', 's-lbl-p', 'start');
    rLbl.setAttribute('font-size', '13');
    svg.appendChild(rLbl);
    var rLbl2 = S.text(70, 578, '', 's-lbl-q', 'start');
    svg.appendChild(rLbl2);
    var rLbl3 = S.text(70, 604,
      'the arrows are Jᵣ at the surface; their number grows as R²', 's-lbl', 'start');
    svg.appendChild(rLbl3);

    /* ---- right: the two plots ---- */
    var gx0 = 610, gx1 = 1070;
    var g1T = 100, g1B = 250;
    var g2T = 330, g2B = 470;
    var GX = function (R) { return M.map(R, 0, RMAX, gx0, gx1); };
    var G1Y = function (v) { return M.map(v, 0, fTop, g1B, g1T); };
    var G2Y = function (v) { return M.map(v, 0, eMax, g2B, g2T); };

    svg.appendChild(S.axes(gx0, g1T - 16, gx1, g1B, 'R', null));
    svg.appendChild(S.text(gx0, g1T - 26,
      'flux through the sphere,  ∮ J·da = 4πR² Jᵣ(R)', 's-lbl', 'start'));
    svg.appendChild(S.axes(gx0, g2T - 16, gx1, g2B, 'R', null));
    svg.appendChild(S.text(gx0, g2T - 26,
      'probability enclosed,  ∫₀ᴿ P 4πr² dr', 's-lbl', 'start'));

    var f1 = S.path('', 's-prob');
    svg.appendChild(f1);
    S.setD(f1, S.polyD(S.sample(200, 0.02, RMAX, function (R) {
      return [GX(R), G1Y(Flux1(R))];
    })));
    var f2 = S.path('', 's-fail');
    f2.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(f2);
    S.setD(f2, S.polyD(S.sample(200, 0.02, RMAX, function (R) {
      return [GX(R), G1Y(Flux2(R))];
    })));
    svg.appendChild(S.text(gx1, G1Y(f2const) - 10,
      'normalisation fails: flux is constant', 's-lbl-f', 'end'));
    var f1Lbl = S.text(GX(RMAX * 0.55), G1Y(fMax * 0.55),
      'normalisable: flux dies', 's-lbl-p', 'start');
    svg.appendChild(f1Lbl);

    var encPath = S.path('', 's-prob');
    svg.appendChild(encPath);
    S.setD(encPath, S.polyD(S.sample(160, 0.02, RMAX, function (R) {
      return [GX(R), G2Y(Enclosed(R))];
    })));
    svg.appendChild(S.line(gx0, G2Y(1), gx1, G2Y(1), 's-axis s-dash'));
    svg.appendChild(S.text(gx0 + 6, G2Y(1) - 8, 'total probability = 1', 's-lbl-p', 'start'));

    var mark1 = S.line(0, g1T, 0, g1B, 's-axis s-dash');
    var mark2 = S.line(0, g2T, 0, g2B, 's-axis s-dash');
    svg.appendChild(mark1); svg.appendChild(mark2);

    var gRead = S.g({});
    svg.appendChild(gRead);
    var reads = [];
    for (i = 0; i < 4; i++) {
      var t = S.text(610, 528 + i * 24, '', 's-lbl', 'start');
      gRead.appendChild(t);
      reads.push(t);
    }

    var verdict = S.text(W / 2, 664,
      'what has to vanish is R² J, not J — the area of the sphere grows as R²',
      's-lbl-b', 'middle');
    verdict.setAttribute('font-size', '14');
    svg.appendChild(verdict);
    var verdict2 = S.text(W / 2, 692,
      'normalisability supplies that; “P → 0 at infinity” on its own does not',
      's-lbl', 'middle');
    svg.appendChild(verdict2);

    return function (p) {
      var R = M.lerp(0.35 * sig, RMAX, M.easeInOut(M.beat(p, 0.10, 0.90)));
      var rpx = M.map(R, 0, RMAX, 0, RPX);
      shell.setAttribute('r', rpx.toFixed(1));

      var jr = J1(R);
      var alen = M.clamp(jr / (kap * P1(0)) * 46, 1.5, 46);
      for (var k = 0; k < sArr.length; k++) {
        var th = sArr[k].th;
        var x1 = cx + Math.cos(th) * rpx, y1 = cy + Math.sin(th) * rpx;
        sArr[k].el.setAttribute('x1', x1.toFixed(1));
        sArr[k].el.setAttribute('y1', y1.toFixed(1));
        sArr[k].el.setAttribute('x2', (x1 + Math.cos(th) * alen).toFixed(1));
        sArr[k].el.setAttribute('y2', (y1 + Math.sin(th) * alen).toFixed(1));
        sArr[k].el.setAttribute('stroke-opacity',
          M.clamp(jr / (kap * P1(0)) * 3.4, 0.06, 1).toFixed(2));
      }

      mark1.setAttribute('x1', GX(R)); mark1.setAttribute('x2', GX(R));
      mark2.setAttribute('x1', GX(R)); mark2.setAttribute('x2', GX(R));

      rLbl.textContent = 'R = ' + R.toFixed(2) + ' σ      P(R) = ' + P1(R).toExponential(2);
      rLbl2.textContent = 'R² Jᵣ(R) = ' + (R * R * jr).toExponential(2) +
        '      flux = ' + Flux1(R).toExponential(2);

      reads[0].textContent = 'enclosed probability at this R = ' + Enclosed(R).toFixed(4);
      reads[1].textContent = 'normalisable ψ :  flux → ' + Flux1(RMAX).toExponential(2) +
        ' as R → ' + RMAX.toFixed(1) + 'σ';
      reads[2].textContent = '|ψ| ~ C/r :  P(R) = ' + P2(R).toExponential(2) +
        ' → 0,  but flux = ' + Flux2(R).toFixed(4);
      reads[3].textContent = 'that flux is 4πκ C² = ' + f2const.toFixed(4) +
        ' at every radius, for ever';

      S.op(gSphere, M.beat(p, 0.02, 0.14));
      S.op(f1, M.beat(p, 0.18, 0.30));
      S.op(f1Lbl, M.beat(p, 0.24, 0.34));
      S.op(mark1, M.beat(p, 0.16, 0.26));
      S.op(encPath, M.beat(p, 0.34, 0.46));
      S.op(mark2, M.beat(p, 0.34, 0.46));
      S.op(f2, M.beat(p, 0.52, 0.64));
      S.op(rLbl, M.beat(p, 0.20, 0.30));
      S.op(rLbl2, M.beat(p, 0.28, 0.38));
      S.op(rLbl3, M.beat(p, 0.36, 0.46));
      reads.forEach(function (r, j) { S.op(r, M.beat(p, 0.46 + j * 0.07, 0.58 + j * 0.07)); });
      S.op(verdict, M.beat(p, 0.84, 0.93));
      S.op(verdict2, M.beat(p, 0.90, 0.98));
    };
  });

  /* ================================================================ (7) === */
  /* Question 1.9.1, rebuilt. Two snapshots of a real evolving packet, the sign
     of dP/dt read off at x = 0, and the four options settled by continuity. */

  A.scene('question-191', function (root) {
    var W = 1120, H = 790;
    var svg = S.root(W, H,
      'Two snapshots of a probability density, at time zero and slightly later, with the ' +
      'height at x equals zero read off both curves, the current below, and the four ' +
      'options of the question marked true or false.');
    root.appendChild(svg);

    var X0 = -6, X1 = 6, NX = 260;
    var PK = makePacket(1.1, 0.55, 21, 0.55, X0, X1);
    var DT = 0.55;

    var px0 = 100, px1 = 1020;
    var pyT = 96, pyB = 330;
    var jy0 = 458, jhalf = 62;
    var PXf = function (x) { return M.map(x, X0, X1, px0, px1); };

    var pMax = 0, i, x;
    for (i = 0; i <= 120; i++) {
      x = X0 + (X1 - X0) * i / 120;
      pMax = Math.max(pMax, densityAt(PK, x, 0), densityAt(PK, x, DT));
    }
    var PY = function (v) { return M.map(v, 0, pMax * 1.18, pyB, pyT); };
    var jMax = 1e-9;
    for (i = 0; i <= 120; i++) {
      x = X0 + (X1 - X0) * i / 120;
      jMax = Math.max(jMax, Math.abs(currentAt(PK, x, 0)));
    }
    var JY = function (v) { return jy0 - (v / (jMax * 1.2)) * jhalf; };

    svg.appendChild(S.axes(px0, pyT - 20, px1, pyB, null, null));
    svg.appendChild(S.text(px0 - 8, pyT - 24, '|ψ|²', 's-lbl-p', 'end'));

    var c0 = S.path('', 's-prob');
    var c1 = S.path('', 's-prob');
    c1.setAttribute('stroke-dasharray', '7 5');
    c1.setAttribute('stroke', 'var(--quantum)');
    svg.appendChild(c0); svg.appendChild(c1);
    S.setD(c0, S.polyD(S.sample(NX, X0, X1, function (xx) {
      return [PXf(xx), PY(densityAt(PK, xx, 0))];
    })));
    S.setD(c1, S.polyD(S.sample(NX, X0, X1, function (xx) {
      return [PXf(xx), PY(densityAt(PK, xx, DT))];
    })));

    var P00 = densityAt(PK, 0, 0);
    var P0d = densityAt(PK, 0, DT);
    svg.appendChild(S.text(PXf(2.6), PY(pMax * 0.92), '|ψ(x, 0)|²', 's-lbl-p', 'start'));
    svg.appendChild(S.text(PXf(3.4), PY(pMax * 0.72), '|ψ(x, δt)|²', 's-lbl-q', 'start'));

    var axis0 = S.line(PXf(0), pyT - 20, PXf(0), pyB + 26, 's-axis s-dash');
    svg.appendChild(axis0);
    svg.appendChild(S.text(PXf(0), pyB + 44, 'x = 0', 's-lbl-b', 'middle'));

    var gGap = S.g({});
    svg.appendChild(gGap);
    gGap.appendChild(S.circle(PXf(0), PY(P00), 5, 's-fill-i'));
    var dot1 = S.circle(PXf(0), PY(P0d), 5, 's-fill-q');
    gGap.appendChild(dot1);
    var gapLine = S.line(PXf(0) - 26, PY(P00), PXf(0) - 26, PY(P0d), 's-fail');
    gGap.appendChild(gapLine);
    gGap.appendChild(S.text(PXf(0) - 36, (PY(P00) + PY(P0d)) / 2 + 4,
      'the curve drops here', 's-lbl-f', 'end'));

    /* J at t = 0, and its slope at x = 0. */
    svg.appendChild(S.line(px0, jy0, px1, jy0, 's-axis'));
    svg.appendChild(S.text(px0 - 8, jy0 + 4, 'J', 's-lbl-q', 'end'));
    var jPath = S.path('', 's-quantum');
    svg.appendChild(jPath);
    S.setD(jPath, S.polyD(S.sample(NX, X0, X1, function (xx) {
      return [PXf(xx), JY(currentAt(PK, xx, 0))];
    })));

    var hx = 0.01;
    var dJdx = (currentAt(PK, hx, 0) - currentAt(PK, -hx, 0)) / (2 * hx);
    var ht = 0.01;
    var dPdt = (densityAt(PK, 0, ht) - densityAt(PK, 0, -ht)) / (2 * ht);
    var dPdtFD = (P0d - P00) / DT;
    var resid = dPdt + dJdx;

    /* Tangent to J at x = 0, drawn from the computed slope. */
    var span = 1.6;
    var jAt0 = currentAt(PK, 0, 0);
    var tang = S.line(
      PXf(-span), JY(jAt0 - dJdx * span),
      PXf(span), JY(jAt0 + dJdx * span), 's-fail');
    svg.appendChild(tang);
    var tangLbl = S.text(PXf(span) + 12, JY(jAt0 + dJdx * span) + 4,
      'slope ∂J/∂x at x = 0', 's-lbl-f', 'start');
    svg.appendChild(tangLbl);

    var gRead = S.g({});
    svg.appendChild(gRead);
    [
      'from the figure:  |ψ(0, δt)|² − |ψ(0, 0)|² = ' + fmt(P0d - P00, 4) +
        '   over δt = ' + DT.toFixed(2),
      'so  ∂P/∂t ≈ ' + fmt(dPdtFD, 4) + '   (exact derivative at t = 0 : ' +
        fmt(dPdt, 4) + ')',
      'continuity gives  ∂J/∂x = −∂P/∂t = ' + fmt(-dPdt, 4) +
        ';  measured off J : ' + fmt(dJdx, 4),
      'residual  ∂P/∂t + ∂J/∂x = ' + ex(Math.abs(resid), 1)
    ].forEach(function (s, j) {
      gRead.appendChild(S.text(100, 556 + j * 24, s, j === 3 ? 's-lbl-w' : 's-lbl', 'start'));
    });

    var OPTS = [
      { k: '(A)', s: '∂P/∂t > 0', ok: dPdt > 0, x: 110, y: 690 },
      { k: '(B)', s: '∂P/∂t < 0', ok: dPdt < 0, x: 110, y: 722 },
      { k: '(C)', s: '∂J/∂x > 0', ok: dJdx > 0, x: 600, y: 690 },
      { k: '(D)', s: '∂J/∂x < 0', ok: dJdx < 0, x: 600, y: 722 }
    ];
    var gOpt = S.g({});
    svg.appendChild(gOpt);
    OPTS.forEach(function (o) {
      gOpt.appendChild(S.text(o.x, o.y, o.k, o.ok ? 's-lbl-q' : 's-lbl', 'start'));
      var t = S.text(o.x + 56, o.y, o.s, o.ok ? 's-lbl-b' : 's-lbl', 'start');
      t.setAttribute('font-size', '13');
      gOpt.appendChild(t);
      var v = S.text(o.x + 230, o.y, o.ok ? 'true' : 'false',
        o.ok ? 's-lbl-q' : 's-lbl-f', 'start');
      v.setAttribute('font-size', '13');
      gOpt.appendChild(v);
    });

    var note = S.text(W / 2, 764,
      'A and D stand or fall together, and so do B and C; a mixed answer contradicts continuity',
      's-lbl-b', 'middle');
    svg.appendChild(note);

    return function (p) {
      S.op(c0, M.beat(p, 0.03, 0.14));
      S.op(c1, M.beat(p, 0.14, 0.26));
      S.op(axis0, M.beat(p, 0.24, 0.34));
      S.op(gGap, M.beat(p, 0.30, 0.42));
      S.op(jPath, M.beat(p, 0.42, 0.54));
      S.op(tang, M.beat(p, 0.52, 0.62));
      S.op(tangLbl, M.beat(p, 0.54, 0.64));
      S.op(gRead, M.beat(p, 0.60, 0.72));
      S.op(gOpt, M.beat(p, 0.74, 0.86));
      S.op(note, M.beat(p, 0.88, 0.97));
    };
  });
})(window.A = window.A || {});
