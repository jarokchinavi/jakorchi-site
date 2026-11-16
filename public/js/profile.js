/* Signed-in start page: the profile card (name + email from "jk_user") and the profile page it opens.
   The profile page is also opened from the settings page. One history step; phone back closes it. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var T = function (k) { return JK.i18n.T(k); };
  var esc = JK.ui.esc;
  var page = $("#profile"), body = $("#pfBody"), home = $("#home"), settings = $("#settings"), card = $("#meCard");
  var from = "home";

  function user() { try { var u = JSON.parse(localStorage.getItem("jk_user")); return u && typeof u === "object" ? u : {}; } catch (e) { return {}; } }
  function name(u) { return u.name || u.email || T("Profile"); }
  function initial(u) { return ((u.name || u.email || "J").trim().charAt(0) || "J").toUpperCase(); }
  function sub(u) { return u.name && u.email ? esc(u.email) : ""; }
  JK.me = { user: user, name: name, initial: initial };

  function drawCard() {
    var u = user();
    card.innerHTML = '<span class="av" aria-hidden="true">' + esc(initial(u)) + '</span><span class="t"><span class="nm">' + esc(name(u)) + '</span>' +
      (sub(u) ? '<span class="em">' + sub(u) + '</span>' : "") + '</span><span class="go">' + JK.ic("arrow") + '</span>';
    card.setAttribute("aria-label", T("Profile"));
  }

  function render() {
    var u = user();
    body.innerHTML = '<div class="id"><div class="av big" aria-hidden="true">' + esc(initial(u)) + '</div><div class="nm">' + esc(name(u)) + '</div>' +
      (sub(u) ? '<div class="em">' + sub(u) + '</div>' : "") + '</div>' +
      JK.grp(JK.row('data-soon="Change name"', T("Change name"), esc(u.name || ""), "", "user") +
        JK.row('data-soon="Change email"', T("Change email"), esc(u.email || ""), "", "mail") +
        JK.row('data-soon="Change password"', T("Change password"), "", "", "lock")) +
      JK.grp(JK.row("data-signout", T("Sign out"), "", "", "out") + JK.row('data-soon="Delete account"', T("Delete account"), "", "", "trash"));
  }

  function open(f) {
    if (!page.hidden) return;
    from = f; page.hidden = false; JK.hideScreens(); settings.hidden = true; render(); window.scrollTo(0, 0);
    try { history.pushState({ jk: "p" }, ""); } catch (e) {}
    var b = $("#profileBack"); if (b) b.focus();
  }
  function closePage() {
    if (page.hidden) return;
    page.hidden = true;
    if (from === "settings") { settings.hidden = false; document.dispatchEvent(new Event("jk:auth")); } else JK.showScreen();
  }
  function back() { if (history.state && history.state.jk === "p") history.back(); else closePage(); }

  window.addEventListener("popstate", function () { if (!page.hidden && !(history.state && history.state.jk === "p") && !JK.ui.isOpen()) closePage(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !page.hidden && !JK.ui.isOpen()) back(); });
  var prev = JK.layerOpen; JK.layerOpen = function () { return prev() || !page.hidden; };

  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-profile")) open(b.dataset.profile === "settings" ? "settings" : "home");
    else if (b.id === "profileBack") back();
    else if (!page.hidden && b.hasAttribute("data-signout")) JKAuth.signOut();
  });
  /* signed out (here or in another tab) while the profile page is open: leave it */
  document.addEventListener("jk:auth", function () { drawCard(); if (!page.hidden) { if (JKAuth.signedIn()) render(); else back(); } });
  document.addEventListener("jk:lang", function () { drawCard(); if (!page.hidden) render(); });
  drawCard();
})();
