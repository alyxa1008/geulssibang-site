/* 상식퀴즈 문제 모음(/quiz/list/) 생성 — 문제은행(quiz/quiz-data.js)에서 분야 5 × 급수 5 × 4문제 = 100문제를
   정적 HTML로 뽑는다(검색엔진이 읽도록 본문에 직접). 머리·푸터 틀은 quiz/tips/index.html에서 가져온다.
   실행: node tools/gen-quiz-list.js   (문제은행을 고치면 다시 실행 — tests/test-quiz-list.js가 일치 여부 검사) */
"use strict";
const fs=require("fs"), path=require("path"), vm=require("vm");
const U=require("../tests/_util");
const root=U.root, read=U.read;
const PER_CELL=4;
const CATS=[
  {id:"animal",  icon:"🐘", name:"동물",      lead:"생김새·분류·습성처럼 관찰과 분류로 답이 정해지는 동물 문제예요."},
  {id:"science", icon:"🔬", name:"과학·자연", lead:"해와 달, 물과 공기, 우리 몸 — 교과서 과학의 바탕이 되는 사실 문제예요."},
  {id:"korea",   icon:"🇰🇷", name:"우리나라",  lead:"국기·한글·지리·역사 속 이름과 연도처럼 기록으로 확인되는 문제예요."},
  {id:"world",   icon:"🌍", name:"세계",      lead:"나라와 수도, 유명한 건축물과 사건 — 지도와 연표에서 답을 찾을 수 있는 문제예요."},
  {id:"life",    icon:"🚦", name:"생활·안전", lead:"긴급 전화번호, 교통 규칙, 시간과 단위 — 생활에서 바로 쓰는 약속과 숫자 문제예요."}
];
const LEVELS=["","1급수 · 7세~1학년","2급수 · 2학년","3급수 · 3~4학년","4급수 · 5~6학년","5급수 · 부모님 도전 🔥"];
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function loadData(){ const c={}; vm.createContext(c); vm.runInContext(read("quiz/quiz-data.js"),c); return c.QUIZ_DATA; }
/* 수록 문항: (분야, 급수) 칸마다 문제은행 순서대로 앞 4개 */
function pickItems(data){
  const out=[];
  CATS.forEach(cat=>{ for(let l=1;l<=5;l++){ out.push(...data.filter(q=>q.c===cat.id&&q.l===l).slice(0,PER_CELL)); } });
  return out;
}
/* 퀴즈 도구 딥링크 — quiz/index.html encodeState v1 [1, 분야, 급수, 방식, 답할 시간, 읽어주기] */
function quizHash(catId, level){ return encodeURIComponent(Buffer.from(JSON.stringify([1,catId,level,"choice",10,1])).toString("base64")); }

function build(){
  const data=loadData(), items=pickItems(data), total=items.length;
  const TITLE="상식퀴즈 문제 모음 100 — 초등·어린이 상식 퀴즈와 정답 (분야별·급수별)";
  const DESC="초등·어린이 상식퀴즈 "+total+"문제를 정답·한 줄 해설과 함께 모았어요. 동물·과학·우리나라·세계·생활안전 5개 분야, 7세부터 부모님 도전까지 급수별 정리. 정답 가리기·인쇄 가능, 화면에서 바로 푸는 무료 퀴즈로 연결. 회원가입 없음.";
  const FAQ=[
    ["모두 몇 문제인가요?", "이 페이지에는 "+total+"문제가 실려 있어요(분야 5개 × 급수 5단계 × "+PER_CELL+"문제). 화면에서 푸는 상식퀴즈 도구에는 같은 기준으로 만든 "+data.length+"문제가 들어 있어, 풀 때마다 다른 문제가 나옵니다."],
    ["정답은 믿을 수 있나요?", "답이 사실 하나로 정해지는 문제만 실었어요 — 정의, 숫자, 이름, 연도, 분류처럼 사전·교과서·공식 기록으로 확인되는 것만요. '가장 좋은', '주로' 같은 의견이나 경향을 묻는 문제는 넣지 않았습니다."],
    ["인쇄해서 쓸 수 있나요?", "네. '문제 모음 인쇄'를 누르면 문제와 정답이 함께 인쇄돼요. 문제지로 쓰려면 먼저 '정답 가리기'를 누른 뒤 인쇄하세요. 가정·교실에서 자유롭게 쓸 수 있고 무료입니다."],
    ["몇 살부터 풀 수 있나요?", "1급수는 7세부터 풀 수 있고, 급수가 오를수록 어려워져 5급수는 어른도 헷갈려요. 아이가 아직 글을 다 못 읽으면 부모님이 읽어 주면 됩니다."]
  ];
  let h=read("quiz/tips/index.html");
  const rep=(re,to)=>{ if(!re.test(h)) throw new Error("template marker missing: "+re); h=h.replace(re,()=>to); };
  rep(/<title>[\s\S]*?<\/title>/, "<title>"+esc(TITLE)+" | 글씨방</title>");
  rep(/<meta name="description" content="[^"]*">/, '<meta name="description" content="'+esc(DESC)+'">');
  rep(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="상식퀴즈 문제 모음 100 — 어린이 상식 퀴즈와 정답 | 글씨방">');
  rep(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="분야 5개·급수 5단계 상식퀴즈 '+total+'문제와 정답·해설. 정답 가리기·인쇄, 무료.">');
  rep(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://geulssibang.com/quiz/list/">');
  rep(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://geulssibang.com/quiz/list/">');
  h=h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/g,"");
  const ld=[
    {"@context":"https://schema.org","@type":"Article","headline":TITLE,"author":{"@type":"Organization","name":"글씨방"},"publisher":{"@type":"Organization","name":"글씨방"},"datePublished":"2026-10-02","mainEntityOfPage":"https://geulssibang.com/quiz/list/","inLanguage":"ko"},
    {"@context":"https://schema.org","@type":"FAQPage","mainEntity":FAQ.map(f=>({"@type":"Question","name":f[0],"acceptedAnswer":{"@type":"Answer","text":f[1]}}))}
  ];
  const style=`<style>
/* 문제 모음 — 이 페이지 전용 */
.ql{padding-left:1.6em; margin:6px 0 14px}
.ql li{margin:9px 0; line-height:1.6}
.ql .qa{display:block; font-size:.93em; opacity:.86}
.ql .qa b{color:#ffd9a8}
.content.hideans .qa{visibility:hidden}
.content h3{font-size:16px; margin:18px 0 2px}
.lbtns{display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 4px}
.ptitle{display:none}
@media print{
  body.plist .topnav, body.plist header, body.plist footer, body.plist .noprint, body.plist .guides{display:none !important}
  body.plist .content, body.plist .content *{color:#000 !important; opacity:1 !important}
  body.plist .content{font-size:11pt; padding:12mm 14mm}
  body.plist .ptitle{display:block; font-family:var(--disp); font-size:16pt; margin:0 0 4mm}
  body.plist .ql li{break-inside:avoid; margin:5px 0}
  body.plist h2{break-after:avoid; margin-top:8mm}
}
</style>
`;
  rep(/<\/head>/, style+ld.map(o=>'<script type="application/ld+json">'+JSON.stringify(o)+'</script>').join("\n")+"\n</head>");
  rep(/<div class="logo">[\s\S]*?<\/div>/, '<div class="logo">상식퀴즈 모음 <span class="pen">📚</span></div>');
  rep(/<h1 class="tagline">[\s\S]*?<\/h1>/, '<h1 class="tagline">상식퀴즈 문제 모음 100 — 초등·어린이 상식 퀴즈와 정답</h1>');

  /* ---- 본문 ---- */
  let c='  <div class="content">\n';
  c+='    <p class="ptitle">상식퀴즈 문제 모음 '+total+' — 글씨방 geulssibang.com/quiz/list/</p>\n';
  c+='    <p class="hint">글씨방 · 2026년 10월 2일 게시 · 문제은행 '+data.length+'개 중 '+total+'개 수록</p>\n\n';
  c+='    <p>아이가 "문제 내줘!" 할 때 바로 꺼내 쓰는 <strong>상식퀴즈 '+total+'문제 모음</strong>이에요. 동물·과학·우리나라·세계·생활안전 다섯 분야를 <strong>1급수(7세)부터 5급수(부모님 도전)</strong>까지 급수별로 묶었고, 문제마다 <strong>정답과 한 줄 해설</strong>을 붙였습니다. 차 안, 식탁, 잠자리에서 하나씩 읽어 주기 좋고, 정답을 가리면 혼자 푸는 문제지가 돼요.</p>\n';
  c+='    <p class="lbtns noprint"><a class="gobtn" id="btnHide" href="#" role="button">🙈 정답 가리기</a> <a class="gobtn" id="btnListPrint" href="#" role="button">🖨 문제 모음 인쇄</a> <a class="gobtn" href="../">🔥 화면에서 퀴즈로 풀기</a></p>\n\n';
  c+='    <h2 class="noprint">분야 바로가기</h2>\n    <div class="guides">\n'+CATS.map(k=>'      <a href="#'+k.id+'">'+k.icon+' '+k.name+' '+(5*PER_CELL)+'문제</a>').join("\n")+'\n    </div>\n\n';
  CATS.forEach(cat=>{
    c+='    <h2 id="'+cat.id+'">'+cat.icon+' '+cat.name+' 상식퀴즈 '+(5*PER_CELL)+'문제</h2>\n';
    c+='    <p>'+cat.lead+'</p>\n';
    let no=1;
    for(let l=1;l<=5;l++){
      const qs=items.filter(q=>q.c===cat.id&&q.l===l);
      c+='    <h3>'+LEVELS[l]+'</h3>\n    <ol class="ql" start="'+no+'">\n';
      qs.forEach(q=>{ c+='      <li>'+esc(q.m)+' '+esc(q.q)+' <span class="qa"><b>'+esc(q.o[0])+'</b> — '+esc(q.e)+'</span></li>\n'; no++; });
      c+='    </ol>\n';
    }
    c+='    <p class="noprint"><a class="gobtn" href="../#s='+quizHash(cat.id,2)+'">🔥 '+cat.name+' 문제로 퀴즈 풀기 (보기 4개 중 고르기)</a></p>\n\n';
  });
  c+='    <h2>이렇게 내 주면 더 재미있어요</h2>\n';
  c+='    <p><strong>① 맞히면 다음 급수로.</strong> 1급수에서 시작해 네 문제를 다 맞히면 2급수로 올라가는 규칙만 정해도 게임이 됩니다. <strong>② 틀린 문제는 해설을 소리 내어 읽기.</strong> "문어의 피는 파란색"처럼 의외의 사실일수록 한 번 소리 내어 읽으면 오래 남아요. <strong>③ 아이가 출제자 되기.</strong> 이 목록에서 아이가 문제를 골라 부모님께 내게 해 보세요 — 문제를 고르려고 읽는 동안 이미 스무 문제를 공부한 셈이 됩니다. 더 많은 문제를 매번 새로 풀고 싶다면 <a href="../">상식퀴즈 도구</a>가 '+data.length+'문제 중에서 골라 내 주고, 다 풀면 상장도 인쇄할 수 있어요.</p>\n\n';
  c+='    <h2>함께 보면 좋은 페이지</h2>\n    <div class="guides">\n      <a href="../">💡 상식퀴즈 풀기 (객관식·주관식, 상장 인쇄)</a>\n      <a href="../tips/">📖 아이 상식 넓혀주는 법</a>\n      <a href="../../gugudan/">✖ 구구단 외우기 시험</a>\n      <a href="../../today/">📅 오늘의 학습지 (상식 한 문제 포함)</a>\n    </div>\n\n';
  c+='    <h2>자주 묻는 질문</h2>\n    <dl class="faq">\n'+FAQ.map(f=>'      <dt>'+esc(f[0])+'</dt>\n      <dd>'+esc(f[1])+'</dd>').join("\n")+'\n    </dl>\n  </div>\n\n';
  const a=h.indexOf('  <div class="content">'), b=h.indexOf('  <footer');
  if(a<0||b<0||b<a) throw new Error("content/footer marker missing");
  h=h.slice(0,a)+c+h.slice(b);
  /* ---- 스크립트: 정답 가리기 + 인쇄 ---- */
  const script=`<script>
"use strict";
document.getElementById("btnHide").addEventListener("click",function(e){
  e.preventDefault();
  var off=document.querySelector(".content").classList.toggle("hideans");
  e.currentTarget.textContent = off ? "👀 정답 보기" : "🙈 정답 가리기";
  track("quiz_list_hide",{on:off?1:0});
});
document.getElementById("btnListPrint").addEventListener("click",function(e){ e.preventDefault(); printWith("plist",{tool:"quiz-list"}); });
</script>
`;
  rep(/<script src="\.\.\/\.\.\/assets\/common\.js"><\/script>\n/, '<script src="../../assets/common.js"></script>\n'+script);
  return h;
}

module.exports={ build, pickItems, loadData, CATS, PER_CELL, quizHash };
if(require.main===module){
  const out=build();
  fs.mkdirSync(path.join(root,"quiz/list"),{recursive:true});
  fs.writeFileSync(path.join(root,"quiz/list/index.html"),out);
  console.log("quiz/list/index.html 생성 — "+(out.match(/<li>/g)||[]).length+"문제, "+out.length+"자");
}
