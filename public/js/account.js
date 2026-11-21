/* Accounts (free): Supabase Auth by plain fetch (e-mail + password), the welcome screen, and the copy of saved places + lists to the account.
   The login is kept on the phone (key sb-<project>-auth-token, refreshed by itself) until Sign out. Saved data: table user_saved, one row per account.
   JK.account: open("in"|"up") · signOut() · sync()   ·   texts: all through T() */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var T = function (k) { return JK.i18n.T(k); };
  var SB = JK.sb.cfg, KEY = "sb-" + SB.url.replace(/^https:\/\/([^.]+)\..*$/, "$1") + "-auth-token";
  var K = ["jk_favs", "jk_lists", "jk_favobj"];
  var page = $("#welcome"), form = $("#wForm"), err = $("#wErr"), go = $("#wGo"), sw = $("#wSw"), nameF = $("#wName"), mode = "in", busy = false, applying = false, fromBtn = false, tm = 0, lastSync = 0;
  var root = document.documentElement;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var put = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var del = function (k) { try { localStorage.removeItem(k); } catch (e) {} };

  /* ---- session ---- */
  function sess() { try { var s = JSON.parse(get(KEY)); return s && s.access_token && s.user ? s : null; } catch (e) { return null; } }
  function norm(j) { return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user && j.user.id, email: j.user && j.user.email, user_metadata: { name: (j.user && j.user.user_metadata && j.user.user_metadata.name) || "" } } }; }
  function api(path, body, tok) {
    var h = { apikey: SB.key, "Content-Type": "application/json" }; if (tok) h.Authorization = "Bearer " + tok;
    return fetch(SB.url + path, { method: "POST", headers: h, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.text().then(function (tx) { var j = {}; try { j = JSON.parse(tx) || {}; } catch (e) {} return { ok: r.ok, status: r.status, j: j }; }); })
      .catch(function () { return { ok: false, status: 0, j: {} }; });
  }
  var refreshing = null;
  function token() {
    var s = sess(); if (!s) return Promise.resolve(null);
    if (s.expires_at * 1000 - Date.now() > 60000) return Promise.resolve(s.access_token);
    if (!refreshing) refreshing = api("/auth/v1/token?grant_type=refresh_token", { refresh_token: s.refresh_token }).then(function (r) {
      refreshing = null;
      if (r.ok && r.j.access_token) { put(KEY, JSON.stringify(norm(r.j))); return r.j.access_token; }
      if (r.status === 400 || r.status === 401 || r.status === 403) { del(KEY); del("jk_user"); JKAuth.refresh(); } /* login ended: saved places stay on the phone */
      return null;
    });
    return refreshing;
  }
  function rest(path, opt) {
    return token().then(function (t) {
      if (!t) throw 0;
      opt = opt || {}; opt.headers = Object.assign({ apikey: SB.key, Authorization: "Bearer " + t }, opt.headers || {});
      return fetch(SB.url + "/rest/v1/" + path, opt);
    });
  }

  /* ---- saved data <-> account ---- */
  function readLocal() { var o = {}; K.forEach(function (k) { try { o[k] = JSON.parse(get(k)); } catch (e) { o[k] = null; } }); return o; }
  function hasLocal(o) { return (o.jk_favs && o.jk_favs.length) || (o.jk_lists || []).some(function (l) { return l && ((l.ids && l.ids.length) || l.n); }); }
  function writeLocal(d) { K.forEach(function (k) { if (d && d[k] != null) put(k, JSON.stringify(d[k])); else del(k); }); applying = true; JK.lists.reload(); applying = false; }
  function union(a, b) { var s = {}, o = []; (a || []).concat(b || []).forEach(function (i) { if (typeof i === "string" && !s[i]) { s[i] = 1; o.push(i); } }); return o; }
  function merge(a, b) {
    var lists = {}, order = [];
    (b.jk_lists || []).concat(a.jk_lists || []).forEach(function (l) {
      if (!l || !l.id) return;
      if (!lists[l.id]) { lists[l.id] = { id: l.id, n: l.n || "", d: l.d || "", ids: [] }; order.push(l.id); }
      var t = lists[l.id]; t.ids = union(t.ids, l.ids); if (l.n && !t.n) t.n = l.n;
    });
    return { jk_favs: union(b.jk_favs, a.jk_favs), jk_lists: order.map(function (i) { return lists[i]; }), jk_favobj: Object.assign({}, b.jk_favobj || {}, a.jk_favobj || {}) };
  }
  var dirty = function () { return get("jk_sync_dirty") === "1"; };
  function pull() {
    return rest("user_saved?select=data,updated_at&limit=1").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (a) { return a[0] || null; });
  }
  function push(data) {
    var s = sess(); if (!s) return Promise.resolve(false);
    return rest("user_saved?on_conflict=user_id", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ user_id: s.user.id, data: data }) })
      .then(function (r) { if (!r.ok) return false; return r.json().then(function (a) { if (a && a[0]) put("jk_sync_at", a[0].updated_at); del("jk_sync_dirty"); return true; }); })
      .catch(function () { return false; });
  }
  function flush() { return dirty() && sess() ? push(readLocal()) : Promise.resolve(true); }
  /* start of the app, back to the app, and right after sign-in: this phone <-> account */
  function sync() {
    var s = sess(); if (!s) return Promise.resolve();
    lastSync = Date.now();
    return pull().then(function (row) {
      var local = readLocal(), uid = s.user.id, mine = get("jk_sync_uid") === uid, fresh = get("jk_sync_uid") == null;
      if (!row) {
        put("jk_sync_uid", uid);
        if (mine || fresh) return hasLocal(local) ? push(local) : 0;
        writeLocal({}); return 0; /* the phone still held another account's places */
      }
      if (mine && dirty()) return push(local); /* this phone changed something: it wins */
      if (mine && get("jk_sync_at") === row.updated_at) return 0;
      var d = fresh && hasLocal(local) ? merge(local, row.data || {}) : (row.data || {});
      writeLocal(d); put("jk_sync_uid", uid); put("jk_sync_at", row.updated_at);
      if (d !== row.data) return push(d);
    }).catch(function () {});
  }
  document.addEventListener("jk:lists", function () {
    if (applying || !sess()) return;
    put("jk_sync_dirty", "1"); clearTimeout(tm); tm = setTimeout(flush, 1500);
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) { if (dirty()) flush(); } else if (sess() && Date.now() - lastSync > 20000) sync(); });

  function signOut() {
    return flush().then(function (ok) {
      if (!ok) { JK.toast(T("Could not save your places. Try again with internet.")); return; }
      var s = sess(); if (s) api("/auth/v1/logout", null, s.access_token);
      [KEY, "jk_sync_at", "jk_sync_uid", "jk_sync_dirty"].concat(K).forEach(del);
      applying = true; JK.lists.reload(); applying = false;
      try { sessionStorage.setItem("jk_wskip", "1"); } catch (e) {} root.classList.add("wskip"); /* no welcome screen right after signing out */
      JKAuth.signOut();
    });
  }

  /* ---- welcome screen ---- */
  function say(t) { err.textContent = t || ""; }
  function why(r) {
    var c = r.j.error_code || r.j.code || "", m = String(r.j.msg || r.j.message || r.j.error_description || "");
    if (!r.status) return T("No internet. Please try again.");
    if (c === "invalid_credentials" || /invalid login/i.test(m)) return T("Wrong email or password.");
    if (c === "user_already_exists" || c === "email_exists" || /already registered/i.test(m)) return T("This email already has an account. Try signing in.");
    if (c === "weak_password") return T("Use a password of at least 8 characters.");
    if (c === "validation_failed" || c === "email_address_invalid" || /valid email/i.test(m)) return T("Please enter a valid email address.");
    if (r.status === 429 || /rate limit/i.test(c + m)) return T("Too many tries. Please wait a little and try again.");
    return T("Something went wrong. Please try again.");
  }
  function draw() {
    var up = mode === "up";
    nameF.hidden = !up;
    go.textContent = busy ? T(up ? "Creating account…" : "Signing in…") : T(up ? "Create account" : "Sign in");
    go.disabled = busy;
    sw.innerHTML = JK.ui.esc(T(up ? "Already have an account?" : "New here?")) + " <u>" + JK.ui.esc(T(up ? "Sign in" : "Create an account")) + "</u>";
    form.elements.password.autocomplete = up ? "new-password" : "current-password";
    form.elements.password.setAttribute("data-ip", up ? "At least 8 characters" : "Your password");
    form.elements.password.placeholder = T(up ? "At least 8 characters" : "Your password");
  }
  function setMode(m) { mode = m; say(""); draw(); }
  /* eye button: show / hide the typed password (the keyboard stays open, the cursor stays) */
  var eye = $("#wEye");
  function eyeSet(on) {
    form.elements.password.type = on ? "text" : "password";
    eye.setAttribute("aria-pressed", String(on));
    eye.setAttribute("aria-label", T(on ? "Hide password" : "Show password"));
  }
  eye.addEventListener("mousedown", function (e) { e.preventDefault(); });
  eye.addEventListener("click", function () { var p = form.elements.password, s = p.selectionStart, e = p.selectionEnd; eyeSet(p.type === "password"); try { p.setSelectionRange(s, e); } catch (x) {} });
  function show() { page.classList.add("on"); }
  function hide() { page.classList.remove("on"); }
  function open(m) {
    setMode(m === "up" ? "up" : "in"); fromBtn = true; show(); page.scrollTop = 0;
    try { history.pushState({ jk: "w" }, ""); } catch (e) {}
  }
  function skip() {
    try { sessionStorage.setItem("jk_wskip", "1"); } catch (e) {}
    root.classList.add("wskip"); hide();
    if (fromBtn) { fromBtn = false; if (history.state && history.state.jk === "w") history.back(); }
  }
  window.addEventListener("popstate", function () { if (fromBtn && page.classList.contains("on") && !(history.state && history.state.jk === "w")) { fromBtn = false; skip(); } });
  var prev = JK.layerOpen; JK.layerOpen = function () { return prev() || page.classList.contains("on"); };

  function done(j) {
    var s = norm(j); put(KEY, JSON.stringify(s));
    var u = { name: s.user.user_metadata.name || "", email: s.user.email || "" };
    var fin = function () { busy = false; form.reset(); eyeSet(false); draw(); fromBtn = false; hide(); JKAuth.signIn(u); };
    Promise.race([sync(), new Promise(function (r) { setTimeout(r, 4000); })]).then(fin, fin);
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return;
    var up = mode === "up", f = form.elements, email = f.email.value.trim(), pw = f.password.value, nm = f.name.value.trim().slice(0, 40);
    if (!email || !pw) return say(T("Fill in your email and password."));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say(T("Please enter a valid email address."));
    if (up && pw.length < 8) return say(T("Use a password of at least 8 characters."));
    busy = true; say(""); draw();
    var q = up ? api("/auth/v1/signup", { email: email, password: pw, data: { name: nm } }) : api("/auth/v1/token?grant_type=password", { email: email, password: pw });
    q.then(function (r) {
      if (r.ok && r.j.access_token && r.j.user) return done(r.j);
      busy = false;
      if (r.ok && up) { setMode("in"); say(T("Check your email to confirm your account, then sign in.")); return; } /* only if "Confirm email" is on in Supabase */
      say(why(r)); draw();
    });
  });
  sw.addEventListener("click", function () { setMode(mode === "up" ? "in" : "up"); });
  $("#wSkip").addEventListener("click", skip);
  document.addEventListener("jk:lang", function () { draw(); eyeSet(form.elements.password.type === "text"); });
  document.addEventListener("jk:auth", function () { if (JKAuth.signedIn()) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && fromBtn && page.classList.contains("on") && !JK.ui.isOpen()) skip(); });

  JK.account = { open: open, signOut: signOut, sync: sync };
  draw();
  if (sess()) sync();
})();
