const fs=require("fs");
const gen=fs.readFileSync("gugudan/gugudan-gen.js","utf8").replace(/"use strict";/,"");
const h=fs.readFileSync("gugudan/index.html","utf8");
const m=h.match(/<script>\n("use strict";[\s\S]*?)<\/script>/);
if(!m) throw new Error("inline script not found");
const src=gen+"\n"+m[1].replace(/"use strict";/,"");

// ---- DOM 스텁 ----
function stubEl(){
  return {
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    style:{}, dataset:{}, innerHTML:"", textContent:"", value:"", checked:false,
    addEventListener(){}, appendChild(){}, remove(){},
    querySelector(){return null;}, closest(){return null;}, offsetWidth:0
  };
}
global.document={
  getElementById:()=>stubEl(),
  createElement:()=>stubEl(),
  querySelectorAll:()=>[]
};
global.window={addEventListener(){}, speechSynthesis:{cancel(){}}};
global.location={hash:"", pathname:"/gugudan/"};
global.history={replaceState(){}};
global.showToast=()=>{}; global.track=()=>{}; global.speakKo=()=>{};
global.koVoiceMissing=()=>false; global.copyShareLink=()=>{}; global.wireDeepLinks=()=>{};
global.b64e=s=>Buffer.from(unescape(encodeURIComponent(s)),"binary").toString("base64");
global.b64d=s=>decodeURIComponent(escape(Buffer.from(s,"base64").toString("binary")));

eval(src);
let fail=0;
function ok(name,cond){ console.log((cond?"✅":"❌")+" "+name); if(!cond)fail++; }

// ---- buildQuestions ----
let q=buildQuestions([2,5],0,"seq");
ok("2·5단 전부 = 18문제, 2×1 시작 5×9 끝",
   q.length===18 && q[0].a===2 && q[0].b===1 && q[17].a===5 && q[17].b===9);
ok("7단 10문제 요청 → 풀 9개로 캡", buildQuestions([7],10,"seq").length===9);
q=buildQuestions([2,3,4,5,6,7,8,9],20,"mix");
ok("전체 20문제 + 정답 검산", q.length===20 && q.every(x=>x.ans===x.a*x.b));
q=buildQuestions([2,3,4,5,6,7,8,9],0,"mix");
ok("전체 섞기 72문제, 중복 없음", q.length===72 && new Set(q.map(x=>x.a+"x"+x.b)).size===72);

// ---- grade ----
const g=grade([{a:6,b:3,ans:18,ok:false},{a:6,b:7,ans:42,ok:false},{a:7,b:2,ans:14,ok:false},{a:2,b:2,ans:4,ok:true}]);
ok("채점 1/4, 약한 단 6·7", g.score===1 && g.total===4 && g.wrongDans.join(",")==="6,7" && g.wrong.length===3);
ok("만점 처리", grade([{a:2,b:1,ans:2,ok:true}]).wrong.length===0);

// ---- buildChoices (사지선다) ----
{
  let allOk=true, plausible=0, tot=0;
  let seed=42; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x80000000; };
  for(let a=2;a<=9;a++)for(let b=1;b<=9;b++){
    const q={a:a,b:b,ans:a*b};
    for(let t=0;t<3;t++){
      const ch=buildChoices(q,rnd);
      tot++;
      if(ch.length!==4 || new Set(ch).size!==4 || !ch.includes(q.ans) || ch.some(v=>v<=0)) allOk=false;
      // 오답이 그럴듯한 후보군(옆문제·옆단·±묶음·±1)에서 나왔는지
      const near=new Set([q.a*(q.b+1),q.a*(q.b-1),(q.a+1)*q.b,(q.a-1)*q.b,q.ans+q.a,q.ans-q.a,q.ans+1,q.ans-1]);
      if(ch.filter(v=>v!==q.ans).every(v=>near.has(v)||v>q.ans)) plausible++;
    }
  }
  ok("사지선다: 72문제×3회 전부 4개·중복없음·정답포함·양수", allOk);
  ok("사지선다: 오답 후보군 검증 "+plausible+"/"+tot, plausible===tot);
}

// ---- share 라운드트립 ----
state.dans=[3,6]; state.count=20; state.order="seq"; state.mode="type"; state.think=8; state.voice=false;
const enc=encodeState();
state={dans:[2],count:10,order:"mix",mode:"speak",think:5,voice:true};
location.hash="#s="+encodeURIComponent(enc);
ok("라운드트립", loadFromHash() && state.dans.join("")==="36" && state.count===20 &&
   state.order==="seq" && state.mode==="type" && state.think===8 && state.voice===false);

// ---- 고르기 모드 공유 라운드트립 ----
state={dans:[7],count:20,order:"seq",mode:"choice",think:5,voice:true};
location.hash="#s="+encodeURIComponent(encodeState());
state={dans:[2],count:10,order:"mix",mode:"speak",think:5,voice:true};
ok("고르기 모드 라운드트립", loadFromHash() && state.mode==="choice" && state.dans.join("")==="7");
location.hash="#s="+encodeURIComponent(b64e(JSON.stringify([1,"25",10,"mix","이상한값",5,1])));
ok("모르는 답방식 → speak 폴백", loadFromHash() && state.mode==="speak");

// ---- common.js 랜딩 딥링크 페이로드 → 도구 해석 ----
location.hash="#s="+encodeURIComponent(b64e(JSON.stringify([1,"25",10,"mix","speak",5,1])));
ok("랜딩 딥링크(교과서① 2·5단)", loadFromHash() && state.dans.join("")==="25");

// ---- 방어 ----
location.hash="#s="+encodeURIComponent(b64e(JSON.stringify([1,"225019",10,"mix","speak",5,1])));
loadFromHash();
ok("중복·범위 밖 단 걸러냄 (225019→2,5,9)", state.dans.join("")==="259");
location.hash="#s="+encodeURIComponent(b64e(JSON.stringify(["가나","char","f-gowun","mid",3,2,1,1,"","mid"])));
ok("타 도구 해시 무시", loadFromHash()===false);
location.hash="#s=%%%broken";
ok("깨진 해시 무시", loadFromHash()===false);

console.log(fail? "🔴 "+fail+"건 실패":"🟢 전체 통과");


// ---- 조사 은/는 ----
const j=[1,2,3,4,5,6,7,8,9].map(b=>askText({a:7,b:b}));
console.log(j.join(" | "));
const expect={1:"은",2:"는",3:"은",4:"는",5:"는",6:"은",7:"은",8:"은",9:"는"};
const jok=[1,2,3,4,5,6,7,8,9].every(b=>askText({a:7,b:b}).endsWith(b+expect[b]+"?"));
console.log((jok?"✅":"❌")+" 은/는 조사 9케이스");
process.exit(jok&&!fail?0:1);
