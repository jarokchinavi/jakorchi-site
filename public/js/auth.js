/* Is the visitor signed in? Runs before the page is drawn.
   When signed in, the Sign in / Create account buttons are hidden (class "in" on <html>).
   Accounts are not live yet: until they are, nobody is signed in. When they go live, the
   sign-in code calls JKAuth.signIn(user) / JKAuth.signOut(); a Supabase session is also recognised. */
(function () {
  function hasUser() {
    try { var v = localStorage.getItem("jk_user"); return !!v && v !== "null" && v !== "false"; } catch (e) { return false; }
  }
  function hasSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          if (s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now())) return true;
        }
      }
    } catch (e) {}
    return false;
  }
  function signedIn() { return hasUser() || hasSession(); }
  function refresh() {
    document.documentElement.classList.toggle("in", signedIn());
    document.dispatchEvent(new Event("jk:auth"));
  }
  window.JKAuth = {
    signedIn: signedIn,
    refresh: refresh,
    signIn: function (u) { try { localStorage.setItem("jk_user", JSON.stringify(u || true)); } catch (e) {} refresh(); },
    signOut: function () { try { localStorage.removeItem("jk_user"); } catch (e) {} refresh(); }
  };
  document.documentElement.classList.toggle("in", signedIn());
  window.addEventListener("storage", refresh); /* signed in or out in another tab */
})();
