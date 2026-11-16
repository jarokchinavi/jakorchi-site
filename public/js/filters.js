/* Filters: category chips on the map + the filter sheet (country, city, diet, favorites, food type). Only places that match are shown.
   JK.filters: pass(place) · active() · total() · state · open() · setList(id) · savedPass(place). Event "jk:filters". */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var S = { cat: "", country: "", halal: false, veg: false, fav: false, cu: "", food: "", alt: [], list: "" };
  var JP = /\b(japanese|sushi|ramen|udon|soba|tempura|tonkatsu|katsu|izakaya|yakitori|okonomiyaki|takoyaki|teppanyaki|gyudon|donburi|kaiseki|omakase|shabu)/i;
  var KR = /^(korean|bunsik|bibimbap|bulgogi|kimchi|gukbap|naengmyeon|tteokbokki|samgyeopsal|galbi|jjigae|jjimdak|kimbap|gimbap|grilled meat \(bbq\))/i;
  var CN = /^(chinese|cantonese|sichuan|szechuan|hunan|shanghai|dim sum|dumplings?|hot pot|mala|lamb skewers|roast duck|peking|wok)/i;
  var RE = { jp: JP, kr: KR, cn: CN };
  var CATS = [["restaurant", "Restaurants"], ["coffee", "Coffee & tea"], ["dessert", "Desserts & bakery"], ["drinks", "Drinks & bars"], ["fast", "Street food & fast food"]];
  var cache = null, foldFn = function (s) { return JK.search ? JK.search.fold(s) : String(s).toLowerCase(); };
  function active() { return !!(S.cat || S.country || S.halal || S.veg || S.fav || S.cu || S.food || S.list); }
  function pass(r) {
    if (S.fav || S.list) return false; /* only saved places show then (saved places always have their own marker) */
    if (S.cat && r.cat !== S.cat) return false;
    if (S.country && r.country !== S.country) return false;
    if (S.halal && !(r.halal || r.halalL)) return false;
    if (S.veg && !(r.veg || r.vegL)) return false;
    if (S.cu && !RE[S.cu].test(r.cuisine || "")) return false;
    if (S.food && !JK.food.hit(r, S.food, S.alt)) return false;
    return true;
  }
  function savedPass(r) {
    var ls = JK.lists.of(r.id);
    if (S.list) return ls.some(function (l) { return l.id === S.list; });
    if (S.fav) return ls.some(function (l) { return l.id === "fav"; });
    return true;
  }
  function total() { if (cache === null) { cache = 0; var L = JK.places.list; for (var i = 0; i < L.length; i++) if (pass(L[i])) cache++; } return cache; }
  function changed() { cache = null; mark(); document.dispatchEvent(new Event("jk:filters")); }
  var catsEl = document.getElementById("cats"), btn = document.getElementById("filtBtn");
  function mark() {
    btn.classList.toggle("on", !!(S.country || S.halal || S.veg || S.fav || S.cu || S.food));
    var listChip = S.list ? '<button type="button" class="chip on" data-list-off>' + esc(JK.lists.name(JK.lists.all().filter(function (l) { return l.id === S.list; })[0] || { d: "" })) + JK.ic("close", 16) + "</button>" : "";
    catsEl.innerHTML = listChip + CATS.map(function (c) { return '<button type="button" class="chip' + (S.cat === c[0] ? " on" : "") + '" data-cat="' + c[0] + '">' + JK.ic(c[0], 20) + esc(T(c[1])) + "</button>"; }).join("");
  }
  function chip(on, attr, label, icon) { return '<button type="button" class="chip' + (on ? " on" : "") + '" ' + attr + ">" + (icon ? JK.ic(icon, 19) : "") + esc(T(label)) + "</button>"; }
  function render() {
    var h = '<div class="handle"></div><div class="fhead"><h2>' + esc(T("Filters")) + '</h2><button type="button" class="chip" data-f-reset>' + esc(T("Reset")) + "</button></div>" +
      '<div class="fh">' + esc(T("Country")) + '</div><div class="frow">' + chip(!S.country, 'data-country=""', "All", "globe") + chip(S.country === "Korea", 'data-country="Korea"', "Korea") + chip(S.country === "Japan", 'data-country="Japan"', "Japan") + chip(S.country === "China", 'data-country="China"', "China") + "</div>" +
      '<div class="fh">' + esc(T("Jump to a city")) + '</div><label class="field">' + JK.ic("city", 20) + '<input id="cityQ" type="search" enterkeyhint="search" placeholder="' + esc(T("Search a city in Japan, Korea or China")) + '" aria-label="' + esc(T("Find a city")) + '"></label>' +
      '<div class="fh">' + esc(T("Diet")) + '</div><div class="frow">' + chip(S.halal, "data-halal", "Halal", "halal") + chip(S.veg, "data-veg", "Vegan / vegetarian", "leaf") + "</div>" +
      '<div class="fh">' + esc(T("Menu and favorites")) + '</div><div class="frow">' + chip(S.fav, "data-fav", "Favorites", "heart") + "</div>" +
      '<div class="fh">' + esc(T("Details")) + '</div><label class="field">' + JK.ic("restaurant", 20) + '<input id="foodQ" type="search" enterkeyhint="search" value="' + esc(S.food) + '" placeholder="' + esc(T("Type a food or dish")) + '" aria-label="' + esc(T("Type a food or dish")) + '" autocomplete="off" autocapitalize="off" spellcheck="false"></label>' +
      '<div class="fsug" id="foodSug2"></div><div class="frow" id="cuRow" style="margin-top:8px"' + (S.food ? " hidden" : "") + ">" + chip(S.cu === "jp", 'data-cu="jp"', "Japanese food", "jp") + chip(S.cu === "kr", 'data-cu="kr"', "Korean food", "kr") + chip(S.cu === "cn", 'data-cu="cn"', "Chinese food", "cn") + "</div>" +
      '<button type="button" class="btn" data-sheet-close style="margin-top:18px">' + esc(T("Show places")) + "</button>";
    document.querySelector("#filtSheet .sheet").innerHTML = h; foodDraw();
  }
  var CC = { Korea: [127.8, 36.3, 6.3], Japan: [137, 36.5, 5], China: [104, 34.5, 3.6] };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.cat !== undefined && b.closest("#cats")) { S.cat = S.cat === b.dataset.cat ? "" : b.dataset.cat; changed(); }
    else if (b.hasAttribute("data-list-off")) { S.list = ""; changed(); }
    else if (b.id === "filtBtn") { render(); JK.sheet.open("filtSheet"); }
    else if (b.closest("#filtSheet")) {
      if (b.dataset.country !== undefined) { S.country = b.dataset.country; if (S.country && JK.mapObj()) JK.mapObj().easeTo({ center: [CC[S.country][0], CC[S.country][1]], zoom: CC[S.country][2] }); }
      else if (b.hasAttribute("data-halal")) S.halal = !S.halal;
      else if (b.hasAttribute("data-veg")) S.veg = !S.veg;
      else if (b.hasAttribute("data-fav")) S.fav = !S.fav;
      else if (b.dataset.cu) S.cu = S.cu === b.dataset.cu ? "" : b.dataset.cu;
      else if (b.hasAttribute("data-f-reset")) { S.country = ""; S.halal = S.veg = S.fav = false; S.cu = S.food = ""; S.alt = []; }
      else if (b.dataset.fk) { S.food = JK.food.label(b.dataset.fk); S.alt = JK.food.alt(S.food).concat(b.dataset.fk); }
      else return;
      render(); changed();
    }
  });
  /* typing a food: the default buttons hide, the matching foods show (typos are fine, any language); the map follows after a short pause */
  function foodDraw() {
    var sug = document.getElementById("foodSug2"), row = document.getElementById("cuRow"); if (!sug) return;
    row.hidden = !!S.food; if (!S.food) { sug.innerHTML = ""; return; }
    var l = JK.food.suggest(S.food, 8), cur = JK.food.suggest(S.food, 1)[0] && JK.food.label(JK.food.suggest(S.food, 1)[0]) === S.food;
    sug.innerHTML = cur ? "" : l.map(function (s) { return '<button type="button" class="chip" data-fk="' + s + '">' + JK.ic("restaurant", 18) + esc(JK.food.label(s)) + "</button>"; }).join("");
  }
  document.addEventListener("input", function (e) {
    if (e.target.id !== "foodQ") return;
    S.food = e.target.value.trim(); S.alt = S.food ? JK.food.alt(S.food) : []; JK.food.ready(); foodDraw();
    clearTimeout(input.t); input.t = setTimeout(changed, 350);
  });
  document.addEventListener("jk:foods", function () { cache = null; foodDraw(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "cityQ") { e.preventDefault(); JK.search.city(e.target.value.trim()); JK.sheet.close(); } });
  function input() {}
  document.addEventListener("jk:lang", mark);
  JK.filters = { state: S, pass: pass, savedPass: savedPass, active: active, total: total, open: function () { render(); JK.sheet.open("filtSheet"); },
    setList: function (id) { S.list = id; changed(); }, redraw: mark,
    setFood: function (slug) { S.food = JK.food.label(slug); S.alt = JK.food.alt(S.food).concat(slug); changed(); JK.toast(S.food); } };
  document.addEventListener("jk:places", function () { cache = null; });
  mark();
})();
