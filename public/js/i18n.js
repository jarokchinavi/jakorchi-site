/* Languages. English text is the key itself; lang/<code>.json holds one language (only the chosen one is downloaded). */
(function () {
  var LANGS = [["en","English"],["nl","Nederlands"],["de","Deutsch"],["fr","Français"],["es","Español"],["zh","中文"],["ja","日本語"],["ko","한국어"],["ar","العربية"]];
  var dict = {}, lang = "en";

  function saved() { try { return JSON.parse(localStorage.getItem("jk_lang")); } catch (e) { return null; } }
  function known(l) { return LANGS.some(function (x) { return x[0] === l; }); }
  function guess() { var n = (navigator.language || "en").slice(0, 2).toLowerCase(); return known(n) ? n : "en"; }

  function load(l) {
    if (l === "en" || dict[l]) return Promise.resolve();
    return fetch("/lang/" + l + ".json?v=" + BUILD).then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { dict[l] = j; }).catch(function () {});
  }
  function T(k) { var d = dict[lang]; return (d && d[k]) || k; }

  function apply() {
    var h = document.documentElement;
    h.lang = lang; h.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i]").forEach(function (el) { el.textContent = T(el.getAttribute("data-i")); });
    document.querySelectorAll("[data-ia]").forEach(function (el) { el.setAttribute("aria-label", T(el.getAttribute("data-ia"))); });
    h.classList.remove("wait");
  }
  function set(l) {
    if (!known(l)) l = "en";
    return load(l).then(function () {
      lang = l;
      try { localStorage.setItem("jk_lang", JSON.stringify(l)); } catch (e) {}
      apply();
    });
  }

  var start = saved(); if (!known(start)) start = guess();
  window.JK.i18n = { LANGS: LANGS, T: T, set: set, get: function () { return lang; } };
  window.JK.ready = load(start).then(function () { lang = start; apply(); });
})();
