/* Saved places and lists, kept on this phone (same keys as the old app: jk_favs, jk_lists, jk_favobj); js/account.js copies them to the account when signed in.
   Standard lists: Favorites, Want to go, Bakery, Coffee. Own lists come after them (max 20), max 500 saved places.
   JK.lists: all() · of(placeId) · toggle(listId, place) · savedPlaces() · add(name) · glyph(placeId) · event "jk:lists" */
(function () {
  var MAXSAVE = 500, MAXLISTS = 20;
  var STD = [["fav", "heart", "Favorites"], ["go", "flag", "Want to go"], ["bake", "bread", "Bakery"], ["coffee", "coffee", "Coffee"]];
  var OLD = { rest: "Restaurants", cafe: "Cafés & bakeries", "try": "Want to try", been: "Been there" };
  var load = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var favs, obj, user, std;
  function read() {
    favs = load("jk_favs", []); obj = load("jk_favobj", {}); user = load("jk_lists", []);
    if (!Array.isArray(favs)) favs = []; if (!Array.isArray(user)) user = []; if (!obj || typeof obj !== "object") obj = {};
    user = user.filter(function (l) { return l && /^[a-z0-9]{1,24}$/.test(l.id) && Array.isArray(l.ids); })
      .map(function (l) { return { id: l.id, n: String(l.n || "").slice(0, 30), d: l.d || OLD[l.id] || "", ids: l.ids.filter(function (i) { return typeof i === "string"; }).slice(0, MAXSAVE) }; });
    std = STD.map(function (s) { var f = s[0] === "fav" ? null : user.filter(function (l) { return l.id === s[0]; })[0]; return { id: s[0], g: s[1], d: s[2], std: 1, ids: s[0] === "fav" ? favs : (f ? f.ids : []) }; });
    user = user.filter(function (l) { return !STD.some(function (s) { return s[0] === l.id; }) && (l.n || l.ids.length); });
    /* the old default lists (Restaurants, Cafés & bakeries, Want to try, Been there) stay only if they hold places */
    user = user.filter(function (l) { return !OLD[l.id] || l.ids.length; });
  }
  read();
  var all = function () { return std.concat(user.map(function (l) { return { id: l.id, g: "list", n: l.n, d: l.d, ids: l.ids }; })); };
  function save() {
    try {
      var keep = {}; all().forEach(function (l) { l.ids.forEach(function (i) { keep[i] = 1; }); });
      Object.keys(obj).forEach(function (i) { if (!keep[i]) delete obj[i]; });
      localStorage.setItem("jk_favs", JSON.stringify(favs));
      localStorage.setItem("jk_favobj", JSON.stringify(obj));
      localStorage.setItem("jk_lists", JSON.stringify(std.filter(function (l) { return l.id !== "fav"; }).map(function (l) { return { id: l.id, n: "", ids: l.ids }; })
        .concat(user.map(function (l) { return { id: l.id, n: l.n, d: l.d, ids: l.ids }; }))));
    } catch (e) { JK.toast(JK.i18n.T("Could not save. Your phone storage may be full.")); return false; }
    document.dispatchEvent(new Event("jk:lists")); return true;
  }
  var count = function () { var s = {}; all().forEach(function (l) { l.ids.forEach(function (i) { s[i] = 1; }); }); return Object.keys(s).length; };
  function find(id) { return all().filter(function (l) { return l.id === id; })[0]; }
  function toggle(lid, p) {
    var l = find(lid); if (!l || !p) return false; var i = l.ids.indexOf(p.id);
    if (i >= 0) l.ids.splice(i, 1);
    else { if (!of(p.id).length && count() >= MAXSAVE) { JK.toast(JK.i18n.T("You can save up to {0} places.").replace("{0}", MAXSAVE)); return false; } l.ids.push(p.id); obj[p.id] = p; }
    if (l.id !== "fav" && !std.some(function (s) { return s.id === l.id; })) { var u = user.filter(function (x) { return x.id === l.id; })[0]; if (u) u.ids = l.ids; }
    return save();
  }
  var of = function (id) { return all().filter(function (l) { return l.ids.indexOf(id) >= 0; }); };
  function add(name) {
    name = String(name || "").trim().slice(0, 30); if (!name || user.length >= MAXLISTS) return null;
    var id = "u" + Date.now().toString(36).slice(-8); user.push({ id: id, n: name, d: "", ids: [] }); save(); return id;
  }
  function places() {
    var s = {}, out = []; all().forEach(function (l) { l.ids.forEach(function (i) { if (!s[i]) { s[i] = 1; var p = JK.places.get(i) || obj[i]; if (p && p.lat != null) out.push(p); } }); }); return out;
  }
  /* which icon a saved pin shows: Favorites first, then Want to go, Bakery, Coffee, other lists */
  function glyph(id) { var l = of(id); if (!l.length) return ""; var order = ["fav", "go", "bake", "coffee"]; for (var i = 0; i < order.length; i++) if (l.some(function (x) { return x.id === order[i]; })) return order[i]; return "list"; }
  function name(l) { return l.n || JK.i18n.T(l.d); }
  /* read the saved data from the phone storage again (after an account sync or a sign-out) */
  function reload() { read(); document.dispatchEvent(new Event("jk:lists")); }
  JK.lists = { reload: reload, all: all, of: of, toggle: toggle, add: add, places: places, glyph: glyph, name: name, count: count, maxLists: MAXLISTS, full: function () { return user.length >= MAXLISTS; } };
})();
