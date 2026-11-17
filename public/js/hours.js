/* "Open now" from the opening hours of OpenStreetMap (text like "Mo-Fr 11:00-22:00; Sa,Su 10:00-23:00", "24/7").
   JK.hours.openNow(text, country) -> true (open now) | false (closed now) | null (we cannot tell: no hours or a form we do not read).
   Local time of the country: Japan and Korea UTC+9, China UTC+8. No library; anything unusual (sunrise, weeks, months) = null, never a guess. */
(function () {
  var D = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
  function days(s) {
    var out = {}; s = s.trim().toLowerCase(); if (!s) { for (var i = 0; i < 7; i++) out[i] = 1; return out; }
    var ok = s.split(",").every(function (p) {
      p = p.trim(); var m = p.match(/^(su|mo|tu|we|th|fr|sa)(?:\s*-\s*(su|mo|tu|we|th|fr|sa))?$/); if (!m) return false;
      var a = D[m[1]], b = m[2] ? D[m[2]] : a; for (var k = a; ; k = (k + 1) % 7) { out[k] = 1; if (k === b) break; } return true;
    });
    return ok ? out : null;
  }
  function times(s) {
    var r = [], ok = s.split(",").every(function (p) {
      var m = p.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/); if (!m) return false;
      r.push([+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]]); return true;
    });
    return ok ? r : null;
  }
  function openNow(text, country) {
    text = String(text || "").trim(); if (!text) return null; if (/^24\/7$/i.test(text)) return true;
    var off = country === "China" ? 8 : 9, d = new Date(Date.now() + off * 36e5), day = d.getUTCDay(), t = d.getUTCHours() * 60 + d.getUTCMinutes(), prev = (day + 6) % 7;
    var today = null, spill = false, rules = text.split(";");
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i].trim(); if (!r) continue;
      if (/^(ph|sh)\b/i.test(r)) continue; /* public holidays: ignored */
      var m = r.match(/^((?:(?:su|mo|tu|we|th|fr|sa)(?:\s*-\s*(?:su|mo|tu|we|th|fr|sa))?\s*,?\s*)*)\s*(.*)$/i); if (!m) return null;
      var dd = days(m[1].replace(/,\s*$/, "")), rest = m[2].trim().toLowerCase(); if (!dd) return null;
      if (rest === "off" || rest === "closed") { if (dd[day]) today = []; continue; }
      if (/[a-z]/.test(rest.replace(/\boff\b/, ""))) return null; /* sunrise, weeks, months ... */
      var tt = times(rest); if (!tt) return null;
      if (dd[day]) today = tt;
      if (dd[prev]) tt.forEach(function (x) { if (x[1] < x[0] && t < x[1]) spill = true; });
    }
    if (today === null && !spill) return false;
    var open = spill; (today || []).forEach(function (x) { if (x[1] > x[0] ? (t >= x[0] && t < x[1]) : (t >= x[0])) open = true; });
    return open;
  }
  JK.hours = { openNow: openNow };
})();
