/* 학기별 수학 단원 학습지(/math/unit/) — 데이터 무결성·현재 단원 계산·딥링크 포맷·생성 결과 일치·연결
   실행: node tests/test-units.js   (math/units.js를 고쳤으면 먼저 node tools/gen-math-units.js) */
"use strict";
const fs=require("fs"), path=require("path");
const U=require("./_util");
const ok=U.makeOk("test-units");
global.b64e=s=>Buffer.from(s,"utf8").toString("base64");
const M=require("../math/units.js");
const G=require("../tools/gen-math-units.js");
const dec=h=>JSON.parse(Buffer.from(decodeURIComponent(h.split("#s=")[1]),"base64").toString("utf8"));

/* 1) 데이터 — 학기 4개, 단원 5~6개, 시작일 오름차순, 필수 글, 도구 또는 집 활동 */
ok(JSON.stringify(M.SEMESTERS)==='["1-1","1-2","2-1","2-2"]',"학기 4개 (1·2학년)");
let units=0;
M.SEMESTERS.forEach(k=>{
  const S=M.MATH_UNITS[k]; ok(S&&S.units.length>=5&&S.units.length<=6,k+" 단원 5~6개");
  let prev="00-00";
  S.units.forEach((u,i)=>{
    units++;
    ok(u.no===i+1&&/^\d\d-\d\d$/.test(u.start)&&u.start>prev,k+" "+u.name+" 번호·시작일 순서"); prev=u.start;
    ok(u.learn.length>=40&&u.pit.length>=20,k+" "+u.name+" 설명·막히는 곳 길이");
    ok((u.tools&&u.tools.length)||(u.home&&u.home.length>=2),k+" "+u.name+" 도구 또는 집 활동");
    (u.tools||[]).forEach(t=>{
      const href=M.unitToolHref(t,"");
      if(t.kind==="href") ok(fs.existsSync(path.join(U.root,t.href.replace(/^\//,""),"index.html")),"링크 대상 존재: "+t.href);
      if(t.kind==="math"){ const a=dec(href); ok(a.length===10&&a[0]===2&&typeof a[1]==="string"&&[0,1].includes(a[3]),"수학 v2 딥링크 10칸: "+t.label); ok(U.read("math/generators.js").includes('id:"'+t.topic+'"'),"수학 토픽 존재: "+t.topic); }
      if(t.kind==="suja"){ const a=dec(href); ok(a.length===8&&a[0]===1&&["c10","c20","skip"].includes(a[1]),"숫자 미로 v1 딥링크 8칸: "+t.label); }
      if(t.kind==="gugu"){ const a=dec(href); ok(a.length===7&&a[0]===1&&/^[2-9]+$/.test(a[1]),"구구단 시험 v1 딥링크 7칸: "+t.label); }
    });
  });
});
ok(units===23,"총 23단원 ("+units+")");
/* 주인 페이지 포맷이 바뀌면 여기도 바꿔야 함 */
ok(/JSON\.stringify\(\[2,state\.topic,state\.level,state\.noCarry\?1:0,state\.dan,state\.form,state\.pages,state\.answers\?1:0,state\.title,state\.seed/.test(U.read("math/index.html")),"math encodeState v2 앞 10칸 그대로");
ok(/JSON\.stringify\(\[1, state\.kind, state\.dan, state\.level, state\.pages, state\.answers\?1:0, state\.title, state\.seed\]\)/.test(U.read("maze/suja/index.html")),"maze/suja encodeState v1 8칸 그대로");

/* 2) 현재 단원 — 학기·방학 판정 */
const d=(y,m,dd)=>new Date(y,m-1,dd);
ok(M.currentUnit(1,d(2026,3,5)).unit.name==="9까지의 수","3/5 1학년 → 9까지의 수");
ok(M.currentUnit(1,d(2026,10,4)).unit.name==="덧셈과 뺄셈(1)","10/4 1학년 → 덧셈과 뺄셈(1)");
ok(M.currentUnit(2,d(2026,10,4)).unit.name==="곱셈구구","10/4 2학년 → 곱셈구구");
ok(M.currentUnit(2,d(2026,6,20)).unit.name==="곱셈","6/20 2학년 → 곱셈");
const br=M.currentUnit(1,d(2026,8,10)); ok(br.state==="break"&&br.semKey==="1-1"&&br.unit.name==="50까지의 수","8월 → 방학, 1학기 마지막 단원");
ok(M.currentUnit(2,d(2027,1,15)).state==="break"&&M.currentUnit(2,d(2027,1,15)).semKey==="2-2","1월 → 방학, 2학기 마지막 단원");
ok(M.currentUnit(3,d(2026,10,4))===null,"없는 학년 → null");

/* 3) 생성 결과 = 파일 */
const out=G.build();
Object.entries(out).forEach(([p,h])=>ok(U.read(p)===h,p+" = 생성기 출력 (다르면 node tools/gen-math-units.js)"));
M.SEMESTERS.forEach(k=>{
  const h=U.read("math/unit/"+k+"/index.html"), S=M.MATH_UNITS[k];
  ok((h.match(/<div class="unit" id="u\d+">/g)||[]).length===S.units.length,k+" 단원 블록 수");
  ok(h.includes('<link rel="canonical" href="https://geulssibang.com/math/unit/'+k+'/">')&&h.includes("ca-pub-1834921044404408"),k+" canonical·광고");
  ok(U.ldJson(h).length===2,k+" JSON-LD 2블록");
  ok(h.includes('<script src="../../units.js">')&&h.includes("renderUnitNow("),k+" 코너 스크립트");
  ok(h.includes('href="../../../assets/style.css"')&&h.includes('src="../../../assets/common.js"'),k+" 깊이 3 상대 경로");
});
ok(U.read("math/unit/index.html").includes('href="2-2/"')&&U.read("math/unit/index.html").includes("3학년 1·2학기"),"허브: 학기 카드·3학년 준비 중");

/* 4) 연결 — 홈·수학 도구 코너, 푸터, sitemap */
const home=U.read("index.html"), math=U.read("math/index.html");
ok(home.includes('id="unitNow"')&&home.includes('<script src="./math/units.js">')&&home.includes('renderUnitNow(document.getElementById("unitNow"),{base:"."})'),"홈 코너");
ok(math.includes('id="unitNow"')&&math.includes('<script src="./units.js">')&&math.includes('{base:".."}'),"수학 도구 코너");
ok(U.read("assets/style.css").includes(".unow{"),"공용 .unow 스타일");
const sm=U.read("sitemap.xml"); ["","1-1/","1-2/","2-1/","2-2/"].forEach(k=>ok(sm.includes("https://geulssibang.com/math/unit/"+k+"</loc>"),"sitemap /math/unit/"+k));
const w=U.siteWiring(ok,{url:"/math/unit/", footer:'href="/math/unit/">학기별 단원 학습지'});
ok.done("23단원, 페이지 5, 푸터 "+w.footerPages+"페이지, sitemap "+w.sitemapUrls+"URL");
