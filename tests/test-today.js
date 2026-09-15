/* 오늘의 학습지(/today/) — 순수 모듈(today-gen.js) 검증 + 배선·데이터 원본 대조·연결
   실행: node tests/test-today.js */
"use strict";
const vm=require("vm");
const U=require("./_util");
const ok=U.makeOk("test-today");
const html=U.read("today/index.html");

/* 1) 페이지 배선 */
["btnPrint","btnShare","btnToday","levelSeg","sheets","todayHint","date","name","pageLabel"].forEach(id=>ok(html.includes('id="'+id+'"'),"id 누락: "+id));
ok(/track\("print_sheet",\{tool:"today"/.test(html),"print_sheet tool:today 배선");
ok(html.includes("copyShareLink(encodeState())"),"공유 링크 배선");
ok((html.match(/data-level="/g)||[]).length===4,"학년 버튼 4개");
["../math/generators.js","../maze/maze-gen.js","../quiz/quiz-data.js","../quiz/quiz-gen.js","today-data.js","today-gen.js"].forEach(s=>ok(html.includes('<script src="'+s+'">'),"스크립트 로드: "+s));
ok(html.includes("build(state)")&&!/^function build\(/m.test(html),"페이지는 today-gen의 build(state)만 호출");
ok(html.includes('<link rel="canonical" href="https://geulssibang.com/today/">'),"canonical");
ok(html.includes("ca-pub-1834921044404408"),"광고 스크립트");
ok(U.ldJson(html).length===2,"JSON-LD 2블록 파싱");

/* 2) 순수 모듈 실행 — 실제 생성기들과 함께 로드 */
const ctx={ escHtml:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") };
vm.createContext(ctx);
["math/generators.js","maze/maze-gen.js","quiz/quiz-data.js","quiz/quiz-gen.js","today/today-data.js","today/today-gen.js"].forEach(f=>vm.runInContext(U.read(f),ctx));
const { build, rowPattern, traceRow, semester, wordPool, mathProblems, mulberry32, TODAY_WORDS, TODAY_NATMAL }=ctx;

ok(JSON.stringify(rowPattern(1))==='["solid","trace","trace","empty"]'&&rowPattern(2).length===4&&rowPattern(3).length===3&&rowPattern(4).length===2&&rowPattern(5).length===2,"줄 패턴: 1·2자 4묶음, 3자 3묶음(빈칸 포함), 4·5자 2묶음");
ok((traceRow("발바닥",true).match(/class="cell (solid|trace|empty)/g)||[]).length===9&&traceRow("발바닥",true).includes("cell empty"),"3자 줄: 9칸 + 빈칸 묶음");
ok(semester(3)===1&&semester(8)===1&&semester(9)===2&&semester(2)===2,"학기: 3~8월 1학기, 9~2월 2학기");
ok(wordPool("g1",4).length===50&&wordPool("g1",10).length===100,"1학년 풀: 1학기 50 · 2학기 100(복습 포함)");
ok(wordPool("g3",5).length===50&&wordPool("kids",5).length===20,"3학년 50 · 유아 20");
["g1","g2","g3"].forEach(lv=>[4,10].forEach(m=>ok(mathProblems(mulberry32(1),lv,m).length===8,lv+" "+m+"월 수학 8문제")));
ok(mathProblems(mulberry32(1),"g1",4).every(p=>p.q[1].v!=="×"),"1학년 1학기엔 곱셈 없음");
ok(mathProblems(mulberry32(1),"g2",10).some(p=>p.q[1].v==="×"),"2학년 2학기엔 구구단 포함");

/* 3) build(state) — 결정성·학년별 구성·정답 줄·이스케이프 */
const S=(level,date,name)=>({level,date,name:name||""});
["kids","g1","g2","g3"].forEach(lv=>{
  const h1=build(S(lv,"2026-09-15")), h2=build(S(lv,"2026-09-15")), h3=build(S(lv,"2026-09-16"));
  ok(h1===h2&&h1!==h3,lv+": 같은 날짜 = 같은 학습지, 다른 날짜 = 다름");
  ok(h1.includes("9월 15일 화요일")&&h1.includes('class="tkey"')&&h1.includes("정답 —"),lv+": 날짜·정답 줄");
  ok((h1.match(/<svg/g)||[]).length===1,lv+": 미로 1개");
  if(lv==="kids"){ ok(h1.includes("수 세기")&&h1.includes("숫자 따라쓰기")&&!h1.includes("받아쓰기"),"유아: 수 세기·숫자 따라쓰기, 받아쓰기 없음"); }
  else { ok((h1.match(/<li><b>\d<\/b>/g)||[]).length===8&&(h1.match(/<li>\d\.<\/li>/g)||[]).length===5,lv+": 수학 8문제·받아쓰기 5줄"); }
});
ok(build(S("g1","2026-09-15","<b>")).includes("&lt;b&gt;")&&!build(S("g1","2026-09-15","<b>")).includes("<b>&"),"이름 이스케이프");
ok(!/[^가-힣a-zA-Z0-9 ]하나만 골라/.test(build(S("g1","2026-09-15")))&&build(S("g1","2026-09-15")).includes("맞는 답에 ○ 하세요"),"안내 문구 정중체");

/* 4) today-data.js = 급수표·낱말 페이지 원본과 일치 (다르면 node tools/gen-today-data.js) */
for(const k of ["1-1","1-2","2-1","2-2","3"]){
  const sets=U.gsetWords(U.read("badaseugi/geupsu/"+k+"/index.html"));
  ok(JSON.stringify(sets)===JSON.stringify(TODAY_WORDS[k]),"today-data "+k+" = 급수표 원본");
}
const nat=[...U.read("hangul/natmal/index.html").matchAll(/data-text="([^"]+)"/g)].map(x=>x[1].split(/\s+/));
ok(JSON.stringify(nat)===JSON.stringify(TODAY_NATMAL),"today-data natmal = 원본");

/* 5) 사이트 연결 */
const w=U.siteWiring(ok,{url:"/today/", tools:'"/today/":1', home:'href="./today/"', footer:'href="/today/">오늘의 학습지'});
ok.done("푸터 "+w.footerPages+"페이지, sitemap "+w.sitemapUrls+"URL");
