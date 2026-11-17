/* Shared helpers for the database (Supabase, public key, read + add only) and for photos.
   JK.sb: get(path) · post(path, body) → { ok, status, msg } · dev() (random id of this phone, never shown) · photoUrl(path) · shrink(file) → JPEG blob ≤ ~380 KB · upload(placeId, blob) → path or null
   Limits (spam) are enforced by the database; a clear text is returned in msg. A slow or broken database never breaks the app. */
(function () {
  var SB = { url: "https://jsegdbtefxsforphluyc.supabase.co", key: "sb_publishable_E8yPPjj8k57QgddzT1Omqw_YkO6npc-" };
  var T = function (k) { return JK.i18n.T(k); };
  function h(extra) { var o = { apikey: SB.key }; if (SB.key.indexOf("eyJ") === 0) o.Authorization = "Bearer " + SB.key; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
  function dev() {
    try { var d = JSON.parse(localStorage.getItem("jk_dev")); if (d) return d; } catch (e) {}
    var d2 = ((typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).slice(0, 36);
    try { localStorage.setItem("jk_dev", JSON.stringify(d2)); } catch (e) {}
    return d2;
  }
  function why(tx) {
    return /busy, try again/.test(tx) ? T("Many people are posting right now. Please try again in an hour.") :
      /too many [a-z ]*today/.test(tx) ? T("You reached today's limit on this phone. Please try again tomorrow.") : "";
  }
  function get(path) { return fetch(SB.url + "/rest/v1/" + path, { headers: h() }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function post(path, body) {
    return fetch(SB.url + "/rest/v1/" + path, { method: "POST", headers: h({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify(body) })
      .then(function (r) { if (r.ok) return { ok: 1 }; return r.text().then(function (tx) { return { ok: 0, status: r.status, msg: why(tx) }; }); })
      .catch(function () { return { ok: 0, status: 0, msg: "" }; });
  }
  /* add a row and get its id back (used for a new restaurant): { ok, id, status, text, msg } */
  function postId(path, body) {
    return fetch(SB.url + "/rest/v1/" + path + "?select=id", { method: "POST", headers: h({ "Content-Type": "application/json", Prefer: "return=representation" }), body: JSON.stringify(body) })
      .then(function (r) { return r.text().then(function (tx) { var j = null; try { j = JSON.parse(tx); } catch (e) {} return { ok: r.ok, status: r.status, id: r.ok && Array.isArray(j) && j[0] ? j[0].id : null, text: tx, msg: why(tx) }; }); })
      .catch(function () { return { ok: false, status: 0, id: null, text: "", msg: "" }; });
  }
  /* any photo -> JPEG of at most ~380 KB; drawing it again also removes camera data such as the location */
  function shrink(file) {
    if (!file || file.size > 30e6 || (file.type && !/^image\//.test(file.type))) return Promise.reject();
    var load = window.createImageBitmap ? createImageBitmap(file) : new Promise(function (ok, no) { var i = new Image(), u = URL.createObjectURL(file); i.onload = function () { URL.revokeObjectURL(u); ok(i); }; i.onerror = no; i.src = u; });
    return load.then(async function (bmp) {
      var W = bmp.width || bmp.naturalWidth, H = bmp.height || bmp.naturalHeight; if (!W || !H) throw 0;
      var steps = [[1280, .78], [1100, .7], [900, .65], [720, .55], [560, .5], [420, .45]];
      for (var i = 0; i < steps.length; i++) {
        var k = Math.min(1, steps[i][0] / Math.max(W, H)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(H * k));
        var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0, c.width, c.height);
        var b = await new Promise(function (r) { c.toBlob(r, "image/jpeg", steps[i][1]); });
        if (b && b.size <= 380000) { if (bmp.close) bmp.close(); return b; }
      }
      throw 0;
    });
  }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
  function upload(pid, blob) {
    var slug = String(pid).toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 60) || "x", path = slug + "/" + (crypto.randomUUID ? crypto.randomUUID() : rnd(16)) + ".jpg";
    if (!/^[a-z0-9_]{1,60}\/[a-z0-9-]{8,40}\.(jpg|webp)$/.test(path)) return Promise.resolve(null);
    return fetch(SB.url + "/storage/v1/object/review-photos/" + path, { method: "POST", headers: h({ "Content-Type": "image/jpeg", "x-upsert": "false" }), body: blob })
      .then(function (r) { return r.ok ? path : null; }).catch(function () { return null; });
  }
  JK.sb = { get: get, post: post, postId: postId, dev: dev, why: why, shrink: shrink, upload: upload, photoUrl: function (p) { return SB.url + "/storage/v1/object/public/review-photos/" + p; }, okPath: function (p) { return /^[a-z0-9_]{1,60}\/[a-z0-9-]{8,40}\.(jpg|webp)$/.test(p); } };
})();
