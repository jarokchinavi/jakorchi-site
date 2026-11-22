/* About & privacy page: what is saved where, the account, what is sent, location, outside services. Opened from the menu and from Settings > About.
   One history step; phone back closes it. Keep the texts TRUE (docs/safety.md): when a service is added or removed, change "Other services". CONTACT = contact e-mail ("" hides the line). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var T = function (k) { return JK.i18n.T(k); };
  var esc = JK.ui.esc;
  var CONTACT = "";
  var page = $("#about"), body = $("#abBody"), settings = $("#settings"), from = "home";

  function sec(h, p) { return "<h2>" + esc(T(h)) + '</h2><div class="grp"><p class="abp">' + esc(T(p)) + "</p></div>"; }
  function render() {
    var c = CONTACT ? '<p class="abn">' + esc(T("Contact: {0}")).replace("{0}", '<a href="mailto:' + esc(CONTACT) + '">' + esc(CONTACT) + "</a>") + "</p>" : "";
    body.innerHTML = '<p class="abl">' + esc(T("Jakorchi is a free food guide for travelers in Japan, Korea and China. No ads, no tracking. An account is optional.")) + "</p>" +
      sec("On your phone", "Your language, theme, map position and saved places stay on this phone. Clearing your browser data removes them (not when they are also in your account).") +
      sec("Your account", "An account is optional. It keeps your email, your name and your saved places and lists, so you see them on every phone. Your password is handled by our login service (Supabase); we never see it. Signing out removes your saved places from this phone; they stay in your account.") +
      sec("What you send", "Reviews, photos, reports and places you add are saved in our database and shown to everyone. A random code from your phone is saved with them to stop spam. It is not shown to anyone and is not linked to your name. Location data is removed from photos.") +
      sec("Your location", "Your location is used on your phone to show where you are and how far places are. We do not save it.") +
      sec("Other services", "The map, search, fonts, map library and database come from other services: OpenFreeMap, OpenStreetMap, Google Fonts, unpkg, Supabase and Cloudflare. Like every website, they can see your internet address (IP). When you tap Navigate, the map app you choose opens with the place.") +
      c + '<p class="abn">' + esc(T("Map and place data © OpenStreetMap contributors (ODbL).")) + " " + esc(T("Places from OpenStreetMap are not checked by Jakorchi.")) + '</p><p class="abn">' + esc(T("Version")) + " " + esc(JK.build) + "</p>";
  }

  function open(f) {
    if (!page.hidden) return;
    from = f; page.hidden = false; JK.hideScreens(); settings.hidden = true; render(); window.scrollTo(0, 0);
    try { history.pushState({ jk: "a" }, ""); } catch (e) {}
    var b = $("#aboutBack"); if (b) b.focus();
  }
  function closePage() {
    if (page.hidden) return;
    page.hidden = true;
    if (from === "settings") { settings.hidden = false; document.dispatchEvent(new Event("jk:auth")); } else JK.showScreen();
  }
  function back() { if (history.state && history.state.jk === "a") history.back(); else closePage(); }

  window.addEventListener("popstate", function () { if (!page.hidden && !(history.state && history.state.jk === "a") && !JK.ui.isOpen()) closePage(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !page.hidden && !JK.ui.isOpen()) back(); });
  var prev = JK.layerOpen; JK.layerOpen = function () { return prev() || !page.hidden; };

  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-about")) {
      var f = !settings.hidden ? "settings" : "home";
      if (JK.sheet.isOpen()) { JK.sheet.close(); setTimeout(function () { open(f); }, 180); } else open(f);
    } else if (b.id === "aboutBack") back();
  });
  document.addEventListener("jk:lang", function () { if (!page.hidden) render(); });
  JK.about = { open: open };
})();
