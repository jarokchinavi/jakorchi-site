/* Front page behaviour: theme buttons, "coming soon" popups, the shared popup layer (JK.ui). The settings page is in settings.js. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var T = function (k) { return JK.i18n.T(k); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var layer = $("#layer"), box = $("#box"), lastFocus = null, current = null;

  /* ---- popup layer (one at a time; the phone's back button closes it) ---- */
  function show(html, render) {
    current = render || function () { return html; };
    box.innerHTML = current();
    if (layer.hidden) {
      lastFocus = document.activeElement;
      layer.hidden = false;
      try { history.pushState({ jk: 1 }, ""); } catch (e) {}
    }
    var f = box.querySelector("button"); if (f) f.focus();
  }
  function hide() { layer.hidden = true; current = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function close() { if (layer.hidden) return; if (history.state && history.state.jk) history.back(); else hide(); }
  window.addEventListener("popstate", function () { if (!layer.hidden) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  layer.addEventListener("click", function (e) { if (e.target === layer) close(); });
  JK.layerOpen = function () { return !layer.hidden; };
  JK.ui = {
    show: show, close: close, esc: esc,
    isOpen: function () { return !layer.hidden; },
    refresh: function () { if (current) { box.innerHTML = current(); var f = box.querySelector('[aria-pressed="true"]'); if (f) f.focus(); } }
  };

  function soon(name) {
    var account = /^(Sign in|Create account|Change email|Change password)$/.test(name);
    show("", function () {
      return '<h2>' + esc(T(name)) + '</h2><span class="badge">' + esc(T("Coming soon")) + '</span>' +
        (account ? '<p>' + esc(T("Account sync is still being built.")) + '</p>' : '') +
        '<button type="button" class="btn" data-close>' + esc(T("Got it")) + '</button>';
    });
  }
  /* ---- theme buttons ---- */
  function markTheme() {
    var t = JKTheme.get();
    document.querySelectorAll("[data-theme-set]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.themeSet === t)); });
  }

  /* ---- clicks ---- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-close")) close();
    else if (b.dataset.soon) soon(b.dataset.soon);
    else if (b.id === "openSettings") JK.settings.open();
    else if (b.dataset.themeSet) { JKTheme.set(b.dataset.themeSet); markTheme(); }
  });

  markTheme();
  JKAuth.refresh();
})();
