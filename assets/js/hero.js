/* Hero signature: "Movement" is a mass on a spring.
   Entry: trajectory computed once from the closed-form solution (zeta 0.5, settle 0.7 s) and played
   with the Web Animations API (compositor, no rAF on load). Afterwards: stillness, until the visitor
   drags the word; on release it returns with the pointer's own velocity (Elatirio). */
(function () {
  'use strict';
  var hero = document.getElementById('top'), w = document.getElementById('moveWord');
  if (!hero || !w) return;
  var ZETA = .5, TS = .7, DELAY = 680, LIMIT = 72;
  var entered = false;

  function entry() {
    hero.classList.add('hero-in');
    if (!w.animate || window.Elatirio.reduced()) { entered = true; return; }
    var k = matchMedia('(max-width: 768px), (hover: none)').matches ? .78 : 1, x0 = -Math.min(80, hero.clientWidth * .12), wn = Elatirio.wn(ZETA, TS), T = TS * 1.1, frames = [];
    for (var t = 0; t < T; t += .02) frames.push({ transform: 'translateX(' + Elatirio.analytic(ZETA, wn, x0, 0, t).toFixed(2) + 'px)', offset: t / T });
    frames.push({ transform: 'translateX(0px)', offset: 1 });
    w.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: DELAY * k, fill: 'both', easing: 'ease-out' });
    var a = w.animate(frames, { duration: T * 1000, delay: DELAY * k, fill: 'both', easing: 'linear' });
    a.onfinish = function () { a.cancel(); entered = true; startLife(); };
    a.oncancel = function () { entered = true; };
  }

  var spring = Elatirio.create({ zeta: ZETA, ts: TS, value: 0, precision: .05,
    onUpdate: function (x) { w.style.transform = 'translateX(' + x.toFixed(2) + 'px)'; } });
  var trk = Elatirio.tracker(), drag = false, sx = 0, bx = 0;
  function limited(v) { var a = Math.abs(v); return a <= LIMIT ? v : Math.sign(v) * (LIMIT + (a - LIMIT) * .35); }
  w.addEventListener('pointerdown', function (e) {
    if (!entered) return;
    drag = true; spring.stop(); sx = e.clientX; bx = spring.value;
    try { w.setPointerCapture(e.pointerId); } catch (_) {}
    w.classList.add('grabbing'); trk.reset(); trk.add(e.clientX, performance.now());
  });
  w.addEventListener('pointermove', function (e) {
    if (!drag) return;
    spring.jump(limited(bx + e.clientX - sx)); trk.add(e.clientX, performance.now());
  });
  function release() {
    if (!drag) return;
    drag = false; w.classList.remove('grabbing');
    spring.impulse(trk.velocity() * .5).set(0);
  }
  w.addEventListener('pointerup', release);
  w.addEventListener('pointercancel', release);

  /* ---- life cycle: the hero keeps breathing while it is on screen ----
     Period 6.47 s split by the golden ratio: 2.47 s of motion, 4.00 s of rest (4.00 / 2.47 = 1.618).
     t = 0      "Movement" gets a push and returns on its spring (the word does what it says)
     t = 0      the portrait breathes in and out over the whole active phase (scale 1 → 1.035 → 1)
     t = 1.53 s (2.47 / φ) the main button leans towards the visitor and settles (whole button, never the icon)
     Off screen, hidden tab, reduced motion or the pause button = no cycle (WCAG 2.2.2, ΜΗ-37). */
  var PHI = 1.618, ACTIVE = 2470, PERIOD = Math.round(ACTIVE * (1 + PHI)), lifeT = null, onScreen = true, paused = false;
  var photo = hero.querySelector('.hero-photo img'), btn = hero.querySelector('.h-btn'), tog = document.getElementById('motionToggle');
  function springFrames(z, ts, x0, prop) {
    var wn = Elatirio.wn(z, ts), T = ts * 1.15, f = [];
    for (var t = 0; t < T; t += .02) f.push({ transform: 'translateX(' + Elatirio.analytic(z, wn, x0, 0, t).toFixed(2) + 'px)', offset: t / T });
    f.push({ transform: 'translateX(0px)', offset: 1 });
    return { frames: f, ms: T * 1000 };
  }
  var kick = null, lean = null;
  function pulse() {
    if (paused || !onScreen || document.hidden || drag) return;
    kick = kick || springFrames(.45, .9, -Math.min(34, hero.clientWidth * .05));
    lean = lean || springFrames(.6, .7, 10);
    w.animate(kick.frames, { duration: kick.ms, easing: 'linear' });
    if (photo) photo.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' }], { duration: ACTIVE, easing: 'cubic-bezier(.45,0,.55,1)' });
    if (btn) btn.animate(lean.frames, { duration: lean.ms, delay: Math.round(ACTIVE / PHI), easing: 'linear' });
  }
  function startLife() {
    if (lifeT || Elatirio.reduced()) return;
    lifeT = setInterval(pulse, PERIOD);
  }
  function stopAll() { [w, photo, btn].forEach(function (el) { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { if (!(a instanceof CSSAnimation)) a.cancel(); }); }); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (!onScreen) stopAll(); }, { threshold: .3 }).observe(hero);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });
  if (tog) {
    if (Elatirio.reduced()) tog.hidden = true;
    tog.addEventListener('click', function () {
      paused = !paused; if (paused) stopAll();
      tog.setAttribute('aria-pressed', paused ? 'true' : 'false');
      tog.setAttribute('aria-label', tog.getAttribute(paused ? 'data-play' : 'data-pause'));
      tog.classList.toggle('is-paused', paused);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(entry); });
  else requestAnimationFrame(entry);
})();
