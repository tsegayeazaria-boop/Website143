/* The dependency map on the contents page. Mathematics on the left, physics on
   the right, an edge wherever a page is used by name. Edges draw themselves as
   the figure comes into view; hovering a section lights up everything it
   touches, so you can see at a glance what a page rests on. */
(function (A) {
  'use strict';
  var M = A.math, S = A.svg;

  A.scene('dep-map', function (root, api) {
    var W = 900, H = 520;
    var svg = S.root(W, H, 'A map of which mathematics sections feed which physics sections.');
    S.defsArrows(svg);
    root.appendChild(svg);

    var maths = A.toc.pages.filter(function (p) { return p.part === 1; });
    var phys = A.toc.pages.filter(function (p) { return p.part === 2; });

    var colL = 190, colR = 640, top = 70;
    var gapL = (H - 2 * top) / Math.max(1, maths.length - 1);
    var gapR = (H - 2 * top) / Math.max(1, phys.length - 1);

    var pos = {};
    maths.forEach(function (p, i) { pos[p.id] = { x: colL, y: top + i * gapL, side: 'L' }; });
    phys.forEach(function (p, i) { pos[p.id] = { x: colR, y: top + i * gapR, side: 'R' }; });

    svg.appendChild(S.text(colL, 34, 'mathematics', 's-lbl-w', 'middle'));
    svg.appendChild(S.text(colR, 34, 'physics', 's-lbl-q', 'middle'));

    /* Every edge is read from the contents itself, so the picture cannot drift
       out of step with the pages. */
    var edges = [];
    A.toc.pages.forEach(function (p) {
      p.feeds.forEach(function (to) {
        if (!pos[p.id] || !pos[to]) return;
        edges.push({ from: p.id, to: to, cross: pos[p.id].side !== pos[to].side });
      });
    });

    var gEdges = S.g({});
    svg.appendChild(gEdges);
    var edgeEls = edges.map(function (e) {
      var a = pos[e.from], b = pos[e.to];
      var d;
      if (e.cross) {
        var mx = (a.x + b.x) / 2;
        d = 'M' + (a.x + 62) + ' ' + a.y + 'C' + (mx) + ' ' + a.y + ' ' + (mx) + ' ' + b.y +
            ' ' + (b.x - 66) + ' ' + b.y;
      } else {
        var bend = a.side === 'L' ? -78 : 78;
        d = 'M' + (a.x + (a.side === 'L' ? -62 : 62)) + ' ' + a.y +
            'C' + (a.x + bend) + ' ' + a.y + ' ' + (b.x + bend) + ' ' + b.y +
            ' ' + (b.x + (b.side === 'L' ? -62 : 62)) + ' ' + b.y;
      }
      var p = S.path(d, e.cross ? 's-wave' : 's-ghost');
      p.setAttribute('stroke-width', e.cross ? '1.4' : '1');
      p.setAttribute('stroke-opacity', '0.55');
      if (!e.cross) p.setAttribute('stroke-dasharray', '4 5');
      gEdges.appendChild(p);
      return { el: p, e: e };
    });

    var nodeEls = {};
    A.toc.pages.forEach(function (p) {
      var q = pos[p.id];
      if (!q) return;
      var g = S.el('a', { href: p.file, class: 's-grab' });
      var box = S.rect(q.x - 60, q.y - 17, 120, 34, 's-ghost');
      box.setAttribute('rx', '3');
      box.setAttribute('fill', 'var(--surface)');
      box.setAttribute('stroke', 'var(--hairline-2)');
      g.appendChild(box);
      g.appendChild(S.text(q.x, q.y - 2, p.num, p.part === 1 ? 's-lbl-w' : 's-lbl-q', 'middle'));
      var t = S.text(q.x, q.y + 11, shorten(p.title), 's-tick', 'middle');
      g.appendChild(t);
      svg.appendChild(g);
      nodeEls[p.id] = { g: g, box: box };

      g.addEventListener('pointerenter', function () { highlight(p.id); });
      g.addEventListener('pointerleave', function () { highlight(null); });
      g.addEventListener('focus', function () { highlight(p.id); });
      g.addEventListener('blur', function () { highlight(null); });
    });

    function shorten(s) {
      var t = s.replace(/^(The|A) /, '');
      return t.length > 22 ? t.slice(0, 21) + '…' : t;
    }

    function highlight(id) {
      edgeEls.forEach(function (x) {
        var on = !id || x.e.from === id || x.e.to === id;
        x.el.setAttribute('stroke-opacity', on ? (id ? '1' : '0.55') : '0.12');
        x.el.setAttribute('stroke-width', (id && on) ? '2.4' : (x.e.cross ? '1.4' : '1'));
      });
      Object.keys(nodeEls).forEach(function (k) {
        var near = !id || k === id || edges.some(function (e) {
          return (e.from === id && e.to === k) || (e.to === id && e.from === k);
        });
        nodeEls[k].box.setAttribute('stroke', near ? (k === id ? 'var(--wave)' : 'var(--hairline-2)') : 'var(--hairline)');
        S.op(nodeEls[k].g, near ? 1 : 0.35);
      });
    }

    var key = S.text(W / 2, H - 16,
      'solid: a physics page uses this mathematics    dashed: one physics page needs another first',
      's-lbl', 'middle');
    svg.appendChild(key);

    return function (p) {
      /* Draw the edges in as the figure arrives, then leave them be. */
      var reveal = api.reduced ? 1 : M.beat(p, 0.05, 0.75);
      edgeEls.forEach(function (x, i) {
        var q = M.beat(reveal, i / (edgeEls.length + 4), 1);
        /* Solid edges draw themselves along their length; the dashed ones
           would lose their dashes to the same trick, so they just fade. */
        if (x.e.cross) S.draw(x.el, q);
        x.el.style.opacity = String(M.clamp(q * 1.2, 0, 1));
      });
      S.op(key, M.beat(p, 0.6, 0.9));
    };
  });
})(window.A = window.A || {});
