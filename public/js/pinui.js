/* Map markers: the rating pill (pin), the gold pill (saved place; Favorites = red), the small round marker (saved place, far away) and the stacked cluster.
   Plain DOM, own drawings. JK.pinui.pill(place, o) · far(glyph) · cluster(n). o = { sel, rating, glyph } */
(function () {
  var CAT = { restaurant: "restaurant", coffee: "coffee", dessert: "dessert", drinks: "drinks", fast: "fast" };
  var esc = function (s) { return JK.ui.esc(s); };
  function el(cls, html) { var d = document.createElement("div"); d.className = cls; d.innerHTML = html; return d; }
  function pill(r, o) {
    o = o || {};
    var g = o.glyph || "", ic = JK.ic(g === "fav" ? "heart" : g === "go" ? "flag" : g === "bake" ? "bread" : g === "coffee" ? "coffee" : g === "list" ? "flag" : (CAT[r.cat] || "restaurant"));
    var rating = o.rating != null ? o.rating.toFixed(1) : "";
    var cls = "pn" + (o.sel ? " sel" : "") + (g ? " sv" + (g === "fav" ? " fav" : "") : "") + (rating ? "" : " c");
    return el(cls, '<div class="pb"><span class="pd">' + ic + "</span>" + (rating ? "<b>" + esc(rating) + "</b>" : "") + '</div><i class="pt"></i>');
  }
  function far(g) {
    return el("sf" + (g === "fav" ? " fav" : ""), JK.ic(g === "fav" ? "heart" : g === "go" ? "flag" : g === "bake" ? "bread" : g === "coffee" ? "coffee" : "flag"));
  }
  function cluster(n) {
    var s = n < 10 ? "s" : n < 100 ? "m" : "l", t = n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n);
    return el("cl " + s, '<i class="b2"></i><i class="b1"></i><div class="cf"><span class="pd">' + JK.ic("pins") + "</span><b>" + t + "</b></div>");
  }
  JK.pinui = { pill: pill, far: far, cluster: cluster };
})();
