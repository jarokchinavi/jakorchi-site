/* Settings page: profile (only when signed in), Plus, appearance, language + map language, storage, about. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var T = function (k) { return JK.i18n.T(k); };
  var esc = JK.ui.esc;
  var page = $("#settings"), body = $("#stBody"), home = $("#home"), toast = $("#toast");
  var armed = false, armTimer = 0, toastTimer = 0;

  var load = function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  var save = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  function user() { var u = load("jk_user", null); return u && typeof u === "object" ? u : null; }
  function langName(c) { var l = JK.i18n.LANGS.filter(function (x) { return x[0] === c; })[0]; return l ? l[1] : c; }
  function mapValue() { var v = load("jk_maplet", "auto"); return v === "auto" || v === "latin" || JK.i18n.LANGS.some(function (x) { return x[0] === v; }) ? v : "auto"; }
  function mapName(v) { return v === "auto" ? T("Same as app") : v === "latin" ? "Latin (A–Z)" : langName(v); }

  function row(attr, label, value, cls, icon) {
    return '<button type="button" class="row ' + (cls || "") + '" ' + attr + '>' + (icon ? JK.ic(icon) : "") + '<span class="l">' + esc(label) + '</span><span class="v">' + (value || "") + '<i class="chev" aria-hidden="true"></i></span></button>';
  }
  function head(t) { return '<h2>' + esc(t) + '</h2>'; }
  function grp(rows) { return '<div class="grp">' + rows + '</div>'; }

  function render() {
    var signed = JKAuth.signedIn(), u = user() || {}, th = JKTheme.get(), h = "";
    /* profile: the account options exist only when signed in */
    h += head(T("Profile"));
    if (signed) {
      var name = u.name || u.email || "", init = (name.trim().charAt(0) || "J").toUpperCase();
      h += grp('<div class="me"><div class="av" aria-hidden="true">' + esc(init) + '</div><div>' +
        (u.name ? '<b>' + esc(u.name) + '</b>' : '') + (u.email ? '<small>' + esc(u.email) + '</small>' : '') + '</div></div>' +
        row('data-soon="Change email"', T("Change email"), "", "", "mail") + row('data-soon="Change password"', T("Change password"), "", "", "lock") +
        row("data-signout", T("Sign out"), "", "", "out"));
    } else {
      h += grp('<div class="row">' + JK.ic("user") + '<span class="l">' + esc(T("Not signed in")) + '</span><span class="badge">' + esc(T("Coming soon")) + '</span></div>' +
        row('data-soon="Sign in"', T("Sign in"), "", "gold") + row('data-soon="Create account"', T("Create account"), "", "gold"));
    }
    /* Jakorchi Plus: empty on purpose for now */
    h += '<button type="button" class="plusc" data-soon="Jakorchi Plus"><span class="pn">Jakorchi Plus</span><span class="soonb">' + esc(T("Coming soon")) + '</span></button>';
    /* appearance */
    h += head(T("Appearance")) + '<div class="sseg" role="group">' +
      [["light", "Light", "sun"], ["dark", "Dark", "moon"], ["auto", "System", "pc"]].map(function (x) { return '<button type="button" data-theme-set="' + x[0] + '" aria-pressed="' + (x[0] === th) + '">' + JK.ic(x[2]) + esc(T(x[1])) + '</button>'; }).join("") + '</div>';
    /* language + map language */
    h += head(T("Language")) + grp(row('data-open="lang"', T("Language"), esc(langName(JK.i18n.get())), "", "globe") +
      row('data-open="map"', T("Map language"), esc(mapName(mapValue())), "", "pin")) + '<p class="note">' + esc(T("Choose the language of the names on the map.")) + '</p>';
    /* storage */
    h += head(T("Storage")) + grp(row('data-clear="cache"', T("Clear cache"), "", "", "trash") +
      row('data-clear="map"', armed ? T("Tap again to clear. Favorites and lists stay.") : T("Clear saved map data"), "", "", "layers"));
    /* about */
    h += head(T("About")) + grp('<button type="button" class="row" data-diag>' + JK.ic("info") + '<span class="l">' + esc(T("Version")) + '</span><span class="v">' + esc(BUILD) + '</span></button>') +
      '<p class="note">' + esc(T("Jakorchi is a free food guide for travelers in Japan, Korea and China. No account, no ads, no tracking.")) + '</p>';
    body.innerHTML = h;
  }
  /* ---- pickers (use the shared popup layer) ---- */
  function pickLang() {
    JK.ui.show("", function () {
      var cur = JK.i18n.get();
      return '<h2>' + esc(T("Language")) + '</h2><div class="langs">' + JK.i18n.LANGS.map(function (l) {
        return '<button type="button" data-pick-lang="' + l[0] + '" aria-pressed="' + (l[0] === cur) + '" lang="' + l[0] + '">' + esc(l[1]) + '</button>'; }).join("") +
        '</div><button type="button" class="btn" data-close>' + esc(T("Close")) + '</button>';
    });
  }
  function pickMap() {
    JK.ui.show("", function () {
      var cur = mapValue(), opts = [["auto", T("Same as app")], ["latin", "Latin (A–Z)"]].concat(JK.i18n.LANGS.map(function (l) { return [l[0], l[1]]; }));
      return '<h2>' + esc(T("Map language")) + '</h2><div class="langs">' + opts.map(function (o) {
        return '<button type="button" data-pick-map="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '"' + (o[0].length === 2 ? ' lang="' + o[0] + '"' : "") + '>' + esc(o[1]) + '</button>'; }).join("") +
        '</div><button type="button" class="btn" data-close>' + esc(T("Close")) + '</button>';
    });
  }

  /* ---- storage ---- */
  function flash(t, ms) { toast.textContent = t; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.hidden = true; }, ms || 2600); }
  /* Tap the version number = screen numbers (for phones we cannot test); numbers only, so no translation needed */
  function diag() {
    var p = document.createElement("div"); p.style.cssText = "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0";
    document.body.appendChild(p); var cs = getComputedStyle(p), top = cs.paddingTop, bot = cs.paddingBottom; p.remove();
    var m = document.querySelector('meta[name="theme-color"]');
    var pwa = (navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches)) ? 1 : 0;
    flash("v" + BUILD + " · win " + innerWidth + "×" + innerHeight + " · screen " + screen.width + "×" + screen.height + " · pwa " + pwa +
      " · safe top " + top + " bottom " + bot + " · bar " + (m ? m.content : "-") + " · bg " + getComputedStyle(document.body).backgroundColor + " · " + (JKTheme.get()), 12000);
  }
  function clearCache() {
    try { Object.keys(localStorage).filter(function (k) { return /^jk_c_/.test(k); }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    flash(T("Cache cleared."));
  }
  function clearMap() {
    if (!armed) { armed = true; render(); clearTimeout(armTimer); armTimer = setTimeout(function () { armed = false; if (!page.hidden) render(); }, 4000); return; }
    armed = false; clearTimeout(armTimer); render();
    (async function () {
      /* only the saved restaurant files and the map style; app files, favorites, lists and settings stay */
      try { var ks = await caches.keys(); for (var i = 0; i < ks.length; i++) { var c = await caches.open(ks[i]), rs = await c.keys(); for (var j = 0; j < rs.length; j++) if (new URL(rs[j].url).pathname.indexOf("/places/") === 0) await c.delete(rs[j]); } } catch (e) {}
      try { localStorage.removeItem("jk_style1"); } catch (e) {}
      flash(T("Saved map data cleared."));
    })();
  }

  /* ---- open / close (phone back button closes it) ---- */
  function open() {
    if (!page.hidden) return;
    page.hidden = false; home.hidden = true; render(); window.scrollTo(0, 0);
    try { history.pushState({ jk: "s" }, ""); } catch (e) {}
    var b = $("#settingsBack"); if (b) b.focus();
  }
  function closePage() { if (page.hidden) return; page.hidden = true; home.hidden = false; var g = $("#openSettings"); if (g) g.focus(); }
  window.addEventListener("popstate", function () { if (!page.hidden && !(history.state && history.state.jk === "s") && !JK.ui.isOpen()) closePage(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !page.hidden && !JK.ui.isOpen()) back(); });
  function back() { if (history.state && history.state.jk === "s") history.back(); else closePage(); }
  var prev = JK.layerOpen; JK.layerOpen = function () { return prev() || !page.hidden; };

  page.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "settingsBack") back();
    else if (b.dataset.open === "lang") pickLang();
    else if (b.dataset.open === "map") pickMap();
    else if (b.dataset.clear === "cache") clearCache();
    else if (b.dataset.clear === "map") clearMap();
    else if (b.hasAttribute("data-signout")) JKAuth.signOut();
    else if (b.hasAttribute("data-diag")) diag();
    else if (b.dataset.themeSet) setTimeout(render, 0);
  });
  document.getElementById("layer").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.pickLang) JK.i18n.set(b.dataset.pickLang).then(function () { JK.ui.refresh(); });
    else if (b.dataset.pickMap) { save("jk_maplet", b.dataset.pickMap); JK.ui.refresh(); if (!page.hidden) render(); }
  });
  document.addEventListener("jk:lang", function () { if (!page.hidden) render(); });
  document.addEventListener("jk:auth", function () { if (!page.hidden) render(); });

  JK.settings = { open: open };
})();
