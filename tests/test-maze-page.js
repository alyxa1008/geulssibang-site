const fs=require("fs");
eval(fs.readFileSync("maze/maze-gen.js","utf8").replace(/"use strict";/,""));

const h=fs.readFileSync("maze/index.html","utf8");
const m=h.match(/<script>\n("use strict";[\s\S]*?)<\/script>\n<\/body>/);
if(!m) throw new Error("inline script not found");
const src=m[1].replace(/"use strict";/,"");

/* ---- DOM 스텁 ---- */
function stubEl(){
  return {
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    style:{}, dataset:{}, _html:"", textContent:"", value:"", checked:false, placeholder:"",
    set innerHTML(v){ this._html=v; }, get innerHTML(){ return this._html; },
    addEventListener(){}, appendChild(){}, remove(){},
    querySelector(){return null;}, closest(){return null;}
  };
}
const ids={};
global.document={
  getElementById:id=>(ids[id]=ids[id]||stubEl()),
  createElement:()=>stubEl(),
  createTextNode:t=>({text:t}),
  querySelectorAll:()=>[]
};
global.window={addEventListener(){}};
global.location={hash:"", pathname:"/maze/"};
global.history={replaceState(){}};
global.el=(tag,cls)=>stubEl();
global.fitScale=()=>{};
global.showToast=()=>{}; global.track=()=>{}; global.copyShareLink=()=>{}; global.svgToPNG=()=>{};
global.b64e=s=>Buffer.from(unescape(encodeURIComponent(s)),"binary").toString("base64");
global.b64d=s=>decodeURIComponent(escape(Buffer.from(s,"base64").toString("binary")));

eval(src);
let fail=0;
function ok(name,cond){ console.log((cond?"✅":"❌")+" "+name); if(!cond)fail++; }

/* ---- 모든 레벨×모양 조합 렌더 (예외 없이, SVG 정상) ---- */
let combos=0, bad=[];
["kids"].concat(["easy","mid","hard"].flatMap(l=>["rect","circle","heart","star"].map(s=>l+":"+s)))
.forEach(key=>{
  const [l,s]=key.includes(":")?key.split(":"):[key,"rect"];
  state.level=l; state.shape=s; state.pages=2; state.answers=true; state.seed=777;
  try{
    const g=makeGrid(), open=carve(g,state.seed);
    const svg1=drawSVG(g,open,false), svg2=drawSVG(g,open,true);
    const good=[svg1,svg2].every(v=>v.startsWith("<svg")&&v.endsWith("</svg>")&&!v.includes("NaN")&&!v.includes("undefined"));
    render();
    if(good) combos++; else bad.push(key);
  }catch(e){ bad.push(key+" EX:"+e.message); }
});
ok("13개 조합(유아 + 3난이도×4모양) 렌더 정상", combos===13 && !bad.length);
if(bad.length) console.log("  실패:", bad.join(", "));

/* ---- 유아 SVG에 테마 아이콘 ---- */
state.level="kids"; state.theme="puppy";
{
  const g=makeGrid(), open=carve(g,1);
  const svg=drawSVG(g,open,false);
  ok("유아 강아지 테마 아이콘 포함", svg.includes("🐶")&&svg.includes("🦴"));
}

/* ---- autoTitle ---- */
state.level="kids"; state.theme="bee";
ok("유아 자동 제목", autoTitle()==="꿀벌이 꽃을 찾아가요");
state.level="mid"; state.shape="circle";
ok("원형 자동 제목", autoTitle()==="원형 미로 — 보통");
state.shape="rect";
ok("네모 자동 제목 (기존과 동일)", autoTitle()==="미로 찾기 — 보통");

/* ---- 공유 라운드트립 (신형 7칸) ---- */
state={level:"kids",shape:"star",theme:"car",pages:3,answers:false,title:"우리집",seed:12345};
const enc=encodeState();
state={level:"mid",shape:"rect",theme:"rabbit",pages:1,answers:true,title:"",seed:1};
location.hash="#s="+encodeURIComponent(enc);
ok("신형 링크 라운드트립", loadFromHash() && state.level==="kids" && state.shape==="star" &&
   state.theme==="car" && state.pages===3 && state.answers===false && state.title==="우리집" && state.seed===12345);

/* ---- 구형 5칸 링크 호환 ---- */
location.hash="#s="+encodeURIComponent(b64e(JSON.stringify(["hard",2,1,"옛날 미로",5555])));
ok("구형 링크 → 네모/토끼 기본값", loadFromHash() && state.level==="hard" && state.shape==="rect" &&
   state.theme==="rabbit" && state.seed===5555 && state.pages===2);

/* ---- 깨진 해시 ---- */
location.hash="#s=%%%broken";
ok("깨진 해시 무시", loadFromHash()===false);
location.hash="#s="+encodeURIComponent(b64e(JSON.stringify(["없는레벨",1,1,"",7,"없는모양","없는테마"])));
ok("모르는 값 → 기본값 폴백", loadFromHash()===true && state.level==="mid" && state.shape==="rect" && state.theme==="rabbit");

console.log(fail? "🔴 "+fail+"건 실패" : "🟢 전체 통과");
process.exit(fail?1:0);
