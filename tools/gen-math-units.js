/* 학기별 수학 단원 학습지 페이지 생성 — math/units.js(단일 원천)에서 허브(/math/unit/)와 학기 페이지(/math/unit/학기/)를 만든다.
   틀(머리·푸터)은 math/roadmap/index.html에서 가져온다. 실행: node tools/gen-math-units.js  (단원 데이터를 고치면 재실행 — tests/test-units.js가 대조) */
"use strict";
const fs=require("fs"), path=require("path");
const U=require("../tests/_util");
global.b64e=s=>Buffer.from(s,"utf8").toString("base64");
const M=require("../math/units.js");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const CIRC="①②③④⑤⑥⑦⑧";
const whenLabel=start=>{ const m=+start.slice(0,2), d=+start.slice(3); return m+"월 "+(d<=10?"초":d<=20?"중순":"하순")+"쯤"; };
const PUB="2026-10-04", PUB_KO="2026년 10월 4일";

function shell(depth){
  /* roadmap 페이지를 틀로: head·nav·header·footer를 쓰고 content만 바꾼다. depth 3이면 상대 경로 한 단계 더 */
  let h=U.read("math/roadmap/index.html");
  if(depth===3) h=h.replace(/\.\.\/\.\.\//g,"../../../");
  h=h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/g,"");
  return h;
}
function finish(h, o){
  const rep=(re,to)=>{ if(!re.test(h)) throw new Error("template marker missing: "+re); h=h.replace(re,()=>to); };
  rep(/<title>[\s\S]*?<\/title>/, "<title>"+esc(o.title)+" | 글씨방</title>");
  rep(/<meta name="description" content="[^"]*">/, '<meta name="description" content="'+esc(o.desc)+'">');
  rep(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="'+esc(o.ogTitle)+' | 글씨방">');
  rep(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="'+esc(o.ogDesc)+'">');
  rep(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="'+o.url+'">');
  rep(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="'+o.url+'">');
  const ld=[{"@context":"https://schema.org","@type":"Article","headline":o.title,"author":{"@type":"Organization","name":"글씨방"},"publisher":{"@type":"Organization","name":"글씨방"},"datePublished":PUB,"mainEntityOfPage":o.url,"inLanguage":"ko"}];
  if(o.faq) ld.push({"@context":"https://schema.org","@type":"FAQPage","mainEntity":o.faq.map(f=>({"@type":"Question","name":f[0],"acceptedAnswer":{"@type":"Answer","text":f[1]}}))});
  const style=`<style>
/* 단원 학습지 — 이 페이지 전용 */
.unit{margin:26px 0 4px; padding-top:18px; border-top:1px dashed rgba(243,239,228,.25)}
.unit h2 small{font-size:13px; color:var(--chalk-dim); margin-left:8px; font-weight:400}
.unit .pit{background:rgba(255,217,168,.08); border-left:3px solid #ffd9a8; padding:8px 12px; border-radius:0 8px 8px 0; margin:10px 0}
.unit .ubtns{display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 4px}
.unit .home{margin:8px 0 0; padding-left:1.2em}
.unit .home li{margin:3px 0}
.toc{display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 4px}
.toc a{font-size:13.5px; color:var(--chalk); border:1.5px solid rgba(243,239,228,.3); border-radius:20px; padding:6px 12px; text-decoration:none}
.semgrid{display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:12px; margin:10px 0}
.semcard{background:var(--paper); color:var(--ink); border-radius:12px; padding:14px 16px; box-shadow:0 8px 20px var(--paper-shadow); text-decoration:none; display:block}
.semcard b{font-family:var(--disp); font-size:17px; display:block; margin-bottom:4px}
.semcard span{font-size:13px; color:var(--ink-soft)}
.semcard.soon{opacity:.6}
</style>
`;
  rep(/<\/head>/, style+ld.map(x=>'<script type="application/ld+json">'+JSON.stringify(x)+'</script>').join("\n")+"\n</head>");
  rep(/<div class="logo">[\s\S]*?<\/div>/, '<div class="logo">'+o.logo+' <span class="pen">✚</span></div>');
  rep(/<h1 class="tagline">[\s\S]*?<\/h1>/, '<h1 class="tagline">'+esc(o.h1)+'</h1>');
  const a=h.indexOf('  <div class="content">'), b=h.indexOf('  <footer');
  if(a<0||b<0) throw new Error("content/footer marker missing");
  h=h.slice(0,a)+'  <div class="content">\n'+o.body+'  </div>\n\n'+h.slice(b);
  const tag=(h.match(/<script src="(\.\.\/)+assets\/common\.js"><\/script>\n/)||[])[0]; if(!tag) throw new Error("common.js tag missing");
  h=h.replace(tag, tag+'<script src="'+o.unitsSrc+'"></script>\n<script>\n'+o.script+'</script>\n');
  return h;
}
const unitNowScript=(grade)=>`"use strict";
/* 지금쯤 배우는 단원 표시 (math/units.js currentUnit) */
(function(){
  var box=document.getElementById("unitNow"); if(!box) return;
  renderUnitNow(box, {grade:${grade||"null"}, base:"${grade?"../../..":"../.."}", scrollTo:${grade?"true":"false"}});
})();
document.querySelector(".content").addEventListener("click",function(e){
  var a=e.target.closest(".unit a.gobtn[data-unit]"); if(!a) return;
  track("unit_to_tool",{unit:a.getAttribute("data-unit"), tool:a.getAttribute("data-tool")});
});
`;

function semesterPage(key){
  const S=M.MATH_UNITS[key], base="../../..";
  const names=S.units.map(u=>u.name);
  const title=S.name+" 수학 단원별 학습지 — "+names.slice(0,3).join("·")+(names.length>3?" 외":"");
  const desc=S.name+" 수학 "+S.units.length+"개 단원("+names.join(", ")+")마다 배우는 내용, 대략적인 시기, 집에서 자주 막히는 곳과 그 단원에 맞춘 무료 학습지를 정리했어요. 2022 개정 교육과정 교과서 기준, 회원가입 없음.";
  let b="";
  b+='    <p class="hint">글씨방 · '+PUB_KO+' 게시 · 2022 개정 교육과정 교과서 기준</p>\n';
  b+='    <p>'+S.name+'('+S.range+') 수학은 <strong>'+S.units.length+'개 단원</strong>이에요. 단원마다 무엇을 배우는지, 보통 몇 월쯤 나오는지, 집에서 아이들이 어디서 막히는지를 적고, 그 단원에 딱 맞게 설정된 학습지를 버튼 하나로 뽑을 수 있게 했습니다. 도구가 없는 단원은 억지로 끼우지 않고 집에서 할 수 있는 활동만 적었어요.</p>\n';
  b+='    <div class="unow" id="unitNow"></div>\n';
  b+='    <p class="hint">※ 단원 순서와 시기는 교과서 출판사·학교 진도에 따라 2주 안팎 차이가 납니다. 번호보다 단원 이름으로 찾아 주세요.</p>\n';
  b+='    <div class="toc">'+S.units.map((u,i)=>'<a href="#u'+u.no+'">'+CIRC[i]+' '+esc(u.name)+'</a>').join("")+'</div>\n';
  S.units.forEach((u,i)=>{
    const uid=key+"-"+u.no;
    b+='    <div class="unit" id="u'+u.no+'">\n';
    b+='      <h2>'+CIRC[i]+' '+esc(u.name)+' <small>'+whenLabel(u.start)+'</small></h2>\n';
    b+='      <p>'+esc(u.learn)+'</p>\n';
    b+='      <p class="pit"><strong>집에서 자주 막히는 곳</strong> — '+esc(u.pit)+'</p>\n';
    if(u.tools&&u.tools.length){
      b+='      <div class="ubtns">'+u.tools.map(t=>'<a class="gobtn" data-unit="'+uid+'" data-tool="'+t.kind+(t.topic?":"+t.topic:t.k?":"+t.k:"")+'" href="'+M.unitToolHref(t,base)+'">'+esc(t.label)+'</a>').join("")+'</div>\n';
    }
    if(u.home&&u.home.length){
      b+='      <p><strong>집에서 이렇게</strong></p>\n      <ul class="home">'+u.home.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>\n';
    }
    b+='    </div>\n';
  });
  const idx=M.SEMESTERS.indexOf(key), prev=M.SEMESTERS[idx-1], next=M.SEMESTERS[idx+1];
  b+='\n    <h2>다른 학기 · 함께 보면 좋은 페이지</h2>\n    <div class="guides">\n';
  if(prev) b+='      <a href="../'+prev+'/">◀ '+M.MATH_UNITS[prev].name+' 단원</a>\n';
  if(next) b+='      <a href="../'+next+'/">'+M.MATH_UNITS[next].name+' 단원 ▶</a>\n';
  b+='      <a href="../">📚 학기별 단원 학습지 전체</a>\n      <a href="../../">✚ 수학 문제지 만들기</a>\n      <a href="../../roadmap/">🗺 1~6학년 연산 로드맵</a>\n      <a href="../../../today/">📅 오늘의 학습지</a>\n    </div>\n';
  const faq=[
    ["단원 순서가 우리 아이 교과서와 달라요.", "2022 개정 교육과정 교과서는 출판사가 여럿이라 단원 번호와 묶음이 조금씩 다릅니다. 이 페이지는 단원 이름을 기준으로 찾을 수 있게 했고, 시기는 보통의 진도 기준이라 학교에 따라 2주 안팎 차이가 날 수 있어요."],
    ["학습지는 단원과 어떻게 맞춘 건가요?", "버튼을 누르면 수학 문제지 생성기가 그 단원 범위(예: 받아올림 없는 두 자리 덧셈)로 설정된 채 열립니다. 문제는 누를 때마다 새로 만들어지고 정답지가 함께 인쇄돼요."],
    ["도구가 없는 단원은 어떻게 하나요?", "도형·길이·분류처럼 종이 문제지보다 직접 해 보는 게 나은 단원은 '집에서 이렇게' 활동만 적었습니다. 그 단원은 학습지 대신 그 활동을 하루 10분 해 보세요."]
  ];
  b+='\n    <h2>자주 묻는 질문</h2>\n    <dl class="faq">\n'+faq.map(f=>'      <dt>'+esc(f[0])+'</dt>\n      <dd>'+esc(f[1])+'</dd>').join("\n")+'\n    </dl>\n';
  return finish(shell(3),{ title, desc, ogTitle:S.name+" 수학 단원별 학습지", ogDesc:names.join("·")+" — 단원마다 배우는 내용·시기·맞춤 학습지. 무료.", url:"https://geulssibang.com/math/unit/"+key+"/",
    logo:S.name+" 단원", h1:S.name+" 수학 단원별 학습지 — 배우는 내용·시기·맞춤 문제지", body:b, faq, unitsSrc:"../../units.js", script:unitNowScript(S.grade) });
}
function hubPage(){
  let b="";
  b+='    <p class="hint">글씨방 · '+PUB_KO+' 게시 · 2022 개정 교육과정 교과서 기준</p>\n';
  b+='    <p>"지금 학교에서 뭘 배우고 있지?"에 바로 답하는 페이지예요. 학년을 누르면 <strong>오늘 날짜 기준으로 지금쯤 배우는 단원</strong>과 그 단원에 맞춘 학습지가 나옵니다. 학기별 페이지에는 단원마다 배우는 내용·시기·집에서 막히는 곳을 정리해 두었어요.</p>\n';
  b+='    <div class="unow" id="unitNow"></div>\n';
  b+='    <h2>학기별 단원 학습지</h2>\n    <div class="semgrid">\n';
  M.SEMESTERS.forEach(k=>{ const S=M.MATH_UNITS[k]; b+='      <a class="semcard" href="'+k+'/"><b>'+S.name+'</b><span>'+S.units.map(u=>u.name).join(" · ")+'</span></a>\n'; });
  b+='      <div class="semcard soon"><b>3학년 1·2학기</b><span>준비 중 — 곱셈·나눗셈·분수 단원은 <a href="../mul-div/">곱셈·나눗셈</a>, <a href="../fraction/">분수·소수</a> 페이지에서 바로 만들 수 있어요</span></div>\n';
  b+='    </div>\n';
  b+='    <h2>1·2학년 수학, 학기마다 무엇이 달라지나</h2>\n';
  b+='    <p><strong>1학년 1학기</strong>는 수와 친해지는 학기예요. 9까지의 수를 세고 쓰는 데서 시작해 모으기·가르기, 합이 9를 넘지 않는 덧셈과 뺄셈을 거쳐 50까지의 수로 끝납니다. 이 학기의 핵심은 계산 속도가 아니라 <strong>10을 한 묶음으로 보는 눈</strong>이에요. 그 눈이 2학기 받아올림의 바탕이 됩니다.</p>\n';
  b+='    <p><strong>1학년 2학기</strong>는 덧셈과 뺄셈 단원이 세 번 나오는 학기예요. 받아올림 없는 두 자리 수 계산, 10이 되는 더하기와 10에서 빼기, 그리고 받아올림·받아내림이 있는 한 자리 수 계산 순서로 올라갑니다. 중간의 <strong>10 만들기(3+7, 6+4)</strong>를 충분히 익혀 두면 마지막 단원이 수월해요. 몇 시·몇 시 30분 시계 읽기와 규칙 찾기도 이때 배웁니다.</p>\n';
  b+='    <p><strong>2학년 1학기</strong>는 세 자리 수와 받아올림·받아내림이 있는 두 자리 수 세로셈이 중심이에요. 삼각형·사각형·원 같은 도형 이름, 1cm 자로 재기, 분류하기가 함께 나오고, 학기 끝에 <strong>곱셈의 뜻</strong>(3씩 4묶음)을 처음 만납니다. 구구단을 외우는 건 아직이고 뜻을 이해하는 단원이에요.</p>\n';
  b+='    <p><strong>2학년 2학기</strong>는 <strong>곱셈구구</strong>의 학기예요. 2단부터 9단까지 외우는 일이 이 학기의 가장 큰 숙제이고, 이후 3학년 곱셈·나눗셈이 모두 여기에 기대요. 네 자리 수, 1m 길이, 1분 단위 시각과 시간 계산, 표와 그래프, 규칙 찾기가 뒤따릅니다. 구구단은 <a href="../../gugudan/">구구단 외우기 시험</a>으로 매일 조금씩 확인하면 좋아요.</p>\n';
  b+='    <h2>어떻게 쓰면 좋을까</h2>\n    <p>학교 진도와 같은 단원을 집에서 한 장씩 풀면 복습이 되고, 한 단원 앞을 풀면 예습이 돼요. 저학년은 <strong>복습 쪽</strong>을 권합니다 — 학교에서 배운 걸 그날 저녁에 한 장 풀면 "아, 이거 오늘 배웠어"가 되고, 그 느낌이 수학을 좋아하게 만드는 가장 쉬운 길이에요. 단원이 바뀌는 시기는 학교마다 2주 안팎 다르니 아이 교과서의 단원 이름을 확인해 주세요.</p>\n';
  b+='    <h2>학습지 한 장을 쓰는 순서</h2>\n';
  b+='    <ol>\n      <li><strong>단원 확인</strong> — 위의 "지금쯤 배우는 단원"이나 아이 교과서에서 단원 이름을 확인해요.</li>\n      <li><strong>한 장 인쇄</strong> — 학기 페이지에서 그 단원의 버튼을 누르면 범위가 맞춰진 문제지가 열려요. 정답지는 뒷면이나 따로 인쇄합니다.</li>\n      <li><strong>10분 풀기</strong> — 저학년은 한 번에 10분, 하루 한 장이면 충분해요. 다 못 풀어도 시간이 되면 멈춥니다.</li>\n      <li><strong>틀린 문제 한 개만 다시</strong> — 전부 다시 풀게 하기보다 틀린 것 중 하나를 골라 함께 풀어요. 같은 유형이 다음 날 또 틀리면 그때 단원 설명의 "집에서 자주 막히는 곳"을 봐 주세요.</li>\n    </ol>\n';
  b+='    <h2>함께 보면 좋은 페이지</h2>\n    <div class="guides">\n      <a href="../">✚ 수학 문제지 만들기</a>\n      <a href="../roadmap/">🗺 1~6학년 연산 로드맵</a>\n      <a href="../sense/">📖 수 감각 키우기</a>\n      <a href="../../today/">📅 오늘의 학습지</a>\n    </div>\n';
  const faq=[["예습용으로 써도 되나요?","돼요. 한 단원 앞의 학습지를 풀면 예습이 됩니다. 다만 저학년은 새 내용을 종이로 먼저 만나면 어렵게 느끼기 쉬우니, 예습은 가볍게 몇 문제만 하고 학교에서 배운 뒤 복습으로 한 장을 푸는 쪽을 권해요."],["하루에 몇 장이 적당한가요?","1·2학년은 하루 한 장, 10분 안팎이 적당합니다. 양을 늘리기보다 매일 같은 시간에 하는 쪽이 오래 가요."],["3학년 이상은 없나요?","1·2학년 네 학기부터 시작했고 3학년은 준비 중이에요. 그 전까지 3학년 곱셈·나눗셈·분수는 수학 문제지 생성기의 3~4학년 탭에서 바로 만들 수 있습니다."],["지금 배우는 단원은 어떻게 아나요?","보통의 학교 진도를 날짜표로 만들어 두고 오늘 날짜로 골라 보여 드려요. 학교마다 2주 안팎 차이가 있으니 교과서 단원 이름과 맞춰 보세요."]];
  b+='\n    <h2>자주 묻는 질문</h2>\n    <dl class="faq">\n'+faq.map(f=>'      <dt>'+esc(f[0])+'</dt>\n      <dd>'+esc(f[1])+'</dd>').join("\n")+'\n    </dl>\n';
  return finish(shell(2),{ title:"초등 수학 학기별 단원 학습지 — 지금 배우는 단원에 맞춘 무료 문제지 (1·2학년)", desc:"1학년·2학년 수학을 학기별 단원으로 정리했어요. 오늘 날짜로 지금쯤 배우는 단원을 보여 주고, 단원마다 배우는 내용·시기·집에서 막히는 곳과 그 범위에 맞춘 무료 학습지를 연결합니다. 2022 개정 교육과정 기준, 회원가입 없음.",
    ogTitle:"초등 수학 학기별 단원 학습지 (1·2학년)", ogDesc:"지금 배우는 단원에 맞춘 무료 문제지. 단원별 내용·시기·막히는 곳 정리.", url:"https://geulssibang.com/math/unit/",
    logo:"단원 학습지", h1:"초등 수학 학기별 단원 학습지 — 지금 배우는 단원에 맞춘 문제지", body:b, faq, unitsSrc:"../units.js", script:unitNowScript(null) });
}
function build(){ const out={"math/unit/index.html":hubPage()}; M.SEMESTERS.forEach(k=>{ out["math/unit/"+k+"/index.html"]=semesterPage(k); }); return out; }
module.exports={ build };
if(require.main===module){
  const out=build();
  for(const [p,h] of Object.entries(out)){ fs.mkdirSync(path.dirname(path.join(U.root,p)),{recursive:true}); fs.writeFileSync(path.join(U.root,p),h); console.log("생성:",p,h.length+"자"); }
}
