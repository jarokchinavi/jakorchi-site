/* Jakorchi extras: start screen, Start / Map / List switch, phone back button, extra settings. Loaded after app.js. */
(()=>{
const $$=s=>document.querySelector(s);

/* ---- phone back button: every open layer gets a history step; Back closes the top one instead of leaving the app ---- */
const LS=[];let skip=0,inPop=false;
function open(id,close){if(LS.some(l=>l.id===id))return;LS.push({id,close});try{history.pushState({jk:id},"")}catch(e){}}
function shut(id){const i=LS.findIndex(l=>l.id===id);if(i<0)return;LS.splice(i,1);if(inPop)return;skip++;try{history.back()}catch(e){skip--}}
addEventListener("popstate",()=>{if(skip>0){skip--;return}const l=LS.pop();if(!l)return;inPop=true;try{l.close()}catch(e){}inPop=false});
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
function drawCities(){const c=$$("#hmCities");if(!c)return;c.innerHTML=CITIES.filter(x=>["Tokyo","Kyoto","Osaka","Seoul","Busan","Shanghai"].includes(x[0])).map(x=>`<button type="button" data-hcity="${x[0]}">${FLAG[x[1]]||""}<span>${esc(T(x[0]))}</span></button>`).join("")}
$$("#home").addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;
 if(t.hasAttribute("data-hgo")){goTab("explore");showMap();if(map)setTimeout(()=>map.invalidateSize(),60)}
 else if(t.hasAttribute("data-hauth")){const s=$$("#hmSoon");s.hidden=false;s.classList.remove("pop");void s.offsetWidth;s.classList.add("pop")}
 else if(t.dataset.hcity){const c=CITIES.find(x=>x[0]===t.dataset.hcity);goTab("explore");showMap();if(map&&c)setTimeout(()=>{map.invalidateSize();openCity(c)},80)}});
new MutationObserver(()=>{const on=$$("#home").classList.contains("on");document.body.classList.toggle("hmv",on);if(on)drawCities()}).observe($$("#home"),{attributes:true,attributeFilter:["class"]});
/* shown once, on the first visit (not when someone opens a shared link) */
try{if(!localStorage.getItem("jk_home")&&!location.search&&!location.hash){localStorage.setItem("jk_home","1");setTimeout(()=>goTab("home"),0)}}catch(e){}

/* ---- extra settings in the menu ---- */
window.drMore=()=>{const t=$$("#drTr");if(t)t.innerHTML=[["walk",T("Walk")],["transit",T("Transit")],["car",T("Car")]].map(x=>`<button type="button" data-dtr="${x[0]}" class="${x[0]===trMode?"on":""}">${esc(x[1])}</button>`).join("")};
$$("#drawer").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.dtr){trMode=b.dataset.dtr;save("jk_tr",trMode);drMore();if(sheetId)drawSheet()}
 else if(b.id==="cacheBtn"){const l=b.querySelector(".dr-l");
  if(!b.dataset.arm){b.dataset.arm="1";l.textContent=T("Tap again to clear. Favorites and lists stay.");setTimeout(()=>{delete b.dataset.arm;l.textContent=T("Clear saved map data")},4000);return}
  l.textContent=T("Cleared. Reloading…");
  (async()=>{try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(e){}
   try{Object.keys(localStorage).filter(k=>/^jk_(c_|style)/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}
   setTimeout(()=>location.reload(),600)})()}});
drMore();segSync();
})();
