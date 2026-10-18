/* Booking popup (Cal.com). Loaded only when build.py → BOOKING has a Cal.com link (#bookingCfg present).
   Nothing from Cal.com is fetched until the visitor presses a booking button; every button is also a plain
   link to the Cal.com page, so without JavaScript (or if Cal.com fails to load) booking still works. */
(function () {
  'use strict';
  var cfgEl = document.getElementById('bookingCfg');
  if (!cfgEl) return;
  var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (_) { return; }
  var ready = false, loading = null;

  function load() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      /* official Cal.com embed loader (queue until embed.js arrives) */
      (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; var s = d.createElement('script'); s.src = A; s.onerror = reject; s.onload = function () { ready = true; resolve(); }; d.head.appendChild(s); cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, cfg.embed, 'init');
      window.Cal('init', 'inward', { origin: cfg.origin });
      window.Cal.ns.inward('ui', { theme: 'light', hideEventTypeDetails: false, layout: 'month_view',
        cssVarsPerTheme: { light: { 'cal-brand': cfg.brand } } });
    });
    return loading;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-cal-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;   // new tab / window: plain link
    e.preventDefault();
    a.classList.add('cal-loading');
    var open = function () {
      a.classList.remove('cal-loading');
      window.Cal.ns.inward('modal', { calLink: a.getAttribute('data-cal-link'), config: { layout: 'month_view', theme: 'light' } });
    };
    var fallback = setTimeout(function () { location.href = a.href; }, 6000);   // Cal.com unreachable: go to the page
    load().then(function () { clearTimeout(fallback); open(); }, function () { clearTimeout(fallback); location.href = a.href; });
  });
  /* warm up on intent (hover/focus) so the popup opens without a wait */
  ['pointerenter', 'focusin'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!ready && e.target.closest && e.target.closest('a[data-cal-link]')) load(); }, true);
  });
})();
