/* Line icons + row helpers for the settings and profile pages (own drawings, no emoji).
   JK.ic("name") = <svg> · JK.row(attr, label, value, cls, icon) = one tappable row · JK.grp(rows) = rounded group. */
(function () {
  var P = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    out: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M20 12H9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01" stroke-width="2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    restaurant: '<path d="M4 12h16c0 4.2-3.4 7-8 7s-8-2.8-8-7zM9 20.5h6M14 3.5l-2.5 6.5M17.5 4.5L14.5 10"/>',
    coffee: '<path d="M5 9h11v4.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 13.5zM16 10.5h1.5a2 2 0 0 1 0 4H16M8.5 3.5c-.8 1 .8 1.6 0 2.8M12.5 3.5c-.8 1 .8 1.6 0 2.8M4 20.5h13"/>',
    dessert: '<path d="M8.5 12.5L12 21l3.5-8.5M7 12.5a5 5 0 0 1 10 0zM12 3.5c1.5 1 1.5 2.5 0 3.5"/>',
    drinks: '<path d="M6 9h9v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM15 11h2.2a1.8 1.8 0 0 1 1.8 1.8v2.4a1.8 1.8 0 0 1-1.8 1.8H15M6 9a2.5 2.5 0 0 1 3-2.5 3 3 0 0 1 5.5 1A2 2 0 0 1 15 9"/>',
    fast: '<path d="M4 20L20 4"/><circle cx="9" cy="15" r="2.3"/><circle cx="13" cy="11" r="2.3"/><circle cx="17" cy="7" r="2.3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    sliders: '<path d="M4 7h8M16 7h4M4 17h4M12 17h8"/><circle cx="14" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    map: '<path d="M9 4L3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5zM9 4v14M15 6.5v14"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="2"/>',
    menu: '<path d="M4 8h16M4 16h10"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    listplus: '<path d="M4 7h11M4 12h8M4 17h6M17 14v6M14 17h6"/>',
    addpin: '<path d="M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0c0 5-6 10.5-6 10.5zM12 8v5M9.5 10.5h5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    phrase: '<path d="M4 5h16v11H11l-4 4v-4H4zM8 9h8M8 12.5h5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    install: '<path d="M12 4v11M7.5 11L12 15.5 16.5 11M5 19h14"/>',
    city: '<path d="M4 20V9l6-3v14M10 20V4l9 3v13M3 20h18M13 10h3M13 13h3M13 16h3"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    halal: '<path d="M18 14.5A7 7 0 1 1 10 5a5.5 5.5 0 0 0 8 9.5z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19l8-8"/>',
    flag: '<path d="M6 21V4M6 5h11l-2.5 3.5L17 12H6"/>',
    bread: '<path d="M5 17v-5a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM9 10l1.5 3M13 9.5l1.5 3"/>',
    jp: '<path d="M4 15c0-2 3-3.5 8-3.5s8 1.5 8 3.5-3 3.5-8 3.5-8-1.5-8-3.5zM5.5 12.5C6 9 9 8 12 8s6 1 6.5 4.5"/>',
    kr: '<path d="M5 11h14v2a7 7 0 0 1-14 0zM3 11h2M19 11h2M9 6.5c0 1 1 1 1 2M14 6.5c0 1 1 1 1 2M8 21h8"/>',
    cn: '<ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    pins: '<path d="M9 19s-4-3.7-4-7a4 4 0 0 1 8 0c0 3.3-4 7-4 7z"/><path d="M15.5 17s-3.5-3.2-3.5-6a3.5 3.5 0 0 1 7 0c0 2.8-3.5 6-3.5 6z"/>',
    share: '<path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    warn: '<path d="M12 4l9 16H3zM12 10v4M12 17h.01"/>',
    nav: '<path d="M4 11l17-7-7 17-2.5-7.5z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M9 8.5l3 4.5 3-4.5M9.5 13h5M9.5 15.5h5M12 13v5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bookmark: '<path d="M7 4h10v17l-5-4-5 4z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="2.2"/>'
  };
  JK.ic = function (n, s) { return '<svg class="ic"' + (s ? ' style="width:' + s + 'px;height:' + s + 'px"' : "") + ' viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || "") + '</svg>'; };
  JK.row = function (attr, label, value, cls, icon) {
    return '<button type="button" class="row ' + (cls || "") + '" ' + attr + '>' + (icon ? JK.ic(icon) : "") + '<span class="l">' + JK.ui.esc(label) + '</span><span class="v">' +
      (value ? '<span class="vt">' + value + '</span>' : "") + '<i class="chev" aria-hidden="true"></i></span></button>';
  };
  JK.grp = function (rows) { return '<div class="grp">' + rows + '</div>'; };
})();
