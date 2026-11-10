/* Jakorchi app. Version number: change it with tools/bump-version.py */
const BUILD="2026-11-10.7";
/* iPhone home-screen app: with the see-through status bar, iOS lays the page out shorter than the screen (by the
   status-bar height). Layers pinned to that short viewport (position:fixed) stop short and an empty band shows at the
   bottom; stretching them past the edge is not drawn. So: measure the band once, make the page itself as tall as the
   real screen and let the map screen's layers sit in the page (absolute, inside <body>) instead of on the short
   viewport. CSS: "html.iosgap.exv" rules (exv = the map screen is showing). */
let iosGapP=0;
function iosProbe(){const de=document.documentElement,p=document.createElement("div");p.style.cssText="position:fixed;left:0;bottom:0;width:1px;height:1px;visibility:hidden;pointer-events:none";document.body.appendChild(p);const fb=Math.round(p.getBoundingClientRect().bottom);p.remove();return{full:Math.max(screen.width,screen.height),inner:innerHeight,client:de.clientHeight,fixedBottom:fb}}
function fixIosGap(){const de=document.documentElement;let g=0;
 try{if(navigator.standalone===true&&matchMedia("(orientation:portrait)").matches){
  if(!iosGapP){de.classList.remove("iosgap");const m=iosProbe(),v=m.full-Math.min(m.inner,m.client||m.inner,m.fixedBottom||m.inner);iosGapP=v>0&&v<=70?Math.round(v):0}
  g=iosGapP}}catch(e){}
 de.style.setProperty("--iosgap",g+"px");de.classList.toggle("iosgap",g>0);
 try{if(map)setTimeout(()=>map.invalidateSize(),60)}catch(e){}}
/* the map screen must never be scrolled away in this mode (a focus jump could do it) */
/* but while typing, let the phone move the field above the keyboard (fighting it made typing jump) */
const typing=()=>{const a=document.activeElement;return!!a&&(a.tagName==="INPUT"&&!/^(range|checkbox|radio|button)$/.test(a.type)||a.tagName==="TEXTAREA")};
addEventListener("scroll",()=>{const c=document.documentElement.classList;if(c.contains("iosgap")&&c.contains("exv")&&(scrollY||scrollX)&&!typing())scrollTo(0,0)},{passive:true});
addEventListener("focusout",()=>setTimeout(()=>{if(!typing()&&(scrollY||scrollX)&&document.documentElement.classList.contains("exv"))scrollTo(0,0)},120));
(()=>{const vv=window.visualViewport;if(!vv)return;let t=0;const fit=()=>{const kb=Math.max(0,Math.round(innerHeight-vv.height-vv.offsetTop));document.documentElement.style.setProperty("--kb",(kb>80?kb:0)+"px");
  const a=document.activeElement,pn=a&&a.closest&&a.closest(".panel");if(kb>80&&pn&&typing()){clearTimeout(t);t=setTimeout(()=>{const r=a.getBoundingClientRect(),lim=vv.height+vv.offsetTop-90;if(r.bottom>lim||r.top<vv.offsetTop+60)pn.scrollTop+=r.top-Math.max(vv.offsetTop+80,(vv.height+vv.offsetTop)/3)},60)}};
 try{vv.addEventListener("resize",fit);vv.addEventListener("scroll",fit)}catch(e){}})();
fixIosGap();addEventListener("load",fixIosGap);setTimeout(fixIosGap,1200);addEventListener("orientationchange",()=>setTimeout(fixIosGap,350));
// ===== DATA: replace the examples with your own checked places. rating: your own score 1-5 (or null) =====
function R(id,country,city,area,name,loc,cuisine,price,rating,eng,halal,vegan,lat,lng,cat="restaurant"){return {cat,src:"example",exRating:true,id,country,city,area,name,loc,cuisine,price,rating,eng,halal,vegan,lat,lng,
 dish:"(Example) Signature dish",vibe:"(Example) Casual and busy",warn:"(Example) Check cash or card, and possible queue",order:"(Example) Point at the menu or use the Phrases page."}}
const RESTAURANTS=[]; // example places removed: only real places from OpenStreetMap are shown

// ===== HELPERS =====
// Shared reviews: fill in your own Supabase values (see my instructions). Leave empty = reviews stay on the phone only.
const SB={url:"https://jsegdbtefxsforphluyc.supabase.co",key:"sb_publishable_E8yPPjj8k57QgddzT1Omqw_YkO6npc-"};
// Own map file and own places files (see instructions). Leave empty = use the online OpenStreetMap map and live search.
const BASEMAP={url:"",lang:"en"},POI_BASE="places";
let vlayer=null,rasterLayer=null,glLayer=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* a safe web address from what OpenStreetMap has: only http(s); "www.example.com" gets https://; text around an address is dropped; anything else (javascript:, mailto:, plain words) gives "" */
const webUrl=w=>{w=String(w||"").trim();const m=w.match(/https?:\/\/[^\s<>"']+/i);if(m)return m[0];const d=w.match(/^(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:[\/?#][^\s<>"']*)?$/i);return d?"https://"+d[0]:""};
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
let favs=load("jk_favs",load("afg_favs",[])),favObj=load("jk_favobj",{}),reviews=load("jk_reviews",{}),tips=load("jk_tips",load("afg_tips",[]));
let me=null,country="",cat="",osm=[],shown=30,cur=[];
const F={halal:0,veg:0,eng:0,fav:0,jp:0,kr:0,cn:0};
/* price per person: 4 levels, money ranges in the local currency. Levels come from visitors' reviews (average). */
const PRC={Japan:{s:"¥",b:[1500,4000,10000],mx:20000},Korea:{s:"₩",b:[13000,30000,80000],mx:100000},China:{s:"¥",b:[50,150,400],mx:500}};
const prices=new Map();let prAt=0,prBusy=false;
const nfmt=n=>Math.round(n).toLocaleString("en-US"),prP=ct=>PRC[ct]||PRC.Japan;
function prSet(id,n,sum){if(n>0)prices.set(id,Math.min(4,Math.max(1,Math.round(sum/n))));else prices.delete(id)}
function prOf(r){return prices.get(r.id)||(r.src==="example"?r.price:0)||0}
function prSym(t,ct){return prP(ct).s.repeat(t)}
function prRange(t,ct){const P=prP(ct),b=P.b;return t===1?T("under {0}").replace("{0}",P.s+nfmt(b[0])):t===4?P.s+nfmt(b[2])+"+":P.s+nfmt(b[t-2])+"–"+nfmt(b[t-1])}
function prPill(r){const t=prOf(r);return t?`<span class="pill" title="${esc(T("Price per person"))}">${prSym(t,r.country)} · ${esc(prRange(t,r.country))}</span>`:""}
function prOk(r,pos){const t=prOf(r);if(!t)return false;const P=prP(r.country);return [0,...P.b][t-1]<=pos/20*P.mx}
function prCur(){if(country&&PRC[country])return country;const c=map?map.getCenter():null;if(!c)return"Japan";let best="",bd=1e9;
 for(const r of osm){const d=(r.lat-c.lat)**2+(r.lng-c.lng)**2;if(d<bd&&PRC[r.country]){bd=d;best=r.country}}
 return best||(c.lng>=124&&c.lng<=130.9&&c.lat>=33&&c.lat<=38.7?"Korea":c.lng>=129||(c.lng>=122.9&&c.lat<=27)?"Japan":"China")}
function prUi(){const el=$("#fPrice");if(!el)return;const pos=+el.value||20,ct=prCur(),P=prP(ct),txt=pos>=20?T("Any price"):T("Up to {0}").replace("{0}",P.s+nfmt(pos/20*P.mx));
 $("#fPriceTxt").textContent=txt;el.setAttribute("aria-valuetext",txt);$("#fPriceTiers").innerHTML=[1,2,3,4].map(t=>`<span><b>${prSym(t,ct)}</b>${esc(prRange(t,ct))}</span>`).join("")}
async function prLoad(){if(!sbOn()||prBusy||Date.now()-prAt<600000)return;prBusy=true;
 try{for(let off=0;off<20000;off+=1000){const r=await fetch(`${SB.url}/rest/v1/place_ratings?select=place_id,n_price,sum_price&n_price=gt.0&order=place_id&limit=1000&offset=${off}`,{headers:sbH()});if(!r.ok)throw 0;const a=await r.json();a.forEach(x=>prSet(x.place_id,x.n_price,x.sum_price));if(a.length<1000)break}prAt=Date.now();render(false)}catch(e){}prBusy=false}
const JPRE=/\b(japanese|sushi|ramen|udon|soba|tempura|tonkatsu|katsu|izakaya|yakitori|okonomiyaki|takoyaki|teppanyaki|gyudon|donburi|kaiseki|omakase|shabu)/i;
const KRRE=/^(korean|bunsik|bibimbap|bulgogi|kimchi|gukbap|naengmyeon|tteokbokki|samgyeopsal|galbi|jjigae|jjimdak|kimbap|gimbap|grilled meat \(bbq\))/i,CNRE=/^(chinese|cantonese|sichuan|szechuan|hunan|shanghai|dim sum|dumplings?|hot pot|mala|lamb skewers|roast duck|peking|wok)/i;
const CATS=[["","All",si("utensils")],["restaurant","Restaurants",si("plate")],["coffee","Coffee & tea",si("cup")],["dessert","Desserts & bakery",si("cake")],["drinks","Drinks & bars",si("glass")],["fast","Street food & fast food",si("dumpling")]];
const CITIES=[["Seoul","Korea",37.5665,126.978],["Busan","Korea",35.1796,129.0756],["Tokyo","Japan",35.6762,139.6503],["Osaka","Japan",34.6937,135.5023],["Kyoto","Japan",35.0116,135.7681],["Beijing","China",39.9042,116.4074],["Shanghai","China",31.2304,121.4737],["Chengdu","China",30.5728,104.0668]];
const BD={halal:{c:"#0f7b5f",g:'<path d="M15.5 4.5a8 8 0 1 0 0 15a6.3 6.3 0 1 1 0-15z" fill="#fff"/>'},
 vegan:{c:"#3f7d20",g:'<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" fill="#fff"/><path d="M5 19L14 10" stroke="#3f7d20" stroke-width="1.6"/>'}};
const bsvg=(t,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" role="img" aria-label="${t}"><circle cx="12" cy="12" r="12" fill="${BD[t].c}"/><g transform="translate(2.4 2.4) scale(.8)">${BD[t].g}</g></svg>`;
$("#icH").innerHTML=bsvg("halal",22);$("#icV").innerHTML=bsvg("vegan",22);$("#icH2").innerHTML=bsvg("halal",22);$("#icV2").innerHTML=bsvg("vegan",22);
const km=(a,b)=>{const r=Math.PI/180,x=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const fmt=d=>d<10?d.toFixed(1):Math.round(d).toLocaleString("en");
const all=()=>{const m=new Map();RESTAURANTS.forEach(r=>m.set(r.id,r));osm.forEach(r=>m.set(r.id,r));Object.values(favObj).forEach(r=>{if(!m.has(r.id))m.set(r.id,r)});return[...m.values()]};
let remote={},remoteRev={};
const sbOn=()=>!!(SB.url&&SB.key),sbH=()=>{const h={apikey:SB.key,"Content-Type":"application/json"};if(SB.key.startsWith("eyJ"))h.Authorization="Bearer "+SB.key;return h};
const rcount=r=>sbOn()?((remote[r.id]||{}).n||0):(reviews[r.id]||[]).length;
const avg=r=>{if(sbOn()){const m=remote[r.id];return m&&m.n?m.sum/m.n:null}const a=reviews[r.id]||[];return a.length?a.reduce((s,x)=>s+x.stars,0)/a.length:null};
const noRev=()=>`<span class="star" style="color:var(--mute);font-weight:600"><small>${T("No reviews yet")}</small></span>`;
/* small cache so the free Supabase plan is used less: the summaries are kept 10 minutes in this browser, one place's reviews 5 minutes */
const cget=(k,ms)=>{try{const o=JSON.parse(localStorage.getItem("jk_c_"+k));if(o&&Date.now()-o.t<ms)return o.v}catch(e){}return null};
const cset=(k,v)=>{try{localStorage.setItem("jk_c_"+k,JSON.stringify({t:Date.now(),v}))}catch(e){}};
const cdel=k=>{try{localStorage.removeItem("jk_c_"+k)}catch(e){}};
/* ratings, visitor reports and food votes are fetched only for the places on screen (a few dozen at a time), so the free Supabase plan keeps working with many visitors */
const metaAt={},metaQ=new Set();let metaT=null,metaBad=0;
function wantMeta(ids,force){if(!sbOn())return;const now=Date.now();
 for(const id of ids)if(typeof id==="string"&&/^[A-Za-z0-9_]{1,60}$/.test(id)&&(force||!metaAt[id]||now-metaAt[id]>600000))metaQ.add(id);
 if(metaQ.size&&!metaT)metaT=setTimeout(runMeta,metaBad&&now-metaBad<30000?30000:350)}
async function runMeta(){metaT=null;const ids=[...metaQ].slice(0,100);ids.forEach(i=>metaQ.delete(i));if(!ids.length)return;
 const list=ids.join(","),u=SB.url+"/rest/v1/";
 try{const [a,b]=await Promise.all([fetch(`${u}place_ratings?select=place_id,n,sum_stars,n_price,sum_price&place_id=in.(${list})`,{headers:sbH()}),fetch(`${u}place_flag_counts?select=place_id,kind,yes,no&place_id=in.(${list})`,{headers:sbH()})]);
  if(!a.ok||!b.ok)throw 0;const ra=await a.json(),rb=await b.json(),now=Date.now(),idx=new Map(all().map(r=>[r.id,r])),was={};
  ids.forEach(id=>{was[id]=JSON.stringify(flags[id]||{});remote[id]={n:0,sum:0};flags[id]={};metaAt[id]=now});
  ids.forEach(id=>prices.delete(id));ra.forEach(x=>{remote[x.place_id]={n:x.n,sum:x.sum_stars};prSet(x.place_id,x.n_price||0,x.sum_price||0)});rb.forEach(x=>{if(flags[x.place_id])flags[x.place_id][x.kind]={y:x.yes,n:x.no}});
  let fo=false;ids.forEach(id=>{const r=idx.get(id);if(r&&foodApply(r))fo=true;
   if(map&&markers[id]&&id!==sheetId&&JSON.stringify(flags[id])!==was[id]){map.removeLayer(markers[id]);delete markers[id]}});
  metaBad=0;if(fo)fillOpts();render(false);if(sheetId&&ids.includes(sheetId))drawSheet();if(curView==="lists")drawLists()
 }catch(e){metaBad=Date.now()}
 if(metaQ.size&&!metaT)metaT=setTimeout(runMeta,metaBad?30000:150)}
let flags={};
const fc=(r,k)=>((flags[r.id]||{})[k])||{y:0,n:0},fvy=(r,k)=>{const c=fc(r,k);return c.y>c.n};
const fcx=(r,k)=>{if(k!=="vegetarian")return fc(r,k);const a=fc(r,"vegan"),b=fc(r,"vegetarian");return{y:a.y+b.y,n:a.n+b.n}};
const hasD=(r,k)=>{const f=k==="vegetarian"?"veg":k,o=r[f]||r[f+"L"],c=fcx(r,k);return(o||c.y>c.n)&&!(c.n>c.y)};
const VK=[["halal","halal","Halal"],["vegetarian","veg","Vegan / vegetarian"]];
function vtags(r){return VK.map(([k,f,lab])=>{const c=fcx(r,k),has=r[f]||r[f+"L"];
 if(c.y>c.n&&!has)return`<span class="tag">${bsvg(k==="vegetarian"?"vegan":k,22)}${T(lab)} (${T("visitors")} ×${c.y})</span>`;
 if(c.n>c.y&&has)return`<span class="pill warnp">${si("warn")} ${T("Visitors say not:")} ${T(lab)} ×${c.n}</span>`;return""}).join("")+closedTag(r)+foodTags(r)}
/* "closed" reports: shown from 3 reports, and only while more visitors say closed than still open */
function closedTag(r){const c=fc(r,"closed");return c.y>=3&&c.y>c.n?`<span class="pill warnp">${si("warn")} ${T("Visitors say: closed")} ×${c.y}</span>`:""}
let units=load("jk_units",null)||(/^en-(US|GB|LR)\b|^my\b/i.test(navigator.language||"")?"mi":"km");
const fmtDist=k=>{if(units==="mi"){const mi=k*0.621371;if(mi<0.1)return Math.max(10,Math.round(k*328.084)*10).toLocaleString("en")+" ft";return(mi<10?mi.toFixed(1):Math.round(mi).toLocaleString("en"))+" mi"}if(k<1)return Math.max(10,Math.round(k*100)*10)+" m";return fmt(k)+" km"};
const dev=(()=>{let d=load("jk_dev",null);if(!d){d=((typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2)+Date.now()).slice(0,36);save("jk_dev",d)}return d})();
async function sbFlagPost(id,items){/* one request per answer, so a repeated answer does not block the new ones. Returns 1 = saved, 2 = already sent, 0 = failed (per answer) */
 const out=[];for(const [k,v] of items){try{const r=await fetch(`${SB.url}/rest/v1/place_flags`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({place_id:id,kind:k,verdict:v,device:dev})});out.push(r.ok?1:r.status===409?2:0)}catch(e){out.push(0)}}return out}
const revAt={};
async function sbReviews(id,force){if(!sbOn())return;if(!force&&revAt[id]&&Date.now()-revAt[id]<300000)return;try{const r=await fetch(`${SB.url}/rest/v1/reviews_public?place_id=eq.${encodeURIComponent(id)}&select=stars,name,text,created_at,photos,price&order=created_at.desc&limit=20`,{headers:sbH()});if(!r.ok)return;remoteRev[id]=(await r.json()).map(x=>({stars:x.stars,name:x.name,text:x.text,date:(x.created_at||"").slice(0,10),photos:Array.isArray(x.photos)?x.photos:[],price:x.price||0}));revAt[id]=Date.now();if(sheetId===id)drawSheet()}catch(e){}}
async function sbPost(id,rev){try{const r=await fetch(`${SB.url}/rest/v1/reviews`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({place_id:id,stars:rev.stars,price:rev.price||null,name:rev.name||null,text:rev.text||null,photos:rev.photos||[],device:dev})});return r.ok}catch(e){return false}}
const score=r=>avg(r)??(sbOn()?0:(r.rating??0));
/* who gets a pin first when zoomed out: visitor ratings count most, then how complete the place info is */
/* typo-friendly search (no library): fold = lower case, no accents, Japanese spelling variants alike (ramen = raamen, shi = si);
   near = at most m letters wrong (a change, an extra, a missing or two swapped); every typed word must match a word of the place */
const fold=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/ou|oo/g,"o").replace(/uu/g,"u").replace(/shi/g,"si").replace(/chi/g,"ti").replace(/tsu/g,"tu").replace(/ji/g,"zi").replace(/fu/g,"hu").replace(/[^\p{L}\p{N}]+/gu," ").trim();
function near(a,b,m){const x=a.length,y=b.length;if(Math.abs(x-y)>m)return false;let p=[],q=[],o=[];for(let j=0;j<=y;j++)q[j]=j;
 for(let i=1;i<=x;i++){o=p;p=q;q=[i];let lo=i;for(let j=1;j<=y;j++){let v=Math.min(p[j]+1,q[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,o[j-2]+1);q[j]=v;if(v<lo)lo=v}if(lo>m)return false}return q[y]<=m}
const raw=s=>String(s||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
const wHit=(ws,t)=>{const m=t.length<4?0:t.length<6?1:2;return ws.some(w=>w.startsWith(t)||(m&&(near(w,t,m)||(w.length>t.length&&near(w.slice(0,t.length),t,m)))))};
function fuzzyHit(r,qf,qr){if(r._fl!==lang){r._fl=lang;const j=[r.name,dname(r),romOf(r),r.cuisine,cuis(r.cuisine),r.dish].join(" ");r._fw=fold(j).split(" ");r._rw=raw(j).split(" ")}
 qr=qr||qf;return qf.every((t,i)=>wHit(r._fw,t)||(qr[i]&&wHit(r._rw,qr[i])))}
const pinScore=r=>{const a=avg(r)??(sbOn()?null:r.rating);let s=a!=null?100+a*10+Math.min(rcount(r)||0,10):0;if(!r.cu0)s+=3;if(r.loc||r.src!=="osm")s+=2;if(r.hours)s+=1;if(r.web)s+=1;if(r.phone)s+=1;return s};
function flash(msg){let e=document.getElementById("toast");if(!e){e=document.createElement("div");e.id="toast";e.setAttribute("role","status");document.body.appendChild(e)}e.textContent=msg;e.classList.add("on");clearTimeout(flash.t);flash.t=setTimeout(()=>e.classList.remove("on"),2600)}
function shareText(t,el){if(navigator.share)navigator.share({text:t}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>el.textContent=T("Copied. Paste it into a message."),()=>el.textContent=T("Copy failed."));else el.textContent=T("Sharing is not supported here.")}

function goTab(v){if(v!=="explore")closeSheet();document.body.classList.toggle("ex",v==="explore");document.documentElement.classList.toggle("exv",v==="explore");document.querySelectorAll(".view").forEach(x=>x.classList.toggle("on",x.id===v));curView=v;if(v==="explore"&&map)setTimeout(()=>map.invalidateSize(),50);if(v==="lists")drawLists();if(v==="about")drawAbout();closeDrawer(false);scrollTo(0,0)}

// ===== MAP =====
let map=null,markers={},meLayer=null;
/* classy pins: dark lacquer drop, gold rim, cream medallion, a coloured picture for the type of place.
   Saved places get their own pin: red with a heart (favorites) or gold with a bookmark (your other lists). Zoomed out they are small dots. */
const pinSig=(r,dot)=>{const {hl,vg}=pinFlags(r);return(dot?"d":"p")+pinKind(r)+cuKey(r)+(SV.get(r.id)||"")+(BEEN.has(r.id)?"b":"")+prOf(r)+(hl?"h":"")+(vg?"v":"")+(r.nw?r.nws:"")};
const pinIcon=(r,dot,dl)=>{const k=pinKind(r);return dot?L.divIcon({className:"",html:`<div class="pn pd pn-${k}">${dotSvg(r)}</div>`,iconSize:[16,16],iconAnchor:[8,8]})
 :L.divIcon({className:"",html:`<div class="pn pn-${k}${r.nw&&r.nws!=="ok"?" pnw":""}${dl!=null?" in":""}"${dl!=null?` style="--d:${dl|0}ms"`:""}>${pinSvg(r)}</div>`,iconSize:[26,33],iconAnchor:[13,32]})};
const pin=(r,dot,dl)=>{const base=SV.has(r.id)?400:0;
 const m=L.marker([r.lat,r.lng],{icon:pinIcon(r,dot,dl),title:r.name,zIndexOffset:base});m._sig=pinSig(r,dot);m._base=base;
 m.bindTooltip(esc(dname(r))+(r.cu0?"":`<br><small>${r.cg?"≈ ":""}${esc(cuis(r.cuisine))}</small>`),{direction:"top",offset:[0,dot?-9:-30]});m.on("click",()=>{openSheet(r.id);nudge(r.id)});return m};
try{map=L.map("map",{worldCopyJump:true,zoomControl:false,zoomSnap:.5,zoomDelta:1,wheelPxPerZoomLevel:100,wheelDebounceTime:20,inertiaDeceleration:2600,minZoom:3,maxZoom:21,bounceAtZoomLimits:false}).setView([36,128],4);L.control.zoom({position:"bottomright"}).addTo(map);
 const tl=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:21,maxNativeZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
 rasterLayer=tl;setTimeout(rasterOn,6000);tl.on("tileerror",()=>{const n=$("#mapNote");n.style.display="block";n.textContent="The map background could not load here. Pins and your location still work."});
 setTimeout(()=>map.invalidateSize(),300);addEventListener("load",()=>map.invalidateSize());map.on("click",()=>closeSheet());
}catch(e){$("#map").innerHTML='<p class="empty">The map could not load. The list still works.</p>'}
function focusCard(id){let c=document.getElementById("c_"+id);
 if(!c){const i=cur.findIndex(r=>r.id===id);if(i<0)return;shown=i+30;render(false);c=document.getElementById("c_"+id)}
 if(!c)return;document.querySelectorAll(".card").forEach(x=>x.classList.remove("hl"));c.classList.add("hl");c.scrollIntoView({behavior:"smooth",block:"center"})}

// ===== OPENSTREETMAP PLACES (free, open data; attribution required) =====
const catOf=t=>{const a=t.amenity,s=t.shop;
 if(a==="cafe"||s==="tea"||s==="coffee")return"coffee";
 if(a==="ice_cream"||s==="ice_cream"||s==="bakery"||s==="pastry"||s==="confectionery"||(t.cuisine||"").includes("dessert"))return"dessert";
 if(a==="bar"||a==="pub"||a==="biergarten")return"drinks";
 if(a==="fast_food"||a==="food_court")return"fast";return"restaurant"};
const yes=v=>v==="yes"||v==="only";
function conv(e){const t=e.tags||{},lat=e.lat??(e.center&&e.center.lat),lng=e.lon??(e.center&&e.center.lon);if(!t.name||lat==null)return null;
 let nc=CITIES[0],d=1e9;CITIES.forEach(c=>{const x=km({lat,lng},{lat:c[2],lng:c[3]});if(x<d){d=x;nc=c}});
 const en=LAT_KEYS.map(k=>t[k]).find(Boolean)||"",cat=catOf(t),dd=dietOf(t);
 return enrich({id:"osm_"+e.type[0]+e.id,src:"osm",cat,country:nc[1],city:d<120?nc[0]:(t["addr:city"]||""),
  nm:nmOf(t),sub:t.shop||t.amenity||"",name:en||t.name,loc:en&&en!==t.name?t.name:"",cuisine:dd.c,price:0,rating:null,eng:null,
  ...OSMF(dd.h,dd.v,dd.g),lat,lng,hours:t.opening_hours||"",addr:osmAddr(t),phone:t.phone||t["contact:phone"]||"",web:t.website||t["contact:website"]||""})}
async function findHere(){const m=osmOut;if(!map)return;
 if(map.getZoom()<13){m.textContent="Zoom in to a city area first (or pick a city above), then tap “Find places here”.";return}
 const b=map.getBounds(),bb=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].map(x=>x.toFixed(5)).join(",");
 const q=`[out:json][timeout:25];(nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|biergarten)$"]["name"](${bb});nwr["shop"~"^(bakery|pastry|confectionery|ice_cream|tea|coffee)$"]["name"](${bb}););out center tags 300;`;
 m.textContent="Searching OpenStreetMap...";$("#findBtn").disabled=true;
 for(const url of ["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"]){
  try{const r=await fetch(url,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"}});if(!r.ok)throw 0;const j=await r.json();
   const have=new Set(osm.map(x=>x.id));let add=0;j.elements.forEach(e=>{const p=conv(e);if(p&&!have.has(p.id)){osm.push(p);have.add(p.id);add++}});
   m.textContent=`${j.elements.length} places found in this area (${add} new). Data © OpenStreetMap contributors.`+(j.elements.length>=300?" Showing the first 300. Zoom in for more detail.":"");
   $("#findBtn").disabled=false;fillOpts();render(false);return}catch(e){}}
 m.textContent="Could not reach OpenStreetMap. Check your connection and try again.";$("#findBtn").disabled=false}


// ===== LINKS (verify formats in the official docs) =====
/* name in the language of the country (Korean / Japanese / Chinese), so Google, Naver, Amap and Apple find the real listing */
const CLANG={Korea:"ko",Japan:"ja",China:"zh"};
const inCountryScript=(s,c)=>{const x=scriptOf(s);return c==="Korea"?x==="ko":c==="Japan"?(x==="ja"||x==="han"):c==="China"?x==="han":false};
function localName(r){const l=CLANG[r.country];for(const c of [r.loc,r.nm&&r.nm[l],r.name])if(c&&inCountryScript(c,r.country))return c;return r.loc||r.name}
let trMode=load("jk_tr","walk");if(!/^(walk|transit|car)$/.test(trMode))trMode="walk";
function links(r){const tm={walk:["walking","w","walk","walk"],transit:["transit","r","bus","public"],car:["driving","d","car","car"]}[trMode],nm=localName(r),k=encodeURIComponent(nm),ll=r.lat+","+r.lng,N=[];
 /* Directions go to the exact spot (coordinates), so they never pick a branch with the same name elsewhere.
    Review buttons search the name + street address around the spot, so the right branch comes first. */
 const ad=(r.addr||"").replace(/\([^)]*\)/g," "),q=encodeURIComponent((nm+" "+ad).replace(/[\/#?]/g," ").replace(/\s+/g," ").trim());
 let nw="";
 if(r.country==="Korea"){const x=(r.lng*20037508.34/180).toFixed(1),y=(Math.log(Math.tan((90+r.lat)*Math.PI/360))/(Math.PI/180)*20037508.34/180).toFixed(1);
  nw=`https://map.naver.com/p/search/${q}?c=${x},${y},17,0,0,0,dh`;
  N.push({t:"Naver Map",h:`nmap://route/${tm[3]}?dlat=${r.lat}&dlng=${r.lng}&dname=${k}&appname=jakorchi.prototype`,id:1,web:nw})}
 if(r.country==="China")N.push({t:"Amap (Gaode)",h:`https://uri.amap.com/navigation?to=${r.lng},${r.lat},${k}&mode=${tm[2]}&coordinate=wgs84`});
 N.push({t:"Google Maps",h:`https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=${tm[0]}`},{t:"Apple Maps",h:`https://maps.apple.com/?daddr=${ll}&dirflg=${tm[1]}`});
 const rev=[{t:"Google reviews",h:`https://www.google.com/maps/search/${q}/@${ll},18z`}];
 if(nw)rev.push({t:"Naver reviews",h:nw});
 return{nav:N,rev}}
const ARR='<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M3 11l18-8-8 18-2-8z"/></svg>';
const starsStr=n=>"★".repeat(n)+"☆".repeat(5-n);

const dtag=(ic,txt,src,o)=>`<span class="tag">${ic}${txt}${src==="name"?" ("+T("from the name")+")":o?" (OpenStreetMap)":""}</span>`;
function card(r,p=""){const l=links(r),f=favs.includes(r.id),a=avg(r),rv=(reviews[r.id]||[]).concat(remoteRev[r.id]||[]),o=r.src==="osm";
 const sc=a!=null?`<button type="button" class="star stj" data-gorev="${r.id}">★ ${a.toFixed(1)} <small>${rcount(r)} ${rcount(r)==1?T("review"):T("reviews")}</small></button>`:(r.rating&&!sbOn()?`<span class="star">★ ${r.rating.toFixed(1)} <small>${T("example")}</small></span>`:(sbOn()?noRev():""));
 const wu=webUrl(r.web),site=wu?`<a href="${esc(wu)}" target="_blank" rel="noopener noreferrer">${esc(wu.replace(/^https?:\/\/(www\.)?/,"").slice(0,40))}</a>`:"";
 const adr=r.addr?`${esc(r.addr)} <button class="rbtn cp" data-copy="${esc(r.addr)}" aria-label="${esc(T("Copy"))}">${si("copy")} ${T("Copy")}</button>`:`<span class="mut">${T("No address in OpenStreetMap yet")}</span> <button class="rbtn cp" data-addr="${r.id}">${si("pin")} ${T("Find nearest address")}</button><div class="adout"></div>`;
 const tel=r.phone&&/^[+0-9 ()\-.]{5,30}$/.test(r.phone)?`<a href="tel:${esc(r.phone.replace(/[^+0-9]/g,""))}">${esc(r.phone)}</a>`:"";
 const rows=(o?[[T("Opening hours"),esc(r.hours)],[T("Address"),adr],[T("Phone"),tel],[T("Website"),site]]:[[T("Must-try dish"),esc(r.dish)],[T("Vibe"),esc(r.vibe)],[T("How to order"),esc(r.order)]]).filter(x=>x[1]);
 const place=r.city?T(r.city):"";
 let ex=o?'<div class="ex osm">'+(r.nw?(r.npv?T("Added by the Jakorchi team"):r.nws==="ok"?T("Added by visitors · not checked by Jakorchi"):T("New place added by a visitor · confirmed by {0} of 3").replace("{0}",r.npy||1)):T("From OpenStreetMap · not checked by Jakorchi"))+'</div>':'<div class="ex">'+T("EXAMPLE – still to be verified")+'</div>';
 const ttl=dname(r),sub=[r.loc,r.name].filter(x=>x&&x!==ttl)[0]||"";
 const head=`<div class="row"><div><h2>${esc(ttl)}</h2>${sub?`<div class="ko">${esc(sub)}</div>`:""}</div><div class="rt">${sc}<button class="fav${f?" on":""}" data-fav="${r.id}" aria-label="${esc(T("Favorites"))}" aria-pressed="${f}">${f?"♥":"♡"}</button><button class="fav bm${savedOther(r.id)?" on":""}" data-lsave="${r.id}" aria-label="${esc(T("Save to a list"))}"><svg class="i" viewBox="0 0 24 24"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/></svg></button></div></div>
 <div class="meta">${place?`<span class="pill">${esc(place)}</span>`:""}${r.cu0?`<span class="pill mut" title="${esc(T("Nobody has added the food type on OpenStreetMap yet. Look at the menu photos on Google or Naver."))}">? ${esc(T("Food type not listed"))}</span>`:`<span class="pill"${r.fvn?` title="${esc(T("Chosen by visitors"))}"`:r.cg?` title="${esc(T("Guessed from the name"))}"`:""}>${r.fvn?"✓ ":r.cg?"≈ ":""}${esc(cuis(r.cuisine))}</span>`}${prPill(r)}${me?`<span class="pill">${esc(T("{0} away").replace("{0}",fmtDist(km(me,r))))}</span>`:""}</div>
 <div class="meta" style="margin-top:0">${r.halal?dtag(bsvg("halal",22),T("Halal"),r.hs,o):r.halalL?dtag(bsvg("halal",22),T("Some halal options"),0,o):""}${r.vegan?dtag(bsvg("vegan",22),T("Vegan"),r.vs,o):r.veganL?dtag(bsvg("vegan",22),T("Some vegan options"),0,o):""}${r.veg&&!r.vegan?dtag(si("leaf","em"),T("Vegetarian"),r.vgs,o):r.vegL&&!r.vegan&&!r.veganL?dtag(si("leaf","em"),T("Some vegetarian options"),0,o):""}${vtags(r)}${r.eng===true?'<span class="pill">'+T("English menu")+'</span>':r.eng===false?'<span class="pill">'+T("No English menu")+'</span>':""}</div>`;
 const info=rows.length?`<div class="info">${rows.map(x=>`<div><small>${x[0]}</small>${x[1]}</div>`).join("")}</div>`:"";
 const warn=`<div class="warn"><span>${si("warn")}</span><span>${o?"<b>"+T("Heads up:")+"</b> "+(r.nw?T("This place was added by visitors and is not checked. Halal and vegan tags can be wrong. Ask the staff before you order."):T("Details come from OpenStreetMap and are not checked. Halal and vegan tags can be wrong or old. Ask the staff before you order."))+((r.cg||r.hs||r.vs||r.vgs)?" "+T("The food type (≈) and tags marked “from the name” are guessed from the name and can be wrong."):""):"<b>"+T("Heads up:")+"</b> "+esc(r.warn)}</span></div>`;
 const act=`<div class="btns" style="margin-top:10px"><button class="btn rvcta" data-rev="${r.id}">★ ${T("Write a review")}</button><button class="btn fill" data-nav="${r.id}">${ARR}${T("Navigate")}</button>${l.rev.map(x=>`<a class="btn" target="_blank" rel="noopener noreferrer" href="${x.h}">${x.t}</a>`).join("")}</div>`;
 const navrow=`<div class="nav">${l.nav.map(x=>`<a class="btn" ${x.id?`data-naver="${r.id}"`:'target="_blank" rel="noopener noreferrer"'} href="${x.h}">${x.t}</a>`).join("")}</div>`;
 const rest=`<div class="btns">${p?"":`<button class="rbtn" data-show="${r.id}">${si("pin")} ${T("Show on map")}</button>`}${o?`<button class="rbtn" data-tipfor="${r.id}">+ ${T("Add a tip")}</button>`:""}${o&&sbOn()?`<button class="rbtn" data-flag="${r.id}">${si("flag")} ${T("Report closed, diet or food type")}</button>`:""}</div>
 ${rv.length?`<div class="revs" data-revs>${rv.map(x=>`<div><b data-st>${starsStr(x.stars)}</b>${x.price?` <small class="rvp" title="${esc(T("Price per person"))}">${prSym(x.price,r.country)}</small>`:""} ${esc(x.name||T("Traveler"))} <small>${esc(x.date)}</small><br>${esc(x.text)}${phs(x.photos)}</div>`).join("")}</div>`:""}`;
 if(p){ex=ex.replace('class="ex','style="margin:14px -16px 0" class="ex');return `<article class="card"><div class="cb" style="padding-top:2px">${head}${act}<i data-pe></i>${ex}${navrow}${info}${o&&sbOn()?xsec(r):""}${warn}${rest}</div></article>`}
 return `<article class="card" id="c_${r.id}">${ex}<div class="cb">${head}${info}${warn}${act}${navrow}${rest}</div></article>`}

// ===== FILTERS, SEARCH, SORT =====
function renderChips(){
 $("#allc").innerHTML=`<button class="plain" id="allBtn" data-allf>${CATS[0][2]} ${T(CATS[0][1])}</button>`;allOn();
 $("#cats").innerHTML=CATS.slice(1).map(c=>`<button class="plain${c[0]===cat?" on":""}" data-cat="${c[0]}">${c[2]} ${T(c[1])}</button>`).join("");
 $("#cities").innerHTML=CITIES.filter(c=>!country||c[1]===country).map(c=>`<button class="plain" data-city="${c[0]}">${si("pin")} ${T(c[0])}</button>`).join("")}
const QF=["halal","veg","jp","kr","cn"];
/* contact address on the About & privacy page ("" = line stays hidden) */
const CONTACT="";
function drawAbout(){const e=$("#abContact");if(!e)return;e.hidden=!CONTACT;if(CONTACT)e.innerHTML=esc(T("Contact: {0}")).replace("{0}",`<a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a>`)}
function allOn(){const b=$("#allBtn");if(b){const on=!cat&&!QF.some(k=>F[k]);b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)}}
function allFilters(){cat="";QF.forEach(k=>F[k]=0);document.querySelectorAll(QF.map(k=>`[data-f="${k}"]`).join(",")).forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false")});renderChips();fillOpts();rr()}
function fillOpts(){const base=all().filter(r=>(!country||r.country===country)&&(!cat||r.cat===cat)),m={};
 base.forEach(r=>{if(r.cuisine&&!/pork/i.test(r.cuisine))m[r.cuisine]=(m[r.cuisine]||0)+1});
 const labels=[...new Set(Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,80).map(cuis).concat(CATS.slice(1).map(c=>T(c[1]))))].sort((a,b)=>a.localeCompare(b));
 {const cl=new Set(CATS.map(c=>T(c[1])));fexTop=[...new Set(Object.keys(m).sort((a,b)=>m[b]-m[a]).map(cuis))].filter(x=>!cl.has(x)).slice(0,40)}fexAll=labels;drawFex();prUi()}
/* food examples under the food field: popular ones, or the ones that match what you type (small typos are fine) */
let fexTop=[],fexAll=[];
function drawFex(){const b=$("#fEx");if(!b)return;const v=$("#fCuisine").value.trim(),vl=v.toLowerCase(),fv=fold(v);let l;
 if(!v)l=fexTop.slice(0,8);else{l=fexAll.filter(x=>x.toLowerCase().includes(vl));if(l.length<4&&fv.length>2){const m=fv.length<6?1:2;const rv=raw(v);fexAll.forEach(x=>{if(!l.includes(x)&&(fold(x).split(" ").some(w=>near(w.slice(0,fv.length),fv,m))||raw(x).split(" ").some(w=>near(w.slice(0,rv.length),rv,m))))l.push(x)})}l=l.filter(x=>x.toLowerCase()!==vl).slice(0,8)}
 b.innerHTML=l.map(x=>`<button type="button" data-fex="${esc(x)}">${esc(x)}</button>`).join("")}
$("#fEx").addEventListener("click",e=>{const t=e.target.closest("[data-fex]");if(!t)return;$("#fCuisine").value=t.dataset.fex;$("#fCuisine").blur();drawFex();rr()});
function render(fit=true){
 const q=$("#q").value.trim().toLowerCase(),c=$("#fCuisine").value.trim().toLowerCase(),p=+$("#fPrice").value||20,pAny=p>=20,cm=c?CATS.slice(1).filter(x=>T(x[1]).toLowerCase().includes(c)).map(x=>x[0]):[],ch=new Map(),hitC=k=>{if(!k)return false;let v=ch.get(k);if(v===undefined){v=(k+" "+cuis(k)+" "+cuisAll(k)).toLowerCase().includes(c);ch.set(k,v)}return v},sort=$("#fSort").value;
let fz=false;const qf=q?fold(q).split(" ").filter(Boolean):[],qr=q?raw(q).split(" ").filter(Boolean):[],run=()=>all().filter(r=>(!country||r.country===country)&&(!cat||r.cat===cat)&&(!c||hitC(r.cuisine)||cm.includes(r.cat)||(r.dish&&String(r.dish).toLowerCase().includes(c)))&&(pAny||prOk(r,p))&&(!F.eng||r.eng===true)&&(!F.halal||hasD(r,"halal"))&&(!F.veg||hasD(r,"vegetarian"))&&(!F.jp||JPRE.test(r.cuisine||""))&&(!F.kr||KRRE.test(r.cuisine||""))&&(!F.cn||CNRE.test(r.cuisine||""))&&(!F.fav||favs.includes(r.id))&&(!listF||listF.has(r.id))&&(!q||(fz?fuzzyHit(r,qf,qf.length===qr.length?qr:null):[r.name,dname(r),r.loc,romOf(r),r.city,r.cuisine,cuis(r.cuisine),cuisAll(r.cuisine),r.dish,r.addr,r.nm?Object.values(r.nm).join(" "):""].join(" ").toLowerCase().includes(q))));
 let res=run();if(q&&qf.length&&res.length<3){fz=true;const r2=run();if(r2.length>res.length)res=r2}/* few hits: also accept small typing mistakes */
 cur=res;renderList();$("#whereTxt").textContent=T(country||"All Asia");
 const nf=[country,cat,c,!pAny].filter(Boolean).length+Object.values(F).reduce((x,y)=>x+y,0)+(listF?1:0);$("#fCount").textContent=nf||"";allOn();$("#fCount").style.display=nf?"grid":"none";
 if(map){syncMarkers();if(fit&&res.length){const pts=(res.length>2000?res.slice(0,2000):res).map(r=>[r.lat,r.lng]);map.fitBounds(L.latLngBounds(pts),{paddingTopLeft:[40,150],paddingBottomRight:[40,90],maxZoom:13})}}applySel()}
/* the list shows only the places on screen (saved lists: all of them). Order: nearest to you (or to the middle of the map) first;
   a typed search or "Top rated" orders by rating. Closed list = only the count is updated (cheap, runs after every map move). */
const fmtN=n=>n>=10000?Math.round(n/1000)+"k":String(n);
function renderList(){let lv=cur;if(map&&!listF){const b=map.getBounds();lv=cur.filter(r=>b.contains([r.lat,r.lng]))}
 $("#listBtn").innerHTML=si("list")+"<span>"+esc(T("List"))+" · "+fmtN(lv.length)+"</span>";$("#count").textContent=lv.length+" "+(lv.length===1?T("place"):T("places"));
 if(!$("#listPanel").classList.contains("open"))return;
 const q=$("#q").value.trim(),o=me||(map?map.getCenter():null);lv=lv.slice();
 if(!q&&$("#fSort").value!=="rating"&&o){const ck=Math.cos(o.lat*Math.PI/180),d=new Map();for(const r of lv)d.set(r,(r.lat-o.lat)**2+((r.lng-o.lng)*ck)**2);lv.sort((a,b)=>d.get(a)-d.get(b))}
 else{const sc=new Map();for(const r of lv)sc.set(r,pinScore(r));lv.sort((x,y)=>sc.get(y)-sc.get(x)||(x.src==="osm")-(y.src==="osm")||x.name.localeCompare(y.name))}
 $("#list").innerHTML=(lv.length?lv.slice(0,shown).map(r=>card(r)).join("")+(lv.length>shown?`<button class="btn more2" data-more>Show 30 more (${lv.length-shown} left)</button>`:""):'<p class="empty">'+T("No places match. Try another filter, search, or zoom the map to load more places.")+'</p>');
 wantMeta(lv.slice(0,Math.max(shown,40)).map(r=>r.id))}
function syncMarkers(){if(!map)return;svBuild();const res=cur,z=map.getZoom(),many=res.length>60,dot=false;let vis,cls=[];
 /* few results (a search or filter): show them all. Otherwise: small dots from zoom 13, full pins from zoom 14 (at most 90), up to 150 pins from zoom 15.
    Places you saved always get their own pin (from zoom 8). */
 if(!many)vis=res;
 else{/* also prepare pins just outside the screen, so they slide in instead of popping up */const bd=map.getBounds().pad(.15),c=map.getCenter(),sv=[],cand=[];
  for(const r of res){if(!bd.contains([r.lat,r.lng]))continue;if(z>=8&&SV.has(r.id))sv.push(r);else if(r.nw){/* places added by visitors or the team always get their own pin (they never lose a crowded spot) */if(r.nws==="ok"||r.verified||z>=16||npMine.has(r.id))sv.push(r)}else if(z>=13)cand.push(r);if(sv.length+cand.length>=80000)break}
  /* spread them over the screen: one place per small square (the best rated, else the one closest to the middle), so a busy street does not become one clump */
  /* zoomed out = big squares = few pins (only the best); all pins only at the closest zoom (19) */
  const CL=z<15,/* zoomed out: close places become one numbered bubble (tap = zoom in) */
   tier=CL?[92,0]:z<16?[76,60]:z<17?[64,90]:z<18?[52,130]:z<19?[40,200]:[1,350],cs=tier[0],cap=Math.round(tier[1]*1.35),cell=new Map(),d2=r=>(r.lat-c.lat)**2+(r.lng-c.lng)**2,W=256*Math.pow(2,z),
   key=r=>{const sn=Math.sin(r.lat*Math.PI/180),x=(r.lng+180)/360*W,y=(.5-Math.log((1+sn)/(1-sn))/(4*Math.PI))*W;return Math.floor(x/cs)+","+Math.floor(y/cs)},
   sc=r=>pinScore(r)+(markers[r.id]?.5:0);
  if(CL){const g=new Map();for(const r of cand){const k=key(r),o=g.get(k),f=pinFlags(r);if(o){o.n++;o.la+=r.lat;o.ln+=r.lng;if(f.hl)o.h=1;if(f.vg)o.v=1}else g.set(k,{n:1,la:r.lat,ln:r.lng,r,h:f.hl?1:0,v:f.vg?1:0})}
   let ar=[...g.entries()];const CMAX=innerWidth>700?70:45;/* screen cap: nearest to the middle first */if(ar.length>CMAX)ar=ar.map(e=>[(e[1].la/e[1].n-c.lat)**2+(e[1].ln/e[1].n-c.lng)**2,e]).sort((a,b)=>a[0]-b[0]).slice(0,CMAX).map(x=>x[1]);
   vis=sv.slice();for(const [k,o] of ar){if(o.n===1)vis.push(o.r);else cls.push([k,o.la/o.n,o.ln/o.n,o.n,o.h,o.v])}}
  else{
  sv.forEach(r=>cell.set(key(r),null));
  for(const r of cand){const k=key(r),o=cell.get(k);if(o===null)continue;if(!o){cell.set(k,r);continue}const a=sc(r),b=sc(o);if(a>b||(a===b&&r.id<o.id))cell.set(k,r)}
  let pick=[...cell.values()].filter(Boolean);if(pick.length>cap)pick=pick.map(r=>[-sc(r),d2(r),r]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).slice(0,cap).map(x=>x[2]);
  vis=sv.concat(pick)}}
 syncCl(cls,z);
 const ids=new Set(vis.map(r=>r.id));Object.keys(markers).forEach(id=>{if(!ids.has(id)&&id!==sheetId){const mk=markers[id],el=mk._icon&&mk._icon.firstElementChild;delete markers[id];if(el&&!RM){el.classList.add("out");setTimeout(()=>map.removeLayer(mk),170)}else map.removeLayer(mk)}});
 const fresh=vis.filter(r=>!markers[r.id]).sort((a,b)=>pinScore(b)-pinScore(a)),dl=new Map(fresh.map((r,i)=>[r.id,Math.min(i*14,320)]));
 vis.forEach(r=>{const d=dot&&!SV.has(r.id),m=markers[r.id];
  if(!m){markers[r.id]=pin(r,d,dl.get(r.id)||0);markers[r.id].addTo(map)}
  else{const sg=pinSig(r,d);if(m._sig!==sg){m._sig=sg;m.setIcon(pinIcon(r,d));m._base=SV.has(r.id)?400:0;m.setZIndexOffset(m._base);const t=m.getTooltip();if(t)t.options.offset=L.point(0,d?-9:-30)}}});
 wantMeta(vis.map(r=>r.id));applySel()}
/* numbered bubbles for crowded places when zoomed out */
const BOWL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5h18a9 9 0 0 1-18 0z" fill="currentColor"/><path d="M8.5 3.5c-1 1.4 1 2.4 0 4.2M12 3.5c-1 1.4 1 2.4 0 4.2M15.5 3.5c-1 1.4 1 2.4 0 4.2" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
 clIcon=(n,h,v)=>L.divIcon({className:"",html:`<div class="clb${n>=100?" big":""}"><span class="clc">${BOWL}</span><b>${n>=1000?(n/1000).toFixed(1).replace(".0","")+"k":n}</b>${h||v?`<span class="dt">${h?'<i class="dh"></i>':""}${v?'<i class="dv"></i>':""}</span>`:""}</div>`,iconSize:[0,0],iconAnchor:[0,0]}),clMk={};
function syncCl(list,z){const keep=new Set();
 for(const [k,la,ln,n,h,v] of list){const id=z+":"+k,m=clMk[id],sg=n+"|"+h+"|"+v;keep.add(id);
  if(!m){const mk=L.marker([la,ln],{icon:clIcon(n,h,v),title:String(n),zIndexOffset:-100});mk._n=sg;mk.on("click",()=>map.setView(mk.getLatLng(),Math.min(z+2,17)));clMk[id]=mk.addTo(map)}
  else if(m._n!==sg){m._n=sg;m.setIcon(clIcon(n,h,v));m.setLatLng([la,ln])}}
 for(const id of Object.keys(clMk))if(!keep.has(id)){map.removeLayer(clMk[id]);delete clMk[id]}}
/* redraw pins at most every 200 ms while the map is moving or zooming */
let syT=0,syAt=0;function syncSoon(){clearTimeout(syT);const w=syAt+200-Date.now();if(w<=0){syAt=Date.now();syncMarkers()}else syT=setTimeout(()=>{syAt=Date.now();syncMarkers()},w)}
const rr=()=>{shown=30;render()};
function locate(){const n=$("#mapNote");n.style.display="block";n.textContent=T("Finding your location…");
 const fail=()=>{n.textContent=T("Location is off. Allow location access in your browser to see where you are.");renderList()};
 if(!navigator.geolocation){fail();return}
 navigator.geolocation.getCurrentPosition(p=>{me={lat:p.coords.latitude,lng:p.coords.longitude};
  if(map){if(meLayer)map.removeLayer(meLayer);meLayer=L.layerGroup([L.circle([me.lat,me.lng],{radius:p.coords.accuracy,weight:1,color:"#2a7de1",fillOpacity:.1}),L.marker([me.lat,me.lng],{icon:L.divIcon({className:"",html:'<div class="me"></div>',iconSize:[16,16],iconAnchor:[8,8]}),interactive:false})]).addTo(map)}
  const near=Math.min(...all().map(r=>km(me,r)));
  n.textContent=near<60?T("You are on the map (blue dot)."):T("You are {0} km from the nearest listed place.",fmt(near));
  render(false);if(map&&near<60){map.setView([me.lat,me.lng],15)}},fail,{timeout:10000,enableHighAccuracy:true})}
$("#locBtn").onclick=locate;
$("#fSort").onchange=()=>{if($("#fSort").value==="dist"&&!me)locate();rr()};
let fcT=null;$("#fCuisine").oninput=()=>{drawFex();clearTimeout(fcT);fcT=setTimeout(rr,250)};$("#fPrice").oninput=()=>{prUi();if(+$("#fPrice").value<20)prLoad();clearTimeout(fcT);fcT=setTimeout(rr,150)};let qT=0;$("#q").oninput=()=>{sgUpdate();clearTimeout(qT);qT=setTimeout(()=>{shown=30;render(!!$("#q").value.trim())},350)};
$("#q").addEventListener("focus",()=>{if($("#q").value.trim().length>=2)sgUpdate()});$("#q").addEventListener("blur",()=>setTimeout(sgHide,200));
$("#sugg").addEventListener("mousedown",e=>e.preventDefault());$("#sugg").addEventListener("click",e=>{const b=e.target.closest("[data-sg]");if(b)sgPick(+b.dataset.sg)});

document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{const k=b.dataset.f;F[k]=F[k]?0:1;document.querySelectorAll(`[data-f="${k}"]`).forEach(x=>{x.classList.toggle("on",!!F[k]);x.setAttribute("aria-pressed",!!F[k])});rr()});
$("#allc").onclick=e=>{if(e.target.closest("[data-allf]"))allFilters()};
$("#cats").onclick=e=>{const b=e.target.closest("[data-cat]");if(!b)return;cat=b.dataset.cat===cat?"":b.dataset.cat;renderChips();fillOpts();rr()};
$("#cities").onclick=e=>{const b=e.target.closest("[data-city]");if(!b||!map)return;showMap();openCity(CITIES.find(x=>x[0]===b.dataset.city))};
function allAsia(){country="";document.querySelectorAll("#country button").forEach((x,i)=>x.classList.toggle("on",i===0));renderChips();fillOpts();rr();showMap();if(map)map.setView([36,128],4)}
async function findCity(){const q=$("#cityQ").value.trim(),out=$("#cityRes");if(q.length<2||findCity.busy)return;findCity.busy=1;out.textContent=T("Searching…");
 try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=jp,kr,cn&featureType=settlement&accept-language="+encodeURIComponent(lang)+"&q="+encodeURIComponent(q));if(!r.ok)throw 0;const j=await r.json();
  const hits=(Array.isArray(j)?j:[]).filter(h=>isFinite(+h.lat)&&isFinite(+h.lon));
  out.innerHTML=hits.length?hits.map(h=>`<button class="plain" data-cll="${(+h.lat).toFixed(5)},${(+h.lon).toFixed(5)}">${si("pin")} ${esc(String(h.display_name||h.name||"").split(",").slice(0,3).join(","))}</button>`).join(""):esc(T("Nothing found."))}
 catch(e){out.textContent=T("Could not search. Please try again.")}finally{setTimeout(()=>{findCity.busy=0},1000)}}
$("#cityGo").onclick=findCity;$("#cityQ").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();findCity()}});
$("#cityRes").onclick=e=>{const b=e.target.closest("[data-cll]");if(!b||!map)return;const [la,lo]=b.dataset.cll.split(",").map(Number);country="";document.querySelectorAll("#country button").forEach((x,i)=>x.classList.toggle("on",i===0));renderChips();fillOpts();rr();showMap();map.setView([la,lo],13)};
document.querySelectorAll("#country button").forEach(b=>b.onclick=()=>{country=b.dataset.c;document.querySelectorAll("#country button").forEach(x=>x.classList.toggle("on",x===b));renderChips();fillOpts();rr()});

// ===== CARD ACTIONS =====
let sheetId=null,sState="peek";
const place=id=>all().find(r=>r.id===id);
function scoreBadge(r){const a=avg(r),n=rcount(r);return a!=null?`<span class="star">★ ${a.toFixed(1)} <small>${n} ${n==1?T("review"):T("reviews")}</small></span>`:(r.rating&&!sbOn()?`<span class="star">★ ${r.rating.toFixed(1)} <small>${T("example")}</small></span>`:(sbOn()?noRev():""))}
const SH=()=>$("#sheet"),TAB=0,H={peek:160,full:400},RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
const yOf=x=>x==="full"?0:x==="peek"?H.full-H.peek:H.full+90;
const EASE="transform .45s cubic-bezier(.22,1,.36,1)";
function measure(){const sh=SH(),pe=$("#sbody [data-pe]");sh.style.transition="none";sh.style.height="auto";
 H.peek=Math.round((pe?pe.offsetTop:150)+8);H.full=Math.max(H.peek+60,Math.min(innerHeight-TAB-80,sh.scrollHeight));sh.style.height=H.full+"px";sh.offsetHeight}
function applyH(anim){const sh=SH();sh.style.transition=anim&&!RM?EASE:"none";sh.style.transform=`translateY(${yOf(sState)}px)`;sh.classList.toggle("full",sState==="full");sh.classList.toggle("peek",sState!=="full")}
function drawSheet(){const r=place(sheetId);if(!r){closeSheet();return}const sc=$("#sbody").scrollTop;$("#sbody").innerHTML=card(r,"s");measure();applyH(false);$("#sbody").scrollTop=sc}
function openSheet(id){const sh=SH(),was=sheetId!==null,r=place(id);if(!r)return;sheetId=id;sState="peek";document.body.classList.add("sheet-on");sh.classList.add("open");$("#sbody").innerHTML=card(r,"s");measure();
 if(!was){sh.style.transition="none";sh.style.transform=`translateY(${yOf("closed")}px)`}
 $("#sbody").scrollTop=0;void sh.offsetHeight;applyH(true);applySel();sbReviews(id);sbExtra(id);wantMeta([id])}
function setState(x){sState=x;if(x==="peek")$("#sbody").scrollTop=0;applyH(true)}
function closeSheet(){if(sheetId===null)return;sheetId=null;document.body.classList.remove("sheet-on");const sh=SH();sh.style.transition=RM?"none":EASE;sh.style.transform=`translateY(${yOf("closed")}px)`;sh.classList.remove("full");sState="peek";applySel();
 setTimeout(()=>{if(sheetId===null)sh.classList.remove("open","peek")},500)}
function applySel(){document.querySelectorAll(".pn.sel").forEach(e=>e.classList.remove("sel"));Object.values(markers).forEach(x=>{if(x._zi)x.setZIndexOffset(x._base||0),x._zi=0});const m=sheetId&&markers[sheetId];if(m&&m._icon){const e=m._icon.querySelector(".pn");if(e)e.classList.add("sel");m.setZIndexOffset(1000);m._zi=1}}
function showOnMap(id){const r=place(id);if(!r||!map)return;if(curView!=="explore"){goTab("explore");map.invalidateSize()}showMap();map.setView([r.lat,r.lng],Math.max(map.getZoom(),16),{animate:false});openSheet(id);nudge(id,false)}

function closeRv(){const m=document.getElementById("rvModal");if(m)m.classList.remove("on");rvPh.forEach(p=>URL.revokeObjectURL(p.u));rvPh=[]}
function openRv(id){const r=place(id);if(!r)return;const m=ensureModal();rvPh=[];
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(dname(r))}</h3><div class="rv open"><div class="stars" data-v="0">${[1,2,3,4,5].map(i=>`<button data-star="${i}" aria-label="${i} stars">★</button>`).join("")}</div><div class="prpick" data-pv="0"><span>${esc(T("Price per person (optional)"))}</span>${[1,2,3,4].map(i=>`<button type="button" data-prp="${i}">${prSym(i,r.country)}<small>${esc(prRange(i,r.country))}</small></button>`).join("")}</div>
  <input data-n placeholder="${T("Your name (optional)")}"><textarea data-t rows="3" placeholder="${T("What did you order? What was it like?")}"></textarea>
  ${sbOn()?`<div><button type="button" class="rbtn" data-phpick>${si("camera")} ${esc(T("Add photos (up to 3)"))}</button><input type="file" accept="image/*" multiple hidden data-phfile><div class="thumbs" data-thumbs></div><p class="hint" style="margin:0 0 8px">${esc(T("Photos are public. Only upload your own food photos, no people. Location data is removed."))}</p></div>`:""}
  <div class="btns"><button class="btn fill" data-save="${r.id}">${T("Save review")}</button><button class="btn" data-shr="${r.id}">${T("Share review")}</button></div><p class="hint" data-m style="margin:8px 0 0"></p></div></div>`;
 m.classList.add("on")}
function openFlag(id){const r=place(id);if(!r)return;const m=ensureModal();
 const row=(k,lab)=>`<div class="fl" data-k="${k}" data-v=""><b>${lab}</b><span class="seg"><button data-fsel="yes">✓ ${T("Yes")}</button><button data-fsel="no">✗ ${T("No")}</button><button data-fsel="">${T("Not sure")}</button></span></div>`;
 const fv=load("jk_foodv",[]),voted=Array.isArray(fv)&&fv.includes(id),opts=FT.map(([sl,l])=>[sl,cuis(l)]).sort((a,b)=>a[1].localeCompare(b[1],lang)).map(([sl,l])=>`<option value="${sl}">${esc(l)}</option>`).join("");
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(dname(r))}</h3>${row("closed",T("Closed for good, or not here"))}<p class="hint" style="margin:10px 0 6px">${T("Does this place have…")}</p>${row("halal",T("Halal"))}${row("vegetarian",T("Vegan / vegetarian"))}
  <div class="ffd"><b>${esc(T("What kind of food is it?"))}</b>${voted?`<p class="hint" style="margin:0">${esc(T("You already suggested a food type for this place."))}</p>`:`<select data-ffood aria-label="${esc(T("What kind of food is it?"))}"><option value="">${esc(T("Not sure"))}</option>${opts}</select><p class="hint" style="margin:6px 0 0">${esc(T("Pick one. The answers of visitors decide automatically."))}</p>`}</div>
  <div class="btns" style="margin-top:12px"><button class="btn fill" data-fsend="${r.id}">${T("Send report")}</button></div><p class="hint" data-m style="margin:8px 0 0">${T("Reports from visitors are not checked.")}</p></div>`;
 m.classList.add("on")}
async function lookAddr(r){/* asks OpenStreetMap (Nominatim) for the nearest address, only when you tap the button */
 const lc={Korea:"ko",Japan:"ja",China:"zh"}[r.country]||"en",
 one=async l=>{try{const j=await(await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${r.lat}&lon=${r.lng}&accept-language=${l}`,{signal:tsig()})).json();return j&&j.display_name||""}catch(e){return""}};
 const a=await one("en");let b="";if(lc!=="en"){await new Promise(x=>setTimeout(x,1100));b=await one(lc)}
 const list=[a,b].filter((v,i,z)=>v&&z.indexOf(v)===i);if(!list.length)return"";
 return list.map(v=>`<div>${esc(v)} <button class="rbtn cp" data-copy="${esc(v)}">${si("copy")} ${T("Copy")}</button></div>`).join("")+`<small>${T("Nearest address from OpenStreetMap, not exact.")}</small>`}
function onAct(ev){const t=ev.target.closest("button,a");if(!t)return;const g=x=>t.getAttribute(x),C=t.closest(".card");let id;
 const refresh=()=>{render(false);if(sheetId)drawSheet();if(curView==="lists")drawLists()};
 if(id=g("data-fav")){if(toggleIn("fav",id))refresh()}
 else if(t.hasAttribute("data-edon")){const bx=t.closest(".rvbox"),m2=bx.querySelector("[data-m]"),c=bx.querySelector("[data-edc]").value;if(!c||t.disabled)return;t.disabled=true;m2.textContent=T("Sending…");
  edCheck(c).then(ok=>{t.disabled=false;if(ok){edCode=c;save("jk_ed",c);flash(T("Editor mode is on."));closeRv()}else m2.textContent=T("Wrong code, or too many tries. Wait an hour and try again.")})}
 else if(t.hasAttribute("data-edoff")){edCode="";save("jk_ed","");closeRv()}
 else if(t.hasAttribute("data-npv")){const pid=g("data-np"),v=g("data-npv"),bs=C?C.querySelectorAll("[data-npv]"):[],m2=C&&C.querySelector("[data-npm]");if(t.disabled)return;bs.forEach(b=>b.disabled=true);
  npVote(pid,v).then(st=>{if(st){npVoted.add(pid);save("jk_npvoted",[...npVoted].slice(-500));if(m2)m2.textContent=st===1?T("Thanks for checking!"):T("You already answered.");npLoad(true)}else{bs.forEach(b=>b.disabled=false);if(m2)m2.textContent=T("Could not send. Please try again.")}})}
 else if(t.hasAttribute("data-mnpick")){const f=C&&C.querySelector("[data-mnfile]");if(f)f.click()}
 else if(id=g("data-oiadd"))openOi(id)
 else if(id=g("data-oirep")){const n=Number(id),m2=C&&C.querySelector("[data-oim]");if(t.disabled||!Number.isInteger(n))return;t.disabled=true;
  fetch(`${SB.url}/rest/v1/owner_info_reports`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({info_id:n,device:dev})}).then(r=>{if(r.ok||r.status===409){oiRep.add(n);save("jk_oirep",[...oiRep].slice(-300));flash(T("Reported. Thank you!"));if(sheetId)drawSheet()}else{t.disabled=false;if(m2)m2.textContent=T("Could not send. Please try again.")}},()=>{t.disabled=false;if(m2)m2.textContent=T("Could not send. Please try again.")})}
 else if(id=g("data-oisave")){const bx=t.closest(".rvbox"),m2=bx.querySelector("[data-m]"),ph=bx.querySelector("[data-oiph]").value.trim(),no=bx.querySelector("[data-oino]").value.trim().slice(0,300);
  if(!bx.querySelector("[data-oiok]").checked){m2.textContent=T("Please tick the box first.");return}
  if((ph&&!/^[+0-9 ()\-]{5,30}$/.test(ph))||(!ph&&!no)){m2.textContent=T("Please enter a valid phone number or a note.");return}
  if(t.disabled)return;t.disabled=true;m2.textContent=T("Sending…");
  fetch(`${SB.url}/rest/v1/owner_info`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({place_id:id,phone:ph||null,note:no||null,device:dev})}).then(r=>{t.disabled=false;if(r.ok){flash(T("Sent. Thank you!"));closeRv();sbExtra(id,true)}else m2.textContent=T("Could not send. Please try again.")},()=>{t.disabled=false;m2.textContent=T("Could not send. Please try again.")})}
 else if(t.hasAttribute("data-lsave"))openSave(g("data-lsave"))
 else if(t.hasAttribute("data-lt")){const pid=g("data-pid");if(toggleIn(g("data-lt"),pid)){const rw=document.getElementById("lRows");if(rw)rw.innerHTML=saveRows(pid);refresh()}}
 else if(t.hasAttribute("data-lnew")){const pid=g("data-lnew"),inp=t.parentNode.querySelector("[data-lname]"),m2=t.closest(".rvbox").querySelector("[data-m]"),l=newList(inp.value,pid);
  if(!l){if(!inp.value.trim())m2.textContent=T("Please type a name for the list.");return}openSave(pid);refresh();flash(T("Saved to {0}",lname(l)))}
 else if(t.hasAttribute("data-lmake"))openName("new")
 else if(t.hasAttribute("data-lok")){const v=g("data-lok"),bx=t.closest(".rvbox"),nm=bx.querySelector("[data-lname]").value.trim().slice(0,30);
  if(!nm){bx.querySelector("[data-m]").textContent=T("Please type a name for the list.");return}
  if(v==="new"){const l=newList(nm);if(!l)return;curList=l.id;lShown=30;closeRv();if(curView==="lists")drawLists();else goTab("lists")}
  else{const l=ulists.find(x=>x.id===v.slice(4));if(l&&!l.d){l.n=nm;persist();closeRv();drawLists()}}}
 else if(t.hasAttribute("data-lsel")){curList=g("data-lsel");lShown=30;drawLists()}
 else if(t.hasAttribute("data-lrm")){const l=allLists().find(x=>x.id===g("data-lrm"));if(l){const i=l.ids.indexOf(g("data-pid"));if(i>-1){l.ids.splice(i,1);persist();drawLists();render(false)}}}
 else if(t.hasAttribute("data-lmore")){lShown+=30;drawLists()}
 else if(t.hasAttribute("data-lshare")){const l=allLists().find(x=>x.id===curList);if(l)shareText(listText(l),$("#lHead [data-m]"))}
 else if(t.hasAttribute("data-lren"))openName("ren",curList)
 else if(t.hasAttribute("data-ldel")){if(t.dataset.arm){const i=ulists.findIndex(x=>x.id===curList);if(i>-1&&!ulists[i].d){ulists.splice(i,1);persist()}curList="fav";drawLists();render(false)}
  else{t.dataset.arm="1";t.innerHTML=si("trash")+" "+esc(T("Tap again to delete"));setTimeout(()=>{if(t.isConnected){delete t.dataset.arm;t.innerHTML=si("trash")+" "+esc(T("Delete list"))}},3500)}}
 else if(t.hasAttribute("data-lmap")){const l=allLists().find(x=>x.id===curList);if(!l||!map)return;resetAll();listF=new Set(l.ids);listChipShow(l);goTab("explore");setTimeout(()=>{map.invalidateSize();render(true)},80)}
 else if(t.hasAttribute("data-phpick")){const f=t.parentNode.querySelector("[data-phfile]");if(f)f.click()}
 else if(t.hasAttribute("data-phdel")){const p=rvPh.splice(+g("data-phdel"),1)[0];if(p)URL.revokeObjectURL(p.u);drawThumbs()}
 else if(t.hasAttribute("data-ph"))openPhoto(g("data-ph"))
 else if(t.hasAttribute("data-phrep")){const p=g("data-phrep"),m2=t.closest(".rvbox").querySelector("[data-m]");if(t.disabled)return;t.disabled=true;
  sbPhotoReport(p).then(st=>{if(st===1||st===2){phHidden.add(p);save("jk_phrep",[...phHidden].slice(-300));m2.textContent=st===1?T("Photo reported. Thank you!"):T("You already reported this photo.");refresh()}else{t.disabled=false;m2.textContent=T("Could not send. Please try again.")}})}
 else if(g("data-nav")&&C){const n=C.querySelector(".nav");if(t.closest("#sheet")&&sState==="peek"){setState("full");n.classList.add("open")}else n.classList.toggle("open")}
 else if(id=g("data-naver")){ev.preventDefault();const r=place(id),l=links(r).nav[0];let hid=false;
  document.addEventListener("visibilitychange",function h(){hid=true;document.removeEventListener("visibilitychange",h)});
  location.href=l.h;setTimeout(()=>{if(!hid)open(l.web,"_blank")},1500)}
 else if(g("data-rev"))openRv(g("data-rev"));
 else if(g("data-copy")){const v=g("data-copy");(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(v):Promise.reject()).then(()=>flash(T("Copied")),()=>flash(v))}
 else if(id=g("data-addr")){const r=place(id),out=t.closest(".info")&&t.closest(".info").querySelector(".adout");if(!r||!out||t.disabled)return;t.disabled=true;out.textContent=T("Searching…");
  lookAddr(r).then(h=>{if(h)out.innerHTML=h;else{out.textContent=T("Nothing found.");t.disabled=false}})}
 else if(g("data-flag"))openFlag(g("data-flag"));
 else if(t.hasAttribute("data-fsel")){const rw=t.closest(".fl");rw.dataset.v=g("data-fsel");rw.querySelectorAll("[data-fsel]").forEach(b=>b.classList.toggle("on",b===t&&!!g("data-fsel")))}
 else if(id=g("data-fsend")){const box=t.closest(".rvbox"),m=box.querySelector("[data-m]"),items=[...box.querySelectorAll(".fl")].filter(x=>x.dataset.v).map(x=>[x.dataset.k,x.dataset.v]),fs=box.querySelector("[data-ffood]"),food=fs&&fs.value;
  if(food&&FTL[food])items.push(["food:"+food,"yes"]);
  if(!items.length){m.textContent=T("Choose at least one answer.");return}
  if(t.disabled)return;t.disabled=true;m.textContent=T("Sending…");
  sbFlagPost(id,items).then(res=>{t.disabled=false;const ok=items.filter((_,i)=>res[i]===1),dup=res.some(x=>x===2);
   if(ok.length){ok.forEach(([k,v])=>{const f=(flags[id]=flags[id]||{}),c=(f[k]=f[k]||{y:0,n:0});if(v==="yes")c.y++;else c.n++;
     if(k.startsWith("food:")){const a=load("jk_foodv",[]);a.push(id);save("jk_foodv",a.slice(-500))}});
    closeRv();flash(T("Report sent. Thank you!"));const pl=place(id);if(pl&&foodApply(pl))fillOpts();if(markers[id]&&map){map.removeLayer(markers[id]);delete markers[id]}refresh();wantMeta([id],true)}
   else if(dup)m.textContent=T("You already sent a report for this place.");else m.textContent=T("Could not send. Please try again.")})}
 else if(g("data-prp")){const w=t.closest(".prpick"),v=+g("data-prp"),nv=+w.dataset.pv===v?0:v;w.dataset.pv=nv;w.querySelectorAll("[data-prp]").forEach(b=>b.classList.toggle("on",+b.dataset.prp===nv))}
  else if(g("data-star")){const s2=t.parentNode,v=+g("data-star");s2.dataset.v=v;[...s2.children].forEach((b,i)=>b.classList.toggle("on",i<v))}
 else if((id=g("data-save")||g("data-shr"))&&C){const pn=C.querySelector(".rv"),v=+pn.querySelector(".stars").dataset.v,m=pn.querySelector("[data-m]"),r=place(id);
  if(!v){m.textContent=T("Please choose 1 to 5 stars.");return}
  const rev={stars:v,price:+((pn.querySelector(".prpick")||{dataset:{}}).dataset.pv||0),name:pn.querySelector("[data-n]").value.trim(),text:pn.querySelector("[data-t]").value.trim(),date:new Date().toISOString().slice(0,10)};
  if(g("data-save")){if(sbOn()){submitReview(t,m,id,rev)}else{(reviews[id]=reviews[id]||[]).unshift(rev);save("jk_reviews",reviews);closeRv();flash(T("Review sent."));refresh()}}
  else shareText(`Jakorchi review\nPlace: ${r.name} (${r.city||""})\nStars: ${v}/5\nBy: ${rev.name||"Traveler"}\n${rev.text}`,m)}
 else if(id=g("data-tipfor")){const r=place(id);$("#tName").value=r.name;$("#tArea").value=r.city||"";goTab("tip")}
 else if(id=g("data-show"))showOnMap(id);
 else if(t.hasAttribute("data-expand"))setState("full");
 else if(t.hasAttribute("data-expandnav")){setState("full");const n=$("#sbody .nav");if(n)n.classList.add("open")}
 else if(t.hasAttribute("data-more")){shown+=30;render(false)}}
$("#list").addEventListener("click",onAct);$("#sbody").addEventListener("click",onAct);
(()=>{const sh=SH();let y0=null,t0=0,base=0,drag=false,pid=null,just=false;
 sh.addEventListener("pointerdown",e=>{if(sheetId===null)return;if(sState==="full"&&!e.target.closest("#grab"))return;if(e.target.closest("#sx"))return;y0=e.clientY;t0=Date.now();base=yOf(sState);drag=false;pid=e.pointerId});
 sh.addEventListener("pointermove",e=>{if(y0==null||e.pointerId!==pid)return;const dy=e.clientY-y0;
  if(!drag&&Math.abs(dy)>6){drag=true;sh.style.transition="none";try{sh.setPointerCapture(pid)}catch(_){}}
  if(drag)sh.style.transform=`translateY(${Math.max(0,Math.min(yOf("closed"),base+dy))}px)`});
 const end=e=>{if(y0==null||e.pointerId!==pid)return;const dy=e.clientY-y0,was=drag,v=dy/Math.max(1,Date.now()-t0),cu=base+dy;y0=null;drag=false;
  if(!was){if(e.type==="pointerup"&&e.target.closest("#grab"))setState(sState==="peek"?"full":"peek");return}
  just=true;setTimeout(()=>just=false,0);
  let tg;if(v<-.45)tg="full";else if(v>.45)tg=sState==="full"?"peek":"closed";
  else tg=["full","peek","closed"].sort((a,b)=>Math.abs(yOf(a)-cu)-Math.abs(yOf(b)-cu))[0];
  tg==="closed"?closeSheet():setState(tg)};
 sh.addEventListener("pointerup",end);sh.addEventListener("pointercancel",end);
 sh.addEventListener("click",e=>{if(just){e.stopPropagation();e.preventDefault()}},true);
 addEventListener("resize",()=>{if(sheetId!==null){measure();applyH(false)}})})();
$("#sx").onclick=closeSheet;addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet()});

// ===== Map-first layout: list and filter panels, messages, pin nudge =====
function note(t,ms){const n=$("#mapNote");clearTimeout(note.t);if(!t){n.style.display="none";return}n.textContent=t;n.style.display="block";if(ms)note.t=setTimeout(()=>n.style.display="none",ms)}
const osmOut={set textContent(t){$("#osmMsg").textContent=t;note(t,t===T("Loading places…")?0:4000)}};
let noteT;new MutationObserver(()=>{clearTimeout(noteT);noteT=setTimeout(()=>{$("#mapNote").style.display="none"},6000)}).observe($("#mapNote"),{childList:true,characterData:true,subtree:true});
$("#mapNote").onclick=()=>{$("#mapNote").style.display="none"};
const showList=()=>{closeSheet();$("#fpanel").classList.remove("open");$("#listPanel").classList.add("open");render(false);$("#listPanel").scrollTop=0};
const showMap=()=>{$("#listPanel").classList.remove("open");$("#fpanel").classList.remove("open");if(map)setTimeout(()=>map.invalidateSize(),50)};
const showFilters=()=>{closeSheet();prUi();$("#listPanel").classList.remove("open");$("#fpanel").classList.add("open")};
$("#listBtn").onclick=showList;$("#mapBtn").onclick=showMap;$("#filtBtn").onclick=showFilters;$("#whereBtn").onclick=showFilters;$("#fDone").onclick=showMap;
$("#q").addEventListener("keydown",e=>{if(e.key==="Enter"){if(sgItems.length){e.preventDefault();sgPick(0);return}e.target.blur();showList()}else if(e.key==="Escape")sgHide()});
function resetAll(){listChipHide();country="";cat="";Object.keys(F).forEach(k=>F[k]=0);$("#q").value="";$("#fCuisine").value="";drawFex();$("#fPrice").value=20;prUi();
 document.querySelectorAll("[data-f]").forEach(b=>{b.classList.remove("on");b.setAttribute("aria-pressed","false")});document.querySelectorAll("#country button").forEach((b,i)=>b.classList.toggle("on",i===0));renderChips();fillOpts();rr()}
$("#fReset").onclick=resetAll;
function nudge(id,anim=true){const m=markers[id];if(!m||!map)return;setTimeout(()=>{const sz=map.getSize(),pt=map.latLngToContainerPoint(m.getLatLng()),ty=(150+sz.y-H.peek-20)/2;map.panBy([0,pt.y-ty],{animate:anim})},80)}

// ===== Readable names, food-type guess, halal/vegan words: made by the app itself (no outside service) =====
const HL=["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"],
 HV=["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"],
 HT=["","k","k","k","n","n","n","t","l","k","m","l","l","l","p","l","m","p","p","t","t","ng","t","t","k","t","p","t"],
 HLI=[0,["","g"],["","kk"],["k","s"],["","n"],["n","j"],["n",""],["","d"],["","r"],["l","g"],["l","m"],["l","b"],["l","s"],["l","t"],["l","p"],["l",""],["","m"],["","b"],["p","s"],["","s"],["","ss"],0,["","j"],["","ch"],["","k"],["","t"],["","p"],["",""]];
const isHg=c=>c>=0xAC00&&c<=0xD7A3;
function romanKo(s){/* Korean letters -> Latin letters (Revised Romanization, approximate) */
 const ch=[...s],sy=ch.map(c=>{const n=c.charCodeAt(0)-0xAC00;return isHg(c.charCodeAt(0))?{L:Math.floor(n/588),V:Math.floor(n%588/28),T:n%28}:null});
 let out="",prevL=false,last="o";
 for(let i=0;i<ch.length;i++){const y=sy[i],k=y?"h":/[A-Za-z0-9]/.test(ch[i])?"l":"o";
  if((k==="h"&&last==="l")||(k==="l"&&last==="h"))out+=" ";
  last=k;
  if(!y){out+=ch[i];prevL=false;continue}
  let ini=HL[y.L];if(y.L===5&&prevL)ini="l";
  if(y.carry!==undefined)ini=y.carry;
  let coda=HT[y.T];prevL=false;
  const nx=sy[i+1];
  if(y.T&&y.T!==21&&nx&&nx.L===11){const li=HLI[y.T];coda=li[0];nx.carry=li[1]}
  out+=ini+HV[y.V]+coda;prevL=coda==="l"}
 return out}
const KA="あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
 KR=["a","i","u","e","o","ka","ki","ku","ke","ko","sa","shi","su","se","so","ta","chi","tsu","te","to","na","ni","nu","ne","no","ha","hi","fu","he","ho","ma","mi","mu","me","mo","ya","yu","yo","ra","ri","ru","re","ro","wa","wo","n","ga","gi","gu","ge","go","za","ji","zu","ze","zo","da","ji","zu","de","do","ba","bi","bu","be","bo","pa","pi","pu","pe","po"];
const KMAP={};[...KA].forEach((c,i)=>KMAP[c]=KR[i]);KMAP["ゔ"]="vu";
const KSM={"ゃ":"a","ゅ":"u","ょ":"o","ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o"};
function romanJa(s){/* kana -> Latin letters (Hepburn, simple). Names with kanji are left alone. */
 if(/[一-鿿]/.test(s))return s;
 const ch=[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x30A1&&n<=0x30F6?String.fromCharCode(n-0x60):c});
 let out="",dbl=false;
 for(let i=0;i<ch.length;i++){const c=ch[i];
  if(c==="っ"){dbl=true;continue}
  if(c==="ー"||c==="々"){continue}
  let r=KMAP[c];if(r===undefined){out+=c;dbl=false;continue}
  const sm=KSM[ch[i+1]];
  if(sm){const stem=r.length>1?r.slice(0,-1):(r==="u"?"w":"");
   if("ゃゅょ".includes(ch[i+1])){r=(["sh","ch","j"].includes(stem)?stem:stem+"y")+sm}else r=stem+sm;i++}
  if(dbl){r=(r.startsWith("ch")?"t":r[0])+r;dbl=false}
  out+=r}
 return out}
const capWords=s=>s.replace(/(^|[\s(\-\/·&])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
function toLatin(name){/* returns a Latin-letter version of a Korean / kana name, or "" when nothing to do */
 if(!name)return"";
 if(/[\uAC00-\uD7A3]/.test(name)){
  const r=name.split(/(\s+)/).map(w=>{if(w==="본점")return"Main Branch";const m=w.match(/^([\uAC00-\uD7A3]{2,})점$/);return m?romanKo(m[1])+" Branch":romanKo(w)}).join("");
  return capWords(r).replace(/\s+/g," ").trim()}
 if(/[\u3040-\u30ff]/.test(name)){const r=romanJa(name.replace(/[・･]/g," "));return r===name?"":capWords(r).replace(/\s+/g," ").trim()}
 return""}
/* hidden Latin spelling, only used for searching (made the first time someone searches) */
function romOf(r){return r.rom??(r.rom=r.loc?"":(toLatin(r.name)||""))}
/* the food type in all 8 languages, so people can search it in their own language */
function cuisAll(c){if(!c)return"";const m=cuisAll.m||(cuisAll.m={}),k=String(c).toLowerCase();if(m[k]===undefined)m[k]=LANGS.map(l=>{const d=I18N[l[0]]||{};return d["c:"+k]||d[c]||""}).join(" ")+" "+c;return m[k]}
// words -> food type (first match wins). Only a hint: the card says it is a guess.
const FOODS=[
 ["맘스터치|롯데리아|맥도날드|맥도널드|버거킹|モスバーガー|ロッテリア|マクドナルド|麦当劳|汉堡王|mcdonald|burger king|lotteria","burger"],
 ["교촌|비비큐|bbq치킨|bbq chicken|네네치킨|굽네|푸라닭|처갓집|페리카나|호식이|ケンタッキー|肯德基|kfc|케이에프씨","chicken"],
 ["吉野家|すき家|松屋|なか卯|牛丼","gyudon (beef bowls)"],
 ["丸亀製麺|はなまる|讃岐","udon"],
 ["一蘭|一風堂|天下一品|幸楽苑|麺屋|らぁ麺|つけ麺|中華そば","ramen"],
 ["スシロー|くら寿司|はま寿司|かっぱ寿司|回転寿司|回转寿司","sushi"],
 ["coco壱|ココイチ|カレーハウス","curry"],
 ["牛角|安楽亭|叙々苑|焼肉","grilled meat (bbq)"],
 ["サイゼリヤ|ガスト|デニーズ|ジョナサン|ココス|ロイヤルホスト|バーミヤン","family restaurant"],
 ["김밥천국|김가네|바르다김선생|고봉민|한솥","korean snacks (bunsik)"],
 ["파리바게|뚜레쥬르","bakery"],
 ["투다리","pub / drinking spot"],["이삭토스트|토스트|toast","sandwiches"],["백소정","japanese"],["하남돼지집|돼지집","grilled meat (bbq)"],["보승회관","korean soup & stew"],["아비꼬","curry"],["오봉집","korean"],["미분당","vietnamese"],["배떡","korean snacks (bunsik)"],["두찜","korean chicken dishes"],["채선당","japanese hot pot"],["애슐리","family restaurant"],["슬로우캘리","rice bowl"],
 ["마라|麻辣|マーラー","mala hot pot"],["훠궈|火锅|火鍋|海底捞|hot ?pot","hot pot"],["샤브|しゃぶしゃぶ|すき焼|sukiyaki|shabu","japanese hot pot"],
 ["양꼬치|羊肉串|羊肉|lamb","lamb skewers"],["족발|보쌈","korean"],
 ["닭갈비|찜닭|닭볶음|삼계탕|닭한마리|닭도리","korean chicken dishes"],["치킨|통닭|닭강정|닭발|후라이드|프라이드|炸鸡|からあげ|唐揚|fried chicken|chicken","chicken"],
 ["삼겹|갈비|고깃|고기|구이|숯불|불고기|화로|항정|목살|등심|살치|막창|곱창|대창|한우|정육|焼肉|焼き肉|ホルモン|烧烤|烤肉|bbq|barbecue|barbeque","grilled meat (bbq)"],
 ["국밥|해장국|설렁탕|설농탕|우거지|곰탕|순대국|감자탕|찌개|전골|순두부|청국장|추어탕|육개장","korean soup & stew"],
 ["냉면|칼국수|막국수|수제비|밀면|쫄면|잔치국수|국수|면옥|牛肉面|兰州|拉面|面馆|noodle","noodles"],
 ["라멘|라면|ラーメン|らーめん|拉麺|ramen","ramen"],["そば|蕎麦|메밀|soba","soba"],["우동|うどん|饂飩|udon","udon"],
 ["초밥|스시|오마카세|寿司|鮨|すし|sushi","sushi"],["돈까스|돈가스|とんかつ|カツ|tonkatsu|cutlet","tonkatsu (fried cutlet)"],
 ["이자카야|居酒屋|izakaya","izakaya"],["焼鳥|やきとり|焼き鳥|야키토리|yakitori","yakitori"],["天ぷら|天麩羅|tempura","tempura"],["うなぎ|鰻|장어","eel"],
 ["カレー|커리|카레|咖喱|curry","curry"],["丼|덮밥|규동|돈부리","rice bowl"],["お好み焼|たこ焼|もんじゃ|오코노미야키|타코야키|okonomiyaki|takoyaki","okonomiyaki / takoyaki"],
 ["餃子|만두|饺子|包子|小笼|馒头|딤섬|點心|点心|dumpling|gyoza","dumplings"],
 ["짜장|짬뽕|탕수육|중식|중화|중국|반점|中華|中国料理|川菜|粤菜|湘菜|本帮|东北菜|云南菜|新疆菜|chinese","chinese"],
 ["일식|日本料理|日料|和食|japanese","japanese"],["定食","japanese set meals"],
 ["횟집|횟|주꾸미|쭈꾸미|낙곱새|문어|꼼장어|물회|생선회|활어|해물|해산물|조개|꽃게|게장|대게|낙지|아구찜|오징어|海鮮|海鲜|刺身|烤鱼|seafood","seafood"],
 ["피자|ピザ|披萨|pizza","pizza"],["버거|バーガー|汉堡|burger","burger"],["파스타|스파게티|이탈리|리조또|イタリアン|パスタ|意大利|意面|pasta|italian|trattoria","italian"],
 ["스테이크|ステーキ|牛排|steak","steak"],["샌드위치|샌드|サンド|三明治|sandwich","sandwiches"],["타코|멕시|taco|mexican|burrito","mexican"],
 ["쌀국수|베트남|vietnam|pho\\b","vietnamese"],["태국|thai","thai"],["tandoori|indian|인도커리|인도요리","indian"],["케밥|kebab","kebab"],["브런치|brunch","brunch"],
 ["베이커리|제과|빵|브레드|베이글|바게뜨|뚜레쥬르|ベーカリー|パン|面包|烘焙|bakery|bread|bagel","bakery"],
 ["케이크|케익|디저트|아이스크림|젤라또|빙수|와플|마카롱|도넛|도너츠|쿠키|ケーキ|スイーツ|アイス|パティスリー|甜品|蛋糕|冰淇淋|dessert|cake|gelato|ice cream|donut|waffle|macaron|patisserie","desserts"],
 ["커피|카페|珈琲|コーヒー|カフェ|喫茶|咖啡|coffee|cafe|café|espresso|roaster","coffee shop"],
 ["찻집|다방|茶屋|茶房|茶馆|茶館|奶茶|버블티|bubble tea|tea house|teahouse|tea room","tea / bubble tea"],
 ["분식|떡볶이|김밥|순대|어묵|호떡|튀김|라볶이|오뎅","korean snacks (bunsik)"],["죽|粥","porridge / congee"],["烤鸭","roast duck"],["串串|烧烤","skewers"],["小吃","street snacks"],
 ["串カツ|串揚げ|串焼|くし家|串","skewers"],
 ["酒場|ビストロ|bistro","bistro / bar"],
 ["大戸屋|やよい軒|食堂","japanese set meals"],
 ["샐러드|샐러디|サラダ|沙拉|salad","salad"],
 ["도시락|弁当|便当","lunch boxes (dosirak / bento)"],
 ["웍|wok\\b","wok / stir-fry"],
 ["다이너|diner","american diner"],
 ["포차|주점|술집|호프|맥주|막걸리","pub / drinking spot"],
 ["비빔밥|백반|한정식|한식|정식|반상|한상|가정식|집밥|밥상|보리밥|쌈밥|식당|밥집|밥|국","korean"],["饭店|餐厅|酒家|餐馆|菜馆|家常菜","chinese"]
].map(a=>[new RegExp(a[0],"i"),a[1]]);
const RE_HALAL=/할랄|ハラール|ハラル|清真|حلال|halal|halaal/i,RE_VEGAN=/비건|ビーガン|ヴィーガン|纯素|純素|全素|vegan/i,RE_VEG=/채식|사찰음식|菜食|ベジタリアン|素食|素菜|蔬食|vegetarian|veggie/i;
const srcText=p=>p.auto?p.loc:(p.name+" "+(p.loc||""));
function guessFood(p){/* only for restaurant-type places; sweet / coffee places keep their own label */
  const t=srcText(p);
 if(p.cat==="coffee"||p.cat==="drinks")return"";
 const ok=p.cat==="dessert"?["bakery","desserts"]:null;
 for(const [re,lb] of FOODS){if(ok&&!ok.includes(lb))continue;if(re.test(t))return lb}
 return""}
function enrich(p){
/* adds Latin name, food guess and halal / vegan words to a place */
 
  const t=srcText(p);
 if(!p.halal&&RE_HALAL.test(t)){p.halal=true;p.hs="name"}
 if(!p.vegan&&RE_VEGAN.test(t)){p.vegan=true;p.vs="name"}
 if(!p.veg&&(p.vegan||RE_VEG.test(t))){p.veg=true;if(!p.vegan)p.vgs="name"}
 if(!p.cuisine){const g=guessFood(p);if(g){p.cuisine=g;p.cg=1}else{p.cuisine=(CATS.find(c=>c[0]===p.cat)||CATS[1])[1];p.cu0=1}}
 return p}

// ----- richer OpenStreetMap tags (used for live data; the downloader tool does the same for the files) -----
const dv=v=>v==="yes"||v==="only"?1:v==="limited"?2:0;
const LAT_KEYS=["name:en","name_en","name:ko-Latn","name:ko_rm","name:ja-Latn","name:ja_rm","name:zh-Latn-pinyin","name:zh_pinyin","name:zh-Latn","int_name"];
const ADDR_KEYS=["addr:province","addr:state","addr:city","addr:district","addr:subdistrict","addr:suburb","addr:neighbourhood","addr:quarter","addr:city_district","addr:street","addr:block_number","addr:housenumber"];
function osmAddr(t){let a=t["addr:full"];if(!a){const seen=[];ADDR_KEYS.forEach(k=>{const v=t[k];if(v&&!seen.includes(v))seen.push(v)});a=seen.join(" ")}
 const x=[t["addr:unit"],t["addr:floor"]&&"F"+t["addr:floor"]].filter(Boolean).join(" ");
 return[a,x,t["addr:postcode"]?"("+t["addr:postcode"]+")":""].filter(Boolean).join(" ")}
function dietOf(t){const cs=(t.cuisine||"").split(";").map(x=>x.trim()).filter(Boolean),
 h=dv(t["diet:halal"])||(cs.includes("halal")||cs.includes("muslim")?1:0),v=dv(t["diet:vegan"])||(cs.includes("vegan")?1:0),g=dv(t["diet:vegetarian"])||(cs.includes("vegetarian")?1:0);
 return{h,v,g,c:(cs.find(x=>!["halal","muslim","vegan","vegetarian"].includes(x))||cs[0]||"").replace(/_/g," ")}}
const OSMF=(h,v,g)=>({halal:h===1,halalL:h===2,vegan:v===1,veganL:v===2,veg:g===1||v===1,vegL:g===2||v===2});

// ===== City data files (made with jakorchi-data-tool.html) =====
const loadedCities=new Set();
const fromRow=(a,j)=>enrich(Object.assign({id:a[0],src:"osm",name:a[1],loc:a[2],cat:a[3],cuisine:a[4],lat:a[5],lng:a[6],hours:a[9],addr:a[10],web:a[11],phone:a[15]||"",nm:a[16]||undefined,sub:a[17]||"",country:j.country,city:j.city,price:0,rating:null,eng:null},OSMF(a[7],a[8],a[14])));
async function loadCity(name){if(loadedCities.has(name))return"already";
 try{const r=await fetch("data/"+name.toLowerCase()+".json");if(!r.ok)return"none";const j=await r.json(),have=new Set(osm.map(x=>x.id));let n=0;
  j.places.forEach(a=>{if(!have.has(a[0])){osm.push(fromRow(a,j));n++}});loadedCities.add(name);return n}catch(e){return"none"}}
async function openCity(c){map.setView([c[2],c[3]],14);const n=await loadCity(c[0]);
 if(typeof n==="number"){osmOut.textContent=`${n.toLocaleString("en")} places loaded for ${c[0]}. Zoom in to see pins. Data © OpenStreetMap contributors.`;fillOpts();render(false)}
 else if(n==="already")osmOut.textContent=`${c[0]} is already loaded.`;else{tFails=0;tPause=0}}
$("#findBtn").onclick=async()=>{if(!map)return;const btn=$("#findBtn");if(btn.classList.contains("busy"))return;
 btn.classList.add("busy");btn.textContent=T("Searching…");
 try{const ct=map.getCenter();let nc=null,d=1e9;CITIES.forEach(c=>{const x=km({lat:ct.lat,lng:ct.lng},{lat:c[2],lng:c[3]});if(x<d){d=x;nc=c}});
  if(d<80&&!loadedCities.has(nc[0])){const n=await loadCity(nc[0]);if(typeof n==="number"){fillOpts();render(false)}}
  tFails=0;tPause=0;
  if(map.getZoom()<14){hintZoom(true);flash(osmOut.textContent);return}
  Object.keys(markers).forEach(id=>{map.removeLayer(markers[id]);delete markers[id]});tileDone.clear();tRetry={};tq=[];render(false);
  liveOK=true;loadView();
  await new Promise(r=>{const t=setInterval(()=>{if(!tBusy&&!tq.length){clearInterval(t);r()}},200);setTimeout(()=>{clearInterval(t);r()},30000)});
  syncMarkers();flash(osmOut.textContent||T("Search this area"))
 }finally{liveOK=false;btn.classList.remove("busy");btn.textContent=T("Search this area")}};
if(map)map.on("moveend",()=>{syncSoon();autoLoad();npSoon();zHint();clearTimeout(rlT);rlT=setTimeout(renderList,120)});let rlT=0;
/* how far to zoom before restaurants show (pins start at zoom 13) */
const ZNEED=13;
function zHint(){const h=$("#zHint");if(!h||!map)return;const z=Math.round(map.getZoom()),c=map.getCenter(),inAsia=c.lat>18&&c.lat<54&&c.lng>73&&c.lng<146,few=cur.length&&cur.length<=60;
 const show=!(z>=ZNEED||!inAsia||few||curView!=="explore");h.hidden=!show;document.querySelector(".ftop").classList.toggle("zh",show);if(!show)return;
 const n=ZNEED-z;$("#zHintT").textContent=n===1?T("Zoom in 1 more step to see restaurants"):T("Zoom in {0} more steps to see restaurants",n);
 $("#zHintBar").style.width=Math.max(6,Math.round(z/ZNEED*100))+"%";const b=$("#zHintBtn");b.textContent=z<9?T("Find a city"):T("Zoom in");b.dataset.city=z<9?"1":""}
if(map)map.on("zoomend",zHint);
$("#zHintBtn").onclick=e=>{if(e.currentTarget.dataset.city){showFilters();setTimeout(()=>$("#cityQ").focus(),250)}else map.setView(map.getCenter(),ZNEED)};
setTimeout(zHint,2500);
// ===== Live places everywhere: loads only the map tiles you look at (zoom 14+), each tile once =====
const OVP=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://overpass.kumi.systems/api/interpreter"],tsig=()=>{try{return AbortSignal.timeout(10000)}catch(e){return undefined}},TZ=14,tileDone=new Set();
let tq=[],tBusy=false,tPause=0,tTimer=null,tFails=0;
const tx=(lng,z=TZ)=>Math.floor((lng+180)/360*2**z),ty=(lat,z=TZ)=>{const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)};
const tbb=(x,y,Z=TZ)=>{const n=2**Z,la=k=>Math.atan(Math.sinh(Math.PI*(1-2*k/n)))*180/Math.PI,lo=k=>k/n*360-180;return[la(y+1),lo(x),la(y),lo(x+1)].map(v=>v.toFixed(5)).join(",")};
async function fetchBB(bb){const q=`[out:json][timeout:25];(nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|biergarten)$"]["name"](${bb});nwr["shop"~"^(bakery|pastry|confectionery|ice_cream|tea|coffee)$"]["name"](${bb}););out center tags;`;
 const one=url=>fetch(url,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:tsig()}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>j.elements);
 try{return await Promise.any(OVP.map(one))}catch(e){return null}}
/* places/_done.json (written by the data tool) tells how many squares are downloaded; its size is added to the file addresses, so new files are never hidden by an old browser cache */
/* places/_split.json (tools/split_places.py) lists the big squares that also exist as 16 small squares (zoom 14, folder 14/).
   Zoomed in (15 or closer) only the small squares on screen are downloaded; zoomed out the whole file, as before. */
let doneV="",splitSet=new Set();const SPLIT_Z=14,SPLIT_FROM=15;
const doneP=(async()=>{const get=async f=>{try{const r=await fetch(POI_BASE+"/"+f,{cache:"no-cache"});return r.ok?await r.json():null}catch(e){return null}};
 const [d,sp]=await Promise.all([get("_done.json"),get("_split.json")]);
 if(d&&Array.isArray(d.done)&&d.done.length)doneV=String(d.done.length);
 if(sp&&Array.isArray(sp.split)){splitSet=new Set(sp.split);doneV+="-"+String(sp.v||sp.split.length).replace(/[^\w]/g,"")}})();
async function loadPoi(x,y,small){await doneP;let r;try{r=await fetch(`${POI_BASE}/${small?SPLIT_Z+"/":""}${x}_${y}.json${doneV?"?v="+doneV:""}`)}catch(e){return null}
 if(r.status===404)return 0;if(!r.ok)return null;try{return(await r.json()).p}catch(e){return 0}}
const fromPoi=a=>{let nc=CITIES[0],d=1e9;CITIES.forEach(c=>{const x=km({lat:a[5],lng:a[6]},{lat:c[2],lng:c[3]});if(x<d){d=x;nc=c}});
 return enrich(Object.assign({id:a[0],src:"osm",name:a[1],loc:a[2],cat:a[3],cuisine:a[4],lat:a[5],lng:a[6],hours:a[9],addr:a[10],web:a[11],phone:a[15]||"",nm:a[16]||undefined,sub:a[17]||"",country:a[13]||nc[1],city:d<120?nc[0]:"",price:0,rating:null,eng:null},OSMF(a[7],a[8],a[14])))};
function autoLoad(){if(!map)return;clearTimeout(tTimer);tTimer=setTimeout(loadView,500)}
function hintZoom(f){if(!map)return;const c=map.getCenter();if(c.lat<18||c.lat>54||c.lng<73||c.lng>146)return;if(f||!hintZoom.t||Date.now()-hintZoom.t>20000){hintZoom.t=Date.now();$("#osmMsg").textContent=T("Zoom in closer to see restaurants.")}}/* the map shows the zoom pill instead of a toast */
function loadView(){if(!map)return;doneP.then(()=>{
 const st=!!POI_BASE,Z=st?12:TZ;if(map.getZoom()<(st?13:14)){hintZoom();return}const b=map.getBounds(),c=b.getCenter();if(c.lat<18||c.lat>54||c.lng<73||c.lng>146)return;
 const x0=tx(b.getWest(),Z),x1=tx(b.getEast(),Z),y0=ty(b.getNorth(),Z),y1=ty(b.getSouth(),Z),cap=st?(innerWidth>700?9:6):16;let ts=[];
 for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)ts.push([x,y]);
 {const cx=tx(c.lng,Z),cy=ty(c.lat,Z);ts.sort((p,q)=>((p[0]-cx)**2+(p[1]-cy)**2)-((q[0]-cx)**2+(q[1]-cy)**2));ts=ts.slice(0,cap)}/* nearest to the middle first, never more than cap */
 const add=k=>{if(!tileDone.has(k)&&!tq.includes(k))tq.push(k)},d=SPLIT_Z-12,n=2**d;
 ts.forEach(([x,y])=>{
  if(st&&map.getZoom()>=SPLIT_FROM&&splitSet.has(x+"_"+y)&&!tileDone.has("p"+x+"_"+y)){/* only the small squares on screen */
   const a0=Math.max(tx(b.getWest(),SPLIT_Z),x*n),a1=Math.min(tx(b.getEast(),SPLIT_Z),x*n+n-1),c0=Math.max(ty(b.getNorth(),SPLIT_Z),y*n),c1=Math.min(ty(b.getSouth(),SPLIT_Z),y*n+n-1);
   for(let a=a0;a<=a1;a++)for(let c=c0;c<=c1;c++)add("s"+a+"_"+c)}
  else add((st?"p":"")+x+"_"+y)});
 runQ()})}
let liveOK=false,tRetry={};
async function runQ(){if(tBusy)return;tBusy=true;let tot=0,failed=0,missed=0;osmOut.textContent=T("Loading places…");
 try{while(tq.length){
  const isF=q=>q[0]==="p"||q[0]==="s",sk=tq.filter(isF);
  if(sk.length){/* restaurant files: all squares in view are fetched at the same time */
   tq=tq.filter(q=>!isF(q));
   const res=await Promise.all(sk.map(k=>{const [x,y]=k.slice(1).split("_").map(Number);return loadPoi(x,y,k[0]==="s")}));
   const have=new Set(osm.map(r=>r.id));let add=0;const todo=[];
   res.forEach((rows,i)=>{const k=sk[i];
    if(rows===null){if(!tRetry[k]){tRetry[k]=1;tq.push(k)}else failed=1;return}
    tileDone.add(k);
    if(rows===0&&k[0]==="s")return;
    if(rows===0){if(liveOK){const [x,y]=k.slice(1).split("_").map(Number),b=map.getBounds(),a0=tx(b.getWest()),a1=tx(b.getEast()),c0=ty(b.getNorth()),c1=ty(b.getSouth());let n=0;
      for(let a=a0;a<=a1&&n<9;a++)for(let c=c0;c<=c1&&n<9;c++){if((a>>2)===x&&(c>>2)===y){const q=a+"_"+c;if(!tileDone.has(q)&&!tq.includes(q)){tq.push(q);n++}}}}else missed++;return}
    todo.push(rows)});
   /* add places in small portions so the map keeps moving smoothly */
   for(const rows of todo)for(let j=0;j<rows.length;j+=1200){for(const rw of rows.slice(j,j+1200)){const pl=fromPoi(rw);if(pl&&!have.has(pl.id)){osm.push(pl);have.add(pl.id);add++}}await new Promise(r=>setTimeout(r,0))}
   tot+=add;if(add){fillOpts();render(false)}
   if(tq.length&&!tq.some(q=>!isF(q)))await new Promise(r=>setTimeout(r,600));
   continue}
  /* live servers (only when you tap Search this area): 3 small squares at the same time */
  const batch=tq.splice(0,3);
  const res=await Promise.all(batch.map(async k=>{const [x,y]=k.split("_").map(Number);const els=await fetchBB(tbb(x,y));return els===null?null:els.map(conv).filter(Boolean)}));
  const have=new Set(osm.map(r=>r.id));let add=0,bad=0;
  res.forEach((rows,i)=>{if(rows===null){bad++;return}tileDone.add(batch[i]);rows.forEach(pl=>{if(pl&&!have.has(pl.id)){osm.push(pl);have.add(pl.id);add++}})});
  tot+=add;if(add){fillOpts();render(false)}
  if(bad){if(++tFails>1){failed=1;tFails=0;tq=[];osmOut.textContent=T("Could not load places right now. Tap “Search this area” to try again.")}else{res.forEach((r,i)=>{if(r===null)tq.push(batch[i])});await new Promise(r=>setTimeout(r,3000))}}else tFails=0}
 }finally{
  if(!failed){if(missed&&!liveOK&&!tot)osmOut.textContent=T("No restaurant file for this area yet. Tap “Search this area” to try live data.");else{$("#osmMsg").textContent=tot?T("{0} new places loaded here.",tot):T("No new places found in this view.");note("")}}
  tBusy=false}}
// ===== Own map file (PMTiles, roads and names) =====
const isDark=()=>{const t=document.documentElement.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme:dark)").matches};
function loadVector(){if(!BASEMAP.url||!map)return;
 const mk=()=>{try{if(vlayer)map.removeLayer(vlayer);vlayer=protomapsL.leafletLayer({url:BASEMAP.url,flavor:isDark()?"dark":"light",lang:BASEMAP.lang,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>'});vlayer.addTo(map);if(rasterLayer&&map.hasLayer(rasterLayer))map.removeLayer(rasterLayer)}catch(e){vlayer=null;if(rasterLayer&&!map.hasLayer(rasterLayer))rasterLayer.addTo(map)}};
 if(window.protomapsL)return mk();
 const ac=new AbortController();
 fetch(BASEMAP.url,{headers:{Range:"bytes=0-0"},signal:ac.signal}).then(r=>{ac.abort();
  if(r.status!==206){osmOut.textContent=r.status===404?"Own map file not found. Using the online map.":"The map file host does not allow partial downloads. Using the online map.";return}
  const sc=document.createElement("script");sc.src="https://unpkg.com/protomaps-leaflet@5.0.0/dist/protomaps-leaflet.js";sc.onload=mk;document.head.appendChild(sc)}).catch(()=>{})}


// ===== Map with selectable label letters (OpenFreeMap vector tiles, no key) =====
let mapLet=load("jk_maplet","auto");
const mapCode=()=>mapLet==="auto"?lang:(mapLet==="latin"?"en":mapLet);
function labelExpr(c){const f=["get","name:"+c];
 if(c==="ar")return["coalesce",f,["get","name_en"],["get","name:latin"],["get","name"]];
 if(c==="ja"||c==="ko"||c==="zh")return["coalesce",f,["get","name"]];
 return["coalesce",f,["get","name_en"],["get","name:latin"],["get","name"]]}
let glOK=0;const STYLE_URL="https://tiles.openfreemap.org/styles/liberty",STYLE_KEY="jk_style1";
const isNameField=f=>f!==undefined&&/name/.test(JSON.stringify(f));
function rasterOn(){if(map&&!glOK&&!vlayer&&rasterLayer&&!map.hasLayer(rasterLayer))rasterLayer.addTo(map)}
function styleLang(st){const e=labelExpr(mapCode());(st.layers||[]).forEach(l=>{if(l.type==="symbol"&&l.layout&&isNameField(l.layout["text-field"]))l.layout["text-field"]=e});return st}
function styleGet(){try{const c=JSON.parse(localStorage.getItem(STYLE_KEY)||"null");if(c&&c.s&&Array.isArray(c.s.layers)&&Date.now()-c.t<7*864e5)return Promise.resolve(c.s)}catch(e){}
 return fetch(STYLE_URL).then(r=>r.ok?r.json():null).then(st=>{if(st&&Array.isArray(st.layers)){try{localStorage.setItem(STYLE_KEY,JSON.stringify({t:Date.now(),s:st}))}catch(e){}return st}return null}).catch(()=>null)}
function applyMapLang(){try{if(!glLayer)return;const m=glLayer.getMaplibreMap();if(!m||!m.getStyle())return;const e=labelExpr(mapCode());
 (m.getStyle().layers||[]).forEach(l=>{if(l.type==="symbol"&&l.layout&&isNameField(l.layout["text-field"])){try{m.setLayoutProperty(l.id,"text-field",e)}catch(x){}}})}catch(e){}}
function syncDark(){document.getElementById("map").classList.toggle("mapdark",isDark());barColor()}
/* phone status bar takes the colour of the app (navy only while the start screen shows) */
function barColor(){const t=document.querySelector('meta[name="theme-color"]');if(t)t.content=document.getElementById("splash")?"#1c2340":isDark()?"#292624":"#f8f4f0"}
function splashOff(){const e=document.getElementById("splash");if(!e)return;e.classList.add("out");setTimeout(()=>{e.remove();document.documentElement.classList.remove("spl");barColor()},260)}
function loadGL(){if(BASEMAP.url||!map||glLayer||loadGL.t)return;loadGL.t=1;const stP=styleGet();
 const css=document.createElement("link");css.rel="stylesheet";css.href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";css.integrity="sha384-MinO0mNliZ3vwppuPOUnGa+iq619pfMhLVUXfC4LHwSCvF9H+6P/KO4Q7qBOYV5V";css.crossOrigin="anonymous";document.head.appendChild(css);
 /* fingerprints of the exact files (checked by the browser: a changed or tampered file is refused and the plain map stays) */
 const SRI={"https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js":"sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj","https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js":"sha384-4CB9Vtol9LN6lGgBCvmPLbUEZwilrqIvPieSRurgAXAB7FVJaLS9n8WyAIA5wjQ+"};
 const js=(u,ok)=>{const s=document.createElement("script");s.src=u;if(SRI[u]){s.integrity=SRI[u];s.crossOrigin="anonymous"}s.onload=ok;s.onerror=rasterOn;document.head.appendChild(s)};
 js("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js",()=>js("https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js",()=>{
  stP.then(st=>{try{try{maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",true)}catch(e){}
   glLayer=L.maplibreGL({style:st?styleLang(JSON.parse(JSON.stringify(st))):STYLE_URL,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://openfreemap.org">OpenFreeMap</a> · <a href="https://www.openmaptiles.org/">OpenMapTiles</a>'}).addTo(map);
   const m=glLayer.getMaplibreMap();let styled=0,shown=0;
   const lab=()=>{try{if(m.isStyleLoaded()){styled=1;applyMapLang()}}catch(x){}};
   const show=()=>{if(shown)return;shown=1;glOK=1;lab();if(rasterLayer&&map.hasLayer(rasterLayer))map.removeLayer(rasterLayer);syncDark()};
   m.on("styledata",lab);m.on("load",show);m.on("idle",show);
   /* only give up if the style itself never arrives; a slow phone keeps the layer */
   setTimeout(()=>{if(!styled&&!shown&&glLayer){try{map.removeLayer(glLayer)}catch(x){}glLayer=null;rasterOn()}},40000)
  }catch(e){glLayer=null;rasterOn()}})}))}

// ===== TIPS =====
const showTips=()=>$("#tList").innerHTML=tips.map(t=>`<div class="card"><div class="cb"><b>${esc(t.name||"(no name)")}</b><div class="ko">${esc(t.area)} · ${esc(t.dish)}</div><p style="margin:8px 0 0">${esc(t.note)}</p></div></div>`).join("");
$("#tSave").onclick=()=>{if(!$("#tName").value.trim()){$("#tMsg").textContent=T("Please enter a restaurant name.");return}
 tips.unshift({name:$("#tName").value,area:$("#tArea").value,dish:$("#tDish").value,note:$("#tNote").value});$("#tMsg").textContent=save("jk_tips",tips)?T("Saved on this phone."):T("Could not save in this browser.");showTips()};
$("#tShare").onclick=()=>shareText(`Jakorchi tip\nName: ${$("#tName").value}\nWhere: ${$("#tArea").value}\nMust-try: ${$("#tDish").value}\nTip: ${$("#tNote").value}`,$("#tMsg"));

// ===== Languages =====
/* texts per language live in /lang/<code>.json; only the chosen language is downloaded.
   /lang/foods.json holds the food names of every language, so people can search a food in any language. */
const I18N={},langDone=new Set();
async function loadLang(l){if(l==="en"||langDone.has(l))return;try{const r=await fetch(`/lang/${l}.json?v=${BUILD}`);if(r.ok){I18N[l]=Object.assign(I18N[l]||{},await r.json());langDone.add(l);if(cuisAll.m)cuisAll.m={}}}catch(e){}}
async function loadFoods(){try{const r=await fetch(`/lang/foods.json?v=${BUILD}`);if(!r.ok)return;const j=await r.json();for(const l in j)I18N[l]=Object.assign({},j[l],I18N[l]||{});if(cuisAll.m)cuisAll.m={}}catch(e){}}
const LANGS=[["en","English"],["nl","Nederlands"],["de","Deutsch"],["fr","Français"],["es","Español"],["zh","中文"],["ja","日本語"],["ko","한국어"],["ar","العربية"]];
const guessLang=()=>{const n=(navigator.language||"en").slice(0,2).toLowerCase();return LANGS.some(x=>x[0]===n)?n:"en"};
let lang=load("jk_lang",null);if(!LANGS.some(x=>x[0]===lang))lang=guessLang();
function T(k,...a){let s=(I18N[lang]||{})[k]||k;a.forEach((v,i)=>{s=s.replace("{"+i+"}",v)});return s}
const nmOf=t=>{const o={};["nl","de","fr","es","ja","ko","ar","ru","th","vi","id","ms","tr","hi","fa","pt","it"].forEach(l=>{if(t["name:"+l])o[l]=t["name:"+l]});const z=t["name:zh"]||t["name:zh-Hans"]||t["name:zh-CN"];if(z)o.zh=z;return o};
const scriptOf=s=>/[\uAC00-\uD7A3]/.test(s)?"ko":/[\u3040-\u30ff]/.test(s)?"ja":/[\u4e00-\u9fff]/.test(s)?"han":/[A-Za-z]/.test(s)?"lat":"";
const BRANDS=[["starbucks|스타벅스|スターバックス|星巴克",{en:"Starbucks",ko:"스타벅스",ja:"スターバックス",zh:"星巴克"}],
 ["mcdonald|맥도날드|マクドナルド|麦当劳|麥當勞",{en:"McDonald's",ko:"맥도날드",ja:"マクドナルド",zh:"麦当劳"}],
 ["\\bkfc\\b|켄터키|ケンタッキー|肯德基",{en:"KFC",ko:"KFC",ja:"ケンタッキー",zh:"肯德基"}],
 ["burger king|버거킹|バーガーキング|汉堡王",{en:"Burger King",ko:"버거킹",ja:"バーガーキング",zh:"汉堡王"}],
 ["lotteria|롯데리아|ロッテリア",{en:"Lotteria",ko:"롯데리아",ja:"ロッテリア"}],
 ["subway|서브웨이|サブウェイ|赛百味",{en:"Subway",ko:"서브웨이",ja:"サブウェイ",zh:"赛百味"}],
 ["domino|도미노|ドミノ|达美乐",{en:"Domino's Pizza",ko:"도미노피자",ja:"ドミノ・ピザ",zh:"达美乐"}],
 ["pizza hut|피자헛|ピザハット|必胜客",{en:"Pizza Hut",ko:"피자헛",ja:"ピザハット",zh:"必胜客"}],
 ["paris baguette|파리바게|パリバゲット|巴黎贝甜",{en:"Paris Baguette",ko:"파리바게뜨",ja:"パリバゲット",zh:"巴黎贝甜"}],
 ["tous les jours|뚜레쥬르",{en:"Tous Les Jours",ko:"뚜레쥬르"}],
 ["baskin|배스킨|サーティワン",{en:"Baskin-Robbins",ko:"배스킨라빈스",ja:"サーティワン"}],
 ["dunkin|던킨|ダンキン|唐恩都乐",{en:"Dunkin'",ko:"던킨",ja:"ダンキン",zh:"唐恩都乐"}],
 ["mos burger|モスバーガー|모스버거|摩斯汉堡",{en:"MOS Burger",ko:"모스버거",ja:"モスバーガー",zh:"摩斯汉堡"}],
 ["yoshinoya|요시노야|吉野家",{en:"Yoshinoya",ko:"요시노야",ja:"吉野家",zh:"吉野家"}],
 ["sukiya|스키야|すき家|食其家",{en:"Sukiya",ko:"스키야",ja:"すき家",zh:"食其家"}],
 ["matsuya|마쓰야|松屋",{en:"Matsuya",ko:"마쓰야",ja:"松屋",zh:"松屋"}],
 ["saizeriya|사이제리야|サイゼリヤ|萨莉亚",{en:"Saizeriya",ko:"사이제리야",ja:"サイゼリヤ",zh:"萨莉亚"}],
 ["haidilao|하이디라오|海底捞|海底撈",{en:"Haidilao",ko:"하이디라오",ja:"海底撈",zh:"海底捞"}],
 ["ichiran|이치란|一蘭|一兰",{en:"Ichiran",ko:"이치란",ja:"一蘭",zh:"一兰"}],
 ["kura sushi|쿠라스시|くら寿司|藏寿司",{en:"Kura Sushi",ko:"쿠라스시",ja:"くら寿司",zh:"藏寿司"}],
 ["sushiro|스시로|スシロー|寿司郎",{en:"Sushiro",ko:"스시로",ja:"スシロー",zh:"寿司郎"}],
 ["luckin|루이싱|瑞幸",{en:"Luckin Coffee",ko:"루이싱커피",zh:"瑞幸咖啡"}],
 ["twosome|투썸",{en:"A Twosome Place",ko:"투썸플레이스"}],["ediya|이디야",{en:"Ediya Coffee",ko:"이디야커피"}],
 ["mega ?coffee|메가커피|메가mgc",{en:"Mega Coffee",ko:"메가MGC커피"}],["compose coffee|컴포즈",{en:"Compose Coffee",ko:"컴포즈커피"}],
 ["kyochon|교촌",{en:"Kyochon Chicken",ko:"교촌치킨"}],["bbq ?chicken|비비큐",{en:"BBQ Chicken",ko:"BBQ치킨"}]
].map(a=>[new RegExp(a[0],"i"),a[1]]);
const brandOf=r=>{const t=srcText(r)+" "+r.name;for(const [re,b] of BRANDS)if(re.test(t))return b;return null};
function dname(r){/* the name shown in the app language (never a made-up spelling) */
 if(lang==="en"){if(r.loc)return r.name;const b=brandOf(r);return(b&&b.en)||r.name}
 const o=r.nm&&r.nm[lang];if(o)return o;
 const orig=r.loc||r.name,sc=scriptOf(orig);
 if(lang==="ko"&&sc==="ko")return orig;
 if(lang==="ja"&&(sc==="ja"||sc==="han"))return orig;
 if(lang==="zh"&&sc==="han")return orig;
 const b=brandOf(r),bl=b&&b[lang==="ko"||lang==="ja"||lang==="zh"?lang:"en"];if(bl)return bl;
 return r.name}
const cuis=c=>{if(!c)return c;const d=I18N[lang];return(d&&d["c:"+String(c).toLowerCase()])||T(c)};
function applyLang(){document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";
 document.querySelectorAll("[data-i]").forEach(e=>{e.textContent=(e.dataset.pre||"")+T(e.dataset.i)});
 document.querySelectorAll("[data-ip]").forEach(e=>{e.placeholder=T(e.dataset.ip)});
 document.querySelectorAll("[data-ia]").forEach(e=>e.setAttribute("aria-label",T(e.dataset.ia)));
 drawAbout()}
async function setLang(l){await loadLang(l);lang=l;save("jk_lang",l);applyLang();renderChips();fillOpts();
 if(map){Object.keys(markers).forEach(id=>{map.removeLayer(markers[id]);delete markers[id]})}
 applyMapLang();render(false);if(sheetId!==null){drawSheet()}if(curView==="lists")drawLists()}


// ===== SAVED PLACES AND OWN LISTS (kept on this phone only) =====
const LD=[["rest",si("plate"),"Restaurants"],["cafe",si("cup"),"Cafés & bakeries"],["try",si("bookmark"),"Want to try"],["been",si("check"),"Been there"]],MAXLISTS=20,MAXSAVE=500;
let ulists=load("jk_lists",null);if(!Array.isArray(ulists))ulists=[];
ulists=ulists.filter(l=>l&&/^[a-z0-9]{1,24}$/.test(l.id)&&Array.isArray(l.ids)).map(l=>{const d=LD.find(x=>x[0]===l.id);return{id:l.id,ic:d?d[1]:si("pin"),d:d?d[2]:undefined,n:String(l.n||"").slice(0,30),ids:l.ids.filter(i=>typeof i==="string").slice(0,MAXSAVE)}});
LD.forEach(([id,ic,d],i)=>{if(!ulists.some(l=>l.id===id))ulists.splice(i,0,{id,ic,d,n:"",ids:[]})});
const FAVL={id:"fav",ic:si("heart"),d:"Favorites",get ids(){return favs}};
const allLists=()=>[FAVL,...ulists],lname=l=>l.d?T(l.d):l.n;
const savedAny=id=>allLists().some(l=>l.ids.includes(id)),savedOther=id=>ulists.some(l=>l.ids.includes(id)),savedCount=()=>new Set(allLists().flatMap(l=>l.ids)).size;
function persist(){/* keeps a copy of every saved place (it may not be loaded on the map later) and drops copies nobody saved any more */
 const keep=new Set(allLists().flatMap(l=>l.ids));Object.keys(favObj).forEach(id=>{if(!keep.has(id))delete favObj[id]});
 const ok=save("jk_favs",favs)&save("jk_lists",ulists)&save("jk_favobj",favObj);if(!ok)flash(T("Could not save. Your phone storage may be full."))}
function addTo(l,id){if(!savedAny(id)&&savedCount()>=MAXSAVE){flash(T("You can save up to {0} places.",MAXSAVE));return false}
 l.ids.push(id);const p=place(id);if(p&&p.src==="osm")favObj[id]=p;return true}
function toggleIn(lid,id){const l=allLists().find(x=>x.id===lid);if(!l)return false;const i=l.ids.indexOf(id);
 if(i>-1)l.ids.splice(i,1);else if(!addTo(l,id))return false;persist();return true}
function newList(name,pid){name=String(name||"").trim().slice(0,30);if(!name)return null;
 if(ulists.filter(l=>!l.d).length>=MAXLISTS){flash(T("You can make up to {0} lists.",MAXLISTS));return null}
 const l={id:"u"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ic:si("pin"),n:name,ids:[]};ulists.push(l);if(pid)addTo(l,pid);persist();return l}
function ensureModal(){let m=document.getElementById("rvModal");
 if(!m){m=document.createElement("div");m.id="rvModal";document.body.appendChild(m);
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-rvclose]")){closeRv();return}onAct(e)});
  m.addEventListener("change",async e=>{const f=e.target.closest&&e.target.closest("[data-phfile]");if(!f)return;
   const files=[...f.files].slice(0,3-rvPh.length),msg=m.querySelector("[data-m]");f.value="";
   for(const file of files){if(rvPh.length>=3)break;if(msg)msg.textContent=T("Preparing photo…");
    try{const b=await shrinkImg(file);rvPh.push({b,u:URL.createObjectURL(b)});if(msg)msg.textContent=""}catch(err){if(msg)msg.textContent=T("This photo could not be used. Try a JPEG or PNG picture.")}}
   drawThumbs()})}
 return m}
const saveRows=id=>allLists().map(l=>{const on=l.ids.includes(id);return`<button class="lrow${on?" on":""}" data-lt="${l.id}" data-pid="${esc(id)}" aria-pressed="${on}"><span class="lic">${l.ic}</span><span class="lnm">${esc(lname(l))}</span><span class="lck" aria-hidden="true">${on?"✓":"+"}</span></button>`}).join("");
function openSave(id){const r=place(id);if(!r)return;const m=ensureModal();
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(T("Save to a list"))}</h3><p class="hint" style="margin:0 0 10px">${esc(dname(r))}</p><div class="lrows" id="lRows">${saveRows(id)}</div>
 <div class="lnew"><input data-lname maxlength="30" placeholder="${esc(T("New list name"))}" aria-label="${esc(T("New list name"))}"><button class="btn fill" data-lnew="${esc(id)}">${esc(T("Create"))}</button></div><p class="hint" data-m style="margin:8px 0 0">${esc(T("Lists are kept on this phone only."))}</p></div>`;
 m.classList.add("on")}
function openName(mode,lid){const m=ensureModal(),l=lid&&ulists.find(x=>x.id===lid);
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(T(mode==="new"?"New list":"Rename list"))}</h3><input data-lname maxlength="30" value="${esc(l?l.n:"")}" placeholder="${esc(T("New list name"))}" aria-label="${esc(T("New list name"))}"><div class="btns" style="margin-top:12px"><button class="btn fill" data-lok="${mode==="new"?"new":"ren:"+esc(lid)}">${esc(T(mode==="new"?"Create":"Save"))}</button></div><p class="hint" data-m style="margin:8px 0 0"></p></div>`;
 m.classList.add("on");setTimeout(()=>{const i=m.querySelector("[data-lname]");if(i)i.focus()},60)}
function listText(l){return`${T("My Jakorchi list")}: ${lname(l)}\n`+l.ids.map(id=>place(id)).filter(Boolean).map((r,i)=>{const n=dname(r),ln=localName(r),pl=T(r.city||"");
 return`${i+1}. ${n}${ln&&ln!==n?" – "+ln:""}${pl?" ("+pl+")":""}\n   ${links(r).rev[0].h}`}).join("\n")}
function drawLists(){const L=allLists();if(!L.some(l=>l.id===curList))curList="fav";const l=L.find(x=>x.id===curList),custom=!l.d&&l.id!=="fav";
 $("#lChips").innerHTML=L.map(x=>`<button class="${x.id===curList?"on":""}" data-lsel="${x.id}">${x.ic} ${esc(lname(x))} <b>${x.ids.length}</b></button>`).join("")+`<button data-lmake>＋ ${esc(T("New list"))}</button>`;
 const items=l.ids.slice().reverse().map(id=>place(id)).filter(Boolean);
 $("#lHead").innerHTML=`<b>${l.ic} ${esc(lname(l))} · ${items.length}</b>`+(items.length?`<button class="btn" data-lmap>${si("map")} ${esc(T("Show this list on the map"))}</button><button class="btn" data-lshare>${si("share")} ${esc(T("Share list"))}</button>`:"")+(custom?`<button class="btn" data-lren>${si("edit")} ${esc(T("Rename"))}</button><button class="btn" data-ldel>${si("trash")} ${esc(T("Delete list"))}</button>`:"")+`<p class="hint" data-m style="flex:1 1 100%;margin:0"></p>`;
 $("#lBody").innerHTML=items.length?items.slice(0,lShown).map(r=>`<div class="lwrap">${card(r).replace(' id="c_',' id="lc_')}<div class="lact"><button class="rbtn" data-lrm="${l.id}" data-pid="${esc(r.id)}">✕ ${esc(T("Remove from this list"))}</button></div></div>`).join("")+(items.length>lShown?`<button class="btn more2" data-lmore>${esc(T("Show 30 more"))}</button>`:""):`<p class="empty">${esc(T("Nothing here yet. Tap the heart or the bookmark on a place to save it."))}</p>`;
 wantMeta(items.slice(0,lShown).map(r=>r.id))}
function listChipShow(l){const b=$("#listChip");b.innerHTML=si("bookmark")+" "+esc(lname(l))+" ✕";b.style.display="";b.setAttribute("aria-label",T("Remove this filter")+": "+lname(l))}
function listChipHide(){listF=null;$("#listChip").style.display="none"}
$("#listChip").onclick=()=>{listChipHide();rr()};
$("#lists").addEventListener("click",onAct);
document.addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(b)goTab(b.dataset.goto)});

// ===== SIDE MENU (upper left) =====
let curView="explore",curList="fav",lShown=30,listF=null;
const drawer=$("#drawer"),scrim=$("#scrim");
function renderDrawer(){const cv=curView,ico=p=>`<svg class="i" viewBox="0 0 24 24">${p}</svg>`;
 const it=(a,ic,lab,extra,on)=>`<button class="dr-i${on?" on":""}" ${a}><span class="dr-ic">${ic}</span><span class="dr-l">${lab}</span>${extra||""}</button>`;
 $("#drNav").innerHTML=it('data-dsoon="1"',ico('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),esc(T("Sign in")),"",false)
  +it('data-v="explore"',ico('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),esc(T("Explore")),"",cv==="explore")
  +it('data-dasia="1"',si("globe"),esc(T("All Asia")),"",false)
  +it('data-dcity="1"',ico('<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>'),esc(T("Find a city")),"",false)
  +`<div class="dr-s">${esc(T("My places"))}</div>`
  +allLists().map(l=>it(`data-dl="${l.id}"`,l.ic,esc(lname(l)),`<em>${l.ids.length}</em>`,cv==="lists"&&curList===l.id)).join("")
  +it('data-dnew="1"',"＋",esc(T("New list")),"",false)
  +`<div class="dr-s">${esc(T("More"))}</div>`
  +it('data-dadd="1"',ico('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><path d="M12 7v6M9 10h6"/>'),esc(T("Add a restaurant")),"",false)
  +(isStandalone()?"":it('data-dinst="1"',ico('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>'),esc(T("Install the app")),"",false))
  +(edCode?it('data-ded="1"',ico('<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),esc(T("Editor mode")),"<em>✓</em>",false):"")
  +it('data-v="tip"',ico('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),esc(T("Add a tip")),"",cv==="tip")
  +it('data-v="phrases"',ico('<path d="M4 5h16v11H9l-5 4z"/>'),esc(T("Useful phrases")),"",cv==="phrases")
  +it('data-v="settings"',ico(IC.gear),esc(T("Settings")),"",cv==="settings")
  +it('data-v="about"',ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),esc(T("About & privacy")),"",cv==="about");
 $("#drLang").innerHTML=LANGS.map(x=>`<button data-dlang="${x[0]}" class="${x[0]===lang?"on":""}">${x[1]}</button>`).join("");
 $("#drMap").innerHTML=[["auto",T("Same as app")],["latin","Latin (A–Z)"],["ar","العربية"]].map(x=>`<button data-dml="${x[0]}" class="${x[0]===mapLet?"on":""}">${esc(x[1])}</button>`).join("");
 $("#drUnits").innerHTML=[["km","km · m"],["mi","mi · ft"]].map(x=>`<button data-dunit="${x[0]}" class="${x[0]===units?"on":""}">${x[1]}</button>`).join("");if(typeof drMore==="function")drMore()}
let drLast=null;
function openDrawer(){renderDrawer();drLast=document.activeElement;drawer.classList.add("on");scrim.classList.add("on");drawer.setAttribute("aria-hidden","false");$("#menuBtn").setAttribute("aria-expanded","true");
 setTimeout(()=>{const f=drawer.querySelector(".dr-i.on")||drawer.querySelector(".dr-i");if(f)f.focus()},80)}
function closeDrawer(back){if(!drawer.classList.contains("on"))return;drawer.classList.remove("on");scrim.classList.remove("on");drawer.setAttribute("aria-hidden","true");$("#menuBtn").setAttribute("aria-expanded","false");
 if(back!==false&&drLast&&drLast.focus)drLast.focus()}
$("#menuBtn").onclick=()=>drawer.classList.contains("on")?closeDrawer():openDrawer();$("#sbMenu").onclick=()=>$("#menuBtn").click();
scrim.onclick=()=>closeDrawer();
const drClick=e=>{const b=e.target.closest("button");if(!b)return;
 if(b.id==="drX"){closeDrawer();return}
 if(b.dataset.v){goTab(b.dataset.v)}
 else if(b.dataset.dl){curList=b.dataset.dl;lShown=30;goTab("lists")}
 else if(b.hasAttribute("data-dnew")){closeDrawer(false);openName("new")}
 else if(b.hasAttribute("data-dasia")){goTab("explore");allAsia()}
 else if(b.hasAttribute("data-dadd")){goTab("explore");startAdd()}
 else if(b.hasAttribute("data-ded")){closeDrawer(false);openEd()}
 else if(b.hasAttribute("data-dinst")){closeDrawer(false);installApp()}
 else if(b.hasAttribute("data-dcity")){goTab("explore");showFilters();setTimeout(()=>$("#cityQ").focus(),250)}
 else if(b.dataset.dlang){setLang(b.dataset.dlang);renderDrawer()}
 else if(b.dataset.dunit){units=b.dataset.dunit==="mi"?"mi":"km";save("jk_units",units);renderDrawer();render(false);if(sheetId)drawSheet()}
 else if(b.dataset.dml){mapLet=b.dataset.dml;save("jk_maplet",mapLet);applyLang();applyMapLang();renderDrawer()}};
drawer.addEventListener("click",drClick);$("#settings").addEventListener("click",drClick);
(()=>{let x0=null,y0=0;drawer.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
 drawer.addEventListener("touchend",e=>{if(x0==null)return;const t=e.changedTouches[0];if(t.clientX-x0<-60&&Math.abs(t.clientY-y0)<50)closeDrawer();x0=null},{passive:true})})();
addEventListener("keydown",e=>{
 if(e.key==="Escape"){if(drawer.classList.contains("on")){closeDrawer();return}const m=document.getElementById("rvModal");if(m&&m.classList.contains("on")){closeRv();return}}
 if(e.key==="Tab"&&drawer.classList.contains("on")){const f=[...drawer.querySelectorAll("button")];if(!f.length)return;const a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});

// ===== FOOD TYPE (chosen from a fixed list by visitors; the answers decide automatically) =====
const FT=[["korean","korean"],["japanese","japanese"],["chinese","chinese"],["ramen","ramen"],["udon","udon"],["soba","soba"],["sushi","sushi"],["tonkatsu","tonkatsu (fried cutlet)"],["tempura","tempura"],["izakaya","izakaya"],["yakitori","yakitori"],["bbq","grilled meat (bbq)"],["chicken","chicken"],["soup","korean soup & stew"],["noodles","noodles"],["dumplings","dumplings"],["hotpot","hot pot"],["seafood","seafood"],["curry","curry"],["kebab","kebab"],["indian","indian"],["thai","thai"],["vietnamese","vietnamese"],["italian","italian"],["pizza","pizza"],["burger","burger"],["mexican","mexican"],["american","american"],["steak","steak"],["salad","salad"],["ricebowl","rice bowl"],["lunchbox","lunch boxes (dosirak / bento)"],["street","street snacks"],["bakery","bakery"],["coffee","coffee shop"],["bubbletea","tea / bubble tea"],["dessert","dessert"],["icecream","ice cream"]],FTL=Object.fromEntries(FT);
const foodVotes=id=>{const f=flags[id]||{},o=[];for(const k in f)if(k.startsWith("food:")&&FTL[k.slice(5)]&&f[k].y>0)o.push([k.slice(5),f[k].y]);return o.sort((a,b)=>b[1]-a[1])};
function foodApply(r){/* 2+ visitors that agree (and at least twice as many as the runner-up) replace an empty or guessed food type. A type listed on OpenStreetMap is never replaced. */
 if(!r.c0)r.c0={cuisine:r.cuisine,cu0:r.cu0||0,cg:r.cg||0};
 const v=foodVotes(r.id),t=v[0],s=v[1]?v[1][1]:0,win=t&&t[1]>=2&&t[1]>=2*s&&(r.c0.cu0||r.c0.cg),was=r.cuisine+"|"+(r.fvn||0);
 if(win){r.cuisine=FTL[t[0]];r.cu0=0;r.cg=0;r.fvn=t[1]}else{r.cuisine=r.c0.cuisine;r.cu0=r.c0.cu0;r.cg=r.c0.cg;r.fvn=0}
 return was!==r.cuisine+"|"+(r.fvn||0)}
function foodTags(r){const v=foodVotes(r.id);if(!v.length||r.fvn)return"";const [s,n]=v[0],lab=cuis(FTL[s]);
 if(r.cu0||r.cg)return`<span class="pill mut">${si("chat")} ${esc(T("Visitors suggest:"))} ${esc(lab)} ×${n}</span>`;
 if(FTL[s]!==r.cuisine&&n>=3&&n>=2*(v[1]?v[1][1]:0))return`<span class="pill warnp">${si("warn")} ${esc(T("Visitors say:"))} ${esc(lab)} ×${n}</span>`;return""}

// ===== REVIEW PHOTOS (shrunk on the phone, public, reported photos disappear automatically) =====
const PHRE=/^[a-z0-9_]{1,60}\/[a-z0-9-]{8,40}\.(jpg|webp)$/,PUB=SB.url+"/storage/v1/object/public/review-photos/",phHidden=new Set(load("jk_phrep",[]));
let rvPh=[];
async function shrinkImg(file){/* any photo -> JPEG of at most ~380 KB; drawing it again also removes camera data such as the location */
 if(!file||file.size>30e6||(file.type&&!/^image\//.test(file.type)))throw 0;
 let bmp;try{bmp=await createImageBitmap(file)}catch(e){bmp=await new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(file);i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=()=>{URL.revokeObjectURL(u);no()};i.src=u})}
 const W=bmp.width||bmp.naturalWidth,H=bmp.height||bmp.naturalHeight;if(!W||!H)throw 0;
 for(const [mx,q] of [[1280,.78],[1100,.7],[900,.65],[720,.55],[560,.5],[420,.45]]){
  const k=Math.min(1,mx/Math.max(W,H)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(W*k));c.height=Math.max(1,Math.round(H*k));
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);
  const b=await new Promise(r=>c.toBlob(r,"image/jpeg",q));if(b&&b.size<=380000){if(bmp.close)bmp.close();return b}}
 throw 0}
const rndHex=n=>{const a=new Uint8Array(n);(crypto.getRandomValues?crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.random()*256));return[...a].map(b=>b.toString(16).padStart(2,"0")).join("")};
async function sbUpload(pid,blob){const slug=String(pid).toLowerCase().replace(/[^a-z0-9_]/g,"_").slice(0,60)||"x",path=`${slug}/${crypto.randomUUID?crypto.randomUUID():rndHex(16)}.jpg`;
 if(!PHRE.test(path))return null;
 try{const h={apikey:SB.key,"Content-Type":"image/jpeg","x-upsert":"false"};if(SB.key.startsWith("eyJ"))h.Authorization="Bearer "+SB.key;
  const r=await fetch(`${SB.url}/storage/v1/object/review-photos/${path}`,{method:"POST",headers:h,body:blob});return r.ok?path:null}catch(e){return null}}
function drawThumbs(){const m=document.getElementById("rvModal"),b=m&&m.querySelector("[data-thumbs]");if(!b)return;
 b.innerHTML=rvPh.map((p,i)=>`<div class="thumb"><img src="${p.u}" alt="${esc(T("Photo"))}"><button type="button" data-phdel="${i}" aria-label="${esc(T("Remove photo"))}">✕</button></div>`).join("");
 const add=m.querySelector("[data-phpick]");if(add)add.style.display=rvPh.length>=3?"none":""}
const phs=a=>{const l=(Array.isArray(a)?a:[]).filter(p=>typeof p==="string"&&PHRE.test(p)&&!phHidden.has(p)).slice(0,3);
 return l.length?`<div class="rph">${l.map(p=>`<button class="pth" data-ph="${p}" aria-label="${esc(T("Photo"))}"><img loading="lazy" decoding="async" src="${PUB+p}" alt=""></button>`).join("")}</div>`:""};
function openPhoto(p){if(!PHRE.test(p))return;const m=ensureModal();
 m.innerHTML=`<div class="rvbox card lb"><button class="rvx" data-rvclose aria-label="Close">✕</button><img src="${PUB+p}" alt="${esc(T("Photo"))}"><div class="btns"><button class="rbtn" data-phrep="${p}">${si("flag")} ${esc(T("Report this photo"))}</button></div><p class="hint" data-m style="margin:4px 0 0">${esc(T("Photos reported by 2 people are hidden automatically."))}</p></div>`;m.classList.add("on")}
// ===== SEARCH SUGGESTIONS: food types, restaurants (loaded data) + places (Photon, free OpenStreetMap search) =====
let sgItems=[],sgSeq=0,sgT=null;
function sgHide(){const b=$("#sugg");if(b){b.hidden=true;b.innerHTML=""}sgItems=[];clearTimeout(sgT);sgSeq++}
function sgDraw(){const b=$("#sugg");if(!b)return;if(!sgItems.length){b.hidden=true;b.innerHTML="";return}
 b.innerHTML=sgItems.map((x,i)=>`<button type="button" data-sg="${i}"><span class="sgi">${x.ic}</span><span class="sgt"><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:""}</span></button>`).join("");b.hidden=false}
function sgLocal(q){const ql=q.toLowerCase(),out=[],c=map?map.getCenter():{lat:36,lng:128},ar=new Map(),hits=[];
 for(const r of osm){
  const n=dname(r);if((n&&n.toLowerCase().includes(ql))||(r.loc&&r.loc.includes(q)))hits.push([(r.lat-c.lat)**2+(r.lng-c.lng)**2,r])}
 if(hits.length<3){const qf=fold(q).split(" ").filter(Boolean),qr=raw(q).split(" ").filter(Boolean);if(qf.length)for(const r of osm){if(hits.length>=60)break;if(!hits.some(h=>h[1]===r)&&fuzzyHit(r,qf,qf.length===qr.length?qr:null))hits.push([(r.lat-c.lat)**2+(r.lng-c.lng)**2,r])}}
 [...new Set(FOODS.map(f=>f[1]))].filter(l=>cuisAll(l).toLowerCase().includes(ql)).slice(0,2).forEach(l=>out.push({k:"q",ic:si("utensils"),t:cuis(l),s:T("Food type"),v:cuis(l)}));
 hits.sort((a,b)=>a[0]-b[0]).slice(0,5).forEach(([d,r])=>out.push({k:"r",ic:si("plate"),t:dname(r),s:[r.cu0?"":cuis(r.cuisine),T(r.city||"")].filter(Boolean).join(" · "),v:r.id}));
 return out}
function sgUpdate(){const q=$("#q").value.trim();clearTimeout(sgT);if(q.length<2){sgHide();return}
 sgItems=sgLocal(q);sgDraw();const my=++sgSeq;
 sgT=setTimeout(async()=>{try{const c=map?map.getCenter():null,pl={en:"en",de:"de",fr:"fr",nl:"en",es:"en"}[lang]||"default";
  const r=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=4&lang=${pl}&bbox=73,18,146,54&osm_tag=place${c&&map.getZoom()>=6?`&lat=${c.lat.toFixed(3)}&lon=${c.lng.toFixed(3)}`:""}`);
  if(!r.ok||my!==sgSeq)return;const j=await r.json();if(my!==sgSeq)return;
  const pls=(j&&Array.isArray(j.features)?j.features:[]).filter(f=>f&&f.geometry&&Array.isArray(f.geometry.coordinates)&&f.properties&&f.properties.name).slice(0,3).map(f=>{const p=f.properties,ex=Array.isArray(p.extent)&&p.extent.length===4?p.extent.map(Number):null;
   return{k:"p",ic:si("map"),t:String(p.name).slice(0,80),s:[p.city,p.state,p.country].filter(x=>x&&x!==p.name).join(", ").slice(0,120),v:{la:+f.geometry.coordinates[1],lo:+f.geometry.coordinates[0],ex:ex&&ex.every(isFinite)?ex:null}}}).filter(x=>isFinite(x.v.la)&&isFinite(x.v.lo));
  if(pls.length&&$("#q")===document.activeElement){sgItems=pls.concat(sgItems.filter(x=>x.k!=="p")).slice(0,10);sgDraw()}}catch(e){}},350)}
function sgPick(i){const x=sgItems[i],qi=$("#q");if(!x)return;sgHide();
 if(x.k==="q"){qi.value=x.v;shown=30;render(true);qi.blur();return}
 qi.value="";shown=30;render(false);qi.blur();showMap();if(!map)return;
 if(x.k==="r"){const r=place(x.v);if(r){map.setView([r.lat,r.lng],Math.max(map.getZoom(),16));openSheet(r.id)}return}
 const v=x.v;if(v.ex){const b=L.latLngBounds([v.ex[3],v.ex[0]],[v.ex[1],v.ex[2]]),z=map.getBoundsZoom(b);map.setView(b.getCenter(),Math.min(16,Math.max(13,isFinite(z)?z:15)))}else map.setView([v.la,v.lo],15)}

// ===== NEW PLACES (3 phones confirm), MENU PHOTOS, RESTAURANT INFO =====
const npMine=new Set(load("jk_npmine",[])),npVoted=new Set(load("jk_npvoted",[])),oiRep=new Set(load("jk_oirep",[])),extra={},NPCATS=["restaurant","coffee","dessert","drinks","fast"];
let npBox=null,npAt=0,edCode=String(load("jk_ed","")||"");
function npSoon(){clearTimeout(npSoon.t);npSoon.t=setTimeout(()=>npLoad(),700)}
async function npLoad(force){if(!sbOn()||!map||map.getZoom()<13)return;const b=map.getBounds(),s=b.getSouth(),n=b.getNorth(),w=b.getWest(),e=b.getEast();
 if(!force&&npBox&&s>=npBox[0]&&n<=npBox[1]&&w>=npBox[2]&&e<=npBox[3]&&Date.now()-npAt<300000)return;
 const ps=(n-s)/2,pw=(e-w)/2,bx=[s-ps,n+ps,w-pw,e+pw];
 try{const r=await fetch(`${SB.url}/rest/v1/new_places_public?select=id,name,lat,lng,cat,cuisine,yes,no,halal,vegan,vegetarian,photo,verified&lat=gte.${bx[0].toFixed(5)}&lat=lte.${bx[1].toFixed(5)}&lng=gte.${bx[2].toFixed(5)}&lng=lte.${bx[3].toFixed(5)}&order=id.desc&limit=500`,{headers:sbH()});if(!r.ok)return;
  const rows=await r.json(),ix=new Map(osm.filter(o=>o.nw).map(o=>[o.id,o]));npBox=bx;npAt=Date.now();let ch=false;
  for(const x of Array.isArray(rows)?rows:[]){if(!x||!Number.isInteger(x.id)||!isFinite(x.lat)||!isFinite(x.lng))continue;
   const id="np_"+x.id,y=x.yes|0,no=x.no|0,tv=x.verified===true,st=tv||(y>=3&&y>no)?"ok":"wait",old=ix.get(id);
   if(old){if(old.nws!==st||old.npy!==y||old.npn!==no){old.nws=st;old.npy=y;old.npn=no;ch=true}continue}
   const pl=fromPoi([id,String(x.name||"").slice(0,80),"",NPCATS.includes(x.cat)?x.cat:"restaurant",/^[a-z &\/()-]{0,40}$/.test(x.cuisine||"")?x.cuisine:"",+x.lat,+x.lng,x.halal===true?1:0,x.vegan===true?1:0,"","","","","",x.vegetarian===true?1:0,"",0,""]);
   if(!pl)continue;pl.nw=1;pl.nws=st;pl.npy=y;pl.npn=no;pl.nph=typeof x.photo==="string"&&PHRE.test(x.photo)?x.photo:"";pl.npv=tv;osm.push(pl);ch=true}
  if(ch){render(false);if(sheetId&&String(sheetId).startsWith("np_"))drawSheet()}}catch(err){}}
async function npVote(pid,v){const n=Number(String(pid).slice(3));if(!Number.isInteger(n)||!["yes","no"].includes(v))return 0;
 try{const r=await fetch(`${SB.url}/rest/v1/new_place_votes`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({place_id:n,verdict:v,device:dev})});return r.ok?1:r.status===409?2:0}catch(e){return 0}}
async function sbExtra(id,force){if(!sbOn()||!/^[A-Za-z0-9_]{1,60}$/.test(id))return;const x=extra[id];if(!force&&x&&Date.now()-x.at<300000)return;
 try{const u=SB.url+"/rest/v1/",q=encodeURIComponent(id),[a,b]=await Promise.all([fetch(`${u}menu_photos_public?place_id=eq.${q}&select=id,path&order=created_at.desc&limit=12`,{headers:sbH()}),fetch(`${u}owner_info_public?place_id=eq.${q}&select=id,phone,note&limit=1`,{headers:sbH()})]);
  if(!a.ok||!b.ok)return;const ma=await a.json(),ob=await b.json(),o0=Array.isArray(ob)&&ob[0];
  extra[id]={at:Date.now(),menu:Array.isArray(ma)?ma.filter(m=>m&&typeof m.path==="string"&&PHRE.test(m.path)):[],oi:o0&&Number.isInteger(o0.id)?{id:o0.id,phone:typeof o0.phone==="string"?o0.phone:"",note:typeof o0.note==="string"?o0.note.slice(0,300):""}:null};
  if(sheetId===id)drawSheet()}catch(e){}}
function xsec(r){const xd=extra[r.id]||{},voted=npVoted.has(r.id);let h="";
 if(r.nw&&r.nph&&!phHidden.has(r.nph))h+=`<div class="xsec"><b>${si("camera")} ${esc(T("Photo of the outside"))}</b><div class="rph"><button class="pth" data-ph="${r.nph}" aria-label="${esc(T("Photo"))}"><img loading="lazy" decoding="async" src="${PUB+r.nph}" alt=""></button></div></div>`;
 if(r.nw&&r.nws!=="ok")h+=npMine.has(r.id)?`<div class="xsec"><p class="hint" style="margin:0">${esc(T("You added this place. It shows for everyone after {0} more confirmations.").replace("{0}",Math.max(1,3-(r.npy||1))))}</p></div>`
  :`<div class="xsec"><b>${esc(T("Is this place really here?"))}</b><div class="btns" style="margin-top:6px"><button class="btn" data-npv="yes" data-np="${r.id}"${voted?" disabled":""}>✓ ${esc(T("Yes, it's here"))}</button><button class="btn" data-npv="no" data-np="${r.id}"${voted?" disabled":""}>✗ ${esc(T("No, it's not here"))}</button></div><p class="hint" data-npm style="margin:6px 0 0">${voted?esc(T("Thanks for checking!")):""}</p></div>`;
 const oi=xd.oi&&!oiRep.has(xd.oi.id)?xd.oi:null,tel=oi&&/^[+0-9 ()\-]{5,30}$/.test(oi.phone)?`<div><a href="tel:${esc(oi.phone.replace(/[^+0-9]/g,""))}">${si("phone")} ${esc(oi.phone)}</a></div>`:"";
 if(oi)h+=`<div class="xsec"><b>${si("store")} ${esc(T("From the restaurant"))}</b> <small class="mut">(${esc(T("not checked"))})</small>${tel}${oi.note?`<div style="white-space:pre-line">${esc(oi.note)}</div>`:""}<button class="rbtn" data-oirep="${oi.id}">${si("flag")} ${esc(T("Report wrong info"))}</button> <span class="hint" data-oim></span></div>`;
 const mn=(xd.menu||[]).filter(m=>!phHidden.has(m.path));
 h+=`<div class="xsec"><b>${si("plate")} ${esc(T("Menu photos"))}</b>${mn.length?`<div class="rph mn">${mn.map(m=>`<button class="pth" data-ph="${m.path}" aria-label="${esc(T("Photo"))}"><img loading="lazy" decoding="async" src="${PUB+m.path}" alt=""></button>`).join("")}</div>`:`<p class="hint" style="margin:4px 0">${esc(T("No menu photos yet."))}</p>`}
  <div class="btns"><button class="rbtn" data-mnpick="${r.id}">${si("camera")} ${esc(T("Add a menu photo"))}</button><button class="rbtn" data-oiadd="${r.id}">${si("store")} ${esc(T("Is this your restaurant?"))}</button></div><input type="file" accept="image/*" hidden data-mnfile="${r.id}"><p class="hint" data-mnm style="margin:4px 0 0">${esc(T("Menu photos are public. Only photos of the menu, no people."))}</p></div>`;
 return h}
document.addEventListener("change",async e=>{const f=e.target.closest&&e.target.closest("[data-mnfile]");if(!f||!f.files||!f.files[0])return;
 const pid=f.getAttribute("data-mnfile"),file=f.files[0],box=f.closest(".xsec"),m2=box&&box.querySelector("[data-mnm]"),say=x=>{if(m2)m2.textContent=x};f.value="";
 if(!/^[A-Za-z0-9_]{1,60}$/.test(pid))return;say(T("Uploading photos…"));
 try{const b=await shrinkImg(file),path=await sbUpload(pid,b);if(!path){say(T("Photo upload failed. Please try again."));return}
  const r=await fetch(`${SB.url}/rest/v1/menu_photos`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({place_id:pid,path,device:dev})});
  if(!r.ok){say(T("Could not send. Please try again."));return}flash(T("Menu photo added. Thank you!"));sbExtra(pid,true)}catch(err){say(T("Photo upload failed. Please try again."))}});
function openOi(id){const r=place(id);if(!r)return;const m=ensureModal();
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(dname(r))}</h3><p class="hint">${esc(T("Shown to everyone as “from the restaurant, not checked”. Visitors can report wrong information."))}</p>
  <label class="l">${esc(T("Phone number"))}</label><input data-oiph inputmode="tel" maxlength="30" placeholder="+82 2 1234 5678">
  <label class="l">${esc(T("Note for visitors"))}</label><textarea data-oino rows="3" maxlength="300" placeholder="${esc(T("For example: English menu, halal certified, closed on Mondays"))}"></textarea>
  <label class="chk"><input type="checkbox" data-oiok> ${esc(T("I own or work at this restaurant"))}</label>
  <div class="btns"><button class="btn fill" data-oisave="${r.id}">${esc(T("Send"))}</button></div><p class="hint" data-m style="margin:8px 0 0"></p></div>`;
 m.classList.add("on")}
let instEv=null;addEventListener("beforeinstallprompt",e=>{e.preventDefault();instEv=e});
function isStandalone(){return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
function installApp(){if(instEv){instEv.prompt();instEv=null;return}
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1),m=ensureModal();
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(T("Install the app"))}</h3><p>${esc(T(ios?"On iPhone or iPad: tap the Share button, then “Add to Home Screen”.":"Open your browser menu and choose “Install app” or “Add to Home screen”."))}</p></div>`;m.classList.add("on")}
if("serviceWorker" in navigator&&location.protocol==="https:")addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
function edAdd(bx,nm,c){return fetch(`${SB.url}/rest/v1/rpc/editor_add_place`,{method:"POST",headers:sbH(),body:JSON.stringify({code:edCode,p_name:nm,p_lat:+c.lat.toFixed(6),p_lng:+c.lng.toFixed(6),p_cat:bx.querySelector("[data-adc]").value,p_cuisine:bx.querySelector("[data-adf]").value,p_halal:bx.querySelector("[data-adh]").checked,p_vegan:bx.querySelector("[data-adv]").checked,p_vegetarian:bx.querySelector("[data-adg]").checked,p_photo:bx._ph?bx._ph.path:null})})}
async function edCheck(c){try{const r=await fetch(`${SB.url}/rest/v1/rpc/editor_check`,{method:"POST",headers:sbH(),body:JSON.stringify({code:c})});return r.ok&&(await r.json())===true}catch(e){return false}}
function openEd(){const m=ensureModal();
 m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><h3>${esc(T("Editor mode"))}</h3><p class="hint">${esc(T("Only for the Jakorchi team. New restaurants you add are shown to everyone right away."))}</p>
  ${edCode?`<p><b>✓ ${esc(T("Editor mode is on."))}</b></p><div class="btns"><button class="btn" data-edoff>${esc(T("Turn off"))}</button></div>`
  :`<label class="l">${esc(T("Editor code"))}</label><input type="password" data-edc autocomplete="current-password" maxlength="200"><div class="btns"><button class="btn fill" data-edon>${esc(T("Turn on"))}</button></div>`}<p class="hint" data-m style="margin:8px 0 0"></p></div>`;
 m.classList.add("on")}
function adThumb(bx){const th=bx.querySelector("[data-adthumb]"),pk=bx.querySelector("[data-adpick]");if(th)th.innerHTML=bx._ph?`<div class="thumb"><img src="${bx._ph.u}" alt="${esc(T("Photo"))}"><button type="button" data-adphdel aria-label="${esc(T("Remove photo"))}">✕</button></div>`:"";if(pk)pk.style.display=bx._ph?"none":""}
function startAdd(){if(!map||!sbOn())return;closeSheet();showMap();if(map.getZoom()<17)map.setView(map.getCenter(),17);
 let bx=document.getElementById("addBox");
 if(!bx){bx=document.createElement("div");bx.id="addBox";$("#stage").appendChild(bx);
  bx.addEventListener("change",async e=>{const f=e.target.closest&&e.target.closest("[data-adfile]");if(!f||!f.files||!f.files[0])return;const file=f.files[0],m2=bx.querySelector("[data-adm]");f.value="";
   try{const b=await shrinkImg(file);if(bx._ph)URL.revokeObjectURL(bx._ph.u);bx._ph={b,u:URL.createObjectURL(b)};adThumb(bx);m2.textContent=""}catch(err){m2.textContent=T("Photo upload failed. Please try again.")}});
  bx.addEventListener("click",async e=>{const t=e.target.closest("button");if(!t)return;
   if(t.hasAttribute("data-adcancel")){bx.classList.remove("on");document.body.classList.remove("adding");return}
   if(t.hasAttribute("data-adpick")){bx.querySelector("[data-adfile]").click();return}
   if(t.hasAttribute("data-adphdel")){if(bx._ph)URL.revokeObjectURL(bx._ph.u);bx._ph=null;adThumb(bx);return}
   if(!t.hasAttribute("data-adsave")||t.disabled)return;
   const m2=bx.querySelector("[data-adm]"),nm=bx.querySelector("[data-adn]").value.trim().slice(0,80),c=map.getCenter();
   if(!nm){m2.textContent=T("Please enter the name.");return}
   if(!bx._ph&&!edCode){m2.textContent=T("Please add a photo of the outside.");return}
   if(map.getZoom()<16){m2.textContent=T("Zoom in closer so the spot is exact.");return}
   if(c.lat<18||c.lat>54||c.lng<73||c.lng>146){m2.textContent=T("This place is outside Japan, Korea and China.");return}
   const low=nm.toLowerCase();if(osm.some(o=>Math.abs(o.lat-c.lat)<.0005&&Math.abs(o.lng-c.lng)<.0006&&km(o,c)<.04&&[o.name,o.loc].some(x=>x&&x.toLowerCase()===low))){m2.textContent=T("This place is already on the map.");return}
   t.disabled=true;m2.textContent=T("Uploading photos…");
   try{if(bx._ph&&!bx._ph.path)bx._ph.path=await sbUpload("newplace",bx._ph.b);if(bx._ph&&!bx._ph.path){t.disabled=false;m2.textContent=T("Photo upload failed. Please try again.");return}
    m2.textContent=T("Sending…");const r=edCode?await edAdd(bx,nm,c):await fetch(`${SB.url}/rest/v1/new_places?select=id`,{method:"POST",headers:{...sbH(),Prefer:"return=representation"},body:JSON.stringify({name:nm,lat:+c.lat.toFixed(6),lng:+c.lng.toFixed(6),cat:bx.querySelector("[data-adc]").value,cuisine:bx.querySelector("[data-adf]").value,halal:bx.querySelector("[data-adh]").checked,vegan:bx.querySelector("[data-adv]").checked,vegetarian:bx.querySelector("[data-adg]").checked,photo:bx._ph?bx._ph.path:null,device:dev})});
    t.disabled=false;if(!r.ok){m2.textContent=edCode&&r.status===400?T("Wrong code, or too many tries. Wait an hour and try again."):T("Could not send. Please try again.");return}
    const j=await r.json();if(Array.isArray(j)&&j[0]&&Number.isInteger(j[0].id)){npMine.add("np_"+j[0].id);save("jk_npmine",[...npMine].slice(-200))}
    if(bx._ph)URL.revokeObjectURL(bx._ph.u);bx._ph=null;bx.classList.remove("on");document.body.classList.remove("adding");flash(T("Sent. Thank you!")+" "+T("It shows for everyone after 2 other people confirm it."));npLoad(true)}catch(err){t.disabled=false;m2.textContent=T("Could not send. Please try again.")}})}
 const opts=FT.map(([sl,l])=>[l,cuis(l)]).sort((a,b)=>a[1].localeCompare(b[1],lang)).map(([l,lab])=>`<option value="${esc(l)}">${esc(lab)}</option>`).join("");
 bx.innerHTML=`<div class="addx" aria-hidden="true">+</div><div class="addp card"><b>${esc(T("Add a restaurant"))}</b><p class="hint" style="margin:4px 0 8px">${esc(T("Move the map so the + is on the entrance of the restaurant."))}</p>
  <input data-adn maxlength="80" placeholder="${esc(T("Restaurant name"))}" aria-label="${esc(T("Restaurant name"))}">
  <div class="adr"><select data-adc aria-label="${esc(T("Restaurants"))}">${CATS.slice(1).map(c=>`<option value="${c[0]}">${esc(T(c[1]))}</option>`).join("")}</select><select data-adf aria-label="${esc(T("Food type: I don't know"))}"><option value="">${esc(T("Food type: I don't know"))}</option>${opts}</select></div>
  <div class="adchk"><label class="chk"><input type="checkbox" data-adh> ${bsvg("halal",18)} ${esc(T("Halal"))}</label><label class="chk"><input type="checkbox" data-adv> ${bsvg("vegan",18)} ${esc(T("Vegan"))}</label><label class="chk"><input type="checkbox" data-adg> ${si("leaf")} ${esc(T("Vegetarian"))}</label></div>
  <div class="adph"><button type="button" class="rbtn" data-adpick>${si("camera")} ${esc(T(edCode?"Add a photo of the outside":"Add a photo of the outside (required)"))}</button><input type="file" accept="image/*" hidden data-adfile><div class="thumbs" data-adthumb></div></div>
  <div class="btns"><button class="btn fill" data-adsave>${esc(T("Add here"))}</button><button class="btn" data-adcancel>${esc(T("Cancel"))}</button></div><p class="hint" data-adm style="margin:6px 0 0">${esc(T("It shows for everyone after 2 other people confirm it."))}</p></div>`;
 if(bx._ph)URL.revokeObjectURL(bx._ph.u);bx._ph=null;bx.classList.add("on");document.body.classList.add("adding");setTimeout(()=>{const i=bx.querySelector("[data-adn]");if(i)i.focus()},300)}
async function sbPhotoReport(p){try{const r=await fetch(`${SB.url}/rest/v1/photo_reports`,{method:"POST",headers:{...sbH(),Prefer:"return=minimal"},body:JSON.stringify({path:p,device:dev})});return r.ok?1:r.status===409?2:0}catch(e){return 0}}
async function submitReview(t,m,id,rev){if(t.disabled)return;t.disabled=true;
 try{const paths=[];
  if(rvPh.length){m.textContent=T("Uploading photos…");for(const p of rvPh){if(!p.path)p.path=await sbUpload(id,p.b);if(!p.path){m.textContent=T("Photo upload failed. Try again or send without photos.");t.disabled=false;return}paths.push(p.path)}}
  m.textContent=T("Sending…");rev.photos=paths;const ok=await sbPost(id,rev);t.disabled=false;
  if(ok){flash(T("Review sent."));closeRv();wantMeta([id],true);sbReviews(id,true)}else m.textContent=T("Could not send your review. Please try again.")
 }catch(e){t.disabled=false;m.textContent=T("Could not send your review. Please try again.")}}

// ===== PHRASES =====
/* phrases load only when that page is opened (lang/phrases.json) */
let PH=null;const showPh=async l=>{document.querySelectorAll("#plang button").forEach(b=>b.classList.toggle("on",b.dataset.l===l));
 if(!PH){try{PH=await fetch("/lang/phrases.json?v="+BUILD).then(r=>r.json())}catch(e){PH=null;$("#phr").textContent=T("Could not load places right now. Tap “Search this area” to try again.").split(".")[0];return}}
 $("#phr").innerHTML=(PH[l]||[]).map(p=>`<div class="ph"><div class="k" lang="${l}">${p[0]}</div><div class="r">${p[1]}</div><div class="e">${p[2]}</div></div>`).join("")};
document.querySelectorAll("#plang button").forEach(b=>b.onclick=()=>showPh(b.dataset.l));
new MutationObserver(()=>{if($("#phrases").classList.contains("on")&&!$("#phr").children.length)showPh("ko")}).observe($("#phrases"),{attributes:true,attributeFilter:["class"]});

// Rows with chips can be dragged left/right with a mouse too (touch screens swipe as usual)
document.querySelectorAll(".chiprow,.countries,.quick").forEach(el=>{let d=0,x=0,s0=0,moved=false;
 el.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")return;d=1;x=e.clientX;s0=el.scrollLeft;moved=false});
 addEventListener("pointermove",e=>{if(!d)return;const dx=e.clientX-x;if(Math.abs(dx)>4)moved=true;el.scrollLeft=s0-dx});
 addEventListener("pointerup",()=>{d=0});
 el.addEventListener("click",e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true)});
/* ===== automatic update: compare this file's version with version.json on the server ===== */
let updWait=false;
function appBusy(){const a=document.activeElement;return document.body.classList.contains("sheet-on")||!!document.querySelector("#rvModal.on,.panel.open,.drawer.on")||!!(a&&/INPUT|TEXTAREA/.test(a.tagName)&&a.value)}
async function checkUpdate(){try{const r=await fetch("/version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const j=await r.json();if(!j||typeof j.v!=="string"||j.v===BUILD)return;
 try{const g=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(g)g.update().catch(()=>{})}catch(e){}
 let done="";try{done=sessionStorage.getItem("jk_upd")||""}catch(e){}if(done===j.v)return;
 if(appBusy()){if(!updWait){updWait=true;flash(T("A new version is ready. It loads the next time you open the app."))}return}
 try{sessionStorage.setItem("jk_upd",j.v)}catch(e){}location.reload()}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkUpdate()});
{const bn=document.getElementById("buildNo");if(bn)bn.onclick=()=>{let t="";try{const m=iosProbe(),st=document.getElementById("stage").getBoundingClientRect(),vv=window.visualViewport;
 t=` · screen ${screen.width}x${screen.height} · inner ${innerWidth}x${m.inner} · client ${m.client} · fixed ${m.fixedBottom} · map ${Math.round(st.top)}..${Math.round(st.bottom)} · vv ${vv?Math.round(vv.height):"-"} · gap ${iosGapP} · app ${navigator.standalone===true?1:0}`}catch(e){}
 bn.textContent=BUILD+t}}setTimeout(checkUpdate,3000);
document.querySelectorAll("link[data-font]").forEach(l=>{l.media="all"});
const SPL0=((performance.getEntriesByType("paint")||[]).find(e=>e.name==="first-contentful-paint")||(performance.getEntriesByType("navigation")||[])[0]||{}).startTime||0;
setTimeout(splashOff,Math.max(0,SPL0+2000-performance.now()));
applyLang();loadVector();loadGL();syncDark();
Promise.all([loadLang(lang),loadFoods()]).then(()=>{applyLang();applyMapLang();showTips();renderChips();fillOpts();render();setTimeout(()=>hintZoom(true),1500)});
try{navigator.permissions.query({name:"geolocation"}).then(p=>{if(p.state==="granted")locate()})}catch(e){}

/* editor mode is hidden from visitors: open the app with #editor at the end of the address */
if(location.hash==="#editor"){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}setTimeout(()=>{try{openEd()}catch(e){}},1500)}
