/* The Inward Lab: nav, progress, reveals, FAQ, testimonials. No dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  window.__inwardReady = true;                         /* keeps html.anim-ready (hidden states) alive */
  var mqR = window.matchMedia('(prefers-reduced-motion: reduce)');
  function syncReduce() { root.classList.toggle('reduce', mqR.matches); }
  syncReduce(); if (mqR.addEventListener) mqR.addEventListener('change', syncReduce);

  /* ---- one shared scroll frame: a single read per frame, writes only transform / class ---- */
  var nav = doc.getElementById('nav'), bar = doc.getElementById('progress'), tick = false, lastY = 0;
  function frame() {
    tick = false;
    var y = window.pageYOffset, max = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    nav.classList.toggle('scrolled', y > 40);
    if (menuOpen && Math.abs(y - lastY) > 12) closeMenu(false);   /* scrolling closes the panel */
  }
  function onScroll() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---- mobile menu: right-hand panel, X, scrim, Esc, swipe, scroll ---- */
  var panel = doc.getElementById('navLinks'), burger = doc.getElementById('burger'),
      scrim = doc.getElementById('scrim'), closeBtn = doc.getElementById('navClose'), menuOpen = false;
  function openMenu() {
    menuOpen = true; lastY = window.pageYOffset;
    panel.classList.add('open'); scrim.classList.add('on');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
    setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 50);
  }
  function closeMenu(refocus) {
    if (!menuOpen) return;
    menuOpen = false;
    panel.classList.remove('open'); scrim.classList.remove('on');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
    if (refocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu(true) : openMenu(); });
  closeBtn.addEventListener('click', function () { closeMenu(true); });
  scrim.addEventListener('click', function () { closeMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
  var tx = 0;
  panel.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', function (e) { if (Math.abs(e.changedTouches[0].clientX - tx) > 60) closeMenu(false); }, { passive: true });
  window.matchMedia('(min-width: 941px)').addEventListener('change', function (e) { if (e.matches) closeMenu(false); });

  /* ---- kindle: split a statement into words so each can light up in turn ---- */
  function splitWords(el) {
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var s = doc.createElement('span'); s.textContent = p; s.className = 'kw'; s.setAttribute('data-v', 'kindle'); words.push(s); frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    var step = Math.min(28, 1000 / Math.max(words.length, 1));
    words.forEach(function (s, i) { s.style.setProperty('--d', Math.round(i * step) + 'ms'); });
  }
  [].forEach.call(doc.querySelectorAll('[data-kindle]'), splitWords);

  /* ---- testimonials: manual, one at a time (all stacked without JS) ---- */
  var tl = doc.getElementById('testiList'), tn = doc.getElementById('testiNav');
  if (tl && tn) {
    var items = [].slice.call(tl.querySelectorAll('.testi-item')), cur = 0;
    items.forEach(function (it) { it.removeAttribute('data-v'); });
    tl.closest('.testi').classList.add('js-testi');
    var dots = items.map(function (it, i) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'testi-dot';
      b.setAttribute('aria-label', 'Testimonial ' + (i + 1) + ' of ' + items.length);
      b.addEventListener('click', function () { show(i); }); tn.appendChild(b); return b;
    });
    function show(i) {
      cur = i;
      items.forEach(function (it, j) { it.hidden = j !== i; });
      dots.forEach(function (d, j) { d.setAttribute('aria-current', j === i ? 'true' : 'false'); });
    }
    tn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show((cur + 1) % items.length); dots[cur].focus(); }
      if (e.key === 'ArrowLeft') { show((cur + items.length - 1) % items.length); dots[cur].focus(); }
    });
    show(0);
  }

  /* ---- FAQ ---- */
  var faq = [].slice.call(doc.querySelectorAll('.faq-item'));
  faq.forEach(function (it, i) {
    it.classList.add('js');
    var b = it.querySelector('.faq-q');
    function set(open) { it.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    set(i === 0);
    b.addEventListener('click', function () { set(!it.classList.contains('open')); });
  });

  /* ---- reveals: start BEFORE the element enters (bottom margin +12%), <= 2 x 60 ms stagger inside one batch ---- */
  var els = [].slice.call(doc.querySelectorAll('[data-v]'));
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        if (!el.style.getPropertyValue('--d')) { el.style.setProperty('--d', Math.min(n, 2) * 60 + 'ms'); n++; }
        el.classList.add('in');
      });
    }, { rootMargin: '0px 0px 12% 0px', threshold: 0 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---- section highlight in the nav ---- */
  var links = [].slice.call(doc.querySelectorAll('#navLinks a[href^="#"]:not(.btn)'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { var s = doc.querySelector(a.getAttribute('href')); if (s) map[s.id] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[en.target.id]; if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { so.observe(doc.getElementById(id)); });
  }
  onScroll();
})();
