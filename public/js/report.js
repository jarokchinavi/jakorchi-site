/* Visitors' answers about a place: Halal, Vegan / vegetarian, what kind of food it is, and "closed for good" (Yes / No / Not sure).
   JK.report.open(place, focus) · focus = "halal" | "vegetarian" | "food" | "" (all) · JK.report.flags(placeId) → what visitors said.
   One answer per phone per question (the database refuses a second one). Reports from visitors are not checked. */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var sheet = document.querySelector("#repSheet .sheet"), cur = null, ans = {}, focus = "", busy = false;
  var FT = JK.food.kinds; /* the fixed list (the database only accepts these); typing + typo help live in food.js */
  var voted = function (id) { try { var v = JSON.parse(localStorage.getItem("jk_foodv")); return Array.isArray(v) && v.indexOf(id) >= 0; } catch (e) { return false; } };
  function flags(id) {
    return JK.sb.get("place_flag_counts?select=kind,yes,no&place_id=eq." + encodeURIComponent(id)).then(function (a) { var o = {}; a.forEach(function (x) { o[x.kind] = { y: x.yes, n: x.no }; }); return o; });
  }
  function row(k, label) {
    return '<div class="yn" data-k="' + k + '"><span>' + esc(label) + "</span>" + [["yes", "Yes"], ["no", "No"], ["", "Not sure"]].map(function (o) { return '<button type="button" class="chip' + ((ans[k] || "") === o[0] ? " on" : "") + '" data-v="' + o[0] + '">' + esc(T(o[1])) + "</button>"; }).join("") + "</div>";
  }
  var FI = { ramen: "restaurant", udon: "restaurant", soba: "restaurant", noodles: "restaurant", sushi: "jp", japanese: "jp", tempura: "jp", tonkatsu: "jp", korean: "kr", soup: "kr", ricebowl: "kr", curry: "kr", lunchbox: "kr", chinese: "cn", dumplings: "cn", hotpot: "cn",
    bbq: "fast", yakitori: "fast", chicken: "fast", kebab: "fast", street: "fast", izakaya: "drinks", coffee: "coffee", bubbletea: "coffee", dessert: "dessert", icecream: "dessert", bakery: "bread" };
  var foodSel = "", foodText = "";
  var fchip = function (f, on) { return '<button type="button" class="chip' + (on ? " on" : "") + '" data-food="' + f[0] + '">' + JK.ic(FI[f[0]] || "restaurant", 18) + esc(JK.food.label(f[0])) + "</button>"; };
  /* a typing field (small typing mistakes are fine, any language); the swipe list below shows until you start typing, then only the matches show */
  function food() {
    var lab = '<span>' + esc(T("What kind of food is it?")) + "</span>";
    if (voted(cur.id)) return '<div class="qb">' + lab + '<p class="rng">' + esc(T("You already suggested a food type for this place.")) + "</p></div>";
    JK.food.ready();
    return '<div class="qb">' + lab + '<label class="field">' + JK.ic("search", 20) + '<input id="foodIn" type="search" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(foodText) + '" placeholder="' + esc(T("Type a food or dish")) + '" aria-label="' + esc(T("Type a food or dish")) + '"></label><div class="fsug" id="foodSug"></div></div>';
  }
  /* empty until you type: only the matching foods show (no long list) */
  function foodDraw() {
    var inp = document.getElementById("foodIn"), sug = document.getElementById("foodSug"); if (!inp || !sug) return;
    var v = inp.value.trim(); foodText = inp.value;
    if (!v) { sug.innerHTML = ""; return; }
    var l = JK.food.suggest(v, 6);
    sug.innerHTML = l.length ? l.map(function (s) { return fchip(FT.filter(function (f) { return f[0] === s; })[0], foodSel === s); }).join("") : '<p class="rng">' + esc(T("Nothing found.")) + "</p>";
  }
  function render() {
    var title = focus === "halal" ? T("Halal") : focus === "vegetarian" ? T("Vegan / vegetarian") : focus === "food" ? T("What kind of food is it?") : T("Report wrong info"), h = "";
    if (!focus || focus === "halal") h += row("halal", T("Halal"));
    if (!focus || focus === "vegetarian") h += row("vegetarian", T("Vegan / vegetarian"));
    if (!focus || focus === "food") h += food();
    if (!focus) h += row("closed", T("Closed for good, or not here"));
    sheet.innerHTML = '<div class="handle"></div><div class="fhead"><h2>' + esc(title) + '</h2><button type="button" class="round sm" data-sheet-close aria-label="' + esc(T("Close")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<p class="sn">' + esc(JK.places.dname(cur)) + "</p>" + h + '<p class="rng" style="margin-top:18px">' + esc(T("Reports from visitors are not checked.")) + '</p><button type="button" class="btn" data-rp-send style="margin-top:10px">' + esc(T("Send report")) + "</button>";
    foodDraw();
  }
  function open(p, f) { cur = p; ans = {}; foodSel = ""; foodText = ""; focus = f || ""; render(); JK.sheet.open("repSheet"); }
  async function send() {
    if (busy) return; var items = Object.keys(ans).filter(function (k) { return ans[k]; }).map(function (k) { return [k, ans[k]]; });
    if (foodSel) items.push(["food:" + foodSel, "yes"]);
    if (!items.length) { JK.toast(T("Choose at least one answer.")); return; }
    busy = true; var b = sheet.querySelector("[data-rp-send]"); b.disabled = true; b.textContent = T("Sending…"); var ok = 0, dup = 0, msg = "";
    for (var i = 0; i < items.length; i++) { var r = await JK.sb.post("place_flags", { place_id: cur.id, kind: items[i][0], verdict: items[i][1], device: JK.sb.dev() }); if (r.ok) { ok++; if (items[i][0].indexOf("food:") === 0) { try { var v = JSON.parse(localStorage.getItem("jk_foodv")); v = Array.isArray(v) ? v : []; v.push(cur.id); localStorage.setItem("jk_foodv", JSON.stringify(v.slice(-500))); } catch (e) {} } } else if (r.status === 409) dup++; else msg = r.msg || msg; }
    busy = false;
    if (ok) { JK.toast(T("Report sent. Thank you!")); JK.sheet.close(); document.dispatchEvent(new CustomEvent("jk:report", { detail: cur.id })); }
    else { b.disabled = false; b.textContent = T("Send report"); JK.toast(dup ? T("You already sent a report for this place.") : (msg || T("Could not send. Please try again."))); }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !sheet.contains(b)) return;
    if (b.dataset.v !== undefined && b.closest(".yn")) { ans[b.closest(".yn").dataset.k] = b.dataset.v; b.closest(".yn").querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("on", x === b); }); }
    else if (b.dataset.food) { foodSel = foodSel === b.dataset.food ? "" : b.dataset.food; sheet.querySelectorAll("[data-food]").forEach(function (x) { x.classList.toggle("on", x.dataset.food === foodSel); }); }
    else if (b.hasAttribute("data-rp-send")) send();
  });
  document.addEventListener("input", function (e) { if (e.target.id === "foodIn") { foodSel = ""; foodDraw(); } });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.target.id !== "foodIn") return; e.preventDefault();
    var f = JK.food.suggest(e.target.value, 1)[0]; if (f) { foodSel = f; foodDraw(); } e.target.blur();
  });
  document.addEventListener("jk:foods", function () { if (cur && !document.getElementById("repSheet").hidden) foodDraw(); });
  document.addEventListener("jk:lang", function () { if (cur && !document.getElementById("repSheet").hidden) render(); });
  JK.report = { flags: flags, open: open };
})();