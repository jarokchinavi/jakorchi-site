/* Food types: the fixed list of kinds visitors can pick, and typing with typo tolerance (same rules as the old app: fold + near, no library).
   You can type the food in any language (names of all languages come from lang/foods.json, loaded once when first needed).
   JK.food: kinds · label(slug) · suggest(text, max) → [slug] · ready() · hit(place, text, alt) → true/false (used by the filter) · alt(text) → extra words */
(function () {
  var T = function (k) { return JK.i18n.T(k); };
  /* slug, English name (the key of the "c:" texts in every language) */
  var KINDS = [["korean", "korean"], ["japanese", "japanese"], ["chinese", "chinese"], ["ramen", "ramen"], ["udon", "udon"], ["soba", "soba"], ["sushi", "sushi"], ["tonkatsu", "tonkatsu (fried cutlet)"], ["tempura", "tempura"], ["izakaya", "izakaya"], ["yakitori", "yakitori"], ["bbq", "grilled meat (bbq)"], ["chicken", "chicken"], ["soup", "korean soup & stew"], ["noodles", "noodles"], ["dumplings", "dumplings"], ["hotpot", "hot pot"], ["seafood", "seafood"], ["curry", "curry"], ["kebab", "kebab"], ["indian", "indian"], ["thai", "thai"], ["vietnamese", "vietnamese"], ["italian", "italian"], ["pizza", "pizza"], ["burger", "burger"], ["mexican", "mexican"], ["american", "american"], ["steak", "steak"], ["salad", "salad"], ["ricebowl", "rice bowl"], ["lunchbox", "lunch boxes (dosirak / bento)"], ["street", "street snacks"], ["bakery", "bakery"], ["coffee", "coffee shop"], ["bubbletea", "tea / bubble tea"], ["dessert", "dessert"], ["icecream", "ice cream"]];
  var fold = function (s) { return JK.search.fold(s); }, near = function (a, b, m) { return JK.search.near(a, b, m); };
  var all = null, loading = null, words = null; /* all = foods.json (every language); words = folded names per kind */
  var base = function (en) { return en.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim(); };
  function ready() {
    if (all) return Promise.resolve();
    if (!loading) loading = fetch("/lang/foods.json?v=" + BUILD).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (j) { all = j; words = null; document.dispatchEvent(new Event("jk:foods")); });
    return loading;
  }
  function names(i) {
    if (!words) words = [];
    if (!words[i]) {
      var en = KINDS[i][1], list = [en, KINDS[i][0]];
      if (all) for (var l in all) { var v = all[l]["c:" + en]; if (v) list.push(v); }
      var mine = T("c:" + en); if (mine.indexOf("c:") !== 0) list.push(mine);
      words[i] = list.map(function (x) { return fold(x); }).filter(Boolean);
    }
    return words[i];
  }
  function label(slug) {
    for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === slug) { var d = T("c:" + KINDS[i][1]); return d.indexOf("c:") === 0 ? KINDS[i][1] : d; }
    return slug;
  }
  /* 1) names that contain what you typed (start of a word first), 2) only if fewer than 4: small typing mistakes (1 letter wrong for 3-5 letters, 2 for 6 or more) */
  function suggest(text, max) {
    var f = fold(text); if (!f) return []; var out = [], i, n, hit;
    for (i = 0; i < KINDS.length; i++) {
      n = names(i); hit = 0;
      for (var k = 0; k < n.length && !hit; k++) hit = n[k].indexOf(f) === 0 ? 3 : n[k].split(" ").some(function (w) { return w.indexOf(f) === 0; }) ? 2 : n[k].indexOf(f) >= 0 ? 1 : 0;
      if (hit) out.push([hit, i]);
    }
    out.sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; });
    var res = out.map(function (x) { return KINDS[x[1]][0]; });
    if (res.length < 4 && f.length > 2) {
      var m = f.length < 6 ? 1 : 2;
      for (i = 0; i < KINDS.length; i++) {
        if (res.indexOf(KINDS[i][0]) >= 0) continue;
        if (names(i).some(function (nm) { return nm.split(" ").some(function (w) { return near(w.slice(0, f.length), f, m) || near(w, f, m); }); })) res.push(KINDS[i][0]);
      }
    }
    return res.slice(0, max || 8);
  }
  /* the words that stand for a typed food in a place's food type (used by the filter): the typed text and the kinds it was matched to */
  function alt(text) {
    var out = []; suggest(text, 3).forEach(function (s) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === s) { out.push(fold(base(KINDS[i][1]))); out.push(fold(s)); } });
    return out.filter(function (x, i) { return x && out.indexOf(x) === i; });
  }
  /* a place's food type in every language (OSM "ramen;noodle" → ramen, ラーメン, 라멘 …), saved on the place once the names are loaded */
  function cuis(r) {
    if (r._cn) return r._cn;
    var parts = String(r.cuisine || "").toLowerCase().split(/[;,]/).map(function (x) { return x.replace(/_/g, " ").trim(); }).filter(Boolean), list = parts.slice();
    if (all) { parts.forEach(function (p) { for (var l in all) { var v = all[l]["c:" + p]; if (v) list.push(v); } }); r._cn = fold(list.join(" ")); return r._cn; }
    return fold(list.join(" "));
  }
  function hit(r, text, alts) {
    var f = fold(text); if (!f) return true;
    var w = fold([r.cuisine, r.name, r.loc].join(" ")).split(" ");
    if (f.split(" ").every(function (t) { return w.some(function (x) { return x.indexOf(t) === 0; }); })) return true;
    var c = cuis(r); if (c.indexOf(f) >= 0) return true;
    return (alts || []).some(function (a) { return c.indexOf(a) >= 0 || w.some(function (x) { return x.indexOf(a) === 0; }); });
  }
  document.addEventListener("jk:lang", function () { words = null; });
  JK.food = { kinds: KINDS, label: label, suggest: suggest, alt: alt, hit: hit, ready: ready, cuis: cuis, loaded: function () { return !!all; } };
})();
