/* Reviews: reading them (JK.reviews.load / html) and the "Write a review" sheet: stars, text, price per person, name, up to 3 photos.
   JK.price: sym(tier, country) · range(tier, country) = money per country (JP ¥ 1,500/4,000/10,000 · KR ₩ 13,000/30,000/80,000 · CN ¥ 50/150/400).
   Photos are made smaller on the phone (and lose camera data like the location) before they are uploaded. Spam limits come from the database. */
(function () {
  var T = function (k) { return JK.i18n.T(k); }, esc = JK.ui.esc;
  var PRC = { Japan: { s: "¥", b: [1500, 4000, 10000] }, Korea: { s: "₩", b: [13000, 30000, 80000] }, China: { s: "¥", b: [50, 150, 400] } };
  var nf = function (n) { return Math.round(n).toLocaleString("en-US"); }, P = function (c) { return PRC[c] || PRC.Japan; };
  JK.price = {
    sym: function (t, c) { return P(c).s.repeat(t); },
    range: function (t, c) { var p = P(c), b = p.b; return t === 1 ? T("under {0}").replace("{0}", p.s + nf(b[0])) : t === 4 ? p.s + nf(b[2]) + "+" : p.s + nf(b[t - 2]) + "–" + nf(b[t - 1]); }
  };
  var sheet = document.querySelector("#revSheet .sheet"), cur = null, st = { stars: 0, price: 0, photos: [] }, busy = false;
  var starSvg = function (on, s) { return '<svg viewBox="0 0 24 24" style="width:' + s + 'px;height:' + s + 'px" class="st' + (on ? " on" : "") + '"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>'; };
  function stars(n, s) { var o = ""; for (var i = 1; i <= 5; i++) o += starSvg(i <= n, s || 14); return '<span class="stars">' + o + "</span>"; }

  function load(id) {
    return JK.sb.get("reviews_public?place_id=eq." + encodeURIComponent(id) + "&select=stars,name,text,created_at,photos,price&order=created_at.desc&limit=20");
  }
  function html(list, country) {
    if (!list.length) return '<p class="muted">' + esc(T("No reviews yet")) + "</p>";
    return list.map(function (x) {
      var ph = (Array.isArray(x.photos) ? x.photos : []).filter(JK.sb.okPath).slice(0, 3).map(function (p) { return '<a href="' + esc(JK.sb.photoUrl(p)) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(JK.sb.photoUrl(p)) + '" alt="" loading="lazy"></a>'; }).join("");
      return '<div class="rv"><div class="rvh">' + stars(x.stars, 14) + "<b>" + esc(x.name || T("Traveler")) + "</b><span>" + esc((x.created_at || "").slice(0, 10)) + "</span>" +
        (x.price ? '<em title="' + esc(T("Price per person")) + '">' + esc(JK.price.sym(x.price, country)) + "</em>" : "") + "</div>" + (x.text ? "<p>" + esc(x.text) + "</p>" : "") + (ph ? '<div class="rvp">' + ph + "</div>" : "") + "</div>";
    }).join("");
  }

  function thumbs() {
    return st.photos.map(function (p, i) { return '<div class="ph"><img src="' + p.url + '" alt=""><button type="button" data-ph-del="' + i + '" aria-label="' + esc(T("Remove photo")) + '">' + JK.ic("close", 14) + "</button></div>"; }).join("") +
      (st.photos.length < 3 ? '<button type="button" class="ph add" data-ph-add aria-label="' + esc(T("Add photos (up to 3)")) + '">' + JK.ic("camera", 24) + "</button>" : "");
  }
  function render() {
    var p = cur, name = ""; try { name = JSON.parse(localStorage.getItem("jk_name")) || ""; } catch (e) {}
    var pr = [1, 2, 3, 4].map(function (t) { return '<button type="button" class="chip' + (st.price === t ? " on" : "") + '" data-pr="' + t + '">' + esc(JK.price.sym(t, p.country)) + "</button>"; }).join("");
    sheet.innerHTML = '<div class="handle"></div><div class="fhead"><h2>' + esc(T("Write a review")) + '</h2><button type="button" class="round sm" data-sheet-close aria-label="' + esc(T("Close")) + '">' + JK.ic("close", 20) + "</button></div>" +
      '<p class="sn">' + esc(JK.places.dname(p)) + '</p><div class="starpick" role="group" aria-label="' + esc(T("Please choose 1 to 5 stars.")) + '">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-st="' + i + '" aria-pressed="' + (st.stars >= i) + '">' + starSvg(st.stars >= i, 40) + "</button>"; }).join("") + "</div>" +
      '<label class="field area"><textarea id="rvText" maxlength="600" rows="4" placeholder="' + esc(T("What did you order? What was it like?")) + '" aria-label="' + esc(T("What did you order? What was it like?")) + '"></textarea></label>' +
      '<div class="fh">' + esc(T("Price per person (optional)")) + '</div><div class="frow">' + pr + '</div><p class="rng" id="rvRange">' + (st.price ? esc(JK.price.range(st.price, p.country)) : "") + "</p>" +
      '<div class="fh">' + esc(T("Your name (optional)")) + '</div><label class="field"><input id="rvName" maxlength="40" value="' + esc(name) + '" aria-label="' + esc(T("Your name (optional)")) + '"></label>' +
      '<div class="fh">' + esc(T("Add photos (up to 3)")) + '</div><div class="phs" id="rvPhs">' + thumbs() + '</div><input type="file" id="rvFile" accept="image/*" hidden>' +
      '<button type="button" class="btn" data-rv-send style="margin-top:18px">' + esc(T("Save review")) + "</button>";
  }
  function open(p) { cur = p; st = { stars: 0, price: 0, photos: [] }; render(); JK.sheet.open("revSheet"); }
  async function send() {
    if (busy) return;
    if (!st.stars) { JK.toast(T("Please choose 1 to 5 stars.")); return; }
    var b = sheet.querySelector("[data-rv-send]"), text = (document.getElementById("rvText").value || "").trim().slice(0, 600), name = (document.getElementById("rvName").value || "").trim().slice(0, 40);
    busy = true; b.disabled = true; b.textContent = T("Sending…");
    var paths = [];
    if (st.photos.length) {
      b.textContent = T("Uploading photos…");
      for (var i = 0; i < st.photos.length; i++) { var pth = await JK.sb.upload(cur.id, st.photos[i].blob); if (!pth) { JK.toast(T("Photo upload failed. Please try again.")); busy = false; b.disabled = false; b.textContent = T("Save review"); return; } paths.push(pth); }
    }
    var r = await JK.sb.post("reviews", { place_id: cur.id, stars: st.stars, price: st.price || null, name: name || null, text: text || null, photos: paths, device: JK.sb.dev() });
    busy = false; b.disabled = false; b.textContent = T("Save review");
    if (!r.ok) { JK.toast(r.msg || T("Could not send your review. Please try again.")); return; }
    try { localStorage.setItem("jk_name", JSON.stringify(name)); } catch (e) {}
    JK.toast(T("Review sent.")); JK.sheet.close(); JK.ratings.again(cur.id);
    document.dispatchEvent(new CustomEvent("jk:review", { detail: cur.id }));
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !sheet.contains(b)) return;
    if (b.dataset.st) { st.stars = +b.dataset.st; sheet.querySelectorAll("[data-st]").forEach(function (x) { var on = +x.dataset.st <= st.stars; x.setAttribute("aria-pressed", on); x.firstChild.classList.toggle("on", on); }); }
    else if (b.dataset.pr) { var t = +b.dataset.pr; st.price = st.price === t ? 0 : t; sheet.querySelectorAll("[data-pr]").forEach(function (x) { x.classList.toggle("on", +x.dataset.pr === st.price); }); document.getElementById("rvRange").textContent = st.price ? JK.price.range(st.price, cur.country) : ""; }
    else if (b.hasAttribute("data-ph-add")) document.getElementById("rvFile").click();
    else if (b.dataset.phDel) { var d = st.photos.splice(+b.dataset.phDel, 1)[0]; if (d) URL.revokeObjectURL(d.url); document.getElementById("rvPhs").innerHTML = thumbs(); }
    else if (b.hasAttribute("data-rv-send")) send();
  });
  sheet.addEventListener("change", function (e) {
    if (e.target.id !== "rvFile" || !e.target.files[0] || st.photos.length >= 3) return;
    var f = e.target.files[0]; e.target.value = ""; JK.toast(T("Preparing photo…"), 3000);
    JK.sb.shrink(f).then(function (blob) { st.photos.push({ blob: blob, url: URL.createObjectURL(blob) }); document.getElementById("rvPhs").innerHTML = thumbs(); }).catch(function () { JK.toast(T("Photo upload failed. Please try again.")); });
  });
  document.addEventListener("jk:lang", function () { if (cur && !document.getElementById("revSheet").hidden) render(); });
  JK.reviews = { load: load, html: html, stars: stars, open: open };
})();
