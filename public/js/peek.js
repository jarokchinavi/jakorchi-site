/* The place card (slides up when you tap a pin): name, big rating, diet tags, a row of round buttons you can swipe (Navigate, Save, Write a review, Share, Report),
   and three tabs: Details · Reviews · Menu photos. Swipe the handle up for the full card, down to make it small or close it.
   JK.peek.open(place) · close() · current() */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var el = document.getElementById("peek"), scr = document.getElementById("mapscr"), cur = null, tab = "d", revs = null, fl = null, ph = null;
  var ok = function (id) { return /^[A-Za-z0-9_]{1,60}$/.test(id); };
  var MPQ = function (id) { return "menu_photos_public?place_id=eq." + encodeURIComponent(id) + "&select=id,path&order=created_at.desc&limit=12"; };

  var CAT = { restaurant: "Restaurants", coffee: "Coffee & tea", dessert: "Desserts & bakery", drinks: "Drinks & bars", fast: "Street food & fast food" };
  /* small pills under the rating: price range, kind of food, Halal / Vegan (from the data and from what visitors said) */
  function tags(p) {
    var o = [], f = fl || {}, vy = function (k) { var c = f[k]; return c && c.y > c.n ? c.y : 0; }, tg = function (ic, t, cl) { return '<span class="chip tag' + (cl ? " " + cl : "") + '">' + (ic ? JK.ic(ic, 16) : "") + esc(t) + "</span>"; };
    var pr = JK.ratings.price(p.id); if (pr) o.push(tg("coin", JK.price.sym(pr, p.country) + " · " + JK.price.range(pr, p.country)));
    o.push(tg("restaurant", p.cuisine || T(CAT[p.cat] || CAT.restaurant)));
    if (p.halal) o.push(tg("halal", T("Halal"))); else if (p.halalL) o.push(tg("halal", T("Some halal options"))); else if (vy("halal")) o.push(tg("halal", T("Halal") + " (" + T("visitors") + " ×" + vy("halal") + ")"));
    if (p.vegan) o.push(tg("leaf", T("Vegan"))); else if (p.veg) o.push(tg("leaf", T("Vegetarian"))); else if (p.veganL) o.push(tg("leaf", T("Some vegan options"))); else if (p.vegL) o.push(tg("leaf", T("Some vegetarian options")));
    else if (vy("vegetarian") || vy("vegan")) o.push(tg("leaf", T("Vegan / vegetarian") + " (" + T("visitors") + " ×" + (vy("vegetarian") || vy("vegan")) + ")"));
    if (f.closed && f.closed.y >= 3 && f.closed.y > f.closed.n) o.push(tg("warn", T("Visitors say: closed") + " ×" + f.closed.y, "warn"));
    return o.join("");
  }
  function rate(p) {
    var a = JK.ratings.avg(p.id), n = JK.ratings.count(p.id);
    if (a == null) return '<button type="button" class="rate none" data-tab="r"><span class="muted">' + esc(T("No reviews yet")) + "</span></button>";
    return '<button type="button" class="rate" data-tab="r"><span class="big">' + a.toFixed(1) + "</span><span>" + JK.reviews.stars(Math.round(a), 18) + "<small>" + n + " " + esc(n === 1 ? T("review") : T("reviews")) + "</small></span></button>";
  }
  /* the swipe list: smaller round buttons, with room around them so nothing is cut off */
  function acts(p) {
    var saved = JK.lists.of(p.id).length > 0, a = function (k, ic, label, on, main) { return '<button type="button" class="qa' + (main ? " main" : "") + (on ? " on" : "") + '" data-act="' + k + '"><i>' + JK.ic(ic, 22) + "</i><span>" + esc(label) + "</span></button>"; };
    return '<div class="acts">' + a("nav", "nav", T("Navigate"), 0, 1) + a("save", saved ? "check" : "plus", saved ? T("Saved") : T("Save to a list"), saved) + a("rev", "star", T("Write a review")) +
      a("food", "restaurant", T("Food type")) + a("share", "share", T("Share")) + a("rep", "flag", T("Report wrong info")) + "</div>";
  }
  /* the essentials are always shown (a dash when we do not have it yet) */
  function details(p) {
    var dash = '<span class="muted">–</span>', row = function (ic, l, v) { return '<div class="inf">' + JK.ic(ic, 20) + "<span><small>" + esc(l) + "</small>" + (v || dash) + "</span></div>"; };
    var web = /^https?:\/\//i.test(p.web) ? p.web : (p.web ? "https://" + p.web : ""), tel = /^[+0-9 ()\-.]{5,30}$/.test(p.phone || "") ? p.phone : "";
    var addrRow = p.addr ? '<button type="button" class="inf cprow" data-copy="' + esc(p.addr) + '" aria-label="' + esc(T("Copy address")) + '">' + JK.ic("pin", 20) + "<span><small>" + esc(T("Address")) + "</small>" + esc(p.addr) + "</span>" + JK.ic("copy", 20) + "</button>" : row("pin", T("Address"), '<span class="muted">' + esc(T("No address in OpenStreetMap yet")) + "</span>");
    return addrRow + row("phone", T("Phone"), tel ? '<a href="tel:' + esc(tel.replace(/[^+0-9]/g, "")) + '">' + esc(tel) + "</a>" : "") + row("clock", T("Opening hours"), p.hours ? esc(p.hours) : "") +
      row("globe", T("Website"), web ? '<a href="' + esc(web) + '" target="_blank" rel="noopener noreferrer">' + esc(web.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)) + "</a>" : "") +
      '<p class="src">' + esc(T("From OpenStreetMap · not checked by Jakorchi")) + '</p><div class="warnb">' + JK.ic("warn", 20) + "<span><b>" + esc(T("Heads up:")) + "</b> " + esc(T("Details come from OpenStreetMap and are not checked. Halal and vegan tags can be wrong or old. Ask the staff before you order.")) + "</span></div>";
  }  function reviewsTab(p) {
    return '<button type="button" class="btn ghost" data-act="rev">' + JK.ic("star", 20) + esc(T("Write a review")) + "</button>" + (revs === null ? '<p class="muted">' + esc(T("Loading places…")) + "</p>" : revs === false ? '<p class="muted">' + esc(T("Reviews can't load right now.")) + "</p>" : JK.reviews.html(revs, p.country));
  }
  function photosTab() {
    var g = ph === null ? "" : ph === false ? '<p class="muted">' + esc(T("Reviews can't load right now.")) + "</p>" : ph.length ? '<div class="pgrid">' + ph.map(function (x) { return JK.sb.okPath(x.path) ? '<a href="' + esc(JK.sb.photoUrl(x.path)) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(JK.sb.photoUrl(x.path)) + '" alt="" loading="lazy"></a>' : ""; }).join("") + "</div>" : '<p class="muted">' + esc(T("No menu photos yet.")) + "</p>";
    return '<button type="button" class="btn ghost" data-act="mphoto">' + JK.ic("camera", 20) + esc(T("Add a menu photo")) + '</button><input type="file" id="mpFile" accept="image/*" hidden>' + g;
  }
  function render() {
    if (!cur) return; var p = cur, nm = JK.places.dname(p), loc = JK.places.localName(p), body = tab === "r" ? reviewsTab(p) : tab === "p" ? photosTab() : details(p);
    var sc = el.querySelector(".cbody"), top = sc ? sc.scrollTop : 0;
    el.innerHTML = '<div class="handle" data-grab></div><div class="chead"><div><h3>' + esc(nm) + "</h3>" + (loc && loc !== nm ? '<p class="pl">' + esc(loc) + "</p>" : "") + '</div><button type="button" class="px" data-peek-close aria-label="' + esc(T("Close")) + '">' + JK.ic("close", 18) + "</button></div>" +
      '<div class="cbody">' + rate(p) + '<div class="tags">' + tags(p) + "</div>" + acts(p) +
      '<div class="tabs" role="tablist">' + [["d", "Details"], ["r", "Reviews"], ["p", "Menu photos"]].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" data-tab="' + t[0] + '">' + esc(T(t[1])) + "</button>"; }).join("") + '</div><div class="tpanel">' + body + "</div></div>";
    var nb = el.querySelector(".cbody"); if (nb && top) nb.scrollTop = top;
  }
  function extras(p) {
    if (!ok(p.id)) { revs = ph = false; render(); return; }
    JK.ratings.want([p.id]);
    JK.report.flags(p.id).then(function (c) { if (cur && cur.id === p.id) { fl = c; render(); } }).catch(function () {});
    JK.reviews.load(p.id).then(function (a) { if (cur && cur.id === p.id) { revs = a; render(); } }).catch(function () { if (cur && cur.id === p.id) { revs = false; render(); } });
    JK.sb.get(MPQ(p.id)).then(function (a) { if (cur && cur.id === p.id) { ph = a; render(); } }).catch(function () { if (cur && cur.id === p.id) { ph = false; render(); } });
  }
  function open(p) {
    cur = p; tab = "d"; revs = fl = ph = null; render(); el.hidden = false; void el.offsetWidth; el.classList.add("open"); el.classList.remove("full"); scr.classList.add("pk");
    JK.pins.select(p.id, p); extras(p);
  }
  function close() { if (!cur) return; cur = null; el.classList.remove("open", "full"); scr.classList.remove("pk"); setTimeout(function () { if (!cur) el.hidden = true; }, 220); JK.pins.select(null); }
  async function addMenuPhoto(file) {
    JK.toast(T("Preparing photo…"), 3000);
    try {
      var blob = await JK.sb.shrink(file); JK.toast(T("Uploading photos…"), 4000); var path = await JK.sb.upload(cur.id, blob); if (!path) throw 0;
      var r = await JK.sb.post("menu_photos", { place_id: cur.id, path: path, device: JK.sb.dev() });
      if (!r.ok) { JK.toast(r.msg || T("Could not send. Please try again.")); return; }
      JK.toast(T("Menu photo added. Thank you!")); JK.sb.get(MPQ(cur.id)).then(function (a) { ph = a; render(); }).catch(function () {});
    } catch (e) { JK.toast(T("Photo upload failed. Please try again.")); }
  }
  function share(p) {
    var url = "https://www.openstreetmap.org/?mlat=" + p.lat + "&mlon=" + p.lng + "#map=18/" + p.lat + "/" + p.lng, text = [JK.places.dname(p), p.addr].filter(Boolean).join(" · ");
    if (navigator.share) navigator.share({ title: JK.places.dname(p), text: text, url: url }).catch(function () {}); else JK.copy(text + "\n" + url);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !el.contains(b) || !cur) return;
    if (b.hasAttribute("data-peek-close")) close();
    else if (b.dataset.tab) { tab = b.dataset.tab; render(); }
    else if (b.dataset.copy) { if (b.dataset.copy) JK.copy(b.dataset.copy); }
    else if (b.hasAttribute("data-grab")) el.classList.toggle("full");
    else if (b.dataset.act === "nav") JK.navigate.open(cur);
    else if (b.dataset.act === "save") JK.saveOpen(cur);
    else if (b.dataset.act === "rev") JK.reviews.open(cur);
    else if (b.dataset.act === "rep") JK.report.open(cur, "");
    else if (b.dataset.act === "food") JK.report.open(cur, "food");
    else if (b.dataset.act === "share") share(cur);
    else if (b.dataset.act === "mphoto") document.getElementById("mpFile").click();
  });
  el.addEventListener("change", function (e) { if (e.target.id === "mpFile" && e.target.files[0]) { var f = e.target.files[0]; e.target.value = ""; addMenuPhoto(f); } });
  /* swipe the handle: up = full, down = small, down again = close */
  var y0 = null;
  el.addEventListener("touchstart", function (e) { if (e.target.closest(".handle")) y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener("touchend", function (e) { if (y0 === null) return; var d = e.changedTouches[0].clientY - y0; y0 = null; if (d < -40) el.classList.add("full"); else if (d > 40) { if (el.classList.contains("full")) el.classList.remove("full"); else close(); } });
  document.addEventListener("jk:review", function (e) { if (cur && e.detail === cur.id) { revs = null; JK.reviews.load(cur.id).then(function (a) { revs = a; render(); }).catch(function () {}); } });
  document.addEventListener("jk:report", function (e) { if (cur && e.detail === cur.id) JK.report.flags(cur.id).then(function (c) { fl = c; render(); }).catch(function () {}); });
  ["jk:ratings", "jk:lists", "jk:lang"].forEach(function (ev) { document.addEventListener(ev, render); });
  document.addEventListener("jk:screen", function (e) { if (e.detail !== "map") close(); });
  JK.peek = { open: open, close: close, current: function () { return cur; } };
})();
