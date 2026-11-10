/* Jakorchi extras: start screen, Start / Map / List switch, phone back button, extra settings. Loaded after app.js. */
(()=>{
const $$=s=>document.querySelector(s);

/* ---- phone back button: every open layer gets a history step; Back closes the top one instead of leaving the app ---- */
/* one extra history step while anything is open; Back closes the top layer, the app itself never closes by accident */
const LS=[];let skip=0,inPop=false,guard=false;
const push=()=>{if(LS.length&&!guard){guard=true;try{history.pushState({jk:1},"")}catch(e){guard=false}}};
function open(id,close){if(LS.some(l=>l.id===id))return;LS.push({id,close});push()}
function shut(id){const i=LS.findIndex(l=>l.id===id);if(i<0)return;LS.splice(i,1);if(inPop)return;
 setTimeout(()=>{if(!LS.length&&guard){guard=false;skip++;try{history.back()}catch(e){skip--}}},0)}
addEventListener("popstate",()=>{if(skip>0){skip--;return}guard=false;const l=LS.pop();if(l){inPop=true;try{l.close()}catch(e){}inPop=false}push()});
const watch=(el,cls,id,close)=>{if(!el)return;new MutationObserver(()=>{el.classList.contains(cls)?open(id,close):shut(id);segSync()}).observe(el,{attributes:true,attributeFilter:["class"]})};
watch($$("#drawer"),"on","drawer",()=>closeDrawer());
watch($$("#listPanel"),"open","list",()=>showMap());
watch($$("#fpanel"),"open","filters",()=>showMap());
watch($$("#sheet"),"open","sheet",()=>closeSheet());
new MutationObserver(()=>{const x=$$("#explore").classList.contains("on");x?shut("view"):open("view",()=>goTab("explore"));segSync()}).observe($$("#explore"),{attributes:true,attributeFilter:["class"]});
const em=ensureModal;ensureModal=function(){const m=em.apply(this,arguments);if(m&&!m._jk){m._jk=1;new MutationObserver(()=>m.classList.contains("on")?open("modal",closeRv):shut("modal")).observe(m,{attributes:true,attributeFilter:["class"]})}return m};

/* ---- bottom switch: Start · Map · List ---- */
function segSync(){const s=$$("#seg");if(!s)return;const v=curView,lp=$$("#listPanel").classList.contains("open"),fp=$$("#fpanel").classList.contains("open");
 s.hidden=!(v==="explore"||v==="home")||(v==="explore"&&fp);const a=v==="home"?"home":lp?"list":"map";
 s.querySelectorAll("button").forEach(b=>b.classList.toggle("on",(b.dataset.seg||"list")===a))}
window.segSync=segSync;
$$("#seg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.seg==="home"){goTab("home");return}
 if(curView!=="explore")goTab("explore");
 if(b.dataset.seg==="map")showMap();
 if(map)setTimeout(()=>map.invalidateSize(),60);segSync()});

/* ---- start screen ---- */
$$("#home").addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;
 if(t.hasAttribute("data-hgo")){goTab("explore");showMap();if(map)setTimeout(()=>map.invalidateSize(),60)}
 else if(t.hasAttribute("data-hauth"))soon()});
new MutationObserver(()=>{const on=$$("#home").classList.contains("on");document.body.classList.toggle("hmv",on);document.documentElement.classList.toggle("hmv",on)}).observe($$("#home"),{attributes:true,attributeFilter:["class"]});
/* sign in / sign up: no empty page, a small "coming soon" popup instead (nothing is sent) */
function soon(){const m=ensureModal();m.innerHTML=`<div class="rvbox card"><button class="rvx" data-rvclose aria-label="Close">✕</button><div class="soonm">${si("user")}<h3>${esc(T("Sign in"))}</h3><span class="soon n">${esc(T("Coming soon"))}</span><p>${esc(T("Account sync is still being built."))}</p><button class="btn fill" type="button" data-rvclose>${esc(T("Got it"))}</button></div></div>`;m.classList.add("on")}
window.soon=soon;

if(!location.search&&!location.hash)setTimeout(()=>goTab("home"),0);/* every cold start opens the start screen */

/* ---- settings page (and the menu's Sign in item) ---- */
const TH=()=>{const t=load("jk_theme","auto");return/^(auto|light|dark)$/.test(t)?t:"auto"};
function applyTheme(t){const r=document.documentElement;if(t==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",t);try{if(vlayer)loadVector()}catch(e){}setTimeout(syncDark,0)}
if(TH()!=="auto")applyTheme(TH());try{matchMedia("(prefers-color-scheme:dark)").addEventListener("change",()=>{if(TH()==="auto")applyTheme("auto")})}catch(e){}
window.drMore=()=>{const t=$$("#drTr");if(t)t.innerHTML=[["walk",T("Walk")],["transit",T("Transit")],["car",T("Car")]].map(x=>`<button type="button" data-dtr="${x[0]}" class="${x[0]===trMode?"on":""}">${esc(x[1])}</button>`).join("");
 const th=[["light",T("Light"),"sunr"],["dark",T("Dark"),"moon"],["auto",T("System"),"sun"]],s=$$("#stTheme"),hs=$$("#hmTheme");
 if(s)s.innerHTML=th.map(x=>`<button type="button" data-sth="${x[0]}" class="${x[0]===TH()?"on":""}">${esc(x[1])}</button>`).join("");
 if(hs)hs.innerHTML=th.map(x=>`<button type="button" data-sth="${x[0]}" class="${x[0]===TH()?"on":""}" aria-label="${esc(x[1])}" aria-pressed="${x[0]===TH()}">${si(x[2])}<span>${esc(x[1])}</span></button>`).join("")};
new MutationObserver(()=>{if($$("#settings").classList.contains("on"))renderDrawer()}).observe($$("#settings"),{attributes:true,attributeFilter:["class"]});
const more=e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.dsoon){closeDrawer(false);soon()}
 else if(b.dataset.sth){save("jk_theme",b.dataset.sth);applyTheme(b.dataset.sth);drMore()}
 else if(b.dataset.dtr){trMode=b.dataset.dtr;save("jk_tr",trMode);drMore();if(sheetId)drawSheet()}
 else if(b.id==="cacheTmp"){/* temporary lookups saved on this phone (city and search results) */
  try{Object.keys(localStorage).filter(k=>/^jk_c_/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}flash(T("Cache cleared."))}
 else if(b.id==="cacheBtn"){const l=b.querySelector(".dr-l");/* map data saved on this phone: restaurant squares and the map style */
  if(!b.dataset.arm){b.dataset.arm="1";l.textContent=T("Tap again to clear. Favorites and lists stay.");setTimeout(()=>{delete b.dataset.arm;l.textContent=T("Clear saved map data")},4000);return}
  delete b.dataset.arm;l.textContent=T("Clear saved map data");
  (async()=>{try{for(const k of await caches.keys()){const c=await caches.open(k);for(const r of await c.keys())if(new URL(r.url).pathname.startsWith("/places/"))await c.delete(r)}}catch(e){}
   try{localStorage.removeItem(STYLE_KEY)}catch(e){}flash(T("Saved map data cleared."))})()}};
$$("#drawer").addEventListener("click",more);$$("#settings").addEventListener("click",more);$$("#hmTheme").addEventListener("click",more);

/* ---- city search: suggestions while typing, small spelling mistakes are fine; Enter on an unknown place asks OpenStreetMap ---- */
const CT=[["Tokyo","Japan",35.6812,139.7671,"東京 tokio"],["Osaka","Japan",34.6937,135.5023,"大阪"],["Kyoto","Japan",35.0116,135.7681,"京都 kioto"],["Yokohama","Japan",35.4437,139.638,"横浜"],["Nagoya","Japan",35.1709,136.8815,"名古屋"],["Sapporo","Japan",43.0618,141.3545,"札幌"],["Fukuoka","Japan",33.5902,130.4017,"福岡 hakata"],["Kobe","Japan",34.6901,135.1955,"神戸"],["Hiroshima","Japan",34.3853,132.4553,"広島"],["Nara","Japan",34.6851,135.8048,"奈良"],["Sendai","Japan",38.2682,140.8694,"仙台"],["Kanazawa","Japan",36.5613,136.6562,"金沢"],["Naha","Japan",26.2124,127.6809,"那覇 okinawa"],["Hakone","Japan",35.2324,139.1069,"箱根"],["Nikko","Japan",36.7199,139.6982,"日光"],["Kamakura","Japan",35.3192,139.5467,"鎌倉"],["Takayama","Japan",36.1461,137.2522,"高山"],["Nagasaki","Japan",32.7503,129.8779,"長崎"],["Kumamoto","Japan",32.8032,130.7079,"熊本"],["Kagoshima","Japan",31.5966,130.5571,"鹿児島"],["Okayama","Japan",34.6551,133.9195,"岡山"],["Hakodate","Japan",41.7687,140.7288,"函館"],["Niigata","Japan",37.9161,139.0364,"新潟"],["Matsuyama","Japan",33.8392,132.7657,"松山"],
 ["Seoul","Korea",37.5665,126.978,"서울 soul"],["Busan","Korea",35.1796,129.0756,"부산 pusan"],["Incheon","Korea",37.4563,126.7052,"인천"],["Daegu","Korea",35.8714,128.6014,"대구 taegu"],["Daejeon","Korea",36.3504,127.3845,"대전 taejon"],["Gwangju","Korea",35.1595,126.8526,"광주 kwangju"],["Ulsan","Korea",35.5384,129.3114,"울산"],["Suwon","Korea",37.2636,127.0286,"수원"],["Jeju","Korea",33.4996,126.5312,"제주 cheju"],["Gyeongju","Korea",35.8562,129.2247,"경주 kyongju"],["Jeonju","Korea",35.8242,127.148,"전주 chonju"],["Sokcho","Korea",38.207,128.5918,"속초"],["Gangneung","Korea",37.7519,128.8761,"강릉 kangnung"],
 ["Beijing","China",39.9042,116.4074,"北京 peking"],["Shanghai","China",31.2304,121.4737,"上海"],["Chengdu","China",30.5728,104.0668,"成都"],["Guangzhou","China",23.1291,113.2644,"广州 canton"],["Shenzhen","China",22.5431,114.0579,"深圳"],["Xi'an","China",34.3416,108.9398,"西安 xian"],["Hangzhou","China",30.2741,120.1551,"杭州"],["Chongqing","China",29.563,106.5516,"重庆 chungking"],["Nanjing","China",32.0603,118.7969,"南京 nanking"],["Wuhan","China",30.5928,114.3055,"武汉"],["Suzhou","China",31.299,120.5853,"苏州"],["Kunming","China",25.0389,102.7183,"昆明"],["Guilin","China",25.2342,110.1799,"桂林"],["Qingdao","China",36.0671,120.3826,"青岛 tsingtao"],["Tianjin","China",39.3434,117.3616,"天津"],["Harbin","China",45.8038,126.535,"哈尔滨"],["Xiamen","China",24.4798,118.0894,"厦门 amoy"],["Hong Kong","China",22.3193,114.1694,"香港 hongkong"],["Macau","China",22.1987,113.5439,"澳门 macao"],["Lhasa","China",29.652,91.1721,"拉萨"],["Zhangjiajie","China",29.1171,110.4792,"张家界"]];
function cityHits(q){const f=fold(q),r=raw(q);if(f.length<2&&!/[^\x00-\x7f]/.test(q))return[];const out=[];
 for(const c of CT){const names=[c[0],T(c[0])].concat(c[4].split(" ")),ws=names.map(n=>fold(n)),rs=names.map(n=>raw(n));let s=9;
  if(ws.some(w=>w.startsWith(f))||rs.some(w=>w.startsWith(r)))s=0;else if(ws.some(w=>w.includes(f))||rs.some(w=>w.includes(r)))s=1;
  else{const m=f.length<5?1:2;if(ws.some(w=>near(w.slice(0,f.length),f,m)||near(w,f,m)))s=2}
  if(s<9)out.push([s,c])}
 return out.sort((a,b)=>a[0]-b[0]).slice(0,6).map(x=>x[1])}
const cq=$$("#cityQ"),cr=$$("#cityRes");let cityList=[];
cq.addEventListener("input",()=>{cityList=cityHits(cq.value.trim());cr.innerHTML=cityList.map(c=>`<button class="plain" type="button" data-cll="${c[2]},${c[3]}">${FLAG[c[1]]||si("pin")} ${esc(T(c[0]))} <small>${esc(c[4].split(" ")[0])}</small></button>`).join("")});
cr.addEventListener("click",e=>{if(e.target.closest("[data-cll]"))setTimeout(()=>{cq.value="";cr.innerHTML="";cityList=[];cq.blur()},0)});
cq.addEventListener("blur",()=>setTimeout(()=>{if(!cr.contains(document.activeElement)){cr.innerHTML="";cityList=[]}},250));
cq.addEventListener("keydown",e=>{if(e.key==="Enter"&&cityList.length){e.preventDefault();e.stopImmediatePropagation();cr.querySelector("[data-cll]").click()}},true);
/* filters open: the map underneath can't be zoomed or moved by accident */
new MutationObserver(()=>{if(!map)return;const on=$$("#fpanel").classList.contains("open");["touchZoom","dragging","scrollWheelZoom","doubleClickZoom","boxZoom","keyboard"].forEach(h=>{try{map[h][on?"disable":"enable"]()}catch(e){}})}).observe($$("#fpanel"),{attributes:true,attributeFilter:["class"]});
/* tap the stars: open the card fully and scroll to the reviews (no reviews yet: open "write a review") */
document.addEventListener("click",e=>{const b=e.target.closest("[data-gorev]");if(!b)return;const id=b.dataset.gorev;
 const go=()=>{const box=$$("#sbody"),t=box&&box.querySelector("[data-revs]");if(!t){openRv(id);return}setState("full");
  const to=()=>{const x=box.querySelector("[data-revs]");if(x)box.scrollTop=x.getBoundingClientRect().top-box.getBoundingClientRect().top+box.scrollTop-12};/* the card may have been redrawn */setTimeout(to,380);setTimeout(to,800)};
 e.stopPropagation();if(b.closest("#sheet"))go();else{goTab("explore");showOnMap(id);setTimeout(go,420)}},true);
drMore();segSync();
})();
