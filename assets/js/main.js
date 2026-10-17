/* The Inward Lab: nav, progress, FAQ, form topic (section motion: xoro.js). No dependencies. */
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
  var panel = doc.getElementById('navLinks'), burger = doc.getElementById('hamburger'),
      scrim = doc.getElementById('scrim'), closeBtn = doc.getElementById('navClose'), menuOpen = false;
  var openLabel = burger.getAttribute('aria-label');
  function openMenu() {
    menuOpen = true; lastY = window.pageYOffset;
    panel.classList.add('open'); scrim.classList.add('on');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', burger.getAttribute('data-close') || 'Close menu');
    setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 50);
  }
  function closeMenu(refocus) {
    if (!menuOpen) return;
    menuOpen = false;
    panel.classList.remove('open'); scrim.classList.remove('on');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', openLabel);
    if (refocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu(true) : openMenu(); });
  closeBtn.addEventListener('click', function () { closeMenu(true); });
  scrim.addEventListener('click', function () { closeMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
  var tx = 0;
  /* swipe left or right anywhere while the panel is open closes it */
  doc.addEventListener('touchstart', function (e) { if (menuOpen) tx = e.touches[0].clientX; }, { passive: true });
  doc.addEventListener('touchend', function (e) { if (menuOpen && Math.abs(e.changedTouches[0].clientX - tx) > 60) closeMenu(false); }, { passive: true });
  window.matchMedia('(min-width: 941px)').addEventListener('change', function (e) { if (e.matches) closeMenu(false); });

  /* ---- submenu button (desktop): click/tap toggles, Esc and outside click close ---- */
  [].forEach.call(doc.querySelectorAll('.nav-sub-t'), function (b) {
    var box = b.parentNode;
    b.addEventListener('click', function () { var o = !box.classList.contains('open'); box.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    doc.addEventListener('click', function (e) { if (!box.contains(e.target)) { box.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { box.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---- links that open the form with a topic chosen ---- */
  var sel = doc.getElementById('serviceSelect');
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('[data-subject]'); if (!a || !sel) return;
    var want = a.getAttribute('data-subject').toLowerCase();
    [].forEach.call(sel.options, function (o, i) { if (o.text.toLowerCase() === want) sel.selectedIndex = i; });
  });

  /* ---- contact page: ?topic=N pre-selects the form topic (links from service pages) ---- */
  if (sel) {
    var m = /[?&]topic=(\d+)/.exec(location.search);
    if (m && sel.options[+m[1]]) sel.selectedIndex = +m[1];
  }

  /* ---- Expertease credit: its short loop runs only once the footer is on screen (KN6) ---- */
  var ec = doc.getElementById('ecCredit');
  if (ec && 'IntersectionObserver' in window) {
    var eo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { ec.classList.add('ec-on'); eo.disconnect(); } }); }, { threshold: .5 });
    eo.observe(ec);
  } else if (ec) ec.classList.add('ec-on');

  /* ---- FAQ ---- */
  var faq = [].slice.call(doc.querySelectorAll('.faq-item'));
  faq.forEach(function (it, i) {
    it.classList.add('js');
    var b = it.querySelector('.faq-q');
    function set(open) { it.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    set(i === 0);
    b.addEventListener('click', function () { set(!it.classList.contains('open')); });
  });

  /* ---- section highlight in the nav ---- */
  var links = [].slice.call(doc.querySelectorAll('#navLinks a[href^="#"]:not(.btn):not(.lang-btn)'));
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
