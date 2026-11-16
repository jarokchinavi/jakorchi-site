/* "Save to a list" popup: tick the lists a place goes in (Favorites, Want to go, Bakery, Coffee, your own). "New list" makes a list and adds the place at once.
   JK.saveOpen(place) */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var sheet = document.querySelector("#saveSheet .sheet"), cur = null;
  var GL = { fav: "heart", go: "flag", bake: "bread", coffee: "coffee", list: "list" };
  function render() {
    if (!cur) return;
    sheet.innerHTML = '<div class="handle"></div><div class="fhead"><h2>' + esc(T("Save to a list")) + '</h2><button type="button" class="round sm" data-sheet-close aria-label="' + esc(T("Close")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<p class="sn">' + esc(JK.places.dname(cur)) + '</p><div class="grp">' + JK.lists.all().map(function (l) {
        var on = l.ids.indexOf(cur.id) >= 0;
        return '<button type="button" class="mi' + (on ? " on" : "") + '" data-pl="' + l.id + '" aria-pressed="' + on + '">' + JK.ic(GL[l.g] || GL[l.id] || "list", 22) + '<span class="l">' + esc(JK.lists.name(l)) + '</span><span class="ck">' + (on ? JK.ic("check", 20) : "") + "</span></button>";
      }).join("") + '</div><button type="button" class="btn ghost" data-pl-new>' + JK.ic("listplus", 20) + esc(T("New list")) + "</button>";
  }
  JK.saveOpen = function (p) { cur = p; render(); JK.sheet.open("saveSheet"); };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !sheet.contains(b) || !cur) return;
    if (b.dataset.pl) { JK.lists.toggle(b.dataset.pl, cur); render(); }
    else if (b.hasAttribute("data-pl-new")) { var p = cur; JK.newList(function (id) { JK.lists.toggle(id, p); setTimeout(function () { JK.saveOpen(p); }, 250); }); }
  });
  document.addEventListener("jk:lang", function () { if (cur && !document.getElementById("saveSheet").hidden) render(); });
})();
