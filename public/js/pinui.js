/* Map markers: the rating pill (pin), the gold pill (saved place; Favorites = red), the small round marker (saved place, far away) and the stacked cluster.
   Plain DOM, own drawings. JK.pinui.pill(place, o) · far(glyph) · cluster(n). o = { sel, rating, glyph } */
(function () {
  var CAT = { restaurant: "restaurant", coffee: "coffee", dessert: "dessert", drinks: "drinks", fast: "fast" };
  var esc = function (s) { return JK.ui.esc(s); };
  function el(cls, html) { var d = document.createElement("div"); d.className = cls; d.innerHTML = html; return d; }
  /* the picture on a pin: bakery, and for restaurants / street food the kind of food (noodles, sushi, grill, dumplings) - rules of the old app */
  function kind(r) {
    if (r.cat === "dessert" && (r.sub === "bakery" || r.sub === "pastry" || r.cuisine === "bakery")) return "bread";
    if (r.cat !== "restaurant" && r.cat !== "fast") return CAT[r.cat] || "restaurant";
    var c = String(r.cuisine || "").toLowerCase();
    return /ramen|noodle|udon|soba|pho/.test(c) ? "noodle" : /sushi/.test(c) ? "sushi" : /korean|bbq|barbecue|yakiniku|grill/.test(c) ? "grill" : /chinese|dumpling|dim.?sum|baozi/.test(c) ? "dumpling" : (CAT[r.cat] || "restaurant");
  }
  var flags = function (r) { return { h: !!r.halal, v: !!(r.veg || r.vegan) }; };
  var badges = function (h, v) { return h || v ? '<span class="bgs">' + (h ? '<i class="bd">' + JK.ic("halal") + "</i>" : "") + (v ? '<i class="bd">' + JK.ic("leaf") + "</i>" : "") + "</span>" : ""; };
  function pill(r, o) {
    o = o || {};
    var g = o.glyph || "", ic = JK.ic(g === "fav" ? "heart" : g === "go" ? "flag" : g === "bake" ? "bread" : g === "coffee" ? "coffee" : g === "list" ? "flag" : kind(r)), f = flags(r);
    var rating = o.rating != null ? o.rating.toFixed(1) : "";
    var cls = "pn" + (o.sel ? " sel" : "") + (g ? " sv" + (g === "fav" ? " fav" : "") : "") + (rating ? "" : " c");
    return el(cls, '<div class="pb"><span class="pd">' + ic + "</span>" + (rating ? "<b>" + esc(rating) + "</b>" : "") + badges(f.h, f.v) + '</div><i class="pt"></i>');
  }
  function far(g) {
    return el("sf" + (g === "fav" ? " fav" : ""), JK.ic(g === "fav" ? "heart" : g === "go" ? "flag" : g === "bake" ? "bread" : g === "coffee" ? "coffee" : "flag"));
  }
  function cluster(n, h, v) {
    var s = n < 10 ? "s" : n < 100 ? "m" : "l", t = n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n);
    return el("cl " + s, '<div class="cf"><span class="pd">' + JK.ic("pins") + "</span><b>" + t + "</b>" + badges(h, v) + "</div>");
  }
  JK.pinui = { pill: pill, far: far, cluster: cluster, kind: kind, flags: flags };
})();
