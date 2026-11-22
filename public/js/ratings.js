/* Star ratings of the places on the map (read only, from the public view place_ratings in the database).
   JK.ratings.want(ids) asks for the ones on screen (max 80 per call, each place at most every 10 minutes) · JK.ratings.avg(id) = number or null.
   If the database is slow or down nothing breaks: pins just show without a number. Event "jk:ratings" when new numbers arrived. */
(function () {
  var R = new Map(), at = {}, q = new Set(), tm = 0, bad = 0;
  function run() {
    tm = 0; var ids = Array.from(q).slice(0, 80); ids.forEach(function (i) { q.delete(i); });
    if (!ids.length) return;
    JK.sb.get("place_ratings?select=place_id,n,sum_stars,n_price,sum_price&place_id=in.(" + ids.join(",") + ")")
      .then(function (a) { a.forEach(function (x) { R.set(x.place_id, { n: x.n, s: x.sum_stars, np: x.n_price || 0, sp: x.sum_price || 0 }); }); if (a.length) document.dispatchEvent(new Event("jk:ratings")); bad = 0; })
      .catch(function () { bad = Date.now(); })
      .then(function () { if (q.size && !tm) tm = setTimeout(run, 400); });
  }
  /* every place that has a review (for the Top rated and Price filters): one call, at most every 10 minutes */
  var allAt = 0;
  function all() {
    if (Date.now() - allAt < 600000) return; allAt = Date.now();
    JK.sb.get("place_ratings?select=place_id,n,sum_stars,n_price,sum_price&n=gt.0&limit=5000")
      .then(function (a) { a.forEach(function (x) { R.set(x.place_id, { n: x.n, s: x.sum_stars, np: x.n_price || 0, sp: x.sum_price || 0 }); }); document.dispatchEvent(new Event("jk:ratings")); })
      .catch(function () { allAt = 0; });
  }
  JK.ratings = {
    all: all,
    avg: function (id) { var r = R.get(id); return r && r.n ? r.s / r.n : null; },
    count: function (id) { var r = R.get(id); return r ? r.n : 0; },
    price: function (id) { var r = R.get(id); return r && r.np ? Math.min(4, Math.max(1, Math.round(r.sp / r.np))) : 0; },
    again: function (id) { delete at[id]; this.want([id]); },
    want: function (ids) {
      var now = Date.now();
      ids.forEach(function (id) { if (/^[A-Za-z0-9_]{1,60}$/.test(id) && (!at[id] || now - at[id] > 600000)) { at[id] = now; q.add(id); } });
      if (q.size && !tm) tm = setTimeout(run, bad && now - bad < 30000 ? 30000 : 350);
    }
  };
})();
