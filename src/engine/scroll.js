/* Scroll runtime. One rAF loop reads a cached scroll position and hands each
   visible scene a 0 -> 1 progress value over its own range. No scroll-jacking:
   the page scrolls normally and the visuals follow. */
(function (A) {
  'use strict';
  var M = A.math;
  var scenes = {};
  var mounted = [];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  A.scene = function (id, fn) { scenes[id] = fn; };
  A.registry = scenes;

  /* ---------------------------------------------------------------- theme */
  function initTheme() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var stored = null;
    try { stored = localStorage.getItem('atlas-theme'); } catch (e) { /* private mode */ }
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
    function label() {
      var explicit = document.documentElement.getAttribute('data-theme');
      var dark = explicit ? explicit === 'dark'
        : !window.matchMedia('(prefers-color-scheme: light)').matches;
      btn.textContent = dark ? 'Light' : 'Dark';
      btn.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme');
    }
    btn.addEventListener('click', function () {
      var explicit = document.documentElement.getAttribute('data-theme');
      var dark = explicit ? explicit === 'dark'
        : !window.matchMedia('(prefers-color-scheme: light)').matches;
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('atlas-theme', next); } catch (e) { /* ignore */ }
      label();
      mounted.forEach(function (m) { if (m.api.onTheme) m.api.onTheme(); });
    });
    label();
  }

  /* --------------------------------------------------------------- reveal */
  function initReveal() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.setAttribute('data-shown', '1'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.setAttribute('data-shown', '1');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ----------------------------------------------------------- the rail */
  var rail = null;
  function initRail() {
    var track = document.querySelector('.rail__track');
    if (!track) return;
    var fill = document.querySelector('.rail__fill');
    var label = document.querySelector('.rail__label');
    var pct = document.querySelector('.rail__pct');
    var now = document.querySelector('.toolbar__now');
    var marks = [].slice.call(document.querySelectorAll('[data-section]')).map(function (el) {
      return { el: el, name: el.getAttribute('data-section'), tick: null };
    });
    marks.forEach(function (m) {
      var t = document.createElement('div');
      t.className = 'rail__tick';
      track.appendChild(t);
      m.tick = t;
    });
    rail = { fill: fill, label: label, pct: pct, now: now, marks: marks, track: track };
    layoutRail();
  }
  function layoutRail() {
    if (!rail) return;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    rail.marks.forEach(function (m) {
      var top = m.el.getBoundingClientRect().top + window.scrollY;
      m.pos = M.clamp(top / docH, 0, 1);
      m.tick.style.top = (m.pos * 100) + '%';
    });
  }
  function updateRail(y, docH) {
    if (!rail) return;
    var f = docH > 0 ? M.clamp(y / docH, 0, 1) : 0;
    rail.fill.style.height = (f * 100) + '%';
    if (rail.pct) rail.pct.textContent = Math.round(f * 100) + '%';
    var cur = null;
    for (var i = 0; i < rail.marks.length; i++) {
      var m = rail.marks[i];
      var passed = f >= m.pos - 0.001;
      m.tick.setAttribute('data-passed', passed ? '1' : '0');
      if (passed) cur = m;
    }
    var name = cur ? cur.name : '';
    if (rail.label && rail.label.textContent !== name) rail.label.textContent = name;
    if (rail.now && rail.now.textContent !== name) rail.now.textContent = name;
  }

  /* --------------------------------------------------------- progress src */
  /* A stage: progress runs 0 at the moment its sticky pin locks, 1 when it
     releases. An inline figure: progress ramps as it crosses the viewport. */
  function progressFor(m) {
    var vh = window.innerHeight;
    var host = m.host;
    var r = host.getBoundingClientRect();
    if (m.kind === 'stage') {
      var span = r.height - vh;
      if (span <= 0) return M.clamp(1 - (r.top + r.height) / (vh + r.height), 0, 1);
      return M.clamp(-r.top / span, 0, 1);
    }
    var enter = vh * 0.92;
    var span2 = r.height * 0.55 + vh * 0.42;
    return M.clamp((enter - r.top) / span2, 0, 1);
  }

  /* ---------------------------------------------------------- mount pass */
  function mountAll() {
    var nodes = [].slice.call(document.querySelectorAll('[data-scene]'));
    nodes.forEach(function (node) {
      var id = node.getAttribute('data-scene');
      var fn = scenes[id];
      if (!fn) { console.error('[atlas] no scene registered for id: ' + id); return; }
      var stage = node.closest('.stage');
      var api = {
        id: id,
        reduced: reduced.matches,
        /* Scenes call this when their own drawing depends on theme colours. */
        onTheme: null
      };
      var update;
      try {
        update = fn(node, api) || function () {};
      } catch (err) {
        console.error('[atlas] scene "' + id + '" failed to mount:', err);
        return;
      }
      var rec = {
        id: id, node: node, api: api, update: update,
        host: stage || node.closest('.fig') || node,
        kind: stage ? 'stage' : 'inline',
        visible: false, t0: performance.now(), maxP: 0
      };
      mounted.push(rec);
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < mounted.length; i++) {
            if (mounted[i].host === e.target) { mounted[i].visible = e.isIntersecting; break; }
          }
        });
      }, { rootMargin: '25% 0px 25% 0px' });
      mounted.forEach(function (m) { io.observe(m.host); });
    } else {
      mounted.forEach(function (m) { m.visible = true; });
    }
    window.__atlasScenes = mounted;
  }

  /* --------------------------------------------------------------- loop */
  var y = 0, docH = 0, toolbar = null, ticking = false;

  function measure() {
    docH = document.documentElement.scrollHeight - window.innerHeight;
    layoutRail();
  }

  function frame(now) {
    y = window.scrollY || window.pageYOffset || 0;
    updateRail(y, docH);
    if (toolbar) toolbar.setAttribute('data-scrolled', y > 24 ? '1' : '0');
    for (var i = 0; i < mounted.length; i++) {
      var m = mounted[i];
      if (!m.visible) continue;
      var p = progressFor(m);
      if (p > m.maxP) m.maxP = p;
      try {
        m.update(p, (now - m.t0) / 1000);
      } catch (err) {
        if (!m.errored) { m.errored = true; console.error('[atlas] scene "' + m.id + '" update failed:', err); }
      }
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    toolbar = document.querySelector('.toolbar');
    initTheme();
    initReveal();
    initRail();
    mountAll();
    measure();
    window.addEventListener('resize', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        measure();
        mounted.forEach(function (m) { if (m.api.onResize) m.api.onResize(); });
        ticking = false;
      });
    }, { passive: true });
    /* Fonts land after first paint and change layout; re-measure once they do. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    setTimeout(measure, 400);
    requestAnimationFrame(frame);
    document.documentElement.setAttribute('data-atlas-ready', '1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.A = window.A || {});
