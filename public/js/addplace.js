/* Add a restaurant (visitors; rules of the old app):
   1) Menu > Add a restaurant: the map zooms in and a + shows in the upper part of the screen; move the map so the + is on the entrance.
   2) A small panel at the bottom: name, kind of place, food type (optional), Halal / Vegan / Vegetarian, a photo of the outside (required).
   3) Send: the photo is made small (location data removed) and uploaded, then the place is added to the database (table new_places, only the allowed columns).
   It is shown to the person who added it at once; for everybody after 2 other phones confirm "Yes, it's here" (3 in total) - see the place card.
   The database refuses: no photo, the same name within 15 m, more than 5 a day per phone, outside Japan / Korea / China. JK.addPlace.open() */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var scr = document.getElementById("mapscr"), x = null, p = null, st = null, busy = false;
  var CATS = [["restaurant", "Restaurants"], ["coffee", "Coffee & tea"], ["dessert", "Desserts & bakery"], ["drinks", "Drinks & bars"], ["fast", "Street food & fast food"]];
  function build() {
    x = document.createElement("div"); x.className = "addx"; x.hidden = true; x.setAttribute("aria-hidden", "true");
    /* a plain + (a cream outline behind it so it reads on every map) */
    x.innerHTML = '<svg viewBox="0 0 48 48"><g fill="none" stroke-linecap="round"><path d="M24 8v32M8 24h32" stroke="var(--bg)" stroke-width="9"/><path d="M24 8v32M8 24h32" stroke="var(--btn)" stroke-width="4.5"/></g></svg>';
    p = document.createElement("div"); p.className = "addp"; p.hidden = true; scr.appendChild(x); scr.appendChild(p);
    p.addEventListener("click", click); p.addEventListener("input", input); p.addEventListener("change", change);
  }
  function chip(on, attr, label, icon) { return '<button type="button" class="chip' + (on ? " on" : "") + '" ' + attr + ">" + (icon ? JK.ic(icon, 18) : "") + esc(label) + "</button>"; }
  /* step 1 "spot": only a slim bar, so the map stays free to move the +; step 2 "form": the details (the spot is kept) */
  function renderSpot() {
    p.classList.add("slim");
    p.innerHTML = '<div class="fhead"><h2>' + esc(T("Add a restaurant")) + '</h2><button type="button" class="round sm" data-ad-cancel aria-label="' + esc(T("Cancel")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<p class="sn">' + esc(T("Move the map so the + is on the entrance of the restaurant.")) + '</p><p class="rng err" id="adMsg"></p><button type="button" class="btn" data-ad-here>' + JK.ic("pin", 20) + esc(T("Add here")) + "</button>";
  }
  function render() {
    if (st.step === "spot") { renderSpot(); return; }
    p.classList.remove("slim");
    var thumb = st.ph ? '<div class="adthumb"><img src="' + st.ph.u + '" alt="' + esc(T("Photo")) + '"><button type="button" class="round sm" data-ad-rm aria-label="' + esc(T("Remove photo")) + '">' + JK.ic("close", 18) + "</button></div>" : "";
    p.innerHTML = '<div class="fhead"><div class="ahl"><button type="button" class="round sm" data-ad-back aria-label="' + esc(T("Back")) + '"><svg class="ic" style="width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg></button><h2>' + esc(T("Add a restaurant")) + '</h2></div><button type="button" class="round sm" data-ad-cancel aria-label="' + esc(T("Cancel")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<label class="field">' + JK.ic("restaurant", 20) + '<input id="adName" maxlength="80" autocomplete="off" placeholder="' + esc(T("Restaurant name")) + '" aria-label="' + esc(T("Restaurant name")) + '" value="' + esc(st.name) + '"></label>' +
      '<div class="chips adrow">' + CATS.map(function (c) { return chip(st.cat === c[0], 'data-adc="' + c[0] + '"', T(c[1]), c[0]); }).join("") + "</div>" +
      '<label class="field">' + JK.ic("search", 20) + '<input id="adFood" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(T("Type a food or dish")) + '" aria-label="' + esc(T("Type of food")) + '" value="' + esc(st.foodText) + '"></label><div class="fsug" id="adSug"></div>' +
      '<div class="frow adrow2">' + chip(st.halal, "data-adh", T("Halal"), "halal") + chip(st.vegan, "data-adv", T("Vegan"), "leaf") + chip(st.vege, "data-adg", T("Vegetarian"), "leaf") + "</div>" +
      (thumb || '<button type="button" class="adphoto" data-ad-photo>' + JK.ic("camera", 22) + "<span>" + esc(T("Add a photo of the outside (required)")) + "</span></button>") +
      '<input type="file" id="adFile" accept="image/*" hidden><p class="rng">' + esc(T("Photos are public. Only upload your own food photos, no people. Location data is removed.")) + '</p><p class="rng err" id="adMsg"></p>' +
      '<button type="button" class="btn" data-ad-send>' + esc(T("Send")) + "</button>";
    sug();
  }
  function sug() {
    var s = document.getElementById("adSug"); if (!s) return; var v = st.foodText.trim();
    if (!v || st.food) { s.innerHTML = ""; return; }
    JK.food.ready(); s.innerHTML = JK.food.suggest(v, 5).map(function (k) { return '<button type="button" class="chip" data-adf="' + k + '">' + esc(JK.food.label(k)) + "</button>"; }).join("");
  }
  var msg = function (t) { var m = document.getElementById("adMsg"); if (m) m.textContent = t || ""; };
  function open() {
    var m = JK.mapObj(); if (JK.screen !== "map") JK.show("map");
    var n = 0; (function wait() { m = JK.mapObj(); if (!m) { if (n++ < 60) setTimeout(wait, 150); return; } go(m); })();
  }
  function go(m) {
    if (!x) build(); if (JK.peek.current()) JK.peek.close();
    st = { step: "spot", spot: null, name: "", cat: "restaurant", food: "", foodText: "", halal: false, vegan: false, vege: false, ph: null };
    if (m.getZoom() + 1 < 17) m.easeTo({ zoom: 16, duration: 500 });
    scr.classList.add("adding"); x.hidden = false; p.hidden = false; render();
  }
  function close() { if (!p) return; if (st && st.ph) URL.revokeObjectURL(st.ph.u); st = null; scr.classList.remove("adding"); x.hidden = true; p.hidden = true; p.innerHTML = ""; }
  function input(e) {
    if (e.target.id === "adName") st.name = e.target.value;
    else if (e.target.id === "adFood") { st.foodText = e.target.value; st.food = ""; sug(); }
  }
  function change(e) {
    if (e.target.id !== "adFile" || !e.target.files[0]) return; var f = e.target.files[0]; e.target.value = "";
    JK.sb.shrink(f).then(function (b) { if (st) { if (st.ph) URL.revokeObjectURL(st.ph.u); st.ph = { b: b, u: URL.createObjectURL(b) }; render(); } }).catch(function () { msg(T("This photo could not be used. Try a JPEG or PNG picture.")); });
  }
  function click(e) {
    var b = e.target.closest("button"); if (!b || !st) return;
    if (b.hasAttribute("data-ad-cancel")) close();
    else if (b.dataset.adc) { st.cat = b.dataset.adc; p.querySelectorAll("[data-adc]").forEach(function (c) { c.classList.toggle("on", c.dataset.adc === st.cat); }); }
    else if (b.dataset.adf) { st.food = JK.food.label ? b.dataset.adf : ""; st.foodText = JK.food.label(b.dataset.adf); var fi = document.getElementById("adFood"); if (fi) fi.value = st.foodText; sug(); }
    else if (b.hasAttribute("data-adh")) { st.halal = !st.halal; b.classList.toggle("on", st.halal); }
    else if (b.hasAttribute("data-adv")) { st.vegan = !st.vegan; b.classList.toggle("on", st.vegan); }
    else if (b.hasAttribute("data-adg")) { st.vege = !st.vege; b.classList.toggle("on", st.vege); }
    else if (b.hasAttribute("data-ad-here")) {
      var m = JK.mapObj(), c = spot();
      if (m.getZoom() + 1 < 16) { msg(T("Zoom in closer so the spot is exact.")); return; }
      if (c.lat < 18 || c.lat > 54 || c.lng < 73 || c.lng > 146) { msg(T("This place is outside Japan, Korea and China.")); return; }
      st.spot = c; st.step = "form"; x.hidden = true; render();
    }
    else if (b.hasAttribute("data-ad-back")) { st.step = "spot"; x.hidden = false; render(); }
    else if (b.hasAttribute("data-ad-photo")) document.getElementById("adFile").click();
    else if (b.hasAttribute("data-ad-rm")) { URL.revokeObjectURL(st.ph.u); st.ph = null; render(); }
    else if (b.hasAttribute("data-ad-send")) send(b);
  }
  var norm = function (s) { return String(s || "").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ""); };
  function spot() { var m = JK.mapObj(), r = x.getBoundingClientRect(), box = scr.getBoundingClientRect(), c = m.unproject([r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]); return { lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6) }; }
  async function send(btn) {
    if (busy) return; var nm = st.name.trim().slice(0, 80), c = st.spot;
    if (!c) { st.step = "spot"; x.hidden = false; render(); return; }
    if (!nm) { msg(T("Please enter the name.")); return; }
    if (!st.ph) { msg(T("Please add a photo of the outside.")); return; }
    var k = norm(nm);
    if (k && JK.places.list.some(function (o) { return Math.abs(o.lat - c.lat) < .0002 && Math.abs(o.lng - c.lng) < .0003 && [o.name, o.loc].some(function (v) { return norm(v) === k; }); })) { msg(T("This place is already on the map.")); return; }
    busy = true; btn.disabled = true; msg(T("Uploading photos…"));
    var path = await JK.sb.upload("newplace", st.ph.b);
    if (!path) { busy = false; btn.disabled = false; msg(T("Photo upload failed. Please try again.")); return; }
    msg(T("Sending…"));
    var r = await JK.sb.postId("new_places", { name: nm, lat: c.lat, lng: c.lng, cat: st.cat, cuisine: st.food ? JK.food.kinds.filter(function (f) { return f[0] === st.food; })[0][1] : "", halal: st.halal, vegan: st.vegan, vegetarian: st.vege || st.vegan, photo: path, device: JK.sb.dev() });
    busy = false; btn.disabled = false;
    if (!r.ok) { msg(/already on the map/.test(r.text || "") ? T("This place is already on the map.") : (r.msg || T("Could not send. Please try again."))); return; }
    if (Number.isInteger(r.id)) JK.places.addMine("np_" + r.id);
    close(); JK.toast(T("Sent. Thank you!") + " " + T("It shows for everyone after 2 other people confirm it."), 5000); JK.places.reloadTeam();
  }
  document.addEventListener("jk:lang", function () { if (st && p && !p.hidden) render(); });
  document.addEventListener("jk:screen", function (e) { if (e.detail !== "map" && st) close(); });
  JK.addPlace = { open: open, close: close };
})();
