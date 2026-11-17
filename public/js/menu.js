/* The menu (slide-up sheet on the map): quick actions, My places (the four standard lists + own lists), New list, Settings, About, Install.
   A list opens on the map: only its places show. Pages that are not built yet show "Coming soon". */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var sheet = document.querySelector("#menuSheet .sheet"), installEv = null;
  var GL = { fav: "heart", go: "flag", bake: "bread", coffee: "coffee", list: "list" };
  var standalone = (navigator.standalone === true) || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEv = e; });
  function q(icon, label, attr) { return '<button type="button" class="qa" ' + attr + '><i>' + JK.ic(icon, 26) + "</i><span>" + esc(T(label)) + "</span></button>"; }
  function render() {
    var lists = JK.lists.all().map(function (l) {
      return '<button type="button" class="mi' + (l.id === "fav" ? " fav" : "") + '" data-list="' + l.id + '">' + JK.ic(GL[l.g] || GL[l.id] || "list", 22) + '<span class="l">' + esc(JK.lists.name(l)) + "</span><em>" + l.ids.length + "</em></button>";
    }).join("");
    sheet.innerHTML = '<div class="handle"></div><div class="mh"><img src="/logo.svg" width="46" height="46" alt=""><div><b>Jakorchi</b><small>日本 &nbsp; 한국 &nbsp; 中国</small></div>' +
      '<button type="button" class="round sm" data-sheet-close aria-label="' + esc(T("Close")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<div class="qas">' + q("heart", "Favorites", 'data-list="fav"') + q("addpin", "Add a restaurant", "data-add") + q("bulb", "Add a tip", 'data-soon="Add a tip"') + q("phrase", "Useful phrases", 'data-soon="Useful phrases"') + "</div>" +
      '<div class="ms">' + esc(T("My places")) + '</div><div class="grp">' + lists + "</div>" +
      '<button type="button" class="btn ghost" data-newlist>' + JK.ic("listplus", 20) + esc(T("New list")) + "</button>" +
      '<div class="foot"><button type="button" class="chip" data-menu-settings>' + JK.ic("gear", 20) + esc(T("Settings")) + '</button><button type="button" class="chip" data-soon="About &amp; privacy">' + JK.ic("info", 20) + esc(T("About")) + "</button>" +
      (standalone ? "" : '<button type="button" class="chip" ' + (installEv ? "data-install" : 'data-soon="Install the app"') + ">" + JK.ic("install", 20) + esc(T("Install the app")) + "</button>") + "</div>" +
      '<p class="att">' + esc(T("Map and place data © OpenStreetMap contributors (ODbL).")) + "</p>";
  }
  function showList(id) {
    var l = JK.lists.all().filter(function (x) { return x.id === id; })[0]; if (!l) return;
    JK.sheet.close();
    if (!l.ids.length) { JK.toast(T("Nothing found.")); return; }
    JK.filters.setList(id);
    var ps = JK.lists.places(), map = JK.mapObj();
    if (map && ps.length) { var b = new maplibregl.LngLatBounds(); ps.filter(function (p) { return JK.lists.of(p.id).some(function (x) { return x.id === id; }); }).forEach(function (p) { b.extend([p.lng, p.lat]); }); if (!b.isEmpty()) map.fitBounds(b, { padding: 70, maxZoom: 15, duration: 600 }); }
    JK.show("list"); /* a list from My places also opens as a list (the map is filtered the same way; swipe the bar back to the map) */
  }
  var nlCb = null;
  /* New list: asks for a name; cb(id) runs after the list exists (the save popup uses it to add the place at once) */
  function newList(cb) {
    if (JK.lists.full()) { JK.toast(T("You can save up to {0} places.").replace("{0}", JK.lists.maxLists)); return; }
    nlCb = typeof cb === "function" ? cb : null; JK.sheet.close();
    setTimeout(function () {
      JK.ui.show("", function () { return "<h2>" + esc(T("New list")) + '</h2><label class="field" style="margin-top:16px"><input id="nlName" maxlength="30" placeholder="' + esc(T("New list name")) + '" aria-label="' + esc(T("New list name")) + '"></label><button type="button" class="btn" data-nl-ok>' + esc(T("Create")) + '</button><button type="button" class="btn ghost" data-close>' + esc(T("Cancel")) + "</button>"; });
      var i = document.getElementById("nlName"); if (i) i.focus();
    }, 150);
  }
  JK.newList = newList;  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "menuBtn") { render(); JK.sheet.open("menuSheet"); }
    else if (b.closest("#menuSheet") && b.dataset.list) showList(b.dataset.list);
    else if (b.hasAttribute("data-add")) { JK.sheet.close(); setTimeout(function () { JK.addPlace.open(); }, 180); }
    else if (b.hasAttribute("data-newlist")) newList(null);
    else if (b.hasAttribute("data-nl-ok")) {
      var n = (document.getElementById("nlName") || {}).value || "";
      if (!n.trim()) { JK.toast(T("Please type a name for the list.")); return; }
      var nid = JK.lists.add(n); JK.ui.close(); if (nlCb && nid) nlCb(nid); nlCb = null;
    }
    else if (b.hasAttribute("data-menu-settings")) { JK.sheet.close(); setTimeout(function () { JK.settings.open(); }, 160); }
    else if (b.hasAttribute("data-install") && installEv) { JK.sheet.close(); installEv.prompt(); installEv = null; }
  });
  document.addEventListener("jk:lang", function () { if (!document.getElementById("menuSheet").hidden) render(); });
  document.addEventListener("jk:lists", function () { if (!document.getElementById("menuSheet").hidden) render(); });
})();
