/* Jakorchi icons and map pins (own drawings, no system emoji). Loaded before app.js. */
const IC={
 pin:'<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 camera:'<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 bookmark:'<path d="M7 4h10v17l-5-3.6L7 21z"/>',
 map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
 edit:'<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
 share:'<path d="M12 15V3M7 8l5-5 5 5M5 13v7h14v-7"/>',
 store:'<path d="M4 9.5L5.5 4h13L20 9.5M5 10.5V20h14v-9.5M10 20v-5h4v5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/>',
 phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
 utensils:'<path d="M7 3v8a2 2 0 0 0 4 0V3M9 3v18M17 3c-2 1.5-3 4-3 7 0 1.5 1 2.5 2 2.7V21h2V3z"/>',
 plate:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
 cup:'<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3c-1 1.2 1 2.2 0 3.6M12 3c-1 1.2 1 2.2 0 3.6"/>',
 cake:'<path d="M4 20h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 15.2c2 1.3 4 1.3 5.3 0 1.4 1.3 4 1.3 5.4 0 1.3 1.3 3.3 1.3 5.3 0M12 11V7.5M12 4.5v.01"/>',
 glass:'<path d="M5 4h14l-7 8zM12 12v8M8 20h8"/>',
 dumpling:'<path d="M3 15c0-5 4-8 9-8s9 3 9 8c-2 1.8-5.5 3-9 3s-7-1.2-9-3z"/><path d="M8 9.5l1 2.2M12 8.5v2.4M16 9.5l-1 2.2"/>',
 noodle:'<path d="M3 11h18a9 8.5 0 0 1-18 0z"/><path d="M13.5 3l6 6M17 2.5l4.5 4.5M7 14.5c1.7-.9 3.3.9 5 0s3.3.9 5 0"/>',
 sushi:'<rect x="3.5" y="11.5" width="17" height="7" rx="3.5"/><path d="M3.8 12.5c2.5-3.6 13.9-3.6 16.4 0M10.5 9.8l1.8 8.7"/>',
 hotpot:'<path d="M4 11h16v2.5a6.5 6.5 0 0 1-6.5 6.5h-3A6.5 6.5 0 0 1 4 13.5zM2 11h20M8 7.5c-1-1.3 1-2 0-3.3M12 7.5c-1-1.3 1-2 0-3.3M16 7.5c-1-1.3 1-2 0-3.3"/>',
 heart:'<path d="M12 20s-7.5-4.8-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.2 12 20 12 20z"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
 warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.01"/>',
 leaf:'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
 home:'<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
 spark:'<path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z"/>',
 broom:'<path d="M20 4l-7.5 7.5M9.5 9.5l5 5-1.8 5.5c-3.4-.4-6.6-2.4-8.7-5.4z"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/><circle cx="12" cy="12" r="6.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
 sun:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
 ruler:'<path d="M3 16l13-13 5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
 route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'
};
/* flags: simple own drawings */
const FLAG={
 Japan:'<svg class="flg" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" rx="3" fill="#fff" stroke="#d9d4c8"/><circle cx="15" cy="10" r="5.6" fill="#bc002d"/></svg>',
 Korea:'<svg class="flg" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" rx="3" fill="#fff" stroke="#d9d4c8"/><path d="M10 10a5 5 0 0 1 10 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 0-5 0z" fill="#cd2e3a"/><path d="M10 10a5 5 0 0 0 10 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 0-5 0z" fill="#0047a0"/><g stroke="#222" stroke-width="1.1"><path d="M4 5l2.5-2M5 6l2.5-2M23.5 3l2.5 2M22.5 4l2.5 2M4 15l2.5 2M5 14l2.5 2M23.5 17l2.5-2M22.5 16l2.5-2"/></g></svg>',
 China:'<svg class="flg" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" rx="3" fill="#de2910"/><path d="M6.5 3.5l1 3h3.1l-2.5 1.8 1 3-2.6-1.9-2.5 1.9 1-3-2.6-1.8h3.2z" fill="#ffde00"/><g fill="#ffde00"><circle cx="12.5" cy="3.5" r=".9"/><circle cx="14.2" cy="5.8" r=".9"/><circle cx="14.2" cy="8.8" r=".9"/><circle cx="12.5" cy="11" r=".9"/></g></svg>'
};
const si=(n,c)=>`<svg class="ic${c?" "+c:""}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||""}</svg>`;

const INK="#26201b",GOLD="#c9a45c",CREAM="#fbf3e2",PS='fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"';
const PK={
 restaurant:{c:"#b3321f",g:c=>`<g ${PS} stroke="${c}"><path d="M6.3 3.2v5.6a2.7 2.7 0 0 0 5.4 0V3.2M9 3.2v17.6"/></g><path d="M17.8 3c-2.7 1.5-3.9 4.2-3.9 7.2 0 1.5.9 2.5 2.3 2.8V20.8h2.6V3z" fill="${c}"/>`},
 coffee:{c:"#6b4226",g:c=>`<path d="M4.5 9.5h11.5v4.7a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-5-5z" fill="${c}"/><g ${PS} stroke="${c}"><path d="M16 11h1.3a2.6 2.6 0 0 1 0 5.2H15.6M8 2.8c-1 1.2 1 2.2 0 3.6M12 2.8c-1 1.2 1 2.2 0 3.6M3.5 21.4h14"/></g>`},
 bakery:{c:"#b0701c",g:c=>`<path d="M3.6 11.2c0-3.8 3.7-6.3 8.4-6.3s8.4 2.5 8.4 6.3c0 1.3-.8 2.3-2 2.6v4.6a2.2 2.2 0 0 1-2.2 2.2H7.8a2.2 2.2 0 0 1-2.2-2.2v-4.6c-1.2-.3-2-1.3-2-2.6z" fill="${c}"/><g fill="none" stroke="${CREAM}" stroke-width="1.7" stroke-linecap="round"><path d="M8.6 9.4l1.5 3.2M12.1 8.8l1.5 3.4M15.6 9.4l1.3 2.9"/></g>`},
 dessert:{c:"#b8386b",g:c=>`<path d="M7.6 12.2h8.8L12 22z" fill="${c}"/><circle cx="12" cy="8.2" r="5.2" fill="${c}"/><path d="M9.4 7.2a3 3 0 0 1 2.4-2.2" fill="none" stroke="${CREAM}" stroke-width="1.5" stroke-linecap="round"/>`},
 drinks:{c:"#51429c",g:c=>`<path d="M3.8 4.2h16.4L12 13.4z" fill="${c}"/><g ${PS} stroke="${c}"><path d="M12 13.4v7M7.6 20.8h8.8M15.2 1.8L12.3 7"/></g>`},
 fast:{c:"#c9620f",g:c=>`<path d="M4.2 11.2a7.8 6.4 0 0 1 15.6 0z" fill="${c}"/><rect x="3" y="12.6" width="18" height="2.8" rx="1.4" fill="${c}"/><path d="M4.4 16.8h15.2v.6a3 3 0 0 1-3 3H7.4a3 3 0 0 1-3-3z" fill="${c}"/><g fill="${CREAM}"><circle cx="9" cy="8.6" r=".9"/><circle cx="12.2" cy="7.2" r=".9"/><circle cx="15.2" cy="8.8" r=".9"/></g>`}
};
const HEART='<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>',MARK='<path d="M7.2 3.4h9.6a1 1 0 0 1 1 1V21l-5.8-4.2L6.2 21V4.4a1 1 0 0 1 1-1z"/>';
let SV=new Map(),BEEN=new Set();/* saved places: id -> "fav" | "list" (rebuilt at every map update) */
const svBuild=()=>{SV=new Map();ulists.forEach(l=>l.ids.forEach(i=>SV.set(i,"list")));favs.forEach(i=>SV.set(i,"fav"));BEEN=new Set((ulists.find(l=>l.id==="been")||{ids:[]}).ids)};
const pinKind=r=>r.cat==="dessert"?((r.sub==="bakery"||r.sub==="pastry"||r.cuisine==="bakery")?"bakery":"dessert"):PK[r.cat]?r.cat:"restaurant";
const pinBadge=(t,cx,cy)=>`<g transform="translate(${cx} ${cy})"><circle r="8.6" fill="#fff" stroke="${GOLD}" stroke-width="1.1"/><g transform="scale(.58) translate(-12 -12)"><circle cx="12" cy="12" r="12" fill="${BD[t].c}"/><g transform="translate(2.4 2.4) scale(.8)">${BD[t].g}</g></g></g>`;
const pinFlags=r=>({hl:!!(r.halal||fvy(r,"halal")),vg:!!(r.veg||r.vegan||fvy(r,"vegan")||fvy(r,"vegetarian"))});
/* food icons for pins: ramen / sushi / Korean grill / dumplings, else the category icon */
const CU={
 noodle:c=>`<path d="M2.8 11.2h18.4a9.2 8.6 0 0 1-18.4 0z" fill="${c}"/><g ${PS} stroke="${c}"><path d="M13.5 2.8l6.5 6.6M17 2.2l5 5"/></g><path d="M6.6 14.4c1.8-1 3.6 1 5.4 0s3.6 1 5.4 0" fill="none" stroke="${CREAM}" stroke-width="1.5" stroke-linecap="round"/>`,
 sushi:c=>`<path d="M3 12.6c0-2.4 4-4.4 9-4.4s9 2 9 4.4z" fill="${c}"/><rect x="3.4" y="12.6" width="17.2" height="6.6" rx="3.3" fill="none" stroke="${c}" stroke-width="2"/><path d="M10 8.8l2.2 10.2" stroke="${c}" stroke-width="2.2"/>`,
 grill:c=>`<path d="M3.5 11h17v1.5a8.5 8 0 0 1-17 0z" fill="${c}"/><g ${PS} stroke="${c}"><path d="M8 7.5c-1-1.3 1-2 0-3.4M12 7.5c-1-1.3 1-2 0-3.4M16 7.5c-1-1.3 1-2 0-3.4M8.5 19.5l-1.5 2.3M15.5 19.5l1.5 2.3"/></g>`,
 dumpling:c=>`<path d="M2.5 15.5c0-5.2 4.3-8.5 9.5-8.5s9.5 3.3 9.5 8.5c-2.2 2-5.8 3.2-9.5 3.2s-7.3-1.2-9.5-3.2z" fill="${c}"/><g fill="none" stroke="${CREAM}" stroke-width="1.5" stroke-linecap="round"><path d="M8 9.8l1.1 2.4M12 8.9v2.6M16 9.8l-1.1 2.4"/></g>`};
const cuKey=r=>{if(r.cat!=="restaurant"&&r.cat!=="fast")return"";const c=(r.cuisine||"").toLowerCase();return/ramen|noodle|udon|soba|pho/.test(c)?"noodle":/sushi/.test(c)?"sushi":/korean|bbq|barbecue|yakiniku|grill/.test(c)?"grill":/chinese|dumpling|dim.?sum|baozi/.test(c)?"dumpling":""};
/* pin = rounded badge with a point. States: normal, saved (red / navy), visited (green check), selected (css .sel), price tag when visitors gave prices */
const pinSvg=r=>{const k=pinKind(r),P=PK[k],sv=SV.get(r.id)||"",vis=BEEN.has(r.id),{hl,vg}=pinFlags(r),t=prOf(r),ck=cuKey(r),col=vis&&!sv?"#4f7d57":P.c;
 const fill=sv==="fav"?"#a82a1d":sv==="list"?"#1c2340":vis?"#f1f6f1":"#fff",rim=sv?GOLD:col;
 const mid=sv==="fav"?`<g transform="translate(15 14.6) scale(.5) translate(-12 -12)" fill="#fff">${HEART}</g>`
  :sv==="list"?`<g transform="translate(15 14.6) scale(.5) translate(-12 -12)" fill="${GOLD}">${MARK}</g>`
  :`<g transform="translate(15 14.6) scale(.64) translate(-12 -12)">${(ck?CU[ck]:P.g)(col)}</g>`;
 const mb=(b,x,y)=>`<g transform="translate(${x} ${y}) scale(.6) translate(${-x} ${-y})">${pinBadge(b,x,y)}</g>`,w=7+t*5;
 const pr=t?`<g transform="translate(-2 -2)"><rect width="${w}" height="10" rx="5" fill="#1c2340" stroke="#fff" stroke-width="1"/><text x="${w/2}" y="7.4" font-size="7" font-weight="700" font-family="system-ui,sans-serif" text-anchor="middle" fill="#e3c27a">${prSym(t,r.country)}</text></g>`:"";
 const vk=vis?`<g transform="translate(25.5 25)"><circle r="4.6" fill="#4f7d57" stroke="#fff" stroke-width="1.2"/><path d="M-2 0l1.4 1.4L2.2-1.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></g>`:"";
 return`<svg viewBox="0 0 30 38" aria-hidden="true"><path class="pb" d="M8 2h14a6 6 0 0 1 6 6v13a6 6 0 0 1-6 6h-3.4L15 35.4 11.4 27H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="${fill}" stroke="${rim}" stroke-width="1.6" stroke-linejoin="round"/>${mid}${hl?mb("halal",vg?20.5:27,3):""}${vg?mb("vegan",27,3):""}${pr}${vk}</svg>`};
const dotSvg=r=>{const P=PK[pinKind(r)];return`<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.3" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width=".9"/><circle cx="8" cy="8" r="6.2" fill="${P.c}" stroke="${CREAM}" stroke-width="1.7"/><circle cx="8" cy="8" r="1.7" fill="${CREAM}"/></svg>`};
